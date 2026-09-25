"""
Deterministic Evidence Decision Tree Engine.
Implements an explicit, traceable decision tree over the 7-layer Evidence Ledger,
evaluating trigger severity, graph corroboration, network topology, contradictions,
evidence sufficiency, policy compliance, and approval routing.
"""

from typing import Dict, Any, List
from pydantic import BaseModel, Field


class DecisionTreeNode(BaseModel):
    step_id: str
    step_name: str
    evaluated_condition: str
    outcome: str
    reasoning: str
    evidence_ids: List[str] = Field(default_factory=list)
    confidence: float = 1.0


class EvidenceDecisionTree:
    """
    Explicit Deterministic Decision Tree for Fraud Investigation.
    Evaluates grounded evidence sequentially to determine verdict, actions, and governance routes.
    """

    @classmethod
    def evaluate(
        cls,
        trigger_type: str,
        trigger_text: str,
        flagged_txn: Dict[str, Any],
        baseline: Dict[str, Any],
        device_ring: Dict[str, Any],
        window_txns: List[Dict[str, Any]],
        hypotheses_scores: Dict[str, float],
        contradiction_data: Dict[str, Any],
        is_sufficient: bool,
        verdict: str,
        fraud_probability: float,
        exposure_usd: float,
        evidence_items: List[Any]
    ) -> Dict[str, Any]:
        """
        Executes the deterministic decision tree over the collected evidence ledger.
        Returns a step-by-step audit trace of every decision node.
        """
        trace: List[DecisionTreeNode] = []

        # ---------------------------------------------------------------------
        # NODE 1: Trigger Evaluation (Layer 0)
        # ---------------------------------------------------------------------
        risk_score = float(flagged_txn.get("risk_score", 0.0) or 0.0)
        if trigger_type == "customer_report" or "never made" in trigger_text.lower():
            t1_outcome = "CUSTOMER_DISPUTE_TRIGGERED"
            t1_reason = "Direct cardholder dispute provided initial assertion of unauthorized activity."
            t1_ev = [ev.evidence_id for ev in evidence_items if ev.source == "customer"]
        elif trigger_type == "analyst_request":
            t1_outcome = "ANALYST_ESCALATION_TRIGGERED"
            t1_reason = "Investigation opened upon fraud analyst escalation for ring/entity correlation."
            t1_ev = [ev.evidence_id for ev in evidence_items if "analyst" in ev.ref.lower()]
        else:
            t1_outcome = "MODEL_RISK_SCORE_TRIGGERED"
            t1_reason = f"Bank fraud detection model flagged alert with risk score {risk_score:.2f}."
            t1_ev = [ev.evidence_id for ev in evidence_items if "trigger" in ev.ref.lower()]

        trace.append(DecisionTreeNode(
            step_id="T01_TRIGGER",
            step_name="Trigger Assessment",
            evaluated_condition=f"trigger_type == '{trigger_type}' (risk_score={risk_score:.2f})",
            outcome=t1_outcome,
            reasoning=t1_reason,
            evidence_ids=t1_ev,
            confidence=1.0
        ))

        # ---------------------------------------------------------------------
        # NODE 2: Graph Context Corroboration (Layer 1 & 2)
        # ---------------------------------------------------------------------
        total_hist = baseline.get("total_txns", 0)
        known_regions = baseline.get("known_regions", [])
        txn_region = str(flagged_txn.get("addr1", ""))
        is_domestic_match = txn_region in known_regions and flagged_txn.get("channel") == "in_person"

        if is_domestic_match:
            t2_outcome = "BASELINE_CONFORMANT"
            t2_reason = f"Transaction billing region {txn_region} aligns with cardholder established historical baseline ({total_hist} prior transactions)."
        elif total_hist > 0:
            t2_outcome = "BASELINE_DIVERGENCE"
            t2_reason = f"Transaction exhibits deviation from cardholder baseline (avg spend ${baseline.get('avg_spend', 0.0):.2f})."
        else:
            t2_outcome = "NO_HISTORICAL_BASELINE"
            t2_reason = "No prior customer transaction history found within temporal window."

        trace.append(DecisionTreeNode(
            step_id="T02_GRAPH_BASELINE",
            step_name="Historical Baseline Corroboration",
            evaluated_condition=f"is_domestic_match={is_domestic_match}, hist_txns={total_hist}",
            outcome=t2_outcome,
            reasoning=t2_reason,
            evidence_ids=[ev.evidence_id for ev in evidence_items if "baseline" in ev.ref.lower()],
            confidence=0.90
        ))

        # ---------------------------------------------------------------------
        # NODE 3: Network Topology & Syndicate Ring (Layer 3 & 4)
        # ---------------------------------------------------------------------
        connected_cards = device_ring.get("connected_cards", [])
        is_syndicate = device_ring.get("is_syndicate", False) or len(connected_cards) >= 2

        if is_syndicate:
            t3_outcome = "SYNDICATE_CLUSTER_CONFIRMED"
            t3_reason = f"TigerGraph 3-hop traversal isolated multi-card hardware ring connecting {len(connected_cards)} distinct cards."
        elif len(connected_cards) == 1:
            t3_outcome = "SINGLE_CARD_DEVICE"
            t3_reason = "Device profile utilized exclusively by primary cardholder."
        else:
            t3_outcome = "NO_CONNECTED_CARDS"
            t3_reason = "No multi-card device linkage identified in graph neighborhood."

        trace.append(DecisionTreeNode(
            step_id="T03_NETWORK_TOPOLOGY",
            step_name="Multi-Hop Relationship Analysis",
            evaluated_condition=f"connected_cards_count={len(connected_cards)}",
            outcome=t3_outcome,
            reasoning=t3_reason,
            evidence_ids=[ev.evidence_id for ev in evidence_items if "device_ring" in ev.ref.lower()],
            confidence=0.95
        ))

        # ---------------------------------------------------------------------
        # NODE 4: Contradiction Analysis
        # ---------------------------------------------------------------------
        num_contras = len(contradiction_data.get("contradicting_evidence_ids", []))
        is_contradicted = contradiction_data.get("is_contradicted", False)

        if is_contradicted:
            t4_outcome = "CONTRADICTION_DETECTED"
            t4_reason = f"Detected {num_contras} contradicting evidence items (e.g. domestic baseline match vs alert score)."
        else:
            t4_outcome = "SIGNALS_CONCORDANT"
            t4_reason = "Evidence items concordantly support consistent hypothesis without unresolvable contradiction."

        trace.append(DecisionTreeNode(
            step_id="T04_CONTRADICTIONS",
            step_name="Contradiction Analysis",
            evaluated_condition=f"contradiction_count={num_contras}",
            outcome=t4_outcome,
            reasoning=t4_reason,
            evidence_ids=contradiction_data.get("contradicting_evidence_ids", []),
            confidence=0.85
        ))

        # ---------------------------------------------------------------------
        # NODE 5: Evidence Sufficiency Gate
        # ---------------------------------------------------------------------
        if is_sufficient:
            t5_outcome = "EVIDENCE_SUFFICIENT"
            t5_reason = "Grounded evidence satisfies Bank Policy R1/R4 sufficiency thresholds to execute defensible action."
        else:
            t5_outcome = "EVIDENCE_INSUFFICIENT"
            t5_reason = "Evidence is ambiguous or below 0.70 confidence threshold; step-up verification required."

        trace.append(DecisionTreeNode(
            step_id="T05_SUFFICIENCY",
            step_name="Sufficiency Gate",
            evaluated_condition=f"is_sufficient={is_sufficient}",
            outcome=t5_outcome,
            reasoning=t5_reason,
            evidence_ids=[],
            confidence=1.0
        ))

        # ---------------------------------------------------------------------
        # NODE 6: Verdict Determination
        # ---------------------------------------------------------------------
        trace.append(DecisionTreeNode(
            step_id="T06_VERDICT",
            step_name="Calibrated Verdict Formulation",
            evaluated_condition=f"verdict='{verdict}', probability={fraud_probability:.2f}",
            outcome=f"VERDICT_{verdict.upper()}",
            reasoning=f"Selected verdict '{verdict}' with deterministic calibrated probability {fraud_probability:.2f}.",
            evidence_ids=contradiction_data.get("supporting_evidence_ids", []),
            confidence=fraud_probability if verdict == "fraud" else (1.0 - fraud_probability)
        ))

        # ---------------------------------------------------------------------
        # NODE 7: Policy & Approval Routing (Layer 6)
        # ---------------------------------------------------------------------
        if verdict == "legitimate":
            t7_outcome = "ROUTE_AUTO_CLEAR"
            t7_reason = "Bank Policy R3: Allow transaction and close case automatically."
        elif is_syndicate or exposure_usd > 1000.0:
            t7_outcome = "ROUTE_L2_ESCALATION"
            t7_reason = "Bank Policy R6/R9: Syndicate cluster or exposure > $1,000 mandates L2 Manager approval."
        else:
            t7_outcome = "ROUTE_L1_REVIEW"
            t7_reason = "Bank Policy R1/R5: Card block requires L1 Analyst approval."

        trace.append(DecisionTreeNode(
            step_id="T07_GOVERNANCE_ROUTE",
            step_name="Policy & Approval Routing",
            evaluated_condition=f"exposure_usd=${exposure_usd:.2f}, is_syndicate={is_syndicate}",
            outcome=t7_outcome,
            reasoning=t7_reason,
            evidence_ids=[ev.evidence_id for ev in evidence_items if "policy" in ev.ref.lower()],
            confidence=1.0
        ))

        # ---------------------------------------------------------------------
        # NODE 8: FinCEN SAR Filing Gate
        # ---------------------------------------------------------------------
        sar_mandated = (verdict == "fraud") and (is_syndicate or exposure_usd >= 1000.0)
        trace.append(DecisionTreeNode(
            step_id="T08_SAR_COMPLIANCE",
            step_name="Statutory SAR Filing Assessment",
            evaluated_condition=f"31 CFR § 1020.320: fraud={verdict=='fraud'}, syndicate={is_syndicate}, exposure=${exposure_usd:.2f}",
            outcome="FILE_SAR_MANDATORY" if sar_mandated else "NO_SAR_REQUIRED",
            reasoning="Mandatory FinCEN SAR filing triggered under 31 CFR § 1020.320" if sar_mandated else "Exposure and network scope do not trigger mandatory SAR filing.",
            evidence_ids=[],
            confidence=1.0
        ))

        return {
            "decision_tree_trace": [node.model_dump() for node in trace],
            "total_decision_nodes": len(trace),
            "verdict": verdict,
            "fraud_probability": fraud_probability,
            "sar_mandated": sar_mandated,
            "root_cause_node": "T03_NETWORK_TOPOLOGY" if is_syndicate else ("T02_GRAPH_BASELINE" if is_domestic_match else "T01_TRIGGER")
        }
