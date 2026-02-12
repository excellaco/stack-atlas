# Roadmap

Future enhancements organized by persona grouping, prioritized within each group by value-to-effort ratio. Low-effort metadata and tagging features are prioritized first because they unlock reporting and BD value from data that already exists in Stack Atlas.

## Portfolio Visibility (CTO / Leadership)

- [ ] **Project metadata** — Add contract name, client industry, team size, engagement dates, and status (active/completed/pursuit) to each project. Enables filtering like "show me all active DoD projects using Kubernetes." _Low effort._
- [ ] **Utilization signals** — Tag catalog items per project as "deep experience", "evaluated", or "inherited from client" to distinguish deliberate choices from client mandates. _Low effort._
- [ ] **Technology lifecycle rings** — Adopt / Trial / Assess / Hold classification per catalog item, layered on top of the existing catalog. Visual radar view for technology governance. _Low effort._
- [ ] **Capability matrix export** — Auto-generated grid of technologies x projects with checkmarks, exportable as PDF or spreadsheet. The most-requested artifact from leadership. _Medium effort._
- [ ] **Cross-project dashboard** — Aggregate view showing technology adoption across all projects with trend over time. Which technologies appear in 1 project vs. 10? _Medium effort._
- [ ] **Technology adoption over time** — Chart how technology use changes across the organization over time. Each commit already stores a full snapshot (`CommitSnapshot` with stack, providers, and subsystems), so the data exists — this is a visualization and aggregation layer. Show adoption curves per technology, identify what's growing vs. declining, and surface inflection points (e.g. "3 projects added Terraform in Q2"). Drives hiring, training, and governance decisions. _Medium effort._
- [ ] **Risk concentration report** — Flag technologies used on only one project or known by only one team. Identifies single-points-of-failure in the portfolio. _Medium effort._

## Reduce Friction (Tech Lead / Engineering)

- [ ] **Stack templates** — Pre-built starter stacks ("Standard AWS Serverless", "GovCloud Baseline") that a tech lead can fork and customize. Reduces initial setup from 30 minutes to 2 minutes. _Low effort._
- [ ] **Notes per selection** — Free-text annotation on why a technology was chosen or how it's used (e.g. "PostgreSQL — used for event sourcing, not just CRUD"). Captures context that flat checkboxes lose. _Low effort._
- [ ] **Bulk edit / paste** — Paste a list of technology names and match them to catalog items. Faster than clicking 50 checkboxes when onboarding a project. _Low effort._
- [ ] **Sandbox improvements** — Let unauthenticated users build and export a stack without an account, with an optional "claim" flow to save it later. Lowers the barrier to first use. _Low effort._
- [ ] **Stack at point in time** — View any project's stack as it existed on a specific date. User picks a date (e.g. "Oct 10, 2023"); the system finds the most recent commit with `timestamp ≤` that date and renders its `CommitSnapshot` as a read-only stack view with the same category grouping and hierarchy as the live editor. Each commit already stores a full snapshot (stack items, providers, subsystem additions/exclusions), so no backend changes are needed — just a date picker and a timestamp filter. Also enables "diff between any two dates" for change tracking over arbitrary periods. _Low effort._
- [ ] **Comparison view** — Side-by-side diff of two projects' stacks, highlighting overlap and divergence. Useful when inheriting a project or aligning two teams. _Medium effort._
- [ ] **Diff notifications** — When the catalog is updated (new items, deprecated items), notify project editors that their stack may need review. Keeps stacks current without periodic audits. _Medium effort._
- [ ] **Repository scanning** — Connect a GitHub repo, auto-detect stack from package.json, go.mod, Dockerfile, terraform files, CI configs. Present for confirmation, not data entry. Eliminates the #1 adoption killer: manual population. _High effort._

## Win Proposals (Business Development / Pre-Sales)

- [ ] **Industry / domain tags** — Tag projects by sector (DoD, HHS, financial, etc.) so BD can filter past performance by both technology and domain. RFPs require "relevant experience" — relevance = technology + domain. _Low effort._
- [ ] **Case study linking** — Attach case study URLs or summaries to projects so BD can find relevant past performance by technology. Bridges the gap between "we've used it" and "here's proof." _Low effort._
- [ ] **Public project view** — Sanitized, client-approved version of a project stack that can be shared in proposals or on the company website. BD needs shareable artifacts, not internal admin screens. _Medium effort._
- [ ] **Capability narrative export** — For each technology, auto-generate a paragraph: "Excella has deployed [X] across [N] engagements in [industries], including [notable projects]." The exact prose BD teams write manually for every proposal. _Medium effort._
- [ ] **RFP gap analysis** — Paste or upload RFP technology requirements, get instant coverage map: green (have depth), yellow (limited experience), red (gap). Answers "can we bid on this?" in minutes instead of days. _High effort._
- [ ] **Team profile generation** — Given a project's stack, suggest team members with matching experience and generate proposal-ready bios. The most time-consuming part of proposal writing. _High effort._

## Platform (Cross-cutting)

- [ ] **SSO (Entra ID)** — Federate Microsoft 365 sign-in into Cognito. Eliminates a separate credential and makes adoption frictionless. _Medium effort. Already planned._
- [ ] **Tagging taxonomy** — Extend the existing tag system beyond cloud providers to include maturity (production/pilot/evaluating), domain (frontend/backend/infra/data), and compliance (FedRAMP/IL4/HIPAA). _Low effort._
- [ ] **Catalog versioning UI** — Track catalog changes over time with diffs. S3 versioning is the storage layer; this is the UI to browse and compare past catalog states. _Medium effort._
- [ ] **API access** — RESTful API for reading projects, stacks, and catalog data programmatically. Enables integration with PSA tools, proposal systems, and internal dashboards. _Medium effort._
- [ ] **Notifications** — Email or Slack digest when projects are committed, catalog is updated, or a stack hasn't been touched in N days. Combats staleness — the #1 failure mode of every tool in this space. _Medium effort._

## Catalog Maintenance

- [ ] **User addition requests** — Non-admin users can submit a request to add a technology to the catalog (name, category, why they need it). Requests queue in the admin panel for approval/rejection. Approved items are added to the catalog automatically. Keeps the catalog admin-governed while letting the organization surface real needs. Prevents the "it's not in the catalog so I can't accurately represent my stack" problem. _Low effort._
- [ ] **LLM-assisted catalog enrichment** — Given a catalog item name, use an LLM to draft the description, suggest tags, infer the category and type, find synonyms, and suggest parent/child relationships. Admin reviews and accepts/edits the suggestions. Reduces the effort of maintaining 200+ item descriptions from hours to minutes. Could also power: duplicate detection ("Postgres" vs "PostgreSQL"), staleness alerts ("AngularJS" hasn't been selected in 12 months — move to Hold?), and bulk enrichment of items that have no description. _Medium effort._
- [ ] **Catalog import from repository** — Scan a project's dependency files and suggest catalog items to add for technologies not yet in the catalog. Complements the per-project repository scanning feature by growing the catalog itself based on real usage. _Medium effort._
