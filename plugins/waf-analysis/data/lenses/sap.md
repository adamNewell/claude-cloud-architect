# SAP Lens Best Practices

Best practices for SAP workloads on AWS.

## Contents

- [SAP Lens Best Practices](#sap-lens-best-practices)
  - [Contents](#contents)
  - [COST\_OPTIMIZATION](#cost_optimization)
  - [OPERATIONAL\_EXCELLENCE](#operational_excellence)
  - [PERFORMANCE\_EFFICIENCY](#performance_efficiency)
  - [RELIABILITY](#reliability)
  - [SECURITY](#security)
  - [SUSTAINABILITY](#sustainability)

## COST_OPTIMIZATION

| ID         | Title                                                                   | Risk   |
| :--------- | :---------------------------------------------------------------------- | :----- |
| SAP20-BP01 | Understand SAP licensing costs on AWS                                   | HIGH   |
| SAP21-BP02 | Use Reserved Instances or Savings Plans for SAP workloads               | HIGH   |
| SAP20-BP02 | Optimize SAP system landscape for cost efficiency                       | MEDIUM |
| SAP21-BP01 | Select cost-effective compute resources for SAP workloads               | MEDIUM |
| SAP21-BP03 | Implement start/stop schedules for non-production SAP systems           | MEDIUM |
| SAP22-BP01 | Optimize storage costs for SAP workloads                                | MEDIUM |
| SAP22-BP02 | Implement data archiving for SAP systems                                | MEDIUM |
| SAP23-BP01 | Continually optimize sizing and configuration based on performance data | MEDIUM |
| SAP23-BP02 | Use AWS Cost Explorer and Cost Anomaly Detection for SAP workloads      | LOW    |
| SAP24-BP01 | Implement cost allocation tags for SAP workloads                        | LOW    |

## OPERATIONAL_EXCELLENCE

| ID         | Title                                                                                       | Risk   |
| :--------- | :------------------------------------------------------------------------------------------ | :----- |
| SAP01-BP01 | Understand your SAP environment on AWS                                                      | HIGH   |
| SAP01-BP02 | Document SAP system architecture and dependencies                                           | HIGH   |
| SAP02-BP01 | Implement change management processes for SAP workloads                                     | HIGH   |
| SAP03-BP01 | Design your SAP workload to allow understanding and reacting to its state                   | HIGH   |
| SAP03-BP02 | Implement SAP-specific monitoring using Amazon CloudWatch                                   | HIGH   |
| SAP05-BP01 | Implement runbooks for common SAP operational tasks                                         | HIGH   |
| SAP02-BP02 | Use SAP transport management system effectively                                             | MEDIUM |
| SAP02-BP03 | Automate infrastructure changes using Infrastructure as Code                                | MEDIUM |
| SAP03-BP03 | Configure alerting and automated responses for SAP events                                   | MEDIUM |
| SAP04-BP01 | Perform regular workload reviews to optimize for resiliency, performance, agility, and cost | MEDIUM |
| SAP04-BP02 | Use AWS Trusted Advisor and AWS Compute Optimizer for SAP workloads                         | MEDIUM |
| SAP05-BP02 | Automate SAP system operations using AWS Systems Manager                                    | MEDIUM |
| SAP05-BP03 | Establish SAP basis administration practices on AWS                                         | MEDIUM |

## PERFORMANCE_EFFICIENCY

| ID         | Title                                                          | Risk   |
| :--------- | :------------------------------------------------------------- | :----- |
| SAP15-BP01 | Select the optimal compute solution for SAP workloads          | HIGH   |
| SAP15-BP02 | Use SAP-certified EC2 instance types                           | HIGH   |
| SAP16-BP01 | Select optimal storage solutions for SAP workloads             | HIGH   |
| SAP16-BP02 | Configure Amazon EBS volumes according to SAP HANA KPIs        | HIGH   |
| SAP17-BP01 | Design network architecture for SAP performance                | HIGH   |
| SAP18-BP01 | Monitor and optimize SAP database performance                  | HIGH   |
| SAP19-BP01 | Implement performance monitoring for SAP workloads             | HIGH   |
| SAP15-BP03 | Right-size SAP workloads based on performance data             | MEDIUM |
| SAP16-BP03 | Use Amazon FSx for shared SAP file systems                     | MEDIUM |
| SAP17-BP02 | Use enhanced networking for SAP workloads                      | MEDIUM |
| SAP18-BP02 | Optimize SAP HANA memory configuration                         | MEDIUM |
| SAP19-BP02 | Establish performance baselines and thresholds for SAP systems | MEDIUM |

## RELIABILITY

| ID         | Title                                                                | Risk   |
| :--------- | :------------------------------------------------------------------- | :----- |
| SAP11-BP01 | Design SAP workloads for high availability                           | HIGH   |
| SAP11-BP02 | Implement SAP HANA System Replication for database high availability | HIGH   |
| SAP11-BP03 | Use AWS services for SAP application server high availability        | HIGH   |
| SAP12-BP01 | Implement backup and recovery strategies for SAP workloads           | HIGH   |
| SAP12-BP02 | Use AWS Backup for SAP workload data protection                      | HIGH   |
| SAP12-BP04 | Conduct periodic tests to validate your recovery procedure           | HIGH   |
| SAP13-BP01 | Design disaster recovery for SAP workloads                           | HIGH   |
| SAP13-BP02 | Implement cross-region disaster recovery for critical SAP systems    | HIGH   |
| SAP13-BP03 | Document and test disaster recovery runbooks                         | HIGH   |
| SAP12-BP03 | Store SAP backups in Amazon S3 with appropriate lifecycle policies   | MEDIUM |
| SAP14-BP01 | Manage service quotas for SAP workloads                              | MEDIUM |
| SAP14-BP02 | Plan capacity for SAP workload growth                                | MEDIUM |

## SECURITY

| ID         | Title                                                                 | Risk   |
| :--------- | :-------------------------------------------------------------------- | :----- |
| SAP06-BP01 | Understand security standards and how they apply to your SAP workload | HIGH   |
| SAP06-BP02 | Implement SAP security notes and patches regularly                    | HIGH   |
| SAP07-BP01 | Implement identity and access management for SAP workloads            | HIGH   |
| SAP07-BP02 | Use AWS IAM roles for SAP system access to AWS services               | HIGH   |
| SAP08-BP01 | Protect data at rest in SAP systems                                   | HIGH   |
| SAP08-BP02 | Protect data in transit for SAP communications                        | HIGH   |
| SAP08-BP03 | Implement SAP HANA database encryption                                | HIGH   |
| SAP09-BP01 | Implement network security for SAP workloads                          | HIGH   |
| SAP09-BP02 | Use private connectivity for SAP integrations                         | HIGH   |
| SAP09-BP03 | Have a documented plan for responding to security events              | HIGH   |
| SAP10-BP01 | Enable security logging and monitoring for SAP workloads              | HIGH   |
| SAP07-BP03 | Implement SAP Single Sign-On with AWS Directory Services              | MEDIUM |
| SAP10-BP02 | Use Amazon GuardDuty for threat detection on SAP workloads            | MEDIUM |

## SUSTAINABILITY

| ID         | Title                                                                      | Risk   |
| :--------- | :------------------------------------------------------------------------- | :----- |
| SAP25-BP01 | Evaluate SAP architecture patterns to improve environmental sustainability | MEDIUM |
| SAP25-BP02 | Select AWS Regions with lower carbon intensity                             | LOW    |
| SAP26-BP01 | Optimize compute utilization for SAP workloads                             | MEDIUM |
| SAP26-BP02 | Implement power management for non-production SAP systems                  | LOW    |
| SAP27-BP01 | Use efficient storage configurations for SAP workloads                     | LOW    |
| SAP27-BP02 | Implement SAP data lifecycle management for sustainability                 | MEDIUM |
| SAP28-BP01 | Review usage for opportunities to optimize sustainability                  | LOW    |
| SAP28-BP02 | Measure and report on SAP workload carbon footprint                        | LOW    |
