#!/usr/bin/env python3

from __future__ import annotations

import argparse
import csv
import json
from collections import defaultdict
from datetime import UTC, date, datetime
from pathlib import Path
from urllib.request import Request, urlopen


DEFAULT_SOURCE_URL = (
    "https://opensheet.elk.sh/1l1CXHdge8_2F2ifjMY71f23DJ_98Ei2QNZ9rPdBd8jQ/'pm2026'"
)
DEFAULT_OUTPUT = Path("data/current-mapping.json")


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Build the GitHub Pages mapping snapshot for the shiny URL converter."
    )
    parser.add_argument("--source-url", default=DEFAULT_SOURCE_URL)
    parser.add_argument(
        "--source-file",
        help="Optional local JSON or CSV file to read instead of downloading the default source URL.",
    )
    parser.add_argument(
        "--legacy-mapping",
        default="data/current-mapping.json",
        help="Existing mapping JSON used to preserve legacy indices when the CSV no longer contains _index.",
    )
    parser.add_argument(
        "--effective-date",
        default=date.today().isoformat(),
        help="Rows with debut earlier than this YYYY-MM-DD date are treated as released.",
    )
    parser.add_argument("--output", default=str(DEFAULT_OUTPUT))
    args = parser.parse_args()

    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    csv_source = Path(args.source_file).resolve().as_uri() if args.source_file else args.source_url
    rows = load_rows(csv_source)
    effective_date = datetime.fromisoformat(args.effective_date)
    legacy_mapping = load_legacy_mapping(args.legacy_mapping)

    current_released_rows = []
    for row in rows:
        debut = parse_debut(row.get("debut", ""))
        if debut is not None and debut <= effective_date:
            current_released_rows.append(row)

    released_rows, resolution_stats = build_released_rows(current_released_rows, legacy_mapping)

    payload = {
        "meta": {
            "sourceUrl": args.source_url,
            "effectiveDate": args.effective_date,
            "generatedAt": datetime.now(UTC).replace(microsecond=0).isoformat().replace("+00:00", "Z"),
            "releasedRowCount": len(released_rows),
            "familyCount": len({row["familyDex"] for row in released_rows}),
            "maxIndex": max(row["index"] for row in released_rows),
            **resolution_stats,
        },
        "rows": released_rows,
    }

    output_path.write_text(json.dumps(payload, separators=(",", ":")), encoding="utf-8")
    print(f"Wrote {output_path} with {len(released_rows)} released rows.")


_HEADERS = {"User-Agent": "Mozilla/5.0"}


def load_rows(source_url: str) -> list[dict[str, str]]:
    req = Request(source_url, headers=_HEADERS)
    with urlopen(req) as response:
        text = response.read().decode("utf-8")

    stripped = text.lstrip()
    if stripped.startswith("["):
        return json.loads(text)

    return list(csv.DictReader(text.splitlines()))


def load_legacy_mapping(path_str: str | None) -> dict | None:
    if not path_str:
        return None

    path = Path(path_str)
    if not path.exists():
        return None

    return json.loads(path.read_text(encoding="utf-8"))


def build_released_rows(current_rows: list[dict[str, str]], legacy_mapping: dict | None) -> tuple[list[dict], dict]:
    if current_rows and "_index" in current_rows[0]:
        return (
            [
                {
                    "familyDex": row["family_dex"],
                    "index": int(row["_index"]),
                    "pid": row["pid"],
                    "group": row["group"],
                }
                for row in current_rows
            ],
            {
                "legacyMappingGeneratedAt": None,
                "legacyMappingEffectiveDate": None,
                "resolvedByPidCount": 0,
                "resolvedByGroupFallbackCount": 0,
                "syntheticIndexCount": 0,
            },
        )

    if not legacy_mapping:
        raise RuntimeError("CSV has no _index column and no legacy mapping was provided.")

    legacy_rows = legacy_mapping["rows"]
    legacy_pid_to_index = {row["pid"]: row["index"] for row in legacy_rows}
    legacy_max_index = max(row["index"] for row in legacy_rows)

    direct_pid_matches = {}
    used_legacy_pids = set()
    current_missing = []

    for row in current_rows:
        pid = row["pid"]
        if pid in legacy_pid_to_index:
            direct_pid_matches[pid] = legacy_pid_to_index[pid]
            used_legacy_pids.add(pid)
        else:
            current_missing.append(row)

    legacy_group_pool = defaultdict(list)
    for row in legacy_rows:
        key = (row["familyDex"], row["group"])
        if row["pid"] not in used_legacy_pids:
            legacy_group_pool[key].append(row)

    missing_by_group = defaultdict(list)
    for row in current_missing:
        key = (row["family_dex"], row["group"])
        missing_by_group[key].append(row)

    group_fallback_matches = {}
    for key, missing_rows in missing_by_group.items():
        candidates = legacy_group_pool.get(key, [])
        for missing_row, legacy_row in zip(missing_rows, candidates):
            group_fallback_matches[missing_row["pid"]] = legacy_row["index"]

    next_synthetic_index = legacy_max_index + 1
    released_rows = []
    resolved_by_pid_count = 0
    resolved_by_group_fallback_count = 0
    synthetic_index_count = 0

    for row in current_rows:
        pid = row["pid"]
        if pid in direct_pid_matches:
            row_index = direct_pid_matches[pid]
            resolved_by_pid_count += 1
        elif pid in group_fallback_matches:
            row_index = group_fallback_matches[pid]
            resolved_by_group_fallback_count += 1
        else:
            row_index = next_synthetic_index
            next_synthetic_index += 1
            synthetic_index_count += 1

        released_rows.append(
            {
                "familyDex": row["family_dex"],
                "index": row_index,
                "pid": pid,
                "group": row["group"],
            }
        )

    return (
        released_rows,
        {
            "legacyMappingGeneratedAt": legacy_mapping.get("meta", {}).get("generatedAt"),
            "legacyMappingEffectiveDate": legacy_mapping.get("meta", {}).get("effectiveDate"),
            "resolvedByPidCount": resolved_by_pid_count,
            "resolvedByGroupFallbackCount": resolved_by_group_fallback_count,
            "syntheticIndexCount": synthetic_index_count,
        },
    )


def parse_debut(value: str) -> datetime | None:
    if not value:
        return None
    return datetime.fromisoformat(value)


if __name__ == "__main__":
    main()
