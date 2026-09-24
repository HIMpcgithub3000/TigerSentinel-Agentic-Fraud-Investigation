# TigerGraph Agentic Fraud Investigation

## Revised Implementation Architecture & Change Rationale

**Project:** HackerEarth Goa / TigerGraph Agentic Fraud Investigation\
**Purpose of this document:** Explain, in detail, why the latest
implementation plan should be modified before implementation, what is
changing, and how the revised architecture improves correctness,
auditability, evaluation quality, and the agentic nature of the
solution.

------------------------------------------------------------------------

# 1. Executive Summary

The previous implementation plan already had the correct major
technologies and hackathon components:

-   TigerGraph as the graph evidence and memory layer
-   TigerGraph MCP
-   LangGraph orchestration
-   GraphRAG
-   deterministic fraud/policy logic
-   human approval
-   initial and final next-best actions
-   case writeback
-   20 benchmark outputs
-   analyst UI
-   automated tests

However, the previous design was still too close to a **fraud
classification pipeline**:

``` text
Trigger
   ↓
TigerGraph retrieval
   ↓
Pattern detection
   ↓
Confidence score
   ↓
Fraud/action
   ↓
SAR
   ↓
Writeback
```

The revised design changes this into an **evidence-first investigation
system**:

``` text
Trigger
   ↓
Investigation planning
   ↓
Graph evidence retrieval
   ↓
Evidence ledger
   ↓
Hypothesis investigation
   ↓
Evidence sufficiency assessment
   ↓
       ┌───────────────┐
       │               │
  insufficient     sufficient
       │               │
 evidence request   policy
       │               │
       └───────┬───────┘
               ↓
      Initial / Updated NBA
               ↓
        Approval governance
               ↓
       Grounded explanation
               ↓
          Graph writeback
               ↓
         Evaluation trace
```

The central architectural principle is:

> **The LLM should not decide whether something is fraud from a score.
> The agent should investigate evidence, evaluate competing hypotheses,
> identify what is missing, obtain additional evidence when necessary,
> and then apply deterministic policy to the resulting evidence.**

------------------------------------------------------------------------

# 2. What Is Changing

The following major changes are recommended.

  -----------------------------------------------------------------------
  Previous Design         Revised Design          Reason
  ----------------------- ----------------------- -----------------------
  Single confidence score Evidence strength +     Prevents the system
                          hypothesis support +    from behaving like an
                          evidence sufficiency    unexplained classifier

  Linear agent workflow   Stateful investigation  Makes the system
                          loop                    genuinely agentic

  Raw query outputs       Evidence Ledger         Makes every conclusion
  passed toward reasoning                         auditable

  Historical cases        `as_of_timestamp` on    Prevents future-data
  retrieved without       investigations          leakage
  explicit temporal                               
  cutoff                                          

  Graph algorithms        Graph algorithms        Avoids unjustified
  treated as              treated as evidence     fraud conclusions
  pattern/verdict         generators              
  mechanisms                                      

  LLM explains a decision LLM synthesizes only    Reduces hallucination
                          validated evidence      and policy drift

  Policy thresholds       Policy source is        Prevents invented
  partly hard-coded       authoritative           regulatory/business
                                                  rules

  Basic test suite        Agent + evidence +      Evaluates the actual
                          temporal + policy +     agent
                          trace tests             

  Final JSON validation   End-to-end              Measures whether the
                          investigation           investigation was
                          evaluation              correct

  UI as a major           Investigation engine    Protects the core
  implementation target   first, UI second        submission under time
                                                  constraints
  -----------------------------------------------------------------------

------------------------------------------------------------------------

# 3. Why the Previous Confidence Model Should Change

The previous plan proposed:

``` text
confidence =
  0.30 * graph_support
+ 0.25 * similar_case_strength
+ 0.20 * behavioral_anomaly
+ 0.15 * risk_score
+ 0.10 * evidence_coverage
- contradiction_penalty
```

This is useful as an initial experiment, but it should not be the
primary semantic representation of the investigation.

## Problem 1: It looks like a fraud probability

A score such as:

``` text
0.88
```

can easily be interpreted as:

> "There is an 88% probability this transaction is fraud."

But the system does not have a validated probabilistic fraud model or
transaction-level ground-truth label.

Therefore the score should not be presented as a calibrated probability.

## Problem 2: It hides evidence

Two cases could both produce:

``` text
confidence = 0.78
```

