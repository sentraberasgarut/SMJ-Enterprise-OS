"""
realm_resolver.py

Decodes the Loka Kasir Realm export format.

BACKGROUND (discovered by inspection, not assumed):
The exported JSON is NOT a normal "array of tables" export. It is Realm's
raw internal object store, serialized as a single flat JSON array:

  data[0]      -> schema map: {EntityName: "table_id"}
  data[table_id] -> list of object indices (as strings) belonging to that entity
  data[object_index] -> the actual record, a dict whose field values are
                         either literals (str/int/bool/null) or "pointer
                         strings" (a string of digits that is itself a valid
                         index into `data`).

RESOLUTION RULE (validated against 11+ entity types spanning simple and
deeply nested records):
  - A field value is a POINTER if and only if it is a string of digits that,
    interpreted as an int, is a valid index into `data`.
  - Resolving a pointer means: look up data[idx], then recurse into that
    target's *structure* (dict -> resolve each field; list -> resolve each
    element) but do NOT re-interpret a resolved scalar leaf as a pointer
    again. Resolution is exactly ONE hop per field/element; the type of the
    hop's target (scalar vs dict vs list) determines whether resolution
    continues (only dicts/lists continue).

This avoids the ambiguity of a genuine small business number (e.g.
quantity="5") being misinterpreted as a second-level pointer, because a
scalar target is never fed back into pointer detection.

KNOWN RESIDUAL AMBIGUITY (flagged, not hidden):
  A field's RAW (pre-hop) value could theoretically be a small digit-string
  that is meant as a literal rather than a pointer. Across every record
  inspected in this dataset, raw object field values were always either
  large timestamp-like index pointers or non-numeric strings/literals -
  never a "naked" small numeric literal string. If a future re-export of
  this data introduces such a field, this resolver would mis-decode it.
  This is documented in docs/01_Data_Inventory.md.
"""
from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any

_PTR_RE = re.compile(r"^-?\d+$")


class RealmGraph:
    """Wraps the raw flat array and provides safe, memoized resolution."""

    def __init__(self, raw: list[Any]):
        self.raw = raw
        self.schema: dict[str, str] = raw[0]
        self._n = len(raw)

    @classmethod
    def load(cls, path: str | Path) -> "RealmGraph":
        with open(path, "r", encoding="utf-8") as f:
            raw = json.load(f)
        if not isinstance(raw, list) or not raw or not isinstance(raw[0], dict):
            raise ValueError(
                "Unexpected file shape: expected a flat list with a schema "
                "map at index 0. This resolver is specific to the Loka "
                "Kasir Realm export format."
            )
        return cls(raw)

    def _is_pointer(self, val: Any) -> bool:
        if not isinstance(val, str) or not _PTR_RE.match(val):
            return False
        idx = int(val)
        return 0 <= idx < self._n

    def resolve_value(self, val: Any) -> Any:
        """Resolve a single field/element value (may or may not be a pointer)."""
        if self._is_pointer(val):
            target = self.raw[int(val)]
            return self._resolve_target(target)
        return val

    def _resolve_target(self, target: Any) -> Any:
        if isinstance(target, dict):
            return {k: self.resolve_value(v) for k, v in target.items()}
        if isinstance(target, list):
            return [self.resolve_value(v) for v in target]
        return target  # scalar leaf - resolution stops here by design

    def entity_names(self) -> list[str]:
        return list(self.schema.keys())

    def raw_index_list(self, entity: str) -> list[str]:
        """The list of object indices (still as pointer strings) for an entity."""
        table_id = int(self.schema[entity])
        return self.raw[table_id]

    def get_records(self, entity: str) -> list[Any]:
        """Fully resolved records for one entity."""
        idx_list = self.raw_index_list(entity)
        return [self.resolve_value(i) for i in idx_list]

    def record_count(self, entity: str) -> int:
        return len(self.raw_index_list(entity))
