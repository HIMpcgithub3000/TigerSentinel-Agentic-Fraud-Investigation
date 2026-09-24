"""
Data models and state representations for the Agentic Fraud Investigation System.
Strictly adheres to the TigerGraph x Hacker House Goa IEEE-CIS Benchmark specification.
"""

from typing import List, Dict, Any, Optional, Literal
from pydantic import BaseModel, Field
from typing_extensions import TypedDict


# --- Evidence Ledger Model ---

class EvidenceItem(BaseModel):
    evidence_id: str
    claim: str
    source: Literal["graph", "document", "customer", "external"]
    ref: str
    entity_ids: List[str] = Field(default_factory=list)
    strength: float = 0.5
    temporal_valid: bool = True
    supports: List[str] = Field(default_factory=list)
    contradicts: List[str] = Field(default_factory=list)
    timestamp: Optional[str] = None


# --- Action and Governance Models ---

class ActionItem(BaseModel):
    action: str
    route: Literal["auto", "L1", "L2"]
    reason: str


class NextBestActions(BaseModel):
    initial: List[ActionItem] = Field(default_factory=list)
    final: List[ActionItem] = Field(default_factory=list)
    what_changed: str = "nothing"


# --- Evidence Request Model ---

class EvidenceRequest(BaseModel):
    type: str
    asked_after_step: int
    assumed_response: str


# --- SAR (Suspicious Activity Report) Model ---

class SARReport(BaseModel):
    file: bool = False
    reason: str = ""
    narrative: str = ""
    subjects: List[str] = Field(default_factory=list)
    total_amount_usd: float = 0.0
    activity_dates: List[str] = Field(default_factory=list)


# --- Core Case Investigation Record ---

class CaseRecord(BaseModel):
    status: Literal["open", "closed_fraud", "closed_legitimate", "escalated"] = "open"
    verdict: Literal["fraud", "legitimate", "uncertain"] = "uncertain"
    fraud_probability: float = 0.5
    pattern: Literal[
        "card_testing",
        "card_not_present_fraud",
        "card_not_present_new_device",
        "out_of_region_use",
        "account_takeover",
        "undocumented",
        "none"
    ] = "none"
    pattern_description: str = ""
    affected_txn_ids: List[str] = Field(default_factory=list)
    first_suspicious_txn_id: str = ""
    connected_card_ids: List[str] = Field(default_factory=list)
    connected_device_profiles: List[str] = Field(default_factory=list)
    exposure_usd: float = 0.0
    evidence: List[Dict[str, Any]] = Field(default_factory=list)
    similar_prior_cases: List[str] = Field(default_factory=list)
    summary: str = ""
    written_to_graph: bool = False
    graph_case_id: str = ""


# --- Final 26-Field Benchmark Output Contract ---

class BenchmarkCaseOutput(BaseModel):
    case_id: str
    case: CaseRecord
    evidence_requests: List[EvidenceRequest] = Field(default_factory=list)
    next_best_actions: NextBestActions
    sar: SARReport
    stop_reason: str = ""
    tool_calls: int = 0
    tokens: int = 0
    latency_s: float = 0.0


# --- LangGraph State Schema ---

class InvestigationState(TypedDict, total=False):
    case_id: str
    opened_at: str
    trigger_type: str
    trigger_text: str
    flagged_txn_id: str
    card_id: str
    customer_id: str
    risk_score: Optional[float]
    
    # Graph Retrieval Context
    flagged_txn_details: Dict[str, Any]
    customer_profile: Dict[str, Any]
    card_txns_window: List[Dict[str, Any]]
    device_ring_info: Dict[str, Any]
    similar_cases_found: List[Dict[str, Any]]
    
    # Evidence Ledger & Hypotheses
    evidence_ledger: List[EvidenceItem]
    hypotheses_scores: Dict[str, float]
    primary_hypothesis: str
    pattern_description: str
    is_evidence_sufficient: bool
    missing_evidence_reason: str
    
    # Controlled Follow-up Evidence
    evidence_requests: List[Dict[str, Any]]
    evidence_response: Optional[Dict[str, Any]]
    
    # Decisions & Governance
    initial_actions: List[Dict[str, Any]]
    final_actions: List[Dict[str, Any]]
    what_changed: str
    
    # Compliance & Output
    verdict: str
    fraud_probability: float
    exposure_usd: float
    affected_txn_ids: List[str]
    connected_card_ids: List[str]
    connected_device_profiles: List[str]
    sar_data: Dict[str, Any]
    summary_text: str
    stop_reason: str
    
    # Execution Tracking
    tool_trace: List[Dict[str, Any]]
    tool_calls_count: int
    written_to_graph: bool
    graph_case_id: str
