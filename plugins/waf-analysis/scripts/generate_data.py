#!/usr/bin/env python3
"""Generate markdown data files from source JSON for Claude Code skills.

This script transforms the source JSON files into markdown files optimized
for progressive disclosure in skills and agents.

Usage:
    python generate_data.py
"""

import json
from pathlib import Path
from typing import Any

# Resolve directories
SCRIPT_DIR = Path(__file__).parent
PLUGIN_DIR = SCRIPT_DIR.parent
DATA_DIR = PLUGIN_DIR / "data" / "source"
OUTPUT_DIR = PLUGIN_DIR / "data"

PILLAR_CONFIG = {
    "security": {
        "file": "security.json",
        "name": "Security",
        "prefix": "SEC",
        "description": "Protect data, systems, and assets through risk assessments and mitigation strategies.",
    },
    "reliability": {
        "file": "reliability.json",
        "name": "Reliability",
        "prefix": "REL",
        "description": "Ensure workloads perform intended functions correctly and consistently.",
    },
    "performance": {
        "file": "performance_efficiency.json",
        "name": "Performance Efficiency",
        "prefix": "PERF",
        "description": "Use computing resources efficiently to meet requirements and maintain efficiency.",
    },
    "cost": {
        "file": "cost_optimization.json",
        "name": "Cost Optimization",
        "prefix": "COST",
        "description": "Avoid unnecessary costs and optimize spending for business value.",
    },
    "ops": {
        "file": "operational_excellence.json",
        "name": "Operational Excellence",
        "prefix": "OPS",
        "description": "Support development, run workloads effectively, and continuously improve.",
    },
    "sustainability": {
        "file": "sustainability.json",
        "name": "Sustainability",
        "prefix": "SUS",
        "description": "Minimize environmental impacts of running cloud workloads.",
    },
}

LENS_CONFIG = {
    "serverless": {
        "dir": "serverless",
        "name": "Serverless",
        "description": "Best practices for serverless applications using Lambda, API Gateway, etc.",
    },
    "iot": {
        "dir": "iot",
        "name": "IoT",
        "description": "Best practices for Internet of Things workloads.",
    },
    "genai": {
        "dir": "generative-ai",
        "name": "Generative AI",
        "description": "Best practices for generative AI and foundation model workloads.",
    },
    "data-analytics": {
        "dir": "data-analytics",
        "name": "Data Analytics",
        "description": "Best practices for data analytics workloads.",
    },
    "container": {
        "dir": "container-build",
        "name": "Container Build",
        "description": "Best practices for containerized applications.",
    },
    "ml": {
        "dir": "machine-learning",
        "name": "Machine Learning",
        "description": "Best practices for machine learning workloads.",
    },
    "saas": {
        "dir": "saas",
        "name": "SaaS",
        "description": "Best practices for Software-as-a-Service applications.",
    },
    "financial": {
        "dir": "financial-services",
        "name": "Financial Services",
        "description": "Best practices for financial services workloads.",
    },
    "healthcare": {
        "dir": "healthcare",
        "name": "Healthcare",
        "description": "Best practices for healthcare workloads.",
    },
    "government": {
        "dir": "government",
        "name": "Government",
        "description": "Best practices for government workloads.",
    },
    "sap": {
        "dir": "sap",
        "name": "SAP",
        "description": "Best practices for SAP workloads on AWS.",
    },
    "migration": {
        "dir": "migration",
        "name": "Migration",
        "description": "Best practices for cloud migration projects.",
    },
    "connected-mobility": {
        "dir": "connected-mobility",
        "name": "Connected Mobility",
        "description": "Best practices for connected vehicle and mobility workloads.",
    },
    "mergers-acquisitions": {
        "dir": "mergers-acquisitions",
        "name": "Mergers & Acquisitions",
        "description": "Best practices for M&A technology integration.",
    },
}

