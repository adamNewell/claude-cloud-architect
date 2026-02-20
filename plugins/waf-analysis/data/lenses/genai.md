# Generative AI Lens Best Practices

Best practices for generative AI and foundation model workloads.

## Contents

- [Generative AI Lens Best Practices](#generative-ai-lens-best-practices)
  - [Contents](#contents)
  - [COST\_OPTIMIZATION](#cost_optimization)
  - [OPERATIONAL\_EXCELLENCE](#operational_excellence)
  - [PERFORMANCE\_EFFICIENCY](#performance_efficiency)
  - [RELIABILITY](#reliability)
  - [SECURITY](#security)
  - [SUSTAINABILITY](#sustainability)

## COST_OPTIMIZATION

| ID             | Title                                                           | Risk   |
| :------------- | :-------------------------------------------------------------- | :----- |
| GENCOST02-BP01 | Balance cost and performance when selecting inference paradigms | HIGH   |
| GENCOST05-BP01 | Create stopping conditions to control long-running workflows    | HIGH   |
| GENCOST01-BP01 | Right-size model selection to optimize inference costs          | MEDIUM |
| GENCOST02-BP02 | Optimize resource consumption to minimize hosting costs         | MEDIUM |
| GENCOST03-BP01 | Reduce prompt token length                                      | MEDIUM |
| GENCOST03-BP02 | Control model response length                                   | MEDIUM |
| GENCOST04-BP01 | Reduce vector length on embedded tokens                         | MEDIUM |

## OPERATIONAL_EXCELLENCE

| ID            | Title                                                                          | Risk   |
| :------------ | :----------------------------------------------------------------------------- | :----- |
| GENOPS01-BP01 | Periodically evaluate functional performance                                   | HIGH   |
| GENOPS01-BP02 | Collect and monitor user feedback                                              | HIGH   |
| GENOPS02-BP01 | Monitor all application layers                                                 | HIGH   |
| GENOPS02-BP02 | Monitor foundation model metrics                                               | HIGH   |
| GENOPS03-BP01 | Implement prompt template management                                           | HIGH   |
| GENOPS03-BP02 | Enable tracing for agents and RAG workflows                                    | HIGH   |
| GENOPS04-BP01 | Automate generative AI application lifecycle with infrastructure as code (IaC) | HIGH   |
| GENOPS04-BP02 | Follow GenAIOps practices to optimize the application lifecycle                | HIGH   |
| GENOPS05-BP01 | Learn when to customize models                                                 | HIGH   |
| GENOPS02-BP03 | Implement rate limiting and throttling to mitigate the risk of system overload | MEDIUM |

## PERFORMANCE_EFFICIENCY

| ID             | Title                                                           | Risk   |
| :------------- | :-------------------------------------------------------------- | :----- |
| GENPERF02-BP01 | Load test model endpoints                                       | HIGH   |
| GENPERF02-BP03 | Select and customize the appropriate model for your use case    | HIGH   |
| GENPERF04-BP01 | Test vector store features for latency and relevant performance | HIGH   |
| GENPERF01-BP01 | Define a ground truth data set of prompts and responses         | MEDIUM |
| GENPERF01-BP02 | Collect performance metrics from generative AI workloads        | MEDIUM |
| GENPERF02-BP02 | Optimize inference parameters to improve response quality       | MEDIUM |
| GENPERF03-BP01 | Use managed solutions for model hosting and customization       | MEDIUM |
| GENPERF04-BP02 | Optimize vector sizes for your use case                         | MEDIUM |

## RELIABILITY

| ID            | Title                                                                                         | Risk   |
| :------------ | :-------------------------------------------------------------------------------------------- | :----- |
| GENREL02-BP01 | Implement redundant network connections between model endpoints and supporting infrastructure | HIGH   |
| GENREL03-BP01 | Use logic to manage prompt flows and gracefully recover from failure                          | HIGH   |
| GENREL05-BP01 | Load-balance inference requests across all regions of availability                            | HIGH   |
| GENREL05-BP02 | Replicate embedding data across all regions of availability                                   | HIGH   |
| GENREL06-BP01 | Design for fault-tolerance for high-performance distributed computation tasks                 | HIGH   |
| GENREL01-BP01 | Scale and balance foundation model throughput as a function of utilization                    | MEDIUM |
| GENREL03-BP02 | Implement timeout mechanisms on agentic workflows                                             | MEDIUM |
| GENREL04-BP01 | Implement a prompt catalog                                                                    | MEDIUM |
| GENREL04-BP02 | Implement a model catalog                                                                     | MEDIUM |
| GENREL05-BP03 | Verify that agent capabilities are available across all regions of availability               | MEDIUM |

## SECURITY

| ID            | Title                                                                                              | Risk   |
| :------------ | :------------------------------------------------------------------------------------------------- | :----- |
| GENSEC01-BP01 | Grant least privilege access to foundation model endpoints                                         | HIGH   |
| GENSEC01-BP02 | Implement private network communication between foundation models and applications                 | HIGH   |
| GENSEC01-BP03 | Implement least privilege access permissions for foundation models accessing data stores           | HIGH   |
| GENSEC01-BP04 | Implement access monitoring to generative AI services and foundation models                        | HIGH   |
| GENSEC02-BP01 | Implement guardrails to mitigate harmful or incorrect model responses                              | HIGH   |
| GENSEC03-BP01 | Implement control plane and data access monitoring to generative AI services and foundation models | HIGH   |
| GENSEC04-BP02 | Sanitize and validate user inputs to foundation models                                             | HIGH   |
| GENSEC05-BP01 | Implement least privilege access and permissions boundaries for agentic workflows                  | HIGH   |
| GENSEC06-BP01 | Implement data purification filters for model training workflows                                   | HIGH   |
| GENSEC04-BP01 | Implement a secure prompt catalog                                                                  | MEDIUM |

## SUSTAINABILITY

| ID            | Title                                                                                | Risk   |
| :------------ | :----------------------------------------------------------------------------------- | :----- |
| GENSUS01-BP01 | Implement auto scaling and serverless architectures to optimize resource utilization | MEDIUM |
| GENSUS01-BP02 | Use efficient model customization services                                           | MEDIUM |
| GENSUS02-BP01 | Optimize data processing and storage to minimize energy consumption                  | MEDIUM |
| GENSUS03-BP01 | Leverage smaller models to reduce carbon footprint                                   | LOW    |
