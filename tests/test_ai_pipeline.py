import json
import os
import sys
import unittest
from types import ModuleType, SimpleNamespace
from unittest.mock import Mock, patch

import ai_pipeline
from fastapi.testclient import TestClient

from main import app


VALID_MODEL_OUTPUT = {
    "primaryIssue": "The device stopped working",
    "secondaryIssues": [],
    "category": "Hardware & Devices",
    "subcategory": "Device malfunction",
    "sentiment": "Frustrated",
    "urgency": "Medium",
    "priority": "P2",
    "entities": {"orderId": "", "amount": "", "date": "", "deviceModel": "", "serialNumber": "", "customerEmail": "", "trackingNumber": ""},
    "summary": "The customer reports a device malfunction.",
    "recommendedDepartment": "Hardware Engineering",
    "secondaryDepartments": [],
    "citedPolicies": [],
    "resolutionSteps": ["Review the device report"],
    "escalationRequired": False,
    "escalationTier": "None",
    "escalationReason": "",
    "draftedResponse": "We have received your report and will review the device issue.",
    "responseTone": "Empathetic",
    "followUpRequired": False,
    "followUpReason": "",
    "followUpCommunication": "",
    "internalAgentGuidance": "Inspect the device report before resolving.",
    "clarificationQuestions": [],
    "adversarialAnalysis": {
        "isAdversarial": False,
        "threatType": "None",
        "threatDetails": "",
        "recommendedAction": "Proceed with standard triage.",
    },
}


class TestGenAIPipeline(unittest.TestCase):
    def test_success_uses_genai_client_and_validates_model_output(self):
        generate_content = Mock(return_value=SimpleNamespace(text=json.dumps(VALID_MODEL_OUTPUT)))
        client = SimpleNamespace(models=SimpleNamespace(generate_content=generate_content))
        client_constructor = Mock(return_value=client)
        fake_genai = ModuleType("google.genai")
        fake_genai.Client = client_constructor
        fake_google = ModuleType("google")
        fake_google.genai = fake_genai

        with patch.dict(os.environ, {"GEMINI_API_KEY": "test-key"}), patch.dict(
            sys.modules, {"google": fake_google, "google.genai": fake_genai}
        ):
            result = ai_pipeline.run_ai_pipeline({"title": "Device issue"}, [], "test system prompt")

        self.assertEqual(result["pipelineStatus"], "COMPLETED")
        self.assertEqual(result["modelUsed"], "gemini-3.5-flash")
        self.assertEqual(result["modelRequested"], "gemini-3.5-flash")
        self.assertEqual(result["modelVersion"], "3.5-flash-05-2026")
        self.assertEqual(result["draftedResponse"], VALID_MODEL_OUTPUT["draftedResponse"])
        client_constructor.assert_called_once()
        self.assertEqual(generate_content.call_args.kwargs["model"], "gemini-3.5-flash")

    def test_missing_key_returns_failure_without_canned_output(self):
        with patch.dict(os.environ, {}, clear=True):
            result = ai_pipeline.run_ai_pipeline({"title": "Double charge"}, [])

        self.assertEqual(result["pipelineStatus"], "GENAI_UNAVAILABLE")
        self.assertEqual(result["errorCode"], "GENAI_API_KEY_MISSING")
        self.assertEqual(result["attempts"], 0)
        self.assertIsNone(result["modelUsed"])
        self.assertNotIn("draftedResponse", result)
        self.assertNotIn("category", result)

    def test_retries_invalid_response_then_returns_failure(self):
        with (
            patch.dict(os.environ, {"GEMINI_API_KEY": "test-key"}),
            patch("ai_pipeline._generate_content", return_value='{"category":"Billing & Payments"}') as generate,
            patch("ai_pipeline.time.sleep") as sleep,
        ):
            result = ai_pipeline.run_ai_pipeline({"title": "Billing issue"}, [])

        self.assertEqual(result["pipelineStatus"], "GENAI_UNAVAILABLE")
        self.assertEqual(result["errorCode"], "GENAI_INVALID_RESPONSE")
        self.assertEqual(result["attempts"], 3)
        self.assertEqual(generate.call_count, 3)
        self.assertEqual([call.args[0] for call in sleep.call_args_list], [0.25, 0.5])
        self.assertNotIn("draftedResponse", result)

    def test_retries_network_failure_then_gives_up(self):
        with (
            patch.dict(os.environ, {"GEMINI_API_KEY": "test-key"}),
            patch("ai_pipeline._generate_content", side_effect=TimeoutError("request timed out")) as generate,
            patch("ai_pipeline.time.sleep"),
        ):
            result = ai_pipeline.run_ai_pipeline({"title": "Device issue"}, [])

        self.assertEqual(result["pipelineStatus"], "GENAI_UNAVAILABLE")
        self.assertEqual(result["errorCode"], "GENAI_REQUEST_FAILED")
        self.assertIn("timed out", result["error"])
        self.assertEqual(result["attempts"], 3)
        self.assertEqual(generate.call_count, 3)

    def test_offline_preview_is_unambiguously_marked_as_simulated(self):
        result = ai_pipeline._offline_demo_preview({"title": "Double charge"}, [])

        self.assertEqual(result["pipelineStatus"], "OFFLINE_DEMO_MODE_NOT_GENAI")
        self.assertEqual(result["modelUsed"], "OFFLINE_DEMO_MODE_NOT_GENAI")
        self.assertTrue(result["isSimulatedOutput"])
        self.assertNotEqual(result["modelUsed"], "gemini-3.5-flash")

    def test_api_failure_is_saved_for_manual_review_without_comparison(self):
        client = TestClient(app)
        login = client.post("/api/auth/login", json={"role": "Agent"})
        headers = {"Authorization": f"Bearer {login.json()['token']}"}
        failure = {
            "pipelineStatus": "GENAI_UNAVAILABLE",
            "errorCode": "GENAI_REQUEST_FAILED",
            "error": "Network unavailable",
            "attempts": 3,
            "modelUsed": None,
            "modelRequested": "gemini-3.5-flash",
        }
        body = {
            "title": "Device stopped working",
            "description": "The device stopped working after normal use.",
            "productService": "Home device",
        }

        with (
            patch("main.run_ai_pipeline", return_value=failure),
            patch("main.run_rule_validation") as rule,
            patch("main.crosscheck_complaint_and_ai") as validate,
            patch("main.compare_outputs") as compare,
        ):
            response = client.post("/api/complaints", json=body, headers=headers)

        complaint = response.json()["complaint"]
        self.assertEqual(response.status_code, 201)
        self.assertEqual(complaint["status"], "Analyzed")
        self.assertEqual(complaint["pipeline1Output"]["pipelineStatus"], "GENAI_UNAVAILABLE")
        self.assertIsNone(complaint["pipeline2Output"])
        self.assertIsNone(complaint["pythonValidation"])
        self.assertIsNone(complaint["comparisonResult"])
        rule.assert_not_called()
        validate.assert_not_called()
        compare.assert_not_called()
        manual_review = client.get(
            "/api/complaints", params={"verificationStatus": "Manual Review"}, headers=headers
        ).json()["complaints"]
        self.assertIn(complaint["id"], {item["id"] for item in manual_review})
        self.assertEqual(client.get("/api/analytics").status_code, 200)
        self.assertEqual(client.get("/api/reports/validation").status_code, 200)


if __name__ == "__main__":
    unittest.main()
