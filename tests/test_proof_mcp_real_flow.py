"""
Verification Test for Phase 6: Proof That TigerGraph MCP Is Actually Used.
Demonstrates the complete end-to-end execution flow:
Case HHG-014 -> LangGraph -> MCP -> TigerGraph -> multi-hop traversal -> 55+ connected card ring -> exposure -> final actions.
"""

import pandas as pd

from src.fraud_agent.agent.orchestrator import FraudInvestigationAgent
from src.fraud_agent.mcp.session import TigerGraphMCPSession


def test_proof_mcp_case_hhg014_real_execution(capsys):
    """
    Executes case HHG-014 through the LangGraph agent and verifies that the official
    TigerGraph MCP session tools are invoked, multi-hop traversal uncovers the
    syndicate ring, policy rules R6/R9 are evaluated, and actions are generated.
    """
    # 1. Load Case HHG-014 input
    pack_df = pd.read_csv("data/raw/case_pack.csv")
    match = pack_df[pack_df["case_id"] == "HHG-014"]
    assert not match.empty, "Case HHG-014 not found in case pack!"
    case_input = match.iloc[0].to_dict()

    # 2. Initialize Agent with Persistent MCP Session
    agent = FraudInvestigationAgent()
    assert isinstance(agent.mcp, TigerGraphMCPSession)
    
    # Reset tool history before run
    agent.mcp._tool_history.clear()

    # 3. Execute Investigation Loop
    result = agent.investigate(case_input)

    # 4. Capture standard output logs
    captured = capsys.readouterr()
    stdout_text = captured.out

    # 5. Verify Required Execution Logs from Phase 6 Specification
    assert "[LangGraph] Node: retrieve_graph_context" in stdout_text
    assert "[MCP] tigergraph__get_graph_schema" in stdout_text
    assert "[MCP] tigergraph__run_installed_query: device_ring" in stdout_text
    assert "[TigerGraph] device_ring query" in stdout_text
    assert "[TigerGraph] 3-hop traversal complete" in stdout_text
    assert "[Agent] 62 connected cards discovered" in stdout_text or "connected cards discovered" in stdout_text
    assert "[PolicyEngine] R6/R9 evaluated" in stdout_text
    assert "[LangGraph] Final action generated" in stdout_text
    assert "[MCP] tigergraph__write_investigation_case: CASE-2016-014" in stdout_text
    assert "[TigerGraph] Read-after-write verification: COMMITTED" in stdout_text

    # 6. Verify Actual MCP Tool Invocations
    tool_history = agent.mcp.get_tool_history()
    invoked_tools = [entry["tool"] for entry in tool_history]
    
    assert "tigergraph__get_graph_schema" in invoked_tools
    assert "tigergraph__run_installed_query" in invoked_tools
    assert "tigergraph__retrieve_policy_context" in invoked_tools
    assert "tigergraph__write_investigation_case" in invoked_tools
    assert len(tool_history) >= 6, f"Expected >= 6 MCP tool calls, got {len(tool_history)}"

    # 7. Verify Multi-Hop Ring Discovery (> 55 connected cards)
    conn_cards = result.case.connected_card_ids
    assert len(conn_cards) >= 55, f"Expected >= 55 connected cards in ring, found {len(conn_cards)}"

    # 8. Verify Exposure Calculation & Policy Actions
    assert result.case.verdict == "fraud"
    assert result.case.pattern == "undocumented"
    assert result.case.exposure_usd == 74.96
    assert result.sar.file is True

    final_actions = [a.action for a in result.next_best_actions.final]
    assert "DECLINE_TRANSACTION" in final_actions
    assert "BLOCK_CARD" in final_actions
    assert "CREATE_CASE" in final_actions
    assert "FILE_REPORT" in final_actions
    assert "MONITOR_CONNECTED_CARDS" in final_actions

    # 9. Verify Read-After-Write Persistence
    assert result.case.written_to_graph is True
    assert result.case.graph_case_id == "CASE-2016-014"
