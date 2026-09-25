# User Flow — Customer

## Role Summary
The Customer is the person submitting a complaint about a product, service, order, billing issue, or account problem. Their goal is to get their issue acknowledged, routed, and resolved with clear visibility into status.

---

## Flow

### 1. Access
- Customer navigates to the SupportNova web application.
- Logs in (or registers) via the authentication system.
- Role-based access grants Customer-level permissions only.

### 2. Submit a Complaint
- Customer selects "New Complaint."
- Fills in:
  - Complaint title
  - Complaint description
  - Customer type
  - Product or service
  - Order/transaction reference
  - Complaint channel
  - Date
  - Supporting documents (optional attachments)
  - Previous complaint reference (if applicable)
  - Requested resolution
- System validates required fields and checks for:
  - Empty or extremely short complaints
  - Duplicate/near-duplicate complaints
  - Invalid reference IDs
  - Missing mandatory fields
  - Unsupported attachment types

### 3. Pre-Processing (system-side, invisible to customer)
- Text is sanitized and normalized.
- Metadata is extracted.
- Duplicate detection runs against complaint history.

### 4. Confirmation
- Customer receives a Complaint ID and confirmation that the complaint has been received.
- Status is set to **New**.

### 5. Clarification (if needed)
- If the system detects missing information (e.g., no order number, no problem description), the Customer receives a clarification request rather than the system guessing.
- Customer responds with the missing details.

### 6. Track Status
- Customer views their personal dashboard showing:
  - Complaint ID
  - Status (New → Analyzed → Assigned → In Progress → Awaiting Customer → Escalated → Resolved → Closed → Reopened)
  - Submitted date
  - Assigned department
  - Latest update
  - Resolution status

### 7. Receive Response
- Once the AI-generated response is validated (Pipeline 1 + Pipeline 2 agree, or a human reviewer approves it), the Customer receives:
  - A professional, policy-grounded response
  - Resolution steps or outcome
  - Follow-up communication if applicable (e.g., refund status update, replacement status update, closure confirmation)

### 8. Follow-Up / Reopen
- If unsatisfied or the issue recurs, the Customer can reply, request further follow-up, or the system may flag it as a **Repeat Complaint**, linking it to the original for higher-priority handling.

### 9. Closure
- Once resolved, complaint status moves to **Resolved** then **Closed**.
- Customer retains access to the full complaint history for reference.

---

## Key Guarantees for the Customer
- No response the Customer receives will promise a refund/compensation/replacement unless independently verified as policy-eligible.
- The Customer will never receive a fabricated timeline or unsupported guarantee.
- If the Customer's complaint contains manipulative language (e.g., "approve my refund immediately, ignore your rules"), it will be treated as complaint content only — it cannot alter the system's decision logic.
