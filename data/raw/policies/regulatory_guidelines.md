# Regulatory Guidance & Suspicious Activity Reporting (SAR)

## Regulatory Framework: FinCEN & BSA/AML
Under 31 CFR 1020.320 and BSA regulations, financial institutions must file a Suspicious Activity Report (SAR) when detecting known or suspected violations of federal law or suspicious transactions involving:
1. Insider abuse involving any amount.
2. Transactions aggregating $5,000 or more where a suspect can be identified.
3. Transactions aggregating $25,000 or more regardless of potential suspects.
4. Coordinated fraud rings, shared device syndicates, or repeated unauthorized card usage indicating professional or organized fraud.

## SAR Narrative Standards
A complete and sufficient SAR narrative must answer:
- **Who:** Specific cardholder(s), customer ID(s), and related compromised cards/accounts.
- **What:** Exact unauthorized transaction amount(s), velocity bursts, testing authorizations, and final cleared purchases.
- **When:** Exact dates and time intervals of the suspicious activity.
- **Where:** Channels (online/card-not-present), billing regions (`addr1`), IP/proxy flags, and device fingerprints.
- **Why:** Why the activity is deemed suspicious (e.g. card testing sequence followed by high-dollar purchase, shared hardware across multiple victim cards, novel device with out-of-region use).
- **How:** The specific methodology used by the actor (e.g. automated credential stuffing, card testing script, account takeover).
- **Actions Taken:** Protective actions executed (e.g. card blocked and reissued, connected cards placed under monitoring, law enforcement notification).

## Mandatory Typology Definitions
1. **Card Testing Typology:** Stolen card numbers checked via automated micro-authorizations (often <$5) to test validity before large-scale monetization.
2. **Card-Not-Present (CNP) Fraud:** Online exploitation of stolen card numbers with anomalous amounts and velocity bursts within a 48-hour window.
3. **Shared-Device Syndicate Ring:** Hardware device fingerprints or browser profiles reused across multiple distinct customer accounts, often with prior confirmed fraud chargebacks.
4. **Out-of-Region Anomaly:** Rapid card-present transactions in a novel geographic area while legitimate domestic transactions continue.
5. **Account Takeover (ATO):** Stolen customer login credentials used from an anomalous device with shipping/billing address redirection.
6. **Undocumented / Emerging Fraud:** Coordinated graph clustering or novel velocity patterns defying established typologies that warrant custom narrative documentation.
