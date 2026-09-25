# TigerGraph Agentic Fraud Investigation — Requirements

## 1. Project Statement

Build a lightweight but strong **Agentic Fraud Investigation and Next-Best-Action platform** centered on **TigerGraph**.

The system receives a fraud trigger, investigates the related customer/card/transaction/device/account/network, performs deep graph-based evidence collection, evaluates competing fraud hypotheses, determines whether evidence is sufficient, requests additional evidence when required, recommends or executes policy-approved next actions, records the investigation as a case, and preserves the investigation in graph memory for future cases.

The system should be **strong in fundamentals rather than unnecessarily heavy**. TigerGraph is the core evidence and relationship-analysis layer. LangGraph and an LLM should be used only where they materially improve orchestration, evidence synthesis, tool selection, or explanation. They must not replace deterministic graph analysis or policy controls.

---

## 2. Purpose

### Primary purpose

Enable an investigator to move from:

**Fraud Trigger → Graph Investigation → Deep Evidence → Hypothesis Assessment → Uncertainty Gate → Additional Evidence → Next Best Action → Case Decision → Graph Memory**

without manually navigating multiple disconnected systems.

### Core objectives

1. Detect and investigate suspicious activity.
2. Use TigerGraph to prove relationships and multi-hop connections.
3. Collect sufficient evidence before making a defensible decision.
4. Detect fraud patterns that are not obvious from a single transaction.
5. Handle uncertain cases rather than forcing premature fraud/legitimate decisions.
6. Recommend policy-compliant next-best actions.
7. Preserve complete case history and evidence provenance.
8. Reuse historical cases as investigation memory.
9. Make every important decision explainable.
10. Keep the architecture lightweight, testable, and demonstrable.

---

# 3. Core Architectural Principle

## 3.1 TigerGraph is the core

TigerGraph must be the primary graph/evidence system for:

- Graph storage.
- Entity relationships.
- Transaction relationships.
- Multi-hop traversal.
- Device/IP/account/card relationship analysis.
- Historical case relationships.
- Fraud-ring discovery.
- Graph algorithms and centrality.
- Case-memory retrieval.
- Investigation writeback.

The project should demonstrate meaningful TigerGraph usage, not merely use it as a decorative visualization or secondary database.

## 3.2 Optional agent layer

Use **LangGraph + an LLM only where they materially improve the system**.

Good uses:

- Selecting the next investigation tool/query.
- Orchestrating evidence collection.
- Synthesizing retrieved evidence.
- Comparing competing hypotheses.
- Producing grounded explanations.
- Summarizing historical cases.

The LLM must NOT:

- Invent graph relationships.
- Authoritatively calculate fraud probability where deterministic logic is required.
- Override TigerGraph evidence.
- Override policy rules.
- Bypass approval requirements.
- Directly authorize restricted financial actions.

If LangGraph/LLM adds complexity without measurable benefit, keep the deterministic state machine and TigerGraph query pipeline.

---

# 4. Users

## Primary — Fraud Analyst

The analyst can:

- See active investigations.
- Open a case.
- Understand why it was triggered.
- Inspect graph evidence.
- Explore connected entities.
- Review transaction and behavioral patterns.
- Review similar historical cases.
- Understand uncertainty.
- Request/review additional evidence.
- Review recommended actions.
- Approve/reject actions where required.
- Escalate or close a case.
- Review the complete audit trail.

## Secondary — Fraud Supervisor

The supervisor can:

- Review escalated cases.
- Review approval-required actions.
- Inspect evidence and reasoning.
- Approve/reject actions.
- Review recurring fraud rings and patterns.

---

# 5. Functional Requirements

## FR-01 — Investigation Trigger

The system shall start an investigation from:

- Fraud/risk score signal.
- Customer report.
- Fraud analyst request.
- Suspicious transaction event.
- Other supported fraud event.

Every investigation stores:

- Case ID.
- Trigger type.
- Trigger timestamp.
- Transaction ID when applicable.
- Customer ID.
- Card/account ID.
- Initial risk score.
- Initial investigation reason.

Primary button: **START INVESTIGATION**

---

## FR-02 — Case Creation

Create/open a case when investigation is warranted.

