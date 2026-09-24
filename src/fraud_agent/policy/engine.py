"""
Deterministic Policy Engine implementing Bank Fraud Policy Version 1.0.
Computes initial and final Next-Best Actions, applies 4-tier approval routing,
and enforces Rules R1 through R10.
"""

from typing import List, Dict, Any, Tuple
from src.fraud_agent.models import ActionItem, NextBestActions


class PolicyEngine:
    """
    Enforces Bank Fraud Policy Version 1.0 and generates strictly routed action recommendations.
    """

    @staticmethod
    def get_route_for_action(action: str, exposure_usd: float) -> str:
        """Determines the mandatory approval route based on action and exposure."""
        if action == "DECLINE_TRANSACTION":
            return "L1"
        elif action == "BLOCK_CARD":
            return "L1" if exposure_usd <= 2500.0 else "L2"
        elif action in ["BLOCK_ALL_CARDS", "FILE_REPORT"]:
            return "L2"
        else:
            return "auto"

    @classmethod
    def evaluate_initial_actions(
        cls,
        verdict: str,
        fraud_probability: float,
        pattern: str,
        exposure_usd: float,
        trigger_type: str,
        connected_cards: List[str]
    ) -> List[Dict[str, Any]]:
        """
        Determines Initial Next-Best Actions BEFORE any extra evidence is received.
        """
        actions: List[Dict[str, Any]] = []

        if verdict == "legitimate":
            actions.append({
                "action": "ALLOW_TRANSACTION",
                "route": cls.get_route_for_action("ALLOW_TRANSACTION", exposure_usd),
                "reason": "Activity aligns with cardholder established historical baseline; alert cleared."
            })
            actions.append({
                "action": "CLOSE_NO_FRAUD",
                "route": cls.get_route_for_action("CLOSE_NO_FRAUD", exposure_usd),
                "reason": "R3: Legitimate activity confirmed by multi-hop graph history."
            })
            return actions

        if pattern == "card_testing":
            actions.append({
                "action": "DECLINE_TRANSACTION",
                "route": cls.get_route_for_action("DECLINE_TRANSACTION", exposure_usd),
                "reason": "R5: Testing sequence observed; decline subsequent authorizations."
            })
            if fraud_probability >= 0.85 or exposure_usd > 100.0:
                actions.append({
                    "action": "BLOCK_CARD",
                    "route": cls.get_route_for_action("BLOCK_CARD", exposure_usd),
                    "reason": f"R5: Purchase over $100 or confirmed testing sequence; exposure ${exposure_usd:.2f}."
                })
            else:
                actions.append({
                    "action": "VERIFY_WITH_CUSTOMER",
                    "route": cls.get_route_for_action("VERIFY_WITH_CUSTOMER", exposure_usd),
                    "reason": "R1: Verify with customer before blocking."
                })

        elif trigger_type == "customer_report":
            actions.append({
                "action": "BLOCK_CARD",
                "route": cls.get_route_for_action("BLOCK_CARD", exposure_usd),
                "reason": f"R2: Customer reported unrecognized purchase; exposure ${exposure_usd:.2f}."
            })
            actions.append({
                "action": "CREATE_CASE",
                "route": cls.get_route_for_action("CREATE_CASE", exposure_usd),
                "reason": "R2: Customer dispute formally logged."
            })
            if exposure_usd > 1000.0 or len(connected_cards) > 0:
                actions.append({
                    "action": "FILE_REPORT",
                    "route": cls.get_route_for_action("FILE_REPORT", exposure_usd),
                    "reason": "R2: Exposure exceeds $1,000 or linked to shared device / connected cards."
                })

        elif fraud_probability < 0.70:
            actions.append({
                "action": "VERIFY_WITH_CUSTOMER",
                "route": cls.get_route_for_action("VERIFY_WITH_CUSTOMER", exposure_usd),
                "reason": f"R1: Probability {fraud_probability:.2f} on weak/single signal; confirm before blocking."
            })
            actions.append({
                "action": "MONITOR_CARD",
                "route": cls.get_route_for_action("MONITOR_CARD", exposure_usd),
                "reason": "R4: Monitor card pending customer verification."
            })

        elif pattern == "undocumented" or len(connected_cards) >= 2:
            actions.append({
                "action": "DECLINE_TRANSACTION",
                "route": cls.get_route_for_action("DECLINE_TRANSACTION", exposure_usd),
                "reason": "R9: Undocumented coordinated abuse pattern discovered across customers."
            })
            actions.append({
                "action": "BLOCK_CARD",
                "route": cls.get_route_for_action("BLOCK_CARD", exposure_usd),
                "reason": f"R2: Card compromised as part of shared multi-card syndicate ring; exposure ${exposure_usd:.2f}."
            })
            actions.append({
                "action": "CREATE_CASE",
                "route": cls.get_route_for_action("CREATE_CASE", exposure_usd),
                "reason": "R6/R9: Open fraud case for coordinated syndicate activity."
            })
            actions.append({
                "action": "FILE_REPORT",
                "route": cls.get_route_for_action("FILE_REPORT", exposure_usd),
                "reason": f"R6/R9: Shared device ring connects {len(connected_cards)} cards across multiple accounts."
            })
            actions.append({
                "action": "MONITOR_CONNECTED_CARDS",
                "route": cls.get_route_for_action("MONITOR_CONNECTED_CARDS", exposure_usd),
                "reason": f"R6: Place {len(connected_cards)} ring-connected cards under 72h heightened monitoring."
            })
            actions.append({
                "action": "ESCALATE_TO_ANALYST",
                "route": cls.get_route_for_action("ESCALATE_TO_ANALYST", exposure_usd),
                "reason": "R9: Hand novel multi-card syndicate ring to fraud specialist."
            })

        return actions

    @classmethod
    def evaluate_final_actions(
        cls,
        verdict: str,
        fraud_probability: float,
        pattern: str,
        exposure_usd: float,
        initial_actions: List[Dict[str, Any]],
        assumed_response: str,
        connected_cards: List[str]
    ) -> Tuple[List[Dict[str, Any]], str]:
        """
        Determines Final Next-Best Actions AFTER follow-up evidence response is ingested.
        """
        # If no follow-up was requested or assumed
        if not assumed_response:
            return initial_actions, "nothing"

        final_actions: List[Dict[str, Any]] = []
        what_changed = ""

        # Case 1: Customer confirmed legitimate activity / travel
        if "confirm" in assumed_response.lower() or "travel" in assumed_response.lower():
            final_actions.append({
                "action": "ALLOW_TRANSACTION",
                "route": cls.get_route_for_action("ALLOW_TRANSACTION", exposure_usd),
                "reason": "Cardholder confirmed transaction; allow transaction to stand."
            })
            final_actions.append({
                "action": "CLOSE_NO_FRAUD",
                "route": cls.get_route_for_action("CLOSE_NO_FRAUD", exposure_usd),
                "reason": "R3: Customer confirmation received; alert cleared."
            })
            what_changed = "Customer confirmed transaction, lowering fraud probability and clearing the alert as legitimate."
            return final_actions, what_changed

        # Case 2: Customer denied transaction
        final_actions.append({
            "action": "BLOCK_CARD",
            "route": cls.get_route_for_action("BLOCK_CARD", exposure_usd),
            "reason": f"R2: Customer denied purchases; exposure ${exposure_usd:.2f}."
        })
        final_actions.append({
            "action": "CREATE_CASE",
            "route": cls.get_route_for_action("CREATE_CASE", exposure_usd),
            "reason": "R2: Customer dispute confirmed."
        })

        if exposure_usd > 1000.0 or len(connected_cards) > 0:
            final_actions.append({
                "action": "FILE_REPORT",
                "route": cls.get_route_for_action("FILE_REPORT", exposure_usd),
                "reason": "R2: Customer denial with exposure > $1,000 or shared device connection."
            })

        if len(connected_cards) > 0:
            final_actions.append({
                "action": "MONITOR_CONNECTED_CARDS",
                "route": cls.get_route_for_action("MONITOR_CONNECTED_CARDS", exposure_usd),
                "reason": f"R6: Shared device profile links to connected cards: {', '.join(connected_cards[:3])}."
            })

        what_changed = (
            f"Customer denial confirmed fraud (probability raised to {fraud_probability:.2f}), "
            "triggering card block and regulatory report recommendations."
        )

        return final_actions, what_changed
