#!/usr/bin/env python3

from __future__ import annotations

import argparse
import json
from collections import Counter
from datetime import UTC, datetime
from pathlib import Path
from urllib.request import Request, urlopen


DEFAULT_CLASSIC_SOURCE_URL = "https://raw.githubusercontent.com/Rplus/Pokemon-shiny/master/assets/pms.json"
DEFAULT_CURRENT_MAPPING = Path("data/current-mapping.json")
DEFAULT_OUTPUT = Path("data/classic-crosswalk.json")

AA_FN_OVERRIDES = {
    "25_cPI": "pm25.cFEB_2019",
    "25_23d": "pm25.cPI",
    "26_23d": "pm26.cPI",
}

EXACT_PID_OVERRIDES = {
    "6_51": "pm6.fMEGA_X",
    "25_13": "pm25.cSAFARI_2020_NOEVOLVE",
    "25_22": "pm25.cKANTO_2020_NOEVOLVE",
    "25_23": "pm25.cJOHTO_2020_NOEVOLVE",
    "25_24": "pm25.cHOENN_2020_NOEVOLVE",
    "25_25": "pm25.cSINNOH_2020_NOEVOLVE",
    "25_47": "pm25.cGOFEST_2021_NOEVOLVE",
    "25_16": "pm25.fVS_2019",
    "77_31_47": "pm77.fGALARIAN.cGOFEST_2021_NOEVOLVE",
    "94_26": "pm94.fCOSTUME_2020",
    "202_11": "pm202.cJAN_2020_NOEVOLVE",
    "202_01_11": "pm202.cJAN_2020_NOEVOLVE.g2",
    "263_31_47": "pm263.fGALARIAN.cGOFEST_2021_NOEVOLVE",
    "351_11": "pm351",
    "351_12": "pm351.fSUNNY",
    "351_13": "pm351.fRAINY",
    "351_14": "pm351.fSNOWY",
    "386_11": "pm386",
    "386_12": "pm386.fATTACK",
    "386_13": "pm386.fDEFENSE",
    "386_14": "pm386.fSPEED",
    "412_11": "pm412.fBURMY_PLANT",
    "412_12": "pm412.fBURMY_SANDY",
    "412_13": "pm412.fBURMY_TRASH",
    "413_11": "pm413.fWORMADAM_PLANT",
    "413_12": "pm413.fWORMADAM_SANDY",
    "413_13": "pm413.fWORMADAM_TRASH",
    "421_11": "pm421.fOVERCAST",
    "421_12": "pm421.fSUNNY",
    "487_11": "pm487.fALTERED",
    "487_12": "pm487.fORIGIN",
    "555_11": "pm555.fSTANDARD",
    "555_31": "pm555.fGALARIAN_STANDARD",
    "641_11": "pm641.fINCARNATE",
    "641_12": "pm641.fTHERIAN",
    "642_11": "pm642.fINCARNATE",
    "642_12": "pm642.fTHERIAN",
    "645_11": "pm645.fINCARNATE",
    "645_12": "pm645.fTHERIAN",
    "646_11": "pm646.fNORMAL",
    "648": "pm648.fARIA",
}

FN_PID_OVERRIDES = {
    "pm0001_00_pgo_fall2019": "pm1.fFALL_2019",
    "pm0004_00_pgo_fall2019": "pm4.fFALL_2019",
    "pm0007_00_pgo_fall2019": "pm7.fFALL_2019",
    "pm0025_00_pgo_fall2019": "pm25.fFALL_2019",
    "pm0025_00_pgo_4thanniversary": "pm25.fCOSTUME_2020",
    "pm0025_00_pgo_movie2020": "pm25.fADVENTURE_HAT_2020",
    "pm0025_00_pgo_winter2020": "pm25.fWINTER_2020",
    "pm0025_00_pgo_5thanniversary": "pm25.fFLYING_5TH_ANNIV",
    "pm0079_00_pgo_2020": "pm79.f2020",
    "pm0080_00_pgo_2021": "pm80.f2021",
    "pm0225_00_pgo_winter2020": "pm225.fWINTER_2020",
    "pm0302_00_pgo_fall2020": "pm302.fCOSTUME_2020",
}