Case fields:

- Case ID.
- Status.
- Trigger.
- Entities.
- Evidence ledger.
- Hypotheses.
- Risk assessment.
- Uncertainty assessment.
- Actions.
- Approval state.
- Timeline.
- Decisions.
- Final outcome.

Recommended statuses:

`NEW` → `INVESTIGATING` → `AWAITING_EVIDENCE` → `AWAITING_APPROVAL` → `ESCALATED` → `RESOLVED_FRAUD / RESOLVED_LEGITIMATE / MONITORING`

---

## FR-03 — TigerGraph Evidence Retrieval

TigerGraph shall provide:

### Transaction evidence

- Transaction history.
- Amount patterns.
- Frequency.
- Time-window activity.
- Declines.
- Micro-authorizations.
- Merchant relationships.
- Geographic behavior.

### Customer evidence

- Historical baseline.
- Typical amount.
- Typical region.
- Typical merchants.
- Behavioral deviation.

### Card/account evidence

- Related transactions.
- Connected accounts.
- Connected cards.
- Historical activity.

### Device/network evidence

- Shared devices.
- Device reuse.
- Device clusters.
- IP relationships.
- Shared infrastructure.
- Identity relationships.

### Graph evidence

- Multi-hop relationships.
- Degree/centrality.
- Connected components.
- Fraud-ring candidates.
- Suspicious hubs.

### Historical evidence

- Similar closed cases.
- Confirmed fraud cases.
- Cleared cases.
- Recurring entities.
- Recurring patterns.

---

## FR-04 — Deep Evidence Collection

Investigation should progressively move through:

```text
Level 0: Trigger
        ↓
Level 1: Direct Transaction Context
        ↓
Level 2: Behavioral Context
        ↓
Level 3: Relationship Context
        ↓
Level 4: Multi-Hop Graph Investigation
        ↓
Level 5: Historical Case Memory
        ↓
Level 6: Policy / Regulatory Context
```

### Level 1

Transaction, card, customer, merchant, timestamp, amount.

### Level 2

Customer baseline, card window, velocity, geographic deviation, historical behavior.

### Level 3

Device, IP, account, connected cards/customers/merchants.

### Level 4

3-hop fraud-ring investigation, shared-device/IP clusters, suspicious hubs, connected transactions.

### Level 5

Similar cases, previous decisions, outcomes, recurring entities.

### Level 6

Fraud policy, typologies, approval requirements, regulatory requirements.

The system should stop collecting evidence when the sufficiency gate determines that more evidence is unlikely to materially change the decision.

---

## FR-05 — Competing Hypotheses

Evaluate multiple explanations:

- Legitimate activity.
- Card cloning.
- Card testing.
- Account takeover.
- Device compromise.
- Out-of-region activity.
- Out-of-pattern behavior.
- Coordinated/network fraud.
- Undocumented/novel pattern.

Each hypothesis contains:

- Name.
- Supporting evidence.
- Contradicting evidence.
- Evidence strength.
- Related entities.
- Related graph queries.
- Confidence.
- Status: supported / contradicted / unresolved.

---

## FR-06 — Evidence Ledger

Every material finding must record:

- Evidence ID.
- Claim.
- Source.
- Source type.
- Timestamp.
- Entity IDs.
- Transaction IDs.
- Query/tool.
- Supporting hypothesis.
- Contradicting hypothesis.
- Evidence strength.
- Provenance/reference.
- Pre/post follow-up status.

Source types:

`TIGERGRAPH`, `GSQL_QUERY`, `GRAPH_ALGORITHM`, `POLICY`, `HISTORICAL_CASE`, `CUSTOMER_RESPONSE`, `ANALYST_INPUT`

---

## FR-07 — Contradiction Detection

Explicitly detect contradictions such as:

- High risk score but behavior matches baseline.
- Suspicious device but normal transaction behavior.
- Customer denial despite otherwise normal behavior.
- Customer confirmation despite suspicious network linkage.
- Similar historical cases with different outcomes.

Use labels:

`SUPPORTS`, `CONTRADICTS`, `NEUTRAL`, `UNRESOLVED`

---

## FR-08 — Decision State Tree

