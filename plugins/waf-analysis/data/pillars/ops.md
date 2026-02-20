# Operational Excellence Pillar Best Practices

Support development, run workloads effectively, and continuously improve.

## Contents

- [HIGH Risk Practices](#high-risk-practices)
- [MEDIUM Risk Practices](#medium-risk-practices)
- [LOW Risk Practices](#low-risk-practices)
- [Practice Details](#practice-details)

## HIGH Risk Practices

| ID         | Title                                                                          | Areas                                                |
| :--------- | :----------------------------------------------------------------------------- | :--------------------------------------------------- |
| OPS01-BP01 | Evaluate external customer needs                                               | Organization, Organization priorities                |
| OPS01-BP02 | Evaluate internal customer needs                                               | Organization, Organization priorities                |
| OPS01-BP03 | Evaluate governance requirements                                               | Organization, Organization priorities                |
| OPS01-BP04 | Evaluate compliance requirements                                               | Organization, Organization priorities                |
| OPS02-BP01 | Resources have identified owners                                               | Organization, Operating model                        |
| OPS02-BP02 | Processes and procedures have identified owners                                | Organization, Operating model                        |
| OPS02-BP03 | Operations activities have identified owners responsible for their performance | Organization, Operating model                        |
| OPS02-BP04 | Mechanisms exist to manage responsibilities and ownership                      | Organization, Operating model                        |
| OPS03-BP01 | Provide executive sponsorship                                                  | Organization, Operating model                        |
| OPS03-BP03 | Escalation is encouraged                                                       | Organization, Operating model                        |
| OPS03-BP04 | Communications are timely, clear, and actionable                               | Organization, Operating model                        |
| OPS04-BP01 | Identify key performance indicators                                            | Prepare, Implement observability                     |
| OPS04-BP02 | Implement application telemetry                                                | Prepare, Implement observability                     |
| OPS04-BP03 | Implement user experience telemetry                                            | Prepare, Implement observability                     |
| OPS04-BP04 | Implement dependency telemetry                                                 | Prepare, Implement observability                     |
| OPS04-BP05 | Implement distributed tracing                                                  | Prepare, Implement observability                     |
| OPS05-BP01 | Use version control                                                            | Prepare, Design for operations                       |
| OPS05-BP02 | Test and validate changes                                                      | Prepare, Design for operations                       |
| OPS06-BP01 | Plan for unsuccessful changes                                                  | Prepare, Mitigate deployment risks                   |
| OPS06-BP02 | Test deployments                                                               | Prepare, Mitigate deployment risks                   |
| OPS07-BP01 | Ensure personnel capability                                                    | Prepare, Operational readiness and change management |
| OPS07-BP02 | Ensure a consistent review of operational readiness                            | Prepare, Operational readiness and change management |
| OPS08-BP04 | Create actionable alerts                                                       | Operate, Utilizing workload observability            |
| OPS10-BP01 | Use a process for event, incident, and problem management                      | Operate, Responding to events                        |
| OPS10-BP02 | Have a process per alert                                                       | Operate, Responding to events                        |
| OPS10-BP03 | Prioritize operational events based on business impact                         | Operate, Responding to events                        |
| OPS11-BP01 | Have a process for continuous improvement                                      | Evolve, Learn, share, and improve                    |
| OPS11-BP02 | Perform post-incident analysis                                                 | Evolve, Learn, share, and improve                    |
| OPS11-BP03 | Implement feedback loops                                                       | Evolve, Learn, share, and improve                    |
| OPS11-BP04 | Perform knowledge management                                                   | Evolve, Learn, share, and improve                    |

## MEDIUM Risk Practices

| ID         | Title                                                               | Areas                                                |
| :--------- | :------------------------------------------------------------------ | :--------------------------------------------------- |
| OPS01-BP05 | Evaluate threat landscape                                           | Organization, Organization priorities                |
| OPS01-BP06 | Evaluate tradeoffs while managing benefits and risks                | Organization, Organization priorities                |
| OPS02-BP05 | Mechanisms exist to request additions, changes, and exceptions      | Organization, Operating model                        |
| OPS03-BP02 | Team members are empowered to take action when outcomes are at risk | Organization, Operating model                        |
| OPS03-BP05 | Experimentation is encouraged                                       | Organization, Operating model                        |
| OPS03-BP06 | Team members are encouraged to maintain and grow their skill sets   | Organization, Operating model                        |
| OPS03-BP07 | Resource teams appropriately                                        | Organization, Operating model                        |
| OPS05-BP03 | Use configuration management systems                                | Prepare, Design for operations                       |
| OPS05-BP04 | Use build and deployment management systems                         | Prepare, Design for operations                       |
| OPS05-BP05 | Perform patch management                                            | Prepare, Design for operations                       |
| OPS05-BP06 | Share design standards                                              | Prepare, Design for operations                       |
| OPS05-BP07 | Implement practices to improve code quality                         | Prepare, Design for operations                       |
| OPS05-BP08 | Use multiple environments                                           | Prepare, Design for operations                       |
| OPS06-BP03 | Employ safe deployment strategies                                   | Prepare, Mitigate deployment risks                   |
| OPS06-BP04 | Automate testing and rollback                                       | Prepare, Mitigate deployment risks                   |
| OPS07-BP03 | Use runbooks to perform procedures                                  | Prepare, Operational readiness and change management |
| OPS07-BP04 | Use playbooks to investigate issues                                 | Prepare, Operational readiness and change management |
| OPS08-BP01 | Analyze workload metrics                                            | Operate, Utilizing workload observability            |
| OPS08-BP02 | Analyze workload logs                                               | Operate, Utilizing workload observability            |
| OPS08-BP03 | Analyze workload traces                                             | Operate, Utilizing workload observability            |
| OPS08-BP05 | Create dashboards                                                   | Operate, Utilizing workload observability            |
| OPS09-BP01 | Measure operations goals and KPIs with metrics                      | Operate, Understanding operational health            |
| OPS09-BP02 | Communicate status and trends to ensure visibility into operation   | Operate, Understanding operational health            |
| OPS09-BP03 | Review operations metrics and prioritize improvement                | Operate, Understanding operational health            |
| OPS10-BP04 | Define escalation paths                                             | Operate, Responding to events                        |
| OPS10-BP05 | Define a customer communication plan for service-impacting events   | Operate, Responding to events                        |
| OPS10-BP06 | Communicate status through dashboards                               | Operate, Responding to events                        |
| OPS10-BP07 | Automate responses to events                                        | Operate, Responding to events                        |
| OPS11-BP05 | Define drivers for improvement                                      | Evolve, Learn, share, and improve                    |
| OPS11-BP06 | Validate insights                                                   | Evolve, Learn, share, and improve                    |
| OPS11-BP07 | Perform operations metrics reviews                                  | Evolve, Learn, share, and improve                    |

## LOW Risk Practices

| ID         | Title                                                       | Areas                                                |
| :--------- | :---------------------------------------------------------- | :--------------------------------------------------- |
| OPS02-BP06 | Responsibilities between teams are predefined or negotiated | Organization, Operating model                        |
| OPS05-BP09 | Make frequent, small, reversible changes                    | Prepare, Design for operations                       |
| OPS05-BP10 | Fully automate integration and deployment                   | Prepare, Design for operations                       |
| OPS07-BP05 | Make informed decisions to deploy systems and changes       | Prepare, Operational readiness and change management |
| OPS07-BP06 | Create support plans for production workloads               | Prepare, Operational readiness and change management |
| OPS11-BP08 | Document and share lessons learned                          | Evolve, Learn, share, and improve                    |
| OPS11-BP09 | Allocate time to make improvements                          | Evolve, Learn, share, and improve                    |

## Practice Details

### OPS01-BP01: Evaluate external customer needs

**Risk:** HIGH
**Areas:** Organization, Organization priorities

Involve key stakeholders, including business, development, and operations teams, to determine where to focus efforts on external customer needs. This verifies that you have a thorough understanding of the operations support that is required to achieve your desired business outcomes.

**Related:** OPS11-BP03

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/operational-excellence-pillar/ops_priorities_ext_cust_needs.html>

### OPS01-BP02: Evaluate internal customer needs

**Risk:** HIGH
**Areas:** Organization, Organization priorities

Involve key stakeholders, including business, development, and operations teams, when determining where to focus efforts on internal customer needs. This will ensure that you have a thorough understanding of the operations support that is required to achieve business outcomes.

**Related:** OPS11-BP03

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/operational-excellence-pillar/ops_priorities_int_cust_needs.html>

### OPS01-BP03: Evaluate governance requirements

**Risk:** HIGH
**Areas:** Organization, Organization priorities

Governance is the set of policies, rules, or frameworks that a company uses to achieve its business goals. Governance requirements are generated from within your organization. They can affect the types of technologies you choose or influence the way you operate your workload. Incorporate organizational governance requirements into your workload. Conformance is the ability to demonstrate that you have implemented governance requirements.

**Related:** OPS01-BP04

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/operational-excellence-pillar/ops_priorities_governance_reqs.html>

### OPS01-BP04: Evaluate compliance requirements

**Risk:** HIGH
**Areas:** Organization, Organization priorities

Regulatory, industry, and internal compliance requirements are an important driver for defining your organization’s priorities. Your compliance framework may preclude you from using specific technologies or geographic locations. Apply due diligence if no external compliance frameworks are identified. Generate audits or reports that validate compliance.

**Related:** SEC01-BP03, SEC01-BP06, SEC07-BP02, SEC10-BP03

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/operational-excellence-pillar/ops_priorities_compliance_reqs.html>

### OPS01-BP05: Evaluate threat landscape

**Risk:** MEDIUM
**Areas:** Organization, Organization priorities

Evaluate threats to the business (for example, competition, business risk and liabilities, operational risks, and information security threats) and maintain current information in a risk registry. Include the impact of risks when determining where to focus efforts.

**Related:** SEC01-BP07

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/operational-excellence-pillar/ops_priorities_eval_threat_landscape.html>

### OPS01-BP06: Evaluate tradeoffs while managing benefits and risks

**Risk:** MEDIUM
**Areas:** Organization, Organization priorities

Competing interests from multiple parties can make it challenging to prioritize efforts, build capabilities, and deliver outcomes aligned with business strategies. For example, you may be asked to accelerate speed-to-market for new features over optimizing IT infrastructure costs. This can put two interested parties in conflict with one another. In these situations, decisions need to be brought to a higher authority to resolve conflict. Data is required to remove emotional attachment from the decision-making process.

**Related:** SEC01-BP05

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/operational-excellence-pillar/ops_priorities_eval_tradeoffs.html>

### OPS02-BP01: Resources have identified owners

**Risk:** HIGH
**Areas:** Organization, Operating model, Relationships and ownership

Resources for your workload must have identified owners for change control, troubleshooting, and other functions. Owners are assigned for workloads, accounts, infrastructure, platforms, and applications. Ownership is recorded using tools like a central register or metadata attached to resources. The business value of components informs the processes and procedures applied to them.

**Related:** OPS02-BP02, OPS02-BP04

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/operational-excellence-pillar/ops_ops_model_def_resource_owners.html>

### OPS02-BP02: Processes and procedures have identified owners

**Risk:** HIGH
**Areas:** Organization, Operating model, Relationships and ownership

Understand who has ownership of the definition of individual processes and procedures, why those specific process and procedures are used, and why that ownership exists. Understanding the reasons that specific processes and procedures are used aids in identification of improvement opportunities.

**Related:** OPS02-BP01, OPS02-BP04, OPS11-BP04

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/operational-excellence-pillar/ops_ops_model_def_proc_owners.html>

### OPS02-BP03: Operations activities have identified owners responsible for their performance

**Risk:** HIGH
**Areas:** Organization, Operating model, Relationships and ownership

Understand who has responsibility to perform specific activities on defined workloads and why that responsibility exists. Understanding who has responsibility to perform activities informs who will conduct the activity, validate the result, and provide feedback to the owner of the activity.

**Related:** OPS02-BP01, OPS02-BP02, OPS02-BP04, OPS02-BP05, OPS11-BP04

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/operational-excellence-pillar/ops_ops_model_def_activity_owners.html>

### OPS02-BP04: Mechanisms exist to manage responsibilities and ownership

**Risk:** HIGH
**Areas:** Organization, Operating model, Relationships and ownership

Understand the responsibilities of your role and how you contribute to business outcomes, as this understanding informs the prioritization of your tasks and why your role is important. This helps team members recognize needs and respond appropriately. When team members know their role, they can establish ownership, identify improvement opportunities, and understand how to influence or make appropriate changes.

**Related:** OPS02-BP06, OPS03-BP02, OPS03-BP03, OPS03-BP07, OPS09-BP01, OPS09-BP03, OPS11-BP01

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/operational-excellence-pillar/ops_ops_model_def_responsibilities_ownership.html>

### OPS02-BP05: Mechanisms exist to request additions, changes, and exceptions

**Risk:** MEDIUM
**Areas:** Organization, Operating model, Relationships and ownership

You can make requests to owners of processes, procedures, and resources. Requests include additions, changes, and exceptions. These requests go through a change management process. Make informed decisions to approve requests where viable and determined to be appropriate after an evaluation of benefits and risks.

**Related:** OPS02-BP01, OPS02-BP02, OPS02-BP03

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/operational-excellence-pillar/ops_ops_model_req_add_chg_exception.html>

### OPS02-BP06: Responsibilities between teams are predefined or negotiated

**Risk:** LOW
**Areas:** Organization, Operating model, Relationships and ownership

Have defined or negotiated agreements between teams describing how they work with and support each other (for example, response times, service level objectives, or service-level agreements). Inter-team communications channels are documented. Understanding the impact of the teams’ work on business outcomes and the outcomes of other teams and organizations informs the prioritization of their tasks and helps them respond appropriately.

**Related:** OPS02-BP02, OPS02-BP03

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/operational-excellence-pillar/ops_ops_model_def_neg_team_agreements.html>

### OPS03-BP01: Provide executive sponsorship

**Risk:** HIGH
**Areas:** Organization, Operating model, Organizational culture

At the highest level, senior leadership acts as the executive sponsor to clearly set expectations and direction for the organization's outcomes, including evaluating its success. The sponsor advocates and drives adoption of best practices and evolution of the organization.

**Related:** OPS03-BP04, OPS11-BP01

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/operational-excellence-pillar/ops_org_culture_executive_sponsor.html>

### OPS03-BP02: Team members are empowered to take action when outcomes are at risk

**Risk:** MEDIUM
**Areas:** Organization, Operating model, Organizational culture

A cultural behavior of ownership instilled by leadership results in any employee feeling empowered to act on behalf of the entire company beyond their defined scope of role and accountability. Employees can act to proactively identify risks as they emerge and take appropriate action. Such a culture allows employees to make high value decisions with situational awareness.

**Related:** OPS01-BP06, OPS01-BP05

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/operational-excellence-pillar/ops_org_culture_team_emp_take_action.html>

### OPS03-BP03: Escalation is encouraged

**Risk:** HIGH
**Areas:** Organization, Operating model, Organizational culture

Team members are encouraged by leadership to escalate issues and concerns to higher-level decision makers and stakeholders if they believe desired outcomes are at risk and expected standards are not met. This is a feature of the organization's culture and is driven at all levels. Escalation should be done early and often so that risks can be identified and prevented from causing incidents. Leadership does not reprimand individuals for escalating an issue.

**Related:** OPS02-BP05

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/operational-excellence-pillar/ops_org_culture_team_enc_escalation.html>

### OPS03-BP04: Communications are timely, clear, and actionable

**Risk:** HIGH
**Areas:** Organization, Operating model, Organizational culture

Leadership is responsible for the creation of strong and effective communications, especially when the organization adopts new strategies, technologies, or ways of working. Leaders should set expectations for all staff to work towards the company objectives. Devise communication mechanisms that create and maintain awareness among the teams responsible for running plans that are funded and sponsored by leadership. Make use of cross-organizational diversity, and listen attentively to multiple unique perspectives. Use this perspective to increase innovation, challenge your assumptions, and reduce the risk of confirmation bias. Foster inclusion, diversity, and accessibility within your teams to gain beneficial perspectives.

**Related:** OPS03-BP01, OPS07-BP03, OPS07-BP04

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/operational-excellence-pillar/ops_org_culture_effective_comms.html>

### OPS03-BP05: Experimentation is encouraged

**Risk:** MEDIUM
**Areas:** Organization, Operating model, Organizational culture

Experimentation is a catalyst for turning new ideas into products and features. It accelerates learning and keeps team members interested and engaged. Team members are encouraged to experiment often to drive innovation. Even when an undesired result occurs, there is value in knowing what not to do. Team members are not punished for successful experiments with undesired results.

**Related:** OPS11-BP02, OPS11-BP03

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/operational-excellence-pillar/ops_org_culture_team_enc_experiment.html>

### OPS03-BP06: Team members are encouraged to maintain and grow their skill sets

**Risk:** MEDIUM
**Areas:** Organization, Operating model, Organizational culture

Teams must grow their skill sets to adopt new technologies, and to support changes in demand and responsibilities in support of your workloads. Growth of skills in new technologies is frequently a source of team member satisfaction and supports innovation. Support your team members' pursuit and maintenance of industry certifications that validate and acknowledge their growing skills. Cross train to promote knowledge transfer and reduce the risk of significant impact when you lose skilled and experienced team members with institutional knowledge. Provide dedicated structured time for learning.

**Related:** OPS03-BP01, OPS11-BP04

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/operational-excellence-pillar/ops_org_culture_team_enc_learn.html>

### OPS03-BP07: Resource teams appropriately

**Risk:** MEDIUM
**Areas:** Organization, Operating model, Organizational culture

Provision the right amount of proficient team members, and provide tools and resources to support your workload needs. Overburdening team members increases the risk of human error. Investments in tools and resources, such as automation, can scale the effectiveness of your team and help them support a greater number of workloads without requiring additional capacity.

**Related:** OPS03-BP06, OPS09-BP04, OPS10-BP01, OPS10-BP07

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/operational-excellence-pillar/ops_org_culture_team_res_appro.html>

### OPS04-BP01: Identify key performance indicators

**Risk:** HIGH
**Areas:** Prepare, Implement observability

Implementing observability in your workload starts with understanding its state and making data-driven decisions based on business requirements. One of the most effective ways to ensure alignment between monitoring activities and business objectives is by defining and monitoring key performance indicators (KPIs).

**Related:** OPS04-BP02, OPS04-BP03, OPS04-BP04, OPS04-BP05

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/operational-excellence-pillar/ops_observability_identify_kpis.html>

### OPS04-BP02: Implement application telemetry

**Risk:** HIGH
**Areas:** Prepare, Implement observability

Application telemetry serves as the foundation for observability of your workload. It's crucial to emit telemetry that offers actionable insights into the state of your application and the achievement of both technical and business outcomes. From troubleshooting to measuring the impact of a new feature or ensuring alignment with business key performance indicators (KPIs), application telemetry informs the way you build, operate, and evolve your workload.

**Related:** OPS04-BP01, OPS04-BP03, OPS04-BP04, OPS04-BP05

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/operational-excellence-pillar/ops_observability_application_telemetry.html>

### OPS04-BP03: Implement user experience telemetry

**Risk:** HIGH
**Areas:** Prepare, Implement observability

Gaining deep insights into customer experiences and interactions with your application is crucial. Real user monitoring (RUM) and synthetic transactions serve as powerful tools for this purpose. RUM provides data about real user interactions granting an unfiltered perspective of user satisfaction, while synthetic transactions simulate user interactions, helping in detecting potential issues even before they impact real users.

**Related:** OPS04-BP01, OPS04-BP02, OPS04-BP04, OPS04-BP05

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/operational-excellence-pillar/ops_observability_customer_telemetry.html>

### OPS04-BP04: Implement dependency telemetry

**Risk:** HIGH
**Areas:** Prepare, Implement observability

Dependency telemetry is essential for monitoring the health and performance of the external services and components your workload relies on. It provides valuable insights into reachability, timeouts, and other critical events related to dependencies such as DNS, databases, or third-party APIs. When you instrument your application to emit metrics, logs, and traces about these dependencies, you gain a clearer understanding of potential bottlenecks, performance issues, or failures that might impact your workload.

**Related:** OPS04-BP01, OPS04-BP02, OPS04-BP03, OPS04-BP05, OPS08-BP04

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/operational-excellence-pillar/ops_observability_dependency_telemetry.html>

### OPS04-BP05: Implement distributed tracing

**Risk:** HIGH
**Areas:** Prepare, Implement observability

Distributed tracing offers a way to monitor and visualize requests as they traverse through various components of a distributed system. By capturing trace data from multiple sources and analyzing it in a unified view, teams can better understand how requests flow, where bottlenecks exist, and where optimization efforts should focus.

**Related:** OPS04-BP01, OPS04-BP02, OPS04-BP03, OPS04-BP04

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/operational-excellence-pillar/ops_observability_dist_trace.html>

### OPS05-BP01: Use version control

**Risk:** HIGH
**Areas:** Prepare, Design for operations

Use version control to activate tracking of changes and releases.

**Related:** OPS05-BP04

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/operational-excellence-pillar/ops_dev_integ_version_control.html>

### OPS05-BP02: Test and validate changes

**Risk:** HIGH
**Areas:** Prepare, Design for operations

Every change deployed must be tested to avoid errors in production. This best practice is focused on testing changes from version control to artifact build. Besides application code changes, testing should include infrastructure, configuration, security controls, and operations procedures. Testing takes many forms, from unit tests to software component analysis (SCA). Move tests further to the left in the software integration and delivery process results in higher certainty of artifact quality.

**Related:** OPS05-BP01, OPS05-BP06, OPS05-BP07, OPS05-BP10

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/operational-excellence-pillar/ops_dev_integ_test_val_chg.html>

### OPS05-BP03: Use configuration management systems

**Risk:** MEDIUM
**Areas:** Prepare, Design for operations

Use configuration management systems to make and track configuration changes. These systems reduce errors caused by manual processes and reduce the level of effort to deploy changes.

**Related:** OPS06-BP01, OPS06-BP02, OPS06-BP03, OPS06-BP04

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/operational-excellence-pillar/ops_dev_integ_conf_mgmt_sys.html>

### OPS05-BP04: Use build and deployment management systems

**Risk:** MEDIUM
**Areas:** Prepare, Design for operations

Use build and deployment management systems. These systems reduce errors caused by manual processes and reduce the level of effort to deploy changes.

**Related:** OPS06-BP04

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/operational-excellence-pillar/ops_dev_integ_build_mgmt_sys.html>

### OPS05-BP05: Perform patch management

**Risk:** MEDIUM
**Areas:** Prepare, Design for operations

Perform patch management to gain features, address issues, and remain compliant with governance. Automate patch management to reduce errors caused by manual processes, scale, and reduce the level of effort to patch.

**Related:** OPS06-BP04

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/operational-excellence-pillar/ops_dev_integ_patch_mgmt.html>

### OPS05-BP06: Share design standards

**Risk:** MEDIUM
**Areas:** Prepare, Design for operations

Share best practices across teams to increase awareness and maximize the benefits of development efforts. Document them and keep them up to date as your architecture evolves. If shared standards are enforced in your organization, it’s critical that mechanisms exist to request additions, changes, and exceptions to standards. Without this option, standards become a constraint on innovation.

**Related:** OPS01-BP03, OPS01-BP04, OPS07-BP02, OPS11-BP01, OPS11-BP04

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/operational-excellence-pillar/ops_dev_integ_share_design_stds.html>

### OPS05-BP07: Implement practices to improve code quality

**Risk:** MEDIUM
**Areas:** Prepare, Design for operations

Implement practices to improve code quality and minimize defects. Some examples include test-driven development, code reviews, standards adoption, and pair programming. Incorporate these practices into your continuous integration and delivery process.

**Related:** OPS05-BP02, OPS05-BP06

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/operational-excellence-pillar/ops_dev_integ_code_quality.html>

### OPS05-BP08: Use multiple environments

**Risk:** MEDIUM
**Areas:** Prepare, Design for operations

Use multiple environments to experiment, develop, and test your workload. Use increasing levels of controls as environments approach production to gain confidence your workload operates as intended when deployed.

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/operational-excellence-pillar/ops_dev_integ_multi_env.html>

### OPS05-BP09: Make frequent, small, reversible changes

**Risk:** LOW
**Areas:** Prepare, Design for operations

Frequent, small, and reversible changes reduce the scope and impact of a change. When used in conjunction with change management systems, configuration management systems, and build and delivery systems frequent, small, and reversible changes reduce the scope and impact of a change. This results in more effective troubleshooting and faster remediation with the option to roll back changes.

**Related:** OPS05-BP03, OPS05-BP04, OPS06-BP04

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/operational-excellence-pillar/ops_dev_integ_freq_sm_rev_chg.html>

### OPS05-BP10: Fully automate integration and deployment

**Risk:** LOW
**Areas:** Prepare, Design for operations

Automate build, deployment, and testing of the workload. This reduces errors caused by manual processes and reduces the effort to deploy changes.

**Related:** OPS05-BP03, OPS05-BP04

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/operational-excellence-pillar/ops_dev_integ_auto_integ_deploy.html>

### OPS06-BP01: Plan for unsuccessful changes

**Risk:** HIGH
**Areas:** Prepare, Mitigate deployment risks

Plan to revert to a known good state, or remediate in the production environment if the deployment causes an undesired outcome. Having a policy to establish such a plan helps all teams develop strategies to recover from failed changes. Some example strategies are deployment and rollback steps, change policies, feature flags, traffic isolation, and traffic shifting. A single release may include multiple related component changes. The strategy should provide the ability to withstand or recover from a failure of any component change.

**Related:** OPS06-BP04

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/operational-excellence-pillar/ops_mit_deploy_risks_plan_for_unsucessful_changes.html>

### OPS06-BP02: Test deployments

**Risk:** HIGH
**Areas:** Prepare, Mitigate deployment risks

Test release procedures in pre-production by using the same deployment configuration, security controls, steps, and procedures as in production. Validate that all deployed steps are completed as expected, such as inspecting files, configurations, and services. Further test all changes with functional, integration, and load tests, along with any monitoring such as health checks. By doing these tests, you can identify deployment issues early with an opportunity to plan and mitigate them prior to production.

**Related:** OPS05-BP02

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/operational-excellence-pillar/ops_mit_deploy_risks_test_val_chg.html>

### OPS06-BP03: Employ safe deployment strategies

**Risk:** MEDIUM
**Areas:** Prepare, Mitigate deployment risks

Safe production roll-outs control the flow of beneficial changes with an aim to minimize any perceived impact for customers from those changes. The safety controls provide inspection mechanisms to validate desired outcomes and limit the scope of impact from any defects introduced by the changes or from deployment failures. Safe roll-outs may include strategies such as feature-flags, one-box, rolling (canary releases), immutable, traffic splitting, and blue/green deployments.

**Related:** OPS05-BP02, OPS05-BP09, OPS05-BP10

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/operational-excellence-pillar/ops_mit_deploy_risks_deploy_mgmt_sys.html>

### OPS06-BP04: Automate testing and rollback

**Risk:** MEDIUM
**Areas:** Prepare, Mitigate deployment risks

To increase the speed, reliability, and confidence of your deployment process, have a strategy for automated testing and rollback capabilities in pre-production and production environments. Automate testing when deploying to production to simulate human and system interactions that verify the changes being deployed. Automate rollback to revert back to a previous known good state quickly. The rollback should be initiated automatically on pre-defined conditions such as when the desired outcome of your change is not achieved or when the automated test fails. Automating these two activities improves your success rate for your deployments, minimizes recovery time, and reduces the potential impact to the business.

**Related:** OPS06-BP01, OPS06-BP02

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/operational-excellence-pillar/ops_mit_deploy_risks_auto_testing_and_rollback.html>

### OPS07-BP01: Ensure personnel capability

**Risk:** HIGH
**Areas:** Prepare, Operational readiness and change management

Have a mechanism to validate that you have the appropriate number of trained personnel to support the workload. They must be trained on the platform and services that make up your workload. Provide them with the knowledge necessary to operate the workload. You must have enough trained personnel to support the normal operation of the workload and troubleshoot any incidents that occur. Have enough personnel so that you can rotate during on-call and vacations to avoid burnout.

**Related:** OPS11-BP04

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/operational-excellence-pillar/ops_ready_to_support_personnel_capability.html>

### OPS07-BP02: Ensure a consistent review of operational readiness

**Risk:** HIGH
**Areas:** Prepare, Operational readiness and change management

Use Operational Readiness Reviews (ORRs) to validate that you can operate your workload. ORR is a mechanism developed at Amazon to validate that teams can safely operate their workloads. An ORR is a review and inspection process using a checklist of requirements. An ORR is a self-service experience that teams use to certify their workloads. ORRs include best practices from lessons learned from our years of building software.

**Related:** OPS01-BP03, OPS01-BP04, OPS03-BP07, OPS06-BP01, OPS07-BP01, SEC01-BP03, REL13-BP01, COST02-BP01

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/operational-excellence-pillar/ops_ready_to_support_const_orr.html>

### OPS07-BP03: Use runbooks to perform procedures

**Risk:** MEDIUM
**Areas:** Prepare, Operational readiness and change management

A runbook is a documented process to achieve a specific outcome. Runbooks consist of a series of steps that someone follows to get something done. Runbooks have been used in operations going back to the early days of aviation. In cloud operations, we use runbooks to reduce risk and achieve desired outcomes. At its simplest, a runbook is a checklist to complete a task.

**Related:** OPS02-BP02, OPS07-BP04, OPS10-BP01, OPS10-BP02, OPS11-BP04

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/operational-excellence-pillar/ops_ready_to_support_use_runbooks.html>

### OPS07-BP04: Use playbooks to investigate issues

**Risk:** MEDIUM
**Areas:** Prepare, Operational readiness and change management

Playbooks are step-by-step guides used to investigate an incident. When incidents happen, playbooks are used to investigate, scope impact, and identify a root cause. Playbooks are used for a variety of scenarios, from failed deployments to security incidents. In many cases, playbooks identify the root cause that a runbook is used to mitigate. Playbooks are an essential component of your organization's incident response plans.

**Related:** OPS02-BP02, OPS07-BP03, OPS10-BP01, OPS10-BP02, OPS11-BP04

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/operational-excellence-pillar/ops_ready_to_support_use_playbooks.html>

### OPS07-BP05: Make informed decisions to deploy systems and changes

**Risk:** LOW
**Areas:** Prepare, Operational readiness and change management

Have processes in place for successful and unsuccessful changes to your workload. A pre-mortem is an exercise where a team simulates a failure to develop mitigation strategies. Use pre-mortems to anticipate failure and create procedures where appropriate. Evaluate the benefits and risks of deploying changes to your workload. Verify that all changes comply with governance.

**Related:** OPS01-BP03, OPS06-BP01, OPS06-BP02, OPS07-BP01

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/operational-excellence-pillar/ops_ready_to_support_informed_deploy_decisions.html>

### OPS07-BP06: Create support plans for production workloads

**Risk:** LOW
**Areas:** Prepare, Operational readiness and change management

Enable support for any software and services that your production workload relies on. Select an appropriate support level to meet your production service-level needs. Support plans for these dependencies are necessary in case there is a service disruption or software issue. Document support plans and how to request support for all service and software vendors. Implement mechanisms that verify that support points of contacts are kept up to date.

**Related:** OPS02-BP02

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/operational-excellence-pillar/ops_ready_to_support_enable_support_plans.html>

### OPS08-BP01: Analyze workload metrics

**Risk:** MEDIUM
**Areas:** Operate, Utilizing workload observability

After implementing application telemetry, regularly analyze the collected metrics. While latency, requests, errors, and capacity (or quotas) provide insights into system performance, it's vital to prioritize the review of business outcome metrics. This ensures you're making data-driven decisions aligned with your business objectives.

**Related:** OPS02-BP02

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/operational-excellence-pillar/ops_workload_observability_analyze_workload_metrics.html>

### OPS08-BP02: Analyze workload logs

**Risk:** MEDIUM
**Areas:** Operate, Utilizing workload observability

Regularly analyzing workload logs is essential for gaining a deeper understanding of the operational aspects of your application. By efficiently sifting through, visualizing, and interpreting log data, you can continually optimize application performance and security.

**Related:** OPS04-BP01, OPS04-BP02, OPS08-BP01

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/operational-excellence-pillar/ops_workload_observability_analyze_workload_logs.html>

### OPS08-BP03: Analyze workload traces

**Risk:** MEDIUM
**Areas:** Operate, Utilizing workload observability

Analyzing trace data is crucial for achieving a comprehensive view of an application's operational journey. By visualizing and understanding the interactions between various components, performance can be fine-tuned, bottlenecks identified, and user experiences enhanced.

**Related:** OPS08-BP01, OPS08-BP02

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/operational-excellence-pillar/ops_workload_observability_analyze_workload_traces.html>

### OPS08-BP04: Create actionable alerts

**Risk:** HIGH
**Areas:** Operate, Utilizing workload observability

Promptly detecting and responding to deviations in your application's behavior is crucial. Especially vital is recognizing when outcomes based on key performance indicators (KPIs) are at risk or when unexpected anomalies arise. Basing alerts on KPIs ensures that the signals you receive are directly tied to business or operational impact. This approach to actionable alerts promotes proactive responses and helps maintain system performance and reliability.

**Related:** OPS04-BP01, OPS04-BP02, OPS04-BP03, OPS04-BP04, OPS04-BP05, OPS08-BP01, OPS08-BP02, OPS08-BP03

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/operational-excellence-pillar/ops_workload_observability_create_alerts.html>

### OPS08-BP05: Create dashboards

**Risk:** MEDIUM
**Areas:** Operate, Utilizing workload observability

Dashboards are the human-centric view into the telemetry data of your workloads. While they provide a vital visual interface, they should not replace alerting mechanisms, but complement them. When crafted with care, not only can they offer rapid insights into system health and performance, but they can also present stakeholders with real-time information on business outcomes and the impact of issues.

**Related:** OPS04-BP01, OPS08-BP01, OPS08-BP02, OPS08-BP03, OPS08-BP04

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/operational-excellence-pillar/ops_workload_observability_create_dashboards.html>

### OPS09-BP01: Measure operations goals and KPIs with metrics

**Risk:** MEDIUM
**Areas:** Operate, Understanding operational health

Obtain goals and KPIs that define operations success from your organization and determine that metrics reflect these. Set baselines as a point of reference and reevaluate regularly. Develop mechanisms to collect these metrics from teams for evaluation. The DevOps Research and Assessment (DORA) metrics provide a popular method to measure progress towards DevOps practices of software delivery.

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/operational-excellence-pillar/ops_operations_health_measure_ops_goals_kpis.html>

### OPS09-BP02: Communicate status and trends to ensure visibility into operation

**Risk:** MEDIUM
**Areas:** Operate, Understanding operational health

Knowing the state of your operations and its trending direction is necessary to identify when outcomes may be at risk, whether or not added work can be supported, or the effects that changes have had to your teams. During operations events, having status pages that users and operations teams can refer to for information can reduce pressure on communication channels and disseminate information proactively.

**Related:** OPS09-BP01

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/operational-excellence-pillar/ops_operations_health_communicate_status_trends.html>

### OPS09-BP03: Review operations metrics and prioritize improvement

**Risk:** MEDIUM
**Areas:** Operate, Understanding operational health

Setting aside dedicated time and resources for reviewing the state of operations ensures that serving the day-to-day line of business remains a priority. Pull together operations leaders and stakeholders to regularly review metrics, reaffirm or modify goals and objectives, and prioritize improvements.

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/operational-excellence-pillar/ops_operations_health_review_ops_metrics_prioritize_improvement.html>

### OPS10-BP01: Use a process for event, incident, and problem management

**Risk:** HIGH
**Areas:** Operate, Responding to events

The ability to efficiently manage events, incidents, and problems is key to maintaining workload health and performance. It's crucial to recognize and understand the differences between these elements to develop an effective response and resolution strategy. Establishing and following a well-defined process for each aspect helps your team swiftly and effectively handle any operational challenges that arise.

**Related:** OPS04-BP01, OPS04-BP02, OPS07-BP03, OPS07-BP04, OPS08-BP01, OPS11-BP02

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/operational-excellence-pillar/ops_event_response_event_incident_problem_process.html>

### OPS10-BP02: Have a process per alert

**Risk:** HIGH
**Areas:** Operate, Responding to events

Establishing a clear and defined process for each alert in your system is essential for effective and efficient incident management. This practice ensures that every alert leads to a specific, actionable response, improving the reliability and responsiveness of your operations.

**Related:** OPS04-BP01, OPS04-BP04

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/operational-excellence-pillar/ops_event_response_process_per_alert.html>

### OPS10-BP03: Prioritize operational events based on business impact

**Risk:** HIGH
**Areas:** Operate, Responding to events

Responding promptly to operational events is critical, but not all events are equal. When you prioritize based on business impact, you also prioritize addressing events with the potential for significant consequences, such as safety, financial loss, regulatory violations, or damage to reputation.

**Related:** OPS03-BP03, OPS08-BP04, OPS09-BP01

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/operational-excellence-pillar/ops_event_response_prioritize_events.html>

### OPS10-BP04: Define escalation paths

**Risk:** MEDIUM
**Areas:** Operate, Responding to events

Establish clear escalation paths within your incident response protocols to facilitate timely and effective action. This includes specifying prompts for escalation, detailing the escalation process, and pre-approving actions to expedite decision-making and reduce mean time to resolution (MTTR).

**Related:** OPS08-BP04, OPS10-BP02, OPS11-BP02

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/operational-excellence-pillar/ops_event_response_define_escalation_paths.html>

### OPS10-BP05: Define a customer communication plan for service-impacting events

**Risk:** MEDIUM
**Areas:** Operate, Responding to events

Effective communication during service impacting events is critical to maintain trust and transparency with customers. A well-defined communication plan helps your organization quickly and clearly share information, both internally and externally, during incidents.

**Related:** OPS07-BP03, OPS10-BP06, OPS11-BP02

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/operational-excellence-pillar/ops_event_response_push_notify.html>

### OPS10-BP06: Communicate status through dashboards

**Risk:** MEDIUM
**Areas:** Operate, Responding to events

Use dashboards as a strategic tool to convey real-time operational status and key metrics to different audiences, including internal technical teams, leadership, and customers. These dashboards offer a centralized, visual representation of system health and business performance, enhancing transparency and decision-making efficiency.

**Related:** OPS08-BP05

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/operational-excellence-pillar/ops_event_response_dashboards.html>

### OPS10-BP07: Automate responses to events

**Risk:** MEDIUM
**Areas:** Operate, Responding to events

Automating event responses is key for fast, consistent, and error-free operational handling. Create streamlined processes and use tools to automatically manage and respond to events, minimizing manual interventions and enhancing operational effectiveness.

**Related:** OPS08-BP04, OPS10-BP02

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/operational-excellence-pillar/ops_event_response_auto_event_response.html>

### OPS11-BP01: Have a process for continuous improvement

**Risk:** HIGH
**Areas:** Evolve, Learn, share, and improve

Evaluate your workload against internal and external architecture best practices. Conduct frequent, intentional workload reviews. Prioritize improvement opportunities into your software development cadence.

**Related:** OPS11-BP02, OPS11-BP08, OPS04

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/operational-excellence-pillar/ops_evolve_ops_process_cont_imp.html>

### OPS11-BP02: Perform post-incident analysis

**Risk:** HIGH
**Areas:** Evolve, Learn, share, and improve

Review customer-impacting events and identify the contributing factors and preventative actions. Use this information to develop mitigations to limit or prevent recurrence. Develop procedures for prompt and effective responses. Communicate contributing factors and corrective actions as appropriate, tailored to target audiences.

**Related:** OPS11-BP01, OPS04

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/operational-excellence-pillar/ops_evolve_ops_perform_rca_process.html>

### OPS11-BP03: Implement feedback loops

**Risk:** HIGH
**Areas:** Evolve, Learn, share, and improve

Feedback loops provide actionable insights that drive decision making. Build feedback loops into your procedures and workloads. This helps you identify issues and areas that need improvement. They also validate investments made in improvements. These feedback loops are the foundation for continuously improving your workload.

**Related:** OPS01-BP01, OPS01-BP02, OPS11-BP02, OPS11-BP07

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/operational-excellence-pillar/ops_evolve_ops_feedback_loops.html>

### OPS11-BP04: Perform knowledge management

**Risk:** HIGH
**Areas:** Evolve, Learn, share, and improve

Knowledge management helps team members find the information to perform their job. In learning organizations, information is freely shared which empowers individuals. The information can be discovered or searched. Information is accurate and up to date. Mechanisms exist to create new information, update existing information, and archive outdated information. The most common example of a knowledge management platform is a content management system like a wiki.

**Related:** OPS11-BP08

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/operational-excellence-pillar/ops_evolve_ops_knowledge_management.html>

### OPS11-BP05: Define drivers for improvement

**Risk:** MEDIUM
**Areas:** Evolve, Learn, share, and improve

Identify drivers for improvement to help you evaluate and prioritize opportunities based on data and feedback loops. Explore improvement opportunities in your systems and processes, and automate where appropriate.

**Related:** OPS01, OPS02, OPS04-BP01, OPS08, OPS09, OPS11-BP03

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/operational-excellence-pillar/ops_evolve_ops_drivers_for_imp.html>

### OPS11-BP06: Validate insights

**Risk:** MEDIUM
**Areas:** Evolve, Learn, share, and improve

Review your analysis results and responses with cross-functional teams and business owners. Use these reviews to establish common understanding, identify additional impacts, and determine courses of action. Adjust responses as appropriate.

**Related:** OPS01-BP06, OPS02-BP06, OPS11-BP03

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/operational-excellence-pillar/ops_evolve_ops_validate_insights.html>

### OPS11-BP07: Perform operations metrics reviews

**Risk:** MEDIUM
**Areas:** Evolve, Learn, share, and improve

Regularly perform retrospective analysis of operations metrics with cross-team participants from different areas of the business. Use these reviews to identify opportunities for improvement, potential courses of action, and to share lessons learned. Look for opportunities to improve in all of your environments (for example, development, test, and production).

**Related:** OPS08-BP05, OPS09-BP03, OPS10-BP01

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/operational-excellence-pillar/ops_evolve_ops_metrics_review.html>

### OPS11-BP08: Document and share lessons learned

**Risk:** LOW
**Areas:** Evolve, Learn, share, and improve

Document and share lessons learned from the operations activities so that you can use them internally and across teams. You should share what your teams learn to increase the benefit across your organization. Share information and resources to prevent avoidable errors and ease development efforts, and focus on delivery of desired features.

**Related:** OPS02-BP06, OPS05-BP01, OPS05-BP06, OPS11-BP03, OPS11-BP07

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/operational-excellence-pillar/ops_evolve_ops_share_lessons_learned.html>

### OPS11-BP09: Allocate time to make improvements

**Risk:** LOW
**Areas:** Evolve, Learn, share, and improve

Dedicate time and resources within your processes to make continuous incremental improvements possible.

**Related:** OPS05-BP08

**Docs:** <https://docs.aws.amazon.com/wellarchitected/latest/operational-excellence-pillar/ops_evolve_ops_allocate_time_for_imp.html>
