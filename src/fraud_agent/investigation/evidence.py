"""
Evidence Ledger Engine for Agentic Fraud Investigation.
Produces immutable, structured, traceable evidence items with explicit citations.
"""

from typing import List, Dict, Any, Optional
from src.fraud_agent.models import EvidenceItem


class EvidenceLedger:
    """
    Manages the collection and indexing of structured evidence items.
    Enforces temporal validity and hypothesis tracking.
    """

    def __init__(self, cutoff_ts: str):
        self.cutoff_ts = cutoff_ts
        self.items: List[EvidenceItem] = []
        self._counter = 1

    def add_evidence(
        self,
        claim: str,
        source: str,
        ref: str,
        entity_ids: List[str],
        strength: float = 0.5,
        supports: Optional[List[str]] = None,
        contradicts: Optional[List[str]] = None,
        timestamp: Optional[str] = None
    ) -> EvidenceItem:
        """Adds a verified observation to the immutable Evidence Ledger."""
        evidence_id = f"EV-{self._counter:03d}"
        self._counter += 1

        temporal_valid = True
        if timestamp and self.cutoff_ts and timestamp > self.cutoff_ts:
            temporal_valid = False

        item = EvidenceItem(
            evidence_id=evidence_id,
            claim=claim,
            source=source,  # type: ignore
            ref=ref,
            entity_ids=entity_ids,
            strength=strength,
            temporal_valid=temporal_valid,
            supports=supports or [],
            contradicts=contradicts or [],
            timestamp=timestamp
        )
        self.items.append(item)
        return item

    def get_valid_evidence(self) -> List[EvidenceItem]:
        """Returns only temporally valid evidence items for reasoning."""
        return [item for item in self.items if item.temporal_valid]

    def to_output_evidence_list(self) -> List[Dict[str, Any]]:
        """Converts ledger into the required benchmark answer JSON format."""
        return [
            {
                "claim": item.claim,
                "source": item.source,
                "ref": item.ref,
                "entity_ids": item.entity_ids
            }
            for item in self.items
            if item.temporal_valid
        ]
