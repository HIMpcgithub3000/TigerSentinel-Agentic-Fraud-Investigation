export const NODE_COLORS = {
    customer: "#2563EB",
    card: "#7C3AED",
    device: "#D97706",
    ip: "#0D9488",
    merchant: "#059669",
    transaction: "#4F46E5",
    case: "#64748B",
};

export const STEPS = [
    { id: "trigger", label: "Trigger Intake", action: "Risk signal ingested · TXN-990231 score 0.94", duration: 900, kind: "sys" },
    { id: "graph", label: "Graph Retrieval", action: "GSQL card_txn_history executed · 41 vertices returned in 212ms", duration: 1400, kind: "gsql", toastMsg: "TigerGraph: 41 vertices retrieved via card_txn_history" },
    { id: "evidence", label: "Evidence Aggregation", action: "23 evidence records appended to ledger · provenance sealed", duration: 1300, kind: "gsql" },
    { id: "hypothesis", label: "Hypothesis Assessment", action: "5 competing hypotheses scored · ring fraud leads at 0.94", duration: 1200, kind: "agent" },
    { id: "uncertainty", label: "Sufficiency Gate", action: "Contradiction check passed · evidence SUFFICIENT (u = 0.11)", duration: 1000, kind: "sys", toastMsg: "Sufficiency gate: SUFFICIENT — no additional evidence required" },
    { id: "nba", label: "Next-Best-Action", action: "NBA ranked · Block card + monitor 5 connected cards", duration: 1100, kind: "agent" },
    { id: "policy", label: "Policy Gate", action: "Rules R5 / R6 / R7 fired · approval routed to L2", duration: 1000, kind: "policy", toastMsg: "Policy gate: L2 approval required (exposure $48,210)" },
    { id: "writeback", label: "Case Writeback", action: "InvestigationCase vertex upserted · read-after-write verified", duration: 1200, kind: "gsql" },
];

export const KPIS = [
    { label: "Active Cases", value: "14", delta: "+3 today", tone: "indigo", icon: "briefcase" },
    { label: "High Risk", value: "5", delta: "2 critical", tone: "red", icon: "flame" },
    { label: "Awaiting Evidence", value: "3", delta: "oldest 2h 14m", tone: "amber", icon: "hourglass" },
    { label: "Awaiting Approval", value: "2", delta: "L2 queue", tone: "orange", icon: "stamp" },
    { label: "Resolved Today", value: "7", delta: "96.4% precision", tone: "emerald", icon: "check" },
    { label: "Connected Fraud Rings", value: "2", delta: "largest 56 cards", tone: "violet", icon: "network" },
];

export const CASES = [
    { id: "CASE-8941", trigger: "Risk score 0.94", customer: "CUST-402 · M. Okafor", card: "CRD-5519", risk: 94, riskBand: "critical", pattern: "Multi-hop device ring", confidence: 89, status: "INVESTIGATING", nba: "Block card + monitor ring", approval: "L2", updated: "2m ago" },
    { id: "CASE-8926", trigger: "Analyst request", customer: "CUST-118 · S. Whitfield", card: "CRD-3398", risk: 81, riskBand: "high", pattern: "Card cloning", confidence: 76, status: "AWAITING_APPROVAL", nba: "Block card + reverse txn", approval: "L2", updated: "11m ago" },
    { id: "CASE-8937", trigger: "Customer report", customer: "CUST-655 · D. Kim", card: "CRD-7782", risk: 78, riskBand: "high", pattern: "Account takeover", confidence: 71, status: "INVESTIGATING", nba: "Step-up authentication", approval: "L1", updated: "18m ago" },
    { id: "CASE-8922", trigger: "Suspicious txn event", customer: "CUST-340 · R. Alvarez", card: "CRD-1188", risk: 57, riskBand: "medium", pattern: "First-party fraud", confidence: 52, status: "AWAITING_EVIDENCE", nba: "Request customer confirmation", approval: "L1", updated: "42m ago" },
    { id: "CASE-8933", trigger: "Velocity rule R2", customer: "CUST-209 · T. Nguyen", card: "CRD-6641", risk: 49, riskBand: "medium", pattern: "Card testing", confidence: 63, status: "INVESTIGATING", nba: "Monitor account", approval: "AUTO", updated: "1h ago" },
    { id: "CASE-8929", trigger: "Geo deviation", customer: "CUST-540 · H. Bauer", card: "CRD-9814", risk: 22, riskBand: "low", pattern: "Out-of-region spend", confidence: 34, status: "MONITORING", nba: "Allow + monitor", approval: "AUTO", updated: "2h ago" },
    { id: "CASE-8917", trigger: "Risk score 0.88", customer: "CUST-088 · F. Haddad", card: "CRD-2273", risk: 88, riskBand: "high", pattern: "Synthetic identity", confidence: 91, status: "RESOLVED_FRAUD", nba: "Resolved · SAR filed", approval: "SUPERVISOR", updated: "3h ago" },
    { id: "CASE-8914", trigger: "Customer report", customer: "CUST-731 · P. Novak", card: "CRD-5560", risk: 18, riskBand: "low", pattern: "None — baseline match", confidence: 93, status: "RESOLVED_LEGITIMATE", nba: "Closed as legitimate", approval: "AUTO", updated: "5h ago" },
];

