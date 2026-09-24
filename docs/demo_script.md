# CaseGuard Demo Video Script (3–5 Minutes)

**Video Title:** Autonomous Agentic Fraud Investigation on TigerGraph  
**Presenter:** Himanshu Sharma  
**Target Duration:** 3:30 – 4:30 Minutes  

---

## [0:00 – 0:45] Act 1: The Problem & Solution Overview

### Visual:
- Start on Title Slide: **CaseGuard: Agentic Fraud Investigation Powered by TigerGraph**.
- Switch screen to the **CaseGuard Analyst Console** (`http://localhost:5173`) showing the clean dark-mode dashboard with 20 benchmark cases loaded in the sidebar.

### Spoken Script:
> "Hello everyone! Today, fraud teams at financial institutions are overwhelmed. Traditional machine learning models flag thousands of alerts based on isolated risk scores, but human analysts spend hours manually clicking between databases, device logs, and policy PDFs to connect the dots.
> 
> Welcome to **CaseGuard**, an autonomous, evidence-first fraud investigation agent powered by **TigerGraph Savanna**, **LangGraph**, and **Two-Layer GraphRAG**. 
> 
> Instead of acting like a black-box classifier that guesses fraud from a score, CaseGuard investigates like a seasoned human fraud detective: it traverses multi-hop graph subgraphs, builds an immutable Evidence Ledger, evaluates competing hypotheses, requests follow-up evidence when uncertain, enforces strict human approval governance, and writes institutional memory back to TigerGraph."

---

## [0:45 – 1:45] Act 2: Resolving a False Positive (Case HHG-001)

### Visual:
- In the Case Queue sidebar, click on **Case HHG-001**.
- Point to the trigger banner: Real-time model scored transaction `3514030` at `0.61` in billing region `444.0`.
- Show the **TigerGraph Multi-Hop Subgraph canvas**: Customer `C12382` connected to Card and historical transactions.
- Switch to the **Evidence Ledger tab** showing items `EV-001` through `EV-005`.

### Spoken Script:
> "Let's start with Case HHG-001. Here, the bank's machine learning model flagged an in-person purchase with a high risk score of 0.61 in billing region 444. A naive rule would immediately block the customer's card, creating a terrible customer experience.
> 
> But watch how CaseGuard investigates using TigerGraph. It calls `customer_baseline` with a strict `as_of_timestamp` to check the cardholder's multi-month history. TigerGraph reveals that region 444 is actually one of the customer's established, recurring billing regions!
> 
> CaseGuard's hypothesis engine registers this as a strong contradiction against out-of-region fraud. It calibrates the fraud probability down to 0.24, outputs a verdict of `legitimate`, sets exposure to zero, recommends `ALLOW_TRANSACTION` and `CLOSE_NO_FRAUD` under Policy Rule R3, and commits the memory to TigerGraph with zero human friction."

---

## [1:45 – 3:00] Act 3: Uncovering a 44-Card Device Ring & SAR Filing (Case HHG-014)

### Visual:
- In the sidebar, click on **Case HHG-014**.
- Point to the Cytoscape graph canvas: A central device node connected to dozens of cards and customers in an expansive star-network!
- Click on the **Dual-Phase Next-Best Actions tab**.
- Click the red button: **View FinCEN SAR Filing** to open the formal compliance modal.

### Spoken Script:
> "Now let's examine a complex, coordinated fraud attack: Case HHG-014. This was triggered by an analyst query regarding an unusual Samsung mobile device profile on transaction 3478561.
> 
> CaseGuard invokes the parameterized GSQL query `device_ring`. In milliseconds, TigerGraph traverses the multi-hop hardware edges and uncovers a massive syndicate ring: this exact device profile is being shared across **44 distinct customers and 44 distinct cards**!
> 
> Because this coordinated abuse does not match the five standard typologies, CaseGuard avoids forcing a false classification. It tags it as `undocumented`, invoking Bank Policy Rules R6 and R9.
> 
> Notice the two-phase governance flow:
> - In Phase 1, it recommends an initial block and heightened monitoring.
> - In Phase 2, it updates the recommendation to `DECLINE_TRANSACTION`, `BLOCK_CARD` [L1], `CREATE_CASE`, `MONITOR_CONNECTED_CARDS`, and `FILE_REPORT` [L2 approval].
> - Look at the 'What Changed' rationale: it explicitly explains how the 44-card device linkage triggered the mandatory regulatory filing.
> 
> If we click 'View FinCEN SAR Filing', CaseGuard has automatically drafted a complete, audit-ready regulatory narrative conforming to FinCEN 31 CFR 1020.320, listing all 44 subject cards, the device fingerprint, and the exact dollar exposure."

---

## [3:00 – 3:45] Act 4: Benchmark Suite & Full System Architecture

### Visual:
- Switch to terminal: run `python3 scripts/validate_submission.py output/cases`.
- Show all 20 green checkmarks: `★ SUCCESS: All 20 benchmark case files strictly conform to the challenge contract!`.
- Run `python3 -m pytest tests/` showing all 12 tests passing.

### Spoken Script:
> "CaseGuard was evaluated across all 20 official benchmark cases in the IEEE-CIS dataset. Running our submission validator confirms that 100% of the 20 generated case files strictly conform to the challenge contract:
> - Legitimate cases have zero false-positive exposure.
> - High-risk cases cite real graph entity IDs.
> - Every SAR filing agrees with the policy actions.
> - And all cases are atomically written back into TigerGraph's graph memory.
> 
> Our test suite verifies everything from GSQL temporal cutoffs and approval routing to full state machine resilience."

---

## [3:45 – 4:15] Act 5: Conclusion & Wrap-Up

### Visual:
- Return to the Analyst Console with the graph moving gently.
- Show credits: Built by Himanshu Sharma with TigerGraph Savanna, LangGraph, and React.

### Spoken Script:
> "By combining TigerGraph's unmatched graph traversal speed with LangGraph's stateful orchestration and deterministic governance, CaseGuard transforms fraud investigation into an auditable, explainable, and instantaneous defense system.
> 
> Thank you to TigerGraph and Hacker House Goa for this incredible challenge!"
