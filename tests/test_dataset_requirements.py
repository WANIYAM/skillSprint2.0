import unittest

from dataset_audit import audit_dataset
from main import load_seed
from rule_engine import run_rule_validation


class TestSection38DatasetRequirements(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.seed = load_seed()
        cls.audit = audit_dataset(cls.seed)

    def test_dataset_meets_content_and_count_requirements(self):
        self.assertTrue(self.audit["passed"], self.audit["relationshipErrors"])
        for requirement, minimum in self.audit["required"].items():
            with self.subTest(requirement=requirement):
                self.assertGreaterEqual(self.audit["actual"][requirement], minimum)

    def test_special_subsets_are_supported_by_complaint_content(self):
        complaints = self.seed["complaints"]
        repeated = [
            row for row in complaints
            if row.get("isRepeat") and row.get("previousComplaintId")
        ]
        self.assertGreaterEqual(len(repeated), 25)
        by_id = {row["id"]: row for row in complaints}
        self.assertTrue(all(
            row["previousComplaintId"] != row["id"]
            and row["previousComplaintId"] in by_id
            and row["customerEmail"] == by_id[row["previousComplaintId"]]["customerEmail"]
            and row["description"] != by_id[row["previousComplaintId"]]["description"]
            for row in repeated
        ))

    def test_escalation_condition_is_enforced_by_rule_engine(self):
        complaint = next(
            row for row in self.seed["complaints"]
            if row.get("id") == "CMP-2026-S0551"
        )
        result = run_rule_validation(
            complaint,
            {},
            self.seed["rules"],
            self.seed["policies"],
        )
        self.assertTrue(result["mandatoryEscalation"])
        self.assertTrue(result["matchedEscalationConditions"])
        self.assertTrue(result["matchedEscalationConditions"][0]["condition"])

    def test_repeat_escalation_requires_a_repeat_or_unresolved_signal(self):
        normal = {
            "title": "Payment issue",
            "description": "My card was charged twice for one order.",
            "customerType": "Standard",
        }
        repeat = {
            **normal,
            "description": "I am following up because my card was charged twice and my previous case remains unresolved.",
        }
        normal_result = run_rule_validation(normal, {}, self.seed["rules"], self.seed["policies"])
        repeat_result = run_rule_validation(repeat, {}, self.seed["rules"], self.seed["policies"])

        self.assertFalse(normal_result["mandatoryEscalation"])
        self.assertTrue(repeat_result["mandatoryEscalation"])
        self.assertEqual(repeat_result["matchedEscalationConditions"][0]["ruleId"], "RULE-DATA-051")


if __name__ == "__main__":
    unittest.main()