while having completely different evidence.

The analyst needs to know:

-   which entities were connected
-   which transactions were abnormal
-   which historical cases were similar
-   which evidence contradicted the hypothesis
-   which evidence was missing

## Problem 3: The bank risk score is not ground truth

The challenge specifically requires that the risk score not be treated
as a fraud label.

Therefore the architecture must preserve the distinction:

``` text
Risk score
    ≠
Fraud truth
```

## Revised approach

Use three separate concepts.

### 3.1 Evidence Strength

How strongly does an individual piece of evidence support or contradict
a hypothesis?

``` text
EV-001
Shared device across 7 cards
Supports: SHARED_DEVICE_RING
Strength: 0.81
```

### 3.2 Hypothesis Support

How strongly does the complete evidence set support a hypothesis?

``` text
SHARED_DEVICE_RING
Support: STRONG
Evidence: EV-001, EV-004, EV-009
Contradictions: EV-013
```

### 3.3 Evidence Sufficiency

Is there enough reliable evidence to make the policy-relevant decision?

``` text
SUFFICIENT
```

or

``` text
INSUFFICIENT
```

This is more meaningful than calling everything a "fraud probability."

------------------------------------------------------------------------

# 4. New Core Component: Evidence Ledger

The biggest architectural addition is the **Evidence Ledger**.

Every observation used by the investigation should become a structured
evidence object.

Example:

``` json
{
  "evidence_id": "EV-017",
  "claim": "Device is associated with multiple customers",
  "source": {
    "system": "TigerGraph",
    "query": "device_ring",
    "entity_id": "device_123"
  },
  "observed_value": {
    "customers": 5,
    "cards": 7
  },
  "timestamp": "2026-09-24T10:32:00",
  "temporal_valid": true,
  "supports": [
    "SHARED_DEVICE_RING"
  ],
  "contradicts": [],
  "strength": 0.81
}
```

The LLM should receive structured evidence rather than vague statements
such as:

``` text
"The device looks suspicious."
```

Instead:

``` text
Evidence EV-017
Source: device_ring
Device: device_123
Customers: 5
Cards: 7
Historical fraud cases: 3
Supports: SHARED_DEVICE_RING
```

This makes the investigation:

-   explainable
-   testable
-   reproducible
-   auditable
-   easier to debug

------------------------------------------------------------------------

# 5. New Requirement: Temporal Reasoning

The previous architecture needs an explicit temporal cutoff.

Without one, the system can accidentally use information that would not
have been available when the original transaction was investigated.

Example:

``` text
Transaction:
January 10

Historical fraud case:
March 20
```

If the investigation is supposed to represent the state of knowledge on
January 10, the March case must not be used.

Therefore every investigation should have:

``` text
investigation_cutoff_timestamp
```

and graph queries should support:

``` text
as_of_timestamp
```

For example:

``` text
device_ring(
    device_id,
    max_hops,
    as_of_timestamp
)
```

and:

``` text
similar_closed_cases(
    pattern_type,
    amount,
    device_id,
    top_k,
    as_of_timestamp
)
```

## Why this matters

This prevents:

-   future leakage
-   artificially strong historical evidence
-   invalid benchmark evaluation
-   misleading agent performance

Temporal validity should itself become an evidence property:

``` text
temporal_valid = true
```

------------------------------------------------------------------------

# 6. Revised Agent Architecture

The previous 13-node workflow was mostly sequential.

The revised system should use LangGraph as a **stateful investigation
loop**.

``` mermaid
flowchart TD
    A[Investigation Trigger] --> B[Initialize Case State]
    B --> C[Investigation Planner]

    C --> D[TigerGraph Evidence Retrieval]
    D --> E[Evidence Ledger]

    E --> F[Pattern & Hypothesis Engine]
    F --> G[Compare Supporting and Contradicting Evidence]

    G --> H{Evidence Sufficient?}

    H -->|No| I[Identify Missing Evidence]
    I --> J[Evidence Request Tool]
    J --> K[Receive Additional Evidence]
    K --> E

    H -->|Yes| L[Deterministic Policy Engine]

    L --> M[Initial / Updated Next Best Action]
    M --> N{Approval Required?}

    N -->|Yes| O[Human Approval Gate]
    N -->|No| P[Allowed Action]

    O --> P

    P --> Q[LLM Grounded Explanation]
    Q --> R[Output Validator]
    R --> S[TigerGraph Case Writeback]
    S --> T[Evaluation & Trace]
    T --> U[END]
```

