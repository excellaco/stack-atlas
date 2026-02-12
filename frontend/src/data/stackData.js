export const categories = [
  {
    id: "ai-ml",
    name: "AI & ML",
    description: "Modeling, language AI, and applied ML workflows.",
    color: "#0f766e",
  },
  {
    id: "data-analytics",
    name: "Data & Analytics",
    description: "Data stores, pipelines, and business intelligence.",
    color: "#2563eb",
  },
  {
    id: "cloud-infra",
    name: "Cloud & Infrastructure",
    description: "Cloud services, compute, and foundational platforms.",
    color: "#0ea5e9",
  },
  {
    id: "devops",
    name: "DevOps & Platform",
    description: "CI/CD, developer platforms, and delivery tooling.",
    color: "#f97316",
  },
  {
    id: "security",
    name: "Security & Compliance",
    description: "Security controls, scanning, and compliance tooling.",
    color: "#dc2626",
  },
  {
    id: "identity",
    name: "Identity & Access",
    description: "SSO, IAM, and access control patterns.",
    color: "#7c3aed",
  },
  {
    id: "frontend",
    name: "Frontend & UX",
    description: "User-facing frameworks, design systems, and UI tech.",
    color: "#10b981",
  },
  {
    id: "backend",
    name: "Backend & Runtime",
    description: "Languages, runtimes, and service-layer concerns.",
    color: "#6b7280",
  },
  {
    id: "integration",
    name: "Integration & Messaging",
    description: "API management, queues, and streaming.",
    color: "#f43f5e",
  },
  {
    id: "testing",
    name: "Testing & Quality",
    description: "Quality practices and testing frameworks.",
    color: "#16a34a",
  },
  {
    id: "observability",
    name: "Monitoring & Observability",
    description: "Metrics, logs, dashboards, and runtime insight.",
    color: "#f59e0b",
  },
  {
    id: "collaboration",
    name: "Collaboration & Work Management",
    description: "Work tracking and team collaboration platforms.",
    color: "#1d4ed8",
  },
  {
    id: "architecture",
    name: "Architecture & Delivery Practices",
    description: "System patterns and delivery methodologies.",
    color: "#0f172a",
  },
  {
    id: "ide",
    name: "IDE & Developer Tools",
    description: "Developer workspaces and specialized IDEs.",
    color: "#64748b",
  },
];

export const types = [
  "Capability",
  "Technique",
  "Pattern",
  "Practice",
  "Methodology",
  "Language",
  "Framework",
  "Library",
  "Tool",
  "Service",
  "Platform",
  "DataStore",
  "Runtime",
  "Standard",
  "Test Type",
];

const categoryTags = {
  "ai-ml": ["ai", "ml"],
  "data-analytics": ["data", "analytics"],
  "cloud-infra": ["cloud", "infrastructure"],
  devops: ["devops", "delivery"],
  security: ["security", "compliance"],
  identity: ["identity", "access"],
  frontend: ["frontend", "ux"],
  backend: ["backend", "services"],
  integration: ["integration", "messaging"],
  testing: ["testing", "quality"],
  observability: ["observability", "monitoring"],
  collaboration: ["collaboration", "work-management"],
  architecture: ["architecture", "delivery"],
  ide: ["developer-tools"],
};

const buildTags = (item) => {
  const tags = new Set(item.tags || []);

  const usageTags = categoryTags[item.category] || [];
  usageTags.forEach((tag) => tags.add(tag));

  if (item.id.startsWith("aws-")) tags.add("aws");
  if (item.id.startsWith("azure-") || item.id.startsWith("microsoft-")) tags.add("azure");
  if (item.id.startsWith("gcp-")) tags.add("gcp");

  return Array.from(tags).sort((a, b) => a.localeCompare(b));
};

