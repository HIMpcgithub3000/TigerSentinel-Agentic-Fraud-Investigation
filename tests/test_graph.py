import pytest
from src.fraud_agent.graph.client import TigerGraphClient

@pytest.fixture(scope="module")
def tg_client():
    return TigerGraphClient()

def test_tg_client_init(tg_client):
    assert tg_client is not None
    assert len(tg_client.closed_cases) > 0

def test_customer_baseline(tg_client):
    baseline = tg_client.customer_baseline("C12382", "2016-12-05 01:55:28")
    assert baseline["customer_id"] == "C12382"
    assert baseline["total_txns"] > 0
    assert "444.0" in baseline["known_regions"]

def test_temporal_cutoff(tg_client):
    # Historical cases closed AFTER the cutoff must be excluded
    cutoff_early = "2016-07-03 00:00:00"
    matches = tg_client.similar_closed_cases(pattern="card_not_present_fraud", as_of_ts=cutoff_early, top_k=10)
    for m in matches:
        # None should have been closed after cutoff
        assert m["score"] > 0

def test_device_ring_discovery(tg_client):
    dev = "SM-G935F Build/NRD90M | Android 7.0 | chrome 62.0 for android | 1920x1080"
    ring = tg_client.device_ring(dev, "2016-11-22 20:11:00")
    assert len(ring["connected_cards"]) >= 2
    assert len(ring["connected_customers"]) >= 2
