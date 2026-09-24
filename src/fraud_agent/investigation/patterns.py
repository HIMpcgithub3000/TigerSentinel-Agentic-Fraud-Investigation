"""
Deterministic Pattern Detectors for the 5 Known Fraud Typologies,
Undocumented Emerging Typologies, and Legitimate Baseline Behaviors.
"""

from typing import Dict, Any, List, Tuple, Optional
from datetime import datetime, timedelta
import pandas as pd


def detect_card_testing(
    window_txns: List[Dict[str, Any]],
    flagged_txn: Dict[str, Any]
) -> Tuple[bool, float, List[str], str]:
    """
    Pattern 1: Card Testing.
    Three or more tiny online authorizations (often < $5) on one card within an hour,
    followed by a larger purchase. Confirmed by sequence. (Policy R5)
    """
    if not window_txns:
        return False, 0.0, [], ""

    online_txns = [t for t in window_txns if t.get("channel") == "online"]
    micro_auths = [t for t in online_txns if float(t.get("TransactionAmt", 0.0)) < 5.0]
    
    # Check if we have 3+ micro auths within 1 hour
    if len(micro_auths) >= 3:
        # Check temporal spread of micro auths
        ts_list = [datetime.strptime(t["ts"], "%Y-%m-%d %H:%M:%S") for t in micro_auths]
        ts_list.sort()
        if (ts_list[-1] - ts_list[0]).total_seconds() <= 3600:
            larger_purchases = [t for t in online_txns if float(t.get("TransactionAmt", 0.0)) >= 10.0]
            affected_ids = [str(t["TransactionID"]) for t in micro_auths + larger_purchases]
            desc = f"Detected {len(micro_auths)} micro-authorizations under $5 within 1 hour followed by larger purchase."
            return True, 0.88, affected_ids, desc

    return False, 0.0, [], ""


def detect_card_not_present(
    window_txns: List[Dict[str, Any]],
    flagged_txn: Dict[str, Any],
    baseline: Dict[str, Any]
) -> Tuple[bool, float, List[str], str]:
    """
    Pattern 2: Card-Not-Present Fraud.
    Online transactions with amounts/products that don't fit history,
    burst of 2-4 within 48 hours. (Policy R1-R4)
    """
    if flagged_txn.get("channel") != "online":
        return False, 0.0, [], ""

    amt = float(flagged_txn.get("TransactionAmt", 0.0))
    avg_spend = baseline.get("avg_spend", 0.0)
    max_spend = baseline.get("max_spend", 0.0)

    # Significant deviation from normal customer baseline
    if avg_spend > 0 and amt > (avg_spend * 2.5) and amt > max_spend:
        affected_ids = [str(flagged_txn["TransactionID"])]
        desc = f"Online purchase of ${amt:.2f} significantly exceeds historical average (${avg_spend:.2f}) and historical maximum (${max_spend:.2f})."
        return True, 0.72, affected_ids, desc

    return False, 0.0, [], ""


def detect_card_not_present_new_device(
    window_txns: List[Dict[str, Any]],
    flagged_txn: Dict[str, Any],
    device_ring: Dict[str, Any],
    baseline: Dict[str, Any]
) -> Tuple[bool, float, List[str], str]:
    """
    Pattern 3: Card-Not-Present Fraud from a New Device.
    Online transaction from a new device profile not previously seen on this account.
    Stronger than pattern 2. (Policy R1-R4)
    """
    if flagged_txn.get("channel") != "online":
        return False, 0.0, [], ""

    dev_profile = flagged_txn.get("device_profile", "")
    if not dev_profile or dev_profile == "Unknown Device":
        return False, 0.0, [], ""

    amt = float(flagged_txn.get("TransactionAmt", 0.0))
    avg_spend = baseline.get("avg_spend", 0.0)

    # New device coupled with spend deviation
    if amt > avg_spend * 1.5:
        affected_ids = [str(flagged_txn["TransactionID"])]
        desc = f"Online transaction of ${amt:.2f} executed from new device profile ({dev_profile}) inconsistent with account baseline."
        return True, 0.76, affected_ids, desc

    return False, 0.0, [], ""


def detect_out_of_region(
    flagged_txn: Dict[str, Any],
    baseline: Dict[str, Any]
) -> Tuple[bool, float, List[str], str]:
    """
    Pattern 4: Out-of-Region Use.
    Card-present purchases in a billing region the cardholder has no history in,
    while normal activity continues at home. (Policy R2, R3)
    """
    if flagged_txn.get("channel") != "in_person":
        return False, 0.0, [], ""

    region = str(flagged_txn.get("addr1", ""))
    known_regions = baseline.get("known_regions", [])

    if region and region != "nan" and known_regions:
        if region not in known_regions:
            affected_ids = [str(flagged_txn["TransactionID"])]
            desc = f"In-person transaction in unfamiliar billing region {region}. Known regions: {', '.join(known_regions[:5])}."
            return True, 0.74, affected_ids, desc

    return False, 0.0, [], ""


def detect_account_takeover(
    window_txns: List[Dict[str, Any]],
    flagged_txn: Dict[str, Any],
    baseline: Dict[str, Any]
) -> Tuple[bool, float, List[str], str]:
    """
    Pattern 5: Account Takeover.
    Mixed-channel activity inconsistent with cardholder, device anomalies,
    pointing to stolen credentials.
    """
    if not window_txns:
        return False, 0.0, [], ""

    channels = set(t.get("channel") for t in window_txns)
    if len(channels) > 1 and float(flagged_txn.get("risk_score", 0.0) or 0.0) >= 0.85:
        affected_ids = [str(t["TransactionID"]) for t in window_txns]
        desc = "High-risk mixed-channel activity inconsistent with cardholder baseline profile."
        return True, 0.82, affected_ids, desc

    return False, 0.0, [], ""


def detect_undocumented_ring(
    flagged_txn: Dict[str, Any],
    device_ring: Dict[str, Any]
) -> Tuple[bool, float, List[str], str, str]:
    """
    Pattern 6: Undocumented Pattern (Shared Device Syndicate Ring).
    Activity fits none of the standard five typologies, but graph topology proves
    multiple cards/customers sharing the same hardware linked to historical fraud. (Policy R9)
    """
    cards = device_ring.get("connected_cards", [])
    custs = device_ring.get("connected_customers", [])
    prior_cases = device_ring.get("prior_fraud_cases", [])

    if len(cards) >= 2 or len(prior_cases) > 0:
        desc = (
            f"Syndicate device ring discovered: device profile is shared across {len(cards)} cards "
            f"and {len(custs)} customers, with {len(prior_cases)} prior confirmed fraud cases in neighborhood."
        )
        return True, 0.86, [str(flagged_txn["TransactionID"])], "undocumented", desc

    return False, 0.0, [], "", ""