Use a deterministic state tree:

```text
TRIGGER
   |
   v
INITIAL INVESTIGATION
   |
   v
DIRECT EVIDENCE
   |
   v
BEHAVIORAL EVIDENCE
   |
   v
GRAPH RELATIONSHIPS
   |
   v
HISTORICAL CASE MEMORY
   |
   v
HYPOTHESIS ASSESSMENT
   |
   v
EVIDENCE SUFFICIENT?
   |                  |
  YES                 NO
   |                  |
   |            IDENTIFY MISSING EVIDENCE
   |                  |
   |            REQUEST CONTROLLED EVIDENCE
   |                  |
   |            RECEIVE RESPONSE
   |                  |
   |            REASSESS
   |                  |
   +------------------+
   |
   v
POLICY CHECK
   |
   v
NEXT BEST ACTION
   |
   v
APPROVAL REQUIRED?
   |                  |
  NO                 YES
   |                  |
EXECUTE          HUMAN APPROVAL
   |                  |
   +------------------+
            |
            v
       CASE UPDATE
            |
            v
      TIGERGRAPH WRITEBACK
            |
            v
       CASE MEMORY
```

Every state must have:

- Input.
- Output.
- Entry condition.
- Exit condition.
- Evidence requirement.
- Failure handling.
- Audit record.

---

## FR-09 — Uncertainty Assessment

Explicitly classify:

- Evidence sufficiency.
- Decision confidence.
- Remaining uncertainty.
- Missing evidence.
- Contradictions.
- Whether another investigation step is justified.

Recommended states:

`SUFFICIENT`, `INSUFFICIENT`, `AMBIGUOUS`, `CONTRADICTORY`, `ESCALATION_REQUIRED`

Do not force a fraud/legitimate decision when evidence is insufficient.

---

## FR-10 — Controlled Additional Evidence

When insufficient, request approved evidence such as:

- Customer transaction confirmation.
- Step-up authentication.
- Additional customer information.
- Analyst clarification.
- Approved external data lookup.

Record:

- Why requested.
- Which uncertainty it addresses.
- What decision it could change.
- Request time.
- Response.
- Resulting evidence.

---

## FR-11 — Next Best Action

Possible actions:

- Allow transaction.
- Decline transaction.
- Monitor transaction.
- Monitor account.
- Block card.
- Block account.
- Warn customer.
- Create case.
- Request evidence.
- Escalate.
- File report.
- Monitor connected entities.
- Close as legitimate.
- Resolve as fraud.

Each action stores:

- Action.
- Reason.
- Supporting evidence.
- Policy rule.
- Approval route.
- Execution status.
- Recommended/executed state.

---

## FR-12 — Policy and Permission Enforcement

The deterministic policy engine enforces:

- Allowed actions.
- Approval routes.
- Exposure thresholds.
- Evidence requirements.
- Regulatory requirements.
- Human approval.

Recommended levels:

`AUTO`, `L1`, `L2`, `SUPERVISOR`

The LLM cannot bypass policy.

---

## FR-13 — Before/After Evidence

For cases requiring additional evidence, preserve:

### Phase 1
Decision before evidence.

### Phase 2
Decision after evidence.

### What changed
- New evidence.
- Previous uncertainty.
- Hypothesis impact.
- Risk impact.
- Action change.
- Approval change.

---

## FR-14 — Historical Case Memory

Store/retrieve:

- Previous cases.
- Patterns.
- Entities.
- Relationships.
- Decisions.
- Actions.
- Outcomes.
- Analyst decisions.
- Relevant evidence.

TigerGraph should preserve relationship structure for recurring fraud entities/patterns.

---

## FR-15 — Graph Writeback

Write the completed case to TigerGraph:

- InvestigationCase.
- Verdict.
- Pattern.
- Risk assessment.
- Exposure.
- Status.
- Summary.
- Target transaction.
- Target card/account.
- Evidence relationships.
- Action relationships.
- Fraud report relationships.

Perform read-after-write verification.

---

## FR-16 — GraphRAG

Combine:

1. Structured TigerGraph evidence.
2. Relevant fraud policy/typology/regulatory documents.