DEVOPS_SAGAS = {
    "DL": {
        "dir": "development-lifecycle",
        "name": "Development Lifecycle",
        "description": "Practices for software development, CI/CD, and deployment.",
    },
    "QA": {
        "dir": "quality-assurance",
        "name": "Quality Assurance",
        "description": "Practices for testing, validation, and quality management.",
    },
    "OB": {
        "dir": "observability",
        "name": "Observability",
        "description": "Practices for monitoring, logging, and operational visibility.",
    },
    "AG": {
        "dir": "automated-governance",
        "name": "Automated Governance",
        "description": "Practices for compliance, security, and policy automation.",
    },
    "OA": {
        "dir": "organizational-adoption",
        "name": "Organizational Adoption",
        "description": "Practices for team culture, skills, and organizational change.",
    },
}


def load_json(filepath: Path) -> list[dict[str, Any]] | dict[str, Any]:
    """Load JSON file."""
    with open(filepath) as f:
        return json.load(f)


def group_by_risk(practices: list[dict[str, Any]]) -> dict[str, list[dict[str, Any]]]:
    """Group practices by risk level."""
    groups = {"HIGH": [], "MEDIUM": [], "LOW": []}
    for p in practices:
        risk = p.get("risk", "LOW")
        groups.setdefault(risk, []).append(p)
    return groups


def generate_pillar_md(
    pillar_key: str, config: dict[str, Any], practices: list[dict[str, Any]]
) -> str:
    """Generate markdown for a pillar file."""
    grouped = group_by_risk(practices)
    lines = []

    lines.append(f"# {config['name']} Pillar Best Practices")
    lines.append("")
    lines.append(config["description"])
    lines.append("")

    # TOC
    lines.append("## Contents")
    lines.append("- [HIGH Risk Practices](#high-risk-practices)")
    lines.append("- [MEDIUM Risk Practices](#medium-risk-practices)")
    lines.append("- [LOW Risk Practices](#low-risk-practices)")
    lines.append("- [Practice Details](#practice-details)")
    lines.append("")

    # Risk tables
    for risk in ["HIGH", "MEDIUM", "LOW"]:
        risk_practices = grouped.get(risk, [])
        lines.append(f"## {risk} Risk Practices")
        lines.append("")
        if risk_practices:
            lines.append("| ID | Title | Areas |")
            lines.append("|:---|:------|:------|")
            for p in risk_practices:
                areas = ", ".join(p.get("area", [])[:2])
                lines.append(f"| {p['id']} | {p['title']} | {areas} |")
        else:
            lines.append("*No practices at this risk level.*")
        lines.append("")

    # Practice details
    lines.append("## Practice Details")
    lines.append("")

    for p in practices:
        lines.append(f"### {p['id']}: {p['title']}")
        lines.append(f"**Risk:** {p.get('risk', 'N/A')}")
        lines.append(f"**Areas:** {', '.join(p.get('area', []))}")
        lines.append("")
        lines.append(p.get("description", ""))
        lines.append("")
        if p.get("outcome"):
            lines.append(f"**Outcome:** {p['outcome']}")
            lines.append("")
        if p.get("relatedIds"):
            lines.append(f"**Related:** {', '.join(p['relatedIds'])}")
            lines.append("")
        lines.append(f"**Docs:** {p.get('href', 'N/A')}")
        lines.append("")

    return "\n".join(lines)


def generate_lens_md(
    lens_key: str, config: dict[str, Any], practices: list[dict[str, Any]]
) -> str:
    """Generate markdown for a lens file."""
    lines = []

    lines.append(f"# {config['name']} Lens Best Practices")
    lines.append("")
    lines.append(config["description"])
    lines.append("")

    # Group by pillar
    by_pillar: dict[str, list[dict[str, Any]]] = {}
    for p in practices:
        pillar = p.get("pillar", "UNKNOWN")
        by_pillar.setdefault(pillar, []).append(p)

    # TOC
    lines.append("## Contents")
    for pillar in sorted(by_pillar.keys()):
        lines.append(f"- [{pillar}](#{pillar.lower().replace('_', '-')})")
    lines.append("")

    # Pillar sections
    for pillar, pillar_practices in sorted(by_pillar.items()):
        lines.append(f"## {pillar}")
        lines.append("")
        lines.append("| ID | Title | Risk |")
        lines.append("|:---|:------|:-----|")
        for p in sorted(
            pillar_practices,
            key=lambda x: (x.get("risk", "LOW") != "HIGH", x.get("id", "")),
        ):
            lines.append(f"| {p['id']} | {p['title']} | {p.get('risk', 'N/A')} |")
        lines.append("")

    return "\n".join(lines)


