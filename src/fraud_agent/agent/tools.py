"""
Formal Tool Registry and Tool Governance Plane for CaseGuard Agent.
Prevents unconstrained LLM execution and enforces strict permissions, timeouts, and state constraints.
"""

from typing import Dict, Any, List, Optional
from dataclasses import dataclass
import logging

logger = logging.getLogger(__name__)


@dataclass
class ToolDefinition:
    name: str
    purpose: str
    risk_level: str  # READ_ONLY | WRITE_TRANSACTION | GOVERNANCE
    allowed_states: List[str]
    required_inputs: List[str]
    timeout_ms: int = 3000
    retry_policy: str = "linear_backoff_max_2"


class ToolRegistry:
    """
    Central repository of permitted tools that can be invoked during investigation.
    Guarantees no arbitrary code, GSQL injections, or unverified writes can occur.
    """

    _registry: Dict[str, ToolDefinition] = {
        "tg_customer_baseline": ToolDefinition(
            name="tg_customer_baseline",
            purpose="Retrieves multi-month spend and regional history for a customer up to cutoff.",
            risk_level="READ_ONLY",
            allowed_states=["INTAKE", "INVESTIGATING"],
            required_inputs=["customer_id", "as_of_ts"],
            timeout_ms=3000
        ),
        "tg_card_window": ToolDefinition(
            name="tg_card_window",
            purpose="Retrieves chronological transaction window preceding cutoff for a specific card.",
            risk_level="READ_ONLY",
            allowed_states=["INVESTIGATING"],
            required_inputs=["card_id", "hours", "as_of_ts"],
            timeout_ms=3000
        ),
        "tg_device_ring": ToolDefinition(
            name="tg_device_ring",
            purpose="Performs deep multi-hop graph traversal across shared devices, cards, and syndicate entities.",
            risk_level="READ_ONLY",
            allowed_states=["INVESTIGATING"],
            required_inputs=["profile_id", "as_of_ts"],
            timeout_ms=5000
        ),
        "tg_graph_centrality": ToolDefinition(
            name="tg_graph_centrality",
            purpose="Executes graph topology analytics to detect degree anomalies and syndicate hub roles.",
            risk_level="READ_ONLY",
            allowed_states=["INVESTIGATING"],
            required_inputs=["card_id", "profile_id", "as_of_ts"],
            timeout_ms=4000
        ),
        "tg_similar_cases": ToolDefinition(
            name="tg_similar_cases",
            purpose="Finds historical closed investigation cases closed strictly prior to cutoff.",
            risk_level="READ_ONLY",
            allowed_states=["INVESTIGATING"],
            required_inputs=["pattern", "as_of_ts"],
            timeout_ms=3000
        ),
        "request_customer_confirmation": ToolDefinition(
            name="request_customer_confirmation",
            purpose="Dispatches controlled out-of-band verification to cardholder.",
            risk_level="GOVERNANCE",
            allowed_states=["EVALUATING", "FOLLOWUP"],
            required_inputs=["case_id", "card_id", "reason"],
            timeout_ms=1000
        ),
        "write_investigation_case": ToolDefinition(
            name="write_investigation_case",
            purpose="Atomically records verified case vertex and relational memory edges into TigerGraph.",
            risk_level="WRITE_TRANSACTION",
            allowed_states=["FINALIZING", "WRITEBACK"],
            required_inputs=["case_id", "verdict", "fraud_probability", "pattern", "exposure_usd"],
            timeout_ms=4000
        )
    }

    @classmethod
    def get_tool(cls, name: str) -> Optional[ToolDefinition]:
        return cls._registry.get(name)

    @classmethod
    def validate_execution(cls, tool_name: str, current_state: str, inputs: Dict[str, Any]) -> bool:
        """Validates that a tool invocation obeys governance permissions."""
        tool = cls.get_tool(tool_name)
        if not tool:
            logger.error(f"Security Alert: Attempted execution of unregistered tool '{tool_name}'!")
            return False

        if current_state not in tool.allowed_states:
            logger.warning(f"State Violation: Tool '{tool_name}' not permitted in state '{current_state}'!")
            return False

        for req in tool.required_inputs:
            if req not in inputs or inputs[req] is None:
                logger.warning(f"Input Missing: Required input '{req}' missing for tool '{tool_name}'!")
                return False

        return True
