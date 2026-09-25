import os
import json
import glob
import pytest
from scripts.validate_submission import validate_submission_dir, validate_file

BENCHMARK_CASES = [f"HHG-{i:03d}" for i in range(1, 21)]

def test_all_20_benchmark_files_exist():
    files = glob.glob("output/cases/HHG-*.json")
    assert len(files) == 20, f"Expected 20 benchmark files, got {len(files)}"

def test_benchmark_validation_suite():
    success = validate_submission_dir("output/cases")
    assert success is True

@pytest.mark.parametrize("case_id", BENCHMARK_CASES)
def test_benchmark_case(case_id):
    filepath = f"output/cases/{case_id}.json"
    assert os.path.exists(filepath), f"File {filepath} does not exist"
    errors = validate_file(filepath)
    assert not errors, f"Validation errors in {case_id}: {errors}"
    with open(filepath) as f:
        data = json.load(f)
    assert data["case_id"] == case_id
    assert data["case"]["verdict"] in ["fraud", "legitimate", "uncertain"]
    assert len(data["case"]["evidence"]) > 0
    assert data["case"]["written_to_graph"] is True