def generate_devops_saga_md(
    saga_code: str, config: dict[str, Any], capabilities: list[dict[str, Any]]
) -> str:
    """Generate markdown for a DevOps saga file."""
    lines = []

    lines.append(f"# {config['name']} Saga")
    lines.append("")
    lines.append(config["description"])
    lines.append("")

    # TOC
    lines.append("## Capabilities")
    for cap in capabilities:
        cap_anchor = cap["capability"].lower().replace(" ", "-")
        lines.append(f"- [{cap['capability']}](#{cap_anchor})")
    lines.append("")

    # Capability details
    for cap in capabilities:
        lines.append(f"## {cap['capability']}")
        lines.append(f"**Code:** {cap['sagaCode']}.{cap['capabilityCode']}")
        lines.append("")
        lines.append(cap.get("description", ""))
        lines.append("")
        lines.append(f"**Docs:** {cap.get('href', 'N/A')}")
        lines.append("")

        # Indicators
        if cap.get("indicators"):
            lines.append("### Indicators")
            lines.append("| ID | Title | Category |")
            lines.append("|:---|:------|:---------|")
            for ind in cap["indicators"]:
                cat = ind.get("category", "")
                lines.append(f"| {ind['id']} | {ind['title']} | {cat} |")
            lines.append("")

        # Anti-patterns
        if cap.get("antiPatterns"):
            lines.append("### Anti-Patterns")
            lines.append("| ID | Title |")
            lines.append("|:---|:------|")
            for ap in cap["antiPatterns"]:
                lines.append(f"| {ap['id']} | {ap['title']} |")
            lines.append("")

        # Metrics
        if cap.get("metrics"):
            lines.append("### Metrics")
            lines.append("| ID | Title |")
            lines.append("|:---|:------|")
            for m in cap["metrics"]:
                lines.append(f"| {m['id']} | {m['title']} |")
            lines.append("")

    return "\n".join(lines)


def generate_index_md() -> str:
    """Generate the main index.md file."""
    lines = []

    lines.append("# AWS Well-Architected Framework Data Index")
    lines.append("")
    lines.append(
        "This directory contains structured data for AWS Well-Architected Framework best practices,"
    )
    lines.append(
        "organized for progressive disclosure in Claude Code skills and agents."
    )
    lines.append("")

    # Pillars
    lines.append("## Framework Pillars")
    lines.append("")
    lines.append("| Pillar | File | Description |")
    lines.append("|:-------|:-----|:------------|")
    for key, config in PILLAR_CONFIG.items():
        lines.append(
            f"| {config['name']} | [pillars/{key}.md](pillars/{key}.md) | {config['description'][:60]}... |"
        )
    lines.append("")

    # Lenses
    lines.append("## Specialty Lenses")
    lines.append("")
    lines.append("| Lens | File | Description |")
    lines.append("|:-----|:-----|:------------|")
    for key, config in LENS_CONFIG.items():
        lines.append(
            f"| {config['name']} | [lenses/{key}.md](lenses/{key}.md) | {config['description'][:50]}... |"
        )
    lines.append("")

    # DevOps
    lines.append("## DevOps Guidance")
    lines.append("")
    lines.append("| Saga | Code | File | Description |")
    lines.append("|:-----|:-----|:-----|:------------|")
    for code, config in DEVOPS_SAGAS.items():
        lines.append(
            f"| {config['name']} | {code} | [devops/{config['dir']}.md](devops/{config['dir']}.md) | {config['description'][:40]}... |"
        )
    lines.append("")

    # Usage
    lines.append("## Usage")
    lines.append("")
    lines.append("These files support progressive disclosure:")
    lines.append(
        "1. **Level 1 (Index)**: Tables at the top of each file list practice IDs, titles, and risk levels"
    )
    lines.append(
        "2. **Level 2 (Summary)**: Practice Details sections provide descriptions, outcomes, and areas"
    )
    lines.append(
        "3. **Level 3 (Full)**: WebFetch the `href` URL for complete AWS documentation"
    )
    lines.append("")

    return "\n".join(lines)