Pass only relevant grounded context to the LLM.

Every retrieved policy claim must retain provenance.

Example:

```text
Evidence:
Device D123 connects 56 cards.

Source:
TigerGraph → device_ring.gsql

Policy:
R6 — Shared-device investigation.

Regulation:
31 CFR § 1020.320

Impact:
Supports coordinated fraud hypothesis.
```

---

## FR-17 — Explainability

Explain:

- Why investigation started.
- What evidence was collected.
- Which graph relationships mattered.
- Which hypotheses were considered.
- Contradictions.
- Why more evidence was requested.
- Why investigation stopped.
- Why action was recommended.
- Why approval was required.
- What changed after new evidence.

All explanations must be grounded in recorded evidence.

---

## FR-18 — Audit Trail

Record:

- Trigger.
- State transition.
- Tool call.
- GSQL query.
- Evidence retrieval.
- Hypothesis update.
- Policy decision.
- Action recommendation.
- Approval.
- Execution.
- Case update.
- Graph writeback.

Suggested fields:

`timestamp, case_id, state, actor, action, tool, query, result, evidence_ids, policy_rule, approval_route, status`

---

## FR-19 — User Interface

Use **5 core screens** to keep the product simple.

---

# 6. UI Screen 1 — Investigation Dashboard

## Purpose

Overview of active investigations.

### Essential components

**Header**
- Product name.
- Global search.
- Notifications.
- Analyst profile.
- TigerGraph connection status.

**KPI cards**
- Active Cases.
- High Risk.
- Awaiting Evidence.
- Awaiting Approval.
- Resolved Today.
- Connected Fraud Rings.

**Case table**
- Case ID.
- Trigger.
- Customer/Card.
- Risk.
- Pattern.
- Confidence.
- Status.
- Next Best Action.
- Last Updated.

**Filters**
- Status.
- Risk.
- Pattern.
- Trigger.
- Date.
- Approval state.

### Buttons

`START INVESTIGATION`  
`OPEN CASE`  
`FILTER`  
`SEARCH`  
`REFRESH`

### Evidence shown

Only high-level evidence:

- Risk.
- Main pattern.
- Evidence count.
- Connected entity count.
- Recommended action.
- Approval state.

---

# 7. UI Screen 2 — Investigation Workspace

## Purpose

Primary investigation screen.

### Header

- Case ID.
- Status.
- Trigger.
- Risk/confidence.
- Investigation timer.

Buttons:

`PAUSE` `RESUME` `ESCALATE` `CLOSE CASE`

### A. Trigger Summary

- Trigger type.
- Transaction.
- Customer.
- Card/account.
- Amount.
- Timestamp.
- Initial risk score.

### B. Investigation State

Display:

```text
Trigger
 ↓
Graph Retrieval
 ↓
Behavior Analysis
 ↓
Relationship Analysis
 ↓
Hypothesis Assessment
 ↓
Sufficiency Gate
 ↓
Additional Evidence
 ↓
NBA
 ↓
Approval
 ↓
Writeback
```

Show completed/current/waiting/failed state.

### C. Evidence Summary

- Evidence count.
- Supporting evidence.
- Contradicting evidence.
- Missing evidence.
- Evidence strength.

Buttons:

`VIEW ALL EVIDENCE`  
`COLLECT MORE EVIDENCE`  
`COMPARE HYPOTHESES`

### D. Hypotheses

Each hypothesis shows:

- Confidence.
- Supporting count.
- Contradicting count.
- Related graph entities.

Button:

`VIEW REASONING`

### E. Next Best Action

Show:

- Action.
- Reason.
- Policy rule.
- Approval.
- Execution status.

Buttons:

`APPROVE` `REJECT` `REQUEST EVIDENCE` `ESCALATE`

---

# 8. UI Screen 3 — Graph Evidence Explorer

## Purpose

This should be the strongest TigerGraph demonstration.

### Graph canvas

Entity nodes:

- Customer.
- Account.
- Card.
- Transaction.
- Device.
- IP.
- Merchant.
- InvestigationCase.
- FraudReport.

Edges show actual relationship types.

### Graph controls

