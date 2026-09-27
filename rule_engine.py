import re
from datetime import datetime, timezone
from typing import Any


def _text(value: Any) -> str:
    return str(value or "").lower()


def _contains_any(text: str, values: list[str]) -> bool:
    return any(value in text for value in values)


SAFETY_HAZARD_PATTERNS = (
    r"\bsmoke\s+(?:is\s+)?(?:coming|pouring|billowing)\s+(?:from|out\s+of)\b",
    r"\b(?:burning|burnt)\s+(?:plastic\s+)?(?:smell|odor|odour)\b",
    r"\b(?:smell|smells|smelling)\s+(?:like\s+)?burning\b",
    r"\b(?:battery|device|laptop|computer|phone|tablet|charger|appliance)\b.{0,40}\b(?:smoking|overheating|overheated|swollen|swelling|sparking|sparks|melted|flames|on\s+fire|caught\s+(?:on\s+)?fire|catching\s+fire|getting\s+hot|very\s+hot)\b",
    r"\b(?:smoking|overheating|overheated|swollen|swelling|sparking|sparks|melted|flames|on\s+fire|caught\s+(?:on\s+)?fire|catching\s+fire|getting\s+hot|very\s+hot)\b.{0,40}\b(?:battery|device|laptop|computer|phone|tablet|charger|appliance)\b",
    r"\b(?:battery|device|laptop|computer|phone|tablet|charger|appliance)\b.{0,40}\b(?:emitting|releasing|producing)\s+(?:smoke|sparks|flames)\b",
    r"\b(?:smoke|sparks|flames)\b.{0,40}\b(?:emitted|released|produced)\s+by\s+(?:the\s+)?(?:battery|device|laptop|computer|phone|tablet|charger|appliance)\b",
)


def _has_safety_hazard(text: str) -> bool:
    return any(re.search(pattern, text) for pattern in SAFETY_HAZARD_PATTERNS)


def _rule_id(rules: list[dict[str, Any]], preferred: str, department: str | None = None) -> str | None:
    selected = next((rule for rule in rules if rule.get("id") == preferred), None)
    if selected is None and department:
        selected = next((rule for rule in rules if rule.get("department") == department), None)
    return selected.get("id") if selected else None