The important part is:

``` text
Evidence insufficient
       ↓
Request evidence
       ↓
Receive evidence
       ↓
Reassess
```

This is the core agentic loop.

------------------------------------------------------------------------

# 7. Why the Investigation Loop Is Necessary

A conventional workflow might always execute:

``` text
query A
query B
query C
query D
```

An agentic investigator should instead ask:

> "What do I know?"

then:

> "What hypothesis explains this?"

then:

> "What evidence is missing?"

then:

> "Which tool can obtain that evidence?"

then:

> "Did the new evidence change my decision?"

This makes tool calling purposeful rather than decorative.

------------------------------------------------------------------------

# 8. Revised Tool Architecture

The LLM should have access to a small, controlled tool registry.

## TigerGraph tools

``` text
tg_get_transaction
tg_customer_baseline
tg_card_window
tg_device_ring
tg_identity_context
tg_similar_cases
tg_pattern_analysis
tg_policy_context
tg_write_case
```

The LLM should **not** be allowed to generate unrestricted GSQL.

Instead:

``` text
Agent
  ↓
"I need device relationship evidence"
  ↓
tg_device_ring()
  ↓
TigerGraph
```

rather than:

``` text
Agent
  ↓
generate arbitrary GSQL
  ↓
execute arbitrary query
```

## Why

This improves:

-   security
-   reproducibility
-   deterministic evaluation
-   observability
-   debugging
-   tool-call analysis

------------------------------------------------------------------------

# 9. Graph Algorithms: Revised Role

The previous plan included:

-   Connected Components
-   Louvain
-   PageRank
-   shortest path
-   similarity

These should remain.

However, they should generate **evidence**, not automatically generate
verdicts.

Incorrect:

``` text
PageRank high
    ↓
Fraud
```

Correct:

``` text
PageRank high
    ↓
Highly connected device discovered
    ↓
Investigate device neighborhood
    ↓
Check transaction timing
    ↓
Check customer diversity
    ↓
Check historical cases
    ↓
Generate evidence
    ↓
Evaluate hypothesis
```

Likewise:

``` text
Louvain community
```

should mean:

> "This graph structure deserves investigation."

It should not mean:

> "This community is fraudulent."

------------------------------------------------------------------------

# 10. Revised Undocumented Pattern Architecture

The undocumented pattern detector should not simply be:

``` text
PageRank anomaly → undocumented fraud
```

Instead:

``` text
Known pattern detectors
        ↓
No known pattern adequately explains evidence
        ↓
Graph anomaly detection
        ↓
Community / topology analysis
        ↓
Temporal analysis
        ↓
Novel relationship discovered
        ↓
UNDOCUMENTED_PATTERN
```

The agent must explain:

1.  What graph structure was discovered?
2.  Which entities form the cluster?
3.  What transactions are involved?
4.  What temporal behavior is unusual?
5.  Why existing typologies do not sufficiently explain it?

This is much stronger for a graph-focused hackathon.

------------------------------------------------------------------------

# 11. Pattern Evidence Contracts

Each fraud pattern should have a defined evidence contract.

Example:

## Shared Device Ring

``` text
Pattern:
SHARED_DEVICE_RING

Required evidence:
- device_id
- number of linked customers
- number of linked cards

Supporting evidence:
- historical fraud cases
- temporal clustering
- geographic inconsistency
- multiple identities

Contradicting evidence:
- legitimate shared-device explanation
- long-standing legitimate relationship

Output:
- pattern_supported
- pattern_strength
- evidence_ids[]
```

The same structure should exist for:

-   Card Testing
-   Account Takeover
-   Shared Device Ring
-   High-Value Burst
-   Identity Anomaly
-   Any data-supported additional pattern
-   Undocumented Pattern

This makes the detector unit-testable.

------------------------------------------------------------------------

# 12. Avoid Unsupported Fraud Typologies

The previous plan included:

-   synthetic identity
-   mule/pass-through
-   account takeover

These should only be implemented when the source data contains the
evidence required to support them.

For example, a mule/pass-through pattern requires meaningful flow/path
evidence.

If that evidence does not exist, the system should return:

``` text
INSUFFICIENT_DATA_FOR_PATTERN
```

rather than inventing a relationship.

This principle is critical:

> **The agent must never convert missing data into positive evidence.**

------------------------------------------------------------------------

