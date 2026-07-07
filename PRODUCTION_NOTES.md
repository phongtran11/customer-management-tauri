# Production Notes

Operational notes and considerations for deploying, maintaining, and extending this application in a production environment.

---

## App Data Locations

The app stores all data under the OS-specific `appDataDir`:

| Platform | Path |
|---|---|
| **macOS** | `~/Library/Application Support/com.customermgmt.app/` |
| **Windows** | `%APPDATA%\com.customermgmt.app\` |

Within that directory:

```
com.customermgmt.app/
├── customer_mgmt.db          # SQLite database
└── attachments/              # Copied image files
    └── <timestamp>_<name>    # e.g. 1720355212000_photo.jpg
```

> **Backup:** Backing up the entire `appDataDir` preserves both the database and all attachment files.

---

## First-Run Shell Issue (macOS)

If you install Rust and immediately run `npm run tauri dev` in the **same shell session**, Cargo won't be on `$PATH` yet.

**Fix:** Source the Cargo environment first:

```bash
source "$HOME/.cargo/env"
npm run tauri dev
```

Or simply open a new terminal tab — `.zshenv` is updated automatically by the Rust installer.

---

## Database

### WAL Mode
The database is opened with `PRAGMA journal_mode=WAL`. WAL (Write-Ahead Logging) improves concurrent read performance and reduces lock contention — important for desktop apps where the UI thread and background query refreshes may overlap.

### Foreign Key Enforcement
`PRAGMA foreign_keys=ON` is set at migration time. This ensures `attachments.customer_id` enforces referential integrity and the `ON DELETE CASCADE` rule fires correctly when a customer is deleted.

### Adding Future Migrations
The current migration runner splits on `;` and executes each statement individually (required by `plugin-sql` which doesn't support multi-statement batches). To add a new migration:

1. Append new statements to `MIGRATION_SQL` in [`src/lib/db.ts`](./src/lib/db.ts)
2. Use `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` (SQLite 3.37+) for additive changes
3. For destructive changes, implement a versioned migration table

```ts
// Example: add a versioned migration check
const SCHEMA_VERSION = 2;

await db.execute(`CREATE TABLE IF NOT EXISTS schema_migrations (
  version INTEGER PRIMARY KEY,
  applied_at TEXT DEFAULT (datetime('now'))
)`);

