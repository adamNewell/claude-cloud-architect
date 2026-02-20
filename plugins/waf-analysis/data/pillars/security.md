# Security Pillar Best Practices

Protect data, systems, and assets through risk assessments and mitigation strategies.

## Contents

- [HIGH Risk Practices](#high-risk-practices)
- [MEDIUM Risk Practices](#medium-risk-practices)
- [LOW Risk Practices](#low-risk-practices)
- [Practice Details](#practice-details)

## HIGH Risk Practices

| ID         | Title                                                            | Areas                                                       |
| :--------- | :--------------------------------------------------------------- | :---------------------------------------------------------- |
| SEC01-BP01 | Separate workloads using accounts                                | Security Foundations, AWS account management and separation |
| SEC01-BP02 | Secure account root user and properties                          | Security Foundations, AWS account management and separation |
| SEC01-BP03 | Identify and validate control objectives                         | Security Foundations, Operating your workloads securely     |
| SEC01-BP04 | Stay up to date with security threats and recommendations        | Security Foundations, Operating your workloads securely     |
| SEC01-BP07 | Identify threats and prioritize mitigations using a threat model | Security Foundations, Operating your workloads securely     |
| SEC02-BP01 | Use strong sign-in mechanisms                                    | Identity and access management, Identity management         |
| SEC02-BP02 | Use temporary credentials                                        | Identity and access management, Identity management         |
| SEC02-BP03 | Store and use secrets securely                                   | Identity and access management, Identity management         |
| SEC02-BP04 | Rely on a centralized identity provider                          | Identity and access management, Identity management         |
| SEC02-BP05 | Audit and rotate credentials periodically                        | Identity and access management, Identity management         |
| SEC03-BP01 | Define access requirements                                       | Identity and access management, Permissions management      |
| SEC03-BP02 | Grant least privilege access                                     | Identity and access management, Permissions management      |
| SEC04-BP01 | Configure service and application logging                        | Detection                                                   |
| SEC05-BP01 | Create network layers                                            | Infrastructure protection, Protecting networks              |
| SEC05-BP02 | Control traffic flow within your network layers                  | Infrastructure protection, Protecting networks              |
| SEC06-BP01 | Perform vulnerability management                                 | Infrastructure protection, Protecting compute               |
| SEC06-BP02 | Provision compute from hardened images                           | Infrastructure protection, Protecting compute               |
| SEC07-BP01 | Understand your data classification scheme                       | Data protection, Data classification                        |
| SEC07-BP02 | Apply data protection controls based on data sensitivity         | Data protection, Data classification                        |
| SEC07-BP04 | Define scalable data lifecycle management                        | Data protection, Data classification                        |
| SEC08-BP01 | Implement secure key management                                  | Data protection, Protecting data at rest                    |
| SEC08-BP02 | Enforce encryption at rest                                       | Data protection, Protecting data at rest                    |
| SEC08-BP04 | Enforce access control                                           | Data protection, Protecting data at rest                    |
| SEC09-BP01 | Implement secure key and certificate management                  | Data protection, Protecting data in transit                 |
| SEC09-BP02 | Enforce encryption in transit                                    | Data protection, Protecting data in transit                 |
| SEC10-BP01 | Identify key personnel and external resources                    | Incident response, Preparation                              |
| SEC10-BP02 | Develop incident management plans                                | Incident response, Preparation                              |
| SEC11-BP03 | Perform regular penetration testing                              | Application security                                        |
| SEC11-BP06 | Deploy software programmatically                                 | Application security                                        |
| SEC11-BP07 | Regularly assess security properties of the pipelines            | Application security                                        |

## MEDIUM Risk Practices

| ID         | Title                                                             | Areas                                                   |
| :--------- | :---------------------------------------------------------------- | :------------------------------------------------------ |
| SEC01-BP05 | Reduce security management scope                                  | Security Foundations, Operating your workloads securely |
| SEC01-BP06 | Automate deployment of standard security controls                 | Security Foundations, Operating your workloads securely |
| SEC02-BP06 | Employ user groups and attributes                                 | Identity and access management, Identity management     |
| SEC03-BP03 | Establish emergency access process                                | Identity and access management, Permissions management  |
| SEC03-BP04 | Reduce permissions continuously                                   | Identity and access management, Permissions management  |
| SEC03-BP05 | Define permission guardrails for your organization                | Identity and access management, Permissions management  |
| SEC03-BP06 | Manage access based on lifecycle                                  | Identity and access management, Permissions management  |
| SEC03-BP08 | Share resources securely within your organization                 | Identity and access management, Permissions management  |
| SEC03-BP09 | Share resources securely with a third party                       | Identity and access management, Permissions management  |
| SEC04-BP02 | Capture logs, findings, and metrics in standardized locations     | Detection                                               |
| SEC04-BP04 | Initiate remediation for non-compliant resources                  | Detection                                               |
| SEC05-BP03 | Implement inspection-based protection                             | Infrastructure protection, Protecting networks          |
| SEC05-BP04 | Automate network protection                                       | Infrastructure protection, Protecting networks          |
| SEC06-BP03 | Reduce manual management and interactive access                   | Infrastructure protection, Protecting compute           |
| SEC06-BP04 | Validate software integrity                                       | Infrastructure protection, Protecting compute           |
| SEC06-BP05 | Automate compute protection                                       | Infrastructure protection, Protecting compute           |
| SEC07-BP03 | Automate identification and classification                        | Data protection, Data classification                    |
| SEC08-BP03 | Automate data at rest protection                                  | Data protection, Protecting data at rest                |
| SEC10-BP03 | Prepare forensic capabilities                                     | Incident response, Preparation                          |
| SEC10-BP04 | Develop and test security incident response playbooks             | Incident response, Preparation                          |
| SEC10-BP05 | Pre-provision access                                              | Incident response, Preparation                          |
| SEC10-BP06 | Pre-deploy tools                                                  | Incident response, Preparation                          |
| SEC10-BP07 | Run simulations                                                   | Incident response, Preparation                          |
| SEC10-BP08 | Establish a framework for learning from incidents                 | Incident response, Post-incident activity               |
| SEC11-BP01 | Train for application security                                    | Application security                                    |
| SEC11-BP02 | Automate testing throughout the development and release lifecycle | Application security                                    |
| SEC11-BP04 | Conduct code reviews                                              | Application security                                    |
| SEC11-BP05 | Centralize services for packages and dependencies                 | Application security                                    |

## LOW Risk Practices

| ID         | Title                                                               | Areas                                                   |
| :--------- | :------------------------------------------------------------------ | :------------------------------------------------------ |
| SEC01-BP08 | Evaluate and implement new security services and features regularly | Security Foundations, Operating your workloads securely |
| SEC03-BP07 | Analyze public and cross-account access                             | Identity and access management, Permissions management  |
| SEC04-BP03 | Correlate and enrich security alerts                                | Detection                                               |
| SEC09-BP03 | Authenticate network communications                                 | Data protection, Protecting data in transit             |
| SEC11-BP08 | Build a program that embeds security ownership in workload teams    | Application security                                    |

## Practice Details

### SEC01-BP01: Separate workloads using accounts

**Risk:** HIGH
**Areas:** Security Foundations, AWS account management and separation

Establish common guardrails and isolation between environments (such as production, development, and test) and workloads through a multi-account strategy. Account-level separation is strongly recommended, as it provides a strong isolation boundary for security, billing, and access.

**Related:** SEC02-BP04

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/security-pillar/sec_securely_operate_multi_accounts.html>

### SEC01-BP02: Secure account root user and properties

**Risk:** HIGH
**Areas:** Security Foundations, AWS account management and separation

The root user is the most privileged user in an AWS account, with full administrative access to all resources within the account, and in some cases cannot be constrained by security policies. Deactivating programmatic access to the root user, establishing appropriate controls for the root user, and avoiding routine use of the root user helps reduce the risk of inadvertent exposure of the root credentials and subsequent compromise of the cloud environment.

**Related:** SEC01-BP01, SEC02-BP01, SEC03-BP02, SEC03-BP03, SEC10-BP05

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/security-pillar/sec_securely_operate_aws_account.html>

### SEC01-BP03: Identify and validate control objectives

**Risk:** HIGH
**Areas:** Security Foundations, Operating your workloads securely

Based on your compliance requirements and risks identified from your threat model, derive and validate the control objectives and controls that you need to apply to your workload. Ongoing validation of control objectives and controls help you measure the effectiveness of risk mitigation.

**Related:** SEC03-BP01, SEC04-BP01, SEC07-BP01, OPS01-BP03, OPS01-BP04, PERF1-BP05, COST02-BP01

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/security-pillar/sec_securely_operate_control_objectives.html>

### SEC01-BP04: Stay up to date with security threats and recommendations

**Risk:** HIGH
**Areas:** Security Foundations, Operating your workloads securely

Stay up to date with the latest threats and mitigations by monitoring industry threat intelligence publications and data feeds for updates. Evaluate managed service offerings that automatically update based on the latest threat data.

**Related:** SEC01-BP07, OPS01-BP05, OPS11-BP01

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/security-pillar/sec_securely_operate_updated_threats.html>

### SEC01-BP05: Reduce security management scope

**Risk:** MEDIUM
**Areas:** Security Foundations, Operating your workloads securely

Determine if you can reduce your security scope by using AWS services that shift management of certain controls to AWS (managed services). These services can help reduce your security maintenance tasks, such as infrastructure provisioning, software setup, patching, or backups.

**Related:** PERF02-BP01, PERF03-BP01, SUS05-BP03

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/security-pillar/sec_securely_operate_reduce_management_scope.html>

### SEC01-BP06: Automate deployment of standard security controls

**Risk:** MEDIUM
**Areas:** Security Foundations, Operating your workloads securely

Apply modern DevOps practices as you develop and deploy security controls that are standard across your AWS environments.  Define standard security controls and configurations using Infrastructure as Code (IaC) templates, capture changes in a version control system, test changes as part of a CI/CD pipeline, and automate the deployment of changes to your AWS environments.

**Related:** OPS05-BP01, OPS05-BP04, REL08-BP05, SUS06-BP01

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/security-pillar/sec_securely_operate_automate_security_controls.html>

### SEC01-BP07: Identify threats and prioritize mitigations using a threat model

**Risk:** HIGH
**Areas:** Security Foundations, Operating your workloads securely

Perform threat modeling to identify and maintain an up-to-date register of potential threats and associated mitigations for your workload. Prioritize your threats and adapt your security control mitigations to prevent, detect, and respond. Revisit and maintain this in the context of your workload, and the evolving security landscape.

**Related:** SEC01-BP03, SEC01-BP04, SEC01-BP05, SEC01-BP08

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/security-pillar/sec_securely_operate_threat_model.html>

### SEC01-BP08: Evaluate and implement new security services and features regularly

**Risk:** LOW
**Areas:** Security Foundations, Operating your workloads securely

Evaluate and implement security services and features from AWS and AWS Partners that help you evolve the security posture of your workload.

**Related:** PERF01-BP01, COST01-BP07

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/security-pillar/sec_securely_operate_implement_services_features.html>

### SEC02-BP01: Use strong sign-in mechanisms

**Risk:** HIGH
**Areas:** Identity and access management, Identity management

Sign-ins (authentication using sign-in credentials) can present risks when not using mechanisms like multi-factor authentication (MFA), especially in situations where sign-in credentials have been inadvertently disclosed or are easily guessed. Use strong sign-in mechanisms to reduce these risks by requiring MFA and strong password policies.

**Related:** SEC02-BP03, SEC02-BP04, SEC03-BP08

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/security-pillar/sec_identities_enforce_mechanisms.html>

### SEC02-BP02: Use temporary credentials

**Risk:** HIGH
**Areas:** Identity and access management, Identity management

When doing any type of authentication, it's best to use temporary credentials instead of long-term credentials to reduce or eliminate risks, such as credentials being inadvertently disclosed, shared, or stolen.

**Related:** SEC02-BP03, SEC02-BP04, SEC03-BP08

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/security-pillar/sec_identities_unique.html>

### SEC02-BP03: Store and use secrets securely

**Risk:** HIGH
**Areas:** Identity and access management, Identity management

A workload requires an automated capability to prove its identity to databases, resources, and third-party services. This is accomplished using secret access credentials, such as API access keys, passwords, and OAuth tokens. Using a purpose-built service to store, manage, and rotate these credentials helps reduce the likelihood that those credentials become compromised.

**Related:** SEC02-BP02, SEC02-BP05

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/security-pillar/sec_identities_secrets.html>

### SEC02-BP04: Rely on a centralized identity provider

**Risk:** HIGH
**Areas:** Identity and access management, Identity management

For workforce identities (employees and contractors), rely on an identity provider that allows you to manage identities in a centralized place. This makes it easier to manage access across multiple applications and systems, because you are creating, assigning, managing, revoking, and auditing access from a single location.

**Related:** SEC02-BP06, SEC03-BP02, SEC03-BP06

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/security-pillar/sec_identities_identity_provider.html>

### SEC02-BP05: Audit and rotate credentials periodically

**Risk:** HIGH
**Areas:** Identity and access management, Identity management

Audit and rotate credentials periodically to limit how long the credentials can be used to access your resources. Long-term credentials create many risks, and these risks can be reduced by rotating long-term credentials regularly.

**Related:** SEC02-BP02, SEC02-BP03

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/security-pillar/sec_identities_audit.html>

### SEC02-BP06: Employ user groups and attributes

**Risk:** MEDIUM
**Areas:** Identity and access management, Identity management

Defining permissions according to user groups and attributes helps reduce the number and complexity of policies, making it simpler to achieve the principle of least privilege. You can use user groups to manage the permissions for many people in one place based on the function they perform in your organization. Attributes, such as department, project, or location, can provide an additional layer of permission scope when people perform a similar function but for different subsets of resources.

**Related:** SEC02-BP04, SEC03-BP04, COST02-BP04

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/security-pillar/sec_identities_groups_attributes.html>

### SEC03-BP01: Define access requirements

**Risk:** HIGH
**Areas:** Identity and access management, Permissions management

Each component or resource of your workload needs to be accessed by administrators, end users, or other components. Have a clear definition of who or what should have access to each component, choose the appropriate identity type and method of authentication and authorization.

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/security-pillar/sec_permissions_define.html>

### SEC03-BP02: Grant least privilege access

**Risk:** HIGH
**Areas:** Identity and access management, Permissions management

Grant only the access that users require to perform specific actions on specific resources under specific conditions. Use group and identity attributes to dynamically set permissions at scale, rather than defining permissions for individual users. For example, you can allow a group of developers access to manage only resources for their project. This way, if a developer leaves the project, their access is automatically revoked without changing the underlying access policies.

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/security-pillar/sec_permissions_least_privileges.html>

### SEC03-BP03: Establish emergency access process

**Risk:** MEDIUM
**Areas:** Identity and access management, Permissions management

Create a process that allows for emergency access to your workloads in the unlikely event of an issue with your centralized identity provider.

**Related:** SEC02-BP04, SEC03-BP02, SEC10-BP02, SEC10-BP07

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/security-pillar/sec_permissions_emergency_process.html>

### SEC03-BP04: Reduce permissions continuously

**Risk:** MEDIUM
**Areas:** Identity and access management, Permissions management

As your teams determine what access is required, remove unneeded permissions and establish review processes to achieve least privilege permissions. Continually monitor and remove unused identities and permissions for both human and machine access.

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/security-pillar/sec_permissions_continuous_reduction.html>

### SEC03-BP05: Define permission guardrails for your organization

**Risk:** MEDIUM
**Areas:** Identity and access management, Permissions management

Use permission guardrails to reduce the scope of available permissions that can be granted to principals. The permission policy evaluation chain includes your guardrails to determine the effective permissions of a principal when making authorization decisions.  You can define guardrails using a layer-based approach. Apply some guardrails broadly across your entire organization and apply others granularly to temporary access sessions.

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/security-pillar/sec_permissions_define_guardrails.html>

### SEC03-BP06: Manage access based on lifecycle

**Risk:** MEDIUM
**Areas:** Identity and access management, Permissions management

Monitor and adjust the permissions granted to your principals (users, roles, and groups) throughout their lifecycle within your organization. Adjust group memberships as users change roles, and remove access when a user leaves the organization.

**Related:** SEC02-BP04

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/security-pillar/sec_permissions_lifecycle.html>

### SEC03-BP07: Analyze public and cross-account access

**Risk:** LOW
**Areas:** Identity and access management, Permissions management

Continually monitor findings that highlight public and cross-account access. Reduce public access and cross-account access to only the specific resources that require this access.

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/security-pillar/sec_permissions_analyze_cross_account.html>

### SEC03-BP08: Share resources securely within your organization

**Risk:** MEDIUM
**Areas:** Identity and access management, Permissions management

As the number of workloads grows, you might need to share access to resources in those workloads or provision the resources multiple times across multiple accounts. You might have constructs to compartmentalize your environment, such as having development, testing, and production environments. However, having separation constructs does not limit you from being able to share securely. By sharing components that overlap, you can reduce operational overhead and allow for a consistent experience without guessing what you might have missed while creating the same resource multiple times.

**Related:** SEC03-BP07, SEC03-BP09, SEC05-BP01

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/security-pillar/sec_permissions_share_securely.html>

### SEC03-BP09: Share resources securely with a third party

**Risk:** MEDIUM
**Areas:** Identity and access management, Permissions management

The security of your cloud environment doesn't stop at your organization. Your organization might rely on a third party to manage a portion of your data. The permission management for the third-party managed system should follow the practice of just-in-time access using the principle of least privilege with temporary credentials. By working closely with a third party, you can reduce the scope of impact and risk of unintended access together.

**Related:** SEC02-BP02, SEC03-BP05, SEC03-BP06, SEC03-BP07, SEC04

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/security-pillar/sec_permissions_share_securely_third_party.html>

### SEC04-BP01: Configure service and application logging

**Risk:** HIGH
**Areas:** Detection

Retain security event logs from services and applications. This is a fundamental principle of security for audit, investigations, and operational use cases, and a common security requirement driven by governance, risk, and compliance (GRC) standards, policies, and procedures.

**Related:** SEC04-BP02, SEC07-BP04, SEC10-BP06

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/security-pillar/sec_detect_investigate_events_app_service_logging.html>

### SEC04-BP02: Capture logs, findings, and metrics in standardized locations

**Risk:** MEDIUM
**Areas:** Detection

Security teams rely on logs and findings to analyze events that may indicate unauthorized activity or unintentional changes. To streamline this analysis, capture security logs and findings in standardized locations.  This makes data points of interest available for correlation and can simplify tool integrations.

**Related:** SEC01-BP01, SEC07-BP04, SEC08-BP04, OPS08-BP02

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/security-pillar/sec_detect_investigate_events_logs.html>

### SEC04-BP03: Correlate and enrich security alerts

**Risk:** LOW
**Areas:** Detection

Unexpected activity can generate multiple security alerts by different sources, requiring further correlation and enrichment to understand the full context. Implement automated correlation and enrichment of security alerts to help achieve more accurate incident identification and response.

**Related:** SEC10-BP03, OPS08-BP04, REL06-BP03

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/security-pillar/sec_detect_investigate_events_security_alerts.html>

### SEC04-BP04: Initiate remediation for non-compliant resources

**Risk:** MEDIUM
**Areas:** Detection

Your detective controls may alert on resources that are out of compliance with your configuration requirements. You can initiate programmatically-defined remediations, either manually or automatically, to fix these resources and help minimize potential impacts. When you define remediations programmatically, you can take prompt and consistent action.

**Related:** SEC06-BP03

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/security-pillar/sec_detect_investigate_events_noncompliant_resources.html>

### SEC05-BP01: Create network layers

**Risk:** HIGH
**Areas:** Infrastructure protection, Protecting networks

Segment your network topology into different layers based on logical groupings of your workload components according to their data sensitivity and access requirements. Distinguish between components that require inbound access from the internet, such as public web endpoints, and those that only need internal access, such as databases.

**Related:** REL02, PERF04-BP01

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/security-pillar/sec_network_protection_create_layers.html>

### SEC05-BP02: Control traffic flow within your network layers

**Risk:** HIGH
**Areas:** Infrastructure protection, Protecting networks

Within the layers of your network, use further segmentation to restrict traffic only to the flows necessary for each workload. First, focus on controlling traffic between the internet or other external systems to a workload and your environment (north-south traffic). Afterwards, look at flows between different components and systems (east-west traffic).

**Related:** REL03-BP01, SEC09-BP02

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/security-pillar/sec_network_protection_layered.html>

### SEC05-BP03: Implement inspection-based protection

**Risk:** MEDIUM
**Areas:** Infrastructure protection, Protecting networks

Set up traffic inspection points between your network layers to make sure data in transit matches the expected categories and patterns.  Analyze traffic flows, metadata, and patterns to help identify, detect, and respond to events more effectively.

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/security-pillar/sec_network_protection_inspection.html>

### SEC05-BP04: Automate network protection

**Risk:** MEDIUM
**Areas:** Infrastructure protection, Protecting networks

Automate the deployment of your network protections using DevOps practices, such as infrastructure as code (IaC) and CI/CD pipelines.  These practices can help you track changes in your network protections through a version control system, reduce the time it takes to deploy changes, and help detect if your network protections drift from your desired configuration.

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/security-pillar/sec_network_auto_protect.html>

### SEC06-BP01: Perform vulnerability management

**Risk:** HIGH
**Areas:** Infrastructure protection, Protecting compute

Frequently scan and patch for vulnerabilities in your code, dependencies, and in your infrastructure to help protect against new threats.

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/security-pillar/sec_protect_compute_vulnerability_management.html>

### SEC06-BP02: Provision compute from hardened images

**Risk:** HIGH
**Areas:** Infrastructure protection, Protecting compute

Provide fewer opportunities for unintended access to your runtime environments by deploying them from hardened images. Only acquire runtime dependencies, such as container images and application libraries, from trusted registries and verify their signatures. Create your own private registries to store trusted images and libraries for use in your build and deploy processes.

**Related:** OPS05-BP05

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/security-pillar/sec_protect_compute_hardened_images.html>

### SEC06-BP03: Reduce manual management and interactive access

**Risk:** MEDIUM
**Areas:** Infrastructure protection, Protecting compute

Use automation to perform deployment, configuration, maintenance, and investigative tasks wherever possible. Consider manual access to compute resources in cases of emergency procedures or in safe (sandbox) environments, when automation is not available.

**Related:** REL08-BP04

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/security-pillar/sec_protect_compute_reduce_manual_management.html>

### SEC06-BP04: Validate software integrity

**Risk:** MEDIUM
**Areas:** Infrastructure protection, Protecting compute

Use cryptographic verification to validate the integrity of software artifacts (including images) your workload uses.  Cryptographically sign your software as a safeguard against unauthorized changes run within your compute environments.

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/security-pillar/sec_protect_compute_validate_software_integrity.html>

### SEC06-BP05: Automate compute protection

**Risk:** MEDIUM
**Areas:** Infrastructure protection, Protecting compute

Automate compute protection operations to reduce the need for human intervention. Use automated scanning to detect potential issues within your compute resources, and remediate with automated programmatic responses or fleet management operations.  Incorporate automation in your CI/CD processes to deploy trustworthy workloads with up-to-date dependencies.

**Related:** SEC01-BP06

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/security-pillar/sec_protect_compute_auto_protection.html>

### SEC07-BP01: Understand your data classification scheme

**Risk:** HIGH
**Areas:** Data protection, Data classification

Understand the classification of data your workload is processing, its handling requirements, the associated business processes, where the data is stored, and who the data owner is.  Your data classification and handling scheme should consider the applicable legal and compliance requirements of your workload and what data controls are needed. Understanding the data is the first step in the data classification journey.

**Related:** SUS04-BP01

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/security-pillar/sec_data_classification_identify_data.html>

### SEC07-BP02: Apply data protection controls based on data sensitivity

**Risk:** HIGH
**Areas:** Data protection, Data classification

Apply data protection controls that provide an appropriate level of control for each class of data defined in your classification policy.  This practice can allow you to protect sensitive data from unauthorized access and use, while preserving the availability and use of data.

**Related:** PERF03-BP01, COST04-BP05

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/security-pillar/sec_data_classification_define_protection.html>

### SEC07-BP03: Automate identification and classification

**Risk:** MEDIUM
**Areas:** Data protection, Data classification

Automating the identification and classification of data can help you implement the correct controls. Using automation to augment manual determination reduces the risk of human error and exposure.

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/security-pillar/sec_data_classification_auto_classification.html>

### SEC07-BP04: Define scalable data lifecycle management

**Risk:** HIGH
**Areas:** Data protection, Data classification

Understand your data lifecycle requirements as they relate to your different levels of data classification and handling.  This can include how data is handled when it first enters your environment, how data is transformed, and the rules for its destruction. Consider factors such as retention periods, access, auditing, and tracking provenance.

**Related:** COST04-BP05, SUS04-BP03

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/security-pillar/sec_data_classification_lifecycle_management.html>

### SEC08-BP01: Implement secure key management

**Risk:** HIGH
**Areas:** Data protection, Protecting data at rest

Secure key management includes the storage, rotation, access control, and monitoring of key material required to secure data at rest for your workload.

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/security-pillar/sec_protect_data_rest_key_mgmt.html>

### SEC08-BP02: Enforce encryption at rest

**Risk:** HIGH
**Areas:** Data protection, Protecting data at rest

Encrypt private data at rest to maintain confidentiality and provide an additional layer of protection against unintended data disclosure or exfiltration. Encryption protects data so that it cannot be read or accessed without first being decrypted. Inventory and control unencrypted data to mitigate risks associated with data exposure.

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/security-pillar/sec_protect_data_rest_encrypt.html>

### SEC08-BP03: Automate data at rest protection

**Risk:** MEDIUM
**Areas:** Data protection, Protecting data at rest

Use automation to validate and enforce data at rest controls.  Use automated scanning to detect misconfiguration of your data storage solutions, and perform remediations through automated programmatic response where possible.

**Related:** SEC01-BP06, SEC03-BP02, SEC03-BP04, SEC04-BP04, SEC07-BP03, REL09-BP02, REL09-BP03

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/security-pillar/sec_protect_data_rest_automate_protection.html>

### SEC08-BP04: Enforce access control

**Risk:** HIGH
**Areas:** Data protection, Protecting data at rest

To help protect your data at rest, enforce access control using mechanisms such as isolation and versioning. Apply least privilege and conditional access controls. Prevent granting public access to your data.

**Related:** SEC03-BP01, SEC03-BP02

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/security-pillar/sec_protect_data_rest_access_control.html>

### SEC09-BP01: Implement secure key and certificate management

**Risk:** HIGH
**Areas:** Data protection, Protecting data in transit

Transport Layer Security (TLS) certificates are used to secure network communications and establish the identity of websites, resources, and workloads over the internet, as well as private networks.

**Related:** SEC02-BP02, SEC08-BP01, SEC09-BP03

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/security-pillar/sec_protect_data_transit_key_cert_mgmt.html>

### SEC09-BP02: Enforce encryption in transit

**Risk:** HIGH
**Areas:** Data protection, Protecting data in transit

Enforce your defined encryption requirements based on your organization’s policies, regulatory obligations and standards to help meet organizational, legal, and compliance requirements. Only use protocols with encryption when transmitting sensitive data outside of your virtual private cloud (VPC). Encryption helps maintain data confidentiality even when the data transits untrusted networks.

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/security-pillar/sec_protect_data_transit_encrypt.html>

### SEC09-BP03: Authenticate network communications

**Risk:** LOW
**Areas:** Data protection, Protecting data in transit

Verify the identity of communications by using protocols that support authentication, such as Transport Layer Security (TLS) or IPsec.

**Related:** SEC01-BP07, SEC02-BP02, SEC03-BP07

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/security-pillar/sec_protect_data_transit_authentication.html>

### SEC10-BP01: Identify key personnel and external resources

**Risk:** HIGH
**Areas:** Incident response, Preparation

Identify internal and external personnel, resources, and legal obligations to help your organization respond to an incident.

**Related:** OPS02-BP03

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/security-pillar/sec_incident_response_identify_personnel.html>

### SEC10-BP02: Develop incident management plans

**Risk:** HIGH
**Areas:** Incident response, Preparation

The first document to develop for incident response is the incident response plan. The incident response plan is designed to be the foundation for your incident response program and strategy.

**Related:** SEC04

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/security-pillar/sec_incident_response_develop_management_plans.html>

### SEC10-BP03: Prepare forensic capabilities

**Risk:** MEDIUM
**Areas:** Incident response, Preparation

Ahead of a security incident, consider developing forensics capabilities to support security event investigations.

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/security-pillar/sec_incident_response_prepare_forensic.html>

### SEC10-BP04: Develop and test security incident response playbooks

**Risk:** MEDIUM
**Areas:** Incident response, Preparation

A key part of preparing your incident response processes is developing playbooks. Incident response playbooks provide prescriptive guidance and steps to follow when a security event occurs. Having clear structure and steps simplifies the response and reduces the likelihood for human error.

**Related:** SEC10-BP02

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/security-pillar/sec_incident_response_playbooks.html>

### SEC10-BP05: Pre-provision access

**Risk:** MEDIUM
**Areas:** Incident response, Preparation

Verify that incident responders have the correct access pre-provisioned in AWS to reduce the time needed for investigation through to recovery.

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/security-pillar/sec_incident_response_pre_provision_access.html>

### SEC10-BP06: Pre-deploy tools

**Risk:** MEDIUM
**Areas:** Incident response, Preparation

Verify that security personnel have the right tools pre-deployed to reduce the time for investigation through to recovery.

**Related:** SEC04-BP01, SEC04-BP02

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/security-pillar/sec_incident_response_pre_deploy_tools.html>

### SEC10-BP07: Run simulations

**Risk:** MEDIUM
**Areas:** Incident response, Preparation

As organizations grow and evolve over time, so does the threat landscape, making it important to continually review your incident response capabilities. Running simulations (also known as game days) is one method that can be used to perform this assessment. Simulations use real-world security event scenarios designed to mimic a threat actor’s tactics, techniques, and procedures (TTPs) and allow an organization to exercise and evaluate their incident response capabilities by responding to these mock cyber events as they might occur in reality.

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/security-pillar/sec_incident_response_run_game_days.html>

### SEC10-BP08: Establish a framework for learning from incidents

**Risk:** MEDIUM
**Areas:** Incident response, Post-incident activity

Implementing a lessons learned framework and root cause analysis capability can not only help improve incident response capabilities, but also help prevent the incident from recurring. By learning from each incident, you can help avoid repeating the same mistakes, exposures, or misconfigurations, not only improving your security posture, but also minimizing time lost to preventable situations.

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/security-pillar/sec_incident_response_establish_incident_framework.html>

### SEC11-BP01: Train for application security

**Risk:** MEDIUM
**Areas:** Application security

Provide training to your team on secure development and operation practices, which helps them build secure and high-quality software. This practice helps your team to prevent, detect, and remediate security issues earlier in the development lifecycle. Consider training that covers threat modeling, secure coding practices, and using services for secure configurations and operations. Provide your team access to training through self-service resources, and regularly gather their feedback for continuous improvement.

**Related:** SEC11-BP08

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/security-pillar/sec_appsec_train_for_application_security.html>

### SEC11-BP02: Automate testing throughout the development and release lifecycle

**Risk:** MEDIUM
**Areas:** Application security

Automate the testing for security properties throughout the development and release lifecycle. Automation makes it easier to consistently and repeatably identify potential issues in software prior to release, which reduces the risk of security issues in the software being provided.

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/security-pillar/sec_appsec_automate_testing_throughout_lifecycle.html>

### SEC11-BP03: Perform regular penetration testing

**Risk:** HIGH
**Areas:** Application security

Perform regular penetration testing of your software. This mechanism helps identify potential software issues that cannot be detected by automated testing or a manual code review. It can also help you understand the efficacy of your detective controls. Penetration testing should try to determine if the software can be made to perform in unexpected ways, such as exposing data that should be protected, or granting broader permissions than expected.

**Related:** SEC11-BP01, SEC11-BP02

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/security-pillar/sec_appsec_perform_regular_penetration_testing.html>

### SEC11-BP04: Conduct code reviews

**Risk:** MEDIUM
**Areas:** Application security

Implement code reviews to help verify the quality and security of software being developed. Code reviews involve having team members other than the original code author review the code for potential issues, vulnerabilities, and adherence to coding standards and best practices. This process helps catch errors, inconsistencies, and security flaws that might have been overlooked by the original developer. Use automated tools to assist with code reviews.

**Related:** SEC11-BP02

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/security-pillar/sec_appsec_manual_code_reviews.html>

### SEC11-BP05: Centralize services for packages and dependencies

**Risk:** MEDIUM
**Areas:** Application security

Provide centralized services for your teams to obtain software packages and other dependencies. This allows the validation of packages before they are included in the software that you write and provides a source of data for the analysis of the software being used in your organization.

**Related:** SEC11-BP02

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/security-pillar/sec_appsec_centralize_services_for_packages_and_dependencies.html>

### SEC11-BP06: Deploy software programmatically

**Risk:** HIGH
**Areas:** Application security

Perform software deployments programmatically where possible. This approach reduces the likelihood that a deployment fails or an unexpected issue is introduced due to human error.

**Related:** SEC11-BP02

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/security-pillar/sec_appsec_deploy_software_programmatically.html>

### SEC11-BP07: Regularly assess security properties of the pipelines

**Risk:** HIGH
**Areas:** Application security

Apply the principles of the Well-Architected Security Pillar to your pipelines, with particular attention to the separation of permissions. Regularly assess the security properties of your pipeline infrastructure. Effectively managing the security of the pipelines allows you to deliver the security of the software that passes through the pipelines.

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/security-pillar/sec_appsec_regularly_assess_security_properties_of_pipelines.html>

### SEC11-BP08: Build a program that embeds security ownership in workload teams

**Risk:** LOW
**Areas:** Application security

Build a program or mechanism that empowers builder teams to make security decisions about the software that they create. Your security team still needs to validate these decisions during a review, but embedding security ownership in builder teams allows for faster, more secure workloads to be built. This mechanism also promotes a culture of ownership that positively impacts the operation of the systems you build.

**Related:** SEC11-BP01, SEC11-BP02

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/security-pillar/sec_appsec_build_program_that_embeds_security_ownership_in_teams.html>