# 13. Customer Confirmation Must Be Evidence, Not an Automatic Verdict

The previous test matrix suggested:

``` text
Customer denies
→ confidence increases
→ block
```

That should be revised.

Customer denial is one evidence item.

The final decision should depend on:

``` text
Customer response
+
transaction evidence
+
graph evidence
+
historical evidence
+
contradictions
+
policy
```

For example:

### Case A

``` text
Customer denial
+
normal device
+
normal transaction behavior
+
no related cases
```

should not automatically produce the same result as:

### Case B

``` text
Customer denial
+
shared device ring
+
multiple suspicious transactions
+
historical fraud cases
```

The architecture should evaluate the complete evidence set.

------------------------------------------------------------------------

# 14. GraphRAG Should Have Two Retrieval Layers

The revised GraphRAG architecture should explicitly separate:

``` mermaid
flowchart LR
    A[Investigation] --> B[Graph Retrieval]
    A --> C[Document / Policy Retrieval]

    B --> D[TigerGraph Evidence]
    B --> E[Historical Cases]
    B --> F[Entity Relationships]

    C --> G[Policies]
    C --> H[Typologies]
    C --> I[Regulatory Guidance]

    D --> J[Evidence Packet]
    E --> J
    F --> J
    G --> J
    H --> J
    I --> J

    J --> K[LLM]
```

The LLM receives:

``` text
Graph evidence
+
historical case evidence
+
policy evidence
```

rather than raw datasets.

------------------------------------------------------------------------

# 15. Policy Engine Must Be Deterministic

Policy should not be decided by the LLM.

The architecture should be:

``` text
Evidence
   ↓
Pattern
   ↓
Exposure
   ↓
Policy Engine
   ↓
Allowed actions
   ↓
Approval route
   ↓
SAR requirement
```

Example:

``` json
{
  "allowed": true,
  "approval_route": "L1",
  "sar_required": false,
  "policy_ids": ["POL-07"],
  "reason_codes": [
    "SUSPECTED_CARD_COMPROMISE"
  ]
}
```

The LLM can explain the result.

It cannot override it.

------------------------------------------------------------------------

# 16. Do Not Invent Regulatory Thresholds

The previous plan contained a fixed SAR rule such as:

``` text
Exposure >= $5,000
```

That should only be used if the hackathon's supplied policy explicitly
defines that rule.

The correct architecture is:

``` text
Policy documents
      ↓
policy_context()
      ↓
Applicable rule
      ↓
SAR requirement
```

If no authoritative policy can be found:

``` text
POLICY_NOT_FOUND
```

should be returned.

The system should not invent a banking or regulatory requirement merely
to make the demo work.

The same applies to:

-   approval thresholds
-   blocking thresholds
-   escalation rules
-   regulatory rules

------------------------------------------------------------------------

# 17. Revised Output Contract

The previous output contract should be expanded to distinguish
observations from conclusions.

Recommended structure:

``` json
{
  "case_id": "HHG-001",

  "trigger": {},

  "observations": [],

  "evidence": [],

  "hypotheses": [],

  "contradictions": [],

  "pattern_findings": [],

  "similar_closed_cases": [],

  "evidence_sufficiency": {},

  "initial_next_best_action": {},

  "evidence_requested": {},

  "evidence_response": {},

  "final_next_best_action": {},

  "policy_basis": [],

  "sar": {},

  "explanation": {},

  "tool_trace": [],

  "written_to_graph": false,

  "graph_case_id": null,

  "validation_status": "PASSED"
}
```

This creates a clear chain:

``` text
Observation
    ↓
Evidence
    ↓
Hypothesis
    ↓
Contradiction
    ↓
Sufficiency
    ↓
Policy
    ↓
Action
```

------------------------------------------------------------------------

# 18. Revised Evaluation Architecture

The previous plan focused heavily on:

-   accuracy
-   precision
-   recall
-   F1

These are useful only when reliable labels exist.

The revised evaluation should have three layers.

------------------------------------------------------------------------

## Level 1: Investigation Correctness

Question:

> Did the agent find the relevant evidence?

Metrics:

-   evidence recall
-   evidence precision
-   entity resolution accuracy
-   source validity
-   temporal correctness
-   evidence citation completeness

------------------------------------------------------------------------

## Level 2: Decision Correctness

Question:

> Did the agent make a policy-consistent decision?

Metrics:

