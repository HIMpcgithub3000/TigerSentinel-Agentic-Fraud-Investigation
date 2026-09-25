"""
Submission Validator for TigerGraph Agentic Fraud Investigation Benchmark.
Validates all 20 output JSON files against the official hackathon specification.
"""

import os
import sys
import json
import glob
from typing import List

# Add project root to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from rich.console import Console

console = Console()

ALLOWED_ACTIONS = {
    "ALLOW_TRANSACTION", "DECLINE_TRANSACTION", "MONITOR_CARD",
    "MONITOR_CONNECTED_CARDS", "WARN_CUSTOMER", "VERIFY_WITH_CUSTOMER",
    "STEP_UP_AUTH", "BLOCK_CARD", "BLOCK_ALL_CARDS", "GENERATE_REPORT",
    "CREATE_CASE", "FILE_REPORT", "ESCALATE_TO_ANALYST", "CLOSE_NO_FRAUD"
}

ALLOWED_PATTERNS = {
    "card_testing", "card_not_present_fraud", "card_not_present_new_device",
    "out_of_region_use", "account_takeover", "undocumented", "none"
}


def validate_file(filepath: str) -> List[str]:
    errors = []
    fname = os.path.basename(filepath)

    try:
        with open(filepath, "r") as f:
            data = json.load(f)
    except Exception as e:
        return [f"Failed to parse JSON in {fname}: {e}"]

    # Required top-level keys
    req_top = ["case_id", "case", "evidence_requests", "next_best_actions", "sar", "stop_reason", "tool_calls"]
    for k in req_top:
        if k not in data:
            errors.append(f"Missing top-level key '{k}'")

    case = data.get("case", {})
    verdict = case.get("verdict")
    if verdict not in ["fraud", "legitimate", "uncertain"]:
        errors.append(f"Invalid verdict '{verdict}'")

    prob = case.get("fraud_probability")
    if prob is None or not (0.0 <= float(prob) <= 1.0):
        errors.append(f"Invalid fraud_probability: {prob}")

    pat = case.get("pattern")
    if pat not in ALLOWED_PATTERNS:
        errors.append(f"Invalid pattern '{pat}'")

    # Undocumented pattern rule
    if pat == "undocumented" and not case.get("pattern_description"):
        errors.append("pattern is 'undocumented' but pattern_description is empty")

    # Legitimate verdict rules
    if verdict == "legitimate":
        if case.get("affected_txn_ids"):
            errors.append("verdict is 'legitimate' but affected_txn_ids is not empty")
        if float(case.get("exposure_usd", 0.0)) != 0.0:
            errors.append(f"verdict is 'legitimate' but exposure_usd is {case.get('exposure_usd')}")

    # Written to graph
    if not isinstance(case.get("written_to_graph"), bool):
        errors.append("written_to_graph must be boolean")

    # Next best actions
    nba = data.get("next_best_actions", {})
    initial = nba.get("initial", [])
    final = nba.get("final", [])

    for a in initial:
        act = a.get("action")
        if act not in ALLOWED_ACTIONS:
            errors.append(f"Invalid action in initial: '{act}'")

    has_file_report = False
    for a in final:
        act = a.get("action")
        if act not in ALLOWED_ACTIONS:
            errors.append(f"Invalid action in final: '{act}'")
        if act == "FILE_REPORT":
            has_file_report = True
        route = a.get("route")
        if route not in ["auto", "L1", "L2"]:
            errors.append(f"Invalid route in final: '{route}'")

    # SAR rules
    sar = data.get("sar", {})
    sar_file = sar.get("file")
    if not isinstance(sar_file, bool):
        errors.append("sar.file must be boolean")

    if sar_file != has_file_report:
        errors.append(f"SAR agreement mismatch: sar.file={sar_file} but FILE_REPORT present={has_file_report}")

    if sar_file:
        if not sar.get("narrative"):
            errors.append("sar.file is true but narrative is empty")
        if not sar.get("subjects"):
            errors.append("sar.file is true but subjects list is empty")
        if float(sar.get("total_amount_usd", 0.0)) <= 0.0:
            errors.append(f"sar.file is true but total_amount_usd is {sar.get('total_amount_usd')}")
    else:
        if sar.get("narrative"):
            errors.append("sar.file is false but narrative is not empty")
        if sar.get("subjects"):
            errors.append("sar.file is false but subjects is not empty")

    return errors


def validate_submission_dir(output_dir: str = "output/cases") -> bool:
    console.print(f"[bold cyan]Validating benchmark cases in {output_dir}...[/bold cyan]\n")
    files = sorted(glob.glob(os.path.join(output_dir, "HHG-*.json")))

    if len(files) != 20:
        console.print(f"[bold red]FAIL: Expected 20 benchmark case files, found {len(files)}[/bold red]")
        return False

    all_passed = True
    for fpath in files:
        fname = os.path.basename(fpath)
        errs = validate_file(fpath)
        if errs:
            all_passed = False
            console.print(f"[bold red]✗ {fname}:[/bold red]")
            for e in errs:
                console.print(f"    - {e}")
        else:
            console.print(f"[green]✓ {fname} passed all contract checks.[/green]")

    if all_passed:
        console.print("\n[bold green]★ SUCCESS: All 20 benchmark case files strictly conform to the challenge contract![/bold green]")
    else:
        console.print("\n[bold red]Validation failed with errors listed above.[/bold red]")

    return all_passed


if __name__ == "__main__":
    dir_path = sys.argv[1] if len(sys.argv) > 1 else "output/cases"
    success = validate_submission_dir(dir_path)
    sys.exit(0 if success else 1)