`EXPAND 1 HOP`  
`EXPAND 2 HOPS`  
`EXPAND 3 HOPS`  
`FIND CONNECTIONS`  
`SHOW FRAUD RING`  
`SHOW SHARED DEVICES`  
`SHOW SHARED IP`  
`SHOW SIMILAR CASES`  
`RESET GRAPH`

### Selected entity panel

- Entity ID.
- Entity type.
- Risk signals.
- Connected count.
- Related transactions.
- Related cases.
- First seen.
- Last seen.

### Query provenance

```text
Query:
device_ring

Traversal:
Card → Transaction → Device → Transaction → Card

Depth:
3 hops

Result:
56 connected cards

Evidence:
Supports coordinated fraud hypothesis
```

### Graph algorithm panel

- Degree.
- Centrality.
- Component size.
- Shared device count.
- Shared IP count.

---

# 9. UI Screen 4 — Evidence, Decision & Approval

## Purpose

Show exactly why an action is recommended.

### Evidence ledger columns

- Evidence ID.
- Claim.
- Source.
- Entity.
- Strength.
- Supports.
- Contradicts.
- Timestamp.
- Provenance.

Filters:

`SUPPORTING` `CONTRADICTING` `POLICY` `GRAPH` `HISTORICAL` `CUSTOMER`

### Decision panel

- Verdict.
- Fraud probability/confidence.
- Primary pattern.
- Exposure.
- Evidence sufficiency.
- Remaining uncertainty.

### Decision path

```text
Risk Signal
 ↓
Graph Evidence
 ↓
Pattern Detected
 ↓
Contradiction Check
 ↓
Evidence Sufficient?
 ↓
Policy Check
 ↓
Action
```

### Action panel

- Recommended actions.
- Policy rule.
- Approval route.
- Execution status.

Buttons:

`APPROVE ACTION`  
`REJECT ACTION`  
`REQUEST MORE EVIDENCE`  
`ESCALATE`

### Before/After

```text
BEFORE
VERIFY CUSTOMER

NEW EVIDENCE
Customer denied transaction

AFTER
BLOCK CARD + CREATE CASE

WHAT CHANGED
Customer response removed the main uncertainty.
```

---

# 10. UI Screen 5 — Case History & Memory

## Purpose

Show how previous investigations inform future cases.

### Search by

- Case ID.
- Customer.
- Card.
- Device.
- IP.
- Merchant.
- Pattern.

### Historical case table

- Case.
- Pattern.
- Verdict.
- Action.
- Outcome.
- Similarity.
- Date.

### Similar case panel

- Why similar.
- Shared entities.
- Shared graph topology.
- Similar transaction behavior.
- Previous analyst decision.
- Previous outcome.

### Recurring entity panel

- Devices.
- Cards.
- IPs.
- Merchants.
- Fraud rings.

Buttons:

`VIEW CASE`  
`VIEW GRAPH`  
`COMPARE CASES`  
`USE AS CONTEXT`

---

# 11. Optional Case Details Drawer

Do not create another full page unless needed.

Drawer sections:

1. Case summary.
2. Trigger.
3. Timeline.
4. Evidence.
5. Graph.
6. Hypotheses.
7. Actions.
8. Approvals.
9. SAR/report.
10. Audit log.

Buttons:

`EXPORT CASE` `VIEW GRAPH` `VIEW AUDIT` `VIEW SAR` `CLOSE`

---

# 12. SAR / Compliance Drawer

Show:

- Report required.
- Policy basis.
- Regulatory basis.
- Subject entities.
- Transactions.
- Exposure.
- Narrative.
- Evidence references.

Button:

`VIEW GENERATED REPORT`

The LLM must not independently decide whether a regulatory filing is required.

---

# 13. Additional Functional Requirements

## FR-20 — Notifications

Notify when:

- New high-risk case arrives.
- Evidence arrives.
- Approval is required.
- Case is escalated.
- Large connected fraud ring is detected.
- Case is ready for closure.

## FR-21 — Global Search

Search:

- Case ID.
- Transaction ID.
- Customer ID.
- Card ID.
- Account ID.
- Device ID.
- IP.
- Merchant.

## FR-22 — Failure Handling

Handle:

- TigerGraph unavailable.
- GSQL failure.
- MCP failure.
- LLM failure.
- GraphRAG failure.
- Missing entity.
- Empty graph result.
- Conflicting evidence.
- Timeout.
- Approval timeout.

Never silently fabricate a result.

Recommended failure state:

`EVIDENCE_RETRIEVAL_FAILED`

Display:

- Failed component.
- Error.
- Last successful evidence.
- Retry/escalation option.

---

# 14. Non-Functional Requirements

## NFR-01 — Performance

The phrase “10 ms per second” is not a standard performance metric. Measure **latency per request** and **requests per second** separately.

Recommended targets:

### Deterministic decision operations

Target p95 ≤ **10 ms** where technically achievable for pure in-memory rule/state operations.

### TigerGraph queries

Target p95 approximately **100–500 ms** for common installed graph queries under benchmark conditions.

### End-to-end investigation

Target p95 approximately **2–5 seconds**, excluding human response and approval.

The achieved values must be benchmarked rather than assumed.

---

## NFR-02 — Throughput

Initially benchmark:

- 10+ concurrent investigations.
- Requests/second.
- p50/p95/p99 latency.
- TigerGraph query latency.
- MCP latency.
- LLM latency.
- End-to-end latency.

API/orchestration workers should be horizontally scalable.

---

## NFR-03 — Accuracy

Measure:

- Fraud-pattern identification accuracy.
- Evidence precision.
- False-positive rate.
- False-negative rate where ground truth exists.
- Policy compliance.
- Next-best-action agreement.
- Case completeness.
- Graph relationship accuracy.

---

## NFR-04 — Evidence Depth

Minimum:

- 1-hop relationships.
- 2-hop behavioral/relationship context.
- 3-hop fraud-ring investigation.

Traversal must be bounded to prevent uncontrolled latency.

---

## NFR-05 — Scalability

Recommended logical architecture:

```text
UI
 ↓
API
 ↓
Investigation Orchestrator
 ↓
TigerGraph MCP
 ↓
TigerGraph
```

Keep API/orchestration stateless where possible.

---

## NFR-06 — Reliability

Required:

- No silent failures.
- Idempotent writeback.
- Retry transient errors.
- Timeouts.
- Circuit breaker.
- Read-after-write verification.
- State recovery.

---

## NFR-07 — Security

Required:

- Secrets only in environment/secret manager.
- No secrets in source/logs.
- Authentication.
- Role-based permissions.
- Approval enforcement.
- Input sanitization.
- Prompt-injection defenses.
- Tool authorization.
- Audit logging.

---

## NFR-08 — Policy Safety

The policy engine must be deterministic.

The LLM cannot:

- Change approval level.
- Skip required evidence.
- Force blocked actions.
- Delete audit events.
- Modify historical evidence.
- Bypass regulatory rules.

---

## NFR-09 — Temporal Integrity

Do not use future information unavailable when a case was opened.

Historical queries should accept:

`as_of_ts / cutoff_ts`

Every case records its cutoff timestamp.

---

## NFR-10 — Explainability

Every final action should be traceable:

```text
Action
 ↓
Policy
 ↓
Evidence
 ↓
Graph Query
 ↓
Graph Entities
```

---

## NFR-11 — Auditability

Preserve the investigation timeline.

A SHA-256 hash chain may be used for tamper evidence. Cryptographic integrity should supplement proper database/access controls, not replace them.

---

## NFR-12 — Maintainability

Keep the implementation modular:

```text
fraud_agent/
├── agent/
├── graph/
├── mcp/
├── investigation/
├── policy/
├── memory/
└── api/
```

Avoid unnecessary microservices for the hackathon implementation.

---

## NFR-13 — Testability

Tests should cover:

### Graph
- Schema.
- GSQL.
- Multi-hop traversal.
- Temporal cutoff.
- Writeback.

### MCP
- Tool discovery.
- Query execution.
- Retrieval.
- Writeback.

### Decision engine
- State transitions.
- Sufficiency.
- Contradictions.
- Policy.
- Approval.

### Agent
- Tool selection.
- Evidence synthesis.
- Failure handling.