export const descriptionById = {
  dnn: "Multi-layer neural architectures for learning complex patterns; used for NLP, vision, and anomaly detection workloads.",
  nlp: "Field focused on extracting meaning from text and speech; used for document classification, search, and summarization.",
  ner: "Sequence labeling approach that identifies people, places, and organizations in text; used in document extraction and knowledge graph building.",
  "topic-modeling":
    "Unsupervised method that groups documents into latent themes; used for corpus exploration and reporting.",
  embeddings:
    "Vector representations of text that capture semantic similarity; used for search, clustering, and retrieval.",
  "contextual-embeddings":
    "Embedding approach that varies vector meaning by surrounding words; used for higher-quality semantic matching.",
  pca: "Linear dimensionality reduction technique for projecting data into fewer components; used for feature reduction and exploratory analysis.",
  "supervised-learning":
    "Modeling approach that learns from labeled examples; used for classification and regression in operational analytics.",
  "fraud-classification":
    "Predictive scoring of transactions or claims to flag risk; used for program integrity monitoring.",
  "anomaly-detection":
    "Methods that identify outliers or unusual behavior; used for fraud, security, and data quality monitoring.",
  "gradient-boosting":
    "Ensemble method that builds additive decision trees; used for high-performing tabular models.",
  "random-forest":
    "Bagged decision-tree ensemble for robust classification and regression; used on structured datasets.",
  genai:
    "Modeling paradigm that generates new text, images, or code; used for summarization, drafting, and assistance pilots.",
  llms: "Large transformer models for text generation and reasoning; used for chat, summarization, and extraction tasks.",
  "llm-workflow":
    "Operational pattern that chains retrieval, prompts, and safety checks; used to integrate language models into business processes.",
  "zero-shot-learning":
    "Inference approach that predicts labels without task-specific training data; used for rapid text triage.",
  "gpt-architecture":
    "Autoregressive transformer design that predicts next tokens; used for generative text systems.",
  "custom-transformer":
    "Tailored attention-based model architectures; used when domain data or constraints require bespoke models.",
  "distributed-gpu-training":
    "Parallel training across multiple GPUs or nodes; used for large model training and fine-tuning.",
  mlops:
    "Operational discipline for deploying, monitoring, and versioning models; used to keep ML in production stable and compliant.",
  "llm-detection":
    "Techniques that identify AI-generated text; used for policy enforcement and content provenance checks.",
  pytorch:
    "Open-source deep learning framework with dynamic graphs; used for research and production training.",
  tensorflow:
    "Open-source ML framework for training and serving models at scale; used in production pipelines.",
  "scikit-learn":
    "Python machine-learning toolkit for classical algorithms; used for baselines and tabular models.",
  xgboost:
    "Gradient-boosted tree library optimized for performance; used for structured data scoring.",
  spacy:
    "Industrial NLP library with pipelines and models; used for entity extraction and text processing.",
  "gensim-word2vec":
    "Library for training word vectors from large corpora; used to build embeddings for similarity tasks.",
  faiss:
    "Vector similarity search library for nearest-neighbor queries; used for semantic search and retrieval.",
  "hugging-face":
    "Model hub and tooling ecosystem for sharing and deploying ML models; used for rapid prototyping and evaluation.",
  mlflow:
    "Model lifecycle tracking and registry tool; used for experiment tracking and deployment governance.",
  "aws-sagemaker":
    "Managed platform for training, tuning, and hosting ML models; used for scalable ML operations in regulated environments.",
  "aws-sagemaker-studio":
    "Browser-based IDE for notebooks and ML workflows; used by data scientists for experiment work.",
  "aws-sagemaker-pipelines":
    "Managed pipeline orchestration for ML workflows; used for repeatable training and deployment.",
  "aws-bedrock":
    "Managed foundation-model service with vetted providers; used to access LLMs without hosting infrastructure.",
  "anthropic-claude":
    "Large language model from Anthropic; used for summarization, analysis, and drafting tasks.",
  "titan-embeddings":
    "Foundation embedding model for text similarity; used for semantic search and retrieval.",
  "aws-textract":
    "OCR service for extracting text and forms from documents; used for intake automation.",
  "aws-comprehend":
    "Managed NLP service for entities, sentiment, and classification; used for document analytics.",
  sql: "Declarative query language for relational data; used for reporting, analytics, and ETL.",
  parquet:
    "Columnar storage format optimized for analytics; used in data lakes and distributed processing.",
  pandas:
    "Python data analysis library for tabular manipulation; used for data prep and analysis scripts.",
  postgres:
    "Open-source relational database with strong SQL support; used for transactional and reporting workloads.",
  redis:
    "In-memory key-value store for caching and queues; used for session storage and fast lookups.",
  snowflake:
    "Cloud data warehouse with separate compute and storage; used for enterprise analytics and data sharing.",
  snowsight:
    "Browser UI for running queries and managing the warehouse; used by analysts for exploration.",
  "aws-redshift":
    "Managed columnar data warehouse for large analytic workloads; used for structured reporting at scale.",
  "aws-athena":
    "Serverless SQL query service over object storage; used for ad-hoc analytics on data lakes.",
  "aws-glue": "Managed ETL service with data catalog and Spark jobs; used to build pipelines.",
  "aws-glue-databrew":
    "Visual data preparation tool for profiling and cleaning; used by analysts without code.",
  "aws-lake-formation":
    "Data lake governance service for access control and auditing; used to secure lake permissions.",
  "aws-emr": "Managed cluster service for Hadoop and Spark; used for large-scale batch processing.",
  "apache-spark":
    "Distributed processing engine for batch and streaming; used for ETL and ML workloads.",
  "aws-neptune":
    "Managed graph database for highly connected data; used for relationship analytics and entity resolution.",
  opensearch:
    "Open-source search and analytics engine; used for log search and operational analytics.",
  "opensearch-dashboards":
    "Web UI for exploring search indices and dashboards; used for interactive log and metric views.",
  "apache-airflow": "Workflow scheduler for DAG-based pipelines; used to orchestrate ETL jobs.",
  dbt: "SQL transformation tool with versioned models; used to manage analytics transformations.",
  "great-expectations": "Data quality testing framework; used to validate datasets and pipelines.",
  "aws-emr-studio":
    "Notebook-based workspace for Spark on managed clusters; used for collaborative data engineering.",
  looker: "BI platform with a modeling layer for metrics; used to deliver governed dashboards.",
  powerbi: "Microsoft BI suite for reports and dashboards; used widely across agencies.",
  "aws-quicksight":
    "Managed BI dashboard service; used for lightweight reporting without infrastructure.",
  "apache-superset": "Open-source dashboarding and exploration tool; used for ad-hoc analytics.",
  d3: "Low-level JavaScript visualization library; used to build bespoke charts.",
  plotly: "Interactive charting library; used in web dashboards and notebooks.",
  "semantic-layer":
    "Modeling layer that standardizes business definitions; used to keep metrics consistent.",
  "hub-spoke-data":
    "Integration pattern with a central hub and multiple sources; used to unify data domains.",
  "data-pipelines":
    "Automated flows that ingest, transform, and load data; used for recurring ETL.",
  aws: "Public cloud provider offering compute, storage, networking, and managed services; commonly used for FedRAMP-aligned hosting.",
  "fedramp-cloud":
    "Federal security authorization for cloud environments; used to certify hosting for federal data.",
  "aws-organizations":
    "Multi-account management service for centralized governance and billing; used to apply guardrails across accounts.",
  "aws-control-tower":
    "Landing-zone automation for standardized account provisioning; used to enforce guardrails and baselines.",
  "aws-lambda":
    "Event-driven functions runtime that scales per request; used for serverless APIs and automation.",
  "aws-batch":
    "Managed batch scheduler for containerized jobs; used for large data processing and scheduled compute.",
  "aws-ecs":
    "Container orchestration service for tasks and services; used for long-running containers.",
  "aws-ecr": "Managed container registry with image scanning; used to store and distribute images.",
  "aws-eks":
    "Managed Kubernetes control plane; used for orchestrating container clusters in regulated environments.",
  "aws-ec2":
    "Virtual machine compute with full OS control; used for legacy apps and custom workloads.",
  "aws-vpc":
    "Virtual network isolation for subnets and routing; used to segment workloads securely.",
  "aws-security-groups":
    "Stateful network firewall rules for instances; used to control inbound and outbound traffic.",
  "aws-alb": "Layer 7 load balancer for HTTP(S) traffic; used for routing and TLS termination.",
  "aws-cloudfront":
    "Content delivery network for caching and edge security; used to accelerate web apps.",
  "aws-route53": "Managed DNS and traffic routing service; used for domain hosting and failover.",
  "aws-s3": "Object storage for files and data lakes; used for backups, logs, and data sharing.",
  "aws-efs": "Managed NFS file system; used for shared storage across Linux instances.",
  "aws-dynamodb":
    "Managed key-value and document database; used for high-throughput, low-latency workloads.",
  "aws-systems-manager":
    "Operations suite for patching, inventory, and automation; used to manage fleets across environments.",
  "aws-appconfig":
    "Configuration and feature flag management service; used to safely roll out settings.",
  "aws-ssm-parameter-store":
    "Centralized parameter and secret storage; used for runtime configuration values.",
  "aws-rds": "Managed relational database service; used for transactional systems and reporting.",
  docker:
    "Container runtime for packaging applications; used to build and ship services consistently.",
  kubernetes:
    "Container orchestration platform for scheduling and scaling workloads; used for microservices deployments.",
  rancher: "Cluster management platform for Kubernetes; used to manage multi-cluster operations.",
  linux:
    "Open-source operating system used for servers and containers; common base for cloud workloads.",
  "landing-zone-accelerator":
    "Automation toolkit for building standardized landing zones; used to implement multi-account governance.",
  "cross-account-roles":
    "IAM pattern that allows secure access between accounts; used for shared services and automation.",
  github:
    "Source control and collaboration platform; used for repositories, pull requests, and workflows.",
  jenkins: "Automation server for CI/CD pipelines; used to build, test, and deploy.",
  "jenkins-templating-engine":
    "Pipeline templating library for standardized Jenkins jobs; used to scale CI configuration.",
  nexus: "Artifact repository for binaries and packages; used to manage dependencies and releases.",
  terraform:
    "Infrastructure-as-code tool for declarative provisioning; used to manage cloud resources.",
  "aws-cloudformation":
    "Infrastructure templating service for provisioning stacks; used to codify resources in templates.",
  ansible: "Configuration management and automation tool; used for provisioning and patching.",
  helm: "Package manager for Kubernetes; used to deploy charts and manage releases.",
  kustomize:
    "Declarative customization tool for Kubernetes manifests; used to manage environment overlays.",
  harness: "CI/CD platform with deployment governance; used for automated releases and approvals.",
  backstage:
    "Developer portal for service catalog and templates; used to improve platform discoverability.",
  sonarqube:
    "Static code quality and security analysis platform; used for code health and SAST reporting.",
  trivy: "Container and dependency scanner; used for vulnerability and SBOM checks.",
  openscap: "Compliance scanning tool for security baselines; used for configuration assessment.",
  checkmarx: "Static application security testing suite; used for code vulnerability scanning.",
  "prisma-cloud":
    "Container security platform for runtime and image scanning; used in Kubernetes environments.",
  "sonatype-lifecycle":
    "Software composition analysis tool for open-source risk; used for dependency governance.",
  sast: "Static analysis of source code; used to find vulnerabilities early in CI.",
  sca: "Dependency risk analysis for open-source components; used for license and vulnerability tracking.",
  dast: "Dynamic testing of running applications; used to find runtime vulnerabilities.",
  "owasp-zap": "Open-source web app scanner; used for dynamic security testing.",
  "aws-guardduty":
    "Managed threat detection using logs and flow data; used for continuous monitoring.",
  "aws-cloudtrail": "API audit logging service; used for compliance and investigations.",
  "aws-config": "Configuration history and compliance rules service; used to detect drift.",
  "aws-inspector":
    "Managed vulnerability scanning for instances and images; used for continuous assessments.",
  "aws-kms": "Key management service for encryption keys; used to encrypt data at rest.",
  "aws-secrets-manager":
    "Managed secrets storage with rotation; used for credentials and API keys.",
  "aws-waf": "Web application firewall for HTTP traffic; used to block common attacks.",
  "aws-shield": "DDoS protection service; used to protect public endpoints.",
  opa: "Policy engine for authorization and compliance; used with Kubernetes and CI gates.",
  "disa-stig": "DoD hardening guidelines; used for system configuration baselines.",
  "aws-security-hub":
    "Security findings aggregation and compliance service; used to centralize alerts.",
  "zero-trust":
    "Security model that verifies every request; used for network segmentation and access control.",
  "defense-in-depth-iam":
    "Layered IAM controls combining roles, boundaries, and guardrails; used to reduce blast radius.",
  rbac: "Access control model based on roles; used to manage permissions at scale.",
  "permission-boundaries":
    "IAM constraint mechanism for limiting role permissions; used to prevent privilege escalation.",
  "ou-controls":
    "Organizational unit policies for account grouping; used to apply guardrails by segment.",
  "iam-guardrails": "Preventative controls and policies for IAM; used to enforce least privilege.",
  "shift-left-security":
    "Practice of moving security checks into early SDLC stages; used in CI pipelines.",
  vault:
    "Secrets management system with encryption and leasing; used to store sensitive credentials.",
  okta: "Identity provider with SSO and MFA; used for workforce authentication.",
  "aws-iam":
    "Identity and access service for users, roles, and policies; used to manage permissions in the cloud.",
  "aws-cognito":
    "User directory and authentication service; used for application login and federation.",
  adfs: "Federation service for on-prem SSO; used to integrate with Active Directory.",
  "entra-id": "Microsoft cloud identity platform; used for enterprise SSO and federation.",
  oauth2: "Authorization framework for delegated access; used for API tokens and SSO.",
  "openid-connect": "Identity layer on top of OAuth 2.0; used for SSO login flows.",
  saml: "XML-based federation standard for SSO; used for enterprise identity integration.",
  iam: "Discipline and governance of identities, roles, and permissions; used to enforce least privilege.",
  react: "Component-based UI library for building SPAs; used for interactive government web apps.",
  nextjs: "React-based framework with routing and SSR; used for SEO and performance.",
  typescript:
    "Typed superset of JavaScript; used to improve maintainability of frontend and backend code.",
  uswds: "Federal design system for accessible UI patterns; used for government websites.",
  css: "Style sheet language for web layouts; used to implement responsive designs.",
  python:
    "General-purpose language favored for data processing and APIs; used in analytics and ML services.",
  java: "JVM language used for enterprise services; common for large-scale backends.",
  go: "Compiled language with strong concurrency; used for high-performance services.",
  nodejs: "JavaScript runtime for server-side apps; used for APIs and tooling.",
  "spring-boot": "Opinionated Java framework for REST services; used for enterprise APIs.",
  django: "Full-stack Python web framework; used for rapid API and web development.",
  flask: "Lightweight Python web framework; used for small services and APIs.",
  fastapi: "Python framework for high-performance APIs with type hints; used for data services.",
  express: "Minimal Node.js web framework; used for API endpoints and middleware.",
  grpc: "Binary RPC protocol with schema contracts; used for service-to-service communication.",
  multithreading:
    "Concurrency approach using multiple threads; used to improve throughput in CPU-bound work.",
  microservices:
    "Architecture that decomposes systems into small services; used for independent scaling and deployment.",
  "loosely-coupled":
    "Design approach with minimal dependencies between components; used for resilience and change isolation.",
  "two-tier-monolith":
    "Architecture with presentation and data layers in a single deployable unit; common for legacy systems.",
  "object-oriented":
    "Programming paradigm based on classes and objects; used for modularizing complex systems.",
  "state-machine-architecture":
    "Workflow design that models steps as state transitions; used for serverless orchestration of tasks.",
  "feature-flags":
    "Runtime toggles for enabling features; used for safe rollout and experimentation.",
  agile:
    "Iterative delivery methodology with frequent feedback; common in government digital services.",
  mvp: "Delivery approach that ships the smallest usable capability; used to validate scope early.",
  "dora-metrics":
    "Set of delivery performance metrics (lead time, deploy frequency, MTTR, change fail); used to assess DevOps health.",
  devsecops:
    "Integration of security into DevOps processes; used to automate compliance and testing.",
  "ci-cd": "Automated build/test/deploy pipelines; used to speed delivery and reduce errors.",
  okrs: "Goal-setting framework with measurable outcomes; used for program alignment.",
  "aws-api-gateway":
    "Managed API front door with auth and throttling; used to publish REST and HTTP APIs.",
  openapi:
    "API specification standard for describing endpoints and schemas; used for documentation and code generation.",
  apigee: "API management platform with proxies and analytics; used for enterprise API governance.",
  "aws-sqs": "Managed queue service for decoupling workloads; used for asynchronous processing.",
  "aws-sns": "Managed pub/sub notification service; used for fan-out messaging.",
  "aws-eventbridge":
    "Event bus for routing events between services; used for event-driven architectures.",
  "aws-step-functions":
    "State machine orchestration service; used to coordinate serverless workflows.",
  "aws-kinesis": "Managed streaming ingestion service; used for real-time analytics and pipelines.",
  kafka:
    "Distributed streaming platform for high-throughput events; used for log and event pipelines.",
  rabbitmq: "Message broker with queues and exchanges; used for reliable messaging.",
  "unit-tests": "Isolated tests for individual functions or classes; used for fast feedback in CI.",
  "integration-tests":
    "Tests that validate interactions between components; used to catch contract issues.",
  "e2e-tests": "User-journey tests across the full stack; used to validate critical flows.",
  "load-tests": "Performance tests that apply sustained load; used to validate scalability.",
  "accessibility-tests":
    "Checks for accessibility compliance (Section 508); used to ensure usable interfaces.",
  "ui-unit-tests": "Component-level UI tests; used to validate rendering and logic.",
  "data-tests": "Validation checks for data accuracy and completeness; used in pipelines.",
  junit: "Java testing framework; used for unit and integration tests.",
  cypress: "Browser-based end-to-end testing framework; used for UI regression tests.",
  playwright: "Cross-browser automation framework; used for end-to-end testing.",
  selenium: "Browser automation suite; used for cross-browser testing.",
  jmeter: "Load testing tool for HTTP and other protocols; used for performance testing.",
  locust: "Python-based load testing tool; used for scalable performance tests.",
  pytest: "Python testing framework; used for unit and integration tests.",
  "aws-cloudwatch":
    "Managed metrics, logs, and alarms service; used for baseline monitoring in the cloud.",
  "aws-cloudwatch-rum":
    "Real user monitoring for frontend performance; used to track client latency and errors.",
  "aws-lambda-insights":
    "Runtime metrics and traces for serverless functions; used for performance tuning.",
  newrelic: "APM and observability platform; used for application performance monitoring.",
  splunk: "Log analytics and SIEM platform; used for security and operational monitoring.",
  grafana: "Dashboarding tool for metrics and logs; used with Prometheus and cloud sources.",
  prometheus: "Time-series metrics collection and alerting system; used to scrape service metrics.",
  opentelemetry:
    "Open standard for telemetry instrumentation; used to export traces, metrics, and logs.",
  "fluent-bit": "Lightweight log forwarder and processor; used to ship logs to central stores.",
  "aws-xray": "Distributed tracing service for request flows; used to trace microservice calls.",
  jira: "Issue tracking and agile planning tool; used for backlog and sprint management.",
  confluence: "Team wiki and documentation space; used for requirements and knowledge sharing.",
  teams: "Chat and meeting platform; used for daily collaboration.",
  sharepoint: "Document management and intranet platform; used for file sharing and approvals.",
  coder: "Remote development environment platform; used to standardize dev workspaces.",
  "vs-code": "Popular code editor with extensions; used for daily development.",
  "aws-fargate":
    "Serverless compute engine for containers; used to run ECS/EKS tasks without managing servers.",
  "aws-aurora":
    "MySQL- and PostgreSQL-compatible managed relational database; used for high-throughput transactional workloads.",
  "aws-elasticache":
    "Managed Redis and Memcached service; used for in-memory caching and session stores.",
  "aws-msk": "Managed Apache Kafka service; used for event streaming and real-time data pipelines.",
  "aws-transit-gateway":
    "Network hub that connects VPCs and on-premises networks; used for centralized routing.",
  "aws-direct-connect":
    "Dedicated network connection from on-premises to AWS; used for low-latency, high-bandwidth links.",
  "aws-codepipeline":
    "Continuous delivery service for release pipelines; used to automate build, test, and deploy stages.",
  "aws-codebuild":
    "Fully managed build service; used to compile source code, run tests, and produce artifacts.",
  "aws-codedeploy":
    "Automated deployment service; used for rolling, blue/green, and canary deployments.",
  "aws-acm":
    "Managed SSL/TLS certificate service; used to provision and renew certificates for ALBs and CloudFront.",
  "aws-privatelink":
    "Private connectivity to AWS services without traversing the internet; used for secure VPC endpoints.",
  "aws-backup":
    "Centralized backup service; used to automate and govern backups across AWS resources.",
  "aws-cost-explorer":
    "Cost visualization and forecasting tool; used for cloud spend analysis and optimization.",
  "aws-service-catalog":
    "Managed catalog of approved cloud products; used to enforce governance on provisioned resources.",
  "aws-nlb":
    "Network Load Balancer for TCP/UDP traffic; used for ultra-low-latency, high-throughput load balancing.",
  nginx:
    "High-performance web server and reverse proxy; used for load balancing, SSL termination, and static content.",
  git: "Distributed version control system; used for source code management and collaboration.",
  argocd:
    "Declarative GitOps continuous delivery tool for Kubernetes; used to sync cluster state from Git repos.",
  gitlab:
    "DevOps platform with built-in CI/CD; used for source control, pipelines, and container registry.",
  pulumi:
    "Infrastructure as code using general-purpose programming languages; used for cloud provisioning.",
  packer:
    "Machine image builder; used to create identical images for multiple platforms from a single config.",
  mysql:
    "Open-source relational database; used for transactional web applications and OLTP workloads.",
  mongodb:
    "Document-oriented NoSQL database; used for flexible schema applications and rapid prototyping.",
  elasticsearch:
    "Distributed search and analytics engine; used for full-text search, log analytics, and observability.",
  keycloak: "Open-source identity and access management; used for SSO, OIDC, and SAML federation.",
  istio:
    "Service mesh for Kubernetes; used for traffic management, security, and observability between services.",
  envoy:
    "High-performance edge and service proxy; used as a sidecar in service mesh architectures.",
  langchain:
    "Framework for building LLM-powered applications; used for retrieval-augmented generation and agents.",
  snyk: "Developer security platform; used for vulnerability scanning in code, dependencies, containers, and IaC.",
  harbor:
    "Open-source container registry with security scanning; used for storing and distributing container images.",
  "grafana-loki":
    "Log aggregation system inspired by Prometheus; used for cost-effective log storage and querying.",
  jaeger: "Open-source distributed tracing system; used for monitoring microservice request flows.",
  "apache-nifi":
    "Data integration tool with visual flow-based programming; used for ETL, routing, and data transformation.",
  minio:
    "S3-compatible object storage server; used for on-premises or hybrid cloud object storage.",
  numpy:
    "Numerical computing library for Python; used for array operations, linear algebra, and scientific computing.",
  mattermost: "Open-source team messaging platform; used for secure, self-hosted collaboration.",
  "platform-one":
    "DoD enterprise DevSecOps platform providing standardized, security-first CI/CD for military software delivery.",
  "iron-bank":
    "DoD hardened container image repository with continuous vulnerability scanning and STIG compliance checks.",
  "big-bang":
    "Infrastructure-as-Code package automating full DevSecOps environments onto Kubernetes across classification levels.",
  neuvector:
    "Open-source container runtime security platform for network segmentation, compliance scanning, and vulnerability management.",
  kyverno:
    "Kubernetes-native policy engine for declarative security, compliance, and governance policies-as-code.",
  anchore:
    "Container image scanning and SBOM platform for policy evaluation and compliance verification against federal standards.",
  velero:
    "Open-source Kubernetes backup and restore tool for disaster recovery and cluster migration.",
  "flux-cd":
    "CNCF GitOps toolkit for continuous delivery on Kubernetes, reconciling cluster state from Git repositories.",
  "crowdstrike-falcon":
    "Cloud-native endpoint detection and response platform for threat intelligence, incident response, and real-time protection.",
  "tenable-nessus":
    "Vulnerability scanner and exposure management platform for identifying misconfigurations and compliance gaps.",
  fortify:
    "Enterprise application security testing suite providing SAST, DAST, and SCA across 30+ languages.",
  oscal:
    "NIST Open Security Controls Assessment Language for expressing security controls and assessment results in machine-readable formats.",
  sbom: "Machine-readable inventory of software components and dependencies in standardized formats (SPDX, CycloneDX).",
  "nist-800-53":
    "NIST catalog of security and privacy controls for federal information systems; baseline for FedRAMP and DoD RMF.",
  "compliance-trestle":
    "Open-source tooling for managing OSCAL compliance-as-code artifacts in CI/CD pipelines.",
  lula: "Compliance-as-code tool for managing security controls through git workflows with OSCAL-native outputs.",
  "azure-government":
    "Physically isolated Azure cloud regions for US government workloads supporting FedRAMP High and DoD IL4/IL5.",
  "microsoft-365-gcc":
    "Government Community Cloud variant of Microsoft 365 compliant with FedRAMP High, CJIS, and IRS 1075.",
  "aws-govcloud":
    "Isolated AWS regions for sensitive workloads meeting FedRAMP High, DoD IL2/4/5, and ITAR requirements.",
  "google-cloud-government":
    "FedRAMP-authorized Google Cloud environment for federal government compute, data, and AI workloads.",
  "oracle-cloud-government":
    "FedRAMP-authorized Oracle Cloud Infrastructure regions for government workloads with Azure Government interconnect.",
  "servicenow-gcc":
    "Government Community Cloud version of ServiceNow for IT service management and workflow automation.",
  "salesforce-government-cloud":
    "FedRAMP High authorized CRM and application platform for government constituent services and case management.",
  "grafana-tempo":
    "Distributed tracing backend for large-scale trace storage with OpenTelemetry support and Grafana integration.",
  "grafana-alloy":
    "OpenTelemetry-native telemetry collector for logs, metrics, and traces in cloud-native observability stacks.",
  kiali:
    "Observability console for Istio service mesh providing topology visualization and traffic flow monitoring.",
  "cisa-kevs":
    "Authoritative catalog of actively exploited vulnerabilities with mandatory federal remediation timeframes.",
  "cisa-cdm":
    "Federal cybersecurity program providing tools and dashboards for continuous monitoring and asset management.",
  "fedramp-20x":
    "Modernized FedRAMP authorization framework using automated, cloud-native assessment processes.",
  "aqua-security":
    "Cloud-native security platform for container, serverless, and Kubernetes runtime protection and compliance.",
  "defense-unicorns-zarf":
    "Declarative air-gap deployment tool for packaging Kubernetes applications into disconnected environments.",
  jwcc: "DoD multi-cloud acquisition vehicle providing enterprise cloud from AWS, Azure, Google, and Oracle at all classification levels.",

  // ──────────────────────────────────────────────
  // Azure — AI / ML
  // ──────────────────────────────────────────────
  "azure-machine-learning":
    "Managed platform for training, deploying, and managing ML models with AutoML, pipelines, and responsible AI tooling.",
  "azure-ml-studio":
    "Browser-based IDE for notebooks, experiments, and ML asset management inside Azure Machine Learning.",
  "azure-ml-pipelines":
    "Pipeline orchestration within Azure Machine Learning for repeatable training and deployment workflows.",
  "azure-openai":
    "Managed service providing access to OpenAI models (GPT, DALL-E, Whisper) with Azure enterprise security and compliance.",
  "azure-ai-document-intelligence":
    "AI service for extracting text, key-value pairs, and tables from documents; replaces Form Recognizer.",
  "azure-ai-language":
    "Managed NLP service for sentiment analysis, entity extraction, summarization, and custom text classification.",
  "azure-ai-studio":
    "Unified portal for building, evaluating, and deploying generative AI applications with prompt flow and model catalog.",

  // ──────────────────────────────────────────────
  // Azure — Data & Analytics
  // ──────────────────────────────────────────────
  "azure-synapse":
    "Integrated analytics service combining data warehouse, Spark, and data integration for enterprise-scale analytics.",
  "azure-data-factory":
    "Cloud-scale ETL and data integration service with visual pipeline authoring and 100+ connectors.",
  "azure-databricks":
    "Managed Apache Spark platform jointly developed with Databricks; used for data engineering and ML.",
  "azure-data-lake-storage":
    "Hierarchical namespace on top of Blob Storage optimized for analytics workloads and big-data file systems.",
  "azure-hdinsight":
    "Managed open-source analytics clusters for Hadoop, Spark, Hive, and Kafka workloads.",
  "azure-cosmos-db":
    "Globally distributed, multi-model database with guaranteed single-digit millisecond latency and multiple consistency levels.",
  "azure-sql-database":
    "Managed relational database service built on the SQL Server engine with built-in intelligence and high availability.",
  "azure-cache-redis":
    "Managed Redis service for in-memory caching, session stores, and real-time analytics.",
  "microsoft-fabric":
    "Unified SaaS analytics platform integrating data engineering, data science, warehousing, and real-time analytics with OneLake.",
  "microsoft-purview":
    "Unified data governance platform for data cataloging, classification, lineage, and access policies across multi-cloud estates.",

  // ──────────────────────────────────────────────
  // Azure — Cloud & Infrastructure
  // ──────────────────────────────────────────────
  azure:
    "Microsoft public cloud platform offering compute, storage, networking, and managed services across 60+ regions.",
  "azure-management-groups":
    "Hierarchical containers for organizing subscriptions and applying governance policies at scale.",
  "azure-landing-zones":
    "Reference architecture and automation for standardized, secure Azure environment setup; equivalent to AWS Control Tower.",
  "azure-functions":
    "Event-driven serverless compute for running code on demand without managing infrastructure.",
  "azure-batch":
    "Managed batch processing service for running large-scale parallel and HPC workloads.",
  "azure-container-apps":
    "Managed serverless container hosting built on Kubernetes; used for microservices without cluster management.",
  "azure-container-registry":
    "Managed Docker registry for building, storing, and managing container images with geo-replication.",
  "azure-kubernetes-service":
    "Managed Kubernetes control plane with integrated CI/CD, monitoring, and policy enforcement.",
  "azure-virtual-machines":
    "IaaS compute with full OS control; used for lift-and-shift, custom workloads, and GPU instances.",
  "azure-vnet":
    "Virtual network isolation for subnets, routing, and network security; foundation for Azure networking.",
  "azure-nsg":
    "Network Security Groups for filtering inbound and outbound traffic to Azure resources.",
  "azure-application-gateway":
    "Layer 7 load balancer with WAF integration, SSL termination, and URL-based routing.",
  "azure-load-balancer":
    "Layer 4 load balancer for high-throughput, low-latency TCP/UDP traffic distribution.",
  "azure-front-door":
    "Global CDN and load balancer with WAF, SSL offload, and intelligent traffic routing.",
  "azure-dns":
    "Managed DNS hosting service for domain resolution with alias records and traffic manager integration.",
  "azure-blob-storage":
    "Massively scalable object storage for unstructured data, data lakes, backups, and static content.",
  "azure-files":
    "Managed SMB and NFS file shares accessible from cloud and on-premises environments.",
  "azure-sql-managed-instance":
    "PaaS SQL Server instance with near-complete engine compatibility for lift-and-shift migrations.",
  "azure-app-configuration":
    "Centralized configuration and feature flag management service for applications.",
  "azure-key-vault":
    "Managed service for storing and accessing secrets, keys, and certificates with HSM backing.",
  "azure-virtual-wan":
    "Network hub service connecting VNets, branches, and on-premises sites with automated routing.",
  "azure-expressroute":
    "Dedicated private network connection from on-premises to Azure; bypasses the public internet.",
  "azure-private-link":
    "Private connectivity to Azure services over the Microsoft backbone network; eliminates public internet exposure.",
  "azure-backup":
    "Centralized backup service for VMs, databases, file shares, and application workloads.",
  "azure-cost-management":
    "Cost analysis, budgeting, and optimization tool for Azure and multi-cloud spending.",
  "azure-managed-applications":
    "Service catalog capability for publishing and consuming governed Azure solution templates.",

  // ──────────────────────────────────────────────
  // Azure — DevOps
  // ──────────────────────────────────────────────
  "azure-devops":
    "Integrated DevOps platform with repos, boards, pipelines, test plans, and artifact management.",
  "azure-pipelines":
    "CI/CD pipeline service within Azure DevOps supporting multi-platform builds and deployments.",
  "azure-resource-manager":
    "Infrastructure-as-code deployment engine using ARM templates or Bicep for Azure resource provisioning.",
  "azure-bicep":
    "Declarative IaC language for Azure that compiles to ARM templates with cleaner syntax.",

  // ──────────────────────────────────────────────
  // Azure — Security
  // ──────────────────────────────────────────────
  "azure-defender-for-cloud":
    "Cloud security posture management and workload protection across Azure, AWS, and GCP.",
  "azure-sentinel":
    "Cloud-native SIEM and SOAR platform for intelligent security analytics and threat response.",
  "azure-policy":
    "Policy-as-code service for enforcing organizational standards and assessing compliance at scale.",
  "azure-monitor":
    "Full-stack monitoring platform for metrics, logs, and diagnostics across Azure resources.",
  "azure-application-insights":
    "APM service within Azure Monitor for live application performance monitoring and diagnostics.",
  "azure-waf":
    "Web Application Firewall integrated with Application Gateway and Front Door for OWASP protection.",
  "azure-ddos-protection":
    "DDoS mitigation service with always-on detection and automatic attack response.",
  "azure-firewall":
    "Managed, cloud-native network firewall with built-in high availability and threat intelligence.",

  // ──────────────────────────────────────────────
  // Azure — Identity
  // ──────────────────────────────────────────────
  "azure-managed-identity":
    "Automatically managed identity for Azure services to authenticate without storing credentials in code.",
  "azure-ad-b2c":
    "Customer identity and access management for consumer-facing applications with customizable sign-up flows.",

  // ──────────────────────────────────────────────
  // Azure — Integration
  // ──────────────────────────────────────────────
  "azure-api-management":
    "Full-lifecycle API gateway with developer portal, analytics, and policy enforcement.",
  "azure-service-bus":
    "Enterprise message broker with queues and publish-subscribe topics for reliable async messaging.",
  "azure-event-grid":
    "Event routing service for reactive programming with push-based delivery at scale.",
  "azure-event-hubs":
    "Big-data streaming platform for ingesting millions of events per second; Kafka-compatible.",
  "azure-logic-apps":
    "Serverless workflow orchestration with 400+ connectors for integrating services and data.",
  "azure-stream-analytics":
    "Real-time stream processing engine for IoT and event-driven analytics.",

  // ──────────────────────────────────────────────
  // Azure — Observability
  // ──────────────────────────────────────────────
  "azure-log-analytics":
    "Log query and analysis workspace within Azure Monitor using Kusto Query Language (KQL).",

  // ──────────────────────────────────────────────
  // GCP — AI / ML
  // ──────────────────────────────────────────────
  "gcp-vertex-ai":
    "Unified ML platform for training, deploying, and managing models with AutoML and custom training.",
  "gcp-vertex-ai-workbench":
    "Managed Jupyter notebook environment within Vertex AI for data science experimentation.",
  "gcp-vertex-ai-pipelines":
    "Managed pipeline orchestration for ML workflows using Kubeflow Pipelines or TFX.",
  "gcp-vertex-ai-studio":
    "Generative AI development environment for prompt design, model tuning, and deployment of foundation models.",
  "gcp-document-ai":
    "AI service for extracting structured data from documents using pre-trained and custom models.",
  "gcp-natural-language-api":
    "Managed NLP service for sentiment analysis, entity extraction, syntax analysis, and content classification.",

  // ──────────────────────────────────────────────
  // GCP — Data & Analytics
  // ──────────────────────────────────────────────
  "gcp-bigquery":
    "Serverless, multi-cloud data warehouse with built-in ML, geospatial analysis, and BI Engine.",
  "gcp-dataflow":
    "Managed Apache Beam service for unified batch and streaming data processing pipelines.",
  "gcp-dataproc":
    "Managed Spark and Hadoop clusters for large-scale data processing and analytics.",
  "gcp-data-fusion":
    "Visual ETL and data integration service built on CDAP for code-free pipeline authoring.",
  "gcp-dataplex":
    "Intelligent data fabric for managing, governing, and monitoring data across lakes and warehouses.",
  "gcp-cloud-sql": "Managed relational database service for MySQL, PostgreSQL, and SQL Server.",
  "gcp-cloud-spanner":
    "Globally distributed, strongly consistent relational database for mission-critical workloads.",
  "gcp-bigtable":
    "Managed wide-column NoSQL database for large analytical and operational workloads at low latency.",
  "gcp-firestore":
    "Serverless document database with real-time sync, offline support, and automatic scaling.",
  "gcp-memorystore":
    "Managed Redis and Memcached service for in-memory caching and session management.",
  "gcp-looker":
    "Enterprise BI and analytics platform with semantic modeling layer; now part of Google Cloud.",
  "gcp-cloud-storage":
    "Object storage service for data lakes, backups, and content delivery with multiple storage classes.",
  "gcp-data-catalog":
    "Metadata management service for discovering, understanding, and governing data assets.",

  // ──────────────────────────────────────────────
  // GCP — Cloud & Infrastructure
  // ──────────────────────────────────────────────
  gcp: "Google public cloud platform offering compute, storage, networking, data analytics, and AI services.",
  "gcp-resource-manager":
    "Hierarchical organization of projects, folders, and the organization node for governance and billing.",
  "gcp-cloud-functions":
    "Event-driven serverless compute for lightweight functions triggered by cloud events or HTTP.",
  "gcp-cloud-run":
    "Managed serverless platform for running containers directly from images without cluster management.",
  "gcp-cloud-batch":
    "Managed batch processing service for scheduling and running containerized batch jobs.",
  "gcp-artifact-registry":
    "Universal package manager for Docker images, language packages, and OS packages.",
  "gcp-gke":
    "Google Kubernetes Engine; managed Kubernetes with auto-scaling, auto-upgrade, and multi-cluster support.",
  "gcp-compute-engine":
    "Virtual machine compute with custom machine types, preemptible VMs, and GPU support.",
  "gcp-vpc": "Global virtual network with subnets, firewall rules, and private service access.",
  "gcp-firewall-rules":
    "VPC firewall rules for controlling ingress and egress traffic to instances.",
  "gcp-cloud-load-balancing":
    "Global and regional load balancing for HTTP(S), TCP/SSL, and UDP traffic with auto-scaling.",
  "gcp-cloud-cdn":
    "Content delivery network integrated with load balancers for low-latency content distribution.",
  "gcp-cloud-dns": "Managed DNS service with 100% SLA, DNSSEC support, and private DNS zones.",
  "gcp-filestore": "Managed NFS file storage for applications requiring a file system interface.",
  "gcp-cloud-interconnect":
    "Dedicated or partner network connections from on-premises to Google Cloud at high bandwidth.",
  "gcp-private-service-connect":
    "Private connectivity to Google Cloud services and third-party APIs over internal IP addresses.",
  "gcp-backup-dr":
    "Managed backup and disaster recovery service for VMs, databases, and file systems.",
  "gcp-cost-management":
    "Billing reports, budgets, and cost optimization recommendations for Google Cloud spending.",

  // ──────────────────────────────────────────────
  // GCP — DevOps
  // ──────────────────────────────────────────────
  "gcp-cloud-build":
    "Serverless CI/CD platform for building, testing, and deploying across languages and environments.",
  "gcp-cloud-deploy":
    "Managed continuous delivery service for GKE and Cloud Run with approval gates and rollback.",
  "gcp-deployment-manager":
    "Infrastructure-as-code service using YAML or Jinja2 templates for Google Cloud resource provisioning.",

  // ──────────────────────────────────────────────
  // GCP — Security
  // ──────────────────────────────────────────────
  "gcp-security-command-center":
    "Security and risk management platform for asset inventory, vulnerability findings, and threat detection.",
  "gcp-chronicle":
    "Cloud-native SIEM for petabyte-scale security telemetry analysis and threat hunting.",
  "gcp-cloud-armor":
    "DDoS protection and WAF for Google Cloud load balancers with adaptive protection.",
  "gcp-kms":
    "Cloud Key Management Service for creating and managing encryption keys with HSM backing.",
  "gcp-secret-manager":
    "Managed service for storing, accessing, and rotating secrets, API keys, and certificates.",
  "gcp-certificate-manager":
    "Managed SSL/TLS certificate provisioning and lifecycle management for load balancers.",
  "gcp-organization-policy":
    "Centralized policy constraints for enforcing governance rules across the GCP organization.",
  "gcp-binary-authorization":
    "Deploy-time security control that ensures only trusted container images are deployed to GKE.",

  // ──────────────────────────────────────────────
  // GCP — Identity
  // ──────────────────────────────────────────────
  "gcp-cloud-iam":
    "Identity and access management for fine-grained permissions on Google Cloud resources.",
  "gcp-identity-platform":
    "Customer identity service with authentication, MFA, and federation for applications.",

  // ──────────────────────────────────────────────
  // GCP — Integration
  // ──────────────────────────────────────────────
  "gcp-apigee":
    "Full-lifecycle API management platform with analytics, monetization, and developer portal.",
  "gcp-cloud-tasks":
    "Managed task queue for dispatching and delivering asynchronous work to handlers.",
  "gcp-pubsub":
    "Global messaging and event streaming service for real-time analytics and event-driven architectures.",
  "gcp-workflows":
    "Serverless workflow orchestration for combining Google Cloud services and HTTP APIs.",
  "gcp-datastream":
    "Change data capture and replication service for streaming data into BigQuery and Cloud Storage.",
  "gcp-eventarc":
    "Event routing service for triggering Cloud Run and Workflows from Google Cloud and custom sources.",

  // ──────────────────────────────────────────────
  // GCP — Observability
  // ──────────────────────────────────────────────
  "gcp-cloud-monitoring":
    "Infrastructure and application monitoring with metrics, dashboards, and alerting.",
  "gcp-cloud-logging":
    "Centralized log management with real-time log analytics and export capabilities.",
  "gcp-cloud-trace":
    "Distributed tracing service for understanding latency in microservice architectures.",
  "gcp-cloud-profiler":
    "Continuous CPU and heap profiling for production applications with minimal overhead.",
};

