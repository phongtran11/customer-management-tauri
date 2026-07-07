# Customer Management Desktop App

A production-ready cross-platform desktop application for managing customer records and attachments — built with **Tauri v2**, **React 18**, **TypeScript**, and **SQLite**.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Core** | [Tauri v2](https://tauri.app) (Rust) |
| **Frontend** | React 18, Vite, TypeScript |
| **Styling** | Tailwind CSS v4, shadcn/ui, Lucide Icons |
| **State / Data** | TanStack Query (React Query v5) |
| **Forms** | React Hook Form + Zod |
| **Database** | SQLite via `@tauri-apps/plugin-sql` |
| **File System** | `@tauri-apps/plugin-fs` + `@tauri-apps/plugin-dialog` |

---

## Features

- 📋 **Customer List** — Scrollable list with real-time search by name or phone number
- ➕ **Create Customer** — Slide-out form with inline validation (name ≥ 2 chars, phone regex)
- ✏️ **Edit Customer** — Inline toggle for name and phone, saves with Zod validation
- 🗑️ **Delete Customer** — Confirmation dialog, cascades to attachments
- 🖼️ **Attachment Management** — Native OS file picker, images copied to `appDataDir`, path-only storage in DB
- 🔔 **Toast Notifications** — Sonner toasts for all success/error states
- 🔒 **Scoped Security** — File system access locked to `$APPDATA/**` only

---

## Prerequisites

### macOS

```bash
# 1. Install Xcode Command Line Tools
xcode-select --install

# 2. Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# 3. Load Rust into the current shell (or open a new terminal)
source "$HOME/.cargo/env"

# 4. Add build targets
rustup target add aarch64-apple-darwin   # Apple Silicon (M1/M2/M3)
rustup target add x86_64-apple-darwin    # Intel Mac

# 5. Verify
rustc --version && cargo --version
```

### Windows

1. Install [Visual Studio Build Tools 2022](https://visualstudio.microsoft.com/visual-cpp-build-tools/)
   - Select **"Desktop development with C++"**
2. Install [WebView2 Runtime](https://developer.microsoft.com/en-us/microsoft-edge/webview2/) (bundled in Windows 11)
3. Install Rust: https://rustup.rs (choose default options)
4. Open a new terminal and verify: `rustc --version && cargo --version`

---

## Getting Started

```bash
# Install JavaScript dependencies
npm install

# Start in development mode (hot-reload frontend + native Tauri window)
npm run tauri:dev
```

> **Shell note (macOS):** If you just installed Rust in the same terminal session,
> run `source "$HOME/.cargo/env"` first, or open a new terminal.

---

## Building for Distribution

### Quick build (current platform only)

```bash
npm run tauri:build
# Output: src-tauri/target/release/bundle/
```

### Platform-specific builds (on a Mac)

```bash
# Apple Silicon (M1/M2/M3) — .app + .dmg
npm run tauri:build:macos-arm

# Intel Mac — .app + .dmg
npm run tauri:build:macos-intel

# Windows (requires cross-compilation — use CI instead)
npm run tauri:build:windows
```

> **Cross-compilation note:** Building Windows installers from macOS is not supported
> by Tauri. Use the [GitHub Actions release workflow](#automated-ci-cd-releases) instead.

### Build outputs

| Platform | Output files | Location |
|---|---|---|
| macOS ARM | `Customer Management_0.1.0_aarch64.dmg` | `bundle/dmg/` |
| macOS Intel | `Customer Management_0.1.0_x64.dmg` | `bundle/dmg/` |
| Windows | `Customer Management_0.1.0_x64-setup.exe` | `bundle/nsis/` |
| Windows | `Customer Management_0.1.0_x64_en-US.msi` | `bundle/msi/` |

---

## Automated CI/CD Releases

GitHub Actions workflows are configured to build and publish releases automatically.

### How to publish a release

```bash
# Option 1: Use the release script (recommended)
npm run release          # patch bump (0.1.0 → 0.1.1)
npm run release -- minor # minor bump (0.1.0 → 0.2.0)
npm run release -- major # major bump (0.1.0 → 1.0.0)

# Then push the commit + tag to trigger the build:
git push origin main
git push origin v0.1.1   # (or whatever version was created)
```

```bash
# Option 2: Manual tag
# 1. Update version in package.json AND src-tauri/tauri.conf.json
# 2. Commit and tag:
git add package.json src-tauri/tauri.conf.json
git commit -m "chore: release v0.1.1"
git tag -a v0.1.1 -m "Release v0.1.1"
git push origin main && git push origin v0.1.1
```

### Workflows

| File | Trigger | What it does |
|---|---|---|
| [`.github/workflows/release.yml`](.github/workflows/release.yml) | `git push v*` tag | Builds macOS (ARM + Intel) + Windows, creates GitHub Release draft |
| [`.github/workflows/ci.yml`](.github/workflows/ci.yml) | Push to `main`, PRs | TypeScript check + Vite build + `cargo check` on both platforms |

### Required GitHub Secrets (for signed builds)

Go to **Settings → Secrets and variables → Actions** and add:

#### macOS Signing (optional — skip for unsigned/dev builds)

| Secret | Description |
|---|---|
| `APPLE_CERTIFICATE` | Base64-encoded `.p12` export from Keychain |
| `APPLE_CERTIFICATE_PASSWORD` | Password for the `.p12` file |
| `APPLE_SIGNING_IDENTITY` | `Developer ID Application: Your Name (TEAMID)` |
| `APPLE_ID` | Your Apple ID email |
| `APPLE_PASSWORD` | [App-specific password](https://support.apple.com/en-us/102654) |
| `APPLE_TEAM_ID` | 10-character Team ID from developer.apple.com |

**Export your certificate:**
```bash
# Find your certificate name
security find-identity -v -p codesigning

# Export to .p12 (via Keychain Access → right-click cert → Export)
# Then base64-encode it:
base64 -i certificate.p12 | pbcopy  # copies to clipboard
```

#### Windows Signing (optional)

| Secret | Description |
|---|---|
| `WINDOWS_CERTIFICATE` | Base64-encoded `.pfx` certificate |
| `WINDOWS_CERTIFICATE_PASSWORD` | Password for the `.pfx` file |

---

## Custom App Icon

Replace the default Tauri icon with your own:

```bash
# 1. Put a 1024×1024 px PNG source icon here:
cp your-icon.png src-tauri/icons/icon.png

# 2. Generate all required sizes automatically:
npm run tauri:icon

# This generates:
#   icons/32x32.png, 128x128.png, 128x128@2x.png
#   icons/icon.icns   (macOS)
#   icons/icon.ico    (Windows)
#   icons/Square*.png (Windows Store tiles)
```

---

## Project Structure

```
customer-management/
├── .github/
│   └── workflows/
│       ├── release.yml           # Tag-triggered multi-platform build
│       └── ci.yml                # PR type check + cargo check
├── scripts/
│   └── release.mjs               # Version bump + git tag helper
├── src/                          # React frontend
│   ├── components/
│   │   ├── ui/                   # shadcn/ui primitives (15 components)
│   │   ├── AttachmentManager.tsx # Image grid + OS file picker
│   │   ├── CustomerDetail.tsx    # Inline edit + delete
│   │   ├── CustomerForm.tsx      # Create form (Zod validated)
│   │   └── CustomerList.tsx      # Scrollable list + search
│   ├── hooks/
│   │   ├── useAttachments.ts     # FS copy + DB mutations (TanStack Query)
│   │   ├── useCustomers.ts       # Customer CRUD (TanStack Query)
│   │   └── useDatabase.tsx       # DB migration context provider
│   ├── lib/
│   │   ├── db.ts                 # SQLite singleton + runMigrations()
│   │   └── utils.ts              # cn(), formatDate(), getFileName()
│   ├── pages/
│   │   ├── CustomersPage.tsx     # List view + New Customer sheet
│   │   └── CustomerDetailPage.tsx
│   ├── types/
│   │   └── index.ts              # Customer, Attachment, payload interfaces
│   ├── App.tsx                   # DatabaseProvider + Router + Toaster
│   └── main.tsx                  # QueryClientProvider entry point
│
├── src-tauri/
│   ├── capabilities/
│   │   └── default.json          # FS + SQL + Dialog permissions
│   ├── icons/                    # App icons (all sizes)
│   ├── src/lib.rs                # Tauri plugin registration
│   ├── entitlements.plist        # macOS hardened runtime entitlements
│   ├── Cargo.toml                # Rust dependencies
│   └── tauri.conf.json           # App + bundle config (macOS + Windows)
│
├── CHANGELOG.md
├── PRODUCTION_NOTES.md
├── components.json               # shadcn/ui config
├── vite.config.ts                # Tailwind plugin + @/ alias
└── tsconfig.json                 # Strict TS + @/ paths
```

---

## Database Schema

SQLite database stored at `{appDataDir}/customer_mgmt.db`.

```sql
-- Customers
CREATE TABLE IF NOT EXISTS customers (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT    NOT NULL,
  phone      TEXT    NOT NULL,
  created_at TEXT    NOT NULL DEFAULT (datetime('now', 'localtime'))
);

-- Attachments (file paths only — never BLOBs)
CREATE TABLE IF NOT EXISTS attachments (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  file_path   TEXT    NOT NULL,
  created_at  TEXT    NOT NULL DEFAULT (datetime('now', 'localtime'))
);
```

Migrations run automatically on every app launch (`runMigrations()` in [`src/lib/db.ts`](./src/lib/db.ts)).

---

## Security & Capabilities

Defined in [`src-tauri/capabilities/default.json`](./src-tauri/capabilities/default.json):

| Permission | Scope |
|---|---|
| `sql:default` + CRUD ops | SQLite only |
| `dialog:allow-open` | Read-only file picker |
| `fs:allow-read-file` | `$APPDATA/**` only |
| `fs:allow-write-file` | `$APPDATA/**` only |
| `fs:allow-copy-file` | `$APPDATA/**` only |
| `fs:allow-remove` | `$APPDATA/**` only |
| `fs:allow-mkdir` | `$APPDATA/**` only |
| `fs:allow-exists` | `$APPDATA/**` only |

> The app **cannot** read or write files outside `appDataDir`. No wildcard FS access is granted.

---

## IDE Setup

[VS Code](https://code.visualstudio.com/) with:
- [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) — Tauri commands + config support
- [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer) — Rust intellisense
- [Tailwind CSS IntelliSense](https://marketplace.visualstudio.com/items?itemName=bradlc.vscode-tailwindcss) — Class completions

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server only (no Tauri window) |
| `npm run build` | Build frontend bundle |
| `npm run typecheck` | TypeScript type check (no emit) |
| `npm run tauri:dev` | Start full app in development mode |
| `npm run tauri:build` | Build for the current platform |
| `npm run tauri:build:macos-arm` | Build for Apple Silicon |
| `npm run tauri:build:macos-intel` | Build for Intel Mac |
| `npm run tauri:build:windows` | Build for Windows x64 |
| `npm run tauri:icon` | Generate all icon sizes from `icons/icon.png` |
| `npm run release` | Bump version + create git tag (patch by default) |
| `npm run release -- minor` | Bump minor version |
| `npm run release -- major` | Bump major version |