export const HYPOTHESES = [
    { name: "Coordinated ring fraud", confidence: 94, status: "supported", supporting: 11, contradicting: 0, entities: ["DVC-7741", "5 cards", "IP ··10.87"] },
    { name: "Account takeover", confidence: 89, status: "supported", supporting: 7, contradicting: 1, entities: ["CUST-402", "DVC-7741"] },
    { name: "Card cloning", confidence: 61, status: "unresolved", supporting: 4, contradicting: 2, entities: ["CRD-5519", "MCH-8821"] },
    { name: "Card testing", confidence: 33, status: "unresolved", supporting: 2, contradicting: 3, entities: ["TXN-990231"] },
    { name: "Legitimate activity", confidence: 12, status: "contradicted", supporting: 1, contradicting: 9, entities: ["CUST-402 baseline"] },
];

export const EVIDENCE = [
    { id: "EV-0231", claim: "Device DVC-7741 linked to 56 cards across 11 accounts", source: "device_ring.gsql", sourceType: "GSQL_QUERY", entity: "DVC-7741", strength: 0.97, polarity: "supports", hypothesis: "Coordinated ring fraud", ts: "14:02:11", hash: "9f2ac41d" },
    { id: "EV-0228", claim: "Shared IP 45.148.10.87 routes 4 of 5 ring transactions", source: "shared_ip_neighbors.gsql", sourceType: "GSQL_QUERY", entity: "IP ··10.87", strength: 0.91, polarity: "supports", hypothesis: "Coordinated ring fraud", ts: "14:02:09", hash: "b71ee903" },
    { id: "EV-0225", claim: "Customer denied transaction via IVR confirmation", source: "IVR step-up flow", sourceType: "CUSTOMER_RESPONSE", entity: "CUST-402", strength: 0.95, polarity: "supports", hypothesis: "Account takeover", ts: "14:02:04", hash: "5d10f2a8" },
    { id: "EV-0219", claim: "TXN amount $2,840 is 6.1x customer baseline ($465 avg)", source: "customer_baseline.gsql", sourceType: "TIGERGRAPH", entity: "CUST-402", strength: 0.88, polarity: "supports", hypothesis: "Account takeover", ts: "14:01:58", hash: "c04a77be" },
    { id: "EV-0216", claim: "3-hop traversal reaches confirmed fraud case CASE-8701", source: "case_memory_walk.gsql", sourceType: "HISTORICAL_CASE", entity: "CASE-8701", strength: 0.9, polarity: "supports", hypothesis: "Coordinated ring fraud", ts: "14:01:54", hash: "e83d1c05" },
    { id: "EV-0212", claim: "Merchant MCH-8821 MCC 5967 flagged in 2 prior SAR filings", source: "policy R6 / FinCEN 31 CFR §1020.320", sourceType: "POLICY", entity: "MCH-8821", strength: 0.82, polarity: "supports", hypothesis: "Card cloning", ts: "14:01:49", hash: "77a0d4e1" },
    { id: "EV-0208", claim: "Device fingerprint matches customer-registered handset", source: "device_attest.gsql", sourceType: "GRAPH_ALGORITHM", entity: "DVC-7741", strength: 0.41, polarity: "contradicts", hypothesis: "Device compromise", ts: "14:01:41", hash: "12be88f0" },
    { id: "EV-0204", claim: "Txn hour 02:13 local deviates from 94% of historical activity", source: "behavior_window.gsql", sourceType: "TIGERGRAPH", entity: "TXN-990231", strength: 0.74, polarity: "supports", hypothesis: "Account takeover", ts: "14:01:36", hash: "ad55c392" },
    { id: "EV-0199", claim: "Shipping region matches customer home region", source: "geo_check.gsql", sourceType: "GSQL_QUERY", entity: "CUST-402", strength: 0.35, polarity: "contradicts", hypothesis: "Out-of-region activity", ts: "14:01:29", hash: "6b9e01cd" },
    { id: "EV-0195", claim: "PageRank centrality of DVC-7741 in top 0.3% of device subgraph", source: "pagerank(alg)", sourceType: "GRAPH_ALGORITHM", entity: "DVC-7741", strength: 0.86, polarity: "supports", hypothesis: "Coordinated ring fraud", ts: "14:01:21", hash: "f4c62b7a" },
];

