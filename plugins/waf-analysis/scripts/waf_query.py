#!/usr/bin/env python3
"""AWS Well-Architected Framework query utility for Claude Code skills.

This script provides a CLI for querying WAF best practices data with progressive disclosure.
It reads from the source JSON files and returns filtered, structured output.

Usage:
    python waf_query.py index --pillar security [--lens serverless] [--risk HIGH]
    python waf_query.py detail SEC01-BP01
    python waf_query.py search "encryption" [--pillar security]
    python waf_query.py devops-index [--saga DL]
    python waf_query.py devops-detail DL.CI
"""

import argparse
import json
import sys
from pathlib import Path
from typing import Any

# Resolve data directory relative to script location
SCRIPT_DIR = Path(__file__).parent
DATA_DIR = SCRIPT_DIR.parent / "data" / "source"

PILLAR_FILES = {
    "security": "security.json",
    "reliability": "reliability.json",
    "performance": "performance_efficiency.json",
    "cost": "cost_optimization.json",
    "ops": "operational_excellence.json",
    "sustainability": "sustainability.json",
}

PILLAR_ENUM_MAP = {
    "security": "SECURITY",
    "reliability": "RELIABILITY",
    "performance": "PERFORMANCE_EFFICIENCY",
    "cost": "COST_OPTIMIZATION",
    "ops": "OPERATIONAL_EXCELLENCE",
    "sustainability": "SUSTAINABILITY",
}

LENS_DIRS = {
    "serverless": "serverless",
    "iot": "iot",
    "genai": "generative-ai",
    "data-analytics": "data-analytics",
    "container": "container-build",
    "financial": "financial-services",
    "healthcare": "healthcare",
    "ml": "machine-learning",
    "saas": "saas",
    "sap": "sap",
    "government": "government",
    "migration": "migration",
    "connected-mobility": "connected-mobility",
    "mergers-acquisitions": "mergers-acquisitions",
}

DEVOPS_SAGAS = {
    "DL": "development-lifecycle",
    "QA": "quality-assurance",
    "OB": "observability",
    "AG": "automated-governance",
    "OA": "organizational-adoption",
}


def load_pillar_data(pillar: str | None = None) -> list[dict[str, Any]]:
    """Load practices from pillar JSON files."""
    practices = []
    files_to_load = {pillar: PILLAR_FILES[pillar]} if pillar else PILLAR_FILES

    for _, filename in files_to_load.items():
        filepath = DATA_DIR / filename
        if filepath.exists():
            with open(filepath) as f:
                data = json.load(f)
                practices.extend(data)
    return practices


def load_lens_data(lens: str, pillar: str | None = None) -> list[dict[str, Any]]:
    """Load practices from lens JSON files."""
    practices = []
    lens_dir = DATA_DIR / "lens" / LENS_DIRS.get(lens, lens)

    if not lens_dir.exists():
        return []

    pillar_files = (
        [f"{PILLAR_FILES.get(pillar, pillar + '.json')}"]
        if pillar
        else list(PILLAR_FILES.values())
    )

    for filename in pillar_files:
        filepath = lens_dir / filename
        if filepath.exists():
            with open(filepath) as f:
                practices.extend(json.load(f))
    return practices


def load_devops_data(saga: str | None = None) -> list[dict[str, Any]]:
    """Load DevOps capabilities from JSON files."""
    capabilities = []
    devops_dir = DATA_DIR / "lens" / "devops"

    if not devops_dir.exists():
        return []

    saga_dirs = (
        {saga: DEVOPS_SAGAS[saga]} if saga and saga in DEVOPS_SAGAS else DEVOPS_SAGAS
    )

    for _, saga_dirname in saga_dirs.items():
        saga_path = devops_dir / saga_dirname
        if saga_path.exists():
            for cap_file in saga_path.glob("*.json"):
                with open(cap_file) as f:
                    capabilities.append(json.load(f))
    return capabilities


