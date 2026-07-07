#!/usr/bin/env node
/**
 * Release helper script
 *
 * Usage:
 *   node scripts/release.mjs [patch|minor|major]
 *   npm run release          # defaults to patch
 *   npm run release -- minor
 *   npm run release -- major
 *
 * What it does:
 *   1. Bumps the version in package.json AND src-tauri/tauri.conf.json
 *   2. Creates a git commit: "chore: release vX.Y.Z"
 *   3. Creates a git tag: vX.Y.Z
 *   4. Prints next steps (push + push --tags)
 *
 * The GitHub Actions release.yml workflow fires on the tag push.
 */

import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';

const bumpType = process.argv[2] || 'patch';

if (!['patch', 'minor', 'major'].includes(bumpType)) {
  console.error(`❌  Invalid bump type: "${bumpType}". Use patch, minor, or major.`);
  process.exit(1);
}

// ── Read current versions ──────────────────────────────────────────────────────

const pkgPath = new URL('../package.json', import.meta.url).pathname;
const tauriConfPath = new URL('../src-tauri/tauri.conf.json', import.meta.url).pathname;

const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
const tauriConf = JSON.parse(readFileSync(tauriConfPath, 'utf8'));

const [major, minor, patch] = pkg.version.split('.').map(Number);
let newVersion;

switch (bumpType) {
  case 'major': newVersion = `${major + 1}.0.0`; break;
  case 'minor': newVersion = `${major}.${minor + 1}.0`; break;
  case 'patch': newVersion = `${major}.${minor}.${patch + 1}`; break;
}

console.log(`\n📦  Bumping version: ${pkg.version} → ${newVersion} (${bumpType})\n`);

// ── Write new versions ─────────────────────────────────────────────────────────

pkg.version = newVersion;
tauriConf.version = newVersion;

writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
writeFileSync(tauriConfPath, JSON.stringify(tauriConf, null, 2) + '\n');

console.log(`  ✅  Updated package.json → ${newVersion}`);
console.log(`  ✅  Updated src-tauri/tauri.conf.json → ${newVersion}`);

// ── Git commit + tag ───────────────────────────────────────────────────────────

const tagName = `v${newVersion}`;

try {
  execSync(`git add package.json src-tauri/tauri.conf.json`, { stdio: 'inherit' });
  execSync(`git commit -m "chore: release ${tagName}"`, { stdio: 'inherit' });
  execSync(`git tag -a ${tagName} -m "Release ${tagName}"`, { stdio: 'inherit' });
  console.log(`\n  ✅  Created commit and tag: ${tagName}`);
} catch (err) {
  console.error('\n❌  Git error:', err.message);
  process.exit(1);
}

// ── Next steps ────────────────────────────────────────────────────────────────

console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 Release ${tagName} ready to publish!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

 To trigger the GitHub Actions build, run:

   git push origin main
   git push origin ${tagName}

 GitHub Actions will build:
   • macOS (Apple Silicon) → .dmg
   • macOS (Intel)         → .dmg
   • Windows (x64)         → .exe + .msi

 The release will be created as a DRAFT.
 Review it at: https://github.com/<your-repo>/releases
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