export const POLICIES = [
    { id: "R1", rule: "Exposure > $5,000 requires evidence sufficiency gate", result: "PASS", fired: true },
    { id: "R2", rule: "Velocity > 5 txns / 10 min escalates triage", result: "PASS", fired: true },
    { id: "R5", rule: "Customer denial → card block is mandatory", result: "FIRED", fired: true },
    { id: "R6", rule: "Shared device ≥ 3 cards → coordinated-ring investigation", result: "FIRED", fired: true },
    { id: "R7", rule: "Denial + exposure > $5k → SAR filing required (31 CFR §1020.320)", result: "FIRED", fired: true },
    { id: "R8", rule: "Exposure > $25,000 → L2 approval route", result: "FIRED", fired: true },
];

export const DECISION_PATH = [
    "Risk Signal 0.94",
    "Graph Evidence · 23 records",
    "Pattern: device ring",
    "Contradiction check · 2 resolved",
    "Evidence SUFFICIENT",
    "Policy R5/R6/R7/R8",
    "Action: block + SAR",
];

export const HISTORY = [
    { id: "CASE-8701", pattern: "Multi-hop device ring", verdict: "FRAUD", action: "Blocked 9 cards · SAR", outcome: "Ring dismantled · $212k prevented", similarity: 96, date: "2026-05-30", analyst: "L2 · J. Moreau" },
    { id: "CASE-8544", pattern: "Account takeover", verdict: "FRAUD", action: "Step-up + card reissue", outcome: "Confirmed ATO via SIM swap", similarity: 88, date: "2026-04-18", analyst: "L1 · A. Reyes" },
    { id: "CASE-8490", pattern: "Card cloning", verdict: "FRAUD", action: "Block + reverse 3 txns", outcome: "Skimmer located at ATM-2219", similarity: 74, date: "2026-03-27", analyst: "L2 · J. Moreau" },
    { id: "CASE-8312", pattern: "Card testing", verdict: "LEGITIMATE", action: "Monitor only", outcome: "False positive · micro-auths from wallet app", similarity: 51, date: "2026-02-11", analyst: "L1 · A. Reyes" },
    { id: "CASE-8205", pattern: "Out-of-region spend", verdict: "LEGITIMATE", action: "Allow", outcome: "Customer traveling · baseline updated", similarity: 38, date: "2026-01-22", analyst: "AUTO" },
];

export const SIMILAR_CASES = [
    { id: "CASE-8701", similarity: 96, why: "Same device DVC-7741 and identical 3-hop ring topology", shared: ["DVC-7741", "IP ··10.87", "MCH-4410"], decision: "Blocked 9 cards, SAR filed", outcome: "Ring dismantled" },
    { id: "CASE-8544", similarity: 88, why: "Customer denial + 6x baseline amount + night-window txn", shared: ["Behavior signature", "Step-up flow"], decision: "Step-up auth, card reissued", outcome: "Confirmed ATO" },
    { id: "CASE-8490", similarity: 74, why: "Shared merchant MCH-8821 and MCC 5967 risk class", shared: ["MCH-8821", "MCC 5967"], decision: "Block + reverse 3 txns", outcome: "Skimmer located" },
];

export const RECURRING = [
    { id: "DVC-7741", type: "device", cases: 3, hops: "56 cards @ 2-hop", trend: "rising" },
    { id: "IP 45.148.10.87", type: "ip", cases: 2, hops: "11 accounts @ 2-hop", trend: "rising" },
    { id: "MCH-8821", type: "merchant", cases: 2, hops: "9 flagged txns @ 1-hop", trend: "stable" },
    { id: "CRD-8851", type: "card", cases: 2, hops: "3 devices @ 1-hop", trend: "new" },
];