const rows = await db.select<[{version: number}]>(
  'SELECT version FROM schema_migrations WHERE version = $1', [SCHEMA_VERSION]
);
if (rows.length === 0) {
  await db.execute('ALTER TABLE customers ADD COLUMN notes TEXT');
  await db.execute('INSERT INTO schema_migrations (version) VALUES ($1)', [SCHEMA_VERSION]);
}
```

---

## Security

### File System Scope
All FS operations are scoped to `$APPDATA/**` in the capabilities file. The frontend **cannot** access arbitrary paths — Tauri's security model enforces this at the IPC boundary.

### Image File Handling
- Files are **copied** from the user-selected location into `appDataDir/attachments/`
- The original source path is **never stored** — only the destination path
- Filenames are prefixed with a millisecond timestamp to prevent collisions
- The file picker is filtered to image extensions only (`png, jpg, jpeg, gif, webp, bmp`)

### Content Security Policy
`tauri.conf.json` currently sets `"csp": null` (Tauri's default restrictive CSP applies). If you add external scripts or fonts via CDN, update this:

```json
"security": {
  "csp": "default-src 'self'; img-src 'self' asset: https://asset.localhost data:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com"
}
```

---

## Performance

### TanStack Query Configuration
```ts
// In main.tsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: false,  // Desktop — no background refetch on focus
      staleTime: 1000 * 30,         // 30s cache before re-fetching
    },
    mutations: { retry: 0 },
  },
});
```

`refetchOnWindowFocus: false` is intentional for desktop apps. Unlike web apps, desktop windows don't lose/regain focus from browser tab switching, so this avoids unnecessary DB queries.

### Bundle Size
Current production bundle: ~512 kB JS (gzip: ~158 kB). If this grows, consider:

```ts
// vite.config.ts — split vendor chunks
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        react: ['react', 'react-dom', 'react-router-dom'],
        query: ['@tanstack/react-query'],
        ui: ['lucide-react', 'sonner'],
      },
    },
  },
},
```

---

## Building & Distribution

### Architecture

Builds are fully automated via GitHub Actions (see `.github/workflows/`):
- `release.yml` — fires on version tags (`v*`), produces signed installers
- `ci.yml` — fires on PRs/pushes, runs TypeScript + Rust checks

Cross-compilation is **not used**. Each platform builds natively:
- macOS runners build `.dmg` for both ARM and Intel (separate jobs)
- Windows runners build `.exe` (NSIS) and `.msi` (WiX)

### macOS Code Signing & Notarization

The `tauri.conf.json` `bundle.macOS` section is pre-configured:
```json
"macOS": {
  "minimumSystemVersion": "10.15",
  "signingIdentity": null,           ← set via APPLE_SIGNING_IDENTITY env var
  "entitlements": "entitlements.plist",
  "hardenedRuntime": true
}
```

The [`src-tauri/entitlements.plist`](./src-tauri/entitlements.plist) grants:
- JIT execution (required by WebKit JS engine)
- Library validation bypass (Tauri internals)
- Network client access
- User-selected file read access (OS file picker)

**To sign locally:**
```bash
export APPLE_SIGNING_IDENTITY="Developer ID Application: Your Name (TEAMID)"
export APPLE_ID="you@example.com"
export APPLE_PASSWORD="xxxx-xxxx-xxxx-xxxx"  # app-specific password
export APPLE_TEAM_ID="TEAMID"
npm run tauri:build:macos-arm
```

**Verify the signature:**
```bash
codesign --verify --deep --strict --verbose=2 \
  "src-tauri/target/aarch64-apple-darwin/release/bundle/macos/Customer Management.app"

# Check notarization
spctl --assess --verbose \
  "src-tauri/target/aarch64-apple-darwin/release/bundle/macos/Customer Management.app"
```

### Windows Code Signing

The `tauri.conf.json` `bundle.windows` section is pre-configured:
```json
"windows": {
  "certificateThumbprint": null,     ← set via CI secret
  "digestAlgorithm": "sha256",
  "webviewInstallMode": { "type": "downloadBootstrapper" },
  "nsis": { "installMode": "currentUser" },
  "wix": { "language": "en-US" }
}
```

`installMode: "currentUser"` means Windows users don't need admin rights to install.
`downloadBootstrapper` handles WebView2 installation automatically if not present.

### Releasing a New Version

Use the release script (recommended):
```bash
npm run release            # patch: 0.1.0 → 0.1.1
npm run release -- minor   # minor: 0.1.0 → 0.2.0
npm run release -- major   # major: 0.1.0 → 1.0.0

git push origin main && git push origin v0.1.1
```

The script updates both `package.json` and `src-tauri/tauri.conf.json` so versions stay in sync.

### Auto-Updates (future)

To add auto-update support:

1. Add the updater plugin:
```bash
cargo add tauri-plugin-updater     # in src-tauri/
npm install @tauri-apps/plugin-updater
```

2. Register in `lib.rs`:
```rust
.plugin(tauri_plugin_updater::Builder::new().build())
```

3. Configure in `tauri.conf.json`:
```json
"plugins": {
  "updater": {
    "endpoints": ["https://github.com/<org>/customer-management/releases/latest/download/latest.json"],
    "pubkey": "YOUR_PUBLIC_KEY"
  }
}
```

4. Generate signing keys:
```bash
npm run tauri signer generate -- --output ~/.tauri/customer-mgmt.key
```




---

## Known Limitations

| Area | Limitation | Workaround |
|---|---|---|
| **Multi-statement SQL** | `plugin-sql` doesn't execute batched SQL | Statements split on `;` and run individually (implemented) |
| **Image previews** | `convertFileSrc()` required for local file display in WebView | Implemented via `assetUrl` in `useAttachments` |
| **Cargo PATH** | New Rust installs need shell restart before `cargo` is found | `source "$HOME/.cargo/env"` in the same session |
| **Attachment orphans** | If the app crashes mid-delete, the DB record is removed but the file may remain | Add periodic cleanup: scan `attachments/` dir vs DB records |
| **Large images** | No resizing/compression before copy | Add `canvas` downscaling on the frontend before `copyFile` |
| **Search** | Client-side only (filters in-memory) | For >10k customers, move to `LIKE` SQL queries |

---

## Extending the App

### Adding a New Field to Customers

1. **SQL migration** — add column (see DB migration section above)
2. **Update types** — `src/types/index.ts`: add field to `Customer` interface
3. **Update queries** — `src/hooks/useCustomers.ts`: include field in `SELECT`
4. **Update form schema** — `src/components/CustomerForm.tsx`: add Zod field
5. **Update detail view** — `src/components/CustomerDetail.tsx`: add display + edit field

### Adding Dark Mode

```ts
// src/App.tsx — toggle a class on <html>
document.documentElement.classList.toggle('dark');
```

```css
/* src/index.css — add dark theme variables */
.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  /* ... */
}
```

Update `src/components/ui/sonner.tsx` to read a persisted theme preference (e.g. from `localStorage` or a Tauri store plugin).

---

## Environment & Toolchain

```
Node.js       18+
npm           9+
Rust          1.77+ (stable)
rustc target  aarch64-apple-darwin (macOS ARM)
              x86_64-apple-darwin  (macOS Intel)
              x86_64-pc-windows-msvc (Windows)
Tauri CLI     2.x
```

Check versions:
```bash
node --version
npm --version
rustc --version
cargo --version
npm run tauri -- --version
```
