# Building CaseGuard: An Evidence-First Agentic Fraud Investigator on TigerGraph & LangGraph

**By Himanshu Sharma**  
**Hackathon Submission:** TigerGraph Agentic Fraud Investigation (Hacker House Goa 2026)  
**Date:** September 24, 2026  

---

## 1. Introduction: The Fraud Investigation Bottleneck

Financial institutions operate under relentless pressure: fraud detection models flag thousands of high-risk transactions every hour, yet human analysts spend 80% of their time manually pivoting between transactional databases, device logs, customer profiles, historical case archives, and institutional policy documents. By the time a multi-card fraud ring is manually traced, the funds have dispersed.

Standard AI attempts to automate this with "black-box" machine learning classifiers. But classifiers fail in three critical ways:
1. **They cannot explain why:** A score of `0.88` is not an auditable explanation.
2. **They treat model risk scores as ground truth:** A high risk score often represents a false alarm (e.g. legitimate travel), while sophisticated fraud can score low.
3. **They lack governance:** Autonomous models must never execute destructive actions (e.g. blocking accounts or filing SARs) without human authorization.

For the **TigerGraph x Hacker House Goa Hackathon**, we designed and built **CaseGuard**—an **autonomous, uncertainty-gated Agentic Fraud Investigation system** powered by **TigerGraph Savanna**, **LangGraph**, and **Two-Layer GraphRAG**.

---

## 2. Architectural Paradigm: From Classification to Investigation

The core innovation of CaseGuard is changing the paradigm from a traditional scoring pipeline to an **evidence-based investigative loop**:

```
[Traditional Classifier]
Data ──> Risk Score ──> Score Threshold ──> Action

[CaseGuard Agentic Investigator]
Trigger ──> Multi-Hop Graph Traversal (with as_of_timestamp)
        ──> Immutable Evidence Ledger (EV-001..EV-NNN)
        ──> Competing Hypothesis Evaluation (Typologies vs Legitimate)
        ──> Evidence Sufficiency Gating
        ──> Initial Next-Best Action (before extra evidence)
        ──> Controlled Follow-Up Evidence (Step-Up Auth / Customer Verification)
        ──> Updated Next-Best Action (after extra evidence)
        ──> Deterministic Policy & Governance Routing (auto, L1, L2, compliance)
        ──> Grounded SAR Narrative & Summary
        ──> Atomic TigerGraph Memory Writeback
```

### The Core Architectural Axiom:
> **The LLM never predicts fraud. TigerGraph proves relationships. GSQL and graph algorithms discover topology. Deterministic engines evaluate hypotheses and enforce policy. The LLM synthesizes natural language and drafts regulatory reports grounded strictly in verified evidence citations.**

---

## 3. How TigerGraph Powers the System

TigerGraph is the authoritative evidence plane and long-term memory layer of CaseGuard.

### 3.1 Graph Schema Design
CaseGuard implements an 11-vertex, 11-edge relational graph schema:
- **Core Entities:** `Customer`, `Card`, `Transaction`, `DeviceProfile`, `EmailDomain`, `BillingRegion`.
- **Institutional Memory:** `ClosedCase` (5,565 historical investigations from months 1–4) and `InvestigationCase` (cases investigated and committed by CaseGuard).
- **Relational Edges:** `OWNS`, `MADE`, `FROM_DEVICE`, `PURCHASER_EMAIL`, `BILLED_IN`, `INVOLVES`, `ON_CARD`, `INVESTIGATION_TARGETS`, `INVESTIGATION_INVOLVES_CARD`.

### 3.2 Parameterized GSQL Queries with Strict Temporal Cutoffs
To prevent future-data leakage, every GSQL query accepts an `as_of_timestamp` parameter:
1. **`customer_baseline(customer_id, as_of_ts)`**: Computes multi-month transaction volume, mean/stdev spend, and established geographic billing regions.
2. **`card_window(card_id, hours, as_of_ts)`**: Extracts chronological transaction sequences to identify card-testing patterns (e.g. $\ge 3$ micro-authorizations under $5$ followed by a large purchase).
3. **`device_ring(profile_id, as_of_ts)`**: Traverses multi-hop subgraphs to expose hardware fingerprints shared across distinct cards and customers.
4. **`similar_closed_cases(pattern, card_id, top_k, as_of_ts)`**: Retrieves precedent cases strictly resolved prior to the cutoff timestamp.
5. **`write_investigation_case(...)`**: Atomically inserts the investigation verdict, calibrated probability, exposure amount, and links memory to the graph.

---

## 4. Key Agentic Capabilities