export const GRAPH = {
    nodes: [
        { id: "CRD-5519", type: "card", label: "CRD-5519", sub: "Focal card", hop: 0, x: 140, y: 175, focal: true },
        { id: "CUST-402", type: "customer", label: "CUST-402", sub: "M. Okafor", hop: 1, x: 310, y: 85 },
        { id: "TXN-990231", type: "transaction", label: "TXN-990231", sub: "$2,840 · 02:13", hop: 1, x: 350, y: 185 },
        { id: "DVC-7741", type: "device", label: "DVC-7741", sub: "Shared device hub", hop: 2, x: 600, y: 155, ring: true },
        { id: "IP-87", type: "ip", label: "45.148.10.87", sub: "Shared egress IP", hop: 2, x: 570, y: 55, ring: true },
        { id: "MCH-8821", type: "merchant", label: "MCH-8821", sub: "MCC 5967", hop: 2, x: 520, y: 255 },
        { id: "CRD-8820", type: "card", label: "CRD-8820", sub: "Ring card", hop: 3, x: 820, y: 50, ring: true },
        { id: "CRD-8834", type: "card", label: "CRD-8834", sub: "Ring card", hop: 3, x: 890, y: 110, ring: true },
        { id: "CRD-8851", type: "card", label: "CRD-8851", sub: "Ring card", hop: 3, x: 930, y: 175, ring: true },
        { id: "CRD-8879", type: "card", label: "CRD-8879", sub: "Ring card", hop: 3, x: 890, y: 235, ring: true },
        { id: "CRD-8902", type: "card", label: "CRD-8902", sub: "Ring card", hop: 3, x: 820, y: 285, ring: true },
        { id: "CUST-911", type: "customer", label: "CUST-911", sub: "Mule acct", hop: 3, x: 1070, y: 65, ring: true },
        { id: "CUST-913", type: "customer", label: "CUST-913", sub: "Mule acct", hop: 3, x: 1110, y: 145, ring: true },
        { id: "CUST-917", type: "customer", label: "CUST-917", sub: "Mule acct", hop: 3, x: 1100, y: 225, ring: true },
        { id: "CUST-923", type: "customer", label: "CUST-923", sub: "Mule acct", hop: 3, x: 1040, y: 285, ring: true },
        { id: "MCH-4410", type: "merchant", label: "MCH-4410", sub: "Cash-out merchant", hop: 3, x: 670, y: 280 },
        { id: "CASE-8701", type: "case", label: "CASE-8701", sub: "Prior confirmed fraud", hop: 3, x: 380, y: 275 },
    ],
    edges: [
        { from: "CRD-5519", to: "TXN-990231", label: "used_in" },
        { from: "CRD-5519", to: "CUST-402", label: "owned_by" },
        { from: "TXN-990231", to: "DVC-7741", label: "initiated_from" },
        { from: "TXN-990231", to: "MCH-8821", label: "paid_to" },
        { from: "DVC-7741", to: "IP-87", label: "routes_through" },
        { from: "DVC-7741", to: "CRD-8820", label: "shared_device" },
        { from: "DVC-7741", to: "CRD-8834", label: "shared_device" },
        { from: "DVC-7741", to: "CRD-8851", label: "shared_device" },
        { from: "DVC-7741", to: "CRD-8879", label: "shared_device" },
        { from: "DVC-7741", to: "CRD-8902", label: "shared_device" },
        { from: "CRD-8820", to: "CUST-911", label: "owned_by" },
        { from: "CRD-8834", to: "CUST-913", label: "owned_by" },
        { from: "CRD-8851", to: "CUST-917", label: "owned_by" },
        { from: "CRD-8879", to: "CUST-923", label: "owned_by" },
        { from: "CRD-8902", to: "CUST-923", label: "owned_by" },
        { from: "CRD-8851", to: "MCH-4410", label: "charged_at" },
        { from: "DVC-7741", to: "CASE-8701", label: "seen_in_case" },
    ],
};

