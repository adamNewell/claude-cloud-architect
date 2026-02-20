# Sustainability Pillar Best Practices

Minimize environmental impacts of running cloud workloads.

## Contents

- [HIGH Risk Practices](#high-risk-practices)
- [MEDIUM Risk Practices](#medium-risk-practices)
- [LOW Risk Practices](#low-risk-practices)
- [Practice Details](#practice-details)

## HIGH Risk Practices

*No practices at this risk level.*

## MEDIUM Risk Practices

| ID         | Title                                                                                      | Areas                     |
| :--------- | :----------------------------------------------------------------------------------------- | :------------------------ |
| SUS02-BP01 | Scale workload infrastructure dynamically                                                  | Alignment to demand       |
| SUS02-BP04 | Optimize geographic placement of workloads based on their networking requirements          | Alignment to demand       |
| SUS03-BP01 | Optimize software and architecture for asynchronous and scheduled jobs                     | Software and architecture |
| SUS03-BP02 | Remove or refactor workload components with low or no use                                  | Software and architecture |
| SUS03-BP03 | Optimize areas of code that consume the most time or resources                             | Software and architecture |
| SUS03-BP04 | Optimize impact on devices and equipment                                                   | Software and architecture |
| SUS03-BP05 | Use software patterns and architectures that best support data access and storage patterns | Software and architecture |
| SUS04-BP01 | Implement a data classification policy                                                     | Data management           |
| SUS04-BP03 | Use policies to manage the lifecycle of your datasets                                      | Data management           |
| SUS04-BP04 | Use elasticity and automation to expand block storage or file system                       | Data management           |
| SUS04-BP05 | Remove unneeded or redundant data                                                          | Data management           |
| SUS04-BP06 | Use shared file systems or storage to access common data                                   | Data management           |
| SUS04-BP07 | Minimize data movement across networks                                                     | Data management           |
| SUS04-BP08 | Back up data only when difficult to recreate                                               | Data management           |
| SUS05-BP01 | Use the minimum amount of hardware to meet your needs                                      | Hardware and services     |
| SUS05-BP02 | Use instance types with the least impact                                                   | Hardware and services     |
| SUS05-BP03 | Use managed services                                                                       | Hardware and services     |
| SUS05-BP04 | Optimize your use of hardware-based compute accelerators                                   | Hardware and services     |
| SUS06-BP01 | Communicate and cascade your sustainability goals                                          | Process and culture       |
| SUS06-BP02 | Adopt methods that can rapidly introduce sustainability improvements                       | Process and culture       |

## LOW Risk Practices

| ID         | Title                                                          | Areas               |
| :--------- | :------------------------------------------------------------- | :------------------ |
| SUS02-BP02 | Align SLAs with sustainability goals                           | Alignment to demand |
| SUS02-BP03 | Stop the creation and maintenance of unused assets             | Alignment to demand |
| SUS02-BP05 | Optimize team member resources for activities performed        | Alignment to demand |
| SUS02-BP06 | Implement buffering or throttling to flatten the demand curve  | Alignment to demand |
| SUS04-BP02 | Use technologies that support data access and storage patterns | Data management     |
| SUS06-BP03 | Keep your workload up-to-date                                  | Process and culture |
| SUS06-BP04 | Increase utilization of build environments                     | Process and culture |
| SUS06-BP05 | Use managed device farms for testing                           | Process and culture |

## Practice Details

### SUS02-BP01: Scale workload infrastructure dynamically

**Risk:** MEDIUM
**Areas:** Alignment to demand

Use elasticity of the cloud and scale your infrastructure dynamically to match supply of cloud resources to demand and avoid overprovisioned capacity in your workload.

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/sustainability-pillar/sus_sus_user_a2.html>

### SUS02-BP02: Align SLAs with sustainability goals

**Risk:** LOW
**Areas:** Alignment to demand

Review and optimize workload service-level agreements (SLA) based on your sustainability goals to minimize the resources required to support your workload while continuing to meet business needs.

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/sustainability-pillar/sus_sus_user_a3.html>

### SUS02-BP03: Stop the creation and maintenance of unused assets

**Risk:** LOW
**Areas:** Alignment to demand

Decommission unused assets in your workload to reduce the number of cloud resources required to support your demand and minimize waste.

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/sustainability-pillar/sus_sus_user_a4.html>

### SUS02-BP04: Optimize geographic placement of workloads based on their networking requirements

**Risk:** MEDIUM
**Areas:** Alignment to demand

Select cloud location and services for your workload that reduce the distance network traffic must travel and decrease the total network resources required to support your workload.

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/sustainability-pillar/sus_sus_user_a5.html>

### SUS02-BP05: Optimize team member resources for activities performed

**Risk:** LOW
**Areas:** Alignment to demand

Optimize resources provided to team members to minimize the environmental sustainability impact while supporting their needs.

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/sustainability-pillar/sus_sus_user_a6.html>

### SUS02-BP06: Implement buffering or throttling to flatten the demand curve

**Risk:** LOW
**Areas:** Alignment to demand

Buffering and throttling flatten the demand curve and reduce the provisioned capacity required for your workload.

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/sustainability-pillar/sus_sus_user_a7.html>

### SUS03-BP01: Optimize software and architecture for asynchronous and scheduled jobs

**Risk:** MEDIUM
**Areas:** Software and architecture

Use efficient software and architecture patterns such as queue-driven to maintain consistent high utilization of deployed resources.

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/sustainability-pillar/sus_sus_software_a2.html>

### SUS03-BP02: Remove or refactor workload components with low or no use

**Risk:** MEDIUM
**Areas:** Software and architecture

Remove components that are unused and no longer required, and refactor components with little utilization to minimize waste in your workload.

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/sustainability-pillar/sus_sus_software_a3.html>

### SUS03-BP03: Optimize areas of code that consume the most time or resources

**Risk:** MEDIUM
**Areas:** Software and architecture

Optimize your code that runs within different components of your architecture to minimize resource usage while maximizing performance.

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/sustainability-pillar/sus_sus_software_a4.html>

### SUS03-BP04: Optimize impact on devices and equipment

**Risk:** MEDIUM
**Areas:** Software and architecture

Understand the devices and equipment used in your architecture and use strategies to reduce their usage. This can minimize the overall environmental impact of your cloud workload.

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/sustainability-pillar/sus_sus_software_a5.html>

### SUS03-BP05: Use software patterns and architectures that best support data access and storage patterns

**Risk:** MEDIUM
**Areas:** Software and architecture

Understand how data is used within your workload, consumed by your users, transferred, and stored. Use software patterns and architectures that best support data access and storage to minimize the compute, networking, and storage resources required to support the workload.

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/sustainability-pillar/sus_sus_software_a6.html>

### SUS04-BP01: Implement a data classification policy

**Risk:** MEDIUM
**Areas:** Data management

Classify data to understand its criticality to business outcomes and choose the right energy-efficient storage tier to store the data.

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/sustainability-pillar/sus_sus_data_a2.html>

### SUS04-BP02: Use technologies that support data access and storage patterns

**Risk:** LOW
**Areas:** Data management

Use storage technologies that best support how your data is accessed and stored to minimize the resources provisioned while supporting your workload.

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/sustainability-pillar/sus_sus_data_a3.html>

### SUS04-BP03: Use policies to manage the lifecycle of your datasets

**Risk:** MEDIUM
**Areas:** Data management

Manage the lifecycle of all of your data and automatically enforce deletion to minimize the total storage required for your workload.

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/sustainability-pillar/sus_sus_data_a4.html>

### SUS04-BP04: Use elasticity and automation to expand block storage or file system

**Risk:** MEDIUM
**Areas:** Data management

Use elasticity and automation to expand block storage or file system as data grows to minimize the total provisioned storage.

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/sustainability-pillar/sus_sus_data_a5.html>

### SUS04-BP05: Remove unneeded or redundant data

**Risk:** MEDIUM
**Areas:** Data management

Remove unneeded or redundant data to minimize the storage resources required to store your datasets.

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/sustainability-pillar/sus_sus_data_a6.html>

### SUS04-BP06: Use shared file systems or storage to access common data

**Risk:** MEDIUM
**Areas:** Data management

Adopt shared file systems or storage to avoid data duplication and allow for more efficient infrastructure for your workload.

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/sustainability-pillar/sus_sus_data_a7.html>

### SUS04-BP07: Minimize data movement across networks

**Risk:** MEDIUM
**Areas:** Data management

Use shared file systems or object storage to access common data and minimize the total networking resources required to support data movement for your workload.

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/sustainability-pillar/sus_sus_data_a8.html>

### SUS04-BP08: Back up data only when difficult to recreate

**Risk:** MEDIUM
**Areas:** Data management

Avoid backing up data that has no business value to minimize storage resources requirements for your workload.

**Related:** REL09-BP01, REL09-BP03, REL13-BP02

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/sustainability-pillar/sus_sus_data_a9.html>

### SUS05-BP01: Use the minimum amount of hardware to meet your needs

**Risk:** MEDIUM
**Areas:** Hardware and services

Use the minimum amount of hardware for your workload to efficiently meet your business needs.

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/sustainability-pillar/sus_sus_hardware_a2.html>

### SUS05-BP02: Use instance types with the least impact

**Risk:** MEDIUM
**Areas:** Hardware and services

Continually monitor and use new instance types to take advantage of energy efficiency improvements.

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/sustainability-pillar/sus_sus_hardware_a3.html>

### SUS05-BP03: Use managed services

**Risk:** MEDIUM
**Areas:** Hardware and services

Use managed services to operate more efficiently in the cloud.

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/sustainability-pillar/sus_sus_hardware_a4.html>

### SUS05-BP04: Optimize your use of hardware-based compute accelerators

**Risk:** MEDIUM
**Areas:** Hardware and services

Optimize your use of accelerated computing instances to reduce the physical infrastructure demands of your workload.

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/sustainability-pillar/sus_sus_hardware_a5.html>

### SUS06-BP01: Communicate and cascade your sustainability goals

**Risk:** MEDIUM
**Areas:** Process and culture

Technology is a key enabler of sustainability. IT teams play a crucial role in driving meaningful change towards your organization's sustainability goals. These teams should clearly understand the company's sustainability targets and work to communicate and cascade those priorities across its operations.

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/sustainability-pillar/sus_sus_dev_a1.html>

### SUS06-BP02: Adopt methods that can rapidly introduce sustainability improvements

**Risk:** MEDIUM
**Areas:** Process and culture

Adopt methods and processes to validate potential improvements, minimize testing costs, and deliver small improvements.

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/sustainability-pillar/sus_sus_dev_a2.html>

### SUS06-BP03: Keep your workload up-to-date

**Risk:** LOW
**Areas:** Process and culture

Keep your workload up-to-date to adopt efficient features, remove issues, and improve the overall efficiency of your workload.

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/sustainability-pillar/sus_sus_dev_a3.html>

### SUS06-BP04: Increase utilization of build environments

**Risk:** LOW
**Areas:** Process and culture

Increase the utilization of resources to develop, test, and build your workloads.

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/sustainability-pillar/sus_sus_dev_a4.html>

### SUS06-BP05: Use managed device farms for testing

**Risk:** LOW
**Areas:** Process and culture

Use managed device farms to efficiently test a new feature on a representative set of hardware.

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/sustainability-pillar/sus_sus_dev_a5.html>
