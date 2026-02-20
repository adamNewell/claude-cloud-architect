# Connected Mobility Lens Best Practices

Best practices for connected vehicle and mobility workloads.

## Contents

- [Connected Mobility Lens Best Practices](#connected-mobility-lens-best-practices)
  - [Contents](#contents)
  - [COST\_OPTIMIZATION](#cost_optimization)
  - [OPERATIONAL\_EXCELLENCE](#operational_excellence)
  - [PERFORMANCE\_EFFICIENCY](#performance_efficiency)
  - [RELIABILITY](#reliability)
  - [SECURITY](#security)
  - [SUSTAINABILITY](#sustainability)

## COST_OPTIMIZATION

| ID              | Title                                                                                         | Risk   |
| :-------------- | :-------------------------------------------------------------------------------------------- | :----- |
| CMOBCOST01-BP04 | Sanitize your data and ensure only essential data is transferred to the cloud                 | HIGH   |
| CMOBCOST04-BP01 | Implement event driven architectures for backend systems                                      | HIGH   |
| CMOBCOST01-BP01 | Store raw data in a scalable and cost-effective way                                           | MEDIUM |
| CMOBCOST01-BP02 | Use data partitioning for optimize performance and scalability                                | MEDIUM |
| CMOBCOST01-BP03 | Choose the right services by evaluating storage characteristics and requirements              | MEDIUM |
| CMOBCOST02-BP01 | Compress and aggregate data to reduce network transmission                                    | MEDIUM |
| CMOBCOST03-BP01 | Analyze data volume and evaluate processing needs to save on computation costs                | MEDIUM |
| CMOBCOST03-BP02 | Use data analytics to analyze vehicular data and develop new services with minimum investment | MEDIUM |
| CMOBCOST03-BP03 | Integrate with existing infrastructure cost efficiently                                       | MEDIUM |
| CMOBCOST05-BP01 | Define and implement an organizational tagging strategy                                       | MEDIUM |
| CMOBCOST06-BP01 | Dynamically adjust payload capacity to accommodate changing conditions                        | MEDIUM |
| CMOBCOST07-BP01 | Implement a monitoring strategy                                                               | MEDIUM |

## OPERATIONAL_EXCELLENCE

| ID             | Title                                                                                                 | Risk   |
| :------------- | :---------------------------------------------------------------------------------------------------- | :----- |
| CMOBOPS01-BP01 | Define end-to-end KPIs and metrics for a connected mobility platform                                  | HIGH   |
| CMOBOPS02-BP01 | Implement an observability data lake that aggregates telemetry from all connected mobility components | HIGH   |
| CMOBOPS02-BP02 | Set up real-time monitoring and alerting capabilities to detect anomalies promptly                    | HIGH   |
| CMOBOPS03-BP01 | Validate the system in a non-production environment that has feature equality with production         | HIGH   |
| CMOBOPS02-BP03 | Implement predictive analytics and proactive operations                                               | MEDIUM |
| CMOBOPS02-BP04 | Implement robust remote diagnostic capabilities                                                       | MEDIUM |
| CMOBOPS02-BP05 | Provide remote access for troubleshooting purposes                                                    | MEDIUM |
| CMOBOPS04-BP01 | Leverage microservices architecture for connected mobility platform                                   | MEDIUM |
| CMOBOPS04-BP02 | Implement API-first architecture to facilitate the exchange of data and services                      | MEDIUM |
| CMOBOPS04-BP03 | Implement DevOps automation                                                                           | MEDIUM |

## PERFORMANCE_EFFICIENCY

| ID             | Title                                                                                      | Risk   |
| :------------- | :----------------------------------------------------------------------------------------- | :----- |
| CMOBPER01-BP01 | Confirm critical components of the connected vehicle platform                              | HIGH   |
| CMOBPER01-BP02 | Enforce performance data collection                                                        | HIGH   |
| CMOBPER02-BP01 | Define key metrics for connectivity testing                                                | HIGH   |
| CMOBPER02-BP03 | Evaluate fail-over and redundancy                                                          | HIGH   |
| CMOBPER03-BP01 | Evaluate performance and scalability                                                       | HIGH   |
| CMOBPER05-BP01 | Address irregular data traffic patterns efficiently                                        | HIGH   |
| CMOBPER12-BP01 | Implement comprehensive monitoring and logging with notifications                          | HIGH   |
| CMOBPER12-BP02 | Implement device monitoring at edge, data transmission, cloud services, and log monitoring | HIGH   |
| CMOBPER14-BP01 | Develop criteria where trade-offs can be made based on functionality type                  | HIGH   |
| CMOBPER02-BP02 | Check data consistency across various connection states                                    | MEDIUM |
| CMOBPER04-BP01 | Implement steps for third-party integration performance assessment                         | MEDIUM |
| CMOBPER04-BP02 | Collect key performance metrics for third-party integrations                               | MEDIUM |
| CMOBPER05-BP02 | Take into account that mobility patterns can vary significantly                            | MEDIUM |
| CMOBPER06-BP01 | Consider data regulatory requirements                                                      | MEDIUM |
| CMOBPER10-BP01 | Build a cost-effective solution that is scalable and easy to manage                        | MEDIUM |
| CMOBPER11-BP01 | Use self-managed systems (Amazon EC2)                                                      | LOW    |
| CMOBPER11-BP02 | Use container-based architectures                                                          | LOW    |
| CMOBPER11-BP03 | Use serverless technologies                                                                | LOW    |
| CMOBPER13-BP01 | Follow best practices when creating dashboards                                             | MEDIUM |
| CMOBPER13-BP02 | Use tools and best practices to gain insights                                              | MEDIUM |
| CMOBPER14-BP02 | Make informed architecture design trade-offs                                               | MEDIUM |

## RELIABILITY

| ID             | Title                                                                                        | Risk   |
| :------------- | :------------------------------------------------------------------------------------------- | :----- |
| CMOBREL01-BP01 | Define message tier matrix                                                                   | HIGH   |
| CMOBREL01-BP02 | Have a strategy for critical functions                                                       | HIGH   |
| CMOBREL02-BP01 | Guardrail chatty vehicles                                                                    | HIGH   |
| CMOBREL04-BP01 | Implement a layered approach                                                                 | HIGH   |
| CMOBREL05-BP02 | Implement in-vehicle functionalities                                                         | HIGH   |
| CMOBREL06-BP01 | Monitor what matters                                                                         | HIGH   |
| CMOBREL09-BP01 | Real-time processing and alarming with notifications and automated response                  | HIGH   |
| CMOBREL12-BP01 | Identify and back up all data that needs to be backed up, or reproduce the data from sources | HIGH   |
| CMOBREL12-BP02 | Perform data backup automatically                                                            | HIGH   |
| CMOBREL12-BP03 | Secure and encrypt backups                                                                   | HIGH   |
| CMOBREL12-BP04 | Perform periodic recovery of the data to verify backup integrity and processes               | HIGH   |
| CMOBREL13-BP01 | Deploy the workload to multiple locations                                                    | HIGH   |
| CMOBREL02-BP02 | Avoid connection surge to the cloud                                                          | MEDIUM |
| CMOBREL03-BP01 | Implement just-in-time provisioning and registration                                         | MEDIUM |
| CMOBREL03-BP02 | Manual backup of the device registry                                                         | MEDIUM |
| CMOBREL05-BP01 | Account for telco provider outages                                                           | MEDIUM |
| CMOBREL07-BP01 | Log interpretation and context propagation                                                   | MEDIUM |
| CMOBREL08-BP01 | Define and calculate metrics (Aggregation)                                                   | MEDIUM |

## SECURITY

| ID             | Title                                                                                                                   | Risk   |
| :------------- | :---------------------------------------------------------------------------------------------------------------------- | :----- |
| CMOBSEC01-BP01 | Personally identifiable information (PII) and unique identifiers assigned to a vehicle or consumer should be anonymized | HIGH   |
| CMOBSEC01-BP02 | Location data collected from navigation systems should be appropriately secured to protect anonymity                    | HIGH   |
| CMOBSEC01-BP03 | Data collected from cameras, microphones, biometric, and other types of sensors should be appropriately secured         | HIGH   |
| CMOBSEC03-BP01 | Securely manage the lifecycle of identities and credentials for your vehicles and ECUs                                  | HIGH   |
| CMOBSEC03-BP02 | Design and securely operate a PKI for vehicle identities                                                                | HIGH   |
| CMOBSEC09-BP01 | Collect and detect events using onboard components in the vehicle                                                       | HIGH   |
| CMOBSEC09-BP02 | Ingest and enrich data by preparing, moving, aggregating, normalizing, transforming, and analyzing vehicle data         | HIGH   |
| CMOBSEC11-BP01 | Detect security posture deviations and anomalous behavior                                                               | HIGH   |
| CMOBSEC14-BP01 | Conduct threat modeling using formal methodology on in-vehicle systems                                                  | HIGH   |
| CMOBSEC14-BP02 | Conduct tests on ECUs to determine unnecessary configurations and vulnerabilities                                       | HIGH   |
| CMOBSEC14-BP03 | Develop requirements and processes to address and remediate vulnerabilities                                             | HIGH   |
| CMOBSEC15-BP01 | Validate all software updates are cryptographically signed upon release and verified before installation                | HIGH   |
| CMOBSEC15-BP02 | Test software packages for vulnerabilities and errors prior to deployment                                               | HIGH   |
| CMOBSEC15-BP03 | Perform controlled and secure deployment of software to vehicle fleets with rollback capabilities                       | HIGH   |
| CMOBSEC17-BP01 | Use methods for ensuring integrity such as secure boot and software signing                                             | HIGH   |
| CMOBSEC18-BP01 | Develop SDLC policies which govern security requirements                                                                | HIGH   |
| CMOBSEC19-BP03 | Define a process for classifying and prioritizing vulnerabilities for remediation                                       | HIGH   |
| CMOBSEC20-BP01 | Implement TLS 1.2+ to encrypt data in transit                                                                           | HIGH   |
| CMOBSEC22-BP01 | Define VSOC capabilities and requirements, then develop and test your incident response plan                            | HIGH   |
| CMOBSEC22-BP02 | Train or outsource personnel to manage security incidents at multiple complexity tiers                                  | HIGH   |
| CMOBSEC23-BP01 | Mitigate and respond to potential incidents by creating and testing policies, procedures, and playbooks                 | HIGH   |
| CMOBSEC24-BP01 | Digitally sign software and firmware with certificates verifiable during runtime                                        | HIGH   |
| CMOBSEC25-BP01 | Implement a Secure Development Lifecycle (SDLC) for vehicle software following open standards                           | HIGH   |
| CMOBSEC03-BP03 | Design a mechanism to tie various vehicle identities together as necessary                                              | MEDIUM |
| CMOBSEC10-BP01 | Gather relevant supplier, vendor, production, API, and partner data to enhance detection mechanisms                     | MEDIUM |
| CMOBSEC13-BP01 | Define a baseline of normal behavior for your vehicle and reject and alert on deviations                                | MEDIUM |
| CMOBSEC16-BP01 | Maintain an accurate and continuously updated inventory of vehicles and components                                      | MEDIUM |
| CMOBSEC19-BP01 | Continuously monitor threat intelligence feeds from vendors, suppliers, and communities                                 | MEDIUM |
| CMOBSEC19-BP02 | Conduct vulnerability impact analysis and testing in isolated environments                                              | MEDIUM |
| CMOBSEC20-BP02 | Consider client-side encryption of highly sensitive data at the ECU                                                     | MEDIUM |
| CMOBSEC21-BP01 | Do not use sensitive data to name and reference resources                                                               | MEDIUM |

## SUSTAINABILITY

| ID             | Title                                                                                                   | Risk   |
| :------------- | :------------------------------------------------------------------------------------------------------ | :----- |
| CMOBSUS06-BP01 | Optimize impact on devices and equipment                                                                | HIGH   |
| CMOBSUS07-BP02 | Collect and store only what is needed                                                                   | HIGH   |
| CMOBSUS01-BP01 | Choose a Region based on both business requirements and sustainability goals                            | MEDIUM |
| CMOBSUS02-BP01 | Scale workload infrastructure dynamically                                                               | MEDIUM |
| CMOBSUS03-BP01 | Align SLAs with sustainability goals                                                                    | MEDIUM |
| CMOBSUS04-BP01 | Optimize areas of code that consume the most resources                                                  | MEDIUM |
| CMOBSUS05-BP01 | Use software patterns and architectures that best support data access and storage patterns              | MEDIUM |
| CMOBSUS07-BP01 | Use technologies that support data access and storage patterns and implement data classification policy | MEDIUM |
| CMOBSUS07-BP03 | Avoid multiple connections from the edge                                                                | MEDIUM |
| CMOBSUS07-BP04 | Maximize data transformation at the edge                                                                | MEDIUM |
| CMOBSUS08-BP01 | Use policies to manage the lifecycle of your datasets                                                   | MEDIUM |
| CMOBSUS08-BP02 | Batch ingested data before storing to conserve storage                                                  | LOW    |
| CMOBSUS08-BP03 | Select compute instances and storage mechanisms from a sustainable point of view                        | LOW    |
| CMOBSUS09-BP01 | Use elasticity and automation to expand storage as data grows                                           | LOW    |
| CMOBSUS09-BP02 | Use reduced log level at production                                                                     | LOW    |
| CMOBSUS09-BP03 | Adopt campaign-based data collection for monitoring                                                     | MEDIUM |
| CMOBSUS09-BP04 | Alert only if needed                                                                                    | LOW    |
| CMOBSUS10-BP01 | Use the minimum amount of hardware to meet needs and use instance types with least impact               | MEDIUM |
| CMOBSUS11-BP01 | Use managed services to operate more efficiently in the cloud                                           | LOW    |
| CMOBSUS12-BP01 | Adopt methods that can rapidly introduce sustainability improvements                                    | MEDIUM |
| CMOBSUS13-BP01 | Use managed device farms for testing                                                                    | LOW    |