export const rawItems = [
  {
    id: "dnn",
    name: "Deep Neural Networks",
    category: "ai-ml",
    type: "Technique",
    synonyms: ["DNNs"],
    tags: ["deep learning"],
  },
  {
    id: "nlp",
    name: "Natural Language Processing",
    category: "ai-ml",
    type: "Capability",
    synonyms: ["NLP"],
    tags: ["text", "language"],
    commonWith: ["ner", "topic-modeling", "embeddings", "zero-shot-learning"],
  },
  {
    id: "ner",
    name: "Named Entity Recognition",
    category: "ai-ml",
    type: "Technique",
    synonyms: ["NER"],
    parents: ["nlp"],
    tags: ["extraction"],
  },
  {
    id: "topic-modeling",
    name: "Topic Modeling",
    category: "ai-ml",
    type: "Technique",
    parents: ["nlp"],
    tags: ["clustering"],
  },
  {
    id: "embeddings",
    name: "Text Embeddings",
    category: "ai-ml",
    type: "Capability",
    synonyms: ["Document embeddings", "Sentence embeddings"],
    tags: ["similarity"],
    commonWith: ["faiss", "gensim-word2vec", "titan-embeddings"],
  },
  {
    id: "contextual-embeddings",
    name: "Contextual Text Embeddings",
    category: "ai-ml",
    type: "Technique",
    synonyms: ["Textual embedding for contextual similarity"],
    parents: ["embeddings"],
  },
  {
    id: "pca",
    name: "Principal Component Analysis",
    category: "ai-ml",
    type: "Technique",
    synonyms: ["PCA"],
  },
  {
    id: "supervised-learning",
    name: "Supervised Learning",
    category: "ai-ml",
    type: "Technique",
    synonyms: ["Supervised learning for fraud classification"],
    commonWith: ["fraud-classification", "gradient-boosting"],
  },
  {
    id: "fraud-classification",
    name: "Fraud Classification",
    category: "ai-ml",
    type: "Capability",
    parents: ["supervised-learning"],
  },
  {
    id: "anomaly-detection",
    name: "Anomaly Detection",
    category: "ai-ml",
    type: "Capability",
  },
  {
    id: "gradient-boosting",
    name: "Gradient Boosting",
    category: "ai-ml",
    type: "Technique",
    tags: ["ensembles"],
  },
  {
    id: "random-forest",
    name: "Random Forest",
    category: "ai-ml",
    type: "Technique",
    tags: ["ensembles"],
  },
  {
    id: "genai",
    name: "Generative AI",
    category: "ai-ml",
    type: "Capability",
    synonyms: ["GenAI"],
    commonWith: ["llms", "aws-bedrock"],
  },
  {
    id: "llms",
    name: "Large Language Models",
    category: "ai-ml",
    type: "Capability",
    synonyms: ["LLMs"],
    parents: ["genai"],
    commonWith: ["llm-workflow", "gpt-architecture", "custom-transformer"],
  },
  {
    id: "llm-workflow",
    name: "LLM Processing Workflow",
    category: "ai-ml",
    type: "Practice",
    parents: ["llms"],
  },
  {
    id: "zero-shot-learning",
    name: "Zero-shot Learning",
    category: "ai-ml",
    type: "Technique",
    parents: ["llms"],
  },
  {
    id: "gpt-architecture",
    name: "GPT Architecture",
    category: "ai-ml",
    type: "Technique",
    synonyms: ["Autoregressive transformer"],
    parents: ["llms"],
  },
  {
    id: "custom-transformer",
    name: "Custom Transformer with Self-Attention",
    category: "ai-ml",
    type: "Technique",
    parents: ["llms"],
  },
  {
    id: "distributed-gpu-training",
    name: "Distributed GPU Training",
    category: "ai-ml",
    type: "Practice",
  },
  {
    id: "mlops",
    name: "MLOps",
    category: "ai-ml",
    type: "Practice",
    commonWith: ["mlflow", "aws-sagemaker"],
  },
  {
    id: "llm-detection",
    name: "LLM Detection",
    category: "ai-ml",
    type: "Capability",
    commonWith: ["hugging-face"],
  },
  {
    id: "pytorch",
    name: "PyTorch",
    category: "ai-ml",
    type: "Framework",
    commonWith: ["aws-sagemaker", "distributed-gpu-training"],
  },
  {
    id: "tensorflow",
    name: "TensorFlow",
    category: "ai-ml",
    type: "Framework",
  },
  {
    id: "scikit-learn",
    name: "scikit-learn",
    category: "ai-ml",
    type: "Library",
    commonWith: ["random-forest", "gradient-boosting", "pca"],
  },
  {
    id: "xgboost",
    name: "XGBoost",
    category: "ai-ml",
    type: "Library",
    parents: ["gradient-boosting"],
  },
  {
    id: "spacy",
    name: "spaCy",
    category: "ai-ml",
    type: "Library",
    parents: ["nlp"],
    commonWith: ["ner"],
  },
  {
    id: "gensim-word2vec",
    name: "Gensim word2vec",
    category: "ai-ml",
    type: "Library",
    parents: ["embeddings"],
  },
  {
    id: "faiss",
    name: "FAISS",
    category: "ai-ml",
    type: "Library",
    parents: ["embeddings"],
  },
  {
    id: "hugging-face",
    name: "Hugging Face",
    category: "ai-ml",
    type: "Platform",
    tags: ["models"],
  },
  {
    id: "mlflow",
    name: "MLflow",
    category: "ai-ml",
    type: "Tool",
    parents: ["mlops"],
  },
  {
    id: "aws-sagemaker",
    name: "AWS SageMaker",
    category: "ai-ml",
    type: "Platform",
    commonWith: ["aws-sagemaker-studio", "aws-bedrock"],
  },
  {
    id: "aws-sagemaker-studio",
    name: "AWS SageMaker Studio",
    category: "ai-ml",
    type: "Tool",
    parents: ["aws-sagemaker"],
  },
  {
    id: "aws-sagemaker-pipelines",
    name: "AWS SageMaker Pipelines",
    category: "ai-ml",
    type: "Service",
    parents: ["aws-sagemaker"],
  },
  {
    id: "aws-bedrock",
    name: "AWS Bedrock",
    category: "ai-ml",
    type: "Service",
    commonWith: ["anthropic-claude", "titan-embeddings", "llms"],
  },
  {
    id: "anthropic-claude",
    name: "Anthropic Claude",
    category: "ai-ml",
    type: "Service",
    parents: ["llms"],
    synonyms: ["Claude"],
  },
  {
    id: "titan-embeddings",
    name: "Titan Embeddings",
    category: "ai-ml",
    type: "Service",
    parents: ["embeddings"],
    synonyms: ["Titan Embeddings via AWS Bedrock"],
  },
  {
    id: "aws-textract",
    name: "AWS Textract",
    category: "ai-ml",
    type: "Service",
    tags: ["pdf", "ocr"],
  },
  {
    id: "aws-comprehend",
    name: "AWS Comprehend",
    category: "ai-ml",
    type: "Service",
    tags: ["nlp"],
  },
  {
    id: "langchain",
    name: "LangChain",
    category: "ai-ml",
    type: "Framework",
    commonWith: ["llms", "anthropic-claude"],
    tags: ["rag", "agents"],
  },
  {
    id: "numpy",
    name: "NumPy",
    category: "ai-ml",
    type: "Library",
    commonWith: ["python", "pandas"],
  },
  {
    id: "sql",
    name: "SQL",
    category: "data-analytics",
    type: "Standard",
  },
  {
    id: "parquet",
    name: "Apache Parquet",
    category: "data-analytics",
    type: "Standard",
  },
  {
    id: "pandas",
    name: "pandas",
    category: "data-analytics",
    type: "Library",
    commonWith: ["python"],
  },
  {
    id: "postgres",
    name: "PostgreSQL",
    category: "data-analytics",
    type: "DataStore",
    tags: ["relational"],
    synonyms: ["Postgres"],
  },
  {
    id: "redis",
    name: "Redis",
    category: "data-analytics",
    type: "DataStore",
    tags: ["cache"],
  },
  {
    id: "snowflake",
    name: "Snowflake",
    category: "data-analytics",
    type: "Platform",
    tags: ["warehouse"],
  },
  {
    id: "snowsight",
    name: "SnowSight",
    category: "data-analytics",
    type: "Tool",
    parents: ["snowflake"],
  },
  {
    id: "aws-redshift",
    name: "Amazon Redshift",
    category: "data-analytics",
    type: "Service",
    synonyms: ["Redshift"],
    tags: ["warehouse"],
  },
  {
    id: "aws-athena",
    name: "AWS Athena",
    category: "data-analytics",
    type: "Service",
  },
  {
    id: "aws-glue",
    name: "AWS Glue",
    category: "data-analytics",
    type: "Service",
    tags: ["etl"],
  },
  {
    id: "aws-glue-databrew",
    name: "AWS Glue DataBrew",
    category: "data-analytics",
    type: "Service",
    parents: ["aws-glue"],
  },
  {
    id: "aws-lake-formation",
    name: "AWS Lake Formation",
    category: "data-analytics",
    type: "Service",
  },
  {
    id: "aws-emr",
    name: "Amazon EMR",
    category: "data-analytics",
    type: "Service",
    synonyms: ["EMR"],
    commonWith: ["apache-spark"],
  },
  {
    id: "apache-spark",
    name: "Apache Spark",
    category: "data-analytics",
    type: "Framework",
    commonWith: ["aws-emr", "aws-emr-studio"],
  },
  {
    id: "aws-neptune",
    name: "Amazon Neptune",
    category: "data-analytics",
    type: "DataStore",
    tags: ["graph"],
  },
  {
    id: "opensearch",
    name: "OpenSearch",
    category: "data-analytics",
    type: "Platform",
    tags: ["search", "analytics"],
  },
  {
    id: "mysql",
    name: "MySQL",
    category: "data-analytics",
    type: "DataStore",
    commonWith: ["aws-rds"],
  },
  {
    id: "mongodb",
    name: "MongoDB",
    category: "data-analytics",
    type: "DataStore",
    tags: ["nosql", "document"],
  },
  {
    id: "elasticsearch",
    name: "Elasticsearch",
    category: "data-analytics",
    type: "Platform",
    synonyms: ["Elastic"],
    tags: ["search", "analytics"],
  },
  {
    id: "apache-nifi",
    name: "Apache NiFi",
    category: "data-analytics",
    type: "Tool",
    tags: ["etl", "data-flow"],
  },
  {
    id: "minio",
    name: "MinIO",
    category: "data-analytics",
    type: "Platform",
    synonyms: ["S3-compatible storage"],
    tags: ["object-storage"],
  },
  {
    id: "opensearch-dashboards",
    name: "OpenSearch Dashboards",
    category: "data-analytics",
    type: "Tool",
    parents: ["opensearch"],
  },
  {
    id: "apache-airflow",
    name: "Apache Airflow",
    category: "data-analytics",
    type: "Tool",
    commonWith: ["data-pipelines"],
  },
  {
    id: "dbt",
    name: "dbt",
    category: "data-analytics",
    type: "Tool",
    tags: ["transform"],
  },
  {
    id: "great-expectations",
    name: "Great Expectations",
    category: "data-analytics",
    type: "Tool",
    tags: ["data quality"],
    commonWith: ["data-tests"],
  },
  {
    id: "aws-emr-studio",
    name: "AWS EMR Studio",
    category: "data-analytics",
    type: "Tool",
    parents: ["aws-emr"],
    synonyms: ["EMR Studio"],
    tags: ["spark"],
  },
  {
    id: "looker",
    name: "Looker",
    category: "data-analytics",
    type: "Tool",
  },
  {
    id: "powerbi",
    name: "Power BI",
    category: "data-analytics",
    type: "Tool",
    synonyms: ["PowerBI"],
  },
  {
    id: "aws-quicksight",
    name: "Amazon QuickSight",
    category: "data-analytics",
    type: "Tool",
  },
  {
    id: "apache-superset",
    name: "Apache Superset",
    category: "data-analytics",
    type: "Tool",
  },
  {
    id: "d3",
    name: "D3.js",
    category: "data-analytics",
    type: "Library",
  },
  {
    id: "plotly",
    name: "Plotly",
    category: "data-analytics",
    type: "Library",
  },
  {
    id: "semantic-layer",
    name: "Semantic Layer",
    category: "data-analytics",
    type: "Pattern",
    tags: ["business objects"],
  },
  {
    id: "hub-spoke-data",
    name: "Hub-and-spoke Data Integration",
    category: "data-analytics",
    type: "Pattern",
  },
  {
    id: "data-pipelines",
    name: "Data Pipelines",
    category: "data-analytics",
    type: "Pattern",
    synonyms: ["Data pipeline components"],
    commonWith: ["aws-glue", "hub-spoke-data"],
  },
  {
    id: "aws",
    name: "Amazon Web Services",
    category: "cloud-infra",
    type: "Platform",
    synonyms: ["AWS"],
    commonWith: ["aws-ec2", "aws-vpc", "aws-s3"],
  },
  {
    id: "fedramp-cloud",
    name: "FedRAMP-compliant Cloud",
    category: "cloud-infra",
    type: "Standard",
  },
  {
    id: "aws-organizations",
    name: "AWS Organizations",
    category: "cloud-infra",
    type: "Service",
    parents: ["aws"],
    synonyms: ["Organizations"],
    commonWith: ["aws-control-tower", "landing-zone-accelerator"],
  },
  {
    id: "aws-control-tower",
    name: "AWS Control Tower",
    category: "cloud-infra",
    type: "Service",
    parents: ["aws"],
    synonyms: ["Control Tower"],
    commonWith: ["aws-organizations", "landing-zone-accelerator"],
  },
  {
    id: "aws-lambda",
    name: "AWS Lambda",
    category: "cloud-infra",
    type: "Service",
    parents: ["aws"],
    synonyms: ["Lambda"],
    commonWith: ["aws-sqs", "aws-api-gateway", "aws-step-functions"],
  },
  {
    id: "aws-batch",
    name: "AWS Batch",
    category: "cloud-infra",
    type: "Service",
    parents: ["aws"],
    synonyms: ["Batch jobs"],
    tags: ["batch", "spot"],
  },
  {
    id: "aws-ecs",
    name: "AWS ECS",
    category: "cloud-infra",
    type: "Service",
    parents: ["aws"],
    synonyms: ["ECS", "Elastic Container Service"],
  },
  {
    id: "aws-ecr",
    name: "Amazon ECR",
    category: "cloud-infra",
    type: "Service",
    parents: ["aws"],
    synonyms: ["ECR", "Elastic Container Registry"],
    commonWith: ["docker", "aws-ecs", "aws-eks"],
  },
  {
    id: "aws-eks",
    name: "AWS EKS",
    category: "cloud-infra",
    type: "Service",
    parents: ["aws"],
    synonyms: ["EKS", "Elastic Kubernetes Service"],
    commonWith: ["kubernetes", "docker"],
  },
  {
    id: "aws-ec2",
    name: "AWS EC2",
    category: "cloud-infra",
    type: "Service",
    parents: ["aws"],
    synonyms: ["EC2"],
  },
  {
    id: "aws-vpc",
    name: "AWS VPC",
    category: "cloud-infra",
    type: "Service",
    parents: ["aws"],
    synonyms: ["VPC"],
    commonWith: ["aws-security-groups"],
  },
  {
    id: "aws-security-groups",
    name: "AWS Security Groups",
    category: "cloud-infra",
    type: "Service",
    parents: ["aws"],
    synonyms: ["Security Groups"],
    commonWith: ["aws-vpc"],
  },
  {
    id: "aws-alb",
    name: "AWS Application Load Balancer",
    category: "cloud-infra",
    type: "Service",
    parents: ["aws"],
    synonyms: ["AWS ALB", "ALB"],
  },
  {
    id: "aws-cloudfront",
    name: "Amazon CloudFront",
    category: "cloud-infra",
    type: "Service",
    parents: ["aws"],
    synonyms: ["CloudFront"],
  },
  {
    id: "aws-route53",
    name: "Amazon Route 53",
    category: "cloud-infra",
    type: "Service",
    parents: ["aws"],
    synonyms: ["Route 53"],
  },
  {
    id: "aws-s3",
    name: "Amazon S3",
    category: "cloud-infra",
    type: "Service",
    parents: ["aws"],
    synonyms: ["S3", "S3 Buckets"],
  },
  {
    id: "aws-efs",
    name: "Amazon EFS",
    category: "cloud-infra",
    type: "Service",
    parents: ["aws"],
    synonyms: ["EFS", "Elastic File System"],
  },
  {
    id: "aws-dynamodb",
    name: "Amazon DynamoDB",
    category: "cloud-infra",
    type: "DataStore",
    parents: ["aws"],
    synonyms: ["DynamoDB"],
  },
  {
    id: "aws-systems-manager",
    name: "AWS Systems Manager",
    category: "cloud-infra",
    type: "Service",
    parents: ["aws"],
    synonyms: ["Systems Manager", "SSM"],
    commonWith: ["aws-appconfig", "aws-ssm-parameter-store"],
  },
  {
    id: "aws-appconfig",
    name: "AWS AppConfig",
    category: "cloud-infra",
    type: "Service",
    parents: ["aws-systems-manager"],
    synonyms: ["AppConfig"],
    commonWith: ["feature-flags"],
  },
  {
    id: "aws-ssm-parameter-store",
    name: "AWS SSM Parameter Store",
    category: "cloud-infra",
    type: "Service",
    parents: ["aws-systems-manager"],
    synonyms: ["SSM Parameter Store", "Parameter Store"],
  },
  {
    id: "aws-rds",
    name: "Amazon RDS",
    category: "cloud-infra",
    type: "Service",
    parents: ["aws"],
    synonyms: ["RDS"],
  },
  {
    id: "docker",
    name: "Docker",
    category: "cloud-infra",
    type: "Tool",
    commonWith: ["kubernetes", "aws-eks", "aws-ecs", "aws-ecr"],
  },
  {
    id: "kubernetes",
    name: "Kubernetes",
    category: "cloud-infra",
    type: "Platform",
    commonWith: ["docker", "rancher", "helm", "kustomize"],
  },
  {
    id: "rancher",
    name: "Rancher",
    category: "cloud-infra",
    type: "Platform",
    commonWith: ["kubernetes"],
  },
  {
    id: "linux",
    name: "Linux",
    category: "cloud-infra",
    type: "Platform",
  },
  {
    id: "landing-zone-accelerator",
    name: "Landing Zone Accelerator",
    category: "cloud-infra",
    type: "Practice",
    synonyms: ["LZA"],
    commonWith: ["aws-control-tower", "aws-organizations"],
  },
  {
    id: "cross-account-roles",
    name: "Cross-account Roles",
    category: "cloud-infra",
    type: "Practice",
  },
  {
    id: "aws-fargate",
    name: "AWS Fargate",
    category: "cloud-infra",
    type: "Service",
    parents: ["aws"],
    synonyms: ["Fargate"],
    commonWith: ["aws-ecs", "aws-eks"],
  },
  {
    id: "aws-aurora",
    name: "Amazon Aurora",
    category: "cloud-infra",
    type: "DataStore",
    parents: ["aws"],
    synonyms: ["Aurora"],
    commonWith: ["aws-rds"],
  },
  {
    id: "aws-elasticache",
    name: "Amazon ElastiCache",
    category: "cloud-infra",
    type: "Service",
    parents: ["aws"],
    synonyms: ["ElastiCache"],
    tags: ["redis", "memcached"],
  },
  {
    id: "aws-transit-gateway",
    name: "AWS Transit Gateway",
    category: "cloud-infra",
    type: "Service",
    parents: ["aws"],
    synonyms: ["Transit Gateway", "TGW"],
    commonWith: ["aws-vpc"],
  },
  {
    id: "aws-direct-connect",
    name: "AWS Direct Connect",
    category: "cloud-infra",
    type: "Service",
    parents: ["aws"],
    synonyms: ["Direct Connect", "DX"],
  },
  {
    id: "aws-privatelink",
    name: "AWS PrivateLink",
    category: "cloud-infra",
    type: "Service",
    parents: ["aws"],
    synonyms: ["PrivateLink", "VPC Endpoints"],
    commonWith: ["aws-vpc"],
  },
  {
    id: "aws-backup",
    name: "AWS Backup",
    category: "cloud-infra",
    type: "Service",
    parents: ["aws"],
  },
  {
    id: "aws-cost-explorer",
    name: "AWS Cost Explorer",
    category: "cloud-infra",
    type: "Tool",
    parents: ["aws"],
    synonyms: ["Cost Explorer"],
  },
  {
    id: "aws-service-catalog",
    name: "AWS Service Catalog",
    category: "cloud-infra",
    type: "Service",
    parents: ["aws"],
    synonyms: ["Service Catalog"],
  },
  {
    id: "aws-nlb",
    name: "AWS Network Load Balancer",
    category: "cloud-infra",
    type: "Service",
    parents: ["aws"],
    synonyms: ["NLB", "Network Load Balancer"],
    commonWith: ["aws-alb"],
  },
  {
    id: "nginx",
    name: "Nginx",
    category: "cloud-infra",
    type: "Tool",
    synonyms: ["nginx"],
    tags: ["reverse-proxy", "web-server"],
  },
  {
    id: "aws-govcloud",
    name: "AWS GovCloud",
    category: "cloud-infra",
    type: "Platform",
    parents: ["aws"],
    synonyms: ["GovCloud"],
    tags: ["fedramp", "government"],
  },
  {
    id: "azure-government",
    name: "Microsoft Azure Government",
    category: "cloud-infra",
    type: "Platform",
    synonyms: ["Azure Gov", "Azure GCC"],
    tags: ["fedramp", "government"],
  },
  {
    id: "google-cloud-government",
    name: "Google Cloud for Government",
    category: "cloud-infra",
    type: "Platform",
    synonyms: ["GCP Government"],
    tags: ["fedramp", "government"],
  },
  {
    id: "oracle-cloud-government",
    name: "Oracle Cloud Government",
    category: "cloud-infra",
    type: "Platform",
    synonyms: ["OCI Government"],
    tags: ["fedramp", "government"],
  },
  {
    id: "jwcc",
    name: "Joint Warfighting Cloud Capability",
    category: "cloud-infra",
    type: "Platform",
    synonyms: ["JWCC"],
    commonWith: [
      "aws-govcloud",
      "azure-government",
      "google-cloud-government",
      "oracle-cloud-government",
    ],
    tags: ["dod", "multi-cloud"],
  },
  {
    id: "velero",
    name: "Velero",
    category: "cloud-infra",
    type: "Tool",
    commonWith: ["kubernetes"],
    tags: ["backup", "disaster-recovery"],
  },
  {
    id: "github",
    name: "GitHub",
    category: "devops",
    type: "Tool",
    commonWith: ["jenkins", "nexus"],
  },
  {
    id: "jenkins",
    name: "Jenkins",
    category: "devops",
    type: "Tool",
    commonWith: ["github", "jenkins-templating-engine"],
  },
  {
    id: "jenkins-templating-engine",
    name: "Jenkins Templating Engine",
    category: "devops",
    type: "Tool",
    parents: ["jenkins"],
  },
  {
    id: "nexus",
    name: "Nexus Repository",
    category: "devops",
    type: "Tool",
    synonyms: ["Nexus"],
  },
  {
    id: "terraform",
    name: "Terraform",
    category: "devops",
    type: "Tool",
    commonWith: ["aws", "vault"],
  },
  {
    id: "aws-cloudformation",
    name: "AWS CloudFormation",
    category: "devops",
    type: "Service",
    synonyms: ["CloudFormation"],
    commonWith: ["terraform", "aws"],
  },
  {
    id: "ansible",
    name: "Ansible",
    category: "devops",
    type: "Tool",
  },
  {
    id: "helm",
    name: "Helm",
    category: "devops",
    type: "Tool",
    commonWith: ["kubernetes"],
  },
  {
    id: "kustomize",
    name: "Kustomize",
    category: "devops",
    type: "Tool",
    commonWith: ["kubernetes"],
  },
  {
    id: "harness",
    name: "Harness",
    category: "devops",
    type: "Tool",
    tags: ["ci/cd"],
  },
  {
    id: "backstage",
    name: "Backstage",
    category: "devops",
    type: "Tool",
    tags: ["developer portal"],
  },
  {
    id: "aws-codepipeline",
    name: "AWS CodePipeline",
    category: "devops",
    type: "Service",
    parents: ["aws"],
    synonyms: ["CodePipeline"],
    commonWith: ["aws-codebuild", "aws-codedeploy"],
  },
  {
    id: "aws-codebuild",
    name: "AWS CodeBuild",
    category: "devops",
    type: "Service",
    parents: ["aws"],
    synonyms: ["CodeBuild"],
    commonWith: ["aws-codepipeline"],
  },
  {
    id: "aws-codedeploy",
    name: "AWS CodeDeploy",
    category: "devops",
    type: "Service",
    parents: ["aws"],
    synonyms: ["CodeDeploy"],
    commonWith: ["aws-codepipeline"],
  },
  {
    id: "git",
    name: "Git",
    category: "devops",
    type: "Tool",
    commonWith: ["github", "gitlab"],
  },
  {
    id: "argocd",
    name: "Argo CD",
    category: "devops",
    type: "Tool",
    commonWith: ["kubernetes"],
    tags: ["gitops"],
  },
  {
    id: "gitlab",
    name: "GitLab",
    category: "devops",
    type: "Platform",
    commonWith: ["git", "github"],
  },
  {
    id: "pulumi",
    name: "Pulumi",
    category: "devops",
    type: "Tool",
    commonWith: ["terraform"],
    tags: ["iac"],
  },
  {
    id: "packer",
    name: "Packer",
    category: "devops",
    type: "Tool",
    synonyms: ["HashiCorp Packer"],
    tags: ["image-builder"],
  },
  {
    id: "harbor",
    name: "Harbor",
    category: "devops",
    type: "Tool",
    commonWith: ["docker", "kubernetes"],
    tags: ["container-registry"],
  },
  {
    id: "platform-one",
    name: "Platform One",
    category: "devops",
    type: "Platform",
    commonWith: ["big-bang", "iron-bank"],
    tags: ["dod", "devsecops"],
  },
  {
    id: "big-bang",
    name: "Big Bang",
    category: "devops",
    type: "Platform",
    parents: ["platform-one"],
    commonWith: ["kubernetes", "istio"],
    tags: ["dod", "devsecops", "iac"],
  },
  {
    id: "flux-cd",
    name: "Flux CD",
    category: "devops",
    type: "Tool",
    commonWith: ["kubernetes", "argocd"],
    tags: ["gitops"],
  },
  {
    id: "defense-unicorns-zarf",
    name: "Zarf",
    category: "devops",
    type: "Tool",
    synonyms: ["Defense Unicorns Zarf"],
    commonWith: ["kubernetes", "big-bang"],
    tags: ["air-gap", "dod"],
  },
  {
    id: "sonarqube",
    name: "SonarQube",
    category: "security",
    type: "Tool",
    parents: ["sast"],
    tags: ["code quality"],
  },
  {
    id: "trivy",
    name: "Trivy",
    category: "security",
    type: "Tool",
    parents: ["sca"],
    tags: ["container scanning"],
    commonWith: ["sca"],
  },
  {
    id: "openscap",
    name: "OpenSCAP",
    category: "security",
    type: "Tool",
    synonyms: ["OpenScap"],
  },
  {
    id: "checkmarx",
    name: "Checkmarx",
    category: "security",
    type: "Tool",
    parents: ["sast"],
    commonWith: ["sast"],
  },
  {
    id: "prisma-cloud",
    name: "Prisma Cloud",
    category: "security",
    type: "Tool",
    synonyms: ["Twistlock"],
    tags: ["container security"],
  },
  {
    id: "sonatype-lifecycle",
    name: "Sonatype Lifecycle",
    category: "security",
    type: "Tool",
    synonyms: ["Nexus IQ"],
    parents: ["sca"],
    commonWith: ["sca"],
  },
  {
    id: "sast",
    name: "SAST",
    category: "security",
    type: "Capability",
    synonyms: ["Static Application Security Testing"],
    commonWith: ["checkmarx", "sonarqube"],
  },
  {
    id: "sca",
    name: "SCA",
    category: "security",
    type: "Capability",
    synonyms: ["Software Composition Analysis"],
    commonWith: ["trivy", "sonatype-lifecycle"],
  },
  {
    id: "dast",
    name: "DAST",
    category: "security",
    type: "Capability",
    synonyms: ["Dynamic Application Security Testing"],
    commonWith: ["owasp-zap"],
  },
  {
    id: "owasp-zap",
    name: "OWASP ZAP",
    category: "security",
    type: "Tool",
    parents: ["dast"],
  },
  {
    id: "aws-guardduty",
    name: "AWS GuardDuty",
    category: "security",
    type: "Service",
    synonyms: ["GuardDuty"],
    commonWith: ["aws-security-hub", "aws-cloudtrail"],
  },
  {
    id: "aws-cloudtrail",
    name: "AWS CloudTrail",
    category: "security",
    type: "Service",
    synonyms: ["CloudTrail"],
    commonWith: ["aws-security-hub", "aws-config"],
  },
  {
    id: "aws-config",
    name: "AWS Config",
    category: "security",
    type: "Service",
    synonyms: ["Config"],
    commonWith: ["aws-security-hub", "aws-cloudtrail"],
  },
  {
    id: "aws-inspector",
    name: "AWS Inspector",
    category: "security",
    type: "Service",
    synonyms: ["Inspector"],
    commonWith: ["aws-security-hub"],
  },
  {
    id: "aws-kms",
    name: "AWS KMS",
    category: "security",
    type: "Service",
    synonyms: ["KMS", "Key Management Service"],
    commonWith: ["aws-secrets-manager"],
  },
  {
    id: "aws-secrets-manager",
    name: "AWS Secrets Manager",
    category: "security",
    type: "Service",
    synonyms: ["Secrets Manager"],
    commonWith: ["aws-kms", "vault"],
  },
  {
    id: "aws-waf",
    name: "AWS WAF",
    category: "security",
    type: "Service",
    synonyms: ["WAF"],
    commonWith: ["aws-shield", "aws-cloudfront"],
  },
  {
    id: "aws-shield",
    name: "AWS Shield",
    category: "security",
    type: "Service",
    synonyms: ["Shield"],
    commonWith: ["aws-waf"],
  },
  {
    id: "aws-acm",
    name: "AWS Certificate Manager",
    category: "security",
    type: "Service",
    parents: ["aws"],
    synonyms: ["ACM", "Certificate Manager"],
  },
  {
    id: "opa",
    name: "Open Policy Agent",
    category: "security",
    type: "Tool",
    synonyms: ["OPA"],
    commonWith: ["kubernetes"],
  },
  {
    id: "disa-stig",
    name: "DISA STIGs",
    category: "security",
    type: "Standard",
    synonyms: ["STIG"],
  },
  {
    id: "aws-security-hub",
    name: "AWS Security Hub",
    category: "security",
    type: "Service",
    commonWith: ["aws-guardduty", "aws-config", "aws-cloudtrail", "aws-inspector"],
  },
  {
    id: "zero-trust",
    name: "Zero Trust Network",
    category: "security",
    type: "Pattern",
  },
  {
    id: "defense-in-depth-iam",
    name: "Defense-in-depth IAM",
    category: "security",
    type: "Practice",
    tags: ["rbac", "permission boundaries"],
  },
  {
    id: "snyk",
    name: "Snyk",
    category: "security",
    type: "Tool",
    tags: ["sca", "sast", "container security", "iac scanning"],
  },
  {
    id: "iron-bank",
    name: "Iron Bank",
    category: "security",
    type: "Platform",
    parents: ["platform-one"],
    commonWith: ["anchore", "prisma-cloud"],
    tags: ["dod", "container-hardening"],
  },
  {
    id: "neuvector",
    name: "NeuVector",
    category: "security",
    type: "Tool",
    commonWith: ["kubernetes", "big-bang"],
    tags: ["container security", "runtime"],
  },
  {
    id: "kyverno",
    name: "Kyverno",
    category: "security",
    type: "Tool",
    commonWith: ["kubernetes", "opa"],
    tags: ["policy-as-code"],
  },
  {
    id: "anchore",
    name: "Anchore Enterprise",
    category: "security",
    type: "Tool",
    commonWith: ["iron-bank"],
    tags: ["container security", "sbom"],
  },
  {
    id: "crowdstrike-falcon",
    name: "CrowdStrike Falcon",
    category: "security",
    type: "Platform",
    synonyms: ["CrowdStrike"],
    tags: ["edr", "endpoint", "fedramp"],
  },
  {
    id: "tenable-nessus",
    name: "Tenable Nessus",
    category: "security",
    type: "Tool",
    synonyms: ["Nessus"],
    tags: ["vulnerability-scanning", "fedramp"],
  },
  {
    id: "fortify",
    name: "Fortify",
    category: "security",
    type: "Tool",
    synonyms: ["OpenText Fortify"],
    parents: ["sast"],
    tags: ["application-security"],
  },
  {
    id: "aqua-security",
    name: "Aqua Security",
    category: "security",
    type: "Tool",
    commonWith: ["kubernetes"],
    tags: ["container security", "runtime"],
  },
  {
    id: "oscal",
    name: "OSCAL",
    category: "security",
    type: "Standard",
    synonyms: ["Open Security Controls Assessment Language"],
    commonWith: ["nist-800-53", "fedramp-20x"],
    tags: ["compliance-as-code"],
  },
  {
    id: "sbom",
    name: "Software Bill of Materials",
    category: "security",
    type: "Standard",
    synonyms: ["SBOM", "SPDX", "CycloneDX"],
    tags: ["supply-chain"],
  },
  {
    id: "nist-800-53",
    name: "NIST SP 800-53",
    category: "security",
    type: "Standard",
    synonyms: ["800-53"],
    commonWith: ["oscal", "fedramp-20x"],
    tags: ["compliance", "federal"],
  },
  {
    id: "compliance-trestle",
    name: "Compliance Trestle",
    category: "security",
    type: "Tool",
    commonWith: ["oscal"],
    tags: ["compliance-as-code"],
  },
  {
    id: "lula",
    name: "Lula",
    category: "security",
    type: "Tool",
    synonyms: ["Defense Unicorns Lula"],
    commonWith: ["oscal", "nist-800-53"],
    tags: ["compliance-as-code", "dod"],
  },
  {
    id: "cisa-kevs",
    name: "CISA KEV Catalog",
    category: "security",
    type: "Standard",
    synonyms: ["Known Exploited Vulnerabilities"],
    tags: ["vulnerability-management", "federal"],
  },
  {
    id: "cisa-cdm",
    name: "CISA CDM",
    category: "security",
    type: "Practice",
    synonyms: ["Continuous Diagnostics and Mitigation"],
    tags: ["continuous-monitoring", "federal"],
  },
  {
    id: "fedramp-20x",
    name: "FedRAMP 20x",
    category: "security",
    type: "Standard",
    synonyms: ["FedRAMP"],
    commonWith: ["oscal", "nist-800-53"],
    tags: ["compliance", "federal", "cloud-authorization"],
  },
  {
    id: "rbac",
    name: "Role-based Access Control",
    category: "identity",
    type: "Pattern",
    synonyms: ["RBAC"],
  },
  {
    id: "permission-boundaries",
    name: "IAM Permission Boundaries",
    category: "identity",
    type: "Practice",
  },
  {
    id: "ou-controls",
    name: "Organization Unit Controls",
    category: "security",
    type: "Practice",
  },
  {
    id: "iam-guardrails",
    name: "IAM Guardrails",
    category: "security",
    type: "Practice",
  },
  {
    id: "shift-left-security",
    name: "Shift-left Security",
    category: "security",
    type: "Practice",
    commonWith: ["sast", "sca"],
  },
  {
    id: "vault",
    name: "HashiCorp Vault",
    category: "security",
    type: "Tool",
    tags: ["secrets"],
  },
  {
    id: "okta",
    name: "Okta",
    category: "identity",
    type: "Tool",
    commonWith: ["oauth2", "entra-id"],
  },
  {
    id: "keycloak",
    name: "Keycloak",
    category: "identity",
    type: "Tool",
    commonWith: ["oauth2", "openid-connect", "saml"],
    tags: ["sso"],
  },
  {
    id: "aws-iam",
    name: "AWS IAM",
    category: "identity",
    type: "Service",
    parents: ["iam"],
    synonyms: ["IAM"],
    commonWith: ["aws-cognito", "rbac", "permission-boundaries"],
  },
  {
    id: "aws-cognito",
    name: "AWS Cognito",
    category: "identity",
    type: "Service",
    parents: ["iam"],
    commonWith: ["oauth2", "openid-connect", "aws-iam"],
  },
  {
    id: "adfs",
    name: "ADFS",
    category: "identity",
    type: "Service",
    synonyms: ["ADFS SSO"],
  },
  {
    id: "entra-id",
    name: "Microsoft Entra ID",
    category: "identity",
    type: "Service",
    synonyms: ["Azure AD", "identity federation"],
  },
  {
    id: "oauth2",
    name: "OAuth 2.0",
    category: "identity",
    type: "Standard",
    synonyms: ["OAuth"],
  },
  {
    id: "openid-connect",
    name: "OpenID Connect",
    category: "identity",
    type: "Standard",
    synonyms: ["OIDC"],
  },
  {
    id: "saml",
    name: "SAML 2.0",
    category: "identity",
    type: "Standard",
  },
  {
    id: "iam",
    name: "Identity and Access Management",
    category: "identity",
    type: "Practice",
    synonyms: ["IAM"],
  },
  {
    id: "react",
    name: "React",
    category: "frontend",
    type: "Framework",
    commonWith: ["typescript", "nextjs", "uswds", "css"],
  },
  {
    id: "nextjs",
    name: "Next.js",
    category: "frontend",
    type: "Framework",
  },
  {
    id: "typescript",
    name: "TypeScript",
    category: "frontend",
    type: "Language",
  },
  {
    id: "uswds",
    name: "USWDS Design System",
    category: "frontend",
    type: "Standard",
    synonyms: ["U.S. Web Design System"],
  },
  {
    id: "css",
    name: "CSS",
    category: "frontend",
    type: "Standard",
    synonyms: ["CSS3", "Cascading Style Sheets"],
  },
  {
    id: "python",
    name: "Python",
    category: "backend",
    type: "Language",
  },
  {
    id: "java",
    name: "Java",
    category: "backend",
    type: "Language",
  },
  {
    id: "go",
    name: "Go",
    category: "backend",
    type: "Language",
    synonyms: ["Golang"],
  },
  {
    id: "nodejs",
    name: "Node.js",
    category: "backend",
    type: "Runtime",
  },
  {
    id: "spring-boot",
    name: "Spring Boot",
    category: "backend",
    type: "Framework",
    commonWith: ["java"],
  },
  {
    id: "django",
    name: "Django",
    category: "backend",
    type: "Framework",
    commonWith: ["python"],
  },
  {
    id: "flask",
    name: "Flask",
    category: "backend",
    type: "Framework",
    commonWith: ["python"],
  },
  {
    id: "fastapi",
    name: "FastAPI",
    category: "backend",
    type: "Framework",
    commonWith: ["python"],
  },
  {
    id: "express",
    name: "Express.js",
    category: "backend",
    type: "Framework",
    commonWith: ["nodejs"],
  },
  {
    id: "grpc",
    name: "gRPC",
    category: "backend",
    type: "Standard",
  },
  {
    id: "multithreading",
    name: "Multithreading",
    category: "backend",
    type: "Technique",
  },
  {
    id: "microservices",
    name: "Microservices Architecture",
    category: "architecture",
    type: "Pattern",
    commonWith: ["kubernetes"],
  },
  {
    id: "loosely-coupled",
    name: "Loosely Coupled Architecture",
    category: "architecture",
    type: "Pattern",
  },
  {
    id: "two-tier-monolith",
    name: "Two-tier Monolith",
    category: "architecture",
    type: "Pattern",
  },
  {
    id: "object-oriented",
    name: "Object-oriented Programming",
    category: "architecture",
    type: "Practice",
  },
  {
    id: "state-machine-architecture",
    name: "Serverless State Machine Architecture",
    category: "architecture",
    type: "Pattern",
    tags: ["lambda", "sqs", "decoupled"],
    commonWith: ["aws-step-functions", "aws-lambda", "aws-sqs"],
  },
  {
    id: "feature-flags",
    name: "Feature Flags",
    category: "architecture",
    type: "Practice",
    commonWith: ["aws-appconfig"],
  },
  {
    id: "agile",
    name: "Agile Methodology",
    category: "architecture",
    type: "Methodology",
  },
  {
    id: "mvp",
    name: "MVP Delivery",
    category: "architecture",
    type: "Methodology",
    synonyms: ["Minimum Viable Product"],
  },
  {
    id: "dora-metrics",
    name: "DORA Metrics",
    category: "architecture",
    type: "Practice",
  },
  {
    id: "devsecops",
    name: "DevSecOps",
    category: "architecture",
    type: "Practice",
    commonWith: ["shift-left-security", "ci-cd"],
  },
  {
    id: "ci-cd",
    name: "CI/CD Pipelines",
    category: "architecture",
    type: "Practice",
    commonWith: ["jenkins", "github", "harness"],
  },
  {
    id: "okrs",
    name: "OKRs",
    category: "architecture",
    type: "Methodology",
    synonyms: ["Objectives and Key Results"],
  },
  {
    id: "aws-api-gateway",
    name: "AWS API Gateway",
    category: "integration",
    type: "Service",
    synonyms: ["API Gateway"],
    commonWith: ["openapi", "aws-lambda"],
  },
  {
    id: "openapi",
    name: "OpenAPI",
    category: "integration",
    type: "Standard",
    synonyms: ["Swagger"],
  },
  {
    id: "apigee",
    name: "Apigee",
    category: "integration",
    type: "Platform",
  },
  {
    id: "aws-sqs",
    name: "Amazon SQS",
    category: "integration",
    type: "Service",
    synonyms: ["SQS"],
    commonWith: ["aws-lambda", "aws-step-functions", "aws-sns", "kafka"],
  },
  {
    id: "aws-sns",
    name: "Amazon SNS",
    category: "integration",
    type: "Service",
    synonyms: ["SNS"],
    commonWith: ["aws-sqs", "aws-lambda"],
  },
  {
    id: "aws-eventbridge",
    name: "Amazon EventBridge",
    category: "integration",
    type: "Service",
    synonyms: ["EventBridge"],
    commonWith: ["aws-lambda", "aws-step-functions"],
  },
  {
    id: "aws-step-functions",
    name: "AWS Step Functions",
    category: "integration",
    type: "Service",
    synonyms: ["Step Functions"],
    commonWith: ["aws-lambda", "aws-sqs"],
  },
  {
    id: "aws-kinesis",
    name: "Amazon Kinesis",
    category: "integration",
    type: "Service",
    synonyms: ["Kinesis"],
    commonWith: ["kafka"],
  },
  {
    id: "kafka",
    name: "Kafka",
    category: "integration",
    type: "Platform",
    synonyms: ["Apache Kafka"],
    commonWith: ["aws-kinesis", "aws-msk"],
  },
  {
    id: "aws-msk",
    name: "Amazon MSK",
    category: "integration",
    type: "Service",
    parents: ["aws"],
    synonyms: ["MSK", "Managed Streaming for Kafka"],
    commonWith: ["kafka"],
  },
  {
    id: "rabbitmq",
    name: "RabbitMQ",
    category: "integration",
    type: "Platform",
  },
  {
    id: "istio",
    name: "Istio",
    category: "integration",
    type: "Tool",
    commonWith: ["kubernetes", "envoy"],
    tags: ["service-mesh"],
  },
  {
    id: "envoy",
    name: "Envoy Proxy",
    category: "integration",
    type: "Tool",
    commonWith: ["istio", "kubernetes"],
    tags: ["service-mesh", "proxy"],
  },
  {
    id: "unit-tests",
    name: "Unit Tests",
    category: "testing",
    type: "Test Type",
  },
  {
    id: "integration-tests",
    name: "Integration Tests",
    category: "testing",
    type: "Test Type",
  },
  {
    id: "e2e-tests",
    name: "End-to-end Tests",
    category: "testing",
    type: "Test Type",
  },
  {
    id: "load-tests",
    name: "Load and Performance Tests",
    category: "testing",
    type: "Test Type",
  },
  {
    id: "accessibility-tests",
    name: "Accessibility and 508 Tests",
    category: "testing",
    type: "Test Type",
  },
  {
    id: "ui-unit-tests",
    name: "UI Unit Tests",
    category: "testing",
    type: "Test Type",
  },
  {
    id: "data-tests",
    name: "Data Tests",
    category: "testing",
    type: "Test Type",
  },
  {
    id: "junit",
    name: "JUnit",
    category: "testing",
    type: "Tool",
    parents: ["unit-tests"],
  },
  {
    id: "cypress",
    name: "Cypress",
    category: "testing",
    type: "Tool",
    parents: ["e2e-tests"],
  },
  {
    id: "playwright",
    name: "Playwright",
    category: "testing",
    type: "Tool",
    parents: ["e2e-tests"],
  },
  {
    id: "selenium",
    name: "Selenium",
    category: "testing",
    type: "Tool",
    parents: ["e2e-tests"],
  },
  {
    id: "jmeter",
    name: "Apache JMeter",
    category: "testing",
    type: "Tool",
    parents: ["load-tests"],
  },
  {
    id: "locust",
    name: "Locust",
    category: "testing",
    type: "Tool",
    parents: ["load-tests"],
  },
  {
    id: "pytest",
    name: "pytest",
    category: "testing",
    type: "Tool",
    parents: ["unit-tests"],
  },
  {
    id: "aws-cloudwatch",
    name: "Amazon CloudWatch",
    category: "observability",
    type: "Service",
    synonyms: ["AWS CloudWatch", "CloudWatch", "Alarms"],
    commonWith: ["aws-cloudwatch-rum"],
  },
  {
    id: "aws-cloudwatch-rum",
    name: "CloudWatch RUM",
    category: "observability",
    type: "Service",
    parents: ["aws-cloudwatch"],
    synonyms: ["Real User Monitoring"],
  },
  {
    id: "aws-lambda-insights",
    name: "AWS Lambda Insights",
    category: "observability",
    type: "Service",
  },
  {
    id: "newrelic",
    name: "New Relic",
    category: "observability",
    type: "Tool",
    synonyms: ["NewRelic"],
  },
  {
    id: "splunk",
    name: "Splunk",
    category: "observability",
    type: "Tool",
  },
  {
    id: "grafana",
    name: "Grafana",
    category: "observability",
    type: "Tool",
  },
  {
    id: "grafana-loki",
    name: "Grafana Loki",
    category: "observability",
    type: "Tool",
    commonWith: ["grafana"],
    tags: ["logs"],
  },
  {
    id: "jaeger",
    name: "Jaeger",
    category: "observability",
    type: "Tool",
    commonWith: ["opentelemetry"],
    tags: ["tracing"],
  },
  {
    id: "grafana-tempo",
    name: "Grafana Tempo",
    category: "observability",
    type: "Tool",
    commonWith: ["grafana", "opentelemetry"],
    tags: ["tracing"],
  },
  {
    id: "grafana-alloy",
    name: "Grafana Alloy",
    category: "observability",
    type: "Tool",
    commonWith: ["grafana", "opentelemetry", "grafana-loki"],
    tags: ["telemetry-collector"],
  },
  {
    id: "kiali",
    name: "Kiali",
    category: "observability",
    type: "Tool",
    commonWith: ["istio"],
    tags: ["service-mesh", "topology"],
  },
  {
    id: "prometheus",
    name: "Prometheus",
    category: "observability",
    type: "Tool",
    commonWith: ["grafana"],
  },
  {
    id: "opentelemetry",
    name: "OpenTelemetry",
    category: "observability",
    type: "Standard",
    synonyms: ["OTel"],
  },
  {
    id: "fluent-bit",
    name: "Fluent Bit",
    category: "observability",
    type: "Tool",
    tags: ["logs"],
  },
  {
    id: "aws-xray",
    name: "AWS X-Ray",
    category: "observability",
    type: "Service",
    synonyms: ["X-Ray"],
  },
  {
    id: "jira",
    name: "Jira",
    category: "collaboration",
    type: "Tool",
  },
  {
    id: "confluence",
    name: "Confluence",
    category: "collaboration",
    type: "Tool",
  },
  {
    id: "teams",
    name: "Microsoft Teams",
    category: "collaboration",
    type: "Tool",
  },
  {
    id: "sharepoint",
    name: "SharePoint",
    category: "collaboration",
    type: "Tool",
  },
  {
    id: "mattermost",
    name: "Mattermost",
    category: "collaboration",
    type: "Tool",
    tags: ["messaging", "self-hosted"],
  },
  {
    id: "microsoft-365-gcc",
    name: "Microsoft 365 GCC",
    category: "collaboration",
    type: "Platform",
    synonyms: ["M365 GCC", "GCC High"],
    tags: ["fedramp", "government"],
  },
  {
    id: "servicenow-gcc",
    name: "ServiceNow GCC",
    category: "collaboration",
    type: "Platform",
    synonyms: ["ServiceNow Government"],
    tags: ["itsm", "fedramp", "government"],
  },
  {
    id: "salesforce-government-cloud",
    name: "Salesforce Government Cloud",
    category: "collaboration",
    type: "Platform",
    synonyms: ["Salesforce Gov Cloud"],
    tags: ["crm", "fedramp", "government"],
  },
  {
    id: "coder",
    name: "Coder",
    category: "ide",
    type: "Tool",
  },
  {
    id: "vs-code",
    name: "Visual Studio Code",
    category: "ide",
    type: "Tool",
    synonyms: ["VS Code"],
  },

  // ════════════════════════════════════════════════
  //  AZURE — AI & ML
  // ════════════════════════════════════════════════
  {
    id: "azure-machine-learning",
    name: "Azure Machine Learning",
    category: "ai-ml",
    type: "Platform",
    synonyms: ["Azure ML"],
    commonWith: ["azure-ml-studio", "azure-openai"],
  },
  {
    id: "azure-ml-studio",
    name: "Azure ML Studio",
    category: "ai-ml",
    type: "Tool",
    parents: ["azure-machine-learning"],
  },
  {
    id: "azure-ml-pipelines",
    name: "Azure ML Pipelines",
    category: "ai-ml",
    type: "Service",
    parents: ["azure-machine-learning"],
  },
  {
    id: "azure-openai",
    name: "Azure OpenAI Service",
    category: "ai-ml",
    type: "Service",
    synonyms: ["Azure OpenAI", "GPT on Azure"],
    commonWith: ["llms", "genai"],
  },
  {
    id: "azure-ai-document-intelligence",
    name: "Azure AI Document Intelligence",
    category: "ai-ml",
    type: "Service",
    synonyms: ["Form Recognizer"],
    tags: ["pdf", "ocr"],
  },
  {
    id: "azure-ai-language",
    name: "Azure AI Language",
    category: "ai-ml",
    type: "Service",
    synonyms: ["Azure Text Analytics"],
    tags: ["nlp"],
  },
  {
    id: "azure-ai-studio",
    name: "Azure AI Studio",
    category: "ai-ml",
    type: "Tool",
    synonyms: ["AI Studio"],
    commonWith: ["azure-openai", "azure-machine-learning"],
    tags: ["genai", "prompt-flow"],
  },

  // ════════════════════════════════════════════════
  //  AZURE — Data & Analytics
  // ════════════════════════════════════════════════
  {
    id: "azure-synapse",
    name: "Azure Synapse Analytics",
    category: "data-analytics",
    type: "Platform",
    synonyms: ["Synapse Analytics", "Synapse"],
    tags: ["warehouse", "spark"],
    commonWith: ["microsoft-fabric"],
  },
  {
    id: "azure-data-factory",
    name: "Azure Data Factory",
    category: "data-analytics",
    type: "Service",
    synonyms: ["ADF"],
    tags: ["etl"],
  },
  {
    id: "azure-databricks",
    name: "Azure Databricks",
    category: "data-analytics",
    type: "Platform",
    synonyms: ["Databricks on Azure"],
    commonWith: ["apache-spark"],
    tags: ["spark"],
  },
  {
    id: "azure-data-lake-storage",
    name: "Azure Data Lake Storage",
    category: "data-analytics",
    type: "Service",
    synonyms: ["ADLS", "ADLS Gen2"],
    commonWith: ["azure-blob-storage"],
  },
  {
    id: "azure-hdinsight",
    name: "Azure HDInsight",
    category: "data-analytics",
    type: "Service",
    synonyms: ["HDInsight"],
    commonWith: ["apache-spark"],
  },
  {
    id: "azure-cosmos-db",
    name: "Azure Cosmos DB",
    category: "data-analytics",
    type: "DataStore",
    synonyms: ["Cosmos DB"],
    tags: ["nosql", "multi-model", "global-distribution"],
  },
  {
    id: "azure-sql-database",
    name: "Azure SQL Database",
    category: "data-analytics",
    type: "DataStore",
    synonyms: ["Azure SQL"],
    tags: ["relational"],
  },
  {
    id: "azure-cache-redis",
    name: "Azure Cache for Redis",
    category: "data-analytics",
    type: "Service",
    synonyms: ["Azure Redis"],
    tags: ["cache"],
  },
  {
    id: "microsoft-fabric",
    name: "Microsoft Fabric",
    category: "data-analytics",
    type: "Platform",
    synonyms: ["Fabric"],
    commonWith: ["azure-synapse", "powerbi"],
    tags: ["warehouse", "lakehouse", "data-engineering"],
  },
  {
    id: "microsoft-purview",
    name: "Microsoft Purview",
    category: "data-analytics",
    type: "Service",
    synonyms: ["Purview", "Azure Purview"],
    tags: ["governance", "data-catalog", "lineage"],
  },

  // ════════════════════════════════════════════════
  //  AZURE — Cloud & Infrastructure
  // ════════════════════════════════════════════════
  {
    id: "azure",
    name: "Microsoft Azure",
    category: "cloud-infra",
    type: "Platform",
    synonyms: ["Azure"],
    commonWith: ["azure-virtual-machines", "azure-vnet", "azure-blob-storage"],
  },
  {
    id: "azure-management-groups",
    name: "Azure Management Groups",
    category: "cloud-infra",
    type: "Service",
    parents: ["azure"],
    synonyms: ["Management Groups"],
    commonWith: ["azure-landing-zones"],
  },
  {
    id: "azure-landing-zones",
    name: "Azure Landing Zones",
    category: "cloud-infra",
    type: "Practice",
    synonyms: ["ALZ", "Enterprise-Scale Landing Zone"],
    commonWith: ["azure-management-groups", "azure-policy"],
  },
  {
    id: "azure-functions",
    name: "Azure Functions",
    category: "cloud-infra",
    type: "Service",
    parents: ["azure"],
    synonyms: ["Functions"],
    commonWith: ["azure-api-management", "azure-logic-apps"],
  },
  {
    id: "azure-batch",
    name: "Azure Batch",
    category: "cloud-infra",
    type: "Service",
    parents: ["azure"],
    tags: ["batch", "hpc"],
  },
  {
    id: "azure-container-apps",
    name: "Azure Container Apps",
    category: "cloud-infra",
    type: "Service",
    parents: ["azure"],
    synonyms: ["Container Apps"],
    commonWith: ["azure-kubernetes-service"],
  },
  {
    id: "azure-container-registry",
    name: "Azure Container Registry",
    category: "cloud-infra",
    type: "Service",
    parents: ["azure"],
    synonyms: ["ACR"],
    commonWith: ["docker", "azure-kubernetes-service"],
  },
  {
    id: "azure-kubernetes-service",
    name: "Azure Kubernetes Service",
    category: "cloud-infra",
    type: "Service",
    parents: ["azure"],
    synonyms: ["AKS"],
    commonWith: ["kubernetes", "docker"],
  },
  {
    id: "azure-virtual-machines",
    name: "Azure Virtual Machines",
    category: "cloud-infra",
    type: "Service",
    parents: ["azure"],
    synonyms: ["Azure VMs"],
  },
  {
    id: "azure-vnet",
    name: "Azure Virtual Network",
    category: "cloud-infra",
    type: "Service",
    parents: ["azure"],
    synonyms: ["VNet"],
    commonWith: ["azure-nsg"],
  },
  {
    id: "azure-nsg",
    name: "Azure Network Security Groups",
    category: "cloud-infra",
    type: "Service",
    parents: ["azure"],
    synonyms: ["NSG"],
    commonWith: ["azure-vnet"],
  },
  {
    id: "azure-application-gateway",
    name: "Azure Application Gateway",
    category: "cloud-infra",
    type: "Service",
    parents: ["azure"],
    synonyms: ["App Gateway"],
    commonWith: ["azure-waf"],
  },
  {
    id: "azure-load-balancer",
    name: "Azure Load Balancer",
    category: "cloud-infra",
    type: "Service",
    parents: ["azure"],
    commonWith: ["azure-application-gateway"],
  },
  {
    id: "azure-front-door",
    name: "Azure Front Door",
    category: "cloud-infra",
    type: "Service",
    parents: ["azure"],
    synonyms: ["Front Door"],
    commonWith: ["azure-waf"],
  },
  {
    id: "azure-dns",
    name: "Azure DNS",
    category: "cloud-infra",
    type: "Service",
    parents: ["azure"],
  },
  {
    id: "azure-blob-storage",
    name: "Azure Blob Storage",
    category: "cloud-infra",
    type: "Service",
    parents: ["azure"],
    synonyms: ["Blob Storage"],
  },
  {
    id: "azure-files",
    name: "Azure Files",
    category: "cloud-infra",
    type: "Service",
    parents: ["azure"],
    synonyms: ["Azure File Shares"],
  },
  {
    id: "azure-sql-managed-instance",
    name: "Azure SQL Managed Instance",
    category: "cloud-infra",
    type: "Service",
    parents: ["azure"],
    synonyms: ["SQL MI"],
    commonWith: ["azure-sql-database"],
  },
  {
    id: "azure-app-configuration",
    name: "Azure App Configuration",
    category: "cloud-infra",
    type: "Service",
    parents: ["azure"],
    commonWith: ["feature-flags"],
  },
  {
    id: "azure-key-vault",
    name: "Azure Key Vault",
    category: "cloud-infra",
    type: "Service",
    parents: ["azure"],
    synonyms: ["Key Vault"],
    commonWith: ["azure-managed-identity"],
  },
  {
    id: "azure-virtual-wan",
    name: "Azure Virtual WAN",
    category: "cloud-infra",
    type: "Service",
    parents: ["azure"],
    synonyms: ["vWAN"],
    commonWith: ["azure-vnet"],
  },
  {
    id: "azure-expressroute",
    name: "Azure ExpressRoute",
    category: "cloud-infra",
    type: "Service",
    parents: ["azure"],
    synonyms: ["ExpressRoute"],
  },
  {
    id: "azure-private-link",
    name: "Azure Private Link",
    category: "cloud-infra",
    type: "Service",
    parents: ["azure"],
    synonyms: ["Private Endpoints"],
    commonWith: ["azure-vnet"],
  },
  {
    id: "azure-backup",
    name: "Azure Backup",
    category: "cloud-infra",
    type: "Service",
    parents: ["azure"],
  },
  {
    id: "azure-cost-management",
    name: "Azure Cost Management",
    category: "cloud-infra",
    type: "Tool",
    parents: ["azure"],
    synonyms: ["Cost Management + Billing"],
  },
  {
    id: "azure-managed-applications",
    name: "Azure Managed Applications",
    category: "cloud-infra",
    type: "Service",
    parents: ["azure"],
  },

  // ════════════════════════════════════════════════
  //  AZURE — DevOps
  // ════════════════════════════════════════════════
  {
    id: "azure-devops",
    name: "Azure DevOps",
    category: "devops",
    type: "Platform",
    synonyms: ["ADO", "Azure DevOps Services"],
    commonWith: ["azure-pipelines"],
  },
  {
    id: "azure-pipelines",
    name: "Azure Pipelines",
    category: "devops",
    type: "Service",
    parents: ["azure-devops"],
    commonWith: ["azure-devops"],
  },
  {
    id: "azure-resource-manager",
    name: "Azure Resource Manager",
    category: "devops",
    type: "Service",
    synonyms: ["ARM", "ARM Templates"],
    commonWith: ["azure-bicep", "terraform"],
  },
  {
    id: "azure-bicep",
    name: "Bicep",
    category: "devops",
    type: "Tool",
    synonyms: ["Azure Bicep"],
    commonWith: ["azure-resource-manager", "terraform"],
    tags: ["iac"],
  },

  // ════════════════════════════════════════════════
  //  AZURE — Security
  // ════════════════════════════════════════════════
  {
    id: "azure-defender-for-cloud",
    name: "Microsoft Defender for Cloud",
    category: "security",
    type: "Service",
    synonyms: ["Azure Security Center", "Defender for Cloud"],
    commonWith: ["azure-sentinel"],
  },
  {
    id: "azure-sentinel",
    name: "Microsoft Sentinel",
    category: "security",
    type: "Service",
    synonyms: ["Azure Sentinel"],
    commonWith: ["azure-defender-for-cloud", "azure-log-analytics"],
  },
  {
    id: "azure-policy",
    name: "Azure Policy",
    category: "security",
    type: "Service",
    synonyms: ["Policy"],
    commonWith: ["azure-management-groups"],
  },
  {
    id: "azure-waf",
    name: "Azure WAF",
    category: "security",
    type: "Service",
    synonyms: ["Web Application Firewall"],
    commonWith: ["azure-front-door", "azure-application-gateway"],
  },
  {
    id: "azure-ddos-protection",
    name: "Azure DDoS Protection",
    category: "security",
    type: "Service",
    commonWith: ["azure-waf"],
  },
  {
    id: "azure-firewall",
    name: "Azure Firewall",
    category: "security",
    type: "Service",
    parents: ["azure"],
    commonWith: ["azure-vnet"],
  },

  // ════════════════════════════════════════════════
  //  AZURE — Identity
  // ════════════════════════════════════════════════
  {
    id: "azure-managed-identity",
    name: "Azure Managed Identity",
    category: "identity",
    type: "Service",
    parents: ["entra-id"],
    commonWith: ["azure-key-vault"],
  },
  {
    id: "azure-ad-b2c",
    name: "Azure AD B2C",
    category: "identity",
    type: "Service",
    synonyms: ["Entra External ID"],
    commonWith: ["entra-id", "oauth2", "openid-connect"],
  },

  // ════════════════════════════════════════════════
  //  AZURE — Integration
  // ════════════════════════════════════════════════
  {
    id: "azure-api-management",
    name: "Azure API Management",
    category: "integration",
    type: "Service",
    synonyms: ["APIM"],
    commonWith: ["openapi", "azure-functions"],
  },
  {
    id: "azure-service-bus",
    name: "Azure Service Bus",
    category: "integration",
    type: "Service",
    synonyms: ["Service Bus"],
    commonWith: ["azure-event-grid"],
  },
  {
    id: "azure-event-grid",
    name: "Azure Event Grid",
    category: "integration",
    type: "Service",
    synonyms: ["Event Grid"],
    commonWith: ["azure-functions", "azure-logic-apps"],
  },
  {
    id: "azure-event-hubs",
    name: "Azure Event Hubs",
    category: "integration",
    type: "Service",
    synonyms: ["Event Hubs"],
    commonWith: ["kafka"],
    tags: ["streaming"],
  },
  {
    id: "azure-logic-apps",
    name: "Azure Logic Apps",
    category: "integration",
    type: "Service",
    synonyms: ["Logic Apps"],
    commonWith: ["azure-functions"],
  },
  {
    id: "azure-stream-analytics",
    name: "Azure Stream Analytics",
    category: "integration",
    type: "Service",
    commonWith: ["azure-event-hubs"],
    tags: ["streaming"],
  },

  // ════════════════════════════════════════════════
  //  AZURE — Observability
  // ════════════════════════════════════════════════
  {
    id: "azure-monitor",
    name: "Azure Monitor",
    category: "observability",
    type: "Service",
    synonyms: ["Monitor"],
    commonWith: ["azure-application-insights", "azure-log-analytics"],
  },
  {
    id: "azure-application-insights",
    name: "Azure Application Insights",
    category: "observability",
    type: "Service",
    parents: ["azure-monitor"],
    synonyms: ["App Insights"],
  },
  {
    id: "azure-log-analytics",
    name: "Azure Log Analytics",
    category: "observability",
    type: "Service",
    parents: ["azure-monitor"],
    synonyms: ["Log Analytics Workspace"],
    tags: ["kql"],
  },

  // ════════════════════════════════════════════════
  //  GCP — AI & ML
  // ════════════════════════════════════════════════
  {
    id: "gcp-vertex-ai",
    name: "Google Vertex AI",
    category: "ai-ml",
    type: "Platform",
    synonyms: ["Vertex AI"],
    commonWith: ["gcp-vertex-ai-workbench", "gcp-vertex-ai-studio"],
  },
  {
    id: "gcp-vertex-ai-workbench",
    name: "Vertex AI Workbench",
    category: "ai-ml",
    type: "Tool",
    parents: ["gcp-vertex-ai"],
  },
  {
    id: "gcp-vertex-ai-pipelines",
    name: "Vertex AI Pipelines",
    category: "ai-ml",
    type: "Service",
    parents: ["gcp-vertex-ai"],
  },
  {
    id: "gcp-vertex-ai-studio",
    name: "Vertex AI Studio",
    category: "ai-ml",
    type: "Tool",
    parents: ["gcp-vertex-ai"],
    commonWith: ["llms", "genai"],
    tags: ["genai", "prompt-design"],
  },
  {
    id: "gcp-document-ai",
    name: "Google Document AI",
    category: "ai-ml",
    type: "Service",
    synonyms: ["Document AI"],
    tags: ["pdf", "ocr"],
  },
  {
    id: "gcp-natural-language-api",
    name: "Google Cloud Natural Language API",
    category: "ai-ml",
    type: "Service",
    synonyms: ["Natural Language API"],
    tags: ["nlp"],
  },

  // ════════════════════════════════════════════════
  //  GCP — Data & Analytics
  // ════════════════════════════════════════════════
  {
    id: "gcp-bigquery",
    name: "Google BigQuery",
    category: "data-analytics",
    type: "Platform",
    synonyms: ["BigQuery", "BQ"],
    tags: ["warehouse", "serverless"],
  },
  {
    id: "gcp-dataflow",
    name: "Google Cloud Dataflow",
    category: "data-analytics",
    type: "Service",
    synonyms: ["Dataflow"],
    tags: ["etl", "streaming"],
  },
  {
    id: "gcp-dataproc",
    name: "Google Cloud Dataproc",
    category: "data-analytics",
    type: "Service",
    synonyms: ["Dataproc"],
    commonWith: ["apache-spark"],
  },
  {
    id: "gcp-data-fusion",
    name: "Google Cloud Data Fusion",
    category: "data-analytics",
    type: "Service",
    synonyms: ["Data Fusion"],
    tags: ["etl"],
  },
  {
    id: "gcp-dataplex",
    name: "Google Dataplex",
    category: "data-analytics",
    type: "Service",
    synonyms: ["Dataplex"],
    tags: ["governance", "data-catalog"],
  },
  {
    id: "gcp-cloud-sql",
    name: "Google Cloud SQL",
    category: "data-analytics",
    type: "DataStore",
    synonyms: ["Cloud SQL"],
    tags: ["relational"],
  },
  {
    id: "gcp-cloud-spanner",
    name: "Google Cloud Spanner",
    category: "data-analytics",
    type: "DataStore",
    synonyms: ["Cloud Spanner", "Spanner"],
    tags: ["relational", "global-distribution"],
  },
  {
    id: "gcp-bigtable",
    name: "Google Cloud Bigtable",
    category: "data-analytics",
    type: "DataStore",
    synonyms: ["Bigtable"],
    tags: ["nosql", "wide-column"],
  },
  {
    id: "gcp-firestore",
    name: "Google Firestore",
    category: "data-analytics",
    type: "DataStore",
    synonyms: ["Firestore"],
    tags: ["nosql", "document", "serverless"],
  },
  {
    id: "gcp-memorystore",
    name: "Google Cloud Memorystore",
    category: "data-analytics",
    type: "Service",
    synonyms: ["Memorystore"],
    tags: ["cache", "redis"],
  },
  {
    id: "gcp-looker",
    name: "Google Looker",
    category: "data-analytics",
    type: "Tool",
    synonyms: ["Looker on GCP"],
    commonWith: ["looker"],
  },
  {
    id: "gcp-data-catalog",
    name: "Google Data Catalog",
    category: "data-analytics",
    type: "Service",
    synonyms: ["Data Catalog"],
    tags: ["governance", "metadata"],
  },

  // ════════════════════════════════════════════════
  //  GCP — Cloud & Infrastructure
  // ════════════════════════════════════════════════
  {
    id: "gcp",
    name: "Google Cloud Platform",
    category: "cloud-infra",
    type: "Platform",
    synonyms: ["GCP"],
    commonWith: ["gcp-compute-engine", "gcp-vpc", "gcp-cloud-storage"],
  },
  {
    id: "gcp-resource-manager",
    name: "Google Cloud Resource Manager",
    category: "cloud-infra",
    type: "Service",
    parents: ["gcp"],
    synonyms: ["Resource Manager"],
    commonWith: ["gcp-organization-policy"],
  },
  {
    id: "gcp-cloud-functions",
    name: "Google Cloud Functions",
    category: "cloud-infra",
    type: "Service",
    parents: ["gcp"],
    synonyms: ["Cloud Functions"],
    commonWith: ["gcp-cloud-run"],
  },
  {
    id: "gcp-cloud-run",
    name: "Google Cloud Run",
    category: "cloud-infra",
    type: "Service",
    parents: ["gcp"],
    synonyms: ["Cloud Run"],
    commonWith: ["gcp-cloud-functions", "docker"],
  },
  {
    id: "gcp-cloud-batch",
    name: "Google Cloud Batch",
    category: "cloud-infra",
    type: "Service",
    parents: ["gcp"],
    tags: ["batch", "hpc"],
  },
  {
    id: "gcp-artifact-registry",
    name: "Google Artifact Registry",
    category: "cloud-infra",
    type: "Service",
    parents: ["gcp"],
    synonyms: ["Artifact Registry"],
    commonWith: ["docker", "gcp-gke"],
  },
  {
    id: "gcp-gke",
    name: "Google Kubernetes Engine",
    category: "cloud-infra",
    type: "Service",
    parents: ["gcp"],
    synonyms: ["GKE"],
    commonWith: ["kubernetes", "docker"],
  },
  {
    id: "gcp-compute-engine",
    name: "Google Compute Engine",
    category: "cloud-infra",
    type: "Service",
    parents: ["gcp"],
    synonyms: ["GCE", "Compute Engine"],
  },
  {
    id: "gcp-vpc",
    name: "Google Cloud VPC",
    category: "cloud-infra",
    type: "Service",
    parents: ["gcp"],
    synonyms: ["VPC Network"],
    commonWith: ["gcp-firewall-rules"],
  },
  {
    id: "gcp-firewall-rules",
    name: "Google Cloud Firewall Rules",
    category: "cloud-infra",
    type: "Service",
    parents: ["gcp"],
    commonWith: ["gcp-vpc"],
  },
  {
    id: "gcp-cloud-load-balancing",
    name: "Google Cloud Load Balancing",
    category: "cloud-infra",
    type: "Service",
    parents: ["gcp"],
    synonyms: ["Cloud Load Balancing", "GCLB"],
  },
  {
    id: "gcp-cloud-cdn",
    name: "Google Cloud CDN",
    category: "cloud-infra",
    type: "Service",
    parents: ["gcp"],
    synonyms: ["Cloud CDN"],
    commonWith: ["gcp-cloud-load-balancing"],
  },
  {
    id: "gcp-cloud-dns",
    name: "Google Cloud DNS",
    category: "cloud-infra",
    type: "Service",
    parents: ["gcp"],
    synonyms: ["Cloud DNS"],
  },
  {
    id: "gcp-cloud-storage",
    name: "Google Cloud Storage",
    category: "cloud-infra",
    type: "Service",
    parents: ["gcp"],
    synonyms: ["GCS"],
  },
  {
    id: "gcp-filestore",
    name: "Google Cloud Filestore",
    category: "cloud-infra",
    type: "Service",
    parents: ["gcp"],
    synonyms: ["Filestore"],
  },
  {
    id: "gcp-cloud-interconnect",
    name: "Google Cloud Interconnect",
    category: "cloud-infra",
    type: "Service",
    parents: ["gcp"],
    synonyms: ["Dedicated Interconnect", "Partner Interconnect"],
  },
  {
    id: "gcp-private-service-connect",
    name: "Google Private Service Connect",
    category: "cloud-infra",
    type: "Service",
    parents: ["gcp"],
    synonyms: ["Private Service Connect"],
    commonWith: ["gcp-vpc"],
  },
  {
    id: "gcp-backup-dr",
    name: "Google Cloud Backup and DR",
    category: "cloud-infra",
    type: "Service",
    parents: ["gcp"],
  },
  {
    id: "gcp-cost-management",
    name: "Google Cloud Cost Management",
    category: "cloud-infra",
    type: "Tool",
    parents: ["gcp"],
    synonyms: ["Cloud Billing"],
  },

  // ════════════════════════════════════════════════
  //  GCP — DevOps
  // ════════════════════════════════════════════════
  {
    id: "gcp-cloud-build",
    name: "Google Cloud Build",
    category: "devops",
    type: "Service",
    synonyms: ["Cloud Build"],
  },
  {
    id: "gcp-cloud-deploy",
    name: "Google Cloud Deploy",
    category: "devops",
    type: "Service",
    synonyms: ["Cloud Deploy"],
    commonWith: ["gcp-cloud-build", "gcp-gke"],
  },
  {
    id: "gcp-deployment-manager",
    name: "Google Cloud Deployment Manager",
    category: "devops",
    type: "Service",
    synonyms: ["Deployment Manager"],
    commonWith: ["terraform"],
    tags: ["iac"],
  },

  // ════════════════════════════════════════════════
  //  GCP — Security
  // ════════════════════════════════════════════════
  {
    id: "gcp-security-command-center",
    name: "Google Security Command Center",
    category: "security",
    type: "Service",
    synonyms: ["SCC", "Security Command Center"],
    commonWith: ["gcp-chronicle"],
  },
  {
    id: "gcp-chronicle",
    name: "Google Chronicle",
    category: "security",
    type: "Service",
    synonyms: ["Chronicle SIEM"],
    commonWith: ["gcp-security-command-center"],
  },
  {
    id: "gcp-cloud-armor",
    name: "Google Cloud Armor",
    category: "security",
    type: "Service",
    synonyms: ["Cloud Armor"],
    commonWith: ["gcp-cloud-load-balancing"],
  },
  {
    id: "gcp-kms",
    name: "Google Cloud KMS",
    category: "security",
    type: "Service",
    synonyms: ["Cloud KMS"],
    commonWith: ["gcp-secret-manager"],
  },
  {
    id: "gcp-secret-manager",
    name: "Google Secret Manager",
    category: "security",
    type: "Service",
    synonyms: ["Secret Manager"],
    commonWith: ["gcp-kms"],
  },
  {
    id: "gcp-certificate-manager",
    name: "Google Certificate Manager",
    category: "security",
    type: "Service",
    commonWith: ["gcp-cloud-load-balancing"],
  },
  {
    id: "gcp-organization-policy",
    name: "Google Cloud Organization Policy",
    category: "security",
    type: "Service",
    synonyms: ["Org Policy"],
    commonWith: ["gcp-resource-manager"],
  },
  {
    id: "gcp-binary-authorization",
    name: "Google Binary Authorization",
    category: "security",
    type: "Service",
    synonyms: ["Binary Authorization"],
    commonWith: ["gcp-gke"],
  },

  // ════════════════════════════════════════════════
  //  GCP — Identity
  // ════════════════════════════════════════════════
  {
    id: "gcp-cloud-iam",
    name: "Google Cloud IAM",
    category: "identity",
    type: "Service",
    parents: ["iam"],
    synonyms: ["Cloud IAM"],
    commonWith: ["gcp-identity-platform"],
  },
  {
    id: "gcp-identity-platform",
    name: "Google Identity Platform",
    category: "identity",
    type: "Service",
    synonyms: ["Identity Platform"],
    commonWith: ["oauth2", "openid-connect", "gcp-cloud-iam"],
  },

  // ════════════════════════════════════════════════
  //  GCP — Integration
  // ════════════════════════════════════════════════
  {
    id: "gcp-apigee",
    name: "Google Cloud Apigee",
    category: "integration",
    type: "Platform",
    synonyms: ["Apigee on GCP"],
    commonWith: ["apigee", "openapi"],
  },
  {
    id: "gcp-cloud-tasks",
    name: "Google Cloud Tasks",
    category: "integration",
    type: "Service",
    synonyms: ["Cloud Tasks"],
  },
  {
    id: "gcp-pubsub",
    name: "Google Cloud Pub/Sub",
    category: "integration",
    type: "Service",
    synonyms: ["Pub/Sub"],
    commonWith: ["kafka"],
  },
  {
    id: "gcp-workflows",
    name: "Google Cloud Workflows",
    category: "integration",
    type: "Service",
    synonyms: ["Workflows"],
    commonWith: ["gcp-cloud-functions"],
  },
  {
    id: "gcp-datastream",
    name: "Google Cloud Datastream",
    category: "integration",
    type: "Service",
    synonyms: ["Datastream"],
    tags: ["cdc", "replication"],
  },
  {
    id: "gcp-eventarc",
    name: "Google Eventarc",
    category: "integration",
    type: "Service",
    synonyms: ["Eventarc"],
    commonWith: ["gcp-cloud-run", "gcp-workflows"],
  },

  // ════════════════════════════════════════════════
  //  GCP — Observability
  // ════════════════════════════════════════════════
  {
    id: "gcp-cloud-monitoring",
    name: "Google Cloud Monitoring",
    category: "observability",
    type: "Service",
    synonyms: ["Cloud Monitoring", "Stackdriver Monitoring"],
    commonWith: ["gcp-cloud-logging", "gcp-cloud-trace"],
  },
  {
    id: "gcp-cloud-logging",
    name: "Google Cloud Logging",
    category: "observability",
    type: "Service",
    synonyms: ["Cloud Logging", "Stackdriver Logging"],
    tags: ["logs"],
  },
  {
    id: "gcp-cloud-trace",
    name: "Google Cloud Trace",
    category: "observability",
    type: "Service",
    synonyms: ["Cloud Trace", "Stackdriver Trace"],
    tags: ["tracing"],
  },
  {
    id: "gcp-cloud-profiler",
    name: "Google Cloud Profiler",
    category: "observability",
    type: "Service",
    synonyms: ["Cloud Profiler"],
    tags: ["profiling"],
  },
];

export const enrichItems = (rawItemList, descriptions) =>
  rawItemList.map((item) => ({
    ...item,
    description: descriptions[item.id],
    tags: buildTags(item),
  }));

export const items = enrichItems(rawItems, descriptionById);
