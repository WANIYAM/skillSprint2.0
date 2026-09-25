# User Flow — Manager

## Role Summary
The Manager oversees department/team performance, SLA compliance, escalation trends, and overall complaint-handling health — without necessarily working individual complaints directly.

---

## Flow

### 1. Access
- Manager logs in with Manager-level role permissions.
- Lands on a performance-oriented view (department slice of the Administrator Dashboard, or a dedicated Manager Dashboard).

### 2. Monitor Department Performance
- Views complaint volume for their department(s).
- Reviews category and subcategory distribution within their scope.
- Tracks resolution time and comparison against SLA targets.

### 3. Monitor SLA Compliance
- Views SLA Tracking status across active complaints.
- Reviews SLA Risk Detection flags — complaints approaching or breaching target response/resolution deadlines.
- Prioritizes intervention where deadlines are at risk.

### 4. Monitor Escalations
- Reviews all complaints currently at an escalation level within their department (Supervisor Review, Department Manager, Specialist Team, Compliance Review, Critical Management Escalation).
- Assesses whether escalated cases are progressing appropriately.
- Can reassign escalated cases to specific agents/reviewers if the workflow permits.

### 5. Review GenAI/Python Mismatches
- Views aggregate statistics on how often Pipeline 1 and Pipeline 2 disagree within their department.
- Identifies recurring patterns (e.g., a routing rule that keeps causing mismatches) to flag for the Administrator to update in the Rule Matrix.

### 6. Review Manual Review Queue Volume
- Monitors how many cases are sitting in manual review and for how long.
- Can identify bottlenecks in Reviewer throughput.

### 7. Trend & Analytics Review
- Views Complaint Analytics for their department:
  - Rising complaint categories (e.g., increasing delivery or billing complaints)
  - Recurring product/service issues
  - Repeated service failures
  - Escalation spikes
- Uses trend detection to anticipate systemic issues (e.g., a product defect causing a spike in complaints).

### 8. Generate & Export Reports
- Generates department performance reports.
- Exports reports (CSV, PDF, Excel-compatible) for stakeholder review or leadership meetings.

### 9. Search & Filter
- Searches complaints by category, department, priority, sentiment, status, date, or escalation status to investigate specific issues raised by leadership or customers.

---

## Key Guarantees for the Manager
- All SLA and escalation data shown is drawn from the same verified (Pipeline 1 + Pipeline 2 reconciled) records Agents and Reviewers work from — not raw, unverified AI output.
- Trend and mismatch data gives the Manager visibility into where the Rule Matrix may need updating, without requiring them to inspect individual complaints.
