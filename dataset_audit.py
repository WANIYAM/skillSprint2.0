import json
import re
from datetime import datetime
from pathlib import Path
from typing import Any

from dataset_expansion import expand_seed


REQUIREMENTS = {
    "Complaints": 500,
    "Categories": 10,
    "Subcategories": 20,
    "Departments": 8,
    "Policies/SOPs": 20,
    "Resolution rules": 100,
    "Escalation conditions": 30,
    "Ambiguous/multi-issue complaints": 25,
    "Contradictory/difficult policy cases": 20,
    "Prompt-injection/adversarial complaints": 20,
    "Repeated/near-duplicate complaints": 25,
}

ISSUE_TERMS = (
    r"\bcharge(?:d)?\b", r"\bbill(?:ing|ed)?\b", r"\brefund\b",
    r"\bshipment\b", r"\bdeliver(?:y|ed)\b", r"\btracking\b",
    r"\bpackage\b", r"\bdamag(?:e|ed)\b", r"\baccount\b",
    r"\blog[\s-]?in\b", r"\bpassword\b", r"\bwarrant(?:y|ies)\b",
    r"\brepair\b", r"\bbatter(?:y|ies)\b", r"\bscreen\b",
    r"\bsubscription\b", r"\bprivacy\b", r"\bpersonal data\b",
    r"\bdelet(?:e|ion)\b", r"\blawyer\b", r"\bsafety\b",
    r"\bharassment\b", r"\baccessibility\b", r"\boutage\b",
    r"\binvoice\b", r"\brenewal\b", r"\breplacement\b",
    r"\baddress\b", r"\bservice\b",
)

INJECTION_PATTERN = re.compile(
    r"\b(ignore|override|bypass|reveal|admin privileges|system prompt|"
    r"forget the rules|suppress escalation|skip identity checks)\b",
    re.IGNORECASE,
)
CONTRADICTION_PATTERN = re.compile(
    r"\b(but|while|whereas|conflict|contradict|different from|"
    r"one .* says .* (?:but|while|whereas))\b",
    re.IGNORECASE,
)


def _complaint_text(complaint: dict[str, Any]) -> str:
    return " ".join(
        str(complaint.get(field) or "")
        for field in ("title", "description", "requestedResolution")
    )


def _is_multi_issue(complaint: dict[str, Any]) -> bool:
    text = str(complaint.get("description") or "")
    issue_count = sum(bool(re.search(pattern, text, re.IGNORECASE)) for pattern in ISSUE_TERMS)
    output = complaint.get("pipeline1Output", {})
    issue_labels = {
        str(output.get("subcategory") or "").strip().lower(),
        *(str(issue).strip().lower() for issue in output.get("secondaryIssues", [])),
    } - {""}
    named_issue_count = sum(label in text.lower() for label in issue_labels)
    explicit_multiple = re.search(
        r"\b(two (?:connected |unresolved )?(?:problems|issues)|another issue|"
        r"separate(?:ly)?|second issue|both|also|plus)\b",
        text,
        re.IGNORECASE,
    )
    return (issue_count >= 2 or named_issue_count >= 2) and explicit_multiple is not None


