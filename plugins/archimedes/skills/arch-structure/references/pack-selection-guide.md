# Pack Selection Guide

Load this file before selecting packs for a new session. It contains the full decision logic, baseline expectations, and gap-reporting procedures.

## Pack Selection Decision Table

| Repo characteristics | Packs |
|---|---|
| Pure TypeScript/JavaScript or Python, no cloud services | `core` |
| AWS Lambda, API Gateway, DynamoDB, SQS, SNS | `core,aws-serverless` |
| IoT devices, MQTT messaging, AWS IoT Core | `core,aws-serverless,iot-core` |
| Greengrass v2 components or CloudFormation manifests | `core,iot-core` |
| AWS + IoT Core SDK (non-Greengrass, direct MQTT) | `core,aws-serverless,iot-core` |
| Monorepo | Scan each service subdirectory separately with the packs for that service |

**Start narrow.** When uncertain, use only `core` first and add packs based on what `core` finds. Adding all three packs to a web service produces false-positive IoT DEBT tags.

**Greengrass vs IoT Core:** A Greengrass v2 component that uses IPC (not direct MQTT) only needs `iot-core`. If the same component also has Lambda-like handlers triggered by IoT Rules Engine, add `aws-serverless`.

## Pack Coverage Details

| Pack | Coverage |
|---|---|
| core | Express/FastAPI routes, axios/requests HTTP clients, EventEmitter, Repository/Service classes, hardcoded secrets |
| aws-serverless | Lambda handlers (ESM/CJS/Python), Powertools, cold-start risk, DynamoDB v3, SQS, SNS, EventBridge, Step Functions |
| iot-core | MQTT connect/subscribe/publish/wildcard, Device Shadow, IoT Rules Engine, Greengrass v2 IPC (pub/sub, IoT Core bridge, config, shadow), GGv2 CFn resources, v1 SDK anti-pattern |

## Baseline Tag Densities

Use these baselines to detect silent failures or unexpected gaps:

| Service size / type | Expected PATTERN | Expected DEPENDENCY | Expected DEBT |
|---|---|---|---|
| Small Lambda (1-3 functions, ~500 LOC) | 3-10 | 5-15 | 0-3 |
| Medium TypeScript service (~5k LOC, Express/DynamoDB) | 15-40 | 10-25 | 0-8 |
| IoT device service (MQTT + shadow + Greengrass) | 20-60 | 15-35 | 2-10 |
| Large service or library (~20k LOC) | 80-200+ | 40-100 | 5-25 |

**Warning signals:**
- Total tags under 5 on a non-trivial repo → ast-grep probably isn't matching the language; verify with `ast-grep --lang typescript` on one file directly
- DEBT > 30% of PATTERN → flag in session report, don't treat as normal noise; this level of debt concentration warrants explicit documentation
- 0 DEPENDENCY tags for a service that clearly uses external services → the pack may not cover the specific SDK version or import style

## Value JSON Field Reference

Post-scan queries use `json_extract(value,'$.field')`. Common fields by tag kind:

| kind | Field | Description |
|---|---|---|
| PATTERN | `$.pattern_name` | Friendly name, e.g. `"lambda-handler"` |
| PATTERN | `$.subkind` | More specific type, e.g. `"esm-lambda-handler"` |
| PATTERN | `$.line` | Line number of the match |
| DEPENDENCY | `$.subkind` | Dependency type, e.g. `"dynamodb-client"` |
| DEPENDENCY | `$.line` | Line number |
| DEBT | `$.subkind` | Debt type, e.g. `"dynamodb-scan-antipattern"` |
| DEBT | `$.note` | Human-readable description of why it's a problem |
| DEBT | `$.line` | Line number |

Full schema: `cookbook/tag-store/schema.md` under "value JSON Conventions."

## Coverage Gap Reporting

When packs don't cover a service's actual stack, document the gap explicitly in the session findings:

> **Coverage Gap**: `services/payments-service` — uses Stripe SDK and Prisma ORM. No patterns exist for these frameworks. Structural scan produced 0 DEPENDENCY tags for external API calls and database access in this service. Tier 2 semantic search (arch-search) is required to identify these dependencies.

A coverage gap note prevents the absence-of-evidence problem: a consumer reading "0 DEPENDENCY tags" for a service should see this note, not assume the service has no dependencies.
