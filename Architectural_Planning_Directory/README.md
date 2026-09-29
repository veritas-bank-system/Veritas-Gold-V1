# Veritas — Architectural Planning Directory

**Purpose:** Central topic-organized home for Veritas architecture, product/workflow, security/compliance, standards, testing, deployment, and historical planning material.

**Reviewed:** 2026-09-28. **Current implementation-status baseline:** [`00-overview-and-governance/veritas_bank_program_overview_and_step_by_step_roadmap.md`](00-overview-and-governance/veritas_bank_program_overview_and_step_by_step_roadmap.md).

> This directory is a planning library, not evidence of production readiness or authorization. A design, mock screen, historical changelog, test pass, or copied document does not prove a described feature is implemented, compliant, deployed, or connected to real financial services. Follow the evidence and sandbox boundaries in the roadmap.

## Topics

### 00 — Overview and governance
- [`veritas_bank_program_overview_and_step_by_step_roadmap.md`](00-overview-and-governance/veritas_bank_program_overview_and_step_by_step_roadmap.md) — current repo inventory, verified findings, risks, compliance applicability, tests, operations, and staged delivery gates.
- [`veritas-institutional-ledger-production-spec.md`](00-overview-and-governance/veritas-institutional-ledger-production-spec.md) — target product and operating-boundary specification.
- [`icp_backend_institutional_advantages_and_investor_mvp_checklist.md`](00-overview-and-governance/icp_backend_institutional_advantages_and_investor_mvp_checklist.md) — historical strategic/MVP proposal; claims require independent evidence.
- [`README.md`](00-overview-and-governance/README.md) — copied root README snapshot; implementation claims are not verified by the copy.

### 01 — Architecture and domain
- [`p0-current-architecture-status.md`](01-architecture-and-domain/p0-current-architecture-status.md) — evidence-based reconciliation of legacy architecture claims against current manifests and source; originals preserved.
- [`master_platform_architecture_and_working_inventory.md`](01-architecture-and-domain/master_platform_architecture_and_working_inventory.md)
- [`icp_canister_suite_architecture_function_audit_and_valuation_advisory.md`](01-architecture-and-domain/icp_canister_suite_architecture_function_audit_and_valuation_advisory.md)
- [`master-prompt-corda-to-rust-icp.md`](01-architecture-and-domain/master-prompt-corda-to-rust-icp.md)
- [`data_dictionary.md`](01-architecture-and-domain/data_dictionary.md)
- [`corda_semantics.md`](01-architecture-and-domain/corda_semantics.md)
- [`mapping_to_icp.md`](01-architecture-and-domain/mapping_to_icp.md)

### 02 — Product and workflows
- [`enterprise_screen_wireframe_flow_and_architecture.md`](02-product-and-workflows/enterprise_screen_wireframe_flow_and_architecture.md)
- [`system_functions_and_roles_guide.md`](02-product-and-workflows/system_functions_and_roles_guide.md)
- [`central_bank_transaction_taxonomy_and_smart_contract_architecture.md`](02-product-and-workflows/central_bank_transaction_taxonomy_and_smart_contract_architecture.md)
- [`institutional_workflow_and_lifecycle_specification.md`](02-product-and-workflows/institutional_workflow_and_lifecycle_specification.md)
- [`smart_contract_prebuilt_settlement_rules.md`](02-product-and-workflows/smart_contract_prebuilt_settlement_rules.md)
- [`advanced_central_bank_extensions_specification.md`](02-product-and-workflows/advanced_central_bank_extensions_specification.md)
- [`sovereign_central_bank_enterprise_core_and_whisper_extension_strategy.md`](02-product-and-workflows/sovereign_central_bank_enterprise_core_and_whisper_extension_strategy.md)
- [`veritas_gold_signal_integration_dual_custody_and_central_bank_rwa_settlement.md`](02-product-and-workflows/veritas_gold_signal_integration_dual_custody_and_central_bank_rwa_settlement.md)
- [`sovereign_ledger_final_design_and_production_roadmap.md`](02-product-and-workflows/sovereign_ledger_final_design_and_production_roadmap.md)

### 03 — Security, privacy, and compliance
- [`redacted-credential-exposure-incident-checklist.md`](03-security-privacy-and-compliance/redacted-credential-exposure-incident-checklist.md) — redacted credential incident checklist, including the transcript exposure and rotation steps; no secret values.
- [`developer_security_hardening_and_task_roadmap.md`](03-security-privacy-and-compliance/developer_security_hardening_and_task_roadmap.md)
- [`data_privacy_gdpr_and_10year_retention_architecture.md`](03-security-privacy-and-compliance/data_privacy_gdpr_and_10year_retention_architecture.md)
- [`data_mutability_classification_and_10year_retention.md`](03-security-privacy-and-compliance/data_mutability_classification_and_10year_retention.md)
- [`rust-enterprise-blockchain-ai-rules-library.md`](03-security-privacy-and-compliance/rust-enterprise-blockchain-ai-rules-library.md) — copied rules library.
- [`rust-enterprise-blockchain-ai-rules-library (1).md`](<03-security-privacy-and-compliance/rust-enterprise-blockchain-ai-rules-library (1).md>) — second source copy; retained separately because its provenance may differ.
- [`rust-business-application-ai-rules-library.md`](03-security-privacy-and-compliance/rust-business-application-ai-rules-library.md) — copied rules library.
- [`rust-business-application-ai-rules-library (1).md`](<03-security-privacy-and-compliance/rust-business-application-ai-rules-library (1).md>) — second source copy; retained separately because its provenance may differ.