def audit_dataset(seed: dict[str, Any]) -> dict[str, Any]:
    complaints = seed.get("complaints", [])
    policies = seed.get("policies", [])
    rules = seed.get("rules", [])
    complaint_ids = [row.get("id") for row in complaints]
    policy_ids = {row.get("id") for row in policies}
    rule_ids = [row.get("id") for row in rules]

    categories = {
        output.get("category")
        for row in complaints
        if isinstance((output := row.get("pipeline1Output")), dict)
        and output.get("category")
    }
    category_subcategory_pairs = {
        (output.get("category"), output.get("subcategory"))
        for row in complaints
        if isinstance((output := row.get("pipeline1Output")), dict)
        and output.get("category") and output.get("subcategory")
    }
    subcategories = {subcategory for _, subcategory in category_subcategory_pairs}
    departments = {row.get("assignedDepartment") for row in complaints if row.get("assignedDepartment")}
    mandatory_rules = [row for row in rules if row.get("mandatoryEscalation")]
    escalation_ids = {
        (
            row.get("category"),
            row.get("subcategory"),
            str(row.get("escalationCondition", "")).strip().lower(),
        )
        for row in mandatory_rules
        if row.get("escalationConditionId") and row.get("escalationCondition")
    }

    complaints_by_id = {
        row.get("id"): row for row in complaints if row.get("id")
    }
    policies_by_id = {
        row.get("id"): row for row in policies if row.get("id")
    }
    multi_issue_count = sum(_is_multi_issue(row) for row in complaints)
    conflict_policy_ids = {
        policy.get("id")
        for policy in policies
        if len(policy.get("sections", [])) >= 2
        and re.search(r"\b(conflict|conflicting|contradict)\b", str(policy.get("summary", "")), re.IGNORECASE)
    }
    contradiction_count = sum(
        bool(CONTRADICTION_PATTERN.search(str(row.get("description") or "")))
        and any(cited.get("docId") in conflict_policy_ids for cited in row.get("pipeline1Output", {}).get("citedPolicies", []))
        for row in complaints
    )
    injection_count = sum(
        bool(INJECTION_PATTERN.search(_complaint_text(row)))
        for row in complaints
    )
    repeat_count = sum(
        bool(row.get("isRepeat"))
        and bool(row.get("previousComplaintId"))
        and row.get("previousComplaintId") in complaints_by_id
        and row.get("customerEmail") == complaints_by_id[row["previousComplaintId"]].get("customerEmail")
        and row.get("description") != complaints_by_id[row["previousComplaintId"]].get("description")
        for row in complaints
    )

    actual = {
        "Complaints": len(complaints),
        "Categories": len(categories),
        "Subcategories": len(subcategories),
        "Departments": len(departments),
        "Policies/SOPs": len(policies),
        "Resolution rules": len(rules),
        "Escalation conditions": len(escalation_ids),
        "Ambiguous/multi-issue complaints": multi_issue_count,
        "Contradictory/difficult policy cases": contradiction_count,
        "Prompt-injection/adversarial complaints": injection_count,
        "Repeated/near-duplicate complaints": repeat_count,
    }

    relationship_errors: list[str] = []
    if len(complaint_ids) != len(set(complaint_ids)):
        relationship_errors.append("Complaint IDs are not unique.")
    if len(policy_ids) != len(policies):
        relationship_errors.append("Policy IDs are not unique.")
    if len(rule_ids) != len(set(rule_ids)):
        relationship_errors.append("Rule IDs are not unique.")
    escalation_condition_ids = [
        row.get("escalationConditionId")
        for row in mandatory_rules
    ]
    if len(escalation_condition_ids) != len(set(escalation_condition_ids)):
        relationship_errors.append("Escalation condition IDs are not unique.")

    category_subcategories = {
        category: {
            subcategory for actual_category, subcategory in category_subcategory_pairs
            if actual_category == category
        } for category in categories
    }
    valid_statuses = {
        "New", "Open", "Pending", "Assigned", "Analyzed", "Escalated",
        "In Progress", "Resolved", "Closed", "Reopened",
    }
    for complaint in complaints:
        output = complaint.get("pipeline1Output", {})
        category, subcategory = output.get("category"), output.get("subcategory")
        if subcategory not in category_subcategories.get(category, set()):
            relationship_errors.append(f"{complaint.get('id')} has an invalid category/subcategory pair.")
        if complaint.get("assignedDepartment") not in departments:
            relationship_errors.append(f"{complaint.get('id')} has an unknown responsible department.")
        if output.get("priority") not in {"P1", "P2", "P3", "P4"}:
            relationship_errors.append(f"{complaint.get('id')} has an invalid priority.")
        if output.get("urgency") not in {"Low", "Medium", "High", "Critical"}:
            relationship_errors.append(f"{complaint.get('id')} has an invalid urgency.")
        if complaint.get("status") not in valid_statuses:
            relationship_errors.append(f"{complaint.get('id')} has an invalid status.")
        try:
            datetime.fromisoformat(str(complaint.get("submittedAt", "")).replace("Z", "+00:00"))
        except ValueError:
            relationship_errors.append(f"{complaint.get('id')} has an invalid submittedAt date.")
        for citation in output.get("citedPolicies", []):
            if citation.get("docId") not in policy_ids:
                relationship_errors.append(f"{complaint.get('id')} cites missing policy {citation.get('docId')}.")
            elif citation.get("sectionId") not in {
                section.get("id") for section in policies_by_id[citation["docId"]].get("sections", [])
            }:
                relationship_errors.append(
                    f"{complaint.get('id')} cites missing section {citation.get('sectionId')} "
                    f"in policy {citation.get('docId')}."
                )
        previous_id = complaint.get("previousComplaintId")
        if previous_id and previous_id not in complaints_by_id:
            relationship_errors.append(f"{complaint.get('id')} references missing complaint {previous_id}.")
        duplicate_id = complaint.get("duplicateComplaintId")
        if duplicate_id and duplicate_id not in complaints_by_id:
            relationship_errors.append(f"{complaint.get('id')} references missing duplicate {duplicate_id}.")
    for rule in rules:
        if rule.get("referencePolicyId") not in policy_ids:
            relationship_errors.append(f"{rule.get('id')} references missing policy {rule.get('referencePolicyId')}.")
        elif rule.get("referenceSectionId") not in {
            section.get("id")
            for section in policies_by_id[rule["referencePolicyId"]].get("sections", [])
        }:
            relationship_errors.append(
                f"{rule.get('id')} references missing section {rule.get('referenceSectionId')} "
                f"in policy {rule.get('referencePolicyId')}."
            )
        if rule.get("category") not in category_subcategories:
            relationship_errors.append(f"{rule.get('id')} references unknown category {rule.get('category')}.")
        if rule.get("subcategory") not in category_subcategories.get(rule.get("category"), set()):
            relationship_errors.append(f"{rule.get('id')} has an invalid category/subcategory pair.")
        if rule.get("department") not in departments:
            relationship_errors.append(f"{rule.get('id')} references unknown department {rule.get('department')}.")
        if rule.get("mandatoryEscalation") and not rule.get("escalationConditionId"):
            relationship_errors.append(f"{rule.get('id')} has no escalation condition ID.")
    for policy in policies:
        try:
            effective_date = datetime.fromisoformat(str(policy.get("effectiveDate", ""))).date()
            expiry_value = policy.get("expiryDate")
            if expiry_value and datetime.fromisoformat(str(expiry_value)).date() <= effective_date:
                relationship_errors.append(f"{policy.get('id')} expires no later than its effective date.")
        except ValueError:
            relationship_errors.append(f"{policy.get('id')} has an invalid effective or expiry date.")

    return {
        "actual": actual,
        "required": dict(REQUIREMENTS),
        "passed": all(actual[name] >= minimum for name, minimum in REQUIREMENTS.items())
        and not relationship_errors,
        "relationshipErrors": sorted(set(relationship_errors)),
        "categories": sorted(categories),
        "departments": sorted(departments),
    }


