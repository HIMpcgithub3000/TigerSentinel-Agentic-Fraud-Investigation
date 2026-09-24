"""
FastAPI Server for TigerGraph Agentic Fraud Investigation Console.
Serves case triage, multi-hop subgraphs, real-time investigation runs,
and human-in-the-loop approval workflows.
"""

import os
import json
import glob
from typing import Dict, Any, List, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from src.fraud_agent.agent.orchestrator import FraudInvestigationAgent
from src.fraud_agent.graph.client import TigerGraphClient

app = FastAPI(
    title="TigerGraph Agentic Fraud Investigator API",
    description="Backend API for CaseGuard / GraphSentinel Analyst Console",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# Global Agent & Client Instances
tg_client = TigerGraphClient()
agent = FraudInvestigationAgent(tg_client=tg_client)


class ApprovalRequest(BaseModel):
    action: str
    approver_role: str
    notes: Optional[str] = ""


@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "system": "TigerGraph Agentic Fraud Investigator",
        "backend": "local_graph_engine" if tg_client.use_local else "tigergraph_savanna",
        "benchmark_cases_count": 20
    }


@app.get("/api/cases")
def list_cases():
    """Lists all benchmark cases with triage status, verdict, and exposure."""
    cases = []
    case_files = sorted(glob.glob("output/cases/HHG-*.json"))
    for fpath in case_files:
        with open(fpath, "r") as f:
            data = json.load(f)
            case_info = data.get("case", {})
            cases.append({
                "case_id": data.get("case_id"),
                "status": case_info.get("status"),
                "verdict": case_info.get("verdict"),
                "pattern": case_info.get("pattern"),
                "fraud_probability": case_info.get("fraud_probability"),
                "exposure_usd": case_info.get("exposure_usd"),
                "sar_required": data.get("sar", {}).get("file", False),
                "written_to_graph": case_info.get("written_to_graph", True),
                "graph_case_id": case_info.get("graph_case_id")
            })
    return {"cases": cases}


@app.get("/api/cases/{case_id}")
def get_case(case_id: str):
    """Retrieves full case investigation report, Evidence Ledger, and SAR."""
    fpath = f"output/cases/{case_id}.json"
    if not os.path.exists(fpath):
        raise HTTPException(status_code=404, detail=f"Case {case_id} not found")
    with open(fpath, "r") as f:
        return json.load(f)


@app.get("/api/graph/{case_id}")
def get_case_subgraph(case_id: str):
    """
    Returns Cytoscape-formatted graph nodes and edges for multi-hop visualization.
    """
    fpath = f"output/cases/{case_id}.json"
    if not os.path.exists(fpath):
        raise HTTPException(status_code=404, detail=f"Case {case_id} not found")

    with open(fpath, "r") as f:
        data = json.load(f)

    case_info = data.get("case", {})
    nodes = []
    edges = []

    # 1. Main Case Node
    nodes.append({
        "data": {
            "id": case_id,
            "label": f"Case {case_id}",
            "type": "case",
            "verdict": case_info.get("verdict")
        }
    })

    # 2. Flagged Transaction Node
    affected = case_info.get("affected_txn_ids", [])
    if affected:
        for tid in affected:
            nodes.append({"data": {"id": f"txn_{tid}", "label": f"Txn #{tid}", "type": "transaction"}})
            edges.append({"data": {"source": case_id, "target": f"txn_{tid}", "label": "INVESTIGATES"}})

    # 3. Connected Cards
    cards = case_info.get("connected_card_ids", [])
    for cid in cards[:6]:
        nodes.append({"data": {"id": f"card_{cid}", "label": f"Card {cid}", "type": "card"}})
        edges.append({"data": {"source": case_id, "target": f"card_{cid}", "label": "INVOLVES"}})

    # 4. Connected Device Profiles
    devs = case_info.get("connected_device_profiles", [])
    for idx, dev in enumerate(devs[:2]):
        dev_label = dev.split("|")[0].strip() if "|" in dev else "Device"
        dev_id = f"dev_{idx}"
        nodes.append({"data": {"id": dev_id, "label": dev_label, "type": "device"}})
        for cid in cards[:4]:
            edges.append({"data": {"source": dev_id, "target": f"card_{cid}", "label": "HARDWARE_SHARED"}})

    # 5. Similar Prior Cases
    prior = case_info.get("similar_prior_cases", [])
    for pc in prior[:3]:
        nodes.append({"data": {"id": f"hist_{pc}", "label": f"Prior Case {pc}", "type": "prior_case"}})
        edges.append({"data": {"source": case_id, "target": f"hist_{pc}", "label": "MEMORY_SIMILAR"}})

    return {"nodes": nodes, "edges": edges}


@app.post("/api/cases/{case_id}/investigate")
def re_investigate_case(case_id: str):
    """Triggers autonomous investigation loop on demand."""
    import pandas as pd
    pack = pd.read_csv("data/raw/case_pack.csv")
    match = pack[pack["case_id"] == case_id]
    if match.empty:
        raise HTTPException(status_code=404, detail="Case ID not found in benchmark pack")
    case_input = match.iloc[0].to_dict()
    res = agent.investigate(case_input)

    # Save to disk
    out_path = f"output/cases/{case_id}.json"
    with open(out_path, "w") as f:
        f.write(res.model_dump_json(indent=2))

    return res.model_dump()


@app.post("/api/cases/{case_id}/approve")
def approve_action(case_id: str, req: ApprovalRequest):
    """Simulates analyst sign-off for L1/L2 governance."""
    return {
        "case_id": case_id,
        "action": req.action,
        "status": "APPROVED",
        "approver_role": req.approver_role,
        "notes": req.notes,
        "message": f"Action '{req.action}' has been authorized by {req.approver_role} and committed to audit log."
    }