### 04 — Integrations and standards
- [`iso_standards_mapping_table.md`](04-integrations-and-standards/iso_standards_mapping_table.md)
- [`standards_mapping_iso20022_iso24165_openapi.md`](04-integrations-and-standards/standards_mapping_iso20022_iso24165_openapi.md)
- [`realtime_api_ingestion_and_institutional_platform_matrix.md`](04-integrations-and-standards/realtime_api_ingestion_and_institutional_platform_matrix.md)
- [`real_data_apis_icp_outcalls_and_security_hardening.md`](04-integrations-and-standards/real_data_apis_icp_outcalls_and_security_hardening.md)
- [`rwa_terminal_data_feeds_and_node_telemetry.md`](04-integrations-and-standards/rwa_terminal_data_feeds_and_node_telemetry.md)

### 05 — Testing, verification, and operations
- [`p0-current-production-readiness-status.md`](05-testing-verification-and-operations/p0-current-production-readiness-status.md) — evidence-based reconciliation of readiness claims against current code and release blockers; originals preserved.
- [`system_verification_summary_and_status.md`](05-testing-verification-and-operations/system_verification_summary_and_status.md)
- [`mvp_acceptance_and_live_verification_guide.md`](05-testing-verification-and-operations/mvp_acceptance_and_live_verification_guide.md)
- [`production_readiness_status_and_implementation_roadmap.md`](05-testing-verification-and-operations/production_readiness_status_and_implementation_roadmap.md)

### 06 — UI, mobile, and design
- [`red-broadcast-DESIGN.md`](06-ui-mobile-and-design/red-broadcast-DESIGN.md)
- [`stitch_design_retrieval_and_cross_platform_sync.md`](06-ui-mobile-and-design/stitch_design_retrieval_and_cross_platform_sync.md)
- [`veritas_sovereign_master_admin_design.md`](06-ui-mobile-and-design/veritas_sovereign_master_admin_design.md)
- [`google_stitch_project_description_veritas_gold.md`](06-ui-mobile-and-design/google_stitch_project_description_veritas_gold.md)
- [`README.md`](06-ui-mobile-and-design/README.md) — copied frontend README snapshot.

### 07 — Deployment and reference
- [`production_readiness_checklist_and_institutional_rollout.md`](07-deployment-and-reference/production_readiness_checklist_and_institutional_rollout.md)
- [`veritas_gold_deployment_guide_and_financial_charting_plugins.md`](07-deployment-and-reference/veritas_gold_deployment_guide_and_financial_charting_plugins.md)
- [`web_deployment_and_showcase_guide.md`](07-deployment-and-reference/web_deployment_and_showcase_guide.md)

### 08 — Findings and history
- [`project-wide-findings-and-changelog-review.md`](08-findings-and-history/project-wide-findings-and-changelog-review.md) — cross-project evidence summary and changelog review.
- [`MAINCHANGELOG.txt`](08-findings-and-history/MAINCHANGELOG.txt) — dated snapshot of the root main changelog.
- [`findings.md`](08-findings-and-history/findings.md) — account/VPS and persona playtest findings.
- [`persona-playtest-spec-brainstorm.md`](08-findings-and-history/persona-playtest-spec-brainstorm.md) — historical role findings and enhancement proposals.
- [`progress.md`](08-findings-and-history/progress.md) and [`task_plan.md`](08-findings-and-history/task_plan.md) — dated task records.
- [`node_connection_and_outcall_telemetry.log`](08-findings-and-history/node_connection_and_outcall_telemetry.log) — historical log/spec artifact; not independently authenticated runtime evidence.

### Planning-directory automation
- [`check_planning_directory.py`](tools/check_planning_directory.py) — dependency-free check for broken local Markdown links/fragments and Markdown files missing from this index. Run `python3 Architectural_Planning_Directory/tools/check_planning_directory.py` from repository root; `--self-test` runs isolated tests.

## Filing and source policy

- Existing project Markdown documents were **copied, not moved or deleted**. Original locations remain intact; topic folders organize this archive.
- Copies are snapshots, not automatically synchronized. Compare with the original and check date/evidence/status before relying on them. The root `MAINCHANGELOG.txt` remains primary; the copy here is an archive snapshot and may become stale.
- New project architecture/planning Markdown and project-related Markdown supplied/uploaded for incorporation belong in the matching topic folder. See [`.agents/rules/architectural_planning_directory_rule.md`](../.agents/rules/architectural_planning_directory_rule.md). Update this index when filing documents.
- Do not bulk-copy agent skills, repository instructions, generated dependency docs, code, or secret-bearing handoffs. Never copy secrets, keys, passwords, or personal data into this directory; document only redacted findings and follow the security incident process.
- For an external Markdown reference, record provenance (source URL/author/date/license when known) and label it as reference, not approved project policy.

## Review status

This is an organized archive plus a current overview, not a claim that every copied document has been fully rewritten or reconciled. The roadmap's legacy-document review index identifies items needing evidence review. Preserve historical proposals and distinguish target design from verified current implementation.
