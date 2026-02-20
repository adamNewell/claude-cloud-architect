# Container Build Lens Best Practices

Best practices for containerized applications.

## Contents

- [Container Build Lens Best Practices](#container-build-lens-best-practices)
  - [Contents](#contents)
  - [COST\_OPTIMIZATION](#cost_optimization)
  - [OPERATIONAL\_EXCELLENCE](#operational_excellence)
  - [PERFORMANCE\_EFFICIENCY](#performance_efficiency)
  - [RELIABILITY](#reliability)
  - [SECURITY](#security)
  - [SUSTAINABILITY](#sustainability)

## COST_OPTIMIZATION

| ID              | Title                                                                                | Risk   |
| :-------------- | :----------------------------------------------------------------------------------- | :----- |
| CBLDCOST01-BP01 | Delete old container images to save costs                                            | MEDIUM |
| CBLDCOST02-BP01 | Minimize unnecessary application dependencies                                        | MEDIUM |
| CBLDCOST02-BP02 | Build common container image dependencies into parent images                         | MEDIUM |
| CBLDCOST03-BP01 | Ensure container images contain only what is relevant for your application to run    | MEDIUM |
| CBLDCOST03-BP02 | Optimize storage requirements for containers                                         | MEDIUM |
| CBLDCOST04-BP01 | Reduce container image layers by concatenating commands                              | MEDIUM |
| CBLDCOST04-BP02 | Use techniques to reduce container image size                                        | MEDIUM |
| CBLDCOST05-BP01 | Design containerized applications to handle SIGTERM signals for graceful termination | MEDIUM |
| CBLDCOST06-BP01 | Support multiple CPU architectures for cost optimization                             | LOW    |
| CBLDCOST07-BP01 | Minimize startup time by including dependencies in the build process                 | MEDIUM |
| CBLDCOST08-BP01 | Use managed build services to reduce operational costs                               | MEDIUM |

## OPERATIONAL_EXCELLENCE

| ID             | Title                                                                                       | Risk   |
| :------------- | :------------------------------------------------------------------------------------------ | :----- |
| CBLDOPS02-BP01 | Implement health checks to determine container state                                        | HIGH   |
| CBLDOPS02-BP02 | Have your logs available outside the running container                                      | HIGH   |
| CBLDOPS01-BP01 | Understand the lineage of your container image                                              | MEDIUM |
| CBLDOPS01-BP02 | Have parity between your deployment environments                                            | MEDIUM |
| CBLDOPS01-BP03 | Build the image once and use the same image in all environments                             | MEDIUM |
| CBLDOPS01-BP04 | Use a CI/CD build process                                                                   | MEDIUM |
| CBLDOPS01-BP05 | Use multi-stage builds                                                                      | MEDIUM |
| CBLDOPS01-BP06 | Implement a minimal container image design to achieve your business and security objectives | MEDIUM |
| CBLDOPS01-BP07 | Use package managers to deploy your containerized applications                              | LOW    |

## PERFORMANCE_EFFICIENCY

| ID             | Title                                                         | Risk   |
| :------------- | :------------------------------------------------------------ | :----- |
| CBLDPER01-BP01 | Use small parent images                                       | MEDIUM |
| CBLDPER01-BP02 | Run a single process per container                            | MEDIUM |
| CBLDPER01-BP03 | Exclude files from your build process using .dockerignore     | LOW    |
| CBLDPER01-BP04 | Use a container registry close to your cluster                | MEDIUM |
| CBLDPER02-BP01 | Avoid using the 'latest' tag for parent images                | MEDIUM |
| CBLDPER02-BP02 | Implement a notification mechanism for updated parent images  | LOW    |
| CBLDPER03-BP01 | Implement an automated performance testing strategy           | MEDIUM |
| CBLDPER04-BP01 | Use caching during build                                      | MEDIUM |
| CBLDPER04-BP02 | Use the CPU architecture with best price to performance ratio | LOW    |

## RELIABILITY

| ID             | Title                                                                     | Risk   |
| :------------- | :------------------------------------------------------------------------ | :----- |
| CBLDREL01-BP01 | Use RAM and CPU limits                                                    | HIGH   |
| CBLDREL02-BP01 | Use volumes to persist data                                               | HIGH   |
| CBLDREL04-BP01 | Plan for health checks in all container builds and deployments            | HIGH   |
| CBLDREL02-BP02 | Create local testing processes                                            | MEDIUM |
| CBLDREL02-BP03 | Design your testing environments to support your container build pipeline | MEDIUM |
| CBLDREL03-BP01 | Create a standardized parent image                                        | MEDIUM |
| CBLDREL03-BP02 | Use an image hierarchy approach                                           | MEDIUM |
| CBLDREL03-BP03 | Use source control and tagging on all container images                    | MEDIUM |

## SECURITY

| ID             | Title                                                                | Risk   |
| :------------- | :------------------------------------------------------------------- | :----- |
| CBLDSEC01-BP01 | Ensure that your container images are using least privilege identity | HIGH   |
| CBLDSEC01-BP02 | Limit administrator access to build infrastructure (CI pipeline)     | HIGH   |
| CBLDSEC02-BP01 | Ensure that your images are scanned for vulnerabilities              | HIGH   |
| CBLDSEC03-BP01 | Minimize attack surface                                              | HIGH   |
| CBLDSEC03-BP02 | Understand the lineage of your container image                       | HIGH   |
| CBLDSEC04-BP01 | Do not hardcode sensitive data into your container image             | HIGH   |
| CBLDSEC04-BP02 | Ensure that persistent data is stored outside of the container       | MEDIUM |

## SUSTAINABILITY

| ID             | Title                                                                         | Risk   |
| :------------- | :---------------------------------------------------------------------------- | :----- |
| CBLDSUS01-BP01 | Keep build manifests up-to-date and aligned with application needs            | MEDIUM |
| CBLDSUS02-BP01 | Support containerized applications to run on energy-efficient hardware        | MEDIUM |
| CBLDSUS03-BP01 | Use dynamically created build servers for building containerized workloads    | MEDIUM |
| CBLDSUS03-BP02 | Use pre-defined or built runtimes to reduce build time and reuse dependencies | LOW    |
| CBLDSUS03-BP03 | Update parent and base images regularly                                       | LOW    |
| CBLDSUS03-BP04 | Delete unused or obsolete container images                                    | MEDIUM |
