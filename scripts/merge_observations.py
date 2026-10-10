#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
from pathlib import Path


def read_jsonl(path):
    return [json.loads(l) for l in path.read_text(encoding="utf-8").splitlines() if l.strip()]


def write_jsonl(path, rows):
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as f:
        for row in rows:
            f.write(json.dumps(row, ensure_ascii=False) + "\n")


def main():
    parser = argparse.ArgumentParser(description="Merge connector observation files into profile evidence.")
    parser.add_argument("--profiles", required=True)
    parser.add_argument("--observations", nargs="+", required=True, help="One or more observation JSONL files")
    parser.add_argument("--output", required=True)
    args = parser.parse_args()

    profiles = {str(p["organisation_number"]): p for p in read_jsonl(Path(args.profiles))}
    merged_counts = {}

    for obs_path in args.observations:
        rows = read_jsonl(Path(obs_path))
        field_name = rows[0]["signal_type"] if rows else "unknown"
        count = 0
        for obs in rows:
            org = str(obs["organisation_number"])
            if org not in profiles:
                continue
            evidence_entry = {
                "field": field_name,
                "status": "available",
                "source_type": obs.get("source_class"),
                "source_url": obs.get("source_url"),
                "retrieved_at": obs.get("retrieved_at"),
                "value": obs.get("metrics"),
                "content_sha256": obs.get("content_sha256"),
                "acquisition_mode": obs.get("acquisition_mode"),
                "rights_status": obs.get("rights_status"),
                "identity_proof": obs.get("identity_proof"),
            }
            profiles[org].setdefault("evidence", {})[field_name] = evidence_entry
            count += 1
        merged_counts[obs_path] = count

    write_jsonl(Path(args.output), list(profiles.values()))
    print(json.dumps({"merged_counts": merged_counts, "total_profiles": len(profiles)}, indent=2))


if __name__ == "__main__":
    main()