def write_audit_report(seed: dict[str, Any], destination: Path) -> dict[str, Any]:
    result = audit_dataset(seed)
    lines = [
        "# Section 38 Dataset Requirements Audit",
        "",
        "Generated from the expanded project seed data by `dataset_audit.py`.",
        "",
        "| Requirement | Required | Actual | Status | Evidence |",
        "|---|---:|---:|---|---|",
    ]
    for requirement, minimum in REQUIREMENTS.items():
        actual = result["actual"][requirement]
        status = "PASS" if actual >= minimum else "FAIL"
        lines.append(f"| {requirement} | {minimum} | {actual} | {status} | `seed_data.json` via `expand_seed` |")
    lines.extend(["", "## Relationship and Data-Quality Checks", ""])
    if result["relationshipErrors"]:
        lines.extend(f"- FAIL: {error}" for error in result["relationshipErrors"])
    else:
        lines.append("- PASS: IDs, complaint relationships, category/subcategory pairs, and policy references are valid.")
    lines.extend([
        "",
        f"**Overall status: {'PASS' if result['passed'] else 'FAIL'}**",
        "",
    ])
    destination.write_text("\n".join(lines), encoding="utf-8")
    return result


def load_expanded_seed(seed_path: Path | None = None) -> dict[str, Any]:
    source = seed_path or Path(__file__).with_name("seed_data.json")
    return expand_seed(json.loads(source.read_text(encoding="utf-8")))


if __name__ == "__main__":
    report_path = Path(__file__).with_name("DATASET_REQUIREMENTS_AUDIT.md")
    audit_result = write_audit_report(load_expanded_seed(), report_path)
    print(json.dumps(audit_result, indent=2))
    if not audit_result["passed"]:
        raise SystemExit(1)