ISOTOPE_PID_SUFFIXES = {
    "_01": ".cHOLIDAY_2016",
    "_02": ".cANNIVERSARY",
    "_03": ".cONE_YEAR_ANNIVERSARY",
    "_04": ".cHALLOWEEN_2017",
    "_05": ".cSUMMER_2018",
    "_06": ".cFALL_2018",
    "_07": ".cNOVEMBER_2018",
    "_08": ".cWINTER_2018",
    "_10": ".cMAY_2019_NOEVOLVE",
    "_11": ".cJAN_2020_NOEVOLVE",
    "_12": ".cAPRIL_2020_NOEVOLVE",
    "_14": ".cSPRING_2020_NOEVOLVE",
    "_16": ".cFALL_2020_NOEVOLVE",
    "_23d": ".cPI",
    "_27": ".cCOSTUME_1",
    "_28": ".cCOSTUME_2",
}


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Build the static crosswalk for classic Pokemon-shiny URLs."
    )
    parser.add_argument("--source-url", default=DEFAULT_CLASSIC_SOURCE_URL)
    parser.add_argument(
        "--source-file",
        help="Optional local classic pms.json file to read instead of downloading the source URL.",
    )
    parser.add_argument(
        "--current-mapping",
        default=str(DEFAULT_CURRENT_MAPPING),
        help="Current grouped snapshot used to validate current pids.",
    )
    parser.add_argument("--output", default=str(DEFAULT_OUTPUT))
    args = parser.parse_args()

    classic_source = load_json(
        Path(args.source_file).resolve().as_uri() if args.source_file else args.source_url
    )
    current_mapping = json.loads(Path(args.current_mapping).read_text(encoding="utf-8"))
    current_pids = {row["pid"] for row in current_mapping["rows"]}

    resolved = {}
    unresolved = []
    source_counts: Counter[str] = Counter()
    unique_legacy_ids = {build_legacy_id(row) for row in classic_source}

    for row in classic_source:
        legacy_id = build_legacy_id(row)
        pid, source = resolve_legacy_id(row, current_pids)
        if pid is None:
            released_date = row.get("released_date")
            shiny_released = row.get("shiny_released")
            unresolved.append(
                {
                    "legacyId": legacy_id,
                    "family": row.get("family"),
                    "reason": source,
                    "releasedDate": released_date,
                    "shinyReleased": bool(shiny_released) if (not released_date and shiny_released is not None) else None,
                }
            )
            continue

        resolved[legacy_id] = {
            "pid": pid,
            "source": source,
            "family": row.get("family"),
        }
        source_counts[source] += 1

    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(
        json.dumps(
            {
                "meta": {
                    "sourceUrl": args.source_url,
                    "generatedAt": datetime.now(UTC).replace(microsecond=0).isoformat().replace(
                        "+00:00", "Z"
                    ),
                    "currentSnapshotEffectiveDate": current_mapping["meta"]["effectiveDate"],
                    "rowCount": len(classic_source),
                    "uniqueLegacyIdCount": len(unique_legacy_ids),
                    "resolvedCount": len(resolved),
                    "unresolvedCount": len(unresolved),
                    "resolutionSources": dict(sorted(source_counts.items())),
                },
                "resolved": resolved,
                "unresolved": unresolved,
            },
            separators=(",", ":"),
        ),
        encoding="utf-8",
    )
    print(f"Wrote {output_path} with {len(resolved)} resolved legacy ids.")


_HEADERS = {"User-Agent": "Mozilla/5.0"}


def load_json(source_url: str) -> list[dict]:
    req = Request(source_url, headers=_HEADERS)
    with urlopen(req) as response:
        return json.loads(response.read().decode("utf-8"))


def build_legacy_id(row: dict) -> str:
    return f"{row['dex']}{row.get('type') or ''}{row.get('isotope') or ''}"


def resolve_legacy_id(row: dict, current_pids: set[str]) -> tuple[str | None, str]:
    legacy_id = build_legacy_id(row)
    dex = row["dex"]
    legacy_pid = f"pm{dex}"

    if legacy_id in AA_FN_OVERRIDES:
        pid = AA_FN_OVERRIDES[legacy_id]
        return (pid, "aa_fn_override") if pid in current_pids else (None, "aa_fn_override_missing")

    if row.get("aa_fn") in current_pids:
        return row["aa_fn"], "aa_fn"

    if legacy_id in EXACT_PID_OVERRIDES:
        pid = EXACT_PID_OVERRIDES[legacy_id]
        return (pid, "exact_override") if pid in current_pids else (None, "exact_override_missing")

    if row.get("fn") in FN_PID_OVERRIDES:
        pid = FN_PID_OVERRIDES[row["fn"]]
        return (pid, "fn_override") if pid in current_pids else (None, "fn_override_missing")

    if dex == 201 and row.get("name_suffix"):
        pid = build_unown_pid(row["name_suffix"])
        return (pid, "unown_suffix") if pid in current_pids else (None, "unown_suffix_missing")

    type_code = row.get("type")
    isotope = row.get("isotope")

    if not type_code and not isotope:
        if legacy_pid in current_pids:
            return legacy_pid, "base_pid"

    if type_code == "_01" and not isotope:
        for pid in (f"{legacy_pid}.g2", f"{legacy_pid}.fFEMALE"):
            if pid in current_pids:
                return pid, "female_variant"

    if type_code == "_31":
        for pid in (f"{legacy_pid}.fGALARIAN", legacy_pid):
            if pid in current_pids:
                return pid, "galarian_variant"

    if type_code == "_61":
        pid = f"{legacy_pid}.fALOLA"
        if pid in current_pids:
            return pid, "alolan_variant"

    if type_code == "_51":
        pid = f"{legacy_pid}.fMEGA"
        if pid in current_pids:
            return pid, "mega_variant"

    if type_code == "_52":
        pid = f"{legacy_pid}.fMEGA_Y"
        if pid in current_pids:
            return pid, "mega_variant"

    if not type_code and isotope in ISOTOPE_PID_SUFFIXES:
        pid = f"{legacy_pid}{ISOTOPE_PID_SUFFIXES[isotope]}"
        if pid in current_pids:
            return pid, "isotope_suffix"

    return None, "unmapped"


def build_unown_pid(name_suffix: str) -> str:
    token = name_suffix.strip()[1:-1]
    if token == "!":
        token = "EXCLAMATION_POINT"
    elif token == "?":
        token = "QUESTION_MARK"
    return f"pm201.fUNOWN_{token}"


if __name__ == "__main__":
    main()
