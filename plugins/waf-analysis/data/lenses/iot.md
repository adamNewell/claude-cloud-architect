# IoT Lens Best Practices

Best practices for Internet of Things workloads.

## Contents

- [IoT Lens Best Practices](#iot-lens-best-practices)
  - [Contents](#contents)
  - [COST\_OPTIMIZATION](#cost_optimization)
  - [OPERATIONAL\_EXCELLENCE](#operational_excellence)
  - [PERFORMANCE\_EFFICIENCY](#performance_efficiency)
  - [RELIABILITY](#reliability)
  - [SECURITY](#security)
  - [SUSTAINABILITY](#sustainability)

## COST_OPTIMIZATION

| ID             | Title                                                                                          | Risk   |
| :------------- | :--------------------------------------------------------------------------------------------- | :----- |
| IOTCOST03-BP02 | Implement and configure telemetry to reduce data transfer costs                                | HIGH   |
| IOTCOST01-BP01 | Use a data lake for raw telemetry data                                                         | MEDIUM |
| IOTCOST01-BP02 | Provide a self-service interface for end users to search, extract, manage, and update IoT data | LOW    |
| IOTCOST01-BP03 | Track and manage the utilization of data sources                                               | MEDIUM |
| IOTCOST01-BP04 | Aggregate data at the edge where possible                                                      | MEDIUM |
| IOTCOST02-BP01 | Use lifecycle policies to archive your data                                                    | MEDIUM |
| IOTCOST02-BP02 | Evaluate storage characteristics for your use case and align with the right services           | MEDIUM |
| IOTCOST02-BP03 | Store raw archival data on cost effective services                                             | LOW    |
| IOTCOST03-BP01 | Select services to optimize cost                                                               | MEDIUM |
| IOTCOST03-BP03 | Use shadow only for slow changing data                                                         | MEDIUM |
| IOTCOST03-BP04 | Group and tag IoT devices and messages for cost allocation                                     | LOW    |
| IOTCOST03-BP05 | Implement and configure device messaging to reduce data transfer costs                         | MEDIUM |
| IOTCOST04-BP01 | Plan expected usage over time                                                                  | MEDIUM |
| IOTCOST05-BP01 | Balance networking throughput against payload size to optimize efficiency                      | MEDIUM |
| IOTCOST06-BP01 | Optimize shadow operations                                                                     | MEDIUM |

## OPERATIONAL_EXCELLENCE

| ID            | Title                                                                                                                          | Risk   |
| :------------ | :----------------------------------------------------------------------------------------------------------------------------- | :----- |
| IOTOPS01-BP01 | Conduct an OT and IT cybersecurity risk assessment using a common framework                                                    | HIGH   |
| IOTOPS03-BP01 | Use static and dynamic device hierarchies to support fleet operations                                                          | HIGH   |
| IOTOPS04-BP01 | The device management processes should be automated, data-driven, and based on previous, current, and expected device behavior | HIGH   |
| IOTOPS05-BP01 | Document how devices join your fleet from manufacturing to provisioning                                                        | HIGH   |
| IOTOPS06-BP01 | Implement monitoring to capture logs and metrics                                                                               | HIGH   |
| IOTOPS06-BP03 | Monitor the status of your IoT devices                                                                                         | HIGH   |
| IOTOPS07-BP01 | Enable appropriate responses to events                                                                                         | HIGH   |
| IOTOPS07-BP02 | Use data-driven auditing metrics to detect if any of your IoT devices might have been broadly accessed                         | HIGH   |
| IOTOPS10-BP01 | Train team members supporting your IoT workloads on the lifecycle of IoT applications and your business objectives             | HIGH   |
| IOTOPS01-BP02 | Evaluate if OT and IT teams use separate policies and controls to manage cybersecurity risks or if they use the same policy    | MEDIUM |
| IOTOPS02-BP01 | Consolidate resources into centers of excellence to bring focus to new or transforming enterprises                             | MEDIUM |
| IOTOPS03-BP02 | Use index and search services to enable rapid identification of target devices                                                 | MEDIUM |
| IOTOPS05-BP02 | Use programmatic techniques to provision devices at scale                                                                      | MEDIUM |
| IOTOPS05-BP03 | Use device level features to enable re-provisioning                                                                            | MEDIUM |
| IOTOPS06-BP02 | Capture and monitor application performance at the edge                                                                        | MEDIUM |
| IOTOPS06-BP04 | Use device state management services to detect status and connectivity patterns                                                | MEDIUM |
| IOTOPS08-BP01 | Use static and dynamic device attributes to identify devices with anomalous behavior                                           | MEDIUM |
| IOTOPS09-BP01 | Run ops metrics analysis across business teams, document learnings and define action items for future firmware deployments     | MEDIUM |

## PERFORMANCE_EFFICIENCY

| ID             | Title                                                                                          | Risk   |
| :------------- | :--------------------------------------------------------------------------------------------- | :----- |
| IOTPERF01-BP01 | Optimize for device hardware resources utilization                                             | HIGH   |
| IOTPERF02-BP01 | Implement comprehensive monitoring solutions to collect performance data from your IoT devices | HIGH   |
| IOTPERF05-BP02 | Optimize data sent from devices to backend services                                            | HIGH   |
| IOTPERF08-BP01 | Load test your IoT applications                                                                | HIGH   |
| IOTPERF08-BP02 | Monitor and manage your IoT service quotas using available tools and metrics                   | HIGH   |
| IOTPERF02-BP02 | Evaluate the runtime performance of your application                                           | MEDIUM |
| IOTPERF03-BP01 | Add timestamps to each published message                                                       | MEDIUM |
| IOTPERF04-BP01 | Have mechanisms to prioritize specific payload types                                           | MEDIUM |
| IOTPERF05-BP01 | Identify the ingestion mechanisms that best fit your use case                                  | MEDIUM |
| IOTPERF06-BP01 | Store data in different tiers following formats, access patterns and methods                   | MEDIUM |
| IOTPERF07-BP01 | Optimize network topology for distributed devices                                              | MEDIUM |
| IOTPERF07-BP02 | Perform timely connectivity verification for devices                                           | MEDIUM |
| IOTPERF09-BP01 | Have device inventory in the IoT system that centralizes device configuration and diagnostics  | MEDIUM |

## RELIABILITY

| ID            | Title                                                                              | Risk   |
| :------------ | :--------------------------------------------------------------------------------- | :----- |
| IOTREL01-BP01 | Use NTP to maintain time synchronization on devices                                | HIGH   |
| IOTREL02-BP01 | Manage service quotas and constraints                                              | HIGH   |
| IOTREL04-BP02 | Implement retry and back off logic to support throttling by device type            | HIGH   |
| IOTREL05-BP01 | Decouple IoT applications from the Connectivity Layer through an Ingestion Layer   | HIGH   |
| IOTREL06-BP01 | Dynamically scale cloud resources based on the utilization                         | HIGH   |
| IOTREL07-BP01 | Store data before processing                                                       | HIGH   |
| IOTREL08-BP01 | Use a mechanism to deploy and monitor firmware updates                             | HIGH   |
| IOTREL08-BP02 | Configure firmware rollback capabilities in devices                                | HIGH   |
| IOTREL10-BP01 | Use cloud service capabilities to handle component failures                        | HIGH   |
| IOTREL11-BP01 | Implement device logic to automatically reconnect to the cloud                     | HIGH   |
| IOTREL12-BP01 | Provide adequate device storage for offline operations                             | HIGH   |
| IOTREL14-BP02 | Implement multi-Region support for IoT applications and devices                    | HIGH   |
| IOTREL01-BP02 | Provide devices access to NTP servers                                              | MEDIUM |
| IOTREL03-BP01 | Down sample data to reduce storage requirements and network utilization            | MEDIUM |
| IOTREL04-BP01 | Target messages to relevant devices                                                | MEDIUM |
| IOTREL07-BP02 | Implement storage redundancy and failover mechanisms for IoT data persistence      | MEDIUM |
| IOTREL08-BP03 | Implement support for incremental updates to target device groups                  | MEDIUM |
| IOTREL08-BP04 | Implement dynamic configuration management for devices                             | MEDIUM |
| IOTREL09-BP01 | Implement device simulation to synthesize the entire flow of IoT data              | MEDIUM |
| IOTREL11-BP02 | Design devices to use multiple methods of communication                            | MEDIUM |
| IOTREL11-BP03 | Automate alerting for devices that are unable to reconnect                         | MEDIUM |
| IOTREL12-BP02 | Synchronize device states upon connection to the cloud                             | MEDIUM |
| IOTREL13-BP01 | Configure cloud services to reliably handle message processing                     | MEDIUM |
| IOTREL13-BP02 | Send logs directly to the cloud                                                    | LOW    |
| IOTREL13-BP03 | Design devices to allow for remote configuration of message publication frequency  | MEDIUM |
| IOTREL14-BP01 | Design server software to initiate communication only with devices that are online | MEDIUM |
| IOTREL14-BP03 | Use edge devices to store and analyze data                                         | MEDIUM |

## SECURITY

| ID            | Title                                                                                                                            | Risk   |
| :------------ | :------------------------------------------------------------------------------------------------------------------------------- | :----- |
| IOTSEC01-BP01 | Assign unique identities to each IoT device                                                                                      | HIGH   |
| IOTSEC02-BP01 | Use a separate hardware or a secure area on your devices to store credentials                                                    | HIGH   |
| IOTSEC02-BP02 | Use a trusted platform module (TPM) to implement cryptographic controls                                                          | HIGH   |
| IOTSEC02-BP03 | Use protected boot and persistent storage encryption                                                                             | HIGH   |
| IOTSEC03-BP01 | Implement authentication and authorization for users accessing IoT resources                                                     | HIGH   |
| IOTSEC04-BP01 | Assign least privilege access to devices                                                                                         | HIGH   |
| IOTSEC05-BP01 | Perform certificate lifecycle management                                                                                         | HIGH   |
| IOTSEC06-BP01 | Collect and analyze logs and metrics to capture authorization errors and failures to enable appropriate response                 | HIGH   |
| IOTSEC06-BP02 | Send alerts when security events, misconfiguration, and behavior violations are detected                                         | HIGH   |
| IOTSEC06-BP03 | Alert on non-compliant device configurations and remediate using automation                                                      | HIGH   |
| IOTSEC07-BP01 | Configure cloud infrastructure to have secure communications                                                                     | HIGH   |
| IOTSEC07-BP02 | Define networking configuration which restricts communications to only those ports and protocols which are required              | HIGH   |
| IOTSEC09-BP01 | Manage and maintain IoT Device software using an automated, monitored, and audited mechanism                                     | HIGH   |
| IOTSEC10-BP01 | Use encryption to protect IoT data in transit and at rest                                                                        | HIGH   |
| IOTSEC10-BP03 | Protect your IoT data in compliance with regulatory requirements                                                                 | HIGH   |
| IOTSEC11-BP01 | Build incident response mechanisms to address security events at scale                                                           | HIGH   |
| IOTSEC12-BP02 | Use static code analysis tools and code scanning to check IoT application code                                                   | HIGH   |
| IOTSEC13-BP01 | Use code and package scanning tools during development to identify potential risks during development                            | HIGH   |
| IOTSEC13-BP02 | Deploy updates to IoT device firmware or software to address identified issues                                                   | HIGH   |
| IOTSEC14-BP03 | Implement a risk assessment and risk management process                                                                          | HIGH   |
| IOTSEC15-BP01 | Identify the set of relevant regulations for your IoT applications                                                               | HIGH   |
| IOTSEC15-BP02 | Set up logging and monitoring to support audit checks for compliance                                                             | HIGH   |
| IOTSEC03-BP02 | Decouple access to your IoT infrastructure from the IoT applications                                                             | MEDIUM |
| IOTSEC07-BP03 | Log and monitor network configuration changes and network communication                                                          | MEDIUM |
| IOTSEC08-BP01 | Define an automated and monitored mechanism for deploying, managing, and maintaining networks to which IoT devices are connected | MEDIUM |
| IOTSEC08-BP02 | Define an automated and monitored mechanism for deploying, managing, and maintaining network configurations for IoT devices      | MEDIUM |
| IOTSEC09-BP02 | Manage IoT device configuration using automated and controlled mechanisms                                                        | MEDIUM |
| IOTSEC10-BP02 | Use data classification strategies to categorize data access based on levels of sensitivity                                      | MEDIUM |
| IOTSEC11-BP02 | Require timely vulnerability notifications and software updates from your providers                                              | MEDIUM |
| IOTSEC12-BP01 | Manage IoT device and gateway source code using source code management tools                                                     | MEDIUM |
| IOTSEC12-BP03 | Deploy IoT applications using IaC, CI/CD pipelines, and build and deploy automation                                              | MEDIUM |
| IOTSEC13-BP03 | Identify IoT devices which require updates and schedule updates to those devices                                                 | MEDIUM |
| IOTSEC14-BP01 | Establish a security governance team for your IoT applications or extend the security governance team for the organization       | MEDIUM |
| IOTSEC14-BP02 | Define security policy so that it can be written into verifiable checks using policy as code techniques                          | MEDIUM |
| IOTSEC15-BP03 | Implement automated compliance checking using compliance as code                                                                 | MEDIUM |

## SUSTAINABILITY

| ID            | Title                                                                                                                          | Risk   |
| :------------ | :----------------------------------------------------------------------------------------------------------------------------- | :----- |
| IOTSUS04-BP02 | Implement tickless operation and low-power modes                                                                               | HIGH   |
| IOTSUS01-BP01 | Eliminate unnecessary modules, libraries, and processes                                                                        | MEDIUM |
| IOTSUS01-BP02 | Use AWS IoT features to optimize network usage and power consumption                                                           | MEDIUM |
| IOTSUS01-BP03 | Use a hardware watchdog to restart your device automatically                                                                   | MEDIUM |
| IOTSUS01-BP04 | Implement resilient and scalable system behavior for clients communicating with the cloud                                      | MEDIUM |
| IOTSUS02-BP01 | Use the Basic Ingest feature in AWS IoT Core                                                                                   | LOW    |
| IOTSUS02-BP02 | Choose an appropriate Quality of Service(QoS) level                                                                            | LOW    |
| IOTSUS03-BP01 | Source sustainable components to help reduce environmental harm and encourage eco-friendly IoT products                        | MEDIUM |
| IOTSUS03-BP02 | Consider the manufacturing and distribution footprint of your device                                                           | LOW    |
| IOTSUS03-BP03 | Use benchmarks to help you make a processor choice                                                                             | MEDIUM |
| IOTSUS03-BP04 | Optimize your device based on real-world testing                                                                               | MEDIUM |
| IOTSUS03-BP05 | Use sensors with built-in event detection capabilities                                                                         | MEDIUM |
| IOTSUS03-BP06 | Use hardware acceleration for video encoding and decoding                                                                      | MEDIUM |
| IOTSUS03-BP07 | Use HSMs to accelerate cryptographic operations and save power                                                                 | MEDIUM |
| IOTSUS03-BP08 | Use low-power location tracking                                                                                                | MEDIUM |
| IOTSUS04-BP01 | Use energy harvesting technologies to power your device                                                                        | MEDIUM |
| IOTSUS04-BP03 | Allow applications or software running on devices to dynamically adjust settings based on requirements and available resources | MEDIUM |
| IOTSUS05-BP01 | Create detailed documentation                                                                                                  | LOW    |
| IOTSUS05-BP02 | Promote responsible disposal, repairability, and transfer of ownership for IoT devices to minimize environmental impact        | LOW    |
| IOTSUS05-BP03 | Identify when devices in the field can or should be retired                                                                    | LOW    |
