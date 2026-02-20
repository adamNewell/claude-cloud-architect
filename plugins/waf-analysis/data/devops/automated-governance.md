# Automated Governance Saga

Practices for compliance, security, and policy automation.

## Capabilities

- [Automated Governance Saga](#automated-governance-saga)
  - [Capabilities](#capabilities)
  - [Data Lifecycle Management](#data-lifecycle-management)
    - [AG.DLM - Indicators](#agdlm---indicators)
    - [AG.DLM - Anti-Patterns](#agdlm---anti-patterns)
    - [AG.DLM - Metrics](#agdlm---metrics)
  - [Secure Access and Delegation](#secure-access-and-delegation)
    - [AG.SAD - Indicators](#agsad---indicators)
    - [AG.SAD - Anti-Patterns](#agsad---anti-patterns)
    - [AG.SAD - Metrics](#agsad---metrics)
  - [Automated Compliance and Guardrails](#automated-compliance-and-guardrails)
    - [AG.ACG - Indicators](#agacg---indicators)
    - [AG.ACG - Anti-Patterns](#agacg---anti-patterns)
    - [AG.ACG - Metrics](#agacg---metrics)
  - [Continuous Auditing](#continuous-auditing)
    - [AG.CA - Indicators](#agca---indicators)
    - [AG.CA - Anti-Patterns](#agca---anti-patterns)
    - [AG.CA - Metrics](#agca---metrics)
  - [Dynamic Environment Provisioning](#dynamic-environment-provisioning)
    - [AG.DEP - Indicators](#agdep---indicators)
    - [AG.DEP - Anti-Patterns](#agdep---anti-patterns)
    - [AG.DEP - Metrics](#agdep---metrics)

## Data Lifecycle Management

**Code:** AG.DLM

Enforce stringent data controls, residency, privacy, sovereignty, and security throughout the entire data lifecycle. Scale your data collection, processing, classification, retention, disposal, and sharing processes to better align with regulatory compliance and safeguard your software from potential disruptions due to data mismanagement.

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/devops-guidance/data-lifecycle-management.html>

### AG.DLM - Indicators

| ID       | Title                                                                                        | Category     |
| :------- | :------------------------------------------------------------------------------------------- | :----------- |
| AG.DLM.1 | Define recovery objectives to maintain business continuity                                   | FOUNDATIONAL |
| AG.DLM.2 | Strengthen security with systematic encryption enforcement                                   | FOUNDATIONAL |
| AG.DLM.3 | Automate data processes for reliable collection, transformation, and storage using pipelines | FOUNDATIONAL |
| AG.DLM.4 | Maintain data compliance with scalable classification strategies                             | FOUNDATIONAL |
| AG.DLM.5 | Reduce risks and costs with systematic data retention strategies                             | FOUNDATIONAL |
| AG.DLM.6 | Centralize shared data to enhance governance                                                 | FOUNDATIONAL |
| AG.DLM.7 | Ensure data safety with automated backup processes                                           | RECOMMENDED  |
| AG.DLM.8 | Improve traceability with data provenance tracking                                           | RECOMMENDED  |

### AG.DLM - Anti-Patterns

| ID         | Title                                          |
| :--------- | :--------------------------------------------- |
| AG.DLM-AP1 | Lack of data protection measures               |
| AG.DLM-AP2 | Inadequate data classification practices       |
| AG.DLM-AP3 | Unrestricted data access                       |
| AG.DLM-AP4 | Reliance on manual data retention and disposal |

### AG.DLM - Metrics

| ID        | Title                    |
| :-------- | :----------------------- |
| AG.DLM-M1 | Recovery compliance rate |
| AG.DLM-M2 | Backup failure rate      |
| AG.DLM-M3 | Data quality score       |

## Secure Access and Delegation

**Code:** AG.SAD

Secure access and delegation is a governance capability that establishes scalable methods for managing fine-grained access controls while providing teams with necessary autonomy. This capability includes explicit access granting, least privilege principles, temporary access controls, emergency procedures, and regular auditing to ensure alignment with evolving business requirements and current threat landscapes.

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/devops-guidance/secure-access-and-delegation.html>

### AG.SAD - Indicators

| ID       | Title                                                                                      | Category |
| :------- | :----------------------------------------------------------------------------------------- | :------- |
| AG.SAD.1 | Centralize and federate access with temporary credential vending                           |          |
| AG.SAD.2 | Delegate identity and access management responsibilities                                   |          |
| AG.SAD.3 | Treat pipelines as production resources                                                    |          |
| AG.SAD.4 | Limit human access with just-in-time access                                                |          |
| AG.SAD.5 | Implement break-glass procedures                                                           |          |
| AG.SAD.6 | Conduct periodic identity and access management reviews                                    |          |
| AG.SAD.7 | Implement rotation policies for secrets, keys, and certificates                            |          |
| AG.SAD.8 | Adopt a zero trust security model, shifting towards an identity-centric security perimeter |          |

### AG.SAD - Anti-Patterns

| ID         | Title                                 |
| :--------- | :------------------------------------ |
| AG.SAD-AP1 | Broad Permissions                     |
| AG.SAD-AP2 | Manual Identity and Access Management |
| AG.SAD-AP3 | Static Permission Management          |
| AG.SAD-AP4 | Neglecting Break-Glass Protocols      |
| AG.SAD-AP5 | Not Evolving Security with DevOps     |

### AG.SAD - Metrics

| ID        | Title                                       |
| :-------- | :------------------------------------------ |
| AG.SAD-M1 | Incident frequency due to access violations |
| AG.SAD-M2 | IAM review frequency                        |
| AG.SAD-M3 | Time to revoke access                       |
| AG.SAD-M4 | Rotation compliance                         |

## Automated Compliance and Guardrails

**Code:** AG.ACG

Integrate risk management, business governance adherence, and application and infrastructure governance mechanisms required to maintaining compliance within dynamic, constantly changing environments. This capability enables automatic enforcement of directive, detective, preventive, and responsive measures, using automated processes and policies. It helps organizations consistently uphold standards and regulations while minimizing the manual overhead traditionally associated with compliance management.

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/devops-guidance/automated-compliance-and-guardrails.html>

### AG.ACG - Indicators

| ID        | Title                                                                       | Category     |
| :-------- | :-------------------------------------------------------------------------- | :----------- |
| AG.ACG.1  | Adopt a risk-based compliance framework                                     | FOUNDATIONAL |
| AG.ACG.2  | Implement controlled procedures for introducing new services and features   | FOUNDATIONAL |
| AG.ACG.3  | Automate deployment of detective controls                                   | FOUNDATIONAL |
| AG.ACG.4  | Strengthen security posture with ubiquitous preventative guardrails         | FOUNDATIONAL |
| AG.ACG.5  | Automate compliance for data regulations and policies                       | RECOMMENDED  |
| AG.ACG.6  | Implement auto-remediation for non-compliant findings                       | RECOMMENDED  |
| AG.ACG.7  | Use automated tools for scalable cost management                            | RECOMMENDED  |
| AG.ACG.8  | Conduct regular scans to identify and remove unused resources               | RECOMMENDED  |
| AG.ACG.9  | Integrate software provenance tracking throughout the development lifecycle | RECOMMENDED  |
| AG.ACG.10 | Automate resolution of findings in tracking systems                         | RECOMMENDED  |
| AG.ACG.11 | Digital attestation verification for zero trust deployments                 | RECOMMENDED  |

### AG.ACG - Anti-Patterns

| ID         | Title                                    |
| :--------- | :--------------------------------------- |
| AG.ACG-AP1 | Manual policy enforcement                |
| AG.ACG-AP2 | Static compliance checks                 |
| AG.ACG-AP3 | Relying on manual remediation            |
| AG.ACG-AP4 | Over-reliance on preventative guardrails |
| AG.ACG-AP5 | Manual change validation                 |

### AG.ACG - Metrics

| ID        | Title                                    |
| :-------- | :--------------------------------------- |
| AG.ACG-M1 | Billing variance                         |
| AG.ACG-M2 | Change failure rate                      |
| AG.ACG-M3 | Guardrail effectiveness score            |
| AG.ACG-M4 | Percentage of automated change approvals |
| AG.ACG-M5 | Non-compliance detection frequency       |
| AG.ACG-M6 | Non-compliance response time             |

## Continuous Auditing

**Code:** AG.CA

Facilitate the ongoing automated assessment of system configurations, activities, and operations against internal policies and regulatory standards to measure adherence. This capability allows organizations to glean real-time insights into their security posture, reducing the time and manual effort traditionally associated with auditing. Continuous auditing enhances an organization's ability to swiftly identify and respond to compliance issues, fostering an environment of proactive security and governance.

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/devops-guidance/continuous-auditing.html>

### AG.CA - Indicators

| ID      | Title                                                        | Category |
| :------ | :----------------------------------------------------------- | :------- |
| AG.CA.1 | Establish comprehensive audit trails                         |          |
| AG.CA.2 | Optimize configuration item management                       |          |
| AG.CA.3 | Implement systematic exception tracking and review processes |          |
| AG.CA.4 | Enable iterative internal auditing practices                 |          |

### AG.CA - Anti-Patterns

| ID        | Title                                     |
| :-------- | :---------------------------------------- |
| AG.CA-AP1 | Inadequate audit trails                   |
| AG.CA-AP2 | Manual evidence review                    |
| AG.CA-AP3 | Viewing audits as a one-time event        |
| AG.CA-AP4 | Expecting auditors to track every feature |
| AG.CA-AP5 | Overlooking developer training            |

### AG.CA - Metrics

| ID       | Title                           |
| :------- | :------------------------------ |
| AG.CA-M1 | Audit lead time                 |
| AG.CA-M2 | Mean time between audits (MTBA) |
| AG.CA-M3 | Known vulnerability age         |
| AG.CA-M4 | Security control risk           |
| AG.CA-M5 | Exception rate                  |

## Dynamic Environment Provisioning

**Code:** AG.DEP

Establish strategies and practices to create, maintain, and manage multiple environments within an organization's landing zone, using automated processes. This approach helps ensure consistency and compliance, enhances security, improves operational efficiency, optimizes resource usage, and allows organizations to adapt to changes faster.

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/devops-guidance/dynamic-environment-provisioning.html>

### AG.DEP - Indicators

| ID       | Title                                                                        | Category     |
| :------- | :--------------------------------------------------------------------------- | :----------- |
| AG.DEP.1 | Establish a controlled, multi-environment landing zone                       | FOUNDATIONAL |
| AG.DEP.2 | Continuously baseline environments to manage drift                           | FOUNDATIONAL |
| AG.DEP.3 | Enable deployment to the landing zone                                        | FOUNDATIONAL |
| AG.DEP.4 | Codify environment vending                                                   | RECOMMENDED  |
| AG.DEP.5 | Standardize and manage shared resources across environments                  | RECOMMENDED  |
| AG.DEP.6 | Test landing zone changes in a mirrored non-production landing zone          | RECOMMENDED  |
| AG.DEP.7 | Utilize metadata for scalable environment management                         | OPTIONAL     |
| AG.DEP.8 | Implement a unified developer portal for self-service environment management | OPTIONAL     |

### AG.DEP - Anti-Patterns

| ID         | Title                                                    |
| :--------- | :------------------------------------------------------- |
| AG.DEP-AP1 | Manual environment management                            |
| AG.DEP-AP2 | Inflexible environment provisioning                      |
| AG.DEP-AP3 | Bypassing non-production testing for environment changes |
| AG.DEP-AP4 | Allowing configuration drift                             |
| AG.DEP-AP5 | Fragmented self-service tools                            |

### AG.DEP - Metrics

| ID        | Title                              |
| :-------- | :--------------------------------- |
| AG.DEP-M1 | Environment provisioning lead time |
| AG.DEP-M2 | Configuration drift rate           |
| AG.DEP-M3 | Self-service tool adoption rate    |
| AG.DEP-M4 | Environment overhead cost          |