def _validated_at() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def run_rule_validation(
    complaint: dict[str, Any],
    ai: dict[str, Any],
    rules: list[dict[str, Any]],
    policies: list[dict[str, Any]] | None = None,
) -> dict[str, Any]:
    full_text = " ".join(
        _text(complaint.get(field))
        for field in ("title", "description", "requestedResolution")
    )
    adversarial_patterns = [
        ("ignore all", "Instruction override directive"),
        ("ignore previous", "Context override directive"),
        ("system override", "System impersonation token"),
        ("system notice", "System prompt injection header"),
        ("override directives", "Rule evasion keyword"),
        ("as authorized by", "Social engineering authority claim"),
        ("bypass", "Security bypass request"),
        ("admin privileges", "Privilege escalation payload"),
    ]
    adversarial_flags = [
        {
            "patternDetected": pattern,
            "description": f'Adversarial manipulation phrase detected: "{pattern}" ({description})',
            "riskLevel": "Critical",
        }
        for pattern, description in adversarial_patterns
        if pattern in full_text
    ]

    safety = _has_safety_hazard(full_text)
    legal = _contains_any(full_text, [
        "attorney", "lawyer", "lawsuit", "court", "ftc", "cfpb",
        "litigation", "counsel",
    ]) or bool(re.search(r"\bsue\b", full_text))
    billing = _contains_any(full_text, [
        "double charge", "duplicate charge", "charged twice", "refund",
        "overcharged", "invoice",
    ])
    delivery = _contains_any(full_text, [
        "lost shipment", "tracking", "not delivered", "courier", "carrier",
        "package lost",
    ])
    security = _contains_any(full_text, [
        "hacked", "unauthorized access", "takeover", "2fa", "password reset",
        "gdpr",
    ])

    expected_category = "Customer Support"
    expected_subcategory = "General Inquiry"
    expected_department = "Customer Support"
    expected_urgency = "Low"
    expected_priority = "P4"
    mandatory_escalation = False
    mandatory_tier = "None"
    matched_rules: list[str] = []
    applicable_policies: list[str] = []

    if safety:
        expected_category = "Hardware & Devices"
        expected_subcategory = "Battery Overheating / Fire Hazard"
        expected_department = "Trust & Safety"
        expected_urgency = "Critical"
        expected_priority = "P1"
        mandatory_escalation = True
        mandatory_tier = "Critical Management Escalation"
        matched = _rule_id(rules, "RULE-SAF-01", "Trust & Safety")
        if matched:
            matched_rules.append(matched)
        applicable_policies.append("POL-WAR-02")
    elif legal:
        expected_category = "Legal & Compliance"
        expected_subcategory = "Litigation Threat"
        expected_department = "Legal & Compliance"
        expected_urgency = "Critical"
        expected_priority = "P1"
        mandatory_escalation = True
        mandatory_tier = "Compliance Review"
        matched = _rule_id(rules, "RULE-LEG-01", "Legal & Compliance")
        if matched:
            matched_rules.append(matched)
        applicable_policies.append("POL-LEG-01")
    elif security:
        expected_category = "Account & Security"
        expected_subcategory = "Account Takeover Suspicion"
        expected_department = "Account Security"
        expected_urgency = "High"
        expected_priority = "P1"
        mandatory_escalation = True
        mandatory_tier = "Department Manager"
        matched = _rule_id(rules, "RULE-SEC-01", "Account Security")
        if matched:
            matched_rules.append(matched)
        applicable_policies.append("POL-SEC-01")
    elif billing:
        if "double" in full_text or "twice" in full_text:
            expected_subcategory = "Double Charge"
            matched = _rule_id(rules, "RULE-BIL-01")
            applicable_policies.append("POL-BIL-03")
        else:
            expected_subcategory = "Refund Delay"
            matched = next(
                (
                    rule.get("id")
                    for rule in rules
                    if rule.get("id") in {"RULE-RET-01", "RULE-RET-02"}
                ),
                None,
            )
            applicable_policies.append("POL-RET-01")
        expected_category = "Billing & Payments"
        expected_department = "Billing & Finance"
        expected_urgency = "Medium"
        expected_priority = "P2"
        if matched:
            matched_rules.append(matched)
    elif delivery:
        expected_category = "Delivery & Logistics"
        expected_subcategory = "Lost Shipment"
        expected_department = "Logistics & Fulfillment"
        expected_urgency = "Medium"
        expected_priority = "P2"
        matched = _rule_id(rules, "RULE-DEL-01")
        if matched:
            matched_rules.append(matched)
        applicable_policies.append("POL-DEL-04")
    else:
        expected_category = "Service & Support Quality"
        expected_subcategory = "General Inquiry"
        expected_department = "Customer Support"
        expected_urgency = "Low"
        expected_priority = "P3"

    if complaint.get("customerType") in {"Premium VIP", "Enterprise"} and expected_priority != "P1":
        if expected_priority == "P2":
            expected_priority = "P1"
        elif expected_priority == "P3":
            expected_priority = "P2"

    repeat_signal = bool(complaint.get("isRepeat") or complaint.get("previousComplaintId")) or _contains_any(
        full_text,
        ["previous case", "earlier case", "repeat contact", "following up", "still unresolved", "reopened"],
    )
    matching_rules = [
        rule for rule in rules
        if isinstance(rule.get("subcategory"), str)
        and (
            rule["subcategory"].strip().lower() in full_text
            or (
                rule.get("category") == expected_category
                and rule.get("subcategory") == expected_subcategory
            )
        )
        and (
            rule.get("conditionType") != "repeat_unresolved"
            or repeat_signal
        )
    ]
    repeat_rules = [rule for rule in matching_rules if rule.get("conditionType") == "repeat_unresolved"]
    matched_matrix_rule = (
        repeat_rules[0]
        if repeat_signal and repeat_rules
        else next(
            (rule for rule in matching_rules if rule.get("conditionType") == "issue_reported"),
            next((rule for rule in matching_rules if not rule.get("conditionType")), None),
        )
    )
    matched_escalation_conditions: list[dict[str, str]] = []
    if matched_matrix_rule:
        expected_category = matched_matrix_rule.get("category", expected_category)
        expected_subcategory = matched_matrix_rule.get("subcategory", expected_subcategory)
        expected_department = matched_matrix_rule.get("department", expected_department)
        expected_urgency = matched_matrix_rule.get("urgency", expected_urgency)
        expected_priority = matched_matrix_rule.get("priority", expected_priority)
        if matched_matrix_rule.get("id") and matched_matrix_rule["id"] not in matched_rules:
            matched_rules.append(matched_matrix_rule["id"])
        policy_id = matched_matrix_rule.get("referencePolicyId")
        if policy_id and policy_id not in applicable_policies:
            applicable_policies.append(policy_id)
        if matched_matrix_rule.get("mandatoryEscalation"):
            mandatory_escalation = True
            mandatory_tier = matched_matrix_rule.get("escalationTier", "Department Manager")
            matched_escalation_conditions.append({
                "id": matched_matrix_rule.get("escalationConditionId", matched_matrix_rule["id"]),
                "ruleId": matched_matrix_rule["id"],
                "condition": matched_matrix_rule.get("escalationCondition", matched_matrix_rule.get("triggerConditions", "")),
            })

    unsupported: list[dict[str, str]] = []
    hallucinations: list[dict[str, str]] = []
    missing_actions: list[str] = []
    if ai:
        response_text = " ".join(
            (_text(ai.get("draftedResponse")), _text(ai.get("internalAgentGuidance")))
        )
        if _contains_any(full_text, ["month", "90 day", "last year", "11 month"]):
            if "refund has been authorized" in response_text or "will send a 100% full refund" in response_text:
                unsupported.append({
                    "claim": "AI promised full cash refund for order past 30-day eligibility window",
                    "reason": "Violates POL-RET-01 Sec 01 (Max 30 days for cash returns)",
                    "violatedRuleId": "RULE-RET-02",
                })
        if "wire transfer" in response_text or (
            "$1,000" in full_text and "approved $1,000" in response_text
        ):
            unsupported.append({
                "claim": "AI approved unverified cash settlement / wire transfer claim",
                "reason": "No rule permits arbitrary customer payouts without Manager or Legal signoff",
                "violatedRuleId": "RULE-RET-01",
            })
        for cited in ai.get("citedPolicies") or []:
            exists = any(
                policy.get("id") == cited.get("docId") and policy.get("status") == "Active"
                for policy in (policies or [])
            )
            if not exists:
                hallucinations.append({
                    "citedDocId": cited.get("docId"),
                    "reason": f'Policy document "{cited.get("docId")}" does not exist in the active organizational knowledge base',
                })
        if safety and not _contains_any(response_text, ["disconnect", "power", "safe", "unplug"]):
            missing_actions.append(
                "Missing mandatory safety warning (cease use, disconnect power) in generated customer response"
            )
    if adversarial_flags:
        missing_actions.append("Reviewer verification mandatory due to detected adversarial prompt pattern")

    return {
        "expectedCategory": expected_category,
        "expectedSubcategory": expected_subcategory,
        "expectedDepartment": expected_department,
        "expectedUrgency": expected_urgency,
        "expectedPriority": expected_priority,
        "mandatoryEscalation": mandatory_escalation,
        "mandatoryEscalationTier": mandatory_tier,
        "matchedEscalationConditions": matched_escalation_conditions,
        "matchedRules": matched_rules,
        "applicablePolicyDocs": applicable_policies,
        "policyEligibilityApproved": not unsupported,
        "unsupportedPromiseFlags": unsupported,
        "hallucinationFlags": hallucinations,
        "adversarialPromptFlags": adversarial_flags,
        "mandatoryActionMissingFlags": missing_actions,
        "validatedAt": _validated_at(),
    }


