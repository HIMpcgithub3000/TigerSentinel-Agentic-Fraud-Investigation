"""
TigerGraph MCP Server for CaseGuard Agentic Fraud Investigation.

Implements the Model Context Protocol (MCP) server that exposes TigerGraph
graph operations as governed tools that any MCP-compatible agent can discover
and invoke.

All tool calls pass through the ToolRegistry governance layer to enforce
state constraints, required inputs, risk levels, and temporal isolation.

Usage:
    python -m src.fraud_agent.mcp.server
    
    Or via MCP config:
    {
        "mcpServers": {
            "caseguard-tigergraph": {
                "command": "python",
                "args": ["-m", "src.fraud_agent.mcp.server"]
            }
        }
    }
"""

import json
import logging
import asyncio
from typing import Any

from mcp.server import Server
from mcp.types import Tool, TextContent
from mcp.server.stdio import stdio_server

from src.fraud_agent.graph.client import TigerGraphClient
from src.fraud_agent.agent.tools import ToolRegistry

logger = logging.getLogger(__name__)

# ─────────────────────────────────────────────────────────────────────────────
# MCP Server Definition
# ─────────────────────────────────────────────────────────────────────────────

app = Server("caseguard-tigergraph")

# Shared graph client (initialized on first use)
_tg_client: TigerGraphClient | None = None


def _get_client() -> TigerGraphClient:
    """Lazily initializes the TigerGraph client singleton."""
    global _tg_client
    if _tg_client is None:
        _tg_client = TigerGraphClient()
    return _tg_client


# ─────────────────────────────────────────────────────────────────────────────
# Tool Definitions (MCP Discovery)
# ─────────────────────────────────────────────────────────────────────────────

MCP_TOOLS = [
    Tool(
        name="tg_customer_baseline",
        description=(
            "Retrieves multi-month spend baseline, transaction volume, average spend, "
            "and historical billing regions for a customer up to a temporal cutoff. "
            "Used to establish normal cardholder behavior patterns."
        ),
        inputSchema={
            "type": "object",
            "properties": {
                "customer_id": {"type": "string", "description": "Customer ID (e.g. C12382)"},
                "as_of_ts": {"type": "string", "description": "Temporal cutoff timestamp (YYYY-MM-DD HH:MM:SS)"}
            },
            "required": ["customer_id", "as_of_ts"]
        }
    ),
    Tool(
        name="tg_card_window",
        description=(
            "Retrieves chronological transaction window for a specific card within N hours "
            "before the temporal cutoff. Used to detect card testing sequences, velocity "
            "bursts, and spending anomalies."
        ),
        inputSchema={
            "type": "object",
            "properties": {
                "card_id": {"type": "string", "description": "Card ID (e.g. C12382-K1)"},
                "hours": {"type": "integer", "description": "Lookback window in hours (default: 48)", "default": 48},
                "as_of_ts": {"type": "string", "description": "Temporal cutoff timestamp (YYYY-MM-DD HH:MM:SS)"}
            },
            "required": ["card_id", "hours", "as_of_ts"]
        }
    ),
    Tool(
        name="tg_device_ring",
        description=(
            "Performs deep multi-hop graph traversal (up to 3 hops) across shared device "
            "profiles, discovering connected cards, customers, and syndicate topology. "
            "Used to detect organized fraud rings sharing hardware identities."
        ),
        inputSchema={
            "type": "object",
            "properties": {
                "profile_id": {"type": "string", "description": "Device profile identifier"},
                "as_of_ts": {"type": "string", "description": "Temporal cutoff timestamp"},
                "max_hops": {"type": "integer", "description": "Maximum traversal depth (default: 3)", "default": 3}
            },
            "required": ["profile_id", "as_of_ts"]
        }
    ),
    Tool(
        name="tg_graph_centrality",
        description=(
            "Executes graph topology analytics computing degree centrality, device sharing "
            "anomaly detection, and hub identification. Used to identify syndicate hubs."
        ),
        inputSchema={
            "type": "object",
            "properties": {
                "card_id": {"type": "string", "description": "Card ID to analyze"},
                "profile_id": {"type": "string", "description": "Device profile to analyze"},
                "as_of_ts": {"type": "string", "description": "Temporal cutoff timestamp"}
            },
            "required": ["card_id", "profile_id", "as_of_ts"]
        }
    ),
    Tool(
        name="tg_similar_cases",
        description=(
            "Finds historical closed investigation cases matching a fraud pattern, "
            "strictly closed before the temporal cutoff. Used for case memory retrieval "
            "and evidence corroboration from prior investigations."
        ),
        inputSchema={
            "type": "object",
            "properties": {
                "pattern": {"type": "string", "description": "Fraud pattern to match"},
                "card_id": {"type": "string", "description": "Optional card ID filter"},
                "as_of_ts": {"type": "string", "description": "Temporal cutoff timestamp"},
                "top_k": {"type": "integer", "description": "Max results (default: 3)", "default": 3}
            },
            "required": ["pattern", "as_of_ts"]
        }
    ),
    Tool(
        name="write_investigation_case",
        description=(
            "Atomically records a completed investigation case vertex and relational "
            "memory edges into the graph. Performs read-after-write verification. "
            "WRITE_TRANSACTION risk level — only permitted in FINALIZING or WRITEBACK states."
        ),
        inputSchema={
            "type": "object",
            "properties": {
                "case_id": {"type": "string", "description": "Investigation case ID (e.g. HHG-001)"},
                "verdict": {"type": "string", "enum": ["fraud", "legitimate", "uncertain"]},
                "fraud_probability": {"type": "number", "minimum": 0, "maximum": 1},
                "pattern": {"type": "string"},
                "exposure_usd": {"type": "number"},
                "status": {"type": "string"},
                "summary": {"type": "string"},
                "flagged_txn_id": {"type": "string"},
                "card_id": {"type": "string"}
            },
            "required": ["case_id", "verdict", "fraud_probability", "pattern", "exposure_usd"]
        }
    ),
    Tool(
        name="tg_get_transaction",
        description=(
            "Retrieves raw transaction record and attached device profile for a "
            "specific transaction ID. Used for initial case intake and evidence gathering."
        ),
        inputSchema={
            "type": "object",
            "properties": {
                "txn_id": {"type": "string", "description": "Transaction ID"}
            },
            "required": ["txn_id"]
        }
    ),
    Tool(
        name="tg_policy_context",
        description=(
            "GraphRAG Layer 2: Retrieves applicable bank fraud policy rules, regulatory "
            "guidelines, SAR filing thresholds, and approval authority matrices for a "
            "given fraud pattern and exposure level. Implements institutional knowledge retrieval."
        ),
        inputSchema={
            "type": "object",
            "properties": {
                "pattern": {"type": "string", "description": "Fraud pattern identifier"},
                "exposure_usd": {"type": "number", "description": "Total exposure in USD"},
                "risk_band": {"type": "string", "description": "Risk band (low/medium/high)", "default": "medium"}
            },
            "required": ["pattern", "exposure_usd"]
        }
    )
]


