# Migration Lens Best Practices

Best practices for cloud migration projects.

## Contents

- [Migration Lens Best Practices](#migration-lens-best-practices)
  - [Contents](#contents)
  - [COST\_OPTIMIZATION](#cost_optimization)
  - [OPERATIONAL\_EXCELLENCE](#operational_excellence)
  - [PERFORMANCE\_EFFICIENCY](#performance_efficiency)
  - [RELIABILITY](#reliability)
  - [SECURITY](#security)
  - [SUSTAINABILITY](#sustainability)

## COST_OPTIMIZATION

| ID             | Title                                                                                           | Risk   |
| :------------- | :---------------------------------------------------------------------------------------------- | :----- |
| MIGCOST01-BP01 | Thoroughly assess existing infrastructure usage and application dependencies prior to migration | HIGH   |
| MIGCOST02-BP01 | Leverage existing tools to automate your migration                                              | HIGH   |
| MIGCOST03-BP01 | Plan and set up cost and usage governance with IAM policies                                     | HIGH   |
| MIGCOST03-BP02 | Define a cost allocation strategy that meets your organization's financial management process   | HIGH   |
| MIGCOST03-BP03 | Design a strategy to monitor, track and analyze AWS cost and usage                              | HIGH   |
| MIGCOST04-BP02 | Monitor spend and limit unintended costs with budgeting and forecasting tools                   | HIGH   |
| MIGCOST05-BP01 | Leverage the right purchase options and scalable architecture                                   | HIGH   |
| MIGCOST01-BP02 | Leverage AWS programs and workshops to remove blockers and accelerate migrations                | MEDIUM |
| MIGCOST02-BP02 | Minimize the number of applications and amount of data migrated                                 | MEDIUM |
| MIGCOST02-BP03 | Right-size replication servers to prevent bottlenecks without over-provisioning                 | MEDIUM |
| MIGCOST04-BP01 | Create a deliberate metrics strategy to help demystify cloud economics                          | MEDIUM |
| MIGCOST04-BP03 | Use AWS Cost Anomaly Detection to quickly improve cost controls                                 | MEDIUM |
| MIGCOST04-BP04 | Use dashboards with pre-built visualizations for detailed cost and usage view                   | MEDIUM |
| MIGCOST05-BP02 | Identify resources that are candidates for cost optimization later                              | MEDIUM |
| MIGCOST06-BP01 | Use automation to re-evaluate compute usage periodically                                        | MEDIUM |
| MIGCOST07-BP01 | Create a plan early to optimize after initial migration                                         | MEDIUM |

## OPERATIONAL_EXCELLENCE

| ID            | Title                                                                                                                                                                             | Risk   |
| :------------ | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :----- |
| MIGOPS01-BP01 | Your migration plan must be informed by and reflect technology, processes and business                                                                                            | HIGH   |
| MIGOPS02-BP01 | Define and measure key performance indicators (KPIs) which can be shared with all teams involved in the migration                                                                 | HIGH   |
| MIGOPS03-BP01 | Invest time and effort to ensure the required migration and operations skills are captured, skills gaps identified, and training plans are implemented and managed                | HIGH   |
| MIGOPS05-BP01 | Build a Cloud Center of Excellence (CCoE) team within your organization as part of your migration planning                                                                        | HIGH   |
| MIGOPS06-BP01 | Define Cloud Operations Strategy: understand your current operating model, processes and tools, and explore how to implement them efficiently, securely and reliably in the cloud | HIGH   |
| MIGOPS08-BP01 | Ensure you have a testing strategy in place                                                                                                                                       | HIGH   |
| MIGOPS04-BP01 | Build a comprehensive resource model for your migration that reflects the demands of the migration as well as the regular activities                                              | MEDIUM |
| MIGOPS06-BP02 | Align AWS operational requirements with your existing tools and identify any gaps                                                                                                 | MEDIUM |
| MIGOPS06-BP03 | Regularly test your operations in the cloud                                                                                                                                       | MEDIUM |
| MIGOPS07-BP01 | Calculate your potential migration velocity using both technical and non-technical perspectives                                                                                   | MEDIUM |
| MIGOPS09-BP01 | Determine if your current CI/CD pipeline works on AWS                                                                                                                             | MEDIUM |
| MIGOPS09-BP02 | Provision resources through infrastructure as code (IaC) templates                                                                                                                | MEDIUM |

## PERFORMANCE_EFFICIENCY

| ID            | Title                                                                                                                                  | Risk   |
| :------------ | :------------------------------------------------------------------------------------------------------------------------------------- | :----- |
| MIGPER01-BP01 | Understand the performance characteristics of your current infrastructure to select the best performant optimized cloud infrastructure | HIGH   |
| MIGPER03-BP01 | Evaluate different methods to migrate data and select the best for your use case                                                       | HIGH   |
| MIGPER04-BP01 | Select the storage solution based on the characteristics of your workloads                                                             | HIGH   |
| MIGPER05-BP01 | Establish reliable network connectivity from on-premises to AWS to ensure performance                                                  | HIGH   |
| MIGPER06-BP01 | Identify a migration strategy for your network components                                                                              | HIGH   |
| MIGPER07-BP02 | Select the best performing cloud infrastructure that can scale for additional workloads                                                | HIGH   |
| MIGPER08-BP01 | Perform stress and user acceptance tests on migrated workloads before cutover                                                          | HIGH   |
| MIGPER02-BP01 | Evaluate operating systems and versions that are running in your environment                                                           | MEDIUM |
| MIGPER04-BP02 | Choose the optimal storage solutions for specialized workloads                                                                         | MEDIUM |
| MIGPER04-BP03 | Evaluate different storage tiers to meet your migrated workload's performance                                                          | MEDIUM |
| MIGPER05-BP02 | Assure that network performance is not impacted by external factors                                                                    | MEDIUM |
| MIGPER07-BP01 | Identify the right CloudWatch metrics to capture or detect anomaly for shared services                                                 | MEDIUM |
| MIGPER07-BP03 | Reduce the blast radius for performance impact into a single account                                                                   | MEDIUM |
| MIGPER07-BP04 | Benchmark existing workloads for performance                                                                                           | MEDIUM |
| MIGPER08-BP02 | Review and implement lessons learned from previous migration waves                                                                     | MEDIUM |
| MIGPER08-BP03 | Perform a Well-Architected Framework Review on each iteration of the migrated workload                                                 | MEDIUM |
| MIGPER09-BP01 | Generate alarm-based notifications for metric's threshold breach                                                                       | MEDIUM |
| MIGPER09-BP02 | Determine the need for real-time or near real-time monitoring solution                                                                 | MEDIUM |
| MIGPER09-BP03 | Implement CloudWatch or Quicksight dashboard as single pane view for visualizing metrics                                               | MEDIUM |
| MIGPER09-BP04 | Set up automated testing for your application metrics                                                                                  | MEDIUM |
| MIGPER09-BP05 | Re-evaluate compute usage with AWS Trusted Advisor, AWS Compute Optimizer, or partner tools                                            | MEDIUM |

## RELIABILITY

| ID            | Title                                                                                              | Risk   |
| :------------ | :------------------------------------------------------------------------------------------------- | :----- |
| MIGREL01-BP01 | Define SLAs across all applications or environments and confirm them with your business team       | HIGH   |
| MIGREL01-BP03 | Map AWS Global Infrastructure to your business SLAs before migration starts                        | HIGH   |
| MIGREL02-BP02 | Update the risk assessment for the type of disaster events covered by your BCP                     | HIGH   |
| MIGREL02-BP03 | Define the recovery point objective (RPO) and recovery time objective (RTO) targets                | HIGH   |
| MIGREL02-BP04 | Select a disaster recovery strategy based on cloud best practices                                  | HIGH   |
| MIGREL03-BP01 | Estimate the required maintenance window                                                           | HIGH   |
| MIGREL03-BP02 | Test the migration window and impact                                                               | HIGH   |
| MIGREL03-BP03 | Plan for failure                                                                                   | HIGH   |
| MIGREL05-BP02 | Assure that links and equipment to on-premises are highly available                                | HIGH   |
| MIGREL05-BP03 | Verify that your network design enables communication between on-premises and cloud networks       | HIGH   |
| MIGREL05-BP05 | Complete a reliable DNS design that enables resolutions to existing domains and new domains in AWS | HIGH   |
| MIGREL06-BP01 | Identify and back up all data that needs to be backed up, or reproduce the data from sources       | HIGH   |
| MIGREL07-BP01 | Deploy the workload to multiple locations                                                          | HIGH   |
| MIGREL08-BP01 | Test HA and FT for migrated workloads before cut-over, and perform DR dry-run after migration      | HIGH   |
| MIGREL01-BP02 | Define and automate runbooks and communicate them to your teams                                    | MEDIUM |
| MIGREL01-BP04 | Select tools to monitor SLAs and notify you in case thresholds are exceeded                        | MEDIUM |
| MIGREL02-BP01 | Keep your business impact analysis up-to-date                                                      | MEDIUM |
| MIGREL04-BP01 | Be aware of service quotas and constraints for migration services                                  | MEDIUM |
| MIGREL04-BP02 | Estimate the impact of new workloads on existing service quotas across accounts and Regions        | MEDIUM |
| MIGREL04-BP03 | Be aware of unchangeable service quotas and determine which accounts or VPCs workloads use         | MEDIUM |
| MIGREL05-BP01 | Provide sufficient bandwidth for normal traffic and data replication                               | MEDIUM |
| MIGREL05-BP04 | Use an IP scheme that allows for sufficient growth within cloud workloads and burst auto-scaling   | MEDIUM |
| MIGREL05-BP06 | Test network performance prior to migration                                                        | MEDIUM |
| MIGREL05-BP07 | Test network component failure                                                                     | MEDIUM |

## SECURITY

| ID            | Title                                                                        | Risk   |
| :------------ | :--------------------------------------------------------------------------- | :----- |
| MIGSEC01-BP01 | Understand the security credentials needed by the discovery tool             | HIGH   |
| MIGSEC01-BP03 | Understand the discovery tool's data security and apply appropriate controls | HIGH   |
| MIGSEC02-BP01 | Perform a tools mapping exercise                                             | HIGH   |
| MIGSEC03-BP01 | Understand, establish, and implement compliance framework                    | HIGH   |
| MIGSEC04-BP01 | Implement strong identity and least privilege principles                     | HIGH   |
| MIGSEC05-BP01 | Implement AWS multi-account structure                                        | HIGH   |
| MIGSEC06-BP01 | Establish secure connectivity to AWS                                         | HIGH   |
| MIGSEC06-BP02 | Establish network security controls                                          | HIGH   |
| MIGSEC07-BP01 | Establish security controls for protecting data at rest                      | HIGH   |
| MIGSEC08-BP01 | Establish application layer security controls                                | HIGH   |
| MIGSEC09-BP01 | Establish a data backup and restore strategy                                 | HIGH   |
| MIGSEC09-BP02 | Establish a Disaster recovery plan                                           | HIGH   |
| MIGSEC10-BP01 | Validate and use AWS native monitoring tools                                 | HIGH   |
| MIGSEC12-BP01 | Understand the data security and compliance                                  | HIGH   |
| MIGSEC13-BP01 | Understand AWS service capabilities for event detection and investigation    | HIGH   |
| MIGSEC14-BP01 | Understand AWS best practices for incident response                          | HIGH   |
| MIGSEC15-BP01 | Protect your network resources                                               | HIGH   |
| MIGSEC16-BP01 | Manage authentication for applications and databases                         | HIGH   |
| MIGSEC01-BP02 | Understand how the discovery tool works                                      | MEDIUM |
| MIGSEC08-BP02 | Optimize application security with AWS Application Migration Service         | MEDIUM |
| MIGSEC10-BP02 | Explore cloud native AWS partner monitoring tools                            | MEDIUM |
| MIGSEC11-BP01 | Perform third-party integration due diligence                                | MEDIUM |

## SUSTAINABILITY

| ID            | Title                                                                                      | Risk   |
| :------------ | :----------------------------------------------------------------------------------------- | :----- |
| MIGSUS01-BP01 | Include sustainability considerations in migration business case and assessments           | MEDIUM |
| MIGSUS02-BP01 | Choose a Region based on business requirements and sustainability goals                    | MEDIUM |
| MIGSUS03-BP01 | Focus on efficiency across all aspects of infrastructure                                   | MEDIUM |
| MIGSUS04-BP01 | Adopt metrics that can signal the sustainability of your application                       | MEDIUM |
| MIGSUS04-BP02 | Include sustainability metrics in application portfolio analysis                           | LOW    |
| MIGSUS05-BP01 | Implement efficient workload design by leveraging the underlying infrastructure            | MEDIUM |
| MIGSUS06-BP01 | Identify environments and workloads that can be consolidated or retired                    | LOW    |
| MIGSUS06-BP02 | Identify workloads that can use efficient software and architecture patterns               | LOW    |
| MIGSUS06-BP03 | Analyze data access patterns and lifecycle processes for efficiency                        | MEDIUM |
| MIGSUS06-BP04 | Understand and influence business requirements, and optimize code for sustainability goals | LOW    |
| MIGSUS07-BP01 | Implement data management practices                                                        | MEDIUM |
| MIGSUS08-BP01 | Adopt methods to reduce interim resource consumption during migration                      | MEDIUM |