def compare_outputs(ai: dict[str, Any] | None, rule: dict[str, Any], validation: dict[str, Any] | None = None) -> dict[str, Any]:
    if not ai:
        return {
            "categoryMatch": False,
            "departmentMatch": False,
            "urgencyMatch": False,
            "priorityMatch": False,
            "escalationMatch": False,
            "policyTraceabilityValid": False,
            "promisesApproved": False,
            "verificationScore": 0,
            "verificationStatus": "Manual Review",
            "discrepancies": ["Pipeline 1 output missing or incomplete"],
        }

    validation = validation or {}
    ai_category = _text(ai.get("category")).strip()
    rule_category = _text(rule.get("expectedCategory")).strip()
    category_match = (
        ai_category == rule_category
        or rule_category in ai_category
        or ai_category in rule_category
    )
    department_match = _text(ai.get("recommendedDepartment")).strip() == _text(rule.get("expectedDepartment")).strip()
    urgency_match = ai.get("urgency") == rule.get("expectedUrgency")
    priority_match = ai.get("priority") == rule.get("expectedPriority")
    escalation_match = bool(ai.get("escalationRequired")) == bool(rule.get("mandatoryEscalation"))
    hallucinations = rule.get("hallucinationFlags") or []
    unsupported = rule.get("unsupportedPromiseFlags") or []
    adversarial = rule.get("adversarialPromptFlags") or []
    missing_actions = rule.get("mandatoryActionMissingFlags") or []
    policy_valid = len(hallucinations) == 0
    promises_approved = len(unsupported) == 0

    score = 0
    discrepancies: list[str] = []
    if category_match:
        score += 20
    else:
        discrepancies.append(
            f'Category mismatch: GenAI suggested "{ai.get("category")}", Rule Matrix requires "{rule.get("expectedCategory")}"'
        )
    if department_match:
        score += 25
    else:
        discrepancies.append(
            f'Department routing mismatch: GenAI routed to "{ai.get("recommendedDepartment")}", Rule Matrix requires "{rule.get("expectedDepartment")}"'
        )
    if urgency_match:
        score += 20
    else:
        discrepancies.append(
            f'Urgency mismatch: GenAI assessed "{ai.get("urgency")}", Rule Matrix requires "{rule.get("expectedUrgency")}"'
        )
    if priority_match:
        score += 10
    else:
        discrepancies.append(
            f'Priority tier difference: GenAI set "{ai.get("priority")}", Rule Matrix calculated "{rule.get("expectedPriority")}"'
        )
    if escalation_match:
        score += 15
    else:
        discrepancies.append(
            f"Escalation disagreement: GenAI escalation = {bool(ai.get('escalationRequired'))}, Rule Matrix mandatory escalation = {bool(rule.get('mandatoryEscalation'))}"
        )
    if policy_valid:
        score += 10
    else:
        discrepancies.append(
            f"Policy hallucination detected: {', '.join(str(flag.get('citedDocId')) for flag in hallucinations)}"
        )
    if not promises_approved:
        score = max(0, score - 40)
        discrepancies.extend(
            f"Unsupported Promise: {flag.get('claim')} ({flag.get('reason')})"
            for flag in unsupported
        )
    if adversarial:
        score = min(score, 35)
        discrepancies.extend(
            f"Adversarial Threat Flag: {flag.get('description')}"
            for flag in adversarial
        )
    discrepancies.extend(f"Missing Mandatory Action: {action}" for action in missing_actions)

    python_validation = validation if validation else None
    if python_validation and not python_validation.get("passed"):
        score = min(score, python_validation.get("validationScore", 0))
        discrepancies.extend(
            f"[Python Crosscheck] {finding.get('message')}"
            for finding in python_validation.get("findings", [])
        )
        discrepancies.extend(
            f"[Python Crosscheck] Adversarial threat: {threat.get('description')}"
            for threat in python_validation.get("adversarialThreats", [])
        )

    ground_truth_blocked = bool(hallucinations or unsupported or adversarial or missing_actions)
    critical = rule.get("expectedUrgency") == "Critical"
    critical_check = not critical or (urgency_match and department_match and escalation_match)
    python_check = not python_validation or bool(python_validation.get("passed"))
    if ground_truth_blocked:
        status = "Manual Review"
    else:
        status = (
            "Verified"
            if score >= 85 and promises_approved and not adversarial and critical_check and python_check
            else "Manual Review"
        )
    return {
        "categoryMatch": category_match,
        "departmentMatch": department_match,
        "urgencyMatch": urgency_match,
        "priorityMatch": priority_match,
        "escalationMatch": escalation_match,
        "policyTraceabilityValid": policy_valid,
        "promisesApproved": promises_approved,
        "verificationScore": round(score),
        "verificationStatus": status,
        "groundTruthBlocked": ground_truth_blocked,
        "discrepancies": discrepancies,
        "aiVsRuleAgreement": round(score),
        "pythonCrosscheckAgreement": validation.get("validationScore", 90),
        "finalRecommendedDepartment": rule.get("expectedDepartment"),
        "finalUrgency": rule.get("expectedUrgency"),
        "finalPriority": rule.get("expectedPriority"),
    }
