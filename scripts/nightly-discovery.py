#!/usr/bin/env python3
"""Produce a bounded, review-only report from public GitHub metadata."""

import datetime
import html
import json
import os
import re
import sys
import urllib.parse
import urllib.request

QUERIES = (
    '"implementation science" in:name,description,readme is:public archived:false',
    '"evidence synthesis" in:name,description,readme is:public archived:false',
    '"research reproducibility" in:name,description,readme is:public archived:false',
)
REPOSITORY_NAME = re.compile(r"[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+\Z")


def escape_text(value):
    text = " ".join(str(value).split())
    return "".join(
        f"&#{ord(character)};" if character in "\\|[]()*_`!#" else html.escape(character, quote=True)
        for character in text
    )


def search(query, token):
    params = urllib.parse.urlencode({"q": query, "per_page": 5, "sort": "updated"})
    request = urllib.request.Request(
        "https://api.github.com/search/repositories?" + params,
        headers={
            "Accept": "application/vnd.github+json",
            "Authorization": "Bearer " + token,
            "User-Agent": "iii-nightly-discovery",
            "X-GitHub-Api-Version": "2022-11-28",
        },
    )
    with urllib.request.urlopen(request, timeout=30) as response:
        result = json.load(response)
    if result.get("incomplete_results") is not False or not isinstance(result.get("items"), list):
        raise ValueError("GitHub search results were incomplete or malformed")
    return result["items"]


def render_report(results, now):
    lines = [
        "# Public repository discovery",
        "",
        f"Generated: {now.astimezone(datetime.timezone.utc).isoformat()}",
        "",
        "Search results are leads, not recommendations or verified integrations. "
        "Review relevance, maintenance, security, license and compatibility before use. "
        "No discovered repository code is downloaded or executed.",
    ]
    for query, items in results:
        lines.extend(["", f"## Query: {escape_text(query)}", ""])
        if not items:
            lines.append("No results returned for this query.")
            continue
        lines.extend(["| Repository | Description | License reported by GitHub | Updated |",
                      "| --- | --- | --- | --- |"])
        for item in items:
            name = item.get("full_name")
            if not isinstance(name, str) or not REPOSITORY_NAME.fullmatch(name):
                raise ValueError("GitHub returned an invalid repository name")
            if item.get("private") is not False:
                raise ValueError("GitHub returned a non-public or unclassified repository")
            license_info = item.get("license")
            license_name = license_info.get("spdx_id") if isinstance(license_info, dict) else None
            lines.append(
                f"| [{escape_text(name)}](https://github.com/{name}) "
                f"| {escape_text(item.get('description') or 'Not provided')} "
                f"| {escape_text(license_name or 'Unknown')} "
                f"| {escape_text(item.get('updated_at') or 'Unknown')} |"
            )
    return "\n".join(lines) + "\n"


def main():
    token = os.environ.get("GH_TOKEN")
    if not token:
        raise RuntimeError("GH_TOKEN is required for public GitHub search")
    results = [(query, search(query, token)) for query in QUERIES]
    sys.stdout.write(render_report(results, datetime.datetime.now(datetime.timezone.utc)))


if __name__ == "__main__":
    main()
