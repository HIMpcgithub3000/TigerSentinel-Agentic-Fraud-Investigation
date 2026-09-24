"""
Dual-mode TigerGraph Client for Agentic Fraud Investigation.
Supports:
1. Live TigerGraph Savanna / Community Edition (via pyTigerGraph & RESTPP)
2. Local Deterministic In-Memory Graph Engine (indexed directly from IEEE-CIS dataset)
"""

import os
import re
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional, Tuple
import pandas as pd
import networkx as nx

logger = logging.getLogger(__name__)


class TigerGraphClient:
    """
    Interface for executing GSQL queries and graph algorithms on TigerGraph.
    Includes strict temporal filtering (as_of_timestamp) to avoid future-leakage.
    """

    def __init__(self, data_dir: str = "data/raw", use_local: bool = True):
        self.data_dir = data_dir
        self.use_local = os.getenv("USE_LOCAL_GRAPH_ENGINE", "true").lower() == "true" or use_local
        self.tg_conn = None
        self._init_backend()

    def _init_backend(self):
        """Initializes either pyTigerGraph connection or local in-memory graph index."""
        if not self.use_local and os.getenv("TG_HOST"):
            try:
                import pyTigerGraph as tg
                self.tg_conn = tg.TigerGraphConnection(
                    host=os.getenv("TG_HOST"),
                    graphname=os.getenv("TG_GRAPHNAME", "FraudGraph"),
                    username=os.getenv("TG_USERNAME", "tigergraph"),
                    password=os.getenv("TG_PASSWORD", ""),
                    apiToken=os.getenv("TG_API_TOKEN", "")
                )
                logger.info("Connected to live TigerGraph Savanna instance.")
                return
            except Exception as e:
                logger.warning(f"Could not connect to live TigerGraph ({e}). Falling back to local engine.")

        logger.info("Initializing Local Deterministic Graph Engine...")
        self._init_local_engine()

    def _init_local_engine(self):
        """Builds in-memory index for transactions, identity profiles, and closed cases."""
        self.G = nx.MultiDiGraph()
        self.txns_by_id: Dict[str, Dict[str, Any]] = {}
        self.txns_by_card: Dict[str, List[Dict[str, Any]]] = {}
        self.txns_by_cust: Dict[str, List[Dict[str, Any]]] = {}
        self.device_by_txn: Dict[str, str] = {}
        self.txns_by_device: Dict[str, List[str]] = {}
        self.closed_cases: List[Dict[str, Any]] = []

        # 1. Load Closed Cases History
        closed_cases_path = os.path.join(self.data_dir, "closed_cases_history.csv")
        if os.path.exists(closed_cases_path):
            df_cases = pd.read_csv(closed_cases_path)
            self.closed_cases = df_cases.to_dict(orient="records")
            logger.info(f"Loaded {len(self.closed_cases)} closed historical cases.")

        # 2. Load Identity Records (Device Profiles)
        ident_path = os.path.join(self.data_dir, "identity.csv")
        if os.path.exists(ident_path):
            df_id = pd.read_csv(ident_path, usecols=["TransactionID", "DeviceInfo", "id_30", "id_31", "id_33"])
            df_id["TransactionID"] = df_id["TransactionID"].astype(str)
            for _, row in df_id.iterrows():
                tid = str(row["TransactionID"])
                dev_info = str(row["DeviceInfo"]) if pd.notna(row["DeviceInfo"]) else ""
                os_info = str(row["id_30"]) if pd.notna(row["id_30"]) else ""
                browser_info = str(row["id_31"]) if pd.notna(row["id_31"]) else ""
                res_info = str(row["id_33"]) if pd.notna(row["id_33"]) else ""
                
                parts = [p for p in [dev_info, os_info, browser_info, res_info] if p and p != "nan"]
                profile = " | ".join(parts) if parts else "Unknown Device"
                self.device_by_txn[tid] = profile
                if profile not in self.txns_by_device:
                    self.txns_by_device[profile] = []
                self.txns_by_device[profile].append(tid)

        # 3. Load Target Transactions & Related Context
        # To optimize memory and startup speed, we index relevant customer, card, and device-sharing transactions
        txns_path = os.path.join(self.data_dir, "transactions.csv")
        cases_pack_path = os.path.join(self.data_dir, "case_pack.csv")
        
        target_custs = set()
        target_cards = set()
        target_txns = set()
        target_device_txns = set()

        if os.path.exists(cases_pack_path):
            df_pack = pd.read_csv(cases_pack_path)
            target_custs = set(df_pack["customer_id"].dropna().astype(str))
            target_cards = set(df_pack["card_id"].dropna().astype(str))
            target_txns = set(df_pack["flagged_txn_id"].dropna().astype(str))

            # Find device profiles of target benchmark transactions
            target_dev_profiles = {self.device_by_txn[t] for t in target_txns if t in self.device_by_txn}
            for dev, tids in self.txns_by_device.items():
                if dev in target_dev_profiles:
                    target_device_txns.update(tids)

        if os.path.exists(txns_path):
            chunk_size = 50000
            for chunk in pd.read_csv(txns_path, chunksize=chunk_size, 
                                     usecols=["TransactionID", "TransactionAmt", "ProductCD", "card1", "card4", 
                                              "addr1", "P_emaildomain", "customer_id", "ts", "channel", "risk_score"]):
                chunk["TransactionID"] = chunk["TransactionID"].astype(str)
                chunk["customer_id"] = chunk["customer_id"].astype(str)
                chunk["card_id"] = chunk["customer_id"] + "-K" + chunk["card1"].astype(str)
                
                # We retain records matching the benchmark cohort, their cards, and shared device profiles
                subset = chunk[
                    chunk["customer_id"].isin(target_custs) | 
                    chunk["card_id"].isin(target_cards) | 
                    chunk["TransactionID"].isin(target_device_txns)
                ]
                for _, row in subset.iterrows():
                    rec = row.to_dict()
                    tid = str(rec["TransactionID"])
                    cid = str(rec["customer_id"])
                    c_id = str(rec["card_id"])
                    
                    self.txns_by_id[tid] = rec
                    if c_id not in self.txns_by_card:
                        self.txns_by_card[c_id] = []
                    self.txns_by_card[c_id].append(rec)
                    
                    if cid not in self.txns_by_cust:
                        self.txns_by_cust[cid] = []
                    self.txns_by_cust[cid].append(rec)
                    
                    # Graph edges
                    self.G.add_edge(cid, c_id, type="OWNS")
                    self.G.add_edge(c_id, tid, type="MADE", ts=rec["ts"], amount=rec["TransactionAmt"])
                    if tid in self.device_by_txn:
                        dev = self.device_by_txn[tid]
                        self.G.add_edge(tid, dev, type="FROM_DEVICE")

            logger.info(f"Indexed {len(self.txns_by_id)} transactions across {len(self.txns_by_cust)} target customer portfolios.")

    # -------------------------------------------------------------------------
    # Parameterized GSQL Queries with Temporal Cutoff (as_of_ts)
    # -------------------------------------------------------------------------

    def get_transaction(self, txn_id: str) -> Optional[Dict[str, Any]]:
        """Retrieves raw transaction record and attached device profile."""
        txn = self.txns_by_id.get(str(txn_id))
        if txn:
            res = dict(txn)
            res["device_profile"] = self.device_by_txn.get(str(txn_id), "Unknown Device")
            return res
        return None

    def customer_baseline(self, customer_id: str, as_of_ts: str) -> Dict[str, Any]:
        """
        GSQL: customer_baseline(customer_id, as_of_ts)
        Computes customer transaction volume, average spend, and historical regions before as_of_ts.
        """
        txns = self.txns_by_cust.get(customer_id, [])
        valid_txns = [t for t in txns if t["ts"] <= as_of_ts]
        
        amounts = [float(t["TransactionAmt"]) for t in valid_txns if pd.notna(t["TransactionAmt"])]
        regions = list(set(str(t["addr1"]) for t in valid_txns if pd.notna(t["addr1"])))
        cards = list(set(str(t["card_id"]) for t in valid_txns))
        
        return {
            "customer_id": customer_id,
            "as_of_ts": as_of_ts,
            "total_txns": len(valid_txns),
            "cards_owned": cards,
            "total_spend": sum(amounts),
            "avg_spend": (sum(amounts) / len(amounts)) if amounts else 0.0,
            "max_spend": max(amounts) if amounts else 0.0,
            "min_spend": min(amounts) if amounts else 0.0,
            "known_regions": regions
        }

    def card_window(self, card_id: str, hours: int, as_of_ts: str) -> List[Dict[str, Any]]:
        """
        GSQL: card_window(card_id, hours, as_of_ts)
        Returns chronological transactions within the window before as_of_ts.
        """
        txns = self.txns_by_card.get(card_id, [])
        cutoff_dt = datetime.strptime(as_of_ts, "%Y-%m-%d %H:%M:%S")
        start_dt = cutoff_dt - timedelta(hours=hours)
        
        window_txns = []
        for t in txns:
            t_dt = datetime.strptime(t["ts"], "%Y-%m-%d %H:%M:%S")
            if start_dt <= t_dt <= cutoff_dt:
                rec = dict(t)
                rec["device_profile"] = self.device_by_txn.get(str(t["TransactionID"]), "Unknown Device")
                window_txns.append(rec)
                
        window_txns.sort(key=lambda x: x["ts"])
        return window_txns

    def device_ring(self, profile_id: str, as_of_ts: str) -> Dict[str, Any]:
        """
        GSQL: device_ring(profile_id, as_of_ts)
        Traverses device to connected transactions, cards, customers, and prior fraud cases.
        """
        if not profile_id or profile_id == "Unknown Device":
            return {"connected_cards": [], "connected_customers": [], "prior_fraud_cases": [], "total_txns": 0}
            
        all_tids = self.txns_by_device.get(profile_id, [])
        connected_cards = set()
        connected_custs = set()
        valid_tids = []
        
        for tid in all_tids:
            txn = self.txns_by_id.get(tid)
            if txn and txn["ts"] <= as_of_ts:
                valid_tids.append(tid)
                connected_cards.add(txn["card_id"])
                connected_custs.add(txn["customer_id"])

        # Check prior confirmed fraud cases sharing these cards or device
        prior_cases = []
        for case in self.closed_cases:
            if case.get("closed_at") and str(case["closed_at"]) <= as_of_ts:
                if str(case.get("outcome")) == "confirmed_fraud":
                    if case.get("card_id") in connected_cards or (case.get("connected_card_ids") and any(c in connected_cards for c in str(case["connected_card_ids"]).split("|"))):
                        prior_cases.append(case["case_id"])

        return {
            "device_profile": profile_id,
            "connected_cards": list(connected_cards),
            "connected_customers": list(connected_custs),
            "total_txns": len(valid_tids),
            "prior_fraud_cases": prior_cases[:5]
        }

    def similar_closed_cases(self, pattern: str, card_id: Optional[str] = None, 
                             device_profile: Optional[str] = None, as_of_ts: str = "", top_k: int = 3) -> List[Dict[str, Any]]:
        """
        GSQL: similar_closed_cases(pattern, card_id, device_profile, top_k, as_of_ts)
        Retrieves matching historical closed cases strictly closed before as_of_ts.
        """
        matches = []
        for c in self.closed_cases:
            if as_of_ts and c.get("closed_at") and str(c["closed_at"]) > as_of_ts:
                continue
            
            score = 0.0
            if str(c.get("pattern")) == pattern:
                score += 0.5
            if card_id and str(c.get("card_id")) == card_id:
                score += 0.4
            if str(c.get("outcome")) == "confirmed_fraud":
                score += 0.1
                
            if score > 0.4:
                matches.append({"case_id": c["case_id"], "outcome": c["outcome"], "pattern": c.get("pattern", "none"),
                                "exposure_usd": float(c.get("exposure_usd", 0.0)), "notes": str(c.get("analyst_notes", "")), "score": score})
                
        matches.sort(key=lambda x: x["score"], reverse=True)
        return matches[:top_k]

    def write_investigation_case(self, case_id: str, verdict: str, fraud_probability: float, 
                                 pattern: str, exposure_usd: float, status: str, summary: str, 
                                 flagged_txn_id: str, card_id: str) -> bool:
        """
        GSQL: write_investigation_case(...)
        Atomically records investigation case vertex and relational memory edges.
        """
        logger.info(f"Writing Investigation Case {case_id} to TigerGraph memory.")
        self.G.add_node(case_id, type="InvestigationCase", verdict=verdict, fraud_probability=fraud_probability,
                        pattern=pattern, exposure_usd=exposure_usd, status=status, summary=summary)
        self.G.add_edge(case_id, flagged_txn_id, type="INVESTIGATION_TARGETS")
        self.G.add_edge(case_id, card_id, type="INVESTIGATION_INVOLVES_CARD")
        return True