def generate_devops_index_md(all_capabilities: list[dict[str, Any]]) -> str:
    """Generate DevOps index file."""
    lines = []

    lines.append("# DevOps Guidance Index")
    lines.append("")
    lines.append("AWS DevOps Guidance organized by Sagas (domains) and Capabilities.")
    lines.append("")

    lines.append("## Sagas Overview")
    lines.append("")
    lines.append("| Code | Saga | Capabilities | File |")
    lines.append("|:-----|:-----|:-------------|:-----|")
    for code, config in DEVOPS_SAGAS.items():
        count = sum(1 for c in all_capabilities if c.get("sagaCode") == code)
        lines.append(
            f"| {code} | {config['name']} | {count} | [{config['dir']}.md]({config['dir']}.md) |"
        )
    lines.append("")

    lines.append("## All Capabilities")
    lines.append("")
    lines.append("| Code | Capability | Saga | Indicators | Anti-Patterns | Metrics |")
    lines.append("|:-----|:-----------|:-----|:-----------|:--------------|:--------|")
    for cap in sorted(
        all_capabilities, key=lambda x: f"{x['sagaCode']}.{x['capabilityCode']}"
    ):
        code = f"{cap['sagaCode']}.{cap['capabilityCode']}"
        lines.append(
            f"| {code} | {cap['capability']} | {cap['saga']} | "
            f"{len(cap.get('indicators', []))} | {len(cap.get('antiPatterns', []))} | "
            f"{len(cap.get('metrics', []))} |"
        )
    lines.append("")

    return "\n".join(lines)


def main():
    """Generate all markdown data files."""
    print("Generating markdown data files...")

    # Ensure output directories exist
    (OUTPUT_DIR / "pillars").mkdir(parents=True, exist_ok=True)
    (OUTPUT_DIR / "lenses").mkdir(parents=True, exist_ok=True)
    (OUTPUT_DIR / "devops").mkdir(parents=True, exist_ok=True)

    # Generate pillar files
    print("Generating pillar files...")
    for key, config in PILLAR_CONFIG.items():
        filepath = DATA_DIR / config["file"]
        if filepath.exists():
            practices = load_json(filepath)
            content = generate_pillar_md(key, config, practices)
            output_path = OUTPUT_DIR / "pillars" / f"{key}.md"
            output_path.write_text(content)
            line_count = len(content.split("\n"))
            print(f"  {key}.md: {len(practices)} practices, {line_count} lines")

    # Generate lens files
    print("Generating lens files...")
    for key, config in LENS_CONFIG.items():
        lens_dir = DATA_DIR / "lens" / config["dir"]
        if lens_dir.exists():
            practices = []
            for f in lens_dir.glob("*.json"):
                practices.extend(load_json(f))
            if practices:
                content = generate_lens_md(key, config, practices)
                output_path = OUTPUT_DIR / "lenses" / f"{key}.md"
                output_path.write_text(content)
                line_count = len(content.split("\n"))
                print(f"  {key}.md: {len(practices)} practices, {line_count} lines")

    # Generate DevOps files
    print("Generating DevOps files...")
    all_capabilities = []
    for code, config in DEVOPS_SAGAS.items():
        saga_dir = DATA_DIR / "lens" / "devops" / config["dir"]
        if saga_dir.exists():
            capabilities = []
            for f in saga_dir.glob("*.json"):
                cap_data = load_json(f)
                capabilities.append(cap_data)
                all_capabilities.append(cap_data)
            if capabilities:
                content = generate_devops_saga_md(code, config, capabilities)
                output_path = OUTPUT_DIR / "devops" / f"{config['dir']}.md"
                output_path.write_text(content)
                line_count = len(content.split("\n"))
                print(
                    f"  {config['dir']}.md: {len(capabilities)} capabilities, {line_count} lines"
                )

    # Generate DevOps index
    devops_index = generate_devops_index_md(all_capabilities)
    (OUTPUT_DIR / "devops" / "index.md").write_text(devops_index)
    print(f"  index.md: overview of {len(all_capabilities)} capabilities")

    # Generate main index
    print("Generating main index...")
    index_content = generate_index_md()
    (OUTPUT_DIR / "index.md").write_text(index_content)
    print("  index.md: main data index")

    print("\nDone!")


if __name__ == "__main__":
    main()