-   initial NBA correctness
-   final NBA correctness
-   approval-route correctness
-   evidence-request correctness
-   SAR decision consistency
-   policy consistency

------------------------------------------------------------------------

## Level 3: Agent Quality

Question:

> Did the agent investigate efficiently, safely, and transparently?

Metrics:

-   tool-call count
-   unnecessary tool calls
-   latency
-   token usage
-   unsupported claim rate
-   hallucination rate
-   tool failure recovery
-   infinite-loop prevention
-   writeback correctness
-   trace completeness

This evaluates the actual agent rather than just its final label.

------------------------------------------------------------------------

# 19. Add a Trace Evaluator

Every run should produce a machine-readable trace.

Example:

``` json
{
  "run_id": "RUN-001",
  "case_id": "HHG-001",
  "steps": [
    {
      "step": 1,
      "node": "intake",
      "status": "SUCCESS"
    },
    {
      "step": 2,
      "tool": "tg_customer_baseline",
      "status": "SUCCESS",
      "evidence_ids": [
        "EV-001",
        "EV-002"
      ]
    },
    {
      "step": 3,
      "tool": "tg_device_ring",
      "status": "SUCCESS",
      "evidence_ids": [
        "EV-003"
      ]
    }
  ]
}
```

The evaluator can then ask:

``` text
Was the tool relevant?
Did it return evidence?
Did the evidence influence a hypothesis?
Did the hypothesis influence the action?
Did the action comply with policy?
Did the explanation cite the evidence?
```

This gives you a strong answer to:

> "How do you know the agent is actually working?"

------------------------------------------------------------------------

# 20. Expanded Test Strategy

The previous TC01--TC30 tests should remain, but agent-specific tests
should be added.

## Agent planning

``` text
TC31 — Relevant investigation tool selected
TC32 — Irrelevant tools avoided
TC33 — Arbitrary GSQL generation prohibited
TC34 — Tool failure handled
TC35 — Safe retry performed
```

## Evidence grounding

``` text
TC36 — Every conclusion maps to evidence
TC37 — Nonexistent entity rejected
TC38 — Future evidence rejected
TC39 — Unsupported claim rejected
TC40 — Contradictory evidence surfaced
```

## Agentic loop

``` text
TC41 — Insufficient evidence triggers request
TC42 — Additional evidence changes state
TC43 — Evidence request is relevant
TC44 — Investigation stops when sufficient
TC45 — Agent cannot loop indefinitely
```

## Policy

``` text
TC46 — LLM cannot override policy
TC47 — Restricted action requires approval
TC48 — SAR follows authoritative policy
TC49 — Invalid action rejected
TC50 — Approval route deterministic
```

## Memory

``` text
TC51 — Case write succeeds
TC52 — Write failure reported
TC53 — Duplicate write is idempotent
TC54 — Written case is retrievable
```

------------------------------------------------------------------------

# 21. Revised Repository Structure

The repository should emphasize investigation, evidence, policy, and
evaluation.

``` text
HackerEarthGoa/
│
├── data/
│
├── tigergraph/
│   ├── schema.gsql
│   ├── loading.gsql
│   ├── queries/
│   └── algorithms/
│
├── src/
│   └── fraud_agent/
│       ├── state.py
│       ├── graph/
│       ├── tools/
│       ├── investigation/
│       │   ├── planner.py
│       │   ├── evidence.py
│       │   ├── hypotheses.py
│       │   ├── patterns.py
│       │   └── sufficiency.py
│       ├── policy/
│       ├── evaluation/
│       ├── memory/
│       └── api/
│
├── mcp/
│   ├── tigergraph/
│   ├── evidence/
│   └── evaluation/
│
├── tests/
│   ├── unit/
│   ├── integration/
│   ├── agent/
│   ├── security/
│   └── evaluation/
│
├── evaluation/
│   ├── benchmark/
│   ├── graders/
│   ├── traces/
│   └── reports/
│
├── web/
│
└── output/
    ├── cases/
    └── reports/
```

------------------------------------------------------------------------

# 22. Revised End-to-End Architecture

