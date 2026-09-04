---
"@mmntm/weblate-mcp": minor
---

Add `ALLOWED_LANGUAGES` allowlist to restrict which languages can be written via the MCP. Comma-separated (e.g. `ALLOWED_LANGUAGES=de,fr,sk`, empty = allow all). Enforced on `writeTranslation`, `bulkWriteTranslations` (per-item failures), and `createTranslationUnit`; `listLanguages` is filtered. Reads are not blocked.
