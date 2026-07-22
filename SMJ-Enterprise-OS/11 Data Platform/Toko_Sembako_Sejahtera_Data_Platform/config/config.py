"""
config.py

Central path configuration for the SBGA Data Platform. Every script should
import PATHS from here instead of hardcoding paths, so the project can be
moved/renamed without touching pipeline code.

All paths are resolved relative to the project root (the parent of this
config/ directory), regardless of the current working directory the
scripts are run from.
"""
from __future__ import annotations
from pathlib import Path
from dataclasses import dataclass


PROJECT_ROOT = Path(__file__).resolve().parent.parent


@dataclass(frozen=True)
class Paths:
    root: Path = PROJECT_ROOT
    raw: Path = PROJECT_ROOT / "raw"
    processed: Path = PROJECT_ROOT / "processed"
    exports: Path = PROJECT_ROOT / "exports"
    docs: Path = PROJECT_ROOT / "docs"
    logs: Path = PROJECT_ROOT / "logs"
    database_dir: Path = PROJECT_ROOT / "database"
    sqlite_db: Path = PROJECT_ROOT / "database" / "sbga.db"
    schema_sql: Path = PROJECT_ROOT / "database" / "schema.sql"
    reports: Path = PROJECT_ROOT / "reports"
    scripts: Path = PROJECT_ROOT / "scripts"
    analytics_sql: Path = PROJECT_ROOT / "scripts" / "analytics"
    models: Path = PROJECT_ROOT / "models"

    # Source file for this project's current run. If a new export replaces
    # this file, only this line needs to change.
    raw_export_file: Path = PROJECT_ROOT / "raw" / "loka_export.json"


PATHS = Paths()


def ensure_dirs() -> None:
    """Create all standard directories if they don't already exist."""
    for p in [PATHS.raw, PATHS.processed, PATHS.exports, PATHS.docs,
              PATHS.logs, PATHS.database_dir, PATHS.reports,
              PATHS.analytics_sql, PATHS.models]:
        p.mkdir(parents=True, exist_ok=True)


if __name__ == "__main__":
    ensure_dirs()
    print(f"Project root: {PATHS.root}")
    print(f"Raw export:   {PATHS.raw_export_file} (exists: {PATHS.raw_export_file.exists()})")
    print(f"SQLite DB:    {PATHS.sqlite_db} (exists: {PATHS.sqlite_db.exists()})")
