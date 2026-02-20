# Data Analytics Lens Best Practices

Best practices for data analytics workloads.

## Contents

- [Data Analytics Lens Best Practices](#data-analytics-lens-best-practices)
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
| DALCOST11-BP01 | Decouple storage from compute                                                 | MEDIUM |
| DALCOST11-BP02 | Plan and provision capacity for predictable workload usage                    | MEDIUM |
| DALCOST11-BP03 | Use On-Demand Instance capacity for unpredictable workload usage              | MEDIUM |
| DALCOST11-BP04 | Use auto scaling where appropriate                                            | MEDIUM |
| DALCOST12-BP01 | Measure data storage and processing costs per user of the workload            | MEDIUM |
| DALCOST12-BP02 | Balance agility and skill sets when building local vs centralized platforms   | MEDIUM |
| DALCOST12-BP03 | Build a common shared processing system and measure cost per analytics job    | MEDIUM |
| DALCOST12-BP04 | Restrict and record resource allocation permissions using IAM                 | MEDIUM |
| DALCOST13-BP01 | Remove unused data and infrastructure                                         | MEDIUM |
| DALCOST13-BP02 | Reduce overprovisioning infrastructure                                        | MEDIUM |
| DALCOST13-BP03 | Evaluate and adopt new cost-effective solutions                               | MEDIUM |
| DALCOST14-BP01 | Evaluate infrastructure usage patterns and choose payment options accordingly | MEDIUM |
| DALCOST14-BP02 | Consult with your finance team and determine optimal payment models           | MEDIUM |

## OPERATIONAL_EXCELLENCE

| ID            | Title                                                                                   | Risk   |
| :------------ | :-------------------------------------------------------------------------------------- | :----- |
| DALOPS01-BP01 | Validate the data quality of source systems before transferring data for analytics      | HIGH   |
| DALOPS01-BP02 | Monitor operational metrics of data processing jobs and the availability of source data | HIGH   |
| DALOPS02-BP01 | Use version control for job and application changes                                     | MEDIUM |
| DALOPS02-BP02 | Create test data and provision staging environment                                      | MEDIUM |
| DALOPS02-BP03 | Test and validate analytics jobs and application deployments                            | MEDIUM |
| DALOPS02-BP04 | Build standard operating procedures for deployment, test, rollback, and backfill tasks  | MEDIUM |

## PERFORMANCE_EFFICIENCY

| ID            | Title                                                                         | Risk   |
| :------------ | :---------------------------------------------------------------------------- | :----- |
| DALPER09-BP01 | Identify critical performance criteria for your storage workload              | HIGH   |
| DALPER09-BP02 | Identify and evaluate the available storage options for your compute solution | HIGH   |
| DALPER08-BP01 | Identify analytics solutions that best suit your technical challenges         | MEDIUM |
| DALPER08-BP02 | Provision compute resources to the location of the data storage               | MEDIUM |
| DALPER08-BP03 | Define and measure the computing performance metrics                          | MEDIUM |
| DALPER08-BP04 | Continually identify under-performing components and fine-tune                | MEDIUM |
| DALPER09-BP03 | Choose optimal storage based on access patterns and performance requirements  | MEDIUM |
| DALPER10-BP01 | Select format based on data write frequency and update patterns               | MEDIUM |
| DALPER10-BP02 | Choose data formatting based on your data access pattern                      | MEDIUM |
| DALPER10-BP03 | Utilize compression techniques to decrease storage and enhance I/O efficiency | MEDIUM |
| DALPER10-BP04 | Partition your data to enable efficient data pruning                          | MEDIUM |

## RELIABILITY

| ID            | Title                                                                    | Risk   |
| :------------ | :----------------------------------------------------------------------- | :----- |
| DALREL06-BP01 | Create an illustration of data flow dependencies                         | HIGH   |
| DALREL06-BP02 | Monitor analytics systems to detect ETL job failures                     | HIGH   |
| DALREL06-BP03 | Notify stakeholders about analytics or ETL job failures                  | HIGH   |
| DALREL07-BP01 | Build a central Data Catalog to store, share, and track metadata changes | HIGH   |
| DALREL07-BP02 | Monitor for data quality anomalies                                       | HIGH   |
| DALREL07-BP03 | Trace data lineage                                                       | HIGH   |
| DALREL06-BP04 | Automate the recovery of analytics and ETL job failures                  | MEDIUM |
| DALREL06-BP05 | Build a disaster recovery plan for the analytics infrastructure and data | MEDIUM |

## SECURITY

| ID            | Title                                                                                       | Risk   |
| :------------ | :------------------------------------------------------------------------------------------ | :----- |
| DALSEC03-BP01 | Privacy by design                                                                           | HIGH   |
| DALSEC03-BP02 | Classify and protect data                                                                   | HIGH   |
| DALSEC03-BP03 | Understand data classifications and their protection policies                               | HIGH   |
| DALSEC03-BP04 | Identify the source data owners and have them set the data classifications                  | HIGH   |
| DALSEC03-BP05 | Record data classifications into the Data Catalog so that analytics workload can understand | HIGH   |
| DALSEC03-BP06 | Implement encryption policies                                                               | HIGH   |
| DALSEC03-BP07 | Implement data retention policies for each class of data in the analytics workload          | HIGH   |
| DALSEC04-BP01 | Allow data owners to determine which people or systems can access data                      | HIGH   |
| DALSEC04-BP02 | Build user identity solutions that uniquely identify people and systems                     | HIGH   |
| DALSEC04-BP03 | Implement the required data authorization models                                            | HIGH   |
| DALSEC05-BP01 | Prevent unintended access to the infrastructure                                             | HIGH   |
| DALSEC05-BP02 | Implement least privilege policies for source and downstream systems                        | HIGH   |
| DALSEC05-BP03 | Monitor infrastructure changes and user activities                                          | HIGH   |
| DALSEC05-BP04 | Secure the audit logs that record data or resource access                                   | HIGH   |
| DALSEC03-BP08 | Enforce downstream systems to honor the data classifications                                | MEDIUM |
| DALSEC04-BP04 | Establish an emergency access process to ensure admin access is managed                     | MEDIUM |
| DALSEC04-BP05 | Track data and database changes                                                             | MEDIUM |

## SUSTAINABILITY

| ID            | Title                                                                              | Risk   |
| :------------ | :--------------------------------------------------------------------------------- | :----- |
| DALSUS15-BP01 | Define your organization's current environmental impact                            | MEDIUM |
| DALSUS15-BP02 | Encourage sustainable thinking                                                     | MEDIUM |
| DALSUS15-BP03 | Encourage a culture of data minimization                                           | MEDIUM |
| DALSUS15-BP04 | Implement data retention processes to remove unnecessary data                      | MEDIUM |
| DALSUS15-BP05 | Optimize data modeling and storage for efficient data retrieval                    | MEDIUM |
| DALSUS15-BP06 | Prevent unnecessary data movement between systems and applications                 | MEDIUM |
| DALSUS15-BP07 | Efficiently manage your analytics infrastructure to reduce underutilized resources | MEDIUM |
