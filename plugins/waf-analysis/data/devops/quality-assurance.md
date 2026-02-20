# Quality Assurance Saga

Practices for testing, validation, and quality management.

## Capabilities

- [Non-functional Testing](#non-functional-testing)
- [Test Environment Management](#test-environment-management)
- [Security Testing](#security-testing)
- [Functional Testing](#functional-testing)
- [Data Testing](#data-testing)

## Non-functional Testing

**Code:** QA.NT

Non-functional testing evaluates the quality attributes of software systems, emphasizing how a solution performs and operates in various environments rather than its functional capabilities. Such tests help ensure that software meets the desired performance, reliability, usability, and other non-functional standards. By implementing non-functional testing, teams can consistently achieve scalable and efficient software solutions that meet both user and business requirements, elevating the overall user experience and software reliability.

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/devops-guidance/non-functional-testing.html>

### QA.NT - Indicators

| ID      | Title                                                                           | Category     |
| :------ | :------------------------------------------------------------------------------ | :----------- |
| QA.NT.1 | Evaluate code quality through static testing                                    | FOUNDATIONAL |
| QA.NT.2 | Validate system reliability with performance testing                            | RECOMMENDED  |
| QA.NT.3 | Prioritize user experience with UX testing                                      | RECOMMENDED  |
| QA.NT.4 | Enhance user experience gradually through experimentation                       | RECOMMENDED  |
| QA.NT.5 | Automate adherence to compliance standards through conformance testing          | RECOMMENDED  |
| QA.NT.6 | Experiment with failure using resilience testing to build recovery preparedness | RECOMMENDED  |
| QA.NT.7 | Verify service integrations through contract testing                            | RECOMMENDED  |
| QA.NT.8 | Practice eco-conscious development with sustainability testing                  | OPTIONAL     |

### QA.NT - Anti-Patterns

| ID        | Title                                                       |
| :-------- | :---------------------------------------------------------- |
| QA.NT-AP1 | Mistaking infrastructure resilience with system reliability |
| QA.NT-AP2 | Overlooking real-world conditions during testing            |
| QA.NT-AP3 | Ignoring observability for performance tuning               |
| QA.NT-AP4 | Not gathering genuine user feedback                         |

### QA.NT - Metrics

| ID       | Title                                 |
| :------- | :------------------------------------ |
| QA.NT-M1 | Availability                          |
| QA.NT-M2 | Latency                               |
| QA.NT-M3 | Cyclomatic complexity                 |
| QA.NT-M4 | Peak load threshold                   |
| QA.NT-M5 | Test case run time                    |
| QA.NT-M6 | Infrastructure utilization            |
| QA.NT-M7 | Time to restore service               |
| QA.NT-M8 | Application performance index (Apdex) |

## Test Environment Management

**Code:** QA.TEM

This capability focuses on dynamically provisioning test environments that are used for running test cases. Using automation to manage these environments and associated test data reduces both testing duration and expense while improving accuracy of test results. Effectively managing test data as a part of this process helps with identifying and correcting defects earlier on in the development lifecycle.

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/devops-guidance/test-environment-management.html>

### QA.TEM - Indicators

| ID       | Title                                                                     | Category     |
| :------- | :------------------------------------------------------------------------ | :----------- |
| QA.TEM.1 | Establish dedicated testing environments                                  | FOUNDATIONAL |
| QA.TEM.2 | Ensure consistent test case execution using test beds                     | FOUNDATIONAL |
| QA.TEM.3 | Store and manage test results                                             | FOUNDATIONAL |
| QA.TEM.4 | Implement a unified test data repository for enhanced test efficiency     | RECOMMENDED  |
| QA.TEM.5 | Run tests in parallel for faster results                                  | RECOMMENDED  |
| QA.TEM.6 | Enhance developer experience through scalable quality assurance platforms | RECOMMENDED  |

### QA.TEM - Anti-Patterns

| ID         | Title                  |
| :--------- | :--------------------- |
| QA.TEM-AP1 | Low test data coverage |
| QA.TEM-AP2 | Insecure test data     |
| QA.TEM-AP3 | Centralized testing    |

### QA.TEM - Metrics

| ID        | Title                      |
| :-------- | :------------------------- |
| QA.TEM-M1 | Test bed provisioning time |
| QA.TEM-M2 | Test case execution time   |

## Security Testing

**Code:** QA.ST

Security testing identifies potential vulnerabilities, threats, risks, and other security weaknesses in a system. It safeguards the integrity, confidentiality, and availability of the system and its data. Inspected components include safety faults, infrastructure weaknesses, network threats, software vulnerabilities, and other hazards. Effective security testing involves a mix of manual penetration testing and automated vulnerability scans, offering insights into potential breaches or exposures.

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/devops-guidance/security-testing.html>

### QA.ST - Indicators

| ID      | Title                                                                            | Category     |
| :------ | :------------------------------------------------------------------------------- | :----------- |
| QA.ST.1 | Evolve vulnerability management processes to be conducive of DevOps practices    | FOUNDATIONAL |
| QA.ST.2 | Normalize security testing findings                                              | FOUNDATIONAL |
| QA.ST.3 | Use application risk assessments for secure software design                      | FOUNDATIONAL |
| QA.ST.4 | Enhance source code security with static application security testing            | FOUNDATIONAL |
| QA.ST.5 | Evaluate runtime security with dynamic application security testing              | FOUNDATIONAL |
| QA.ST.6 | Validate third-party components using software composition analysis              | FOUNDATIONAL |
| QA.ST.7 | Conduct proactive exploratory security testing activities                        | RECOMMENDED  |
| QA.ST.8 | Improve security testing accuracy using interactive application security testing | OPTIONAL     |

### QA.ST - Anti-Patterns

| ID        | Title                                    |
| :-------- | :--------------------------------------- |
| QA.ST-AP1 | Overconfidence in test results           |
| QA.ST-AP2 | Not considering internal threats         |
| QA.ST-AP3 | Neglecting software supply chain attacks |

### QA.ST - Metrics

| ID       | Title                        |
| :------- | :--------------------------- |
| QA.ST-M1 | Escaped defect rate          |
| QA.ST-M2 | False positive rate          |
| QA.ST-M3 | Mean time to detect          |
| QA.ST-M4 | Mean time to remediate       |
| QA.ST-M5 | Test pass rate               |
| QA.ST-M6 | Test case run time           |
| QA.ST-M7 | Vulnerability discovery rate |

## Functional Testing

**Code:** QA.FT

Functional testing validates that the system operates according to specified requirements. It is used to consistently verify that components such as user interfaces, APIs, databases, and the source code, work as intended. By examining these components of the system, functional testing helps ensure that each feature behaves as expected, safeguarding both user expectations and the software's integrity.

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/devops-guidance/functional-testing.html>

### QA.FT - Indicators

| ID      | Title                                                                        | Category     |
| :------ | :--------------------------------------------------------------------------- | :----------- |
| QA.FT.1 | Ensure individual component functionality with unit tests                    | FOUNDATIONAL |
| QA.FT.2 | Validate system interactions and data flows with integration tests           | FOUNDATIONAL |
| QA.FT.3 | Confirm end-user experience and functional correctness with acceptance tests | FOUNDATIONAL |
| QA.FT.4 | Balance developer feedback and test coverage using advanced test selection   | OPTIONAL     |

### QA.FT - Anti-Patterns

| ID        | Title                                |
| :-------- | :----------------------------------- |
| QA.FT-AP1 | Over indexing on coverage metrics    |
| QA.FT-AP2 | Reactive test writing                |
| QA.FT-AP3 | Only testing functional requirements |
| QA.FT-AP4 | Neglecting to address flaky tests    |

### QA.FT - Metrics

| ID       | Title                |
| :------- | :------------------- |
| QA.FT-M1 | Defect density       |
| QA.FT-M2 | Test pass rate       |
| QA.FT-M3 | Escaped defect rate  |
| QA.FT-M4 | Test case run time   |
| QA.FT-M5 | Test coverage        |
| QA.FT-M6 | Feature-to-bug ratio |

## Data Testing

**Code:** QA.DT

Data testing is a specialized type of testing that emphasizes the evaluation of data processed by systems, encompassing aspects like data transformations, data integrity rules, and data processing logic. Its purpose is to evaluate various attributes of data to identify data quality issues, such as duplication, missing data, or errors. By performing data testing, organizations can establish a foundation of reliable and trustworthy data for their systems which in turn enables informed decision-making, efficient business operations, and positive customer experiences.

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/devops-guidance/data-testing.html>

### QA.DT - Indicators

| ID      | Title                                                      | Category    |
| :------ | :--------------------------------------------------------- | :---------- |
| QA.DT.1 | Ensure data integrity and accuracy with data quality tests | RECOMMENDED |
| QA.DT.2 | Enhance understanding of data through data profiling       | OPTIONAL    |
| QA.DT.3 | Validate data processing rules with data logic tests       | OPTIONAL    |
| QA.DT.4 | Detect and mitigate data issues with anomaly detection     | OPTIONAL    |
| QA.DT.5 | Utilize incremental metrics computation                    | OPTIONAL    |

### QA.DT - Anti-Patterns

| ID        | Title              |
| :-------- | :----------------- |
| QA.DT-AP1 | Testing data drift |

### QA.DT - Metrics

| ID       | Title              |
| :------- | :----------------- |
| QA.DT-M1 | Data test coverage |
| QA.DT-M2 | Test case run time |
| QA.DT-M3 | Data quality score |
