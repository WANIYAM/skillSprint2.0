import unittest
from unittest.mock import patch

from fastapi.testclient import TestClient

from database import SessionLocal
from main import app, load_seed
from models import Policy
from rule_engine import compare_outputs, run_rule_validation
from validator import crosscheck_complaint_and_ai


PIPELINE1_SUCCESS = {
    "pipelineStatus": "COMPLETED",
    "primaryIssue": "Safety hazard report",
    "secondaryIssues": [],
    "category": "Hardware & Devices",
    "subcategory": "Battery safety",
    "sentiment": "Neutral",
    "urgency": "Critical",
    "priority": "P1",
    "entities": {},
    "summary": "Customer reports a potential battery hazard.",
    "recommendedDepartment": "Trust & Safety",
    "secondaryDepartments": [],
    "citedPolicies": [],
    "resolutionSteps": ["Review the reported hazard"],
    "escalationRequired": True,
    "escalationTier": "Critical Management Escalation",
    "escalationReason": "Safety review required",
    "draftedResponse": "We have received your safety report for review.",
    "responseTone": "Empathetic",
    "followUpRequired": True,
    "followUpReason": "Safety review",
    "followUpCommunication": "A reviewer will follow up.",
    "internalAgentGuidance": "Route to a safety reviewer.",
    "clarificationQuestions": [],
    "adversarialAnalysis": {"isAdversarial": False, "threatType": "None", "threatDetails": "", "recommendedAction": "Review"},
}


class TestScenarioExecution(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def test_valid_scenario_executes_assertions(self):
        with patch("main.run_ai_pipeline", return_value=PIPELINE1_SUCCESS):
            response = self.client.post(
                "/api/test-scenarios/run",
                json={"id": "TEST-TRAP-02"},
            )

        self.assertEqual(response.status_code, 200)
        result = response.json()["result"]
        self.assertEqual(result["status"], "Passed")
        self.assertTrue(result["assertions"])
        self.assertTrue(all(assertion["passed"] for assertion in result["assertions"]))
        self.assertEqual(
            result["outputs"]["pipeline2"]["expectedCategory"],
            "Hardware & Devices",
        )

    def test_unknown_scenario_returns_not_found(self):
        response = self.client.post(
            "/api/test-scenarios/run",
            json={"id": "TEST-DOES-NOT-EXIST"},
        )

        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.json()["code"], "SCENARIO_NOT_FOUND")

    def test_malformed_scenario_request_returns_bad_request(self):
        response = self.client.post("/api/test-scenarios/run", json={})

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json()["code"], "SCENARIO_ID_REQUIRED")

    def test_failing_execution_reports_failed(self):
        invalid_rule_output = {
            "expectedCategory": "Service & Support Quality",
            "expectedPriority": "P3",
            "mandatoryEscalation": False,
            "adversarialPromptFlags": [],
            "unsupportedPromiseFlags": [],
            "hallucinationFlags": [],
            "mandatoryActionMissingFlags": [],
        }
        with patch("main.run_ai_pipeline", return_value=PIPELINE1_SUCCESS), patch("main.run_rule_validation", return_value=invalid_rule_output):
            response = self.client.post(
                "/api/test-scenarios/run",
                json={"id": "TEST-TRAP-02"},
            )

        self.assertEqual(response.status_code, 200)
        result = response.json()["result"]
        self.assertEqual(result["status"], "Failed")
        self.assertTrue(any(not assertion["passed"] for assertion in result["assertions"]))

    def test_array_request_is_rejected(self):
        response = self.client.post("/api/test-scenarios/run", json=[])

        self.assertEqual(response.status_code, 422)

    def test_evaluation_seed_meets_coverage_and_is_available(self):
        seed = load_seed()
        complaints = seed["complaints"]
        tags = [tag for complaint in complaints for tag in complaint.get("datasetTags", [])]

        self.assertGreaterEqual(len(complaints), 500)
        self.assertEqual(len({complaint["id"] for complaint in complaints}), len(complaints))
        self.assertGreaterEqual(len({complaint["description"] for complaint in complaints}), 475)
        self.assertGreaterEqual(len({complaint["pipeline1Output"]["category"] for complaint in complaints}), 10)
        self.assertGreaterEqual(len({complaint["pipeline1Output"]["subcategory"] for complaint in complaints}), 20)
        self.assertGreaterEqual(len({complaint["assignedDepartment"] for complaint in complaints}), 8)
        self.assertGreaterEqual(len(seed["policies"]), 20)
        self.assertGreaterEqual(len(seed["rules"]), 100)
        self.assertGreaterEqual(sum(rule["mandatoryEscalation"] for rule in seed["rules"]), 30)
        for tag, minimum in (("ambiguous-multi-issue", 25), ("contradictory-policy", 20), ("prompt-injection", 20), ("near-duplicate", 25)):
            self.assertGreaterEqual(tags.count(tag), minimum)
        for tag, minimum in (("incomplete", 20), ("calm-critical", 20), ("angry-low-priority", 20), ("high-priority", 20), ("policy-exception", 20), ("simple", 20), ("multi-issue", 25)):
            self.assertGreaterEqual(tags.count(tag), minimum)
        complaints_by_tag = {
            tag: [complaint for complaint in complaints if tag in complaint.get("datasetTags", [])]
            for tag in ("calm-critical", "angry-low-priority")
        }
        self.assertTrue(all(row["pipeline1Output"]["urgency"] == "Critical" for row in complaints_by_tag["calm-critical"]))
        self.assertTrue(all(row["pipeline1Output"]["urgency"] == "Low" for row in complaints_by_tag["angry-low-priority"]))
        policy_ids = {policy["id"] for policy in seed["policies"]}
        self.assertTrue(all(rule["referencePolicyId"] in policy_ids for rule in seed["rules"]))
        self.assertTrue(all(citation["docId"] in policy_ids for complaint in complaints for citation in complaint.get("pipeline1Output", {}).get("citedPolicies", [])))
        self.assertTrue({"Account & Security", "Privacy & Data Rights", "Safety & Trust"}.issubset({complaint["pipeline1Output"]["category"] for complaint in complaints}))

        login = self.client.post("/api/auth/login", json={"role": "Agent"})
        self.assertEqual(login.status_code, 200)
        response = self.client.get("/api/complaints", headers={"Authorization": f"Bearer {login.json()['token']}"})
        self.assertEqual(response.status_code, 200)
        self.assertGreaterEqual(len(response.json()["complaints"]), 500)


