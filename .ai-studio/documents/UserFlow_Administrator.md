# User Flow — Administrator

## Role Summary
The Administrator configures and maintains the system: knowledge base, Complaint Resolution Rule Matrix, department/category structures, and has full visibility into system-wide metrics and AI/validation performance.

---

## Flow

### 1. Access
- Administrator logs in with full Admin-level role permissions.
- Lands on the **Administrator Dashboard**.

### 2. Upload & Manage Knowledge Base
- Uploads approved company documents (PDF/DOCX):
  - Customer-service, refund, replacement, warranty, billing, delivery, and privacy policies
  - Escalation procedures, complaint SOPs
  - Department-routing rules, SLA rules, FAQs
- System validates: file type, file size, empty files, duplicates, Document ID, version, effective date, expiry date, category.
- System parses and chunks documents, preserving Document ID, title, section, heading, page reference, version, and effective date.
- Administrator manages **Document Version Control** — marking documents Active, Previous, Superseded, or Draft.

### 3. Build & Maintain the Complaint Resolution Rule Matrix
- Defines structured rules: Rule ID, category, subcategory, conditions, department, urgency, priority, policy reference, escalation trigger, required actions, prohibited actions, follow-up requirements.
- This matrix is authored/maintained directly — **not** generated at runtime by the same GenAI model used for complaint resolution.
- Minimum baseline per project requirements: 10+ categories, 20+ subcategories, 8+ departments, 20+ policy/SOP documents, 100+ resolution rules, 30+ escalation rules.

### 4. Configure System Structure
- Adds/edits complaint categories and subcategories (configurable, not hard-coded).
- Adds/edits departments and routing logic.
- Adjusts priority logic and escalation thresholds.
- Adds new validation rules or dashboard filters as needed.

### 5. Manage Prompt Templates
- Maintains centrally stored, versioned prompt templates used by Pipeline 1.
- Logs prompt version, GenAI provider, model, and policy version tied to each template revision.

### 6. Monitor System-Wide Metrics
Administrator Dashboard displays:
- Total complaints
- Category and department distribution
- Priority levels
- Escalations
- Resolution status
- SLA risks
- GenAI/Python mismatches
- Manual-review case volume

### 7. Review GenAI/Python Comparison Data
- Reviews the Comparison Engine's aggregate output across all complaints.
- Identifies systemic disagreement patterns and updates the Rule Matrix, routing rules, or prompt templates accordingly.

### 8. Handle Hidden/Live Evaluation Scenarios
- Processes hidden evaluation datasets, new/revised policies, new categories, and live rule changes (add category, add routing rule, change priority logic, add department, change escalation threshold, modify SLA, change JSON schema, add validation rule, add dashboard filter) — all via configuration, without modifying core source code.

### 9. Oversee Security & Compliance
- Reviews prompt-injection and adversarial-complaint test results.
- Confirms unsupported-promise and hallucination detection is functioning.
- Ensures API keys and secrets are stored securely and never exposed in the repository.

### 10. Reports & Analytics
- Generates and exports system-wide reports: complaint analysis, department performance, escalations, SLA status, policy usage, resolution compliance, GenAI/Python comparison, manual reviews.
- Uses trend detection to identify organization-wide emerging issues.

### 11. User & Role Management
- Manages accounts and role assignments for Customers, Agents, Reviewers, and Managers.

---

## Key Guarantees for the Administrator
- The Rule Matrix — the ultimate source of truth — is fully within Administrator control and is never silently overwritten by AI output.
- All configuration changes (new category, new rule, new department) take effect without requiring code changes, satisfying the "no hard-coded logic" requirement.
- Full audit and traceability data is available to diagnose why any complaint was classified, routed, or escalated the way it was.
