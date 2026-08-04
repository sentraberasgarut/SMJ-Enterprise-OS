# SJS Operational Data Hub PoC

Local-only proof of concept for Phase 1 import behavior.

It does not connect to Loka, Google Drive, Google Sheets, Apps Script, or any production database.

## Run

```bash
npm test
npm start
```

## What It Proves

- A source file gets a SHA-256 checksum.
- The first import publishes canonical data.
- A repeated import with the same checksum is skipped.
- Validation issues are written instead of silently ignored.
- Unknown products become product-alias issues, not guessed mappings.

## Outputs

Generated files are written to `output/`:

- `canonical.json`
- `import-jobs.json`
- `validation-issues.json`

The output folder is ignored by git except for `.gitkeep`.