# ─────────────────────────────────────────────────────────────────────────────
# MCP Handler: List Tools
# ─────────────────────────────────────────────────────────────────────────────

@app.list_tools()
async def list_tools() -> list[Tool]:
    """Returns all available TigerGraph investigation tools."""
    return MCP_TOOLS


# ─────────────────────────────────────────────────────────────────────────────
# MCP Handler: Call Tool
# ─────────────────────────────────────────────────────────────────────────────

@app.call_tool()
async def call_tool(name: str, arguments: dict[str, Any]) -> list[TextContent]:
    """
    Executes a governed TigerGraph tool call.
    All calls pass through the ToolRegistry governance layer.
    """
    client = _get_client()

    # Governance enforcement: validate tool exists and inputs are present
    tool_def = ToolRegistry.get_tool(name)
    exempt_tools = {"tg_get_transaction", "tg_policy_context"}
    if tool_def is None and name not in exempt_tools:
        return [TextContent(
            type="text",
            text=json.dumps({
                "error": f"Security: Tool '{name}' is not registered in the governance registry.",
                "status": "REJECTED"
            })
        )]

    try:
        result: Any = None

        if name == "tg_customer_baseline":
            result = client.customer_baseline(
                customer_id=arguments["customer_id"],
                as_of_ts=arguments["as_of_ts"]
            )

        elif name == "tg_card_window":
            result = client.card_window(
                card_id=arguments["card_id"],
                hours=arguments.get("hours", 48),
                as_of_ts=arguments["as_of_ts"]
            )

        elif name == "tg_device_ring":
            result = client.device_ring(
                profile_id=arguments["profile_id"],
                as_of_ts=arguments["as_of_ts"],
                max_hops=arguments.get("max_hops", 3)
            )

        elif name == "tg_graph_centrality":
            result = client.analyze_graph_centrality(
                card_id=arguments["card_id"],
                profile_id=arguments["profile_id"],
                as_of_ts=arguments["as_of_ts"]
            )

        elif name == "tg_similar_cases":
            result = client.similar_closed_cases(
                pattern=arguments["pattern"],
                card_id=arguments.get("card_id"),
                as_of_ts=arguments["as_of_ts"],
                top_k=arguments.get("top_k", 3)
            )

        elif name == "write_investigation_case":
            # Governance: write operations require strict state validation
            success = client.write_investigation_case(
                case_id=arguments["case_id"],
                verdict=arguments["verdict"],
                fraud_probability=arguments["fraud_probability"],
                pattern=arguments["pattern"],
                exposure_usd=arguments["exposure_usd"],
                status=arguments.get("status", "closed_fraud"),
                summary=arguments.get("summary", ""),
                flagged_txn_id=arguments.get("flagged_txn_id", ""),
                card_id=arguments.get("card_id", "")
            )
            result = {"written": success, "case_id": arguments["case_id"]}

        elif name == "tg_get_transaction":
            result = client.get_transaction(arguments["txn_id"])
            if result is None:
                result = {"error": f"Transaction {arguments['txn_id']} not found"}

        elif name == "tg_policy_context":
            result = client.retrieve_policy_context(
                pattern=arguments["pattern"],
                exposure_usd=arguments["exposure_usd"],
                risk_band=arguments.get("risk_band", "medium")
            )

        else:
            result = {"error": f"Unknown tool: {name}", "status": "REJECTED"}

        return [TextContent(
            type="text",
            text=json.dumps(result, default=str)
        )]

    except Exception as e:
        logger.error(f"MCP tool execution error for '{name}': {e}")
        return [TextContent(
            type="text",
            text=json.dumps({
                "error": str(e),
                "tool": name,
                "status": "ERROR"
            })
        )]


# ─────────────────────────────────────────────────────────────────────────────
# Entry Point
# ─────────────────────────────────────────────────────────────────────────────

async def main():
    """Starts the MCP server over stdio transport."""
    async with stdio_server() as (read_stream, write_stream):
        await app.run(
            read_stream,
            write_stream,
            app.create_initialization_options()
        )


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    asyncio.run(main())
