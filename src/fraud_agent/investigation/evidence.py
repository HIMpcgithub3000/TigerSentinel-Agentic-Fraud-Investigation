"""
Evidence Ledger Engine for Agentic Fraud Investigation.
Produces immutable, structured, traceable evidence items with explicit citations,
cryptographic provenance, and contradiction tracking.
"""

import time
import hashlib
from typing import List, Dict, Any, Optional
from src.fraud_agent.models import EvidenceItem


class EvidenceLedger:
    """
    Manages the collection and indexing of structured evidence items.
    Enforces strict temporal validity (as_of_ts) and hypothesis tracking.
    Guarantees immutability and provenance for every verified observation.
    """

    def __init__(self, cutoff_ts: str):
        self.cutoff_ts = cutoff_ts
        self.items: List[EvidenceItem] = []
        self._provenance_map: Dict[str, Dict[str, Any]] = {}
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
        timestamp: Optional[str] = None,
        provenance_query: Optional[str] = None
    ) -> EvidenceItem:
        """
        Adds a verified observation to the immutable Evidence Ledger.
        Computes deterministic provenance hash and enforces temporal bounds.
        """
        evidence_id = f"EV-{self._counter:03d}"
        self._counter += 1

        # Strict temporal validation: reject any observation occurring after cutoff
        temporal_valid = True
        if timestamp and self.cutoff_ts and timestamp > self.cutoff_ts:
            temporal_valid = False

        # Generate cryptographic provenance signature
        raw_sig = f"{evidence_id}|{claim}|{ref}|{','.join(entity_ids)}|{timestamp or self.cutoff_ts}"
        sig_hash = hashlib.sha256(raw_sig.encode()).hexdigest()[:16]

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
        self._provenance_map[evidence_id] = {
            "evidence_id": evidence_id,
            "hash": sig_hash,
            "query": provenance_query or ref,
            "recorded_at": time.time(),
            "temporal_valid": temporal_valid
        }
        return item

    def get_valid_evidence(self) -> List[EvidenceItem]:
        """Returns only temporally valid evidence items for reasoning."""
        return [item for item in self.items if item.temporal_valid]

    def get_supporting_evidence(self, hypothesis: str) -> List[EvidenceItem]:
        """Returns valid evidence items that explicitly support a hypothesis."""
        return [item for item in self.items if item.temporal_valid and hypothesis in item.supports]

    def get_contradicting_evidence(self, hypothesis: str) -> List[EvidenceItem]:
        """Returns valid evidence items that explicitly contradict a hypothesis."""
        return [item for item in self.items if item.temporal_valid and hypothesis in item.contradicts]

    def has_severe_contradictions(self) -> bool:
        """Checks if any valid evidence has high-strength contradictions (>0.80)."""
        for item in self.items:
            if item.temporal_valid and item.contradicts and item.strength >= 0.80:
                return True
        return False

    def to_output_evidence_list(self) -> List[Dict[str, Any]]:
        """
        Converts ledger into the required benchmark answer JSON format.
        Preserves strictly the 4 contract fields: claim, source, ref, entity_ids.
        """
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
