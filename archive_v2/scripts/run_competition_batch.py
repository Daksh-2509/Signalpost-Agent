#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
import traceback
import re

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

from norway_company_agent.batch import profiles_from_bulk, terminal_envelope
from norway_company_agent.evidence import utc_now
from norway_company_agent.identity import apply_website_identity_gate
from norway_company_agent.official import fetch_official_modules
from norway_company_agent.website import fetch_website

def write_jsonl(path: Path, rows: list[dict]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(path.suffix + ".tmp")
    with temporary.open("w", encoding="utf-8") as handle:
        for row in rows:
            handle.write(json.dumps(row, ensure_ascii=False, separators=(",", ":")) + "\n")
    temporary.replace(path)

def sanitize_org_number(line: str) -> str | None:
    """POLISH: Aggressively strips all non-numeric characters, hidden BOMs, and weird spaces."""
    # Convert to pure ASCII, ignoring weird hidden unicode chars
    clean_text = line.encode('ascii', 'ignore').decode()
    # Extract only the digits
    digits = re.sub(r'\D', '', clean_text)
    # Norwegian org numbers are exactly 9 digits
    if len(digits) == 9:
        return digits
    return None

def main() -> None:
    parser = argparse.ArgumentParser(description="Signalpost Agent: Scrape Norwegian company data.")
    # PHASE 1: The single input file required by Soham
    parser.add_argument("input_file", help="Path to the .txt file containing organization numbers")
    parser.add_argument("--output", default="results.jsonl", help="Path to save the output JSONL (default: results.jsonl)")
    parser.add_argument("--workers", type=int, default=8, help="Number of concurrent scraper threads")
    args = parser.parse_args()

    started_at = utc_now()

    # 1. Read input file directly with aggressive sanitization
    input_path = Path(args.input_file)
    if not input_path.exists():
        raise SystemExit(f"Error: Input file {args.input_file} not found.")

    with input_path.open('r', encoding='utf-8') as f:
        orgs = []
        for line in f:
            sanitized = sanitize_org_number(line)
            if sanitized:
                orgs.append(sanitized)

    if not orgs:
        raise SystemExit("Error: No valid organization numbers found in the input file.")

    # In a real run, we pull baseline profiles if the bulk snapshot is available locally
    # For this simplified wrapper, we assume brreg-enheter.csv is in the root directory
    bulk_path = str(ROOT / "brreg-enheter.csv")
    try:
        profiles, _ = profiles_from_bulk(bulk_path, orgs)
    except FileNotFoundError:
        # Fallback if the CSV is missing: create empty baseline profiles
        profiles = [{"organisation_number": org, "evidence": {}} for org in orgs]

    requested_modules = ["registry", "accounting_obligation", "registry_live", "financials", "roles", "group", "locations", "website"]
    fetch_modules = set(requested_modules) - {"registry", "accounting_obligation", "website"}

    def enrich(profile: dict) -> dict:
        try:
            records, _ = fetch_official_modules(profile["organisation_number"], fetch_modules)
            if "evidence" not in profile:
                profile["evidence"] = {}
            profile["evidence"].update(records)

            website_url = profile.get("website")
            if website_url:
                website_record, _ = fetch_website(website_url)
                profile["evidence"]["website"] = apply_website_identity_gate(profile, website_record)["website"]
            else:
                profile["evidence"]["website"] = None

        except Exception as e:
            # PHASE 1 OUTPUT PARITY GUARANTEE: Never drop a row on failure
            print(f"Error scraping org {profile.get('organisation_number')}: {e}")
            if "evidence" not in profile:
                profile["evidence"] = {}
            profile["evidence"]["website"] = None

        return profile

    state: dict[str, dict] = {}
    print(f"Starting batch run for {len(orgs)} companies...")

    with ThreadPoolExecutor(max_workers=args.workers) as pool:
        futures = {pool.submit(enrich, profile): profile["organisation_number"] for profile in profiles}
        for index, future in enumerate(as_completed(futures), 1):
            org_number = futures[future]
            try:
                profile = future.result()
                state[org_number] = profile
                print(f"[{index}/{len(orgs)}] Processed {org_number}")
            except Exception as e:
                print(f"[{index}/{len(orgs)}] FATAL THREAD ERROR on {org_number}: {e}")
                # Parity fallback
                state[org_number] = {"organisation_number": org_number, "evidence": {"website": None}}

    completed_at = utc_now()

    # Ensure exact parity and order mapping back to input file
    ordered_profiles = [state.get(org, {"organisation_number": org, "evidence": {"website": None}}) for org in orgs]

    # Format to competition terminal envelope
    envelopes = [
        terminal_envelope(profile, run_id="v2_final", modules=requested_modules, started_at=started_at, completed_at=completed_at)
        for profile in ordered_profiles
    ]

    output_path = Path(args.output)
    write_jsonl(output_path, envelopes)
    print(f"\nSUCCESS: Wrote {len(envelopes)} records to {output_path}")

if __name__ == "__main__":
    main()