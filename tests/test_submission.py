import pytest
import os
import json
import glob
from scripts.validate_submission import validate_file, validate_submission_dir

def test_all_20_benchmark_files_exist():
    files = glob.glob("output/cases/HHG-*.json")
    assert len(files) == 20, f"Expected 20 benchmark files, got {len(files)}"

def test_benchmark_validation_suite():
    success = validate_submission_dir("output/cases")
    assert success is True

def test_individual_case_fields():
    with open("output/cases/HHG-001.json") as f:
        c1 = json.load(f)
    assert c1["case_id"] == "HHG-001"
    assert c1["case"]["verdict"] in ["fraud", "legitimate", "uncertain"]
    assert len(c1["case"]["evidence"]) > 0
    assert c1["case"]["written_to_graph"] is True
    assert c1["case"]["graph_case_id"] != ""
