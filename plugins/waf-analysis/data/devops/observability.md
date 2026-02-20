# Observability Saga

Practices for monitoring, logging, and operational visibility.

## Capabilities

- [Observability Saga](#observability-saga)
  - [Capabilities](#capabilities)
  - [Data Ingestion and Processing](#data-ingestion-and-processing)
    - [OB.DIP - Indicators](#obdip---indicators)
    - [OB.DIP - Anti-Patterns](#obdip---anti-patterns)
    - [OB.DIP - Metrics](#obdip---metrics)
  - [Continuous Monitoring](#continuous-monitoring)
    - [OB.CM - Indicators](#obcm---indicators)
    - [OB.CM - Anti-Patterns](#obcm---anti-patterns)
    - [OB.CM - Metrics](#obcm---metrics)
  - [Strategic Instrumentation](#strategic-instrumentation)
    - [OB.SI - Indicators](#obsi---indicators)
    - [OB.SI - Anti-Patterns](#obsi---anti-patterns)
    - [OB.SI - Metrics](#obsi---metrics)

## Data Ingestion and Processing

**Code:** OB.DIP

Data ingestion and processing involves the collection, centralization, and analysis of data from multiple sources. This data, when effectively ingested and processed, helps teams to understand the availability, security, performance, and reliability of their systems in real-time. Through streamlining data ingestion and processing, teams can make quicker and more effective decisions, enhancing overall agility and reliability of systems.

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/devops-guidance/data-ingestion-and-processing.html>

### OB.DIP - Indicators

| ID       | Title                                                          | Category     |
| :------- | :------------------------------------------------------------- | :----------- |
| OB.DIP.1 | Aggregate logs and events across workloads                     | FOUNDATIONAL |
| OB.DIP.2 | Centralize logs for enhanced security investigations           | FOUNDATIONAL |
| OB.DIP.3 | Implement distributed tracing for system-wide request tracking | RECOMMENDED  |
| OB.DIP.4 | Aggregate health and status metrics across workloads           | RECOMMENDED  |
| OB.DIP.5 | Optimize telemetry data storage and costs                      | RECOMMENDED  |
| OB.DIP.6 | Standardize telemetry data with common formats                 | RECOMMENDED  |

### OB.DIP - Anti-Patterns

| ID         | Title                      |
| :--------- | :------------------------- |
| OB.DIP-AP1 | Over-reliance on ETL Tools |
| OB.DIP-AP2 | Ignoring event correlation |
| OB.DIP-AP3 | Inefficient data analysis  |
| OB.DIP-AP4 | Lack of data governance    |

### OB.DIP - Metrics

| ID        | Title                   |
| :-------- | :---------------------- |
| OB.DIP-M1 | Data ingestion rate     |
| OB.DIP-M2 | Data processing latency |
| OB.DIP-M3 | Data cost efficiency    |
| OB.DIP-M4 | Anomaly detection rate  |

## Continuous Monitoring

**Code:** OB.CM

Continuous monitoring is the real-time observation and analysis of telemetry data to help optimize system performance. It encompasses alert configuration to notify teams of potential issues, promoting rapid response. Post-event investigations provide valuable insights to continuously optimize the monitoring process. By integrating artificial intelligence (AI) and machine learning (ML), continuous monitoring can achieve a higher level of precision and speed in detecting and responding to system issues.

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/devops-guidance/continuous-monitoring.html>

### OB.CM - Indicators

| ID       | Title                                                               | Category     |
| :------- | :------------------------------------------------------------------ | :----------- |
| OB.CM.1  | Automate alerts for security and performance issues                 | FOUNDATIONAL |
| OB.CM.2  | Plan for large scale events                                         | FOUNDATIONAL |
| OB.CM.3  | Conduct post-incident analysis for continuous improvement           | FOUNDATIONAL |
| OB.CM.4  | Report on business metrics to drive data-driven decision making     | FOUNDATIONAL |
| OB.CM.5  | Detect performance issues using application performance monitoring  | RECOMMENDED  |
| OB.CM.6  | Gather user experience insights using digital experience monitoring | RECOMMENDED  |
| OB.CM.7  | Visualize telemetry data in real-time                               | RECOMMENDED  |
| OB.CM.8  | Hold operational review meetings for data transparency              | RECOMMENDED  |
| OB.CM.9  | Optimize alerts to prevent fatigue and minimize monitoring costs    | RECOMMENDED  |
| OB.CM.10 | Proactively detect issues using AI/ML                               | OPTIONAL     |

### OB.CM - Anti-Patterns

| ID        | Title                          |
| :-------- | :----------------------------- |
| OB.CM-AP1 | Blame culture                  |
| OB.CM-AP2 | Overlooking derived metrics    |
| OB.CM-AP3 | Inadequate monitoring coverage |
| OB.CM-AP4 | Noisy and unactionable alarms  |

### OB.CM - Metrics

| ID       | Title                                 |
| :------- | :------------------------------------ |
| OB.CM-M1 | Mean time to detect (MTTD)            |
| OB.CM-M2 | Mean time between failures (MTBF)     |
| OB.CM-M3 | Post-incident retrospective frequency |
| OB.CM-M4 | False positive rate                   |
| OB.CM-M5 | Application performance index (Apdex) |

## Strategic Instrumentation

**Code:** OB.SI

Strategic instrumentation is a capability aimed at designing and implementing monitoring systems to capture meaningful and actionable data from your applications and infrastructure. This includes collecting telemetry, tracking key performance indicators (KPIs), and enabling data-driven decision making. The goal of strategic instrumentation is to provide deep visibility into your systems, facilitating rapid response to issues, optimizing performance, and aligning IT operations with business objectives by capturing relevant telemetry.

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/devops-guidance/strategic-instrumentation.html>

### OB.SI - Indicators

| ID     | Title                                                                                       | Category     |
| :----- | :------------------------------------------------------------------------------------------ | :----------- |
| O.SI.1 | Center observability strategies around business and technical outcomes                      | FOUNDATIONAL |
| O.SI.2 | Centralize tooling for streamlined system instrumentation and telemetry data interpretation | FOUNDATIONAL |
| O.SI.3 | Instrument all systems for comprehensive telemetry data collection                          | FOUNDATIONAL |
| O.SI.4 | Build health checks into every service                                                      | RECOMMENDED  |
| O.SI.5 | Set and monitor service level objectives against performance standards                      | RECOMMENDED  |

### OB.SI - Anti-Patterns

| ID       | Title                     |
| :------- | :------------------------ |
| O.SI-AP1 | Excessive data collection |
| O.SI-AP2 | Lack of standardization   |
| O.SI-AP3 | Monitoring in isolation   |
| O.SI-AP4 | Reactive monitoring       |
| O.SI-AP5 | Misaligned SLOs           |

### OB.SI - Metrics

| ID      | Title                         |
| :------ | :---------------------------- |
| O.SI-M1 | Instrumented systems coverage |
| O.SI-M2 | SLO adherence                 |