``` mermaid
flowchart TD

    A[Analyst / Risk Trigger / Customer Report]
    --> B[LangGraph Investigation Runtime]

    B --> C[Investigation Planner]

    C --> D1[Customer/Card Investigation]
    C --> D2[Device/Identity Investigation]
    C --> D3[Transaction Investigation]

    D1 --> E[TigerGraph MCP]
    D2 --> E
    D3 --> E

    E --> F[GSQL Queries]
    E --> G[Graph Algorithms]
    E --> H[Historical Cases]

    F --> I[Evidence Ledger]
    G --> I
    H --> I

    I --> J[Hypothesis Engine]

    J --> K[Known Patterns]
    J --> L[Novel Pattern Detection]
    J --> M[Legitimate Explanation]

    K --> N[Evidence Sufficiency]
    L --> N
    M --> N

    N -->|Insufficient| O[Missing Evidence Planner]
    O --> P[Evidence MCP]
    P --> I

    N -->|Sufficient| Q[Policy Engine]

    Q --> R[Initial / Updated NBA]
    R --> S{Approval Required?}

    S -->|Yes| T[Human Approval]
    S -->|No| U[Allowed Action]

    T --> U

    U --> V[Grounded LLM Explanation]
    V --> W[Output Validator]

    W --> X[TigerGraph Case Writeback]
    W --> Y[Benchmark Evaluation]
    W --> Z[Trace Evaluation]

    X --> AA[Analyst UI]
    Y --> AA
    Z --> AA
```

------------------------------------------------------------------------

# 23. Recommended Implementation Order

The previous sprint plan should be reordered around the core
investigation engine.

## Phase 1 --- Understand and validate data

Build:

-   dataset validator
-   benchmark loader
-   data dictionary
-   temporal fields
-   case trigger resolution

Do not start UI work.

------------------------------------------------------------------------

## Phase 2 --- Build TigerGraph foundation

Build:

-   schema
-   loading jobs
-   customer baseline
-   transaction window
-   device ring
-   identity context
-   historical case retrieval
-   policy retrieval
-   writeback

Exit criterion:

> Every benchmark trigger can be resolved to a useful graph
> neighborhood.

------------------------------------------------------------------------

## Phase 3 --- Build Evidence Ledger

Implement:

-   evidence IDs
-   source tracking
-   entity tracking
-   timestamps
-   temporal validity
-   supporting hypotheses
-   contradiction tracking

Exit criterion:

> Every graph observation can become traceable evidence.

------------------------------------------------------------------------

## Phase 4 --- Build deterministic investigation logic

Implement:

-   pattern detectors
-   hypothesis engine
-   contradiction handling
-   evidence sufficiency
-   policy engine
-   approval routing
-   SAR policy lookup

Exit criterion:

> The system can investigate one case without an LLM.

------------------------------------------------------------------------

## Phase 5 --- Build LangGraph

Implement:

``` text
INTAKE
→ PLAN
→ RETRIEVE
→ NORMALIZE
→ HYPOTHESIZE
→ SUFFICIENCY
→ REQUEST EVIDENCE
→ REASSESS
→ POLICY
→ ACTION
→ EXPLANATION
→ WRITEBACK
```

Exit criterion:

> One case completes end-to-end through the investigation loop.

------------------------------------------------------------------------

## Phase 6 --- Build evaluation

Run:

-   20 benchmark cases
-   evidence evaluation
-   action evaluation
-   policy evaluation
-   temporal validation
-   trace evaluation
-   reproducibility tests

Exit criterion:

> You can quantitatively demonstrate that the agent works.

------------------------------------------------------------------------

## Phase 7 --- Build UI

Only after the engine works.

The UI should visualize:

-   case
-   evidence
-   graph
-   hypotheses
-   contradictions
-   uncertainty
-   initial NBA
-   evidence request
-   final NBA
-   approval route
-   SAR
-   tool trace
-   writeback status

------------------------------------------------------------------------

# 24. The Demonstration Story

The strongest demo should show one complete investigation.

``` text
1. Benchmark case enters
        ↓
2. Agent initializes case
        ↓
3. Agent retrieves transaction evidence
        ↓
4. Agent retrieves customer/card evidence
        ↓
5. Agent discovers device relationship
        ↓
6. Agent retrieves historical cases
        ↓
7. Evidence remains insufficient
        ↓
8. INITIAL NBA:
   Request customer confirmation
        ↓
9. Additional evidence received
        ↓
10. Agent reassesses hypotheses
        ↓
11. Evidence becomes sufficient
        ↓
12. UPDATED NBA:
    Block card → L1 approval
        ↓
13. Policy evidence displayed
        ↓
14. Grounded explanation generated
        ↓
15. Investigation written to TigerGraph
        ↓
16. Same case memory visible in graph
```