### UI
- Investigation workflow.
- Graph interaction.
- Case progression.
- Approval.

---

## NFR-14 — Observability

Every investigation should expose:

- Case ID.
- Trace ID.
- State.
- Tool call.
- Query.
- Latency.
- Result size.
- Error.
- Evidence count.
- Decision.

Measure:

```text
TigerGraph latency
MCP latency
GSQL latency
LLM latency
GraphRAG latency
Decision-engine latency
End-to-end latency
```

---

## NFR-15 — Bounded Agentic Execution

If LangGraph/LLM is used:

- Maximum state transitions.
- Maximum tool calls.
- Maximum graph depth.
- Maximum retries.
- Tool timeout.
- Investigation timeout.

No infinite agentic loops.

---

## NFR-16 — Cost Efficiency

Avoid unnecessary LLM calls.

Use deterministic code for:

- Thresholds.
- Policy.
- Graph calculations.
- Approval routing.
- Case status.
- Deterministic risk calculations.

Use LLM calls for:

- Evidence synthesis.
- Natural-language explanation.
- Tool selection where useful.
- Case summarization.

---

## NFR-17 — UI Usability

A simple analyst should be able to:

1. Open dashboard.
2. Select case.
3. Understand trigger.
4. See graph evidence.
5. Understand investigation state.
6. Review evidence.
7. Understand uncertainty.
8. Review NBA.
9. Approve/request evidence/escalate.
10. Review final case.

The main workflow should require minimal navigation.

---

## NFR-18 — Demo Readiness

The full investigation should be demonstrable in 3–5 minutes:

```text
Dashboard
 ↓
Open suspicious case
 ↓
Show trigger
 ↓
Run investigation
 ↓
Show TigerGraph graph
 ↓
Show 2–3 hop evidence
 ↓
Show fraud-ring discovery
 ↓
Show hypotheses
 ↓
Show sufficiency
 ↓
Show NBA
 ↓
Show policy/approval
 ↓
Show writeback
 ↓
Show historical memory
```

---

# 15. Recommended Minimal Technical Architecture

```text
                         ┌───────────────────────┐
                         │      Analyst UI       │
                         │ React + Cytoscape     │
                         └───────────┬───────────┘
                                     │
                                     ▼
                         ┌───────────────────────┐
                         │      API Layer        │
                         │ FastAPI / Node API    │
                         └───────────┬───────────┘
                                     │
                                     ▼
                  ┌────────────────────────────────────┐
                  │ Investigation Orchestrator         │
                  │                                    │
                  │ Deterministic State Machine        │
                  │ + Optional LangGraph               │
                  │ + Optional LLM                    │
                  └───────────────┬────────────────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    │                           │
                    ▼                           ▼
          ┌──────────────────┐        ┌──────────────────┐
          │ TigerGraph MCP   │        │ Policy Engine    │
          │ Tool Interface   │        │ Deterministic    │
          └────────┬─────────┘        └──────────────────┘
                   │
                   ▼
          ┌──────────────────┐
          │    TigerGraph    │
          │                  │
          │ Schema           │
          │ GSQL             │
          │ Graph Algorithms │
          │ Case Memory      │
          │ Relationships    │
          └────────┬─────────┘
                   │
                   ▼
          ┌──────────────────┐
          │ GraphRAG / Policy│
          │ Evidence Layer   │
          └──────────────────┘
```

---

# 16. Recommended Minimal State Architecture

Do not create a large multi-agent system unless it provides measurable value.

```text
1. Intake
      ↓
2. Graph Retrieval
      ↓
3. Evidence / Hypothesis Analysis
      ↓
4. Initial NBA
      ↓
5. Sufficiency Gate
      ├── Sufficient ──────────┐
      │                        │
      └── Insufficient         │
             ↓                │
       Request Evidence       │
             ↓                │
       Reassess Evidence ─────┘
             ↓
6. Final NBA
      ↓
7. Policy / Compliance
      ↓
8. Approval / Execution
      ↓
9. Case Writeback
      ↓
10. Memory Update
```

The node count may be adjusted if a simpler implementation is demonstrably more reliable.

---

# 17. Key Product Buttons

## Investigation

