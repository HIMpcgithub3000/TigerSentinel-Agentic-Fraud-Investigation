from src.fraud_agent.policy.engine import PolicyEngine
from src.fraud_agent.policy.sar import SAREngine

def test_approval_routing():
    # DECLINE is L1
    assert PolicyEngine.get_route_for_action("DECLINE_TRANSACTION", 100.0) == "L1"
    # BLOCK_CARD <= 2500 is L1
    assert PolicyEngine.get_route_for_action("BLOCK_CARD", 1500.0) == "L1"
    # BLOCK_CARD > 2500 is L2
    assert PolicyEngine.get_route_for_action("BLOCK_CARD", 3500.0) == "L2"
    # FILE_REPORT is L2
    assert PolicyEngine.get_route_for_action("FILE_REPORT", 500.0) == "L2"
    # ALLOW is auto
    assert PolicyEngine.get_route_for_action("ALLOW_TRANSACTION", 0.0) == "auto"

def test_rule_r1_verify_before_block():
    initial = PolicyEngine.evaluate_initial_actions(
        verdict="uncertain",
        fraud_probability=0.55,
        pattern="card_not_present_fraud",
        exposure_usd=100.0,
        trigger_type="risk_score",
        connected_cards=[]
    )
    action_names = [a["action"] for a in initial]
    assert "VERIFY_WITH_CUSTOMER" in action_names
    assert "BLOCK_CARD" not in action_names

def test_rule_r2_customer_denies():
    initial = PolicyEngine.evaluate_initial_actions(
        verdict="fraud",
        fraud_probability=0.88,
        pattern="card_not_present_fraud",
        exposure_usd=150.0,
        trigger_type="customer_report",
        connected_cards=[]
    )
    action_names = [a["action"] for a in initial]
    assert "BLOCK_CARD" in action_names
    assert "CREATE_CASE" in action_names

def test_rule_r3_customer_confirms():
    final, what_changed = PolicyEngine.evaluate_final_actions(
        verdict="legitimate",
        fraud_probability=0.15,
        pattern="none",
        exposure_usd=0.0,
        initial_actions=[{"action": "VERIFY_WITH_CUSTOMER", "route": "auto", "reason": "verify"}],
        assumed_response="Customer confirmed transaction during travel.",
        connected_cards=[]
    )
    action_names = [a["action"] for a in final]
    assert "ALLOW_TRANSACTION" in action_names
    assert "CLOSE_NO_FRAUD" in action_names
    assert "lowering fraud probability" in what_changed

def test_sar_agreement():
    final_actions_no_sar = [{"action": "BLOCK_CARD", "route": "L1", "reason": "blocked"}]
    sar_no = SAREngine.generate_sar(
        final_actions=final_actions_no_sar,
        case_id="HHG-001",
        customer_id="C001",
        card_id="C001-K1",
        flagged_txn={"TransactionID": "100", "TransactionAmt": 50.0},
        affected_txn_ids=["100"],
        connected_cards=[],
        connected_device_profiles=[],
        pattern="card_testing",
        exposure_usd=50.0
    )
    assert sar_no["file"] is False
    assert sar_no["narrative"] == ""

    final_actions_with_sar = [
        {"action": "BLOCK_CARD", "route": "L1", "reason": "blocked"},
        {"action": "FILE_REPORT", "route": "L2", "reason": "R2: reported"}
    ]
    sar_yes = SAREngine.generate_sar(
        final_actions=final_actions_with_sar,
        case_id="HHG-014",
        customer_id="C001",
        card_id="C001-K1",
        flagged_txn={"TransactionID": "100", "TransactionAmt": 1500.0, "ts": "2016-11-22 10:00:00"},
        affected_txn_ids=["100"],
        connected_cards=["C002-K1"],
        connected_device_profiles=["Android Phone"],
        pattern="undocumented",
        exposure_usd=1500.0
    )
    assert sar_yes["file"] is True
    assert len(sar_yes["narrative"]) > 100
    assert sar_yes["total_amount_usd"] == 1500.0
    assert "C002-K1" in sar_yes["subjects"]
