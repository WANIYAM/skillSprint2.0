# User Flow — Reviewer

## Role Summary
The Reviewer handles cases where Pipeline 1 (GenAI) and Pipeline 2 (Python Ground-Truth Validation) disagree, or where a complaint is otherwise ambiguous, sensitive, or policy-unsupported. The Reviewer is the human checkpoint before an uncertain case proceeds.

---

## Flow

### 1. Access
- Reviewer logs in with Reviewer-level role permissions.
- Lands on the **Manual Review Queue**.

### 2. View the Manual Review Queue
Cases enter this queue when:
- GenAI and Python disagree significantly (classification, routing, urgency, escalation)
- Policy support is missing for a generated claim
- The complaint is ambiguous or multi-issue
- Escalation requirement is unclear
- A policy contradiction exists (active vs. outdated vs. conflicting FAQ)
- The complaint is otherwise sensitive and requires human judgment

### 3. Open a Flagged Complaint
Reviewer sees a side-by-side comparison:
- **Pipeline 1 (GenAI) output:** category, department, urgency, priority, escalation decision, generated response, resolution steps
- **Pipeline 2 (Python) output:** expected category, department, urgency, escalation status per Rule Matrix
- **Comparison Engine result:** which fields matched, which mismatched, and the verification score
- Any hallucination, unsupported-promise, or prompt-injection flags raised

### 4. Investigate
- Reviewer checks the original complaint text.
- Reviews referenced policy sections and their version/effective date.
- Considers whether the complaint fits a known "trap" pattern:
  - Sentiment-urgency mismatch (e.g., angry tone but low actual risk, or calm tone masking a safety issue)
  - Contradictory policy documents
  - Prompt-injection attempt embedded in complaint text
  - Legitimate new/edge-case scenario not yet in the Rule Matrix

### 5. Make a Decision
Reviewer can:
- **Approve** — accept the AI-generated result as-is
- **Reject** — discard the AI-generated result
- **Modify** — edit classification, routing, urgency, priority, or response text directly
- **Reclassify** — assign a different category/subcategory
- **Reassign** — route to a different department
- **Escalate** — push the complaint to a higher escalation level
- **Regenerate Response** — request a new AI-drafted response (e.g., after correcting the routing/classification)
- **Add Comments** — leave notes explaining the decision, visible in the audit trail

### 6. Override Handling
- Both the original AI/Python recommendation and the Reviewer's final decision are stored together.
- Nothing is silently replaced — the audit trail keeps both versions.

### 7. Release Back to Workflow
- Once resolved, the complaint re-enters the normal lifecycle (Assigned → In Progress, etc.) with the Reviewer's decision now treated as the source of truth.
- If a response was approved/modified, it becomes available for the Agent to send to the Customer.

### 8. Pattern Reporting
- Reviewer decisions feed into the GenAI/Python Comparison Report, helping identify systemic mismatches (e.g., a rule that needs updating, a prompt that needs refinement).

---

## Key Guarantees for the Reviewer
- The Reviewer always sees *why* a case was flagged — not just that it was flagged.
- Every Reviewer decision is permanently logged alongside the original AI/Python recommendation for auditability.
- The Reviewer has full override authority over both pipelines' outputs.