This demonstrates:

-   graph
-   MCP
-   LangGraph
-   agentic reasoning
-   uncertainty
-   evidence gathering
-   policy
-   human-in-the-loop
-   explainability
-   memory

in one flow.

------------------------------------------------------------------------

# 25. Final Architecture Principle

The revised architecture follows this separation:

``` text
TigerGraph
    ↓
PROVES RELATIONSHIPS

GSQL
    ↓
RETRIEVES STRUCTURED EVIDENCE

Graph Algorithms
    ↓
DISCOVER RELATIONSHIP STRUCTURE

Evidence Ledger
    ↓
RECORDS WHAT WAS ACTUALLY OBSERVED

Hypothesis Engine
    ↓
COMPARES POSSIBLE EXPLANATIONS

LangGraph
    ↓
ORCHESTRATES INVESTIGATION

Evidence MCP
    ↓
OBTAINS ADDITIONAL EVIDENCE

Policy Engine
    ↓
DETERMINES WHAT ACTION IS ALLOWED

Human Approval
    ↓
CONTROLS RESTRICTED ACTIONS

LLM
    ↓
EXPLAINS VERIFIED EVIDENCE

TigerGraph
    ↓
STORES INVESTIGATION MEMORY

Evaluation Engine
    ↓
PROVES THE AGENT WORKED
```

------------------------------------------------------------------------

# 26. Final Recommended System

The final system should therefore be understood as:

``` text
                 ┌──────────────────────────┐
                 │      INVESTIGATION       │
                 │          TRIGGER         │
                 └────────────┬─────────────┘
                              ↓
                 ┌──────────────────────────┐
                 │    LANGGRAPH AGENT       │
                 │  Investigation Planner   │
                 └────────────┬─────────────┘
                              ↓
                 ┌──────────────────────────┐
                 │      TIGERGRAPH          │
                 │                          │
                 │ Graph Evidence           │
                 │ Historical Cases         │
                 │ Relationships            │
                 │ Algorithms               │
                 └────────────┬─────────────┘
                              ↓
                 ┌──────────────────────────┐
                 │     EVIDENCE LEDGER      │
                 │                          │
                 │ Source + Entity + Time   │
                 │ Observation + Strength   │
                 │ Support + Contradiction  │
                 └────────────┬─────────────┘
                              ↓
                 ┌──────────────────────────┐
                 │   HYPOTHESIS ENGINE      │
                 │                          │
                 │ Fraud patterns           │
                 │ Legitimate explanation   │
                 │ Novel patterns            │
                 └────────────┬─────────────┘
                              ↓
                     ┌────────┴────────┐
                     │                 │
                Insufficient       Sufficient
                     │                 │
                     ↓                 ↓
              Evidence Request     Policy Engine
                     │                 │
                     └───────┬─────────┘
                             ↓
                 ┌──────────────────────────┐
                 │ INITIAL / UPDATED NBA    │
                 └────────────┬─────────────┘
                              ↓
                 ┌──────────────────────────┐
                 │   APPROVAL GOVERNANCE    │
                 └────────────┬─────────────┘
                              ↓
                 ┌──────────────────────────┐
                 │ LLM EXPLANATION / SAR    │
                 │ Grounded only in source  │
                 │ evidence                 │
                 └────────────┬─────────────┘
                              ↓
                 ┌──────────────────────────┐
                 │ TIGERGRAPH WRITEBACK     │
                 └────────────┬─────────────┘
                              ↓
                 ┌──────────────────────────┐
                 │ EVALUATION + TRACE       │
                 └──────────────────────────┘
```

## 27. Bottom Line

The previous implementation plan should **not be discarded**. Its
technologies and most of its components are correct.

The revision is mainly about changing the **reasoning model**:

``` text
OLD:

Data
 ↓
Score
 ↓
Fraud
 ↓
Action
```

becomes:

``` text
NEW:

Data
 ↓
Graph investigation
 ↓
Evidence
 ↓
Hypotheses
 ↓
Contradictions
 ↓
Evidence sufficiency
 ↓
Additional evidence if necessary
 ↓
Policy
 ↓
Initial / Updated action
 ↓
Approval
 ↓
Grounded explanation
 ↓
Memory
 ↓
Evaluation
```

That change makes the implementation more faithful to an **agentic fraud
investigation system**, while also giving you a much stronger story for
benchmark evaluation, explainability, safety, and the final hackathon
demonstration.