### 4.1 The Evidence Ledger (First-Class Evidence Objects)
Rather than passing raw database dumps to an LLM, every observation is normalized into a structured **Evidence Ledger item** (`EV-001`, `EV-002`, ...):
- Cites exact system, query, and entity IDs.
- Contains mathematical evidence strength ($0.0 - 1.0$).
- Explicitly tracks what it **supports** AND what it **contradicts**.

### 4.2 Competing Hypotheses & Contradiction Resolution
CaseGuard evaluates 7 competing hypotheses for every case:
- `HYP_CARD_TESTING` (Policy R5)
- `HYP_CARD_NOT_PRESENT_FRAUD` (Policy R1-R4)
- `HYP_CARD_NOT_PRESENT_NEW_DEVICE`
- `HYP_OUT_OF_REGION_USE` (Policy R2, R3)
- `HYP_ACCOUNT_TAKEOVER`
- `HYP_UNDOCUMENTED_ANOMALY` (Policy R6, R9)
- `HYP_LEGITIMATE_ACTIVITY` (Policy R3, R7)

**Contradiction Handling in Action:** In Case `HHG-001`, the transaction carried a high risk score of `0.61` in billing region `444.0`. A naive classifier would flag fraud. CaseGuard's graph engine checked the customer's multi-month baseline and found region `444.0` was an established domestic region for this cardholder. This created a strong contradiction against `out_of_region_use`, resulting in a calibrated fraud probability of `0.24`, a verdict of `legitimate`, an action of `ALLOW_TRANSACTION`, and zero exposure.

### 4.3 Dual-Phase Next-Best Actions & Governance Routing
CaseGuard strictly adheres to the hackathon's requirement to record:
1. **Initial Next-Best Action + Route:** What to do *before* additional evidence (e.g. `VERIFY_WITH_CUSTOMER` [auto]).
2. **Updated Next-Best Action + Route:** What to do *after* the customer response is received (e.g. `BLOCK_CARD` [L1] + `CREATE_CASE` [auto] + `FILE_REPORT` [L2]).
3. **`what_changed` Rationale:** Explains the exact evidence shift that justified the policy progression.

### 4.4 Discovered Undocumented Syndicate Ring (Case HHG-014)
When analyzing benchmark case `HHG-014` (triggered by an analyst query regarding an unusual Samsung mobile device profile), CaseGuard traversed the hardware neighborhood and discovered the device was shared across **44 distinct customers and 44 distinct cards**. 

Because this coordinated abuse fit none of the standard five typologies, CaseGuard accurately classified it as `undocumented`, invoked Bank Policy Rule R9 and R6, recommended `DECLINE_TRANSACTION`, `BLOCK_CARD`, `CREATE_CASE`, `FILE_REPORT` [L2], `MONITOR_CONNECTED_CARDS`, and `ESCALATE_TO_ANALYST`, and drafted a comprehensive FinCEN SAR naming all 44 victim cards.

---

## 5. Benchmark Performance: 20 out of 20 Validated

CaseGuard was evaluated on the official 20 IEEE-CIS benchmark cases (`HHG-001` through `HHG-020`):
- **100% Contract Compliance:** All 20 generated JSON answer files passed `validate_submission.py` with zero schema errors.
- **Accurate Legitimate Discrimination:** Cleanly recognized legitimate travel and recurring charges, preventing costly false-positive customer card blocks.
- **Complete SAR Reporting:** Drafted grounded, multi-subject regulatory narratives for all high-exposure syndicate and confirmed fraud cases.
- **Atomic Graph Writeback:** Verified that all 20 cases were committed to TigerGraph memory (`written_to_graph: true`).

---

## 6. What We Learned & Future Directions

Building CaseGuard demonstrated that **graph topology is indispensable for modern financial intelligence**:
1. **Isolated signals are deceptive:** Transactions that look terrifying in isolation are often benign in customer subgraphs; transactions that look harmless in isolation are exposed as part of a 44-card syndicate when multi-hop device edges are traversed.
2. **Deterministic guardrails earn trust:** Compliance officers will never accept an unconstrained LLM making financial blocking decisions. Restricting the LLM to grounded synthesis and explainability while keeping policy deterministic is the winning formula for enterprise adoption.

**With more time, we would implement:**
- Continuous streaming Kafka ingestion into TigerGraph Savanna.
- Automated dynamic GSQL query synthesis with formal validation.
- Active reinforcement learning on human analyst approval feedback.

---

## 7. Conclusion

CaseGuard proves that combining **TigerGraph's multi-hop relationship power** with **LangGraph's stateful orchestration** and **deterministic governance** transforms fraud investigation from a slow, error-prone manual triage into an instantaneous, auditable, and defensible intelligence system.
