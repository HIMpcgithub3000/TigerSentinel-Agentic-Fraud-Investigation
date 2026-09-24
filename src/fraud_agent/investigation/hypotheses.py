"""
Hypothesis Engine for Evaluating Competing Fraud Typologies and Contradictions.
Determines evidence strength, resolves contradictions, and computes calibrated fraud probability.
"""

from typing import Dict, Any, List, Tuple, Optional
from src.fraud_agent.investigation.evidence import EvidenceLedger
from src.fraud_agent.investigation.patterns import (
    detect_card_testing,
    detect_card_not_present,
    detect_card_not_present_new_device,
    detect_out_of_region,
    detect_account_takeover,
    detect_undocumented_ring
)


class HypothesisEngine:
    """
    Evaluates competing hypotheses against graph observations and surfaces contradictions.
    """

    @staticmethod
    def evaluate(
        flagged_txn: Dict[str, Any],
        baseline: Dict[str, Any],
        window_txns: List[Dict[str, Any]],
        device_ring: Dict[str, Any],
        similar_cases: List[Dict[str, Any]],
        ledger: EvidenceLedger,
        customer_response: str = "",
        trigger_type: str = "risk_score",
        trigger_text: str = "",
        centrality: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Runs all pattern detectors, adds verified claims to the Evidence Ledger,
        evaluates contradictions, and selects the primary hypothesis.
        """
        tid = str(flagged_txn.get("TransactionID", ""))
        card_id = str(flagged_txn.get("card_id", ""))
        amt = float(flagged_txn.get("TransactionAmt", 0.0))
        risk_score = float(flagged_txn.get("risk_score", 0.0) or 0.0)

        # If trigger is a direct customer dispute/report, initialize customer testimony
        if trigger_type == "customer_report" or ("never made" in trigger_text.lower() and not customer_response):
            customer_response = "Customer reported unrecognized activity: 'I never made this purchase.'"

        hypotheses_scores: Dict[str, float] = {
            "card_testing": 0.0,
            "card_not_present_fraud": 0.0,
            "card_not_present_new_device": 0.0,
            "out_of_region_use": 0.0,
            "account_takeover": 0.0,
            "undocumented": 0.0,
            "none": 0.0
        }

        affected_txns = [tid]
        pattern_desc = ""

        # 1. Customer Baseline Evidence
        known_regions = baseline.get("known_regions", [])
        avg_spend = baseline.get("avg_spend", 0.0)
        total_txns = baseline.get("total_txns", 0)

        ledger.add_evidence(
            claim=f"Cardholder has {total_txns} historical transactions averaging ${avg_spend:.2f}.",
            source="graph",
            ref="query:customer_baseline",
            entity_ids=[str(baseline.get("customer_id", ""))],
            strength=0.7,
            supports=["none"] if total_txns > 50 else []
        )

        # 2. Check Out-of-Region Use
        region = str(flagged_txn.get("addr1", ""))
        is_oor, oor_score, oor_ids, oor_desc = detect_out_of_region(flagged_txn, baseline)
        if is_oor:
            hypotheses_scores["out_of_region_use"] = oor_score
            affected_txns = oor_ids
            ledger.add_evidence(
                claim=oor_desc,
                source="graph",
                ref="query:customer_baseline",
                entity_ids=[tid, region],
                strength=oor_score,
                supports=["out_of_region_use"]
            )
        elif region in known_regions and flagged_txn.get("channel") == "in_person":
            # Significant contradiction: In-person transaction occurred in customer's known billing region
            hypotheses_scores["none"] += 0.45
            ledger.add_evidence(
                claim=f"Flagged in-person purchase occurred in billing region {region}, which is among the cardholder's established historical regions.",
                source="graph",
                ref="query:customer_baseline",
                entity_ids=[tid, region],
                strength=0.85,
                supports=["none"],
                contradicts=["out_of_region_use"]
            )

        # 3. Check Card Testing
        is_testing, test_score, test_ids, test_desc = detect_card_testing(window_txns, flagged_txn)
        if is_testing:
            hypotheses_scores["card_testing"] = test_score
            affected_txns = test_ids
            ledger.add_evidence(
                claim=test_desc,
                source="graph",
                ref="query:card_window",
                entity_ids=test_ids,
                strength=test_score,
                supports=["card_testing"]
            )

        # 4. Check Shared Device Ring / Undocumented Typology
        is_undoc, undoc_score, undoc_ids, _, undoc_desc = detect_undocumented_ring(flagged_txn, device_ring)
        if is_undoc:
            hypotheses_scores["undocumented"] = undoc_score
            pattern_desc = undoc_desc
            connected_cards = device_ring.get("connected_cards", [])
            ledger.add_evidence(
                claim=undoc_desc,
                source="graph",
                ref="query:device_ring",
                entity_ids=[str(flagged_txn.get("device_profile", ""))] + connected_cards,
                strength=undoc_score,
                supports=["undocumented"]
            )
            # Add deep multi-hop syndicate topology evidence if multi-hop cards or devices discovered
            if device_ring.get("is_syndicate") and len(connected_cards) >= 2:
                num_c = len(connected_cards)
                num_d = len(device_ring.get("connected_devices", []))
                synd_exp = float(device_ring.get("syndicate_exposure_usd", 0.0))
                ledger.add_evidence(
                    claim=f"Deep multi-hop graph traversal confirmed an organized syndicate ring linking {num_c} cards across {num_d} hardware profiles with total exposure of ${synd_exp:.2f}.",
                    source="graph",
                    ref="query:device_ring:multi_hop",
                    entity_ids=connected_cards[:5] + device_ring.get("connected_devices", [])[:2],
                    strength=0.95,
                    supports=["undocumented"]
                )

        # Graph Centrality & Hub Anomaly Evidence
        if centrality and centrality.get("is_hub_anomaly"):
            hub_degree = centrality.get("num_cards_sharing", 0)
            ledger.add_evidence(
                claim=f"Graph centrality analysis flagged hardware profile as high-degree hub shared across {hub_degree} distinct payment cards.",
                source="graph",
                ref="algorithm:degree_and_connectivity_centrality",
                entity_ids=[str(flagged_txn.get("device_profile", "")), card_id],
                strength=0.90,
                supports=["undocumented"]
            )

        # 5. Check Card-Not-Present Fraud from New Device
        is_cnp_new, cnp_new_score, cnp_new_ids, cnp_new_desc = detect_card_not_present_new_device(
            window_txns, flagged_txn, device_ring, baseline
        )
        if is_cnp_new and not is_undoc:
            hypotheses_scores["card_not_present_new_device"] = cnp_new_score
            affected_txns = cnp_new_ids
            ledger.add_evidence(
                claim=cnp_new_desc,
                source="graph",
                ref="query:card_window",
                entity_ids=cnp_new_ids,
                strength=cnp_new_score,
                supports=["card_not_present_new_device"]
            )

        # 6. Check Card-Not-Present Fraud
        is_cnp, cnp_score, cnp_ids, cnp_desc = detect_card_not_present(window_txns, flagged_txn, baseline)
        if is_cnp and not is_cnp_new and not is_undoc:
            hypotheses_scores["card_not_present_fraud"] = cnp_score
            affected_txns = cnp_ids
            ledger.add_evidence(
                claim=cnp_desc,
                source="graph",
                ref="query:card_window",
                entity_ids=cnp_ids,
                strength=cnp_score,
                supports=["card_not_present_fraud"]
            )

        # 7. Similar Historical Cases Evidence
        prior_case_ids = []
        for c in similar_cases:
            prior_case_ids.append(c["case_id"])
            if c.get("outcome") == "confirmed_fraud":
                hyp_key = c.get("pattern", "")
                if hyp_key in hypotheses_scores:
                    hypotheses_scores[hyp_key] += 0.10
                ledger.add_evidence(
                    claim=f"Historical closed case {c['case_id']} confirmed fraud with matching pattern ({c.get('pattern')}).",
                    source="graph",
                    ref="query:similar_closed_cases",
                    entity_ids=[c["case_id"]],
                    strength=0.75,
                    supports=[hyp_key]
                )
            elif c.get("outcome") == "cleared":
                hypotheses_scores["none"] += 0.20
                ledger.add_evidence(
                    claim=f"Historical closed case {c['case_id']} cleared as false alarm for similar alert.",
                    source="graph",
                    ref="query:similar_closed_cases",
                    entity_ids=[c["case_id"]],
                    strength=0.75,
                    supports=["none"]
                )

        # 8. Customer Response Integration (Evidence, not automatic verdict)
        if customer_response:
            resp_lower = customer_response.lower()
            is_denial = any(k in resp_lower for k in ["denied", "did not make", "never made", "unrecognized", "unauthorized", "dispute"])
            is_confirm = any(k in resp_lower for k in ["confirm", "travel", "authorized", "yes, i made"])

            if is_denial:
                ledger.add_evidence(
                    claim="Cardholder explicitly states they did not make this purchase and still has the card.",
                    source="customer",
                    ref="evidence_request:customer_validation",
                    entity_ids=[card_id],
                    strength=0.85,
                    supports=["card_testing", "card_not_present_fraud", "card_not_present_new_device", "out_of_region_use", "undocumented"],
                    contradicts=["none"]
                )
                # Boost fraud hypotheses
                for k in hypotheses_scores:
                    if k != "none" and hypotheses_scores[k] > 0.0:
                        hypotheses_scores[k] = min(0.95, hypotheses_scores[k] + 0.25)

                # If no other specific fraud typology triggered yet, customer denial indicates unauthorized CNP use
                non_zero_fraud = [v for k, v in hypotheses_scores.items() if k != "none" and v > 0.0]
                if not non_zero_fraud:
                    hypotheses_scores["card_not_present_fraud"] = 0.78
                
                # Heavily penalize 'none'
                hypotheses_scores["none"] = max(0.0, hypotheses_scores["none"] - 0.40)

            elif is_confirm:
                ledger.add_evidence(
                    claim="Cardholder confirmed making the transaction or planned travel.",
                    source="customer",
                    ref="evidence_request:customer_validation",
                    entity_ids=[card_id],
                    strength=0.95,
                    supports=["none"],
                    contradicts=["card_not_present_fraud", "out_of_region_use", "undocumented"]
                )
                hypotheses_scores["none"] = 0.95
                for k in hypotheses_scores:
                    if k != "none":
                        hypotheses_scores[k] = 0.0

        # 9. Select Winning Hypothesis & Calibrate Fraud Probability
        best_pattern = "none"
        best_score = 0.0
        for pat, score in hypotheses_scores.items():
            if score > best_score:
                best_score = score
                best_pattern = pat

        # Compute calibrated fraud probability
        if best_pattern == "none":
            fraud_prob = max(0.02, min(0.35, risk_score * 0.4))
            verdict = "legitimate"
            affected_txns = []
        elif best_score >= 0.70:
            fraud_prob = min(0.96, best_score)
            verdict = "fraud"
        else:
            fraud_prob = best_score
            verdict = "uncertain"

        # Calculate exposure
        exposure = amt if verdict != "legitimate" else 0.0

        return {
            "primary_hypothesis": best_pattern,
            "pattern_description": pattern_desc,
            "verdict": verdict,
            "fraud_probability": round(fraud_prob, 2),
            "exposure_usd": round(exposure, 2),
            "affected_txn_ids": affected_txns,
            "hypotheses_scores": hypotheses_scores,
            "prior_cases_cited": prior_case_ids
        }