class TestContextualHazardMatching(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        seed = load_seed()
        cls.rules = seed["rules"]
        cls.policies = seed["policies"]

    def test_smoke_test_title_on_delivery_complaint_is_not_a_hazard(self):
        complaint = {
            "title": "Live no-key smoke test",
            "description": "Routine delivery tracking inquiry for an order with no movement for two days.",
            "requestedResolution": "Please check the latest carrier status.",
            "productService": "NovaTab Ultra 13",
            "orderReference": "ORD-SMOKE-TEST-01",
            "customerType": "Standard",
        }

        result = run_rule_validation(complaint, {}, self.rules, self.policies)

        self.assertEqual(result["expectedCategory"], "Delivery & Logistics")
        self.assertFalse(result["mandatoryEscalation"])
        self.assertNotEqual(result["expectedPriority"], "P1")
        self.assertNotIn("RULE-SAF-01", result["matchedRules"])

    def test_genuine_battery_hazards_still_trigger_critical_escalation(self):
        descriptions = (
            "My laptop battery is smoking and getting hot.",
            "My laptop battery is overheating while charging.",
            "My laptop battery caught fire during use.",
        )
        for description in descriptions:
            with self.subTest(description=description):
                result = run_rule_validation(
                    {"title": "Battery problem", "description": description},
                    {},
                    self.rules,
                    self.policies,
                )
                self.assertEqual(result["expectedCategory"], "Hardware & Devices")
                self.assertEqual(result["expectedUrgency"], "Critical")
                self.assertEqual(result["expectedPriority"], "P1")
                self.assertTrue(result["mandatoryEscalation"])
                self.assertIn("RULE-SAF-01", result["matchedRules"])

    def test_cmp_2026_0676_delivery_review_score_has_only_real_triage_mismatches(self):
        # CMP-2026-0676 was falsely given legal findings because "sue" matched "issue".
        # After that false positive is removed, manual review remains expected: the saved GenAI
        # Low/P4 assessment disagreed with the rule engine's Medium/P3 delivery triage (score 70).
        complaint = {
            "title": "Live pinned Gemini delivery check 2026-09-27",
            "description": "Order ORD-LIVE-PINNED-20260927: tracking number TRK-LIVE-PINNED-927 has not updated for two days and my package has not arrived. Please check the latest carrier tracking status. There is no damage or safety issue.",
            "requestedResolution": "Please check the current delivery status; do not issue a replacement yet.",
            "productService": "NovaTab Ultra 13",
            "orderReference": "ORD-LIVE-PINNED-20260927",
            "customerType": "Standard",
        }
        ai_output = {
            "primaryIssue": "Tracking status not updating",
            "category": "Delivery & Logistics",
            "urgency": "Low",
            "priority": "P4",
            "recommendedDepartment": "Logistics & Fulfillment",
            "draftedResponse": "We will check the latest carrier tracking status and update you.",
            "escalationRequired": False,
            "entities": {"orderId": "ORD-LIVE-PINNED-20260927"},
            "citedPolicies": [],
        }
        rule_output = run_rule_validation(complaint, ai_output, self.rules, self.policies)
        validation = crosscheck_complaint_and_ai({
            "complaint": complaint,
            "pipeline1Output": ai_output,
            "policies": self.policies,
            "ruleMatrix": self.rules,
        })
        comparison = compare_outputs(ai_output, rule_output, validation)

        self.assertFalse(any(finding["type"].startswith("LEGAL_") or finding["type"] == "MANDATORY_LEGAL_ESCALATION_OMITTED" for finding in validation["findings"]))
        self.assertTrue(validation["passed"], validation["findings"])
        self.assertEqual(rule_output["expectedUrgency"], "Medium")
        self.assertEqual(rule_output["expectedPriority"], "P3")
        self.assertEqual(comparison["verificationScore"], 70)
        self.assertEqual(comparison["verificationStatus"], "Manual Review")


class TestScenarioDocumentAPIs(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def test_document_upload_is_limited_to_administrators(self):
        body = {"filename": "policy.txt", "rawText": "A valid policy body.", "category": "Operations"}
        self.assertEqual(self.client.post("/api/knowledge-base/upload", json=body).status_code, 401)
        for role in ("Customer", "Agent", "Reviewer", "Manager"):
            with self.subTest(role=role):
                login = self.client.post("/api/auth/login", json={"role": role})
                response = self.client.post(
                    "/api/knowledge-base/upload",
                    json=body,
                    headers={"Authorization": f"Bearer {login.json()['token']}"},
                )
                self.assertEqual(response.status_code, 403)
                self.assertEqual(response.json()["code"], "RBAC_FORBIDDEN")
                manual_response = self.client.post(
                    "/api/knowledge-base",
                    json={"title": "Role Test", "summary": "Role test policy", "category": "Operations"},
                    headers={"Authorization": f"Bearer {login.json()['token']}"},
                )
                self.assertEqual(manual_response.status_code, 403)

    def test_admin_document_upload_validates_fields_and_duplicates(self):
        login = self.client.post("/api/auth/login", json={"role": "Administrator"})
        headers = {"Authorization": f"Bearer {login.json()['token']}"}
        valid_body = {
            "filename": "validation-fixture.txt",
            "rawText": "Document validation fixture with enough readable text to parse.",
            "documentId": "POL-TEST-VALIDATION-2026",
            "title": "Document Validation Fixture 2026",
            "category": "Operations",
            "version": "1.2.3",
            "effectiveDate": "2026-09-01",
            "expiryDate": "2027-09-01",
        }
        created_id = valid_body["documentId"]
        manual_id = "POL-TEST-MANUAL-VALIDATION"
        try:
            cases = [
                ({**valid_body, "filename": "empty.txt", "rawText": ""}, "EMPTY_FILE"),
                ({**valid_body, "filename": "unsupported.exe"}, "UNSUPPORTED_FORMAT"),
                ({**valid_body, "filename": "wrong.pdf"}, "FILE_TYPE_MISMATCH"),
                ({**valid_body, "documentId": "invalid id"}, "INVALID_DOCUMENT_ID"),
                ({**valid_body, "documentId": ""}, "INVALID_DOCUMENT_ID"),
                ({**valid_body, "version": "latest"}, "INVALID_VERSION"),
                ({**valid_body, "category": " "}, "INVALID_CATEGORY"),
                ({**valid_body, "effectiveDate": "2026-02-30"}, "INVALID_EFFECTIVE_DATE"),
                ({**valid_body, "effectiveDate": ""}, "INVALID_EFFECTIVE_DATE"),
                ({**valid_body, "expiryDate": "not-a-date"}, "INVALID_EXPIRY_DATE"),
                ({**valid_body, "expiryDate": "2026-08-31"}, "INVALID_EXPIRY_DATE"),
            ]
            for body, expected_code in cases:
                with self.subTest(expected_code=expected_code):
                    response = self.client.post("/api/knowledge-base/upload", json=body, headers=headers)
                    self.assertEqual(response.status_code, 400)
                    self.assertEqual(response.json()["code"], expected_code)

            oversized = {**valid_body, "filename": "oversized.txt", "rawText": "x" * (10 * 1024 * 1024 + 1)}
            response = self.client.post("/api/knowledge-base/upload", json=oversized, headers=headers)
            self.assertEqual(response.status_code, 400)
            self.assertEqual(response.json()["code"], "FILE_TOO_LARGE")

            response = self.client.post("/api/knowledge-base/upload", json=valid_body, headers=headers)
            self.assertEqual(response.status_code, 201)
            policy = response.json()["policy"]
            self.assertEqual(policy["id"], created_id)
            self.assertEqual(policy["effectiveDate"], valid_body["effectiveDate"])
            self.assertEqual(policy["expiryDate"], valid_body["expiryDate"])

            duplicate_id = {**valid_body, "documentId": "POL-TEST-DIFFERENT", "rawText": "different policy content"}
            response = self.client.post("/api/knowledge-base/upload", json=duplicate_id, headers=headers)
            self.assertEqual(response.status_code, 409)
            self.assertEqual(response.json()["code"], "DUPLICATE_DOCUMENT_VERSION")

            duplicate_content = {**valid_body, "documentId": "POL-TEST-DUP-CONTENT", "title": "Another title"}
            response = self.client.post("/api/knowledge-base/upload", json=duplicate_content, headers=headers)
            self.assertEqual(response.status_code, 409)
            self.assertEqual(response.json()["code"], "DUPLICATE_DOCUMENT")

            duplicate_document_id = {**valid_body, "documentId": created_id, "rawText": "different valid policy content"}
            response = self.client.post("/api/knowledge-base/upload", json=duplicate_document_id, headers=headers)
            self.assertEqual(response.status_code, 409)
            self.assertEqual(response.json()["code"], "DUPLICATE_DOCUMENT_ID")

            manual_body = {
                "documentId": manual_id,
                "title": "Manual Validation Fixture",
                "summary": "A manually authored policy used to verify metadata validation.",
                "category": "Operations",
                "version": "invalid",
            }
            response = self.client.post("/api/knowledge-base", json=manual_body, headers=headers)
            self.assertEqual(response.status_code, 400)
            self.assertEqual(response.json()["code"], "INVALID_VERSION")
            manual_body["version"] = "1.0"
            manual_body["effectiveDate"] = "2026-09-01"
            manual_body["expiryDate"] = "2027-09-01"
            response = self.client.post("/api/knowledge-base", json=manual_body, headers=headers)
            self.assertEqual(response.status_code, 201)
            self.assertEqual(response.json()["policy"]["expiryDate"], "2027-09-01")
        finally:
            db = SessionLocal()
            try:
                for document_id in (created_id, manual_id):
                    row = db.get(Policy, document_id)
                    if row:
                        db.delete(row)
                db.commit()
            finally:
                db.close()


if __name__ == "__main__":
    unittest.main()
