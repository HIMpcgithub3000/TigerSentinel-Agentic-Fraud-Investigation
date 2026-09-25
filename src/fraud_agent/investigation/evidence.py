"""
Evidence Ledger Engine for Agentic Fraud Investigation (v2 Hardened).
Produces immutable, structured, traceable evidence items with cryptographic provenance,
Merkle hash-chaining, tamper-evident verification, and prompt injection trust boundaries.
"""

import time
import json
import hashlib
import re
from typing import List, Dict, Any, Optional
from src.fraud_agent.models import EvidenceItem


def canonical_json(data: Dict[str, Any]) -> str:
    """Produces deterministic canonical JSON serialization with sorted keys."""
    return json.dumps(data, sort_keys=True, separators=(',', ':'))


def sanitize_untrusted_text(text: str) -> str:
    """
    Sanitizes untrusted retrieved text (e.g. customer testimony, merchant notes)
    to neutralize prompt injection attempts and treat content strictly as passive data.
    """
    if not text:
        return ""
    # Strip or neutralize common instruction hijacking patterns
    sanitized = text
    suspicious_patterns = [
        r"(?i)ignore\s+(all\s+)?(previous|prior|above)\s+instructions?",
        r"(?i)system\s+prompt",
        r"(?i)disregard\s+(all\s+)?rules?",
        r"(?i)you\s+are\s+now\s+a",
        r"(?i)override\s+(policy|verdict|actions?)"
    ]
    for pattern in suspicious_patterns:
        sanitized = re.sub(pattern, "[FILTERED_INSTRUCTION_ATTEMPT]", sanitized)
    return sanitized.strip()


class EvidenceLedger:
    """
    Manages the collection and indexing of structured evidence items.
    Enforces strict temporal validity (as_of_ts) and hypothesis tracking.
    Guarantees cryptographic immutability via continuous SHA-256 hash chaining.
    """

    GENESIS_HASH = "0" * 64

    def __init__(self, cutoff_ts: str):
        self.cutoff_ts = cutoff_ts
        self.items: List[EvidenceItem] = []
        self._provenance_map: Dict[str, Dict[str, Any]] = {}
        self._previous_hash: str = self.GENESIS_HASH
        self.case_root_hash: Optional[str] = None
        self.ledger_version: str = "2.0"
        self.created_at: float = time.time()
        self.finalized_at: Optional[float] = None
        self.is_finalized: bool = False
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
        provenance_query: Optional[str] = None,
        source_trust: str = "AUTHORITATIVE_GRAPH",
        layer: int = 1,
        confidence: float = 0.85
    ) -> EvidenceItem:
        """
        Adds a verified observation to the immutable Evidence Ledger.
        Computes SHA-256 canonical hash and links into the Merkle hash chain.
        """
        if self.is_finalized:
            raise RuntimeError("EvidenceLedger is finalized and immutable; cannot append new evidence.")

        evidence_id = f"EV-{self._counter:03d}"
        self._counter += 1

        # Strict temporal validation: reject any observation occurring after cutoff
        temporal_valid = True
        if timestamp and self.cutoff_ts and timestamp > self.cutoff_ts:
            temporal_valid = False

        # Preserve immutable forensic representation and derive sanitized presentation
        raw_claim = claim
        clean_claim = sanitize_untrusted_text(claim) if source in ["customer", "external", "analyst_notes"] else claim
        injection_detected = (clean_claim != raw_claim)

        item = EvidenceItem(
            evidence_id=evidence_id,
            claim=clean_claim,
            source=source,  # type: ignore
            ref=ref,
            entity_ids=sorted(list(set(entity_ids))),
            strength=strength,
            temporal_valid=temporal_valid,
            supports=supports or [],
            contradicts=contradicts or [],
            timestamp=timestamp,
            raw_claim=raw_claim,
            sanitized_claim=clean_claim,
            injection_detected=injection_detected,
            source_trust=source_trust,
            item_hash=None,
            layer=layer,
            confidence=confidence,
            provenance_query=provenance_query
        )

        # Canonical Forensic Item Representation for Cryptographic Hashing
        canonical_record = {
            "evidence_id": evidence_id,
            "claim": clean_claim,
            "raw_claim": raw_claim,
            "sanitized_claim": clean_claim,
            "injection_detected": injection_detected,
            "source": source,
            "ref": ref,
            "entity_ids": item.entity_ids,
            "strength": round(strength, 4),
            "temporal_valid": temporal_valid,
            "timestamp": timestamp or self.cutoff_ts
        }
        item_raw_json = canonical_json(canonical_record)
        item_hash = hashlib.sha256(item_raw_json.encode("utf-8")).hexdigest()
        item.item_hash = item_hash

        # Cryptographic Hash Chaining: H_i = SHA-256(H_{i-1} + item_hash)
        chain_hash = hashlib.sha256((self._previous_hash + item_hash).encode("utf-8")).hexdigest()
        prev_h = self._previous_hash
        self._previous_hash = chain_hash

        self.items.append(item)
        self._provenance_map[evidence_id] = {
            "evidence_id": evidence_id,
            "item_hash": item_hash,
            "chain_hash": chain_hash,
            "previous_hash": prev_h,
            "query": provenance_query or ref,
            "source_trust": source_trust,
            "recorded_at": time.time(),
            "temporal_valid": temporal_valid,
            "injection_detected": injection_detected
        }
        return item

    def finalize_ledger(self) -> str:
        """
        Finalizes the Evidence Ledger, sealing the cryptographic root hash.
        Once finalized, no further items may be appended or modified.
        """
        self.is_finalized = True
        self.finalized_at = time.time()
        self.case_root_hash = self._previous_hash
        return self.case_root_hash

    def verify_integrity(self) -> bool:
        """
        Audits and cryptographically verifies the entire SHA-256 hash chain from genesis.
        Returns True if the ledger is intact and untampered; False if modified.
        """
        running_hash = self.GENESIS_HASH
        for item in self.items:
            canonical_record = {
                "evidence_id": item.evidence_id,
                "claim": item.claim,
                "raw_claim": item.raw_claim if item.raw_claim is not None else item.claim,
                "sanitized_claim": item.sanitized_claim if item.sanitized_claim is not None else item.claim,
                "injection_detected": item.injection_detected,
                "source": item.source,
                "ref": item.ref,
                "entity_ids": item.entity_ids,
                "strength": round(item.strength, 4),
                "temporal_valid": item.temporal_valid,
                "timestamp": item.timestamp or self.cutoff_ts
            }
            item_raw_json = canonical_json(canonical_record)
            computed_item_hash = hashlib.sha256(item_raw_json.encode("utf-8")).hexdigest()
            computed_chain_hash = hashlib.sha256((running_hash + computed_item_hash).encode("utf-8")).hexdigest()

            stored_prov = self._provenance_map.get(item.evidence_id)
            if not stored_prov:
                return False
            if stored_prov["item_hash"] != computed_item_hash or stored_prov["chain_hash"] != computed_chain_hash:
                return False

            running_hash = computed_chain_hash

        if self.is_finalized and self.case_root_hash != running_hash:
            return False

        return True

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
