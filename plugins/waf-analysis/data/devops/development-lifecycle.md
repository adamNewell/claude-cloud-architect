# Development Lifecycle Saga

Practices for software development, CI/CD, and deployment.

## Capabilities

- [Development Lifecycle Saga](#development-lifecycle-saga)
  - [Capabilities](#capabilities)
  - [Continuous Integration](#continuous-integration)
    - [Indicators](#indicators)
    - [Anti-Patterns](#anti-patterns)
    - [Metrics](#metrics)
  - [Cryptographic Signing](#cryptographic-signing)
    - [DL.CS - Indicators](#dlcs---indicators)
    - [DL.CS - Anti-Patterns](#dlcs---anti-patterns)
    - [DL.CS - Metrics](#dlcs---metrics)
  - [Local Development](#local-development)
    - [DL.LD - Indicators](#dlld---indicators)
    - [DL.LD - Anti-Patterns](#dlld---anti-patterns)
    - [DL.LD - Metrics](#dlld---metrics)
  - [Everything as Code](#everything-as-code)
    - [DL.EAC - Indicators](#dleac---indicators)
    - [DL.EAC - Anti-Patterns](#dleac---anti-patterns)
    - [DL.EAC - Metrics](#dleac---metrics)
  - [Software Component Management](#software-component-management)
    - [DL.SCM - Indicators](#dlscm---indicators)
    - [DL.SCM - Anti-Patterns](#dlscm---anti-patterns)
    - [DL.SCM - Metrics](#dlscm---metrics)
  - [Continuous Delivery](#continuous-delivery)
    - [DL.CD - Indicators](#dlcd---indicators)
    - [DL.CD - Anti-Patterns](#dlcd---anti-patterns)
    - [DL.CD - Metrics](#dlcd---metrics)
  - [Code Review](#code-review)
    - [DL.CR - Indicators](#dlcr---indicators)
    - [DL.CR - Anti-Patterns](#dlcr---anti-patterns)
    - [DL.CR - Metrics](#dlcr---metrics)
  - [Advanced Deployment Strategies](#advanced-deployment-strategies)
    - [DL.ADS - Indicators](#dlads---indicators)
    - [DL.ADS - Anti-Patterns](#dlads---anti-patterns)
    - [DL.ADS - Metrics](#dlads---metrics)

## Continuous Integration

**Code:** DL.CI

Continuous integration (CI) is a software development practice where developers make regular, small alterations to the code and integrate them into a releasable branch of the code repository. The newly integrated code is autonomously built, tested, and validated in a consistent and repeatable manner. CI allows developers to receive feedback swiftly, identify potential issues in the early stages of the development lifecycle, and address them before they escalate in complexity and cost.

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/devops-guidance/continuous-integration.html>

### Indicators

| ID      | Title                                                       | Category     |
| :------ | :---------------------------------------------------------- | :----------- |
| DL.CI.1 | Integrate code changes regularly and frequently             | FOUNDATIONAL |
| DL.CI.2 | Trigger builds automatically upon source code modifications | FOUNDATIONAL |
| DL.CI.3 | Ensure automated quality assurance for every build          | FOUNDATIONAL |
| DL.CI.4 | Provide consistent, actionable feedback to developers       | FOUNDATIONAL |
| DL.CI.5 | Sequence build actions strategically for prompt feedback    | RECOMMENDED  |
| DL.CI.6 | Refine integration pipelines with build metrics             | RECOMMENDED  |
| DL.CI.7 | Validate the reproducibility of builds                      | OPTIONAL     |

### Anti-Patterns

| ID        | Title                                                           |
| :-------- | :-------------------------------------------------------------- |
| DL.CI-AP1 | Infrequent check-in of code                                     |
| DL.CI-AP2 | Manually building and testing changes                           |
| DL.CI-AP3 | Having builds run on a preset schedule rather than on commit    |
| DL.CI-AP4 | Low coverage or inaccurate tests                                |
| DL.CI-AP5 | Only testing in production                                      |
| DL.CI-AP6 | Failure to provide useful feedback to developers during a build |
| DL.CI-AP7 | Lack of collaboration                                           |

### Metrics

| ID       | Title                     |
| :------- | :------------------------ |
| DL.CI-M1 | Frequency of integration  |
| DL.CI-M2 | Build success rate        |
| DL.CI-M3 | Pipeline stability        |
| DL.CI-M4 | Mean time to build (MTTB) |

## Cryptographic Signing

**Code:** DL.CS

Cryptographic signing in the development lifecycle authenticates the origins and verifies the integrity of software components. Through the use of digital signatures, it safeguards software builds and deployments against unauthorized changes and potential threats from malicious actors. By leveraging cryptographic signing, you can establish a secure software supply chain, improve transparency in the build and delivery process, and reliably distribute verifiable software components at scale.

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/devops-guidance/cryptographic-signing.html>

### DL.CS - Indicators

| ID      | Title                                              | Category    |
| :------ | :------------------------------------------------- | :---------- |
| DL.CS.1 | Implement automated digital attestation signing    | RECOMMENDED |
| DL.CS.2 | Sign code artifacts after each build               | RECOMMENDED |
| DL.CS.3 | Enforce verification before using signed artifacts | RECOMMENDED |
| DL.CS.4 | Enhance traceability using commit signing          | OPTIONAL    |

### DL.CS - Anti-Patterns

| ID        | Title                                 |
| :-------- | :------------------------------------ |
| DL.CS-AP1 | Ignoring key compromise               |
| DL.CS-AP2 | Reuse of signing keys across projects |
| DL.CS-AP3 | Incomplete signature verification     |
| DL.CS-AP4 | Overlooking timestamp validation      |
| DL.CS-AP5 | Avoid certificate pinning             |

### DL.CS - Metrics

| ID       | Title                               |
| :------- | :---------------------------------- |
| DL.CS-M1 | Number of unsigned releases         |
| DL.CS-M2 | Number of expired certificates used |
| DL.CS-M3 | Time to revoke a compromised key    |
| DL.CS-M4 | Time to sign                        |
| DL.CS-M5 | Time to verify                      |

## Local Development

**Code:** DL.LD

Local development concentrates on establishing development environments that mirror the production setup as closely as possible, either on a local machine or in the cloud. The primary goal is to allow developers to receive feedback as fast as possible in the development lifecycle without impacting other team members or systems.

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/devops-guidance/local-development.html>

### DL.LD - Indicators

| ID       | Title                                                    | Category |
| :------- | :------------------------------------------------------- | :------- |
| DL.LD.1  | Establish development environments for local development |          |
| DL.LD.2  | Consistently provision local environments                |          |
| DL.LD.3  | Commit local changes early and often                     |          |
| DL.LD.4  | Enforce security checks before commit                    |          |
| DL.LD.5  | Enforce coding standards before commit                   |          |
| DL.LD.6  | Leverage extensible development tools                    |          |
| DL.LD.7  | Establish sandbox environments with spend limits         |          |
| DL.LD.8  | Generate mock datasets for local development             |          |
| DL.LD.9  | Share tool configurations                                |          |
| DL.LD.10 | Manage unused development environments                   |          |
| DL.LD.11 | Implement smart code completion with machine-learning    |          |

### DL.LD - Anti-Patterns

| ID        | Title                                   |
| :-------- | :-------------------------------------- |
| DL.LD-AP1 | Irregular commits                       |
| DL.LD-AP2 | Avoiding local development environments |
| DL.LD-AP3 | Inconsistent local environment setup    |
| DL.LD-AP4 | Long-lived development branches         |
| DL.LD-AP5 | Over-reliance on basic text editors     |

### DL.LD - Metrics

| ID       | Title                               |
| :------- | :---------------------------------- |
| DL.LD-M1 | Local Environment Provisioning Time |
| DL.LD-M2 | Post-Commit Test Failure Rate       |

## Everything as Code

**Code:** DL.EAC

Everything as code is a software development practice that seeks to apply the same principles of version control, testing, and deployment to enhance maintainability and scalability of all aspects of the development lifecycle, including networking infrastructure, documentation, and configuration. This practice adds the ability to automate more, leading to faster, more consistent, and more reliable development cycles. By using code for as many use cases as possible, developers can achieve a higher level of quality, reduce the risk of errors, and increase the speed at which they can deploy new features and updates.

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/devops-guidance/everything-as-code.html>

### DL.EAC - Indicators

| ID       | Title                                                                            | Category |
| :------- | :------------------------------------------------------------------------------- | :------- |
| DL.EAC.1 | Organize infrastructure as code for scale                                        |          |
| DL.EAC.2 | Modernize networks through infrastructure as code                                |          |
| DL.EAC.3 | Codify data operations                                                           |          |
| DL.EAC.4 | Implement continuous configuration for enhanced application management           |          |
| DL.EAC.5 | Integrate technical and operational documentation into the development lifecycle |          |
| DL.EAC.6 | Use general-purpose programming languages to generate Infrastructure-as-Code     |          |
| DL.EAC.7 | Automate compute image generation and distribution                               |          |

### DL.EAC - Anti-Patterns

| ID         | Title                                  |
| :--------- | :------------------------------------- |
| DL.EAC-AP1 | Checking in secrets                    |
| DL.EAC-AP2 | Manual modifications to infrastructure |
| DL.EAC-AP3 | Outdated or incomplete documentation   |
| DL.EAC-AP4 | Ignoring configuration drift           |
| DL.EAC-AP5 | Bypassing code review and testing      |
| DL.EAC-AP6 | Inefficient IaC development practices  |
| DL.EAC-AP7 | Monolithic network architectures       |

### DL.EAC - Metrics

| ID        | Title                            |
| :-------- | :------------------------------- |
| DL.EAC-M1 | Infrastructure code coverage     |
| DL.EAC-M2 | Configuration drift rate         |
| DL.EAC-M3 | Documentation update frequency   |
| DL.EAC-M4 | Time to provision infrastructure |
| DL.EAC-M5 | Mean time to recover (MTTR)      |

## Software Component Management

**Code:** DL.SCM

There are many software components that are consumed and generated during the development lifecycle, including libraries, repositories, shared modules, build artifacts, and third-party dependencies. These components often have distributed technical ownership and are decoupled from one another. Software component management focuses on overseeing these individual components to enhance security and governance of the software supply chain. This includes routinely updating components to maintain their security and relevance, establishing clear usage guidelines, and creating an inventory of the relationships between components. Through this capability, you can strengthen the security, reliability, and integrity of software being built.

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/devops-guidance/software-component-management.html>

### DL.SCM - Indicators

| ID        | Title                                                                     | Category     |
| :-------- | :------------------------------------------------------------------------ | :----------- |
| DL.SCM.1  | Use a version control system with appropriate access management           | FOUNDATIONAL |
| DL.SCM.2  | Keep feature branches short-lived                                         | FOUNDATIONAL |
| DL.SCM.3  | Use artifact repositories with enforced authentication and authorization  | FOUNDATIONAL |
| DL.SCM.4  | Grant access only to trusted repositories                                 | FOUNDATIONAL |
| DL.SCM.5  | Maintain an approved open-source software license list                    | FOUNDATIONAL |
| DL.SCM.6  | Maintain informative repository documentation                             | FOUNDATIONAL |
| DL.SCM.7  | Standardize vulnerability disclosure processes                            | RECOMMENDED  |
| DL.SCM.8  | Use a versioning specification to manage software components              | RECOMMENDED  |
| DL.SCM.9  | Implement plans for deprecating and revoking outdated software components | RECOMMENDED  |
| DL.SCM.10 | Generate a comprehensive software inventory for each build                | RECOMMENDED  |

### DL.SCM - Anti-Patterns

| ID         | Title                                        |
| :--------- | :------------------------------------------- |
| DL.SCM-AP1 | Avoiding version control                     |
| DL.SCM-AP2 | Mutable artifacts                            |
| DL.SCM-AP3 | Ignoring dependencies management             |
| DL.SCM-AP4 | Using git submodules for sharing common code |
| DL.SCM-AP5 | Traditional branching strategies             |

### DL.SCM - Metrics

| ID        | Title                                   |
| :-------- | :-------------------------------------- |
| DL.SCM-M1 | Average branch lifespan                 |
| DL.SCM-M2 | Open-source license violations          |
| DL.SCM-M3 | Average time to resolve vulnerabilities |
| DL.SCM-M4 | Software component health               |

## Continuous Delivery

**Code:** DL.CD

Continuous Delivery is an automated software delivery practice that follows Continuous Integration (CI). It automatically deploys code changes that pass build validation to various environments, including production, with minimal human intervention. This DevOps practice extends to production environments and aims to ensure new features, fixes, and improvements are deployed fast and reliably, reducing lead times and improving overall deployment efficiency.

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/devops-guidance/continuous-delivery.html>

### DL.CD - Indicators

| ID      | Title                                                              | Category |
| :------ | :----------------------------------------------------------------- | :------- |
| DL.CD.1 | Deploy changes to production frequently                            |          |
| DL.CD.2 | Deploy exclusively from trusted artifact repositories              |          |
| DL.CD.3 | Integrate quality assurance into deployments                       |          |
| DL.CD.4 | Automate the entire deployment process                             |          |
| DL.CD.5 | Ensure on-demand deployment capabilities                           |          |
| DL.CD.6 | Refine delivery pipelines using metrics for continuous improvement |          |
| DL.CD.7 | Remove manual approvals to practice continuous deployment          |          |

### DL.CD - Anti-Patterns

| ID        | Title                   |
| :-------- | :---------------------- |
| DL.CD-AP1 | Large Batch Deployments |
| DL.CD-AP2 | Manual Deployments      |
| DL.CD-AP3 | Building More Than Once |
| DL.CD-AP4 | Tightly Coupled Systems |

### DL.CD - Metrics

| ID       | Title                          |
| :------- | :----------------------------- |
| DL.CD-M1 | Pipeline Stability             |
| DL.CD-M2 | Mean Time to Production (MTTP) |
| DL.CD-M3 | Operator Interventions         |
| DL.CD-M4 | Number of Changes Per Release  |
| DL.CD-M5 | Deployment Frequency           |

## Code Review

**Code:** DL.CR

Code reviews serve as a mechanism for light and frictionless change management in a DevOps environment. They enforce separation of duties which helps ensure that multiple people are involved in approving and merging changes to the code base. Implementing code reviews helps organizations streamline change processes, enhance software quality, create a culture of shared responsibility, and significantly improve reliability.

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/devops-guidance/code-review.html>

### DL.CR - Indicators

| ID      | Title                                                                   | Category |
| :------ | :---------------------------------------------------------------------- | :------- |
| DL.CR.1 | Standardize coding practices                                            |          |
| DL.CR.2 | Perform peer review for code changes                                    |          |
| DL.CR.3 | Establish clear completion criteria for code tasks                      |          |
| DL.CR.4 | Comprehensive code reviews with an emphasis on business logic           |          |
| DL.CR.5 | Foster a constructive and inclusive review culture                      |          |
| DL.CR.6 | Initiate code reviews using pull requests                               |          |
| DL.CR.7 | Create consistent and descriptive commit messages using a specification |          |
| DL.CR.8 | Designate code owners for expert review                                 |          |

### DL.CR - Anti-Patterns

| ID        | Title                        |
| :-------- | :--------------------------- |
| DL.CR-AP1 | Infrequent code reviews      |
| DL.CR-AP2 | Excessive required reviewers |
| DL.CR-AP3 | Lack of automated feedback   |
| DL.CR-AP4 | Large batch reviews          |
| DL.CR-AP5 | Unconstructive reviews       |
| DL.CR-AP6 | Lack of action on findings   |

### DL.CR - Metrics

| ID       | Title                           |
| :------- | :------------------------------ |
| DL.CR-M1 | Review Time to Merge (RTTM)     |
| DL.CR-M2 | Reviewer Load                   |
| DL.CR-M3 | Code Ownership Health           |
| DL.CR-M4 | Merge Request Type Distribution |
| DL.CR-M5 | Change Failure Rate             |

## Advanced Deployment Strategies

**Code:** DL.ADS

Advanced deployment strategies provide organizations with the ability to deploy and release new features and updates gradually. The fast feedback loop enabled by these strategies aids in early detection and resolution of potential issues during deployment, enhancing the reliability of the release process. With advanced deployment strategies, organizations can improve the quality and speed of software releases, reduce the risk of downtime or errors, and provide enhanced user experience.

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/devops-guidance/advanced-deployment-strategies.html>

### DL.ADS - Indicators

| ID       | Title                                                            | Category     |
| :------- | :--------------------------------------------------------------- | :----------- |
| DL.ADS.1 | Test deployments in pre-production environments                  | FOUNDATIONAL |
| DL.ADS.2 | Implement automatic rollbacks for failed deployments             | FOUNDATIONAL |
| DL.ADS.3 | Use staggered deployment and release strategies                  | FOUNDATIONAL |
| DL.ADS.4 | Implement Incremental Feature Release Techniques                 | RECOMMENDED  |
| DL.ADS.5 | Ensure backwards compatibility for data store and schema changes | RECOMMENDED  |
| DL.ADS.6 | Use cell-based architectures for granular deployment and release | OPTIONAL     |

### DL.ADS - Anti-Patterns

| ID         | Title                                     |
| :--------- | :---------------------------------------- |
| DL.ADS-AP1 | Deploying directly to production          |
| DL.ADS-AP2 | Ignoring rollbacks and data compatibility |
| DL.ADS-AP3 | Monolithic deployment model               |
| DL.ADS-AP4 | Abrupt feature release                    |

### DL.ADS - Metrics

| ID        | Title                       |
| :-------- | :-------------------------- |
| DL.ADS-M1 | Rollback frequency          |
| DL.ADS-M2 | Deployment lead time        |
| DL.ADS-M3 | Release frequency           |
| DL.ADS-M4 | Mean time to recover (MTTR) |
