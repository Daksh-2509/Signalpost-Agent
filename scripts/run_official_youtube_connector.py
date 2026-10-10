#!/usr/bin/env python3
from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import sys
import time
import unicodedata
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

from norway_company_agent.evidence import evidence, utc_now  # noqa: E402

SEARCH_ENDPOINT = "https://www.googleapis.com/youtube/v3/search"
CHANNELS_ENDPOINT = "https://www.googleapis.com/youtube/v3/channels"
LEGAL = {"as", "asa", "sa", "da", "ans", "enk", "nuf"}


def norm(value):
    text = str(value or "")
    text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode().casefold()
    return " ".join(t for t in re.findall(r"[a-z0-9]+", text) if t not in LEGAL)


def read_jsonl(path):
    return [json.loads(l) for l in path.read_text(encoding="utf-8").splitlines() if l.strip()]


def write_jsonl(path, rows):
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(path.suffix + ".tmp")
    with tmp.open("w", encoding="utf-8") as f:
        for row in rows:
            f.write(json.dumps(row, ensure_ascii=False) + "\n")
    tmp.replace(path)


def api_get(endpoint, params, api_key, timeout=15):
    params = dict(params)
    params["key"] = api_key
    url = endpoint + "?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers={"Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return json.loads(resp.read())


def search_channel(name, api_key):
    params = {"part": "snippet", "q": name, "type": "channel", "maxResults": 5, "regionCode": "NO"}
    data = api_get(SEARCH_ENDPOINT, params, api_key)
    return data.get("items", [])


def channel_stats(channel_id, api_key):
    params = {"part": "snippet,statistics", "id": channel_id}
    data = api_get(CHANNELS_ENDPOINT, params, api_key)
    items = data.get("items", [])
    return items[0] if items else None


def main():
    parser = argparse.ArgumentParser(description="Official YouTube Data API v3 exact-entity channel discovery.")
    parser.add_argument("--profiles", required=True)
    parser.add_argument("--organisations", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--report", required=True)
    parser.add_argument("--limit", type=int, default=50)
    parser.add_argument("--api-key-env", default="YOUTUBE_API_KEY")
    args = parser.parse_args()

    api_key = os.environ.get(args.api_key_env, "").strip()
    if not api_key:
        parser.error(f"Missing API key in environment variable {args.api_key_env}")

    wanted = {l.strip() for l in Path(args.organisations).read_text().splitlines() if l.strip()}
    profiles = [p for p in read_jsonl(Path(args.profiles)) if str(p["organisation_number"]) in wanted]

    observations = []
    counts = {"searched": 0, "exact_channels": 0, "abstained": 0, "errors": 0}

    for profile in profiles[: args.limit]:
        org = str(profile["organisation_number"])
        core = norm(profile["name"])
        counts["searched"] += 1
        try:
            items = search_channel(profile["name"] + " Norge", api_key)
        except Exception:
            counts["errors"] += 1
            continue
        matched = None
        for item in items:
            snip = item.get("snippet", {}) or {}
            title = snip.get("channelTitle") or snip.get("title") or ""
            if norm(title) == core:
                matched = item
                break
        if not matched:
            counts["abstained"] += 1
            continue
        channel_id = (matched.get("snippet", {}) or {}).get("channelId") or (matched.get("id", {}) or {}).get("channelId")
        if not channel_id:
            counts["abstained"] += 1
            continue
        try:
            stats = channel_stats(channel_id, api_key)
        except Exception:
            stats = None
        retrieved_at = utc_now()
        value = {
            "channel_id": channel_id,
            "channel_title": (matched.get("snippet", {}) or {}).get("channelTitle"),
            "channel_url": f"https://www.youtube.com/channel/{channel_id}",
            "subscriber_count": ((stats or {}).get("statistics", {}) or {}).get("subscriberCount"),
            "video_count": ((stats or {}).get("statistics", {}) or {}).get("videoCount"),
            "view_count": ((stats or {}).get("statistics", {}) or {}).get("viewCount"),
        }
        digest = hashlib.sha256(json.dumps(value, sort_keys=True).encode()).hexdigest()
        observations.append({
            "id": f"youtube-official-{org}-{digest[:16]}",
            "organisation_number": org,
            "platform": "youtube",
            "signal_type": "profile_handle",
            "source_url": value["channel_url"],
            "retrieved_at": retrieved_at,
            "content_sha256": digest,
            "exact_entity": True,
            "identity_proof": [{"type": "exact_normalized_channel_name", "value": core}],
            "acquisition_mode": "official_api",
            "rights_status": "approved",
            "source_class": "company_social",
            "metrics": {k: v for k, v in value.items() if k in ("subscriber_count", "video_count", "view_count") and v is not None},
            "strategy": "official_youtube_data_api_exact_match",
        })
        counts["exact_channels"] += 1
        time.sleep(0.2)

    write_jsonl(Path(args.output), observations)
    report = {"connector": "official_youtube_channel_v1", "counts": counts, "observations_written": len(observations)}
    Path(args.report).parent.mkdir(parents=True, exist_ok=True)
    Path(args.report).write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()