"""
Evidence Sufficiency Engine.
Determines when available graph evidence is sufficient to defend an action
or when controlled follow-up evidence must be requested.
"""

from typing import Dict, Any, Tuple


class SufficiencyEngine:
    """
    Evaluates evidence sufficiency according to Bank Policy rules R1, R4, and R8.
    """

    @staticmethod
    def assess_sufficiency(
        verdict: str,
        fraud_probability: float,
        primary_pattern: str,
        trigger_type: str,
        has_followup_response: bool,
        exposure_usd: float
    ) -> Tuple[bool, str, str]:
        """
        Returns (is_sufficient, reason, recommended_request_type).
        """
        # If follow-up evidence has already been received, investigation is complete
        if has_followup_response:
            return True, "Follow-up customer verification received. Evidence is complete.", ""

        # Customer report trigger directly provides cardholder dispute
        if trigger_type == "customer_report":
            return True, "Customer direct dispute provides initial testimony; graph corroboration assessed.", ""

        # Strong graph-confirmed patterns with high confidence do not need customer delay
        if primary_pattern == "card_testing" and fraud_probability >= 0.85:
            return True, "Card testing sequence confirmed by multiple micro-authorizations; sufficient to protect card.", ""

        # Single risk score trigger with probability < 0.70 mandates verification under Policy R1
        if trigger_type == "risk_score" and fraud_probability < 0.70 and primary_pattern != "none":
            return (
                False,
                "R1: Single risk score signal with probability < 0.70 requires customer verification before blocking.",
                "customer_validation"
            )

        # Ambiguous cases in uncertain zone
        if verdict == "uncertain":
            return (
                False,
                "Signals are ambiguous; requiring customer validation to confirm authorization.",
                "customer_validation"
            )

        # Legitimate verdict confirmed by established baseline
        if verdict == "legitimate":
            return True, "Historical customer baseline confirms legitimate recurring/domestic activity.", ""

        return True, "Evidence provides sufficient multi-hop graph support under bank policy.", ""
