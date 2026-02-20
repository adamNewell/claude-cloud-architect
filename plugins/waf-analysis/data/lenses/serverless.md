# Serverless Lens Best Practices

Best practices for serverless applications using Lambda, API Gateway, etc.

## Contents

- [Serverless Lens Best Practices](#serverless-lens-best-practices)
  - [Contents](#contents)
  - [COST\_OPTIMIZATION](#cost_optimization)
  - [OPERATIONAL\_EXCELLENCE](#operational_excellence)
  - [PERFORMANCE\_EFFICIENCY](#performance_efficiency)
  - [RELIABILITY](#reliability)
  - [SECURITY](#security)
  - [SUSTAINABILITY](#sustainability)

## COST_OPTIMIZATION

| ID             | Title                                                                         | Risk   |
| :------------- | :---------------------------------------------------------------------------- | :----- |
| SLSCOST01-BP01 | Optimize Lambda function performance to reduce costs                          | HIGH   |
| SLSCOST01-BP02 | Right-size Lambda function memory for optimal cost-performance ratio          | HIGH   |
| SLSCOST01-BP03 | Optimize logging ingestion and storage costs                                  | MEDIUM |
| SLSCOST01-BP04 | Leverage VPC endpoints to reduce data transfer costs                          | MEDIUM |
| SLSCOST01-BP05 | Choose appropriate DynamoDB capacity mode for cost optimization               | MEDIUM |
| SLSCOST01-BP06 | Use Step Functions Express Workflows for high-volume short-duration workloads | MEDIUM |
| SLSCOST01-BP07 | Use direct service integrations to reduce Lambda invocations                  | MEDIUM |
| SLSCOST01-BP08 | Optimize Lambda function code to reduce execution time                        | MEDIUM |
| SLSCOST01-BP09 | Use resource tagging for cost allocation and visibility                       | MEDIUM |
| SLSCOST01-BP10 | Use data-driven decisions over haste-guided over-provisioning                 | MEDIUM |

## OPERATIONAL_EXCELLENCE

| ID            | Title                                                                              | Risk   |
| :------------ | :--------------------------------------------------------------------------------- | :----- |
| SLSOPS01-BP01 | Use CloudWatch metrics and automated dashboards to monitor serverless applications | HIGH   |
| SLSOPS01-BP02 | Configure CloudWatch Alarms at individual and aggregate levels                     | HIGH   |
| SLSOPS01-BP04 | Implement centralized and structured logging using JSON format                     | HIGH   |
| SLSOPS01-BP06 | Enable AWS X-Ray for distributed tracing                                           | HIGH   |
| SLSOPS01-BP09 | Implement comprehensive testing strategies for serverless applications             | HIGH   |
| SLSOPS01-BP10 | Use infrastructure as code and serverless frameworks for deployment                | HIGH   |
| SLSOPS01-BP11 | Implement safe deployments with canary or linear strategies                        | HIGH   |
| SLSOPS01-BP03 | Define business, customer experience, system, and operational metrics              | MEDIUM |
| SLSOPS01-BP05 | Log correlation IDs and pass them to downstream systems                            | MEDIUM |
| SLSOPS01-BP07 | Use X-Ray annotations and subsegments for detailed tracing                         | MEDIUM |
| SLSOPS01-BP08 | Use environment variables and external configuration stores                        | MEDIUM |

## PERFORMANCE_EFFICIENCY

| ID            | Title                                                                        | Risk   |
| :------------ | :--------------------------------------------------------------------------- | :----- |
| SLSPER01-BP01 | Run performance tests at steady and burst rates                              | HIGH   |
| SLSPER01-BP03 | Test different Lambda memory settings and optimize static initialization     | HIGH   |
| SLSPER01-BP02 | Choose appropriate API Gateway endpoint type for your use case               | MEDIUM |
| SLSPER01-BP04 | Use Lambda provisioned concurrency for consistent low-latency performance    | MEDIUM |
| SLSPER01-BP05 | Configure Lambda VPC access only when necessary                              | MEDIUM |
| SLSPER01-BP06 | Choose between Step Functions Standard and Express Workflows                 | MEDIUM |
| SLSPER01-BP07 | Choose DynamoDB capacity mode based on traffic patterns                      | MEDIUM |
| SLSPER01-BP08 | Use Kinesis enhanced fan-out for multiple consumer scenarios                 | MEDIUM |
| SLSPER01-BP09 | Monitor Lambda performance metrics with CloudWatch and AWS Compute Optimizer | MEDIUM |
| SLSPER01-BP10 | Consider provisioned concurrency cost tradeoffs                              | MEDIUM |

## RELIABILITY

| ID            | Title                                                                   | Risk   |
| :------------ | :---------------------------------------------------------------------- | :----- |
| SLSREL01-BP01 | Enable API Gateway throttling to enforce access patterns                | HIGH   |
| SLSREL01-BP03 | Use Lambda concurrency controls to protect backend systems              | HIGH   |
| SLSREL02-BP01 | Use asynchronous calls and event-driven architectures                   | HIGH   |
| SLSREL02-BP02 | Manage transaction, partial, and intermittent failures                  | HIGH   |
| SLSREL02-BP03 | Manage duplicate and unwanted events with idempotency                   | HIGH   |
| SLSREL02-BP04 | Use dead-letter queues to capture and retry failed transactions         | HIGH   |
| SLSREL02-BP05 | Use Step Functions for orchestrating long-running transactions          | HIGH   |
| SLSREL01-BP02 | Use API keys with usage plans for granular throttling and metering      | MEDIUM |
| SLSREL01-BP04 | Use Amazon RDS Proxy for Lambda database connections                    | MEDIUM |
| SLSREL01-BP05 | Use Kinesis Data Streams to control asynchronous processing concurrency | MEDIUM |
| SLSREL02-BP06 | Implement the Saga pattern for distributed transaction rollback         | MEDIUM |
| SLSREL02-BP07 | Review and tune SDK back-off and retry settings                         | MEDIUM |
| SLSREL02-BP08 | Choose appropriate Step Functions workflow type for your workload       | MEDIUM |
| SLSREL02-BP09 | Consider scaling patterns at burst rates                                | MEDIUM |

## SECURITY

| ID            | Title                                                                             | Risk   |
| :------------ | :-------------------------------------------------------------------------------- | :----- |
| SLSSEC01-BP01 | Use AWS_IAM authorization for API Gateway with least-privileged permissions       | HIGH   |
| SLSSEC01-BP06 | Use AWS WAF to protect APIs against common web attacks                            | HIGH   |
| SLSSEC02-BP01 | Follow least-privileged access for Lambda function IAM roles                      | HIGH   |
| SLSSEC02-BP02 | Avoid sharing IAM roles across multiple Lambda functions                          | HIGH   |
| SLSSEC03-BP01 | Validate and sanitize inbound events                                              | HIGH   |
| SLSSEC03-BP03 | Store secrets in AWS Secrets Manager with rotation capabilities                   | HIGH   |
| SLSSEC03-BP04 | Encrypt sensitive data at all layers before processing                            | HIGH   |
| SLSSEC03-BP05 | Track vulnerabilities in application dependencies                                 | HIGH   |
| SLSSEC01-BP02 | Use Lambda authorizers for custom authentication with existing Identity Providers | MEDIUM |
| SLSSEC01-BP03 | Use Amazon Cognito user pools for user management and social identity federation  | MEDIUM |
| SLSSEC01-BP04 | Use API Gateway resource policies to restrict API access                          | MEDIUM |
| SLSSEC01-BP05 | Configure mutual TLS authentication for application-to-application scenarios      | MEDIUM |
| SLSSEC02-BP03 | Use cross-account Lambda authorizers to centralize security practices             | MEDIUM |
| SLSSEC03-BP02 | Use AWS Signer to sign Lambda code and enforce trusted deployments                | MEDIUM |
| SLSSEC03-BP06 | Configure Lambda VPC access only when necessary                                   | MEDIUM |
| SLSSEC03-BP07 | Use dynamic IAM authentication for service-to-service communication               | MEDIUM |

## SUSTAINABILITY

| ID            | Title                                                              | Risk |
| :------------ | :----------------------------------------------------------------- | :--- |
| SLSSUS01-BP01 | Leverage serverless architecture inherent sustainability benefits  | LOW  |
| SLSSUS01-BP02 | Optimize Lambda function efficiency to reduce environmental impact | LOW  |
| SLSSUS01-BP03 | Use managed services to benefit from AWS infrastructure efficiency | LOW  |
