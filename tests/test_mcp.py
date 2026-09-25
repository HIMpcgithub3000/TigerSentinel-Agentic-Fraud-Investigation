"""
Tests for TigerGraph MCP Server Integration.
Validates tool discovery, governed execution, and evidence provenance through MCP.
"""

import json
import asyncio
from typing import Any
from src.fraud_agent.mcp.server import MCP_TOOLS, call_tool, _get_client


def _run(coro: Any) -> Any:
    return asyncio.run(coro)


# ─────────────────────────────────────────────────────────────────────────────
# MCP Tool Discovery Tests
# ─────────────────────────────────────────────────────────────────────────────

def test_mcp_tool_discovery():
    """MCP server exposes the correct set of governed tools."""
    tools = MCP_TOOLS
    tool_names = {t.name for t in tools}
    
    expected = {
        "tg_customer_baseline", "tg_card_window", "tg_device_ring",
        "tg_graph_centrality", "tg_similar_cases", "write_investigation_case",
        "tg_get_transaction", "tg_policy_context"
    }
    assert tool_names == expected, f"Missing tools: {expected - tool_names}"
    assert len(tools) == 8


def test_mcp_tool_schemas():
    """Every MCP tool has a valid input schema with required fields."""
    for tool in MCP_TOOLS:
        assert tool.inputSchema is not None
        assert "properties" in tool.inputSchema
        assert "required" in tool.inputSchema
        assert len(tool.inputSchema["required"]) > 0
        assert tool.description and len(tool.description) > 20


# ─────────────────────────────────────────────────────────────────────────────
# MCP Tool Execution Tests (via local graph engine)
# ─────────────────────────────────────────────────────────────────────────────

def test_mcp_customer_baseline_execution():
    """MCP tool invocation returns customer baseline data with provenance."""
    # Ensure client is initialized
    _get_client()
    
    result = _run(
        call_tool("tg_customer_baseline", {
            "customer_id": "C12382",
            "as_of_ts": "2016-12-05 00:00:00"
        })
    )
    assert len(result) == 1
    data = json.loads(result[0].text)
    assert "customer_id" in data
    assert data["customer_id"] == "C12382"
    assert "total_txns" in data
    assert "avg_spend" in data
    assert "known_regions" in data


def test_mcp_device_ring_execution():
    """MCP tool invocation returns device ring traversal results."""
    _get_client()
    
    result = _run(
        call_tool("tg_device_ring", {
            "profile_id": "Unknown Device",
            "as_of_ts": "2016-12-05 00:00:00"
        })
    )
    assert len(result) == 1
    data = json.loads(result[0].text)
    assert "connected_cards" in data
    assert "device_profile" in data


def test_mcp_similar_cases_execution():
    """MCP tool invocation returns historical case matches."""
    _get_client()
    
    result = _run(
        call_tool("tg_similar_cases", {
            "pattern": "card_not_present_fraud",
            "as_of_ts": "2016-12-05 00:00:00"
        })
    )
    assert len(result) == 1
    data = json.loads(result[0].text)
    assert isinstance(data, list)


# ─────────────────────────────────────────────────────────────────────────────
# MCP Governance Enforcement Tests
# ─────────────────────────────────────────────────────────────────────────────

def test_mcp_unregistered_tool_rejected():
    """Unregistered tool calls are rejected through MCP governance."""
    result = _run(
        call_tool("arbitrary_dangerous_tool", {"sql": "DROP TABLE"})
    )
    data = json.loads(result[0].text)
    assert data["status"] == "REJECTED"
    assert "not registered" in data["error"]


def test_mcp_write_operation_works():
    """Write operations succeed through MCP with proper governance."""
    _get_client()
    
    result = _run(
        call_tool("write_investigation_case", {
            "case_id": "MCP-TEST-001",
            "verdict": "fraud",
            "fraud_probability": 0.88,
            "pattern": "card_testing",
            "exposure_usd": 500.0,
            "status": "closed_fraud",
            "summary": "MCP test case",
            "flagged_txn_id": "3514030",
            "card_id": "C12382-K1"
        })
    )
    data = json.loads(result[0].text)
    assert data["written"] is True
    assert data["case_id"] == "MCP-TEST-001"


def test_mcp_policy_context_retrieval():
    """MCP tool retrieves applicable policy rules and regulatory context."""
    _get_client()
    
    result = _run(
        call_tool("tg_policy_context", {
            "pattern": "card_testing",
            "exposure_usd": 500.0
        })
    )
    assert len(result) == 1
    data = json.loads(result[0].text)
    assert "applicable_rules" in data
    assert "R5" in data["applicable_rules"]
    assert "policy_source" in data
    assert "regulatory_source" in data


def test_mcp_evidence_provenance_preserved():
    """Data returned through MCP preserves evidence provenance fields."""
    _get_client()
    
    result = _run(
        call_tool("tg_customer_baseline", {
            "customer_id": "C12382",
            "as_of_ts": "2016-12-05 00:00:00"
        })
    )
    data = json.loads(result[0].text)
    # Provenance: temporal cutoff is preserved
    assert data["as_of_ts"] == "2016-12-05 00:00:00"
    # Provenance: customer identity is preserved
    assert data["customer_id"] == "C12382"