export const ENTITY_META = {
    "CRD-5519": { risk: ["Velocity 7 txns / 10 min", "Amount 6.1x baseline"], connected: 3, txns: 41, cases: 1, firstSeen: "2024-11-02", lastSeen: "02:13 today", gsql: "card_txn_history('CRD-5519', 30d)", attrs: [["Network", "VISA ··5519"], ["Issued", "2024-11-02"], ["Status", "ACTIVE — block pending"]] },
    "CUST-402": { risk: ["Denied txn via IVR", "Baseline $465 avg"], connected: 2, txns: 312, cases: 1, firstSeen: "2021-06-14", lastSeen: "14:02 today", gsql: "customer_baseline('CUST-402')", attrs: [["Name", "M. Okafor"], ["Region", "US-East · Boston"], ["Tenure", "5.1 yrs"]] },
    "TXN-990231": { risk: ["Risk score 0.94", "Night window 02:13"], connected: 3, txns: 1, cases: 1, firstSeen: "02:13 today", lastSeen: "02:13 today", gsql: "txn_context('TXN-990231')", attrs: [["Amount", "$2,840.00"], ["Merchant", "MCH-8821 · MCC 5967"], ["Auth", "Card-not-present"]] },
    "DVC-7741": { risk: ["56 cards @ 2-hop", "PageRank top 0.3%", "Seen in CASE-8701"], connected: 8, txns: 118, cases: 3, firstSeen: "2026-05-30", lastSeen: "02:13 today", gsql: "device_ring('DVC-7741', depth=3)", attrs: [["Fingerprint", "canvas:9f2a…c41d"], ["Platform", "Android 14 · WebView"], ["Cluster", "DC-7 · 56 cards"]] },
    "IP-87": { risk: ["Routes 4 of 5 ring txns", "Datacenter ASN"], connected: 6, txns: 96, cases: 2, firstSeen: "2026-05-30", lastSeen: "02:13 today", gsql: "shared_ip_neighbors('45.148.10.87')", attrs: [["ASN", "AS9009 · M247"], ["Type", "Datacenter / VPN egress"], ["Geo", "NL · Amsterdam"]] },
    "MCH-8821": { risk: ["MCC 5967 high-risk", "2 prior SAR refs"], connected: 2, txns: 230, cases: 2, firstSeen: "2023-09-08", lastSeen: "02:13 today", gsql: "merchant_exposure('MCH-8821')", attrs: [["MCC", "5967 · Direct marketing"], ["Chargebacks", "4.2% (30d)"], ["Acquirer", "ACQ-77"]] },
};

export const SEARCH_INDEX = [
    { id: "CASE-8941", kind: "case", hint: "Multi-hop device ring · investigating", to: "/workspace" },
    { id: "CASE-8926", kind: "case", hint: "Card cloning · awaiting approval", to: "/workspace" },
    { id: "CASE-8701", kind: "case", hint: "Historical · ring dismantled", to: "/memory" },
    { id: "TXN-990231", kind: "transaction", hint: "$2,840 · risk 0.94", to: "/workspace" },
    { id: "CUST-402", kind: "customer", hint: "M. Okafor · Boston", to: "/graph" },
    { id: "CRD-5519", kind: "card", hint: "Focal card · block pending", to: "/graph" },
    { id: "DVC-7741", kind: "device", hint: "Ring hub · 56 cards", to: "/graph" },
    { id: "45.148.10.87", kind: "ip", hint: "Shared egress · AS9009", to: "/graph" },
    { id: "MCH-8821", kind: "merchant", hint: "MCC 5967 · high risk", to: "/graph" },
];

export const NOTIFICATIONS = [
    { id: 1, title: "High-risk case arrived", body: "CASE-8941 scored 0.94 · device ring suspected", time: "2m", unread: true },
    { id: 2, title: "Approval required", body: "CASE-8926 card block awaiting L2 review", time: "11m", unread: true },
    { id: 3, title: "Fraud ring detected", body: "Device DVC-7741 connects 56 cards across 11 accounts", time: "24m", unread: true },
    { id: 4, title: "Evidence received", body: "CASE-8922 customer response recorded", time: "40m", unread: false },
    { id: 5, title: "Case ready for closure", body: "CASE-8914 cleared as legitimate", time: "5h", unread: false },
];

export const INITIAL_LOG = [
    { id: "l1", ts: "14:02:11", msg: "device_ring.gsql completed · 56 cards @ depth 3", kind: "gsql" },
    { id: "l2", ts: "14:02:04", msg: "Customer denial recorded · uncertainty U1 resolved", kind: "ok" },
    { id: "l3", ts: "14:01:58", msg: "customer_baseline.gsql · deviation 6.1x", kind: "gsql" },
    { id: "l4", ts: "14:01:36", msg: "Case CASE-8941 opened from risk signal 0.94", kind: "sys" },
];

export const SAR_NARRATIVE = `Between 01:58 and 02:13 UTC, card CRD-5519 (customer CUST-402) executed a $2,840 card-not-present transaction at merchant MCH-8821 (MCC 5967). Graph analysis (device_ring.gsql, depth 3) links originating device DVC-7741 to 56 cards across 11 accounts, with 4 of 5 ring transactions routed via shared egress IP 45.148.10.87 (AS9009, datacenter). Customer denied the transaction via IVR step-up at 14:02 UTC. The same device appears in confirmed fraud case CASE-8701. Total estimated exposure: $48,210. Recommended: immediate card block, monitoring of 5 connected cards, and SAR filing per 31 CFR §1020.320 and internal policies R5/R6/R7.`;
