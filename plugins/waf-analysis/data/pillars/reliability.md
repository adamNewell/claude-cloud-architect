# Reliability Pillar Best Practices

Ensure workloads perform intended functions correctly and consistently.

## Contents

- [HIGH Risk Practices](#high-risk-practices)
- [MEDIUM Risk Practices](#medium-risk-practices)
- [LOW Risk Practices](#low-risk-practices)
- [Practice Details](#practice-details)

## HIGH Risk Practices

| ID         | Title                                                                                               | Areas                                                                                                |
| :--------- | :-------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------- |
| REL01-BP01 | Aware of service quotas and constraints                                                             | Foundations, Manage service quotas and constraints                                                   |
| REL01-BP02 | Manage service quotas across accounts and regions                                                   | Foundations, Manage service quotas and constraints                                                   |
| REL02-BP01 | Use highly available network connectivity for your workload public endpoints                        | Foundations, Plan your network topology                                                              |
| REL02-BP02 | Provision redundant connectivity between private networks in the cloud and on-premises environments | Foundations, Plan your network topology                                                              |
| REL03-BP01 | Choose how to segment your workload                                                                 | Workload architecture, Design your workload service architecture                                     |
| REL03-BP02 | Build services focused on specific business domains and functionality                               | Workload architecture, Design your workload service architecture                                     |
| REL04-BP01 | Identify the kind of distributed systems you depend on                                              | Workload architecture, Design interactions in a distributed system to prevent failures               |
| REL04-BP02 | Implement loosely coupled dependencies                                                              | Workload architecture, Design interactions in a distributed system to prevent failures               |
| REL05-BP01 | Implement graceful degradation to transform applicable hard dependencies into soft dependencies     | Workload architecture, Design interactions in a distributed system to mitigate or withstand failures |
| REL05-BP02 | Throttle requests                                                                                   | Workload architecture, Design interactions in a distributed system to mitigate or withstand failures |
| REL05-BP03 | Control and limit retry calls                                                                       | Workload architecture, Design interactions in a distributed system to mitigate or withstand failures |
| REL05-BP04 | Fail fast and limit queues                                                                          | Workload architecture, Design interactions in a distributed system to mitigate or withstand failures |
| REL05-BP05 | Set client timeouts                                                                                 | Workload architecture, Design interactions in a distributed system to mitigate or withstand failures |
| REL06-BP01 | Monitor all components for the workload (Generation)                                                | Change management, Monitor workload resources                                                        |
| REL06-BP02 | Define and calculate metrics (Aggregation)                                                          | Change management, Monitor workload resources                                                        |
| REL06-BP03 | Send notifications (Real-time processing and alarming)                                              | Change management, Monitor workload resources                                                        |
| REL07-BP01 | Use automation when obtaining or scaling resources                                                  | Change management, Design your workload to adapt to changes in demand                                |
| REL08-BP01 | Use runbooks for standard activities such as deployment                                             | Change management, Implement change                                                                  |
| REL08-BP02 | Integrate functional testing as part of your deployment                                             | Change management, Implement change                                                                  |
| REL09-BP01 | Identify and back up all data that needs to be backed up, or reproduce the data from sources        | Failure management, Back up data                                                                     |
| REL09-BP02 | Secure and encrypt backups                                                                          | Failure management, Back up data                                                                     |
| REL10-BP01 | Deploy the workload to multiple locations                                                           | Failure management, Use fault isolation to protect your workload                                     |
| REL10-BP03 | Use bulkhead architectures to limit scope of impact                                                 | Failure management, Use fault isolation to protect your workload                                     |
| REL11-BP01 | Monitor all components of the workload to detect failures                                           | Failure management, Design your workload to withstand component failures                             |
| REL11-BP02 | Fail over to healthy resources                                                                      | Failure management, Design your workload to withstand component failures                             |
| REL11-BP03 | Automate healing on all layers                                                                      | Failure management, Design your workload to withstand component failures                             |
| REL12-BP01 | Use playbooks to investigate failures                                                               | Failure management, Test reliability                                                                 |
| REL12-BP02 | Perform post-incident analysis                                                                      | Failure management, Test reliability                                                                 |
| REL12-BP03 | Test scalability and performance requirements                                                       | Failure management, Test reliability                                                                 |
| REL13-BP01 | Define recovery objectives for downtime and data loss                                               | Failure management, Plan for Disaster Recovery (DR)                                                  |
| REL13-BP02 | Use defined recovery strategies to meet the recovery objectives                                     | Failure management, Plan for Disaster Recovery (DR)                                                  |
| REL13-BP03 | Test disaster recovery implementation to validate the implementation                                | Failure management, Plan for Disaster Recovery (DR)                                                  |
| REL13-BP04 | Manage configuration drift at the DR site or Region                                                 | Failure management, Plan for Disaster Recovery (DR)                                                  |

## MEDIUM Risk Practices

| ID          | Title                                                                                                        | Areas                                                                                                |
| :---------- | :----------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------- |
| REL01-BP03  | Accommodate fixed service quotas and constraints through architecture                                        | Foundations, Manage service quotas and constraints                                                   |
| REL01-BP04  | Monitor and manage quotas                                                                                    | Foundations, Manage service quotas and constraints                                                   |
| REL01-BP05  | Automate quota management                                                                                    | Foundations, Manage service quotas and constraints                                                   |
| REL01-BP06  | Ensure that a sufficient gap exists between the current quotas and the maximum usage to accommodate failover | Foundations, Manage service quotas and constraints                                                   |
| REL02-BP03  | Ensure IP subnet allocation accounts for expansion and availability                                          | Foundations, Plan your network topology                                                              |
| REL02-BP04  | Prefer hub-and-spoke topologies over many-to-many mesh                                                       | Foundations, Plan your network topology                                                              |
| REL02-BP05  | Enforce non-overlapping private IP address ranges in all private address spaces where they are connected     | Foundations, Plan your network topology                                                              |
| REL03-BP03  | Provide service contracts per API                                                                            | Workload architecture, Design your workload service architecture                                     |
| REL04-BP04  | Make mutating operations idempotent                                                                          | Workload architecture, Design interactions in a distributed system to prevent failures               |
| REL05-BP06  | Make systems stateless where possible                                                                        | Workload architecture, Design interactions in a distributed system to mitigate or withstand failures |
| REL05-BP07  | Implement emergency levers                                                                                   | Workload architecture, Design interactions in a distributed system to mitigate or withstand failures |
| REL06-BP04  | Automate responses (Real-time processing and alarming)                                                       | Change management, Monitor workload resources                                                        |
| REL06-BP05  | Analyze logs                                                                                                 | Change management, Monitor workload resources                                                        |
| REL06-BP06  | Regularly review monitoring scope and metrics                                                                | Change management, Monitor workload resources                                                        |
| REL06-BP07  | Monitor end-to-end tracing of requests through your system                                                   | Change management, Monitor workload resources                                                        |
| REL07-BP02  | Obtain resources upon detection of impairment to a workload                                                  | Change management, Design your workload to adapt to changes in demand                                |
| REL07-BP03  | Obtain resources upon detection that more resources are needed for a workload                                | Change management, Design your workload to adapt to changes in demand                                |
| REL07-BP04  | Load test your workload                                                                                      | Change management, Design your workload to adapt to changes in demand                                |
| REL08-BP03  | Integrate resiliency testing as part of your deployment                                                      | Change management, Implement change                                                                  |
| REL08-BP04  | Deploy using immutable infrastructure                                                                        | Change management, Implement change                                                                  |
| REL08-BP05  | Deploy changes with automation                                                                               | Change management, Implement change                                                                  |
| REL09-BP03  | Perform data backup automatically                                                                            | Failure management, Back up data                                                                     |
| PREL09-BP04 | Perform periodic recovery of the data to verify backup integrity and processes                               | Failure management, Back up data                                                                     |
| REL10-BP02  | Automate recovery for components constrained to a single location                                            | Failure management, Use fault isolation to protect your workload                                     |
| REL11-BP04  | Rely on the data plane and not the control plane during recovery                                             | Failure management, Design your workload to withstand component failures                             |
| REL11-BP05  | Use static stability to prevent bimodal behavior                                                             | Failure management, Design your workload to withstand component failures                             |
| REL11-BP06  | Send notifications when events impact availability                                                           | Failure management, Design your workload to withstand component failures                             |
| REL11-BP07  | Architect your product to meet availability targets and uptime service level agreements (SLAs)               | Failure management, Design your workload to withstand component failures                             |
| REL12-BP04  | Test resiliency using chaos engineering                                                                      | Failure management, Test reliability                                                                 |
| REL12-BP05  | Conduct game days regularly                                                                                  | Failure management, Test reliability                                                                 |
| REL13-BP05  | Automate recovery                                                                                            | Failure management, Plan for Disaster Recovery (DR)                                                  |

## LOW Risk Practices

| ID         | Title            | Areas                                                                                  |
| :--------- | :--------------- | :------------------------------------------------------------------------------------- |
| REL04-BP03 | Do constant work | Workload architecture, Design interactions in a distributed system to prevent failures |

## Practice Details

### REL01-BP01: Aware of service quotas and constraints

**Risk:** HIGH
**Areas:** Foundations, Manage service quotas and constraints

Be aware of your default quotas and manage your quota increase requests for your workload architecture. Know which cloud resource constraints, such as disk or network, are potentially impactful.

**Related:** REL01-BP02, REL01-BP03, REL01-BP04, REL01-BP05, REL01-BP06, REL03-BP01, REL10-BP01, REL11-BP01, REL11-BP03, REL12-BP04

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/rel_manage_service_limits_aware_quotas_and_constraints.html>

### REL01-BP02: Manage service quotas across accounts and regions

**Risk:** HIGH
**Areas:** Foundations, Manage service quotas and constraints

If you are using multiple accounts or Regions, request the appropriate quotas in all environments in which your production workloads run.

**Related:** REL01-BP01, REL01-BP03, REL01-BP04, REL01-BP05, REL01-BP06, REL03-BP01, REL10-BP01, REL11-BP01, REL11-BP03, REL12-BP04

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/rel_manage_service_limits_limits_considered.html>

### REL01-BP03: Accommodate fixed service quotas and constraints through architecture

**Risk:** MEDIUM
**Areas:** Foundations, Manage service quotas and constraints

Be aware of unchangeable service quotas, service constraints, and physical resource limits. Design architectures for applications and services to prevent these limits from impacting reliability.

**Related:** REL01-BP01, REL01-BP02, REL01-BP04, REL01-BP05, REL01-BP06, REL03-BP01, REL10-BP01, REL11-BP01, REL11-BP03, REL12-BP04

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/rel_manage_service_limits_aware_fixed_limits.html>

### REL01-BP04: Monitor and manage quotas

**Risk:** MEDIUM
**Areas:** Foundations, Manage service quotas and constraints

Evaluate your potential usage and increase your quotas appropriately, allowing for planned growth in usage.

**Related:** REL01-BP01, REL01-BP02, REL01-BP03, REL01-BP05, REL01-BP06, REL03-BP01, REL10-BP01, REL11-BP01, REL11-BP03, REL12-BP04

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/rel_manage_service_limits_monitor_manage_limits.html>

### REL01-BP05: Automate quota management

**Risk:** MEDIUM
**Areas:** Foundations, Manage service quotas and constraints

Service quotas, also referred to as limits in AWS services, are the maximum values for the resources in your AWS account. Each AWS service defines a set of quotas and their default values. To provide your workload access to all the resources it needs, you might need to increase your service quota values.

**Related:** REL10-BP07

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/rel_manage_service_limits_automated_monitor_limits.html>

### REL01-BP06: Ensure that a sufficient gap exists between the current quotas and the maximum usage to accommodate failover

**Risk:** MEDIUM
**Areas:** Foundations, Manage service quotas and constraints

This article explains how to maintain space between the resource quota and your usage, and how it can benefit your organization. After you finish using a resource, the usage quota may continue to account for that resource. This can result in a failing or inaccessible resource. Prevent resource failure by verifying that your quotas cover the overlap of inaccessible resources and their replacements. Consider cases like network failure, Availability Zone failure, or Region failures when calculating this gap.

**Related:** REL01-BP01, REL01-BP02, REL01-BP03, REL01-BP04, REL01-BP05, REL03-BP01, REL10-BP01, REL11-BP01, REL11-BP03, REL12-BP04

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/rel_manage_service_limits_suff_buffer_limits.html>

### REL02-BP01: Use highly available network connectivity for your workload public endpoints

**Risk:** HIGH
**Areas:** Foundations, Plan your network topology

Building highly available network connectivity to public endpoints of your workloads can help you reduce downtime due to loss of connectivity and improve the availability and SLA of your workload. To achieve this, use highly available DNS, content delivery networks (CDNs), API gateways, load balancing, or reverse proxies.

**Related:** REL10-BP01, REL11-BP04, REL11-BP06

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/rel_planning_network_topology_ha_conn_users.html>

### REL02-BP02: Provision redundant connectivity between private networks in the cloud and on-premises environments

**Risk:** HIGH
**Areas:** Foundations, Plan your network topology

Implement redundancy in your connections between private networks in the cloud and on-premises environments to achieve connectivity resilience. This can be accomplished by deploying two or more links and traffic paths, preserving connectivity in the event of network failures.

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/rel_planning_network_topology_ha_conn_private_networks.html>

### REL02-BP03: Ensure IP subnet allocation accounts for expansion and availability

**Risk:** MEDIUM
**Areas:** Foundations, Plan your network topology

Amazon VPC IP address ranges must be large enough to accommodate workload requirements, including factoring in future expansion and allocation of IP addresses to subnets across Availability Zones. This includes load balancers, EC2 instances, and container-based applications.

**Related:** REL02-BP05

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/rel_planning_network_topology_ip_subnet_allocation.html>

### REL02-BP04: Prefer hub-and-spoke topologies over many-to-many mesh

**Risk:** MEDIUM
**Areas:** Foundations, Plan your network topology

When connecting multiple private networks, such as Virtual Private Clouds (VPCs) and on-premises networks, opt for a hub-and-spoke topology over a meshed one. Unlike meshed topologies, where each network connects directly to the others and increases the complexity and management overhead, the hub-and-spoke architecture centralizes connections through a single hub. This centralization simplifies the network structure and enhances its operability, scalability, and control.

**Related:** REL02-BP03, REL02-BP05

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/rel_planning_network_topology_prefer_hub_and_spoke.html>

### REL02-BP05: Enforce non-overlapping private IP address ranges in all private address spaces where they are connected

**Risk:** MEDIUM
**Areas:** Foundations, Plan your network topology

The IP address ranges of each of your VPCs must not overlap when peered, connected via Transit Gateway, or connected over VPN. Avoid IP address conflicts between a VPC and on-premises environments or with other cloud providers that you use. You must also have a way to allocate private IP address ranges when needed. An IP address management (IPAM) system can help with automating this.

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/rel_planning_network_topology_non_overlap_ip.html>

### REL03-BP01: Choose how to segment your workload

**Risk:** HIGH
**Areas:** Workload architecture, Design your workload service architecture

Workload segmentation is important when determining the resilience requirements of your application. Monolithic architecture should be avoided whenever possible. Instead, carefully consider which application components can be broken out into microservices. Depending on your application requirements, this may end up being a combination of a service-oriented architecture (SOA) with microservices where possible. Workloads that are capable of statelessness are more capable of being deployed as microservices.

**Related:** REL03-BP02

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/rel_service_architecture_monolith_soa_microservice.html>

### REL03-BP02: Build services focused on specific business domains and functionality

**Risk:** HIGH
**Areas:** Workload architecture, Design your workload service architecture

Service-oriented architectures (SOA) define services with well-delineated functions defined by business needs. Microservices use domain models and bounded context to draw service boundaries along business context boundaries. Focusing on business domains and functionality helps teams define independent reliability requirements for their services. Bounded contexts isolate and encapsulate business logic, allowing teams to better reason about how to handle failures.

**Related:** REL03-BP01, REL03-BP03

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/rel_service_architecture_business_domains.html>

### REL03-BP03: Provide service contracts per API

**Risk:** MEDIUM
**Areas:** Workload architecture, Design your workload service architecture

Service contracts are documented agreements between API producers and consumers defined in a machine-readable API definition. A contract versioning strategy allows consumers to continue using the existing API and migrate their applications to a newer API when they are ready. Producer deployment can happen any time as long as the contract is followed. Service teams can use the technology stack of their choice to satisfy the API contract.

**Related:** REL03-BP01, REL03-BP02, REL04-BP02, REL05-BP03, REL05-BP05

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/rel_service_architecture_api_contracts.html>

### REL04-BP01: Identify the kind of distributed systems you depend on

**Risk:** HIGH
**Areas:** Workload architecture, Design interactions in a distributed system to prevent failures

Distributed systems can be synchronous, asynchronous, or batch. Synchronous systems must process requests as quickly as possible and communicate with each other by making synchronous request and response calls using HTTP/S, REST, or remote procedure call (RPC) protocols. Asynchronous systems communicate with each other by exchanging data asynchronously through an intermediary service without coupling individual systems. Batch systems receive a large volume of input data, run automated data processes without human intervention, and generate output data.

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/rel_prevent_interaction_failure_identify.html>

### REL04-BP02: Implement loosely coupled dependencies

**Risk:** HIGH
**Areas:** Workload architecture, Design interactions in a distributed system to prevent failures

Dependencies such as queuing systems, streaming systems, workflows, and load balancers are loosely coupled. Loose coupling helps isolate behavior of a component from other components that depend on it, increasing resiliency and agility.

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/rel_prevent_interaction_failure_loosely_coupled_system.html>

### REL04-BP03: Do constant work

**Risk:** LOW
**Areas:** Workload architecture, Design interactions in a distributed system to prevent failures

Systems can fail when there are large, rapid changes in load. For example, if your workload is doing a health check that monitors the health of thousands of servers, it should send the same size payload (a full snapshot of the current state) each time. Whether no servers are failing, or all of them, the health check system is doing constant work with no large, rapid changes.

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/rel_prevent_interaction_failure_constant_work.html>

### REL04-BP04: Make mutating operations idempotent

**Risk:** MEDIUM
**Areas:** Workload architecture, Design interactions in a distributed system to prevent failures

An idempotent service promises that each request is processed exactly once, such that making multiple identical requests has the same effect as making a single request. This makes it easier for a client to implement retries without fear that a request is erroneously processed multiple times. To do this, clients can issue API requests with an idempotency token, which is used whenever the request is repeated. An idempotent service API uses the token to return a response identical to the response that was returned the first time that the request was completed, even if the underlying state of the system has changed.

**Related:** REL05-BP03, REL06-BP01, REL06-BP03, REL08-BP02

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/rel_prevent_interaction_failure_idempotent.html>

### REL05-BP01: Implement graceful degradation to transform applicable hard dependencies into soft dependencies

**Risk:** HIGH
**Areas:** Workload architecture, Design interactions in a distributed system to mitigate or withstand failures

Application components should continue to perform their core function even if dependencies become unavailable. They might be serving slightly stale data, alternate data, or even no data. This ensures overall system function is only minimally impeded by localized failures while delivering the central business value.

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/rel_mitigate_interaction_failure_graceful_degradation.html>

### REL05-BP02: Throttle requests

**Risk:** HIGH
**Areas:** Workload architecture, Design interactions in a distributed system to mitigate or withstand failures

Throttle requests to mitigate resource exhaustion due to unexpected increases in demand. Requests below throttling rates are processed while those over the defined limit are rejected with a return message indicating the request was throttled.

**Related:** REL04-BP03, REL05-BP03

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/rel_mitigate_interaction_failure_throttle_requests.html>

### REL05-BP03: Control and limit retry calls

**Risk:** HIGH
**Areas:** Workload architecture, Design interactions in a distributed system to mitigate or withstand failures

Use exponential backoff to retry requests at progressively longer intervals between each retry. Introduce jitter between retries to randomize retry intervals. Limit the maximum number of retries.

**Related:** REL04-BP04, REL05-BP02, REL05-BP04, REL05-BP05, REL11-BP01

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/rel_mitigate_interaction_failure_limit_retries.html>

### REL05-BP04: Fail fast and limit queues

**Risk:** HIGH
**Areas:** Workload architecture, Design interactions in a distributed system to mitigate or withstand failures

When a service is unable to respond successfully to a request, fail fast. This allows resources associated with a request to be released, and permits a service to recover if it’s running out of resources. Failing fast is a well-established software design pattern that can be leveraged to build highly reliable workloads in the cloud. Queuing is also a well-established enterprise integration pattern that can smooth load and allow clients to release resources when asynchronous processing can be tolerated. When a service is able to respond successfully under normal conditions but fails when the rate of requests is too high, use a queue to buffer requests. However, do not allow a buildup of long queue backlogs that can result in processing stale requests that a client has already given up on.

**Related:** REL04-BP02, REL05-BP02, REL05-BP03, REL06-BP02, REL06-BP07

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/rel_mitigate_interaction_failure_fail_fast.html>

### REL05-BP05: Set client timeouts

**Risk:** HIGH
**Areas:** Workload architecture, Design interactions in a distributed system to mitigate or withstand failures

Set timeouts appropriately on connections and requests, verify them systematically, and do not rely on default values as they are not aware of workload specifics.

**Related:** REL05-BP03, REL05-BP04, REL06-BP07

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/rel_mitigate_interaction_failure_client_timeouts.html>

### REL05-BP06: Make systems stateless where possible

**Risk:** MEDIUM
**Areas:** Workload architecture, Design interactions in a distributed system to mitigate or withstand failures

Systems should either not require state, or should offload state such that between different client requests, there is no dependence on locally stored data on disk and in memory. This allows servers to be replaced at will without causing an availability impact.

**Related:** REL11-BP03

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/rel_mitigate_interaction_failure_stateless.html>

### REL05-BP07: Implement emergency levers

**Risk:** MEDIUM
**Areas:** Workload architecture, Design interactions in a distributed system to mitigate or withstand failures

Emergency levers are rapid processes that can mitigate availability impact on your workload.

**Related:** REL05-BP01, REL05-BP02, REL11-BP05

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/rel_mitigate_interaction_failure_emergency_levers.html>

### REL06-BP01: Monitor all components for the workload (Generation)

**Risk:** HIGH
**Areas:** Change management, Monitor workload resources

Monitor the components of the workload with Amazon CloudWatch or third-party tools. Monitor AWS services with AWS Health Dashboard.

**Related:** REL11-BP03

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/rel_monitor_aws_resources_monitor_resources.html>

### REL06-BP02: Define and calculate metrics (Aggregation)

**Risk:** HIGH
**Areas:** Change management, Monitor workload resources

Collect metrics and logs from your workload components and calculate relevant aggregate metrics from them. These metrics provide broad and deep observability of your workload and can significantly improve your resilience posture.

**Related:** REL06-BP01, REL06-BP03, REL06-BP04, REL06-BP05, REL06-BP06, REL06-BP07

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/rel_monitor_aws_resources_notification_aggregation.html>

### REL06-BP03: Send notifications (Real-time processing and alarming)

**Risk:** HIGH
**Areas:** Change management, Monitor workload resources

When organizations detect potential issues, they send real-time notifications and alerts to the appropriate personnel and systems in order to respond quickly and effectively to these issues.

**Related:** REL06-BP01, REL06-BP02, REL12-BP01

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/rel_monitor_aws_resources_notification_monitor.html>

### REL06-BP04: Automate responses (Real-time processing and alarming)

**Risk:** MEDIUM
**Areas:** Change management, Monitor workload resources

Use automation to take action when an event is detected, for example, to replace failed components.

**Related:** REL06-BP01, REL06-BP02, REL06-BP03, REL08-BP01

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/rel_monitor_aws_resources_automate_response_monitor.html>

### REL06-BP05: Analyze logs

**Risk:** MEDIUM
**Areas:** Change management, Monitor workload resources

Collect log files and metrics histories and analyze these for broader trends and workload insights.

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/rel_monitor_aws_resources_storage_analytics.html>

### REL06-BP06: Regularly review monitoring scope and metrics

**Risk:** MEDIUM
**Areas:** Change management, Monitor workload resources

Frequently review how workload monitoring is implemented, and update it as your workload and its architecture evolves. Regular audits of your monitoring helps reduce the risk of missed or overlooked trouble indicators and further helps your workload meet its availability goals.

**Related:** REL06-BP01, REL06-BP02, REL06-BP07, REL12-BP02, REL12-BP06

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/rel_monitor_aws_resources_review_monitoring.html>

### REL06-BP07: Monitor end-to-end tracing of requests through your system

**Risk:** MEDIUM
**Areas:** Change management, Monitor workload resources

Trace requests as they process through service components so product teams can more easily analyze and debug issues and improve performance.

**Related:** REL06-BP01, REL11-BP01

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/rel_monitor_aws_resources_end_to_end.html>

### REL07-BP01: Use automation when obtaining or scaling resources

**Risk:** HIGH
**Areas:** Change management, Design your workload to adapt to changes in demand

A cornerstone of reliability in the cloud is the programmatic definition, provisioning, and management of your infrastructure and resources. Automation helps you streamline resource provisioning, facilitate consistent and secure deployments, and scale resources across your entire infrastructure.

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/rel_adapt_to_changes_autoscale_adapt.html>

### REL07-BP02: Obtain resources upon detection of impairment to a workload

**Risk:** MEDIUM
**Areas:** Change management, Design your workload to adapt to changes in demand

Scale resources reactively when necessary if availability is impacted, to restore workload availability.

**Related:** REL07-BP01, REL11-BP01

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/rel_adapt_to_changes_reactive_adapt_auto.html>

### REL07-BP03: Obtain resources upon detection that more resources are needed for a workload

**Risk:** MEDIUM
**Areas:** Change management, Design your workload to adapt to changes in demand

One of the most valuable features of cloud computing is the ability to provision resources dynamically.

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/rel_adapt_to_changes_proactive_adapt_auto.html>

### REL07-BP04: Load test your workload

**Risk:** MEDIUM
**Areas:** Change management, Design your workload to adapt to changes in demand

Adopt a load testing methodology to measure if scaling activity meets workload requirements.

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/rel_adapt_to_changes_load_tested_adapt.html>

### REL08-BP01: Use runbooks for standard activities such as deployment

**Risk:** HIGH
**Areas:** Change management, Implement change

Runbooks are the predefined procedures to achieve specific outcomes. Use runbooks to perform standard activities, whether done manually or automatically. Examples include deploying a workload, patching a workload, or making DNS modifications.

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/rel_tracking_change_management_planned_changemgmt.html>

### REL08-BP02: Integrate functional testing as part of your deployment

**Risk:** HIGH
**Areas:** Change management, Implement change

Use techniques such as unit tests and integration tests that validate required functionality.

**Related:** REL07-BP04, REL08-BP03, REL12-BP04

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/rel_tracking_change_management_functional_testing.html>

### REL08-BP03: Integrate resiliency testing as part of your deployment

**Risk:** MEDIUM
**Areas:** Change management, Implement change

Integrate resiliency testing by consciously introducing failures in your system to measure its capability in case of disruptive scenarios. Resilience tests are different from unit and function tests that are usually integrated in deployment cycles, as they focus on the identification of unanticipated failures in your system. While it is safe to start with resiliency testing integration in pre-production, set a goal to implement these tests in production as a part of your game days.

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/rel_tracking_change_management_resiliency_testing.html>

### REL08-BP04: Deploy using immutable infrastructure

**Risk:** MEDIUM
**Areas:** Change management, Implement change

Immutable infrastructure is a model that mandates that no updates, security patches, or configuration changes happen in-place on production workloads. When a change is needed, the architecture is built onto new infrastructure and deployed into production.

**Related:** REL08-BP05

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/rel_tracking_change_management_immutable_infrastructure.html>

### REL08-BP05: Deploy changes with automation

**Risk:** MEDIUM
**Areas:** Change management, Implement change

Deployments and patching are automated to eliminate negative impact.

**Related:** OPS05-BP04, OPS05-BP10, OPS06-BP02, OPS06-BP04

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/rel_tracking_change_management_automated_changemgmt.html>

### REL09-BP01: Identify and back up all data that needs to be backed up, or reproduce the data from sources

**Risk:** HIGH
**Areas:** Failure management, Back up data

Understand and use the backup capabilities of the data services and resources used by the workload. Most services provide capabilities to back up workload data.

**Related:** REL13-BP01, REL13-BP02

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/rel_backing_up_data_identified_backups_data.html>

### REL09-BP02: Secure and encrypt backups

**Risk:** HIGH
**Areas:** Failure management, Back up data

Control and detect access to backups using authentication and authorization. Prevent and detect if data integrity of backups is compromised using encryption.

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/rel_backing_up_data_secured_backups_data.html>

### REL09-BP03: Perform data backup automatically

**Risk:** MEDIUM
**Areas:** Failure management, Back up data

Configure backups to be taken automatically based on a periodic schedule informed by the Recovery Point Objective (RPO), or by changes in the dataset. Critical datasets with low data loss requirements need to be backed up automatically on a frequent basis, whereas less critical data where some loss is acceptable can be backed up less frequently.

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/rel_backing_up_data_automated_backups_data.html>

### PREL09-BP04: Perform periodic recovery of the data to verify backup integrity and processes

**Risk:** MEDIUM
**Areas:** Failure management, Back up data

Validate that your backup process implementation meets your Recovery Time Objectives (RTO) and Recovery Point Objectives (RPO) by performing a recovery test.

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/rel_backing_up_data_periodic_recovery_testing_data.html>

### REL10-BP01: Deploy the workload to multiple locations

**Risk:** HIGH
**Areas:** Failure management, Use fault isolation to protect your workload

Distribute workload data and resources across multiple Availability Zones or, where necessary, across AWS Regions.

**Related:** REL02-BP03, REL13-BP01, REL11-BP05

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/rel_fault_isolation_multiaz_region_system.html>

### REL10-BP02: Automate recovery for components constrained to a single location

**Risk:** MEDIUM
**Areas:** Failure management, Use fault isolation to protect your workload

If components of the workload can only run in a single Availability Zone or in an on-premises data center, implement the capability to do a complete rebuild of the workload within your defined recovery objectives.

**Related:** REL02-BP03, REL13-BP01, REL11-BP05

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/rel_fault_isolation_single_az_system.html>

### REL10-BP03: Use bulkhead architectures to limit scope of impact

**Risk:** HIGH
**Areas:** Failure management, Use fault isolation to protect your workload

Implement bulkhead architectures (also known as cell-based architectures) to restrict the effect of failure within a workload to a limited number of components.

**Related:** REL07-BP04, REL10-BP01

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/rel_fault_isolation_use_bulkhead.html>

### REL11-BP01: Monitor all components of the workload to detect failures

**Risk:** HIGH
**Areas:** Failure management, Design your workload to withstand component failures

Continually monitor the health of your workload so that you and your automated systems are aware of failures or degradations as soon as they occur. Monitor for key performance indicators (KPIs) based on business value.

**Related:** REL11-BP06

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/rel_withstand_component_failures_monitoring_health.html>

### REL11-BP02: Fail over to healthy resources

**Risk:** HIGH
**Areas:** Failure management, Design your workload to withstand component failures

If a resource failure occurs, healthy resources should continue to serve requests. For location impairments (such as Availability Zone or AWS Region), ensure that you have systems in place to fail over to healthy resources in unimpaired locations.

**Related:** REL10, REL13

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/rel_withstand_component_failures_failover2good.html>

### REL11-BP03: Automate healing on all layers

**Risk:** HIGH
**Areas:** Failure management, Design your workload to withstand component failures

Upon detection of a failure, use automated capabilities to perform actions to remediate. Degradations may be automatically healed through internal service mechanisms or require resources to be restarted or removed through remediation actions.

**Related:** REL11-BP01

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/rel_withstand_component_failures_auto_healing_system.html>

### REL11-BP04: Rely on the data plane and not the control plane during recovery

**Risk:** MEDIUM
**Areas:** Failure management, Design your workload to withstand component failures

Control planes provide the administrative APIs used to create, read and describe, update, delete, and list (CRUDL) resources, while data planes handle day-to-day service traffic. When implementing recovery or mitigation responses to potentially resiliency-impacting events, focus on using a minimal number of control plane operations to recover, rescale, restore, heal, or failover the service. Data plane action should supersede any activity during these degradation events.

**Related:** REL11-BP01

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/rel_withstand_component_failures_avoid_control_plane.html>

### REL11-BP05: Use static stability to prevent bimodal behavior

**Risk:** MEDIUM
**Areas:** Failure management, Design your workload to withstand component failures

Workloads should be statically stable and only operate in a single normal mode. Bimodal behavior is when your workload exhibits different behavior under normal and failure modes.

**Related:** REL11-BP01, REL11-BP04

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/rel_withstand_component_failures_static_stability.html>

### REL11-BP06: Send notifications when events impact availability

**Risk:** MEDIUM
**Areas:** Failure management, Design your workload to withstand component failures

Notifications are sent upon the detection of thresholds breached, even if the event causing the issue was automatically resolved.

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/rel_withstand_component_failures_notifications_sent_system.html>

### REL11-BP07: Architect your product to meet availability targets and uptime service level agreements (SLAs)

**Risk:** MEDIUM
**Areas:** Failure management, Design your workload to withstand component failures

Architect your product to meet availability targets and uptime service level agreements (SLAs). If you publish or privately agree to availability targets or uptime SLAs, verify that your architecture and operational processes are designed to support them.

**Related:** REL03-BP01, REL10-BP01, REL11-BP01, REL11-BP03, REL12-BP04, REL13-BP01

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/rel_withstand_component_failures_service_level_agreements.html>

### REL12-BP01: Use playbooks to investigate failures

**Risk:** HIGH
**Areas:** Failure management, Test reliability

Permit consistent and prompt responses to failure scenarios that are not well understood, by documenting the investigation process in playbooks. Playbooks are the predefined steps performed to identify the factors contributing to a failure scenario. The results from any process step are used to determine the next steps to take until the issue is identified or escalated.

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/rel_testing_resiliency_playbook_resiliency.html>

### REL12-BP02: Perform post-incident analysis

**Risk:** HIGH
**Areas:** Failure management, Test reliability

Review customer-impacting events, and identify the contributing factors and preventative action items. Use this information to develop mitigations to limit or prevent recurrence. Develop procedures for prompt and effective responses. Communicate contributing factors and corrective actions as appropriate, tailored to target audiences. Have a method to communicate these causes to others as needed.

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/rel_testing_resiliency_rca_resiliency.html>

### REL12-BP03: Test scalability and performance requirements

**Risk:** HIGH
**Areas:** Failure management, Test reliability

Use techniques such as load testing to validate that the workload meets scaling and performance requirements.

**Related:** REL01-BP04, REL06-BP01, REL06-BP03

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/rel_testing_resiliency_test_non_functional.html>

### REL12-BP04: Test resiliency using chaos engineering

**Risk:** MEDIUM
**Areas:** Failure management, Test reliability

Run chaos experiments regularly in environments that are in or as close to production as possible to understand how your system responds to adverse conditions.

**Related:** REL08-BP03, REL13-BP03

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/rel_testing_resiliency_failure_injection_resiliency.html>

### REL12-BP05: Conduct game days regularly

**Risk:** MEDIUM
**Areas:** Failure management, Test reliability

Conduct game days to regularly exercise your procedures for responding to workload-impacting events and impairments. Involve the same teams who would be responsible for handling production scenarios. These exercises help enforce measures to prevent user impact caused by production events. When you practice your response procedures in realistic conditions, you can identify and address any gaps or weaknesses before a real event occurs.

**Related:** REL12-BP01, REL12-BP04, OPS04-BP01, OPS07-BP03, OPS10-BP01

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/rel_testing_resiliency_game_days_resiliency.html>

### REL13-BP01: Define recovery objectives for downtime and data loss

**Risk:** HIGH
**Areas:** Failure management, Plan for Disaster Recovery (DR)

Failures can impact your business in several ways. First, failures can cause service interruption (downtime). Second, failures can cause data to become lost, inconsistent, or stale. In order to guide how you respond and recover from failures, define a Recovery Time Objective (RTO) and Recovery Point Objective (RPO) for each workload. Recovery Time Objective (RTO) is the maximum acceptable delay between the interruption of service and restoration of service. Recovery Point Objective (RPO)  is the maximum acceptable time after the last data recovery point.

**Related:** REL09-BP04, REL12-BP01, OPS13-BP02, OPS13-BP03

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/rel_planning_for_recovery_objective_defined_recovery.html>

### REL13-BP02: Use defined recovery strategies to meet the recovery objectives

**Risk:** HIGH
**Areas:** Failure management, Plan for Disaster Recovery (DR)

Define a disaster recovery (DR) strategy that meets your workload's recovery objectives. Choose a strategy such as backup and restore, standby (active/passive), or active/active.

**Related:** REL09-BP01, REL11-BP04, OPS13-BP01

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/rel_planning_for_recovery_disaster_recovery.html>

### REL13-BP03: Test disaster recovery implementation to validate the implementation

**Risk:** HIGH
**Areas:** Failure management, Plan for Disaster Recovery (DR)

Regularly test failover to your recovery site to verify that it operates properly and that RTO and RPO are met.

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/rel_planning_for_recovery_dr_tested.html>

### REL13-BP04: Manage configuration drift at the DR site or Region

**Risk:** HIGH
**Areas:** Failure management, Plan for Disaster Recovery (DR)

To perform a successful disaster recovery (DR) procedure, your workload must be able to resume normal operations in a timely manner with no relevant loss of functionality or data once the DR environment has been brought online. To achieve this goal, it's essential to maintain consistent infrastructure, data, and configurations between your DR environment and the primary environment.

**Related:** REL01-BP01, REL01-BP02, REL01-BP04, REL13-BP03

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/rel_planning_for_recovery_config_drift.html>

### REL13-BP05: Automate recovery

**Risk:** MEDIUM
**Areas:** Failure management, Plan for Disaster Recovery (DR)

Implement tested and automated recovery mechanisms that are reliable, observable, and reproducible to reduce the risk and business impact of failure.

**Related:** REL07-BP01, REL11-BP01, REL13-BP02, REL13-BP03, REL13-BP04

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/rel_planning_for_recovery_auto_recovery.html>