`START INVESTIGATION`  
`RUN INVESTIGATION`  
`PAUSE`  
`RESUME`  
`ESCALATE`

## Evidence

`COLLECT EVIDENCE`  
`EXPAND GRAPH`  
`REQUEST MORE EVIDENCE`  
`VIEW PROVENANCE`

## Graph

`EXPAND 1 HOP`  
`EXPAND 2 HOPS`  
`EXPAND 3 HOPS`  
`FIND CONNECTIONS`  
`SHOW FRAUD RING`  
`SHOW SIMILAR CASES`

## Decision

`VIEW REASONING`  
`VIEW POLICY`  
`COMPARE HYPOTHESES`

## Approval

`APPROVE`  
`REJECT`  
`ESCALATE`

## Case

`CREATE CASE`  
`UPDATE CASE`  
`CLOSE CASE`  
`VIEW AUDIT`

---

# 18. Required Project Evidence

The final project must visibly prove:

## TigerGraph

- Actual graph.
- Graph schema.
- GSQL queries.
- Multi-hop traversal.
- Graph algorithms.
- Graph writeback.

## TigerGraph MCP

- MCP integration.
- Tool invocation.
- Query execution.
- Graph retrieval.
- Writeback.

## GraphRAG

- Policy retrieval.
- Typology retrieval.
- Grounded evidence.
- Provenance.

## Agent

If used:

- State transitions.
- Tool calls.
- Evidence collection.
- Reassessment.
- Controlled execution.

## Decision Engine

- Hypotheses.
- Contradictions.
- Sufficiency gate.
- Policy evaluation.
- NBA.

## Case Management

- Case creation.
- Evidence updates.
- Action history.
- Approval.
- Resolution.

## Memory

- Similar cases.
- Recurring entities.
- Previous decisions.
- Graph relationships.

---

# 19. Definition of Done

The project is functionally complete when an analyst can:

```text
1. Receive fraud trigger
2. Open/create case
3. Retrieve transaction evidence
4. Retrieve customer baseline
5. Retrieve card behavior
6. Traverse device/IP/account relationships
7. Run graph algorithms
8. Retrieve historical cases
9. Retrieve policy/typology context
10. Build evidence ledger
11. Evaluate competing hypotheses
12. Detect contradictions
13. Assess evidence sufficiency
14. Request additional evidence when necessary
15. Reassess the investigation
16. Generate next-best action
17. Apply policy and approval routing
18. Execute or request approval
19. Explain the decision
20. Write case to TigerGraph
21. Verify graph persistence
22. Store investigation as case memory
23. Display the final investigation in the UI
```

---

# 20. Builder Priority

## P0 — Must Work

1. TigerGraph connection.
2. TigerGraph schema.
3. GSQL queries.
4. Multi-hop traversal.
5. TigerGraph MCP.
6. Evidence retrieval.
7. Investigation state machine.
8. Evidence ledger.
9. Sufficiency gate.
10. Policy engine.
11. Next-best action.
12. Case writeback.
13. UI investigation workflow.
14. Benchmark cases.

## P1 — Strong Differentiators

1. Deep 3-hop graph investigation.
2. Competing hypotheses.
3. Contradiction detection.
4. Historical case memory.
5. Graph centrality.
6. GraphRAG.
7. Before/after evidence comparison.
8. Explainable decision path.
9. Fraud-ring visualization.
10. Strong audit trail.

## P2 — Only If Time Allows

1. LLM-assisted investigation planning.
2. Natural-language analyst assistant.
3. Additional external data.
4. Advanced graph algorithms.
5. Customer interaction simulation.
6. Advanced analytics.

Do not sacrifice P0/P1 reliability for P2 features.

---

# 21. Final Design Goal

The system should feel like a **focused fraud investigation operating system**, not a collection of AI features.

The core technical story should be:

> **TigerGraph discovers and proves the relationships.  
> The evidence engine determines what those relationships mean.  
> The policy engine determines what is allowed.  
> The agent orchestrates the investigation where useful.  
> The analyst remains in control of consequential actions.**

The implementation should remain lightweight, deterministic where correctness matters, agentic where orchestration adds value, and deeply grounded in TigerGraph evidence.
