# Mergers & Acquisitions Lens Best Practices

Best practices for M&A technology integration.

## Contents

- [Mergers \& Acquisitions Lens Best Practices](#mergers--acquisitions-lens-best-practices)
  - [Contents](#contents)
  - [COST\_OPTIMIZATION](#cost_optimization)
  - [OPERATIONAL\_EXCELLENCE](#operational_excellence)
  - [PERFORMANCE\_EFFICIENCY](#performance_efficiency)
  - [RELIABILITY](#reliability)
  - [SECURITY](#security)
  - [SUSTAINABILITY](#sustainability)

## COST_OPTIMIZATION

| ID             | Title                                                                                                       | Risk   |
| :------------- | :---------------------------------------------------------------------------------------------------------- | :----- |
| MNACOST01-BP01 | Perform pricing model analysis for the combined entities                                                    | MEDIUM |
| MNACOST01-BP02 | Optimize accounts through various means, such as EC2 instance types, Savings Plans, and Amazon S3 lifecycle | MEDIUM |
| MNACOST01-BP03 | Discover and realize additional cost savings                                                                | MEDIUM |
| MNACOST01-BP04 | Migrate to Regions based on cost                                                                            | MEDIUM |
| MNACOST01-BP05 | Use managed services for lower TCO                                                                          | MEDIUM |
| MNACOST01-BP06 | Select third-party agreements with cost efficient terms                                                     | MEDIUM |
| MNACOST02-BP01 | Configure billing and cost management tools across both organizations                                       | MEDIUM |
| MNACOST02-BP02 | Combine both organizations information to cost and usage                                                    | MEDIUM |
| MNACOST02-BP03 | Allocate costs based on workload metrics                                                                    | MEDIUM |
| MNACOST02-BP04 | Configure a bill or chargeback strategy using custom usage tags                                             | MEDIUM |
| MNACOST03-BP01 | Perform data transfer modeling                                                                              | MEDIUM |
| MNACOST03-BP02 | Select components to optimize data transfer cost                                                            | MEDIUM |
| MNACOST03-BP03 | Implement services to reduce data transfer costs                                                            | MEDIUM |
| MNACOST03-BP04 | Delete redundant data stores using policies                                                                 | MEDIUM |
| MNACOST03-BP05 | Analyze data integration pattern of the combined organizations                                              | MEDIUM |

## OPERATIONAL_EXCELLENCE

| ID            | Title                                                                                                               | Risk   |
| :------------ | :------------------------------------------------------------------------------------------------------------------ | :----- |
| MNAOPS04-BP03 | Have a process in place for customer migration (if necessary)                                                       | HIGH   |
| MNAOPS07-BP03 | Document a combined-products strategy                                                                               | HIGH   |
| MNAOPS01-BP01 | Workloads from both organizations have identified owners                                                            | MEDIUM |
| MNAOPS01-BP02 | Processes and procedures have identified owners                                                                     | MEDIUM |
| MNAOPS01-BP03 | Operations activities have identified owners responsible for their performance                                      | MEDIUM |
| MNAOPS01-BP04 | Create a Cloud Center of Excellence team                                                                            | MEDIUM |
| MNAOPS01-BP05 | Mechanisms exist to request process additions, changes, and exceptions                                              | MEDIUM |
| MNAOPS01-BP06 | Both companies have identified the cloud skills and competencies to enable the resources                            | MEDIUM |
| MNAOPS02-BP01 | Each company has identified their primary Region                                                                    | MEDIUM |
| MNAOPS02-BP02 | Configure AWS Control Tower, AWS Config, and AWS CloudFormation                                                     | MEDIUM |
| MNAOPS02-BP03 | Automate infrastructure as code (IaC) using Cloud Formation or Terraform                                            | MEDIUM |
| MNAOPS02-BP04 | Automate resource compliance using tools like AWS Config                                                            | MEDIUM |
| MNAOPS03-BP01 | Structure your organization following AWS best practices                                                            | MEDIUM |
| MNAOPS03-BP02 | Merge the management accounts of both organizations                                                                 | MEDIUM |
| MNAOPS03-BP03 | Determine if it's appropriate to separate management accounts                                                       | MEDIUM |
| MNAOPS03-BP04 | Merge logging, security, and infrastructure organizations                                                           | MEDIUM |
| MNAOPS03-BP05 | Define a backup strategy for each organization                                                                      | MEDIUM |
| MNAOPS04-BP01 | Standardize documented operational processes (like CI/CD and deployment)                                            | MEDIUM |
| MNAOPS04-BP02 | Retire or consolidate redundant apps and data-stores                                                                | MEDIUM |
| MNAOPS04-BP04 | Understand third-party integrations and dependencies                                                                | MEDIUM |
| MNAOPS04-BP05 | Perform all customizations through configuration, and change them as self-serve or company-controlled feature flags | MEDIUM |
| MNAOPS05-BP01 | Configure AWS resource tags                                                                                         | MEDIUM |
| MNAOPS05-BP02 | Group applications based on tags                                                                                    | MEDIUM |
| MNAOPS05-BP03 | Associate tags with each configured resource (during provisioning)                                                  | MEDIUM |
| MNAOPS05-BP04 | Set up security based on tags                                                                                       | MEDIUM |
| MNAOPS05-BP05 | Perform cost allocation based on tags                                                                               | MEDIUM |
| MNAOPS06-BP01 | The seller has an extensive list of all IP and key innovations (and related documentation)                          | MEDIUM |
| MNAOPS06-BP02 | Document open-source software integrations                                                                          | MEDIUM |
| MNAOPS06-BP03 | Hold patents on key platform technologies                                                                           | LOW    |
| MNAOPS07-BP01 | Document duplicate workloads and features                                                                           | MEDIUM |
| MNAOPS07-BP02 | Identify the impact of product features on customers from both companies                                            | MEDIUM |
| MNAOPS07-BP04 | Verify that teams understand critical customer requirements                                                         | MEDIUM |
| MNAOPS07-BP05 | Modify your existing roadmap to incorporate the new organization                                                    | MEDIUM |
| MNAOPS08-BP01 | Document mechanisms for both product teams to operate collaboratively                                               | MEDIUM |
| MNAOPS08-BP02 | Verify that key product teams have a post-integration product strategy in place                                     | MEDIUM |
| MNAOPS08-BP03 | Review, retire, and promote products and roadmaps based on customer focus                                           | MEDIUM |
| MNAOPS09-BP01 | Create a Configuration Management Database (CMDB) or infrastructure repository                                      | MEDIUM |

## PERFORMANCE_EFFICIENCY

| ID            | Title                                                                                                          | Risk   |
| :------------ | :------------------------------------------------------------------------------------------------------------- | :----- |
| MNAPER02-BP04 | Rearchitect to scale for new customers                                                                         | HIGH   |
| MNAPER01-BP01 | Understand the available services and resources                                                                | MEDIUM |
| MNAPER01-BP02 | Define a process for architectural choices                                                                     | MEDIUM |
| MNAPER01-BP03 | Factor cost requirements into decisions                                                                        | MEDIUM |
| MNAPER01-BP04 | Use guidance from your cloud provider or an appropriate partner                                                | MEDIUM |
| MNAPER01-BP05 | Benchmark workloads from both organization                                                                     | MEDIUM |
| MNAPER02-BP01 | Scale current architecture and hosting through manual or automatic means                                       | MEDIUM |
| MNAPER02-BP02 | Remediate bottlenecks that prevent scaling, and use automatic scaling or serverless resources when appropriate | MEDIUM |
| MNAPER02-BP03 | Perform periodic static provisioning for peak usage in reaction to monitoring data                             | MEDIUM |

## RELIABILITY

| ID            | Title                                                                                                                     | Risk   |
| :------------ | :------------------------------------------------------------------------------------------------------------------------ | :----- |
| MNAREL01-BP01 | Incorporate fault tolerance to achieve high availability as required for your industry vertical and customer expectations | HIGH   |
| MNAREL01-BP02 | Establish SLAs, including DR RTO and RPO for the combined organization                                                    | HIGH   |
| MNAREL02-BP01 | Establish alternatives for each critical external service to switch over to if needed, or balance traffic across          | HIGH   |
| MNAREL02-BP02 | Have legal agreements in place guaranteeing the right of continued usage of all external services                         | HIGH   |
| MNAREL01-BP03 | Establish a deployment strategy for combined company                                                                      | MEDIUM |
| MNAREL01-BP04 | Establish an SRE team and process for the combined organization                                                           | MEDIUM |

## SECURITY

| ID            | Title                                                                                         | Risk   |
| :------------ | :-------------------------------------------------------------------------------------------- | :----- |
| MNASEC01-BP01 | Use a centralized identity provider                                                           | HIGH   |
| MNASEC01-BP02 | Use a common authorization approach                                                           | HIGH   |
| MNASEC01-BP04 | Store and use secrets securely                                                                | HIGH   |
| MNASEC03-BP01 | Standardize root email address (root account email access)                                    | HIGH   |
| MNASEC03-BP02 | Define data access control mechanisms for combined systems                                    | HIGH   |
| MNASEC03-BP03 | Create a consistent mechanism for data classification and protection (in-transit and at rest) | HIGH   |
| MNASEC03-BP04 | Automate data backup process for combined systems                                             | HIGH   |
| MNASEC04-BP04 | Understand both the buyer's and seller's compliance needs                                     | HIGH   |
| MNASEC05-BP03 | Define a connectivity model for post-integration or divestiture                               | HIGH   |
| MNASEC05-BP05 | Define a security strategy for data flowing between the two enterprises                       | HIGH   |
| MNASEC01-BP03 | Use AWS temporary credentials                                                                 | MEDIUM |
| MNASEC01-BP05 | Create a common policy for auditing and rotating credentials                                  | MEDIUM |
| MNASEC02-BP01 | Use an AWS-defined process to report vulnerabilities                                          | MEDIUM |
| MNASEC02-BP02 | Use AWS services with self-service within the existing management console                     | MEDIUM |
| MNASEC02-BP03 | Use third-party security tools when necessary due to integration with on-premises resources   | MEDIUM |
| MNASEC02-BP04 | Migrate to a common set of tools, including partner tools from marketplace                    | MEDIUM |
| MNASEC02-BP05 | Create a common policy for auditing and rotating credentials                                  | MEDIUM |
| MNASEC03-BP05 | Automate responses to data security events                                                    | MEDIUM |
| MNASEC04-BP01 | The seller is using AWS services (marketplace) for data governance                            | MEDIUM |
| MNASEC04-BP02 | Document consistent mechanisms for data classification                                        | MEDIUM |
| MNASEC04-BP03 | Document processes to maintain data integrity within AWS services                             | MEDIUM |
| MNASEC05-BP01 | Both organizations have documented network architecture                                       | MEDIUM |
| MNASEC05-BP02 | Define a strategy for overlapping Classless Inter-Domain Routing (CIDR)                       | MEDIUM |
| MNASEC05-BP04 | Define a strategy for inter-enterprise DNS resolution                                         | MEDIUM |

## SUSTAINABILITY

| ID            | Title                                                 | Risk   |
| :------------ | :---------------------------------------------------- | :----- |
| MNASUS01-BP01 | Perform due diligence                                 | MEDIUM |
| MNASUS01-BP02 | Establish clear sustainability objectives             | MEDIUM |
| MNASUS01-BP03 | Integrate sustainability into the acquisition process | MEDIUM |
| MNASUS01-BP04 | Communicate expectations                              | MEDIUM |
| MNASUS01-BP05 | Provide resources and support                         | MEDIUM |
| MNASUS02-BP01 | Establish a sustainability committee                  | MEDIUM |
| MNASUS02-BP02 | Conduct a sustainability audit                        | MEDIUM |
| MNASUS02-BP03 | Communicate the importance of sustainability          | MEDIUM |
| MNASUS02-BP04 | Integrate sustainability into the integration plan    | MEDIUM |
| MNASUS02-BP05 | Monitor and evaluate sustainability performance       | MEDIUM |