def cmd_index(args: argparse.Namespace) -> None:
    """Output practice index with filtering."""
    if args.lens:
        practices = load_lens_data(args.lens, args.pillar)
    else:
        practices = load_pillar_data(args.pillar)

    # Apply risk filter
    if args.risk:
        practices = [p for p in practices if p.get("risk") == args.risk.upper()]

    # Format output
    if args.format == "json":
        output = [
            {
                "id": p["id"],
                "title": p["title"],
                "risk": p.get("risk", ""),
                "pillar": p.get("pillar", ""),
                "areas": p.get("area", []),
            }
            for p in practices
        ]
        print(json.dumps(output, indent=2))
    else:
        # Markdown table output
        print("| ID | Title | Risk | Pillar |")
        print("|:---|:------|:-----|:-------|")
        for p in practices:
            print(
                f"| {p['id']} | {p['title']} | {p.get('risk', '')} | {p.get('pillar', '')} |"
            )


def cmd_detail(args: argparse.Namespace) -> None:
    """Output detailed practice information."""
    practice_id = args.id.upper()

    # Search all pillars and lenses
    all_practices = load_pillar_data()
    for lens in LENS_DIRS:
        all_practices.extend(load_lens_data(lens))

    # Find matching practice
    practice = next((p for p in all_practices if p.get("id") == practice_id), None)

    if not practice:
        print(f"Practice not found: {practice_id}", file=sys.stderr)
        sys.exit(1)

    if args.format == "json":
        print(json.dumps(practice, indent=2))
    else:
        # Markdown output
        print(f"## {practice['id']}: {practice['title']}")
        print(
            f"**Risk:** {practice.get('risk', 'N/A')} | **Pillar:** {practice.get('pillar', 'N/A')} | **Lens:** {practice.get('lens', 'FRAMEWORK')}"
        )
        print()
        print(practice.get("description", ""))
        print()
        if practice.get("outcome"):
            print(f"**Desired Outcome:** {practice['outcome']}")
            print()
        if practice.get("area"):
            print(f"**Areas:** {', '.join(practice['area'])}")
            print()
        if practice.get("relatedIds"):
            print(f"**Related Practices:** {', '.join(practice['relatedIds'])}")
            print()
        print(f"**Full Documentation:** {practice.get('href', 'N/A')}")


def cmd_search(args: argparse.Namespace) -> None:
    """Search practices by keyword."""
    keyword = args.keyword.lower()

    # Load all data
    practices = load_pillar_data(args.pillar)
    if not args.pillar:
        for lens in LENS_DIRS:
            practices.extend(load_lens_data(lens))

    # Filter by keyword
    matches = [
        p
        for p in practices
        if keyword in p.get("title", "").lower()
        or keyword in p.get("description", "").lower()
        or keyword in " ".join(p.get("area", [])).lower()
    ]

    if args.format == "json":
        output = [
            {
                "id": p["id"],
                "title": p["title"],
                "risk": p.get("risk", ""),
                "pillar": p.get("pillar", ""),
                "match_context": (
                    p["title"]
                    if keyword in p.get("title", "").lower()
                    else p["description"][:200] + "..."
                ),
            }
            for p in matches
        ]
        print(json.dumps(output, indent=2))
    else:
        print(f"## Search Results for '{args.keyword}'")
        print()
        print(f"Found {len(matches)} matching practices")
        print()
        print("| ID | Title | Risk | Pillar |")
        print("|:---|:------|:-----|:-------|")
        for p in matches:
            print(
                f"| {p['id']} | {p['title']} | {p.get('risk', '')} | {p.get('pillar', '')} |"
            )


def cmd_devops_index(args: argparse.Namespace) -> None:
    """Output DevOps capabilities index."""
    capabilities = load_devops_data(args.saga)

    if args.format == "json":
        output = [
            {
                "saga": c["saga"],
                "sagaCode": c["sagaCode"],
                "capability": c["capability"],
                "capabilityCode": c["capabilityCode"],
                "indicatorCount": len(c.get("indicators", [])),
                "antiPatternCount": len(c.get("antiPatterns", [])),
                "metricCount": len(c.get("metrics", [])),
            }
            for c in capabilities
        ]
        print(json.dumps(output, indent=2))
    else:
        print("| Saga | Capability | Code | Indicators | Anti-Patterns | Metrics |")
        print("|:-----|:-----------|:-----|:-----------|:--------------|:--------|")
        for c in capabilities:
            code = f"{c['sagaCode']}.{c['capabilityCode']}"
            print(
                f"| {c['saga']} | {c['capability']} | {code} | {len(c.get('indicators', []))} | {len(c.get('antiPatterns', []))} | {len(c.get('metrics', []))} |"
            )


