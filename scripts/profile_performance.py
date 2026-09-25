"""
Performance Profiling Suite for TigerGraph MCP & Decision Engine Pipeline.
Measures empirical latencies across:
- MCP schema discovery
- GSQL query execution (individual vs parallel)
- GraphRAG policy retrieval
- Hypothesis evaluation & contradiction resolution
- Decision tree evaluation
- Graph writeback & read-after-write verification
"""

import os
import sys
import time
import statistics
import pandas as pd

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from src.fraud_agent.graph.client import TigerGraphClient
from src.fraud_agent.mcp.session import TigerGraphMCPSession
from src.fraud_agent.investigation.hypotheses import HypothesisEngine
from src.fraud_agent.investigation.evidence import EvidenceLedger
from src.fraud_agent.agent.orchestrator import FraudInvestigationAgent

def profile():
    print("=" * 70)
    print("PROFILING TIGERGRAPH FRAUD INVESTIGATION PIPELINE")
    print("=" * 70)

    tg = TigerGraphClient()
    mcp = TigerGraphMCPSession.get_session(tg_client=tg)

    # 1. Schema Discovery
    t0 = time.perf_counter()
    _ = mcp.get_graph_schema()
    schema_ms = (time.perf_counter() - t0) * 1000

    # 2. Individual GSQL Query Latencies
    df_pack = pd.read_csv("data/raw/case_pack.csv")
    row_014 = df_pack[df_pack["case_id"] == "HHG-014"].iloc[0].to_dict()
    cid = row_014["customer_id"]
    card_id = row_014["card_id"]
    dev_prof = "SM-G935F Build/NRD90M | Android 7.0 | chrome 62.0 for android | 1920x1080"
    cutoff = row_014["opened_at"]

    # Baseline query
    t0 = time.perf_counter()
    mcp.run_installed_query("customer_baseline", {"c_id": cid, "as_of_ts": cutoff})
    baseline_ms = (time.perf_counter() - t0) * 1000

    # Card window query
    t0 = time.perf_counter()
    mcp.run_installed_query("card_window", {"card_id": card_id, "hours": 48, "as_of_ts": cutoff})
    window_ms = (time.perf_counter() - t0) * 1000

    # Device ring 3-hop query
    t0 = time.perf_counter()
    mcp.run_installed_query("device_ring", {"profile_id": dev_prof, "as_of_ts": cutoff, "max_hops": 3})
    ring_ms = (time.perf_counter() - t0) * 1000

    # Similar cases query
    t0 = time.perf_counter()
    mcp.run_installed_query("similar_closed_cases", {"pattern": "", "card_id": card_id, "as_of_ts": cutoff, "top_k": 3})
    similar_ms = (time.perf_counter() - t0) * 1000

    # Centrality query
    t0 = time.perf_counter()
    mcp.run_installed_query("graph_centrality", {"card_id": card_id, "profile_id": dev_prof, "as_of_ts": cutoff})
    centrality_ms = (time.perf_counter() - t0) * 1000

    # GraphRAG policy retrieval
    t0 = time.perf_counter()
    mcp.retrieve_policy_context("undocumented", 74.96)
    graphrag_ms = (time.perf_counter() - t0) * 1000

    # 3. Decision Engine & Contradiction Resolution
    ledger = EvidenceLedger(cutoff_ts=cutoff)
    t0 = time.perf_counter()
    _ = HypothesisEngine.evaluate(
        flagged_txn={"TransactionID": "3478561", "TransactionAmt": 74.96, "risk_score": 0.86, "card_id": card_id, "customer_id": cid, "channel": "online", "device_profile": dev_prof},
        baseline={"customer_id": cid, "total_txns": 72, "avg_spend": 58.36, "known_regions": ["325"]},
        window_txns=[],
        device_ring={"connected_cards": ["C1", "C2", "C3"], "is_syndicate": True, "syndicate_exposure_usd": 12519.21},
        similar_cases=[],
        ledger=ledger
    )
    decision_engine_ms = (time.perf_counter() - t0) * 1000

    # 4. Writeback & Read-After-Write Verification
    t0 = time.perf_counter()
    mcp.write_investigation_case(
        case_id="CASE-PROFILE-001",
        verdict="fraud",
        fraud_probability=0.86,
        pattern="undocumented",
        exposure_usd=74.96,
        status="closed_fraud",
        summary="Profiling test writeback.",
        flagged_txn_id="3478561",
        card_id=card_id
    )
    writeback_ms = (time.perf_counter() - t0) * 1000

    # 5. Full End-to-End Latency across 20 Cases
    agent = FraudInvestigationAgent(tg_client=tg)
    case_latencies = []
    for _, r in df_pack.iterrows():
        t0 = time.perf_counter()
        agent.investigate(r.to_dict())
        case_latencies.append((time.perf_counter() - t0) * 1000)

    p50 = statistics.median(case_latencies)
    p95 = statistics.quantiles(case_latencies, n=20)[18] if len(case_latencies) >= 20 else max(case_latencies)
    p99 = max(case_latencies)

    print("\nSTAGE-BY-STAGE EMPIRICAL LATENCY BREAKDOWN:")
    print(f"  1. MCP Schema Discovery:               {schema_ms:6.2f} ms")
    print(f"  2. GSQL customer_baseline:             {baseline_ms:6.2f} ms")
    print(f"  3. GSQL card_window (48h):             {window_ms:6.2f} ms")
    print(f"  4. GSQL device_ring (3-hop traversal): {ring_ms:6.2f} ms")
    print(f"  5. GSQL similar_closed_cases:          {similar_ms:6.2f} ms")
    print(f"  6. GSQL graph_centrality:              {centrality_ms:6.2f} ms")
    print(f"  7. GraphRAG Policy Retrieval:          {graphrag_ms:6.2f} ms")
    print(f"  8. Decision Engine & Contradictions:   {decision_engine_ms:6.2f} ms")
    print(f"  9. Graph Writeback & Verification:     {writeback_ms:6.2f} ms")
    print("\nEND-TO-END PIPELINE LATENCIES (20 CASES):")
    print(f"  • p50 Latency: {p50:6.2f} ms")
    print(f"  • p95 Latency: {p95:6.2f} ms")
    print(f"  • p99 Latency: {p99:6.2f} ms")
    print(f"  • Max Latency: {max(case_latencies):6.2f} ms")
    print("=" * 70)

if __name__ == "__main__":
    profile()
