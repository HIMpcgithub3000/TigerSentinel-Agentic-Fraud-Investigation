# Bank Fraud Policy Version 1.0

## Core Principles
1. A risk score from the bank's detection model is a reason to look, never a verdict.
2. An agent may recommend actions, but only `auto` actions may be executed automatically. `L1` and `L2` actions require human approval.
3. Every recommendation must be grounded in verified evidence.

## Permitted Actions
- ALLOW_TRANSACTION: Let the flagged transaction stand. Impact: None. Route: auto.
- DECLINE_TRANSACTION: Decline the flagged authorization only. Card stays active. Impact: Low. Route: L1.
- MONITOR_CARD: Card stays active; raise monitoring sensitivity for 72 hours. Impact: None. Route: auto.
- MONITOR_CONNECTED_CARDS: Put other cards linked to the same device profile, region cluster, or ring under monitoring. Impact: None. Route: auto.
- WARN_CUSTOMER: Send an informational message (e.g. recurring charge reminder, travel security tip). Impact: None. Route: auto.
- VERIFY_WITH_CUSTOMER: Ask the cardholder whether they made the transaction. Card stays active pending reply. Impact: Low. Route: auto.
- STEP_UP_AUTH: Require a one-time passcode or app confirmation before further activity. Impact: Low. Route: auto.
- BLOCK_CARD: Block this card and reissue. Impact: High. Route: L1 (exposure <= $2,500) or L2 (exposure > $2,500).
- BLOCK_ALL_CARDS: Block every card the customer holds. Impact: Very high. Route: L2 always.
- GENERATE_REPORT: Write up the investigation for the internal record, without opening a case. Impact: None. Route: auto.
- CREATE_CASE: Open an internal fraud case with the evidence attached, and write it to the graph. Impact: None. Route: auto.
- FILE_REPORT: File a suspicious activity report with the regulator. Impact: None. Route: L2 always.
- ESCALATE_TO_ANALYST: Hand the case to a human analyst with the evidence. Impact: None. Route: auto.
- CLOSE_NO_FRAUD: Close the alert as legitimate. Impact: None. Route: auto.

## Mandatory Policy Rules
- RULE_R1: Verify before you block on a weak signal. If the case rests on a single signal (including risk score alone) and assessed fraud probability is below 0.70, recommend VERIFY_WITH_CUSTOMER or STEP_UP_AUTH before any block. Blocking a legitimate customer on one signal is a policy breach.
- RULE_R2: Customer denies the transaction. Recommend BLOCK_CARD and CREATE_CASE. Add FILE_REPORT if exposure exceeds $1,000 or the case connects to a shared device profile or another card's fraud.
- RULE_R3: Customer confirms the transaction. Recommend CLOSE_NO_FRAUD. Note the confirmation in the case file.
- RULE_R4: No reply within 24 hours. Recommend MONITOR_CARD and DECLINE_TRANSACTION for pending authorizations. Escalate if exposure exceeds $500.
- RULE_R5: Card testing. Three or more small online authorizations on one card within an hour, followed by a larger purchase: recommend DECLINE_TRANSACTION and STEP_UP_AUTH. If a purchase over $100 has already cleared, recommend BLOCK_CARD.
- RULE_R6: Shared origin. When several cards show fraud from the same device profile, the same billing region, or the same recipient email in one window, name the shared element, recommend CREATE_CASE and FILE_REPORT, and MONITOR_CONNECTED_CARDS for every card that shares it.
- RULE_R7: Disputed but legitimate. When the customer disputes a charge that matches their own recurring pattern (same merchant, same amount, monthly), recommend CREATE_CASE, VERIFY_WITH_CUSTOMER, and WARN_CUSTOMER. Do not block.
- RULE_R8: Escalate when uncertain and exposed. If the verdict is uncertain and exposure exceeds $500, or the evidence conflicts, recommend ESCALATE_TO_ANALYST.
- RULE_R9: Undocumented patterns. When activity fits none of the known patterns but the evidence shows coordinated or repeated abuse across customers, recommend CREATE_CASE, FILE_REPORT, and ESCALATE_TO_ANALYST, and describe the pattern in your own words. Do not force it into a known category.
- RULE_R10: Never BLOCK_ALL_CARDS unless at least two of the customer's cards show confirmed fraud or the customer's credentials are confirmed compromised.
