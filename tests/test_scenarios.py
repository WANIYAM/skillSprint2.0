import unittest
from unittest.mock import patch

from fastapi.testclient import TestClient

from main import app


class TestScenarioExecution(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def test_valid_scenario_executes_assertions(self):
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
        with patch("main.run_rule_validation", return_value=invalid_rule_output):
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


if __name__ == "__main__":
    unittest.main()