def cmd_devops_detail(args: argparse.Namespace) -> None:
    """Output detailed DevOps capability information."""
    # Parse ID format: DL.CI or DL_CI
    parts = args.id.replace("_", ".").split(".")
    if len(parts) != 2:
        print(
            f"Invalid capability ID format: {args.id}. Use SAGA.CAP (e.g., DL.CI)",
            file=sys.stderr,
        )
        sys.exit(1)

    saga_code, cap_code = parts[0].upper(), parts[1].upper()
    capabilities = load_devops_data(saga_code)

    capability = next(
        (c for c in capabilities if c.get("capabilityCode", "").upper() == cap_code),
        None,
    )

    if not capability:
        print(f"Capability not found: {args.id}", file=sys.stderr)
        sys.exit(1)

    if args.format == "json":
        print(json.dumps(capability, indent=2))
    else:
        print(f"## {capability['saga']}: {capability['capability']}")
        print(f"**Code:** {capability['sagaCode']}.{capability['capabilityCode']}")
        print()
        print(capability.get("description", ""))
        print()
        print(f"**Documentation:** {capability.get('href', 'N/A')}")
        print()

        # Indicators
        if capability.get("indicators"):
            print("### Indicators")
            for ind in capability["indicators"]:
                print(f"- **{ind['id']}**: {ind['title']}")
            print()

        # Anti-Patterns
        if capability.get("antiPatterns"):
            print("### Anti-Patterns")
            for ap in capability["antiPatterns"]:
                print(f"- **{ap['id']}**: {ap['title']}")
            print()

        # Metrics
        if capability.get("metrics"):
            print("### Metrics")
            for m in capability["metrics"]:
                print(f"- **{m['id']}**: {m['title']}")


def main():
    parser = argparse.ArgumentParser(
        description="Query AWS Well-Architected Framework best practices"
    )
    parser.add_argument(
        "--format",
        "-f",
        choices=["json", "markdown"],
        default="markdown",
        help="Output format (default: markdown)",
    )

    subparsers = parser.add_subparsers(dest="command", required=True)

    # index command
    index_parser = subparsers.add_parser("index", help="List practices by filter")
    index_parser.add_argument("--pillar", "-p", choices=list(PILLAR_FILES.keys()))
    index_parser.add_argument("--lens", "-l", choices=list(LENS_DIRS.keys()))
    index_parser.add_argument("--risk", "-r", choices=["HIGH", "MEDIUM", "LOW"])
    index_parser.set_defaults(func=cmd_index)

    # detail command
    detail_parser = subparsers.add_parser("detail", help="Get practice details")
    detail_parser.add_argument("id", help="Practice ID (e.g., SEC01-BP01)")
    detail_parser.set_defaults(func=cmd_detail)

    # search command
    search_parser = subparsers.add_parser("search", help="Search practices by keyword")
    search_parser.add_argument("keyword", help="Search keyword")
    search_parser.add_argument("--pillar", "-p", choices=list(PILLAR_FILES.keys()))
    search_parser.set_defaults(func=cmd_search)

    # devops-index command
    devops_index_parser = subparsers.add_parser(
        "devops-index", help="List DevOps capabilities"
    )
    devops_index_parser.add_argument("--saga", "-s", choices=list(DEVOPS_SAGAS.keys()))
    devops_index_parser.set_defaults(func=cmd_devops_index)

    # devops-detail command
    devops_detail_parser = subparsers.add_parser(
        "devops-detail", help="Get DevOps capability details"
    )
    devops_detail_parser.add_argument("id", help="Capability ID (e.g., DL.CI)")
    devops_detail_parser.set_defaults(func=cmd_devops_detail)

    args = parser.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
