#!/usr/bin/env python3
from __future__ import annotations

import argparse
import hashlib
import json
import re
from datetime import datetime
from pathlib import Path
from urllib.parse import urlparse

NEWS_PATH = re.compile(r"/(?:news|press|aktuelt|nyheter|artikler|blog)(?:/|$)", re.I)

# PHASE 3: Blacklists for UI elements and invalid date contexts
UI_BLACKLIST = re.compile(r"(?i)(cookie|privacy|personvern|vilkår|terms|login|logg\s*inn|cart|handlekurv|sitemap|meny|menu|search|søk)")
DATE_BLACKLIST = re.compile(r"(?i)(oppdatert|updated|modified|sist\s*endret|copyright|©|all\s*rights\s*reserved)")

# Looks for standard European and ISO date formats: YYYY-MM-DD, DD.MM.YYYY, etc.
DATE_PATTERN = re.compile(r"\b(20\d{2}[-/.]\d{1,2}[-/.]\d{1,2}|\d{1,2}[-/.]\d{1,2}[-/.]20\d{2})\b")

def is_valid_calendar_date(date_str: str) -> str | None:
    """POLISH: Ensures the regex match is an actual real calendar day and standardizes format."""
    clean_date = re.sub(r'[/.]', '-', date_str)
    try:
        if clean_date.startswith("20"):
            parsed = datetime.strptime(clean_date, "%Y-%m-%d")
        else:
            parsed = datetime.strptime(clean_date, "%d-%m-%Y")
        return parsed.strftime("%Y-%m-%d") # Return a standardized ISO format
    except ValueError:
        return None

def extract_semantic_date(text: str, url: str) -> str | None:
    # 1. Try URL first (highly reliable for blogs/news, e.g., /2026/10/23/...)
    url_match = re.search(r"/(20\d{2})/(\d{1,2})/(?:(\d{1,2})/)?", url)
    if url_match:
        day = url_match.group(3).zfill(2) if url_match.group(3) else "01"
        date_str = f"{url_match.group(1)}-{url_match.group(2).zfill(2)}-{day}"
        return is_valid_calendar_date(date_str)

    # 2. Check the first 500 characters of the text for a date
    head_text = text[:500]
    
    # If the text explicitly says it's a modified/copyright date, ignore it
    if DATE_BLACKLIST.search(head_text[:100]):
        return None
        
    date_match = DATE_PATTERN.search(head_text)
    if date_match:
        return is_valid_calendar_date(date_match.group(1))
        
    return None

def observation(profile: dict) -> dict | None:
    website = (profile.get("evidence") or {}).get("website") or {}
    value = website.get("value") or {}
    identity = value.get("identity_assessment") or {}
    if website.get("status") != "available" or not identity.get("publishable"):
        return None
        
    # PHASE 3: Filter pages through the UI Blacklist
    valid_pages = []
    for page in (value.get("pages") or []):
        url = str(page.get("url") or "")
        title = str(page.get("title") or "")
        
        if not NEWS_PATH.search(urlparse(url).path):
            continue
            
        # Drop navigation/UI junk
        if UI_BLACKLIST.search(url) or UI_BLACKLIST.search(title):
            continue
            
        valid_pages.append(page)
        
    if not valid_pages:
        return None
        
    # Prefer an individual article over an archive page
    valid_pages.sort(key=lambda page: (-len([part for part in urlparse(str(page.get("url") or "")).path.split("/") if part]), str(page.get("url") or "")))
    page = valid_pages[0]
    url = str(page.get("url") or "")
    digest = str(page.get("content_sha256") or "")
    
    if not url.startswith(("http://", "https://")) or len(digest) != 64:
        return None
        
    org = str(profile["organisation_number"])
    title = str(page.get("title") or "Company news/activity page").strip()
    text_excerpt = str(page.get("main_text_excerpt") or "")
    
    # Extract Semantic Date
    published_date = extract_semantic_date(text_excerpt, url)
    
    return {
        "id": "company-site-news-" + hashlib.sha256(f"{org}|{url}".encode()).hexdigest()[:24],
        "organisation_number": org,
        "platform": "company_site",
        "signal_type": "public_post",
        "source_url": url,
        "retrieved_at": website.get("retrieved_at"),
        "content_sha256": digest,
        "exact_entity": True,
        "identity_proof": [{"type": "website_identity_gate", "score": identity.get("score"), "method": identity.get("method")}],
        "acquisition_mode": "permitted_public_page",
        "rights_status": "approved",
        "source_class": "company_site",
        "evidence_span": title[:1200],
        "metrics": {
            "captured_news_pages": len(valid_pages),
            "published_date": published_date,
            "interpretation": "Company-owned activity; not independent sentiment."
        },
        "strategy": "company_site_activity",
    }

def main() -> None:
    parser = argparse.ArgumentParser(description="Extract company-owned activity from exact-site bounded news pages.")
    parser.add_argument("--profiles", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--report", required=True)
    args = parser.parse_args()
    
    profiles = [json.loads(line) for line in Path(args.profiles).read_text(encoding="utf-8").splitlines() if line.strip()]
    rows = [item for profile in profiles if (item := observation(profile))]
    Path(args.output).write_text("".join(json.dumps(row, ensure_ascii=False) + "\n" for row in rows), encoding="utf-8")
    
    report = {
        "connector": "exact_company_site_news_activity_v1",
        "profiles": len(profiles),
        "companies_with_activity": len(rows),
        "observations": len(rows),
        "claim_boundary": "Company-owned activity only; never treated as independent sentiment.",
    }
    Path(args.report).write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report, ensure_ascii=False, indent=2))

if __name__ == "__main__":
    main()