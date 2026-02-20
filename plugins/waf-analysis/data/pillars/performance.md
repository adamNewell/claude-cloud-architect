# Performance Efficiency Pillar Best Practices

Use computing resources efficiently to meet requirements and maintain efficiency.

## Contents

- [HIGH Risk Practices](#high-risk-practices)
- [MEDIUM Risk Practices](#medium-risk-practices)
- [LOW Risk Practices](#low-risk-practices)
- [Practice Details](#practice-details)

## HIGH Risk Practices

| ID          | Title                                                                                       | Areas                           |
| :---------- | :------------------------------------------------------------------------------------------ | :------------------------------ |
| PERF01-BP01 | Learn about and understand available cloud services and features                            | Architecture selection          |
| PERF01-BP04 | Evaluate how trade-offs impact customers and architecture efficiency                        | Architecture selection          |
| PERF01-BP05 | Use policies and reference architectures                                                    | Architecture selection          |
| PERF02-BP01 | Select the best compute options for your workload                                           | Compute and hardware            |
| PERF02-BP03 | Collect compute-related metrics                                                             | Compute and hardware            |
| PERF02-BP05 | Scale your compute resources dynamically                                                    | Compute and hardware            |
| PERF03-BP01 | Use a purpose-built data store that best supports your data access and storage requirements | Data management                 |
| PERF03-BP03 | Collect and record data store performance metrics                                           | Data management                 |
| PERF04-BP01 | Understand how networking impacts performance                                               | Networking and content delivery |
| PERF04-BP02 | Evaluate available networking features                                                      | Networking and content delivery |
| PERF04-BP03 | Choose appropriate dedicated connectivity or VPN for your workload                          | Networking and content delivery |
| PERF04-BP04 | Use load balancing to distribute traffic across multiple resources                          | Networking and content delivery |
| PERF05-BP01 | Establish key performance indicators (KPIs) to measure workload health and performance      | Process and culture             |
| PERF05-BP02 | Use monitoring solutions to understand the areas where performance is most critical         | Process and culture             |

## MEDIUM Risk Practices

| ID          | Title                                                                                                                   | Areas                           |
| :---------- | :---------------------------------------------------------------------------------------------------------------------- | :------------------------------ |
| PERF01-BP02 | Use guidance from your cloud provider or an appropriate partner to learn about architecture patterns and best practices | Architecture selection          |
| PERF01-BP03 | Factor cost into architectural decisions                                                                                | Architecture selection          |
| PERF01-BP06 | Use benchmarking to drive architectural decisions                                                                       | Architecture selection          |
| PERF01-BP07 | Use a data-driven approach for architectural choices                                                                    | Architecture selection          |
| PERF02-BP02 | Understand the available compute configuration and features                                                             | Compute and hardware            |
| PERF02-BP04 | Configure and right-size compute resources                                                                              | Compute and hardware            |
| PERF02-BP06 | Use optimized hardware-based compute accelerators                                                                       | Compute and hardware            |
| PERF03-BP02 | Evaluate available configuration options for data store                                                                 | Data management                 |
| PERF03-BP04 | Implement strategies to improve query performance in data store                                                         | Data management                 |
| PERF03-BP05 | Implement data access patterns that utilize caching                                                                     | Data management                 |
| PERF04-BP05 | Choose network protocols to improve performance                                                                         | Networking and content delivery |
| PERF04-BP06 | Choose your workload's location based on network requirements                                                           | Networking and content delivery |
| PERF05-BP03 | Define a process to improve workload performance                                                                        | Process and culture             |
| PERF05-BP07 | Review metrics at regular intervals                                                                                     | Process and culture             |

## LOW Risk Practices

| ID          | Title                                                              | Areas                           |
| :---------- | :----------------------------------------------------------------- | :------------------------------ |
| PERF04-BP07 | Optimize network configuration based on metrics                    | Networking and content delivery |
| PERF05-BP04 | Load test your workload                                            | Process and culture             |
| PERF05-BP05 | Use automation to proactively remediate performance-related issues | Process and culture             |
| PERF05-BP06 | Keep your workload and services up-to-date                         | Process and culture             |

## Practice Details

### PERF01-BP01: Learn about and understand available cloud services and features

**Risk:** HIGH
**Areas:** Architecture selection

Continually learn about and discover available services and configurations that help you make better architectural decisions and improve performance efficiency in your workload architecture.

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/performance-efficiency-pillar/perf_architecture_understand_cloud_services_and_features.html>

### PERF01-BP02: Use guidance from your cloud provider or an appropriate partner to learn about architecture patterns and best practices

**Risk:** MEDIUM
**Areas:** Architecture selection

Use cloud company resources such as documentation, solutions architects, professional services, or appropriate partners to guide your architectural decisions. These resources help you review and improve your architecture for optimal performance.

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/performance-efficiency-pillar/perf_architecture_guidance_architecture_patterns_best_practices.html>

### PERF01-BP03: Factor cost into architectural decisions

**Risk:** MEDIUM
**Areas:** Architecture selection

Factor cost into your architectural decisions to improve resource utilization and performance efficiency of your cloud workload. When you are aware of the cost implications of your cloud workload, you are more likely to leverage efficient resources and reduce wasteful practices.

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/performance-efficiency-pillar/perf_architecture_factor_cost_into_architectural_decisions.html>

### PERF01-BP04: Evaluate how trade-offs impact customers and architecture efficiency

**Risk:** HIGH
**Areas:** Architecture selection

When evaluating performance-related improvements, determine which choices impact your customers and workload efficiency. For example, if using a key-value data store increases system performance, it is important to evaluate how the eventually consistent nature of this change will impact customers.

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/performance-efficiency-pillar/perf_architecture_evaluate_trade_offs.html>

### PERF01-BP05: Use policies and reference architectures

**Risk:** HIGH
**Areas:** Architecture selection

Use internal policies and existing reference architectures when selecting services and configurations to be more efficient when designing and implementing your workload.

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/performance-efficiency-pillar/perf_architecture_use_policies_and_reference_architectures.html>

### PERF01-BP06: Use benchmarking to drive architectural decisions

**Risk:** MEDIUM
**Areas:** Architecture selection

Benchmark the performance of an existing workload to understand how it performs on the cloud and drive architectural decisions based on that data.

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/performance-efficiency-pillar/perf_architecture_use_benchmarking.html>

### PERF01-BP07: Use a data-driven approach for architectural choices

**Risk:** MEDIUM
**Areas:** Architecture selection

Define a clear, data-driven approach for architectural choices to verify that the right cloud services and configurations are used to meet your specific business needs.

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/performance-efficiency-pillar/perf_architecture_use_data_driven_approach.html>

### PERF02-BP01: Select the best compute options for your workload

**Risk:** HIGH
**Areas:** Compute and hardware

Selecting the most appropriate compute option for your workload allows you to improve performance, reduce unnecessary infrastructure costs, and lower the operational efforts required to maintain your workload.

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/performance-efficiency-pillar/perf_compute_hardware_select_best_compute_options.html>

### PERF02-BP02: Understand the available compute configuration and features

**Risk:** MEDIUM
**Areas:** Compute and hardware

Understand the available configuration options and features for your compute service to help you provision the right amount of resources and improve performance efficiency.

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/performance-efficiency-pillar/perf_compute_hardware_understand_compute_configuration_features.html>

### PERF02-BP03: Collect compute-related metrics

**Risk:** HIGH
**Areas:** Compute and hardware

Record and track compute-related metrics to better understand how your compute resources are performing and improve their performance and their utilization.

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/performance-efficiency-pillar/perf_compute_hardware_collect_compute_related_metrics.html>

### PERF02-BP04: Configure and right-size compute resources

**Risk:** MEDIUM
**Areas:** Compute and hardware

Configure and right-size compute resources to match your workload’s performance requirements and avoid under- or over-utilized resources.

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/performance-efficiency-pillar/perf_compute_hardware_configure_and_right_size_compute_resources.html>

### PERF02-BP05: Scale your compute resources dynamically

**Risk:** HIGH
**Areas:** Compute and hardware

Use the elasticity of the cloud to scale your compute resources up or down dynamically to match your needs and avoid over- or under-provisioning capacity for your workload.

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/performance-efficiency-pillar/perf_compute_hardware_scale_compute_resources_dynamically.html>

### PERF02-BP06: Use optimized hardware-based compute accelerators

**Risk:** MEDIUM
**Areas:** Compute and hardware

Use hardware accelerators to perform certain functions more efficiently than CPU-based alternatives.

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/performance-efficiency-pillar/perf_compute_hardware_compute_accelerators.html>

### PERF03-BP01: Use a purpose-built data store that best supports your data access and storage requirements

**Risk:** HIGH
**Areas:** Data management

Understand data characteristics (like shareable, size, cache size, access patterns, latency, throughput, and persistence of data) to select the right purpose-built data stores (storage or database) for your workload.

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/performance-efficiency-pillar/perf_data_use_purpose_built_data_store.html>

### PERF03-BP02: Evaluate available configuration options for data store

**Risk:** MEDIUM
**Areas:** Data management

Understand and evaluate the various features and configuration options available for your data stores to optimize storage space and performance for your workload.

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/performance-efficiency-pillar/perf_data_evaluate_configuration_options_data_store.html>

### PERF03-BP03: Collect and record data store performance metrics

**Risk:** HIGH
**Areas:** Data management

Track and record relevant performance metrics for your data store to understand how your data management solutions are performing. These metrics can help you optimize your data store, verify that your workload requirements are met, and provide a clear overview on how the workload performs.

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/performance-efficiency-pillar/perf_data_collect_record_data_store_performance_metrics.html>

### PERF03-BP04: Implement strategies to improve query performance in data store

**Risk:** MEDIUM
**Areas:** Data management

Implement strategies to optimize data and improve data query to enable more scalability and efficient performance for your workload.

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/performance-efficiency-pillar/perf_data_implement_strategies_to_improve_query_performance.html>

### PERF03-BP05: Implement data access patterns that utilize caching

**Risk:** MEDIUM
**Areas:** Data management

Implement access patterns that can benefit from caching data for fast retrieval of frequently accessed data.

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/performance-efficiency-pillar/perf_data_access_patterns_caching.html>

### PERF04-BP01: Understand how networking impacts performance

**Risk:** HIGH
**Areas:** Networking and content delivery

Analyze and understand how network-related decisions impact your workload to provide efficient performance and improved user experience.

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/performance-efficiency-pillar/perf_networking_understand_how_networking_impacts_performance.html>

### PERF04-BP02: Evaluate available networking features

**Risk:** HIGH
**Areas:** Networking and content delivery

Evaluate networking features in the cloud that may increase performance. Measure the impact of these features through testing, metrics, and analysis. For example, take advantage of network-level features that are available to reduce latency, network distance, or jitter.

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/performance-efficiency-pillar/perf_networking_evaluate_networking_features.html>

### PERF04-BP03: Choose appropriate dedicated connectivity or VPN for your workload

**Risk:** HIGH
**Areas:** Networking and content delivery

When hybrid connectivity is required to connect on-premises and cloud resources, provision adequate bandwidth to meet your performance requirements. Estimate the bandwidth and latency requirements for your hybrid workload. These numbers will drive your sizing requirements.

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/performance-efficiency-pillar/perf_networking_choose_appropriate_dedicated_connectivity_or_vpn.html>

### PERF04-BP04: Use load balancing to distribute traffic across multiple resources

**Risk:** HIGH
**Areas:** Networking and content delivery

Distribute traffic across multiple resources or services to allow your workload to take advantage of the elasticity that the cloud provides. You can also use load balancing for offloading encryption termination to improve performance, reliability and manage and route traffic effectively.

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/performance-efficiency-pillar/perf_networking_load_balancing_distribute_traffic.html>

### PERF04-BP05: Choose network protocols to improve performance

**Risk:** MEDIUM
**Areas:** Networking and content delivery

Make decisions about protocols for communication between systems and networks based on the impact to the workload’s performance.

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/performance-efficiency-pillar/perf_networking_choose_network_protocols_improve_performance.html>

### PERF04-BP06: Choose your workload's location based on network requirements

**Risk:** MEDIUM
**Areas:** Networking and content delivery

Evaluate options for resource placement to reduce network latency and improve throughput, providing an optimal user experience by reducing page load and data transfer times.

**Related:** COST07-BP02, COST08-BP03, REL10-BP01, REL10-BP02, SUS01-BP01, SUS02-BP04, SUS04-BP07

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/performance-efficiency-pillar/perf_networking_choose_workload_location_network_requirements.html>

### PERF04-BP07: Optimize network configuration based on metrics

**Risk:** LOW
**Areas:** Networking and content delivery

Use collected and analyzed data to make informed decisions about optimizing your network configuration.

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/performance-efficiency-pillar/perf_networking_optimize_network_configuration_based_on_metrics.html>

### PERF05-BP01: Establish key performance indicators (KPIs) to measure workload health and performance

**Risk:** HIGH
**Areas:** Process and culture

Identify the KPIs that quantitatively and qualitatively measure workload performance. KPIs help you measure the health and performance of a workload related to a business goal.

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/performance-efficiency-pillar/perf_process_culture_establish_key_performance_indicators.html>

### PERF05-BP02: Use monitoring solutions to understand the areas where performance is most critical

**Risk:** HIGH
**Areas:** Process and culture

Understand and identify areas where increasing the performance of your workload will have a positive impact on efficiency or customer experience. For example, a website that has a large amount of customer interaction can benefit from using edge services to move content delivery closer to customers.

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/performance-efficiency-pillar/perf_process_culture_use_monitoring_solutions.html>

### PERF05-BP03: Define a process to improve workload performance

**Risk:** MEDIUM
**Areas:** Process and culture

Define a process to evaluate new services, design patterns, resource types, and configurations as they become available. For example, run existing performance tests on new instance offerings to determine their potential to improve your workload.

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/performance-efficiency-pillar/perf_process_culture_workload_performance.html>

### PERF05-BP04: Load test your workload

**Risk:** LOW
**Areas:** Process and culture

Load test your workload to verify it can handle production load and identify any performance bottleneck.

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/performance-efficiency-pillar/perf_process_culture_load_test.html>

### PERF05-BP05: Use automation to proactively remediate performance-related issues

**Risk:** LOW
**Areas:** Process and culture

Use key performance indicators (KPIs), combined with monitoring and alerting systems, to proactively address performance-related issues.

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/performance-efficiency-pillar/perf_process_culture_automation_remediate_issues.html>

### PERF05-BP06: Keep your workload and services up-to-date

**Risk:** LOW
**Areas:** Process and culture

Stay up-to-date on new cloud services and features to adopt efficient features, remove issues, and improve the overall performance efficiency of your workload.

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/performance-efficiency-pillar/perf_process_culture_keep_workload_and_services_up_to_date.html>

### PERF05-BP07: Review metrics at regular intervals

**Risk:** MEDIUM
**Areas:** Process and culture

As part of routine maintenance or in response to events or incidents, review which metrics are collected. Use these reviews to identify which metrics were essential in addressing issues and which additional metrics, if they were being tracked, could help identify, address, or prevent issues.

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/performance-efficiency-pillar/perf_process_culture_review_metrics.html>
