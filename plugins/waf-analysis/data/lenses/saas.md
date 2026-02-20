# SaaS Lens Best Practices

Best practices for Software-as-a-Service applications.

## Contents

- [SaaS Lens Best Practices](#saas-lens-best-practices)
  - [Contents](#contents)
  - [COST\_OPTIMIZATION](#cost_optimization)
  - [OPERATIONAL\_EXCELLENCE](#operational_excellence)
  - [PERFORMANCE\_EFFICIENCY](#performance_efficiency)
  - [RELIABILITY](#reliability)
  - [SECURITY](#security)
  - [SUSTAINABILITY](#sustainability)

## COST_OPTIMIZATION

| ID          | Title                                                                     | Risk   |
| :---------- | :------------------------------------------------------------------------ | :----- |
| SAAS05-BP01 | Design a consumption mapping model to attribute costs to tenants          | HIGH   |
| SAAS05-BP04 | Correlate tenant consumption data with AWS billing data                   | HIGH   |
| SAAS05-BP05 | Analyze cost per tenant by tier to validate business model                | HIGH   |
| SAAS05-BP02 | Capture tenant activity at API entry points for consumption approximation | MEDIUM |
| SAAS05-BP03 | Instrument microservices with detailed tenant consumption metrics         | MEDIUM |
| SAAS05-BP06 | Balance consumption granularity with instrumentation complexity           | MEDIUM |
| SAAS05-BP07 | Implement metering for consumption-based pricing models                   | MEDIUM |
| SAAS05-BP08 | Use cost per tenant insights for strategic business decisions             | MEDIUM |

## OPERATIONAL_EXCELLENCE

| ID          | Title                                                                           | Risk   |
| :---------- | :------------------------------------------------------------------------------ | :----- |
| SAAS01-BP01 | Create tenant-aware operational dashboards with health views by tenant and tier | HIGH   |
| SAAS01-BP02 | Inject tenant context into logs, metrics, and operational data                  | HIGH   |
| SAAS01-BP04 | Implement automated frictionless tenant onboarding                              | HIGH   |
| SAAS01-BP07 | Capture and analyze tenant activity and consumption metrics                     | HIGH   |
| SAAS01-BP03 | Surface views of tenant consumption across microservices                        | MEDIUM |
| SAAS01-BP05 | Separate tenant management from user management services                        | MEDIUM |
| SAAS01-BP06 | Use feature flags for tenant-specific customizations instead of code forks      | MEDIUM |
| SAAS01-BP08 | Build operational views tailored to your application architecture               | MEDIUM |

## PERFORMANCE_EFFICIENCY

| ID          | Title                                                                            | Risk   |
| :---------- | :------------------------------------------------------------------------------- | :----- |
| SAAS04-BP01 | Use siloed services selectively to address cross-tenant performance issues       | HIGH   |
| SAAS04-BP02 | Use container-based scaling for rapid response to tenant load spikes             | HIGH   |
| SAAS04-BP03 | Use serverless architectures to align consumption with tenant activity           | HIGH   |
| SAAS04-BP04 | Minimize gap between infrastructure consumption and tenant activity              | HIGH   |
| SAAS04-BP05 | Use Lambda reserved concurrency to differentiate tier performance                | MEDIUM |
| SAAS04-BP06 | Configure Kubernetes resource quotas and limit ranges for tier-based performance | MEDIUM |
| SAAS04-BP07 | Introduce architectural optimizations for premium tier tenants                   | MEDIUM |
| SAAS04-BP08 | Use throttling policies to control tenant performance by tier                    | MEDIUM |

## RELIABILITY

| ID          | Title                                                                    | Risk   |
| :---------- | :----------------------------------------------------------------------- | :----- |
| SAAS03-BP01 | Implement throttling to limit tenant load impact on system reliability   | HIGH   |
| SAAS03-BP02 | Configure tier-based usage plans to protect premium tenants              | HIGH   |
| SAAS03-BP03 | Publish tenant-aware health metrics for proactive reliability monitoring | HIGH   |
| SAAS03-BP04 | Create cross-tenant impact tests to validate noisy neighbor protection   | HIGH   |
| SAAS03-BP10 | Continuously test tenant isolation enforcement                           | HIGH   |
| SAAS03-BP05 | Test tenant consumption patterns with varied load profiles               | MEDIUM |
| SAAS03-BP06 | Create tenant workflow tests to identify bottlenecks                     | MEDIUM |
| SAAS03-BP07 | Test tenant onboarding resilience under spike conditions                 | MEDIUM |
| SAAS03-BP08 | Test API throttling policies across tenant tiers                         | MEDIUM |
| SAAS03-BP09 | Test data distribution and sharding policies for tenant data             | MEDIUM |

## SECURITY

| ID          | Title                                                                        | Risk   |
| :---------- | :--------------------------------------------------------------------------- | :----- |
| SAAS02-BP01 | Bind user identity to tenant identity as a first-class construct             | HIGH   |
| SAAS02-BP02 | Flow tenant context through all architecture layers via JWT tokens           | HIGH   |
| SAAS02-BP03 | Implement tenant isolation as a foundational requirement                     | HIGH   |
| SAAS02-BP04 | Control isolation through shared mechanisms outside developer code           | HIGH   |
| SAAS02-BP05 | Implement isolation for both siloed and pooled resource models               | HIGH   |
| SAAS02-BP08 | Create IAM policies during onboarding to support tenant isolation            | HIGH   |
| SAAS02-BP06 | Build custom isolation solutions when out-of-the-box options don't exist     | MEDIUM |
| SAAS02-BP07 | Use separate Amazon Cognito user pools for per-tenant identity customization | MEDIUM |

## SUSTAINABILITY

| ID          | Title                                                                       | Risk   |
| :---------- | :-------------------------------------------------------------------------- | :----- |
| SAAS06-BP01 | Understand silo, pool, and bridge deployment models for resource efficiency | MEDIUM |
| SAAS06-BP02 | Understand operational tradeoffs of each deployment model                   | MEDIUM |
| SAAS06-BP03 | Use managed services to maintain optimal hardware utilization               | MEDIUM |
| SAAS06-BP04 | Right-size compute resources and use auto-scaling based on utilization      | MEDIUM |
| SAAS06-BP05 | Use serverless computing to optimize resource utilization automatically     | MEDIUM |
| SAAS06-BP06 | Maintain updated inventory of infrastructure resources per tenant           | MEDIUM |
| SAAS06-BP07 | Maintain and test tenant off-boarding runbooks                              | MEDIUM |
| SAAS06-BP08 | Automate tenant decommissioning with approval workflows                     | MEDIUM |
| SAAS06-BP09 | Archive tenant data before decommissioning for compliance and reactivation  | LOW    |
| SAAS06-BP10 | Instrument per-tenant metrics for footprint visibility                      | MEDIUM |
| SAAS06-BP11 | Provide per-tenant footprint dashboards including carbon emission data      | LOW    |
