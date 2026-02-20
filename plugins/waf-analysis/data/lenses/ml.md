# Machine Learning Lens Best Practices

Best practices for machine learning workloads.

## Contents

- [Machine Learning Lens Best Practices](#machine-learning-lens-best-practices)
  - [Contents](#contents)
  - [COST\_OPTIMIZATION](#cost_optimization)
  - [OPERATIONAL\_EXCELLENCE](#operational_excellence)
  - [PERFORMANCE\_EFFICIENCY](#performance_efficiency)
  - [RELIABILITY](#reliability)
  - [SECURITY](#security)
  - [SUSTAINABILITY](#sustainability)

## COST_OPTIMIZATION

| ID            | Title                                                              | Risk   |
| :------------ | :----------------------------------------------------------------- | :----- |
| MLCOST01-BP01 | Use managed spot training for cost-effective model training        | HIGH   |
| MLCOST02-BP01 | Right-size inference endpoints based on traffic patterns           | HIGH   |
| MLCOST01-BP02 | Right-size training instances based on workload requirements       | MEDIUM |
| MLCOST01-BP03 | Implement early stopping to reduce unnecessary training            | MEDIUM |
| MLCOST02-BP02 | Use serverless inference for intermittent workloads                | MEDIUM |
| MLCOST02-BP03 | Use multi-model endpoints to consolidate inference resources       | MEDIUM |
| MLCOST02-BP04 | Use AWS Inferentia for cost-effective inference at scale           | MEDIUM |
| MLCOST03-BP01 | Implement data lifecycle policies for ML data                      | MEDIUM |
| MLCOST03-BP02 | Optimize storage for training datasets                             | LOW    |
| MLCOST04-BP01 | Use SageMaker Savings Plans for predictable workloads              | MEDIUM |
| MLCOST04-BP02 | Monitor and allocate ML costs by project and team                  | MEDIUM |
| MLCOST04-BP03 | Implement resource cleanup automation for development environments | MEDIUM |

## OPERATIONAL_EXCELLENCE

| ID          | Title                                                                       | Risk   |
| :---------- | :-------------------------------------------------------------------------- | :----- |
| MLOE01-BP01 | Establish clear business objectives and success metrics for ML workloads    | HIGH   |
| MLOE02-BP01 | Implement version control for ML artifacts including data, code, and models | HIGH   |
| MLOE02-BP02 | Automate ML pipelines for reproducible training and deployment              | HIGH   |
| MLOE03-BP01 | Establish data quality validation and monitoring processes                  | HIGH   |
| MLOE04-BP01 | Monitor model performance metrics in production                             | HIGH   |
| MLOE04-BP02 | Detect and alert on data drift and model drift                              | HIGH   |
| MLOE05-BP01 | Implement safe deployment strategies for ML models                          | HIGH   |
| MLOE01-BP02 | Define roles and responsibilities for ML teams                              | MEDIUM |
| MLOE02-BP03 | Implement experiment tracking and model registry                            | MEDIUM |
| MLOE03-BP02 | Document data sources, transformations, and feature engineering logic       | MEDIUM |
| MLOE04-BP03 | Implement logging for model predictions and explanations                    | MEDIUM |
| MLOE05-BP02 | Establish model approval and governance workflows                           | MEDIUM |
| MLOE06-BP01 | Establish processes for continuous model improvement and retraining         | MEDIUM |

## PERFORMANCE_EFFICIENCY

| ID           | Title                                                      | Risk   |
| :----------- | :--------------------------------------------------------- | :----- |
| MLPER01-BP01 | Select appropriate instance types for training workloads   | HIGH   |
| MLPER01-BP02 | Select appropriate instance types for inference workloads  | HIGH   |
| MLPER04-BP02 | Monitor and optimize inference endpoint performance        | HIGH   |
| MLPER01-BP03 | Use distributed training for large-scale models            | MEDIUM |
| MLPER02-BP01 | Optimize data loading and preprocessing pipelines          | MEDIUM |
| MLPER02-BP02 | Use feature stores for efficient feature serving           | MEDIUM |
| MLPER03-BP01 | Optimize model architecture for inference performance      | MEDIUM |
| MLPER03-BP02 | Implement model caching and batching for inference         | MEDIUM |
| MLPER04-BP01 | Monitor and optimize training job performance              | MEDIUM |
| MLPER05-BP01 | Use automatic model tuning for hyperparameter optimization | MEDIUM |
| MLPER05-BP02 | Implement serverless inference for variable workloads      | LOW    |

## RELIABILITY

| ID           | Title                                                         | Risk   |
| :----------- | :------------------------------------------------------------ | :----- |
| MLREL01-BP01 | Design ML pipelines for fault tolerance and recovery          | HIGH   |
| MLREL01-BP02 | Implement data validation and schema enforcement              | HIGH   |
| MLREL02-BP01 | Deploy inference endpoints across multiple Availability Zones | HIGH   |
| MLREL02-BP02 | Implement inference endpoint auto scaling                     | HIGH   |
| MLREL03-BP02 | Implement model rollback capabilities                         | HIGH   |
| MLREL05-BP02 | Validate model performance before production deployment       | HIGH   |
| MLREL02-BP03 | Implement model fallback strategies for inference failures    | MEDIUM |
| MLREL03-BP01 | Maintain versioned backups of training data and models        | MEDIUM |
| MLREL04-BP01 | Monitor and manage service quotas for ML resources            | MEDIUM |
| MLREL04-BP02 | Plan capacity for training and inference workloads            | MEDIUM |
| MLREL05-BP01 | Test ML systems for failure scenarios                         | MEDIUM |

## SECURITY

| ID           | Title                                                             | Risk   |
| :----------- | :---------------------------------------------------------------- | :----- |
| MLSEC01-BP01 | Implement least privilege access for ML resources and data        | HIGH   |
| MLSEC01-BP02 | Secure access to training data and model artifacts                | HIGH   |
| MLSEC01-BP03 | Implement network isolation for ML workloads                      | HIGH   |
| MLSEC02-BP01 | Encrypt training data and model artifacts at rest                 | HIGH   |
| MLSEC02-BP02 | Encrypt data in transit for ML workloads                          | HIGH   |
| MLSEC05-BP01 | Assess and mitigate bias in ML models                             | HIGH   |
| MLSEC02-BP03 | Implement data classification and handling procedures for ML data | MEDIUM |
| MLSEC03-BP01 | Validate and sanitize model inputs to prevent adversarial attacks | MEDIUM |
| MLSEC03-BP02 | Protect model artifacts from tampering and unauthorized access    | MEDIUM |
| MLSEC04-BP01 | Implement comprehensive logging for ML operations                 | MEDIUM |
| MLSEC04-BP02 | Monitor for anomalous ML behavior and unauthorized access         | MEDIUM |
| MLSEC05-BP02 | Implement model explainability for transparency and compliance    | MEDIUM |

## SUSTAINABILITY

| ID           | Title                                                                | Risk   |
| :----------- | :------------------------------------------------------------------- | :----- |
| MLSUS01-BP01 | Optimize model training efficiency to reduce energy consumption      | MEDIUM |
| MLSUS01-BP02 | Use efficient hardware for ML workloads                              | MEDIUM |
| MLSUS01-BP03 | Deploy workloads in Regions with lower carbon intensity              | LOW    |
| MLSUS02-BP01 | Optimize model size and complexity for inference                     | MEDIUM |
| MLSUS02-BP02 | Right-size inference endpoints to minimize idle resources            | MEDIUM |
| MLSUS03-BP01 | Implement efficient data storage and processing                      | LOW    |
| MLSUS03-BP02 | Use incremental training and caching to reduce redundant computation | LOW    |
| MLSUS04-BP01 | Track and report ML workload sustainability metrics                  | LOW    |
| MLSUS04-BP02 | Establish sustainability considerations in ML development processes  | LOW    |
