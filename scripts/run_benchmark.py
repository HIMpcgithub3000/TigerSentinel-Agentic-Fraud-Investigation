"""
Batch Benchmark Runner for TigerGraph Agentic Fraud Investigation.
Processes all 20 benchmark cases (HHG-001 to HHG-020) and exports verified JSON files.
"""

import os
import sys
import json
import time
import argparse

# Add project root to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import pandas as pd
from rich.console import Console
from rich.table import Table

from src.fraud_agent.agent.orchestrator import FraudInvestigationAgent

console = Console()


def run_all_cases(output_dir: str = "output/cases", case_pack_path: str = "data/raw/case_pack.csv"):
    os.makedirs(output_dir, exist_ok=True)
    df_pack = pd.read_csv(case_pack_path)

    console.print(f"[bold cyan]Initializing TigerGraph Agentic Investigator...[/bold cyan]")
    t0 = time.time()
    agent = FraudInvestigationAgent()
    console.print(f"[green]Agent initialized in {time.time() - t0:.2f}s.[/green]\n")

    table = Table(title="TigerGraph Fraud Investigation - 20 Benchmark Cases Execution")
    table.add_column("Case ID", style="bold white")
    table.add_column("Txn ID", style="dim")
    table.add_column("Trigger", style="magenta")
    table.add_column("Verdict", style="bold")
    table.add_column("Pattern", style="cyan")
    table.add_column("Prob", justify="right")
    table.add_column("Exposure", justify="right")
    table.add_column("Final Actions", style="green")
    table.add_column("SAR", justify="center")
    table.add_column("Graph ID", style="dim")

    results = []

    for idx, row in df_pack.iterrows():
        case_data = row.to_dict()
        case_id = str(case_data["case_id"])
        
        console.print(f"[yellow]Investigating {case_id}...[/yellow]")
        out = agent.investigate(case_data)
        results.append(out)

        # Write to JSON file
        out_path = os.path.join(output_dir, f"{case_id}.json")
        with open(out_path, "w") as f:
            f.write(out.model_dump_json(indent=2))

        # Format table row
        verdict_style = "green" if out.case.verdict == "legitimate" else ("red" if out.case.verdict == "fraud" else "yellow")
        actions_str = ", ".join([a.action for a in out.next_best_actions.final[:2]])
        sar_str = "[bold red]YES[/bold red]" if out.sar.file else "NO"

        table.add_row(
            case_id,
            str(case_data["flagged_txn_id"]),
            str(case_data["trigger_type"]),
            f"[{verdict_style}]{out.case.verdict}[/{verdict_style}]",
            out.case.pattern,
            f"{out.case.fraud_probability:.2f}",
            f"${out.case.exposure_usd:.2f}",
            actions_str,
            sar_str,
            out.case.graph_case_id
        )

    console.print(table)
    console.print(f"\n[bold green]Successfully generated and exported {len(results)} answer files to {output_dir}/[/bold green]")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Run 20 Benchmark Cases")
    parser.add_argument("--output", default="output/cases", help="Output directory")
    args = parser.parse_args()
    run_all_cases(output_dir=args.output)
