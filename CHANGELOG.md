# Changelog

All notable changes to Customer Management are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Versioning follows [Semantic Versioning](https://semver.org/).

---

## [Unreleased]

### Added
- Initial application scaffold

---

## [0.1.0] — 2025-07-07

### Added
- Customer list view with real-time search by name or phone number
- Create customer form with Zod validation (name ≥ 2 chars, phone regex)
- Customer detail view with inline edit and delete confirmation
- Attachment management — OS native file picker, images copied to `appDataDir`
- SQLite database with WAL mode, foreign keys, and `ON DELETE CASCADE`
- Sonner toast notifications for all operations
- Tauri v2 capabilities scoped to `$APPDATA/**` only (no wildcard FS access)
- GitHub Actions release workflow for macOS (ARM + Intel) and Windows
- GitHub Actions CI workflow for PR type checking

[Unreleased]: https://github.com/your-org/customer-management/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/your-org/customer-management/releases/tag/v0.1.0
