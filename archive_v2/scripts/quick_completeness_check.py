#!/usr/bin/env python3
from __future__ import annotations
import json
from pathlib import Path

profiles = [json.loads(l) for l in Path("out/smoke-profiles-merged.jsonl").read_text(encoding="utf-8").splitlines() if l.strip()]

total = len(profiles)
has_registry = sum(1 for p in profiles if (p.get("evidence", {}).get("registry_live", {}).get("value", {}).get("organisation_number")))
has_financials = sum(1 for p in profiles if p.get("evidence", {}).get("financials", {}).get("status") == "available")
has_roles = sum(1 for p in profiles if p.get("evidence", {}).get("roles", {}).get("status") == "available")
has_website = sum(1 for p in profiles if p.get("evidence", {}).get("website", {}).get("status") == "available")
has_workforce = sum(1 for p in profiles if "workforce_snapshot" in p.get("evidence", {}))
has_youtube = sum(1 for p in profiles if "profile_handle" in p.get("evidence", {}))
has_any_external = sum(1 for p in profiles if "workforce_snapshot" in p.get("evidence", {}) or "profile_handle" in p.get("evidence", {}))

print(json.dumps({
    "total_companies": total,
    "official_identity_pct": round(100 * has_registry / total, 1),
    "financials_pct": round(100 * has_financials / total, 1),
    "roles_pct": round(100 * has_roles / total, 1),
    "website_pct": round(100 * has_website / total, 1),
    "workforce_signal_pct": round(100 * has_workforce / total, 1),
    "youtube_signal_pct": round(100 * has_youtube / total, 1),
    "any_external_signal_pct": round(100 * has_any_external / total, 1),
}, indent=2))