# Financial Services Lens Best Practices

Best practices for financial services workloads.

## Contents

- [Financial Services Lens Best Practices](#financial-services-lens-best-practices)
  - [Contents](#contents)
  - [COST\_OPTIMIZATION](#cost_optimization)
  - [OPERATIONAL\_EXCELLENCE](#operational_excellence)
  - [PERFORMANCE\_EFFICIENCY](#performance_efficiency)
  - [RELIABILITY](#reliability)
  - [SECURITY](#security)
  - [SUSTAINABILITY](#sustainability)

## COST_OPTIMIZATION

| ID             | Title                                                                                                                                                                | Risk   |
| :------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :----- |
| FSICOST01-BP01 | Evangelize cloud education among all (including non-technical) staff and stakeholders                                                                                | HIGH   |
| FSICOST02-BP01 | Apply the Pareto-principle 80/20 rule for your CFM efforts                                                                                                           | HIGH   |
| FSICOST03-BP01 | Use automation to drive scale for Cloud Financial Management practices                                                                                               | HIGH   |
| FSICOST04-BP01 | Promote a culture of transparency on costs                                                                                                                           | HIGH   |
| FSICOST05-BP01 | Be aware of anomalies and periodically review your architecture                                                                                                      | HIGH   |
| FSICOST06-BP01 | Monitor your workload usage cycle around times of higher and lower utilization (quarter-end, year-end, weekends, and holidays) to identify ways to reduce your costs | HIGH   |
| FSICOST08-BP01 | Sign up for a compute savings plan for discounts on compute versus on-demand pricing                                                                                 | HIGH   |
| FSICOST09-BP01 | Define data retention policies to select the right storage type for your data lifecycle                                                                              | HIGH   |
| FSICOST11-BP01 | Identify pricing models and savings plans for your selected AWS services when designing your architecture                                                            | HIGH   |
| FSICOST12-BP01 | Migrate your mainframe and on-premises infrastructure to adopt a cloud-based microservices approach                                                                  | HIGH   |
| FSICOST15-BP01 | Monitor and optimize your ongoing costs, ROIs, and tradeoffs against alternative AWS services on a periodic basis to maintain your lowest cost of ownership          | HIGH   |
| FSICOST16-BP01 | Use AWS cost management tools to perform retrospective, audit-based cost optimization on existing cloud workloads                                                    | HIGH   |
| FSICOST17-BP01 | Assess workload architecture to identify the most cost-effective resources                                                                                           | HIGH   |
| FSICOST18-BP01 | Define ambitious modernization strategy to become truly AWS optimized                                                                                                | HIGH   |
| FSICOST07-BP01 | Use AWS credit programs such as Migration Acceleration Plan, Digital Innovation, and Activate to save costs and drive cloud adoption                                 | MEDIUM |
| FSICOST10-BP01 | Use less costly Regions for disaster recovery and test platforms                                                                                                     | MEDIUM |
| FSICOST13-BP01 | Set up pay-as-you-go services when team expands for certain duration                                                                                                 | MEDIUM |
| FSICOST14-BP01 | Consider the cost of licensing third-party applications and software                                                                                                 | MEDIUM |
| FSICOST19-BP01 | Use AWS cloud services to change the way you reduce cost and improve agility in your infrastructure                                                                  | MEDIUM |

## OPERATIONAL_EXCELLENCE

| ID            | Title                                                                                                                        | Risk   |
| :------------ | :--------------------------------------------------------------------------------------------------------------------------- | :----- |
| FSIOPS01-BP01 | Define roles and responsibilities across risk functions                                                                      | HIGH   |
| FSIOPS01-BP02 | Engage with your risk management and internal audit functions to implement a process for the approval of cloud risk controls | HIGH   |
| FSIOPS01-BP03 | Implement a process for adopting appropriate risk appetites                                                                  | HIGH   |
| FSIOPS02-BP01 | Understand the Shared Responsibility Model and how it applies to services and workloads you run in the cloud                 | HIGH   |
| FSIOPS02-BP02 | Develop an enterprise cloud risk plan                                                                                        | HIGH   |
| FSIOPS03-BP01 | Implement a process for the review of applicable compliance and regulatory requirements for your workload                    | HIGH   |
| FSIOPS04-BP01 | Implement a change management process for cloud resources                                                                    | HIGH   |
| FSIOPS05-BP01 | Use enhanced monitoring in the cloud                                                                                         | HIGH   |
| FSIOPS06-BP01 | Manage cloud provider service events                                                                                         | HIGH   |
| FSIOPS07-BP02 | Conduct post-event operational reviews                                                                                       | HIGH   |
| FSIOPS04-BP02 | Implement infrastructure as code                                                                                             | MEDIUM |
| FSIOPS04-BP03 | Prevent configuration drift                                                                                                  | MEDIUM |
| FSIOPS05-BP02 | Monitor cloud provider events                                                                                                | MEDIUM |
| FSIOPS07-BP01 | Test, model, and simulate scenarios before rollout                                                                           | MEDIUM |

## PERFORMANCE_EFFICIENCY

| ID             | Title                                                                         | Risk   |
| :------------- | :---------------------------------------------------------------------------- | :----- |
| FSIPERF01-BP01 | Use internal and external risk to determine performance requirements          | HIGH   |
| FSIPERF01-BP02 | Factor in rate of increase in load and scale-out intervals                    | HIGH   |
| FSIPERF01-BP03 | Benchmark your solution                                                       | HIGH   |
| FSIPERF02-BP01 | Select your compute architecture based on workload requirements               | HIGH   |
| FSIPERF03-BP01 | Select your storage architecture based on workload requirements               | HIGH   |
| FSIPERF04-BP01 | Use AWS services to optimize your network routes                              | HIGH   |
| FSIPERF04-BP02 | Use Amazon EC2 instances and features to optimize your networking             | HIGH   |
| FSIPERF05-BP01 | Use Application Performance Monitoring (APM) tools                            | HIGH   |
| FSIPERF05-BP03 | Verify consistency and failure recovery during load tests                     | HIGH   |
| FSIPERF05-BP04 | Understand performance of the system under peak load and in failure scenarios | HIGH   |
| FSIPERF05-BP05 | Include dependencies in your load tests                                       | HIGH   |
| FSIPERF06-BP01 | Understand your priorities and architect to meet them                         | HIGH   |
| FSIPERF03-BP02 | Consider changing needs over the entire lifecycle of your data                | MEDIUM |
| FSIPERF05-BP02 | Integrate performance testing into the release cycle                          | MEDIUM |

## RELIABILITY

| ID            | Title                                                                          | Risk   |
| :------------ | :----------------------------------------------------------------------------- | :----- |
| FSIREL01-BP01 | Treat your CI/CD tools as critical workload components for recovery            | HIGH   |
| FSIREL02-BP01 | Practice regular resilience testing                                            | HIGH   |
| FSIREL02-BP02 | Implement an operational readiness review process                              | HIGH   |
| FSIREL03-BP01 | Use business criticality to drive recovery objectives                          | HIGH   |
| FSIREL03-BP03 | Use past examples of market volatility in determining peak loads               | HIGH   |
| FSIREL03-BP04 | Model failures to identify resilience requirements                             | HIGH   |
| FSIREL04-BP01 | Use best practices to implement highly resilient critical workloads            | HIGH   |
| FSIREL04-BP02 | Provide external dependency accessibility from failover environments           | HIGH   |
| FSIREL04-BP03 | Decouple your dependencies                                                     | HIGH   |
| FSIREL05-BP02 | Address hybrid resiliency                                                      | HIGH   |
| FSIREL06-BP01 | Monitor indicators aside from system metrics that can signal client impairment | HIGH   |
| FSIREL06-BP04 | Have a way to manually route away during failure                               | HIGH   |
| FSIREL07-BP01 | Monitor and validate your RPO                                                  | HIGH   |
| FSIREL07-BP02 | Monitor and validate your RTO                                                  | HIGH   |
| FSIREL08-BP02 | Alert on the absence of an event                                               | HIGH   |
| FSIREL09-BP01 | Implement a backup strategy                                                    | HIGH   |
| FSIREL09-BP02 | Maintain backups in a secondary Region                                         | HIGH   |
| FSIREL10-BP01 | Understand requirements for data backup and retention                          | HIGH   |
| FSIREL10-BP02 | Back up logs as part of the backup strategy                                    | HIGH   |
| FSIREL10-BP03 | Incorporate anti-ransomware backups into your backup strategy                  | HIGH   |
| FSIREL10-BP05 | Use Glacier Vault Lock and S3 Object Lock for WORM storage                     | HIGH   |
| FSIREL03-BP02 | Apply fine grained workload resilience requirements                            | MEDIUM |
| FSIREL05-BP01 | Evaluate the resilience of cross-cloud application architectures               | MEDIUM |
| FSIREL06-BP02 | Have a way to find outliers hiding in aggregate metrics                        | MEDIUM |
| FSIREL06-BP03 | Use anomaly detection to detect unusual changes in user engagement metrics     | MEDIUM |
| FSIREL06-BP05 | Establish baselines for expected network traffic                               | MEDIUM |
| FSIREL08-BP01 | Use a single pane of glass for monitoring                                      | MEDIUM |
| FSIREL08-BP03 | Identify metrics and validate alerts through load testing                      | MEDIUM |
| FSIREL08-BP04 | Use distributed tracing tools for service-oriented architectures               | MEDIUM |
| FSIREL10-BP04 | Create lifecycle policies for backups                                          | MEDIUM |

## SECURITY

| ID            | Title                                                                     | Risk   |
| :------------ | :------------------------------------------------------------------------ | :----- |
| FSISEC02-BP01 | Automate your compliance management                                       | HIGH   |
| FSISEC02-BP02 | Use ready-to-deploy templates for standards and best practices            | HIGH   |
| FSISEC03-BP01 | Review IAM policies and permissions                                       | HIGH   |
| FSISEC03-BP02 | Mitigate privilege escalation                                             | HIGH   |
| FSISEC03-BP03 | Monitor unauthorized activity in your AWS accounts                        | HIGH   |
| FSISEC04-BP01 | Implement the principle of separation of duties                           | HIGH   |
| FSISEC05-BP01 | Track configuration changes                                               | HIGH   |
| FSISEC05-BP02 | Detect unusual and unauthorized activity early                            | HIGH   |
| FSISEC06-BP01 | Automate remediation of common vulnerabilities and exposures (CVEs)       | HIGH   |
| FSISEC06-BP02 | Perform static analysis on all code deploys                               | HIGH   |
| FSISEC06-BP04 | Deploy web application firewalls                                          | HIGH   |
| FSISEC07-BP04 | Allow interactive access for emergencies only                             | HIGH   |
| FSISEC08-BP01 | Implement a multi-account strategy                                        | HIGH   |
| FSISEC08-BP02 | Enforce network isolation                                                 | HIGH   |
| FSISEC09-BP01 | Consider compliance obligations regarding location of cryptographic keys  | HIGH   |
| FSISEC10-BP01 | Prevent modifications and deletions of logs and data                      | HIGH   |
| FSISEC10-BP02 | Limit and monitor key deletes                                             | HIGH   |
| FSISEC11-BP01 | Prevent malware infiltration by securing compute resources                | HIGH   |
| FSISEC11-BP02 | Prevent threats from accessing your data stores                           | HIGH   |
| FSISEC11-BP03 | Use frequent backups to recover from a threat                             | HIGH   |
| FSISEC12-BP01 | Regularly review your incident response plan for regulatory compliance    | HIGH   |
| FSISEC01-BP01 | Consider and leverage a Cloud Center of Excellence (CCoE)                 | MEDIUM |
| FSISEC01-BP02 | Use cloud-native services for management and governance                   | MEDIUM |
| FSISEC04-BP02 | Use AWS Config to view historical IAM configuration and changes over time | MEDIUM |
| FSISEC04-BP03 | Set up alerts for IAM configuration changes and perform audits            | MEDIUM |
| FSISEC06-BP03 | Conduct regular penetration testing                                       | MEDIUM |
| FSISEC07-BP01 | Monitor instance traffic                                                  | MEDIUM |
| FSISEC07-BP02 | Use VPC Traffic Mirroring                                                 | MEDIUM |
| FSISEC07-BP03 | Use immutable infrastructure with no human access                         | MEDIUM |

## SUSTAINABILITY

| ID            | Title                                                                                                                                              | Risk   |
| :------------ | :------------------------------------------------------------------------------------------------------------------------------------------------- | :----- |
| FSISUS01-BP01 | Select a Region with lower environmental impact that meets your financial services industry business and compliance considerations                 | MEDIUM |
| FSISUS02-BP01 | Run workloads and store restricted data in required country and unrestricted in sustainable Region selected by following SUS01 guidance            | MEDIUM |
| FSISUS03-BP01 | Select Regions that offer services required by financial services organizations and hardware that maximizes the reduction of your carbon footprint | MEDIUM |
| FSISUS04-BP01 | Actively manage each business function and the allocation and configuration of resources                                                           | MEDIUM |
| FSISUS04-BP02 | FSI workloads serve the highest common denominator of application demands                                                                          | MEDIUM |
| FSISUS05-BP01 | Analyze network access patterns to identify the places that your customers are connecting from                                                     | MEDIUM |
| FSISUS05-BP02 | Avoid common architectural misconfigurations                                                                                                       | MEDIUM |
| FSISUS06-BP01 | Actively monitor your FSI resource usage                                                                                                           | MEDIUM |
| FSISUS07-BP01 | Optimize your batch processing systems                                                                                                             | MEDIUM |
| FSISUS08-BP01 | Use event-driven architecture                                                                                                                      | MEDIUM |
| FSISUS09-BP01 | Monitor and optimize areas of code that are the most compute resource-intensive                                                                    | MEDIUM |
| FSISUS10-BP01 | Balance your data performance requirements against its carbon footprint                                                                            | MEDIUM |
| FSISUS10-BP02 | Separate data into hot, warm, cold storage                                                                                                         | MEDIUM |
| FSISUS11-BP01 | Use processed data to reduce your storage footprint                                                                                                | MEDIUM |
| FSISUS12-BP01 | Set appropriate instance usage goals that reflect your sustainability requirements                                                                 | MEDIUM |
| FSISUS12-BP02 | Track your overall process in achieving your goals                                                                                                 | MEDIUM |
| FSISUS12-BP03 | Monitor your individual instance performance metrics                                                                                               | MEDIUM |
| FSISUS13-BP01 | Do not complete a customer transaction in the shortest time when not required by end users                                                         | MEDIUM |
| FSISUS13-BP02 | Introduce jitter to your scheduled tasks                                                                                                           | MEDIUM |
| FSISUS14-BP01 | Use instances with higher energy efficiency                                                                                                        | MEDIUM |
| FSISUS14-BP02 | Design applications that can use different Amazon EC2 instance types                                                                               | MEDIUM |
| FSISUS14-BP03 | Adopt a serverless, event-driven architecture                                                                                                      | MEDIUM |
| FSISUS15-BP01 | Minimize the bit count while maintaining precision                                                                                                 | MEDIUM |
| FSISUS16-BP01 | Verify that all development resources are dedicated to an active project or team                                                                   | MEDIUM |
