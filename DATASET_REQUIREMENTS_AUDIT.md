# Section 38 Dataset Requirements Audit

Generated from the expanded project seed data by `dataset_audit.py`.

| Requirement | Required | Actual | Status | Evidence |
|---|---:|---:|---|---|
| Complaints | 500 | 560 | PASS | `seed_data.json` via `expand_seed` |
| Categories | 10 | 10 | PASS | `seed_data.json` via `expand_seed` |
| Subcategories | 20 | 51 | PASS | `seed_data.json` via `expand_seed` |
| Departments | 8 | 9 | PASS | `seed_data.json` via `expand_seed` |
| Policies/SOPs | 20 | 30 | PASS | `seed_data.json` via `expand_seed` |
| Resolution rules | 100 | 108 | PASS | `seed_data.json` via `expand_seed` |
| Escalation conditions | 30 | 69 | PASS | `seed_data.json` via `expand_seed` |
| Ambiguous/multi-issue complaints | 25 | 31 | PASS | `seed_data.json` via `expand_seed` |
| Contradictory/difficult policy cases | 20 | 30 | PASS | `seed_data.json` via `expand_seed` |
| Prompt-injection/adversarial complaints | 20 | 30 | PASS | `seed_data.json` via `expand_seed` |
| Repeated/near-duplicate complaints | 25 | 35 | PASS | `seed_data.json` via `expand_seed` |

## Relationship and Data-Quality Checks

- PASS: IDs, complaint relationships, category/subcategory pairs, and policy references are valid.

**Overall status: PASS**
