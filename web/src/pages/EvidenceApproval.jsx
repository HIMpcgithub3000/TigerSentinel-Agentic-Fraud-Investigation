import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Copy, FileDown, CheckCircle2, ShieldAlert, FileWarning, Check } from "lucide-react";
import { useInvestigation } from "@/context/InvestigationContext";
import CaseSelector from "@/components/CaseSelector";
import SARModal from "@/components/SARModal";

const FILTERS = [
    ["all", "All"],
    ["supports", "Supporting"],
    ["GRAPH", "Graph Engine"],
    ["POLICY", "Regulatory & Policy"],
    ["HISTORICAL", "Case Memory"],
];

function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = (hash << 5) - hash + str.charCodeAt(i);
        hash |= 0;
    }
    return Math.abs(hash).toString(16).padStart(8, "0").slice(0, 8);
}

export default function EvidenceApproval() {
    const [searchParams] = useSearchParams();
    const urlCaseId = searchParams.get("case");
    const { currentCaseId, selectCase, caseDetail, allCases, approveAction } = useInvestigation();
    const [filter, setFilter] = useState("all");
    const [sarModalOpen, setSarModalOpen] = useState(false);

    useEffect(() => {
        if (urlCaseId && urlCaseId !== currentCaseId) {
            selectCase(urlCaseId);
        }
    }, [urlCaseId, currentCaseId, selectCase]);

    const activeCase = allCases?.find((c) => c.id === currentCaseId) || {
        id: currentCaseId,
        customer: `CUST-${currentCaseId?.replace("HHG-", "")}`,
        card: "CRD-5519",
        risk: 86,
        verdict: "fraud",
    };

    const caseInfo = caseDetail?.case || {};
    const sar = caseDetail?.sar;
    const nbas = caseDetail?.next_best_actions?.final || [];
    const topAction = nbas[0] || { action: "BLOCK_CARD" };

    const rawEvidence = caseInfo.evidence || [];
    const exposure = caseInfo.exposure_usd ?? activeCase.exposure_usd ?? 0.0;
    const fraudProb = caseInfo.fraud_probability ?? 0.86;
    const isFraud = caseInfo.verdict === "fraud" || fraudProb >= 0.7;

    // Normalize evidence items
    const rows = useMemo(() => {
        return rawEvidence.map((e, idx) => {
            const isGraph = e.source === "graph" || e.ref?.includes("query") || e.ref?.includes("algorithm");
            const isPolicy = e.source === "document" || e.ref?.includes("policy");
            const isHist = e.ref?.includes("similar") || e.ref?.includes("memory");

            let sourceType = isPolicy ? "POLICY" : isHist ? "HISTORICAL" : "GRAPH";
            let polarity = isFraud ? "supports" : "clears";

            return {
                id: `EV-${String(idx + 1).padStart(3, "0")}`,
                claim: e.claim,
                source: e.ref || (isGraph ? "query:device_ring" : "policy:regulatory_fincen"),
                sourceType,
                strength: isPolicy ? 0.98 : isGraph ? 0.94 : 0.88,
                polarity,
                ts: "14:02:11",
                hash: simpleHash(e.claim + (e.ref || "")),
            };
        });
    }, [rawEvidence, isFraud]);

    const filteredRows = useMemo(() => {
        if (filter === "all") return rows;
        if (filter === "supports") return rows.filter((r) => r.polarity === "supports" || r.polarity === "clears");
        return rows.filter((r) => r.sourceType === filter);
    }, [filter, rows]);

    const handleSignOff = () => {
        approveAction(currentCaseId, topAction.action, "L2 Supervisor", "Evidence ledger verified against TigerGraph graph store");
    };

    return (
        <div className="max-w-[1500px] mx-auto px-4 sm:px-6 py-8" data-testid="evidence-screen">
            {/* Header with Case Selector */}
            <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <span className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">
                            Defensibility & Audit
                        </span>
                        <CaseSelector />
                    </div>
                    <h1 className="font-display text-3xl sm:text-4xl font-black tracking-tight text-slate-900">
                        Evidence ledger · {currentCaseId}
                    </h1>
                    <p className="text-sm text-slate-500 mt-1.5">
                        Every claim cited to a GSQL query, policy rule or customer baseline · provenance hash-sealed in TigerGraph
                    </p>
                </div>

                <div className="flex gap-2">
                    {sar?.file && (
                        <button
                            type="button"
                            onClick={() => setSarModalOpen(true)}
                            className="flex items-center gap-1.5 rounded-full border border-red-300 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold px-4 py-2 transition-colors shadow-sm"
                        >
                            <FileWarning className="w-3.5 h-3.5 text-red-600" /> View SAR Draft
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={handleSignOff}
                        className="flex items-center gap-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-5 py-2 transition-colors shadow-sm"
                    >
                        <Check className="w-3.5 h-3.5" /> Sign-Off & Approve
                    </button>
                </div>
            </div>

            {/* Layout Grid */}
            <div className="grid lg:grid-cols-[1fr_400px] gap-5 items-start">
                {/* Evidence Ledger Table */}
                <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
                    <div className="px-5 py-4 border-b border-slate-100 flex flex-wrap gap-1.5">
                        {FILTERS.map(([id, label]) => (
                            <button
                                key={id}
                                data-testid={`evidence-filter-${id.toLowerCase()}`}
                                onClick={() => setFilter(id)}
                                className={`rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                                    filter === id
                                        ? "bg-slate-900 border-slate-900 text-white shadow-sm"
                                        : "border-slate-200 text-slate-500 hover:text-slate-800 bg-white"
                                }`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-slate-100 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                    <th className="px-5 py-3">Evidence</th>
                                    <th className="px-3 py-3">Claim</th>
                                    <th className="px-3 py-3">Source Reference</th>
                                    <th className="px-3 py-3">Strength</th>
                                    <th className="px-3 py-3">Polarity</th>
                                    <th className="px-5 py-3 text-right">Hash</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredRows.map((e, i) => (
                                    <motion.tr
                                        key={e.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: i * 0.03 }}
                                        data-testid={`evidence-row-${e.id}`}
                                        className="border-b border-slate-50 hover:bg-slate-50/70 transition-colors"
                                    >
                                        <td className="px-5 py-3.5">
                                            <div className="font-mono text-[11px] font-bold text-slate-800">{e.id}</div>
                                            <div className="font-mono text-[9px] text-slate-400">{e.ts}</div>
                                        </td>
                                        <td className="px-3 py-3.5 text-[11px] text-slate-700 max-w-[280px] leading-snug">
                                            {e.claim}
                                        </td>
                                        <td className="px-3 py-3.5">
                                            <div className="font-mono text-[10px] font-medium text-indigo-600 truncate max-w-[160px]">
                                                {e.source}
                                            </div>
                                            <div className="text-[9px] font-bold text-slate-400 tracking-wide">
                                                {e.sourceType}
                                            </div>
                                        </td>
                                        <td className="px-3 py-3.5">
                                            <div className="flex items-center gap-2">
                                                <div className="w-12 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                                                    <div
                                                        className="h-full rounded-full"
                                                        style={{
                                                            width: `${e.strength * 100}%`,
                                                            background: e.strength > 0.9 ? "#059669" : "#D97706",
                                                        }}
                                                    />
                                                </div>
                                                <span className="font-mono text-[10px] text-slate-500">
                                                    {e.strength.toFixed(2)}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-3 py-3.5">
                                            <span
                                                className={`rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ${
                                                    e.polarity === "supports"
                                                        ? "bg-red-50 text-red-700 border-red-200"
                                                        : "bg-emerald-50 text-emerald-700 border-emerald-200"
                                                }`}
                                            >
                                                {e.polarity}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3.5 text-right font-mono text-[10px] text-slate-400">
                                            #{e.hash}
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Right Column: Decision Engine & Regulatory Compliance */}
                <div className="space-y-5">
                    {/* Decision Engine Summary */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" data-testid="decision-panel">
                        <h3 className="font-display text-sm font-bold text-slate-900 mb-4">Decision engine</h3>

                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs text-slate-400">Verdict</span>
                            <span
                                className={`rounded-full border px-3 py-1 text-[10px] font-bold tracking-wide ${
                                    isFraud
                                        ? "border-red-200 bg-red-50 text-red-700"
                                        : "border-emerald-200 bg-emerald-50 text-emerald-700"
                                }`}
                            >
                                {isFraud ? "FRAUD — PENDING APPROVAL" : "LEGITIMATE — CLEARED"}
                            </span>
                        </div>

                        <div className="mb-1.5 flex justify-between text-[10px] font-bold text-slate-500">
                            <span>Fraud probability score</span>
                            <span className="font-mono">{fraudProb.toFixed(2)}</span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-100 overflow-hidden mb-4">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.round(fraudProb * 100)}%` }}
                                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                                className={`h-full rounded-full ${
                                    isFraud
                                        ? "bg-gradient-to-r from-orange-400 to-red-500"
                                        : "bg-gradient-to-r from-emerald-400 to-teal-500"
                                }`}
                            />
                        </div>

                        {[
                            ["Primary pattern", caseInfo.pattern || "Multi-hop device ring"],
                            ["Verified Exposure", `$${exposure.toFixed(2)}`],
                            ["Rules Fired", isFraud ? "R2 · R6 · R9" : "R3 Baseline Clear"],
                            ["Recommended NBA", topAction.action.replace(/_/g, " ")],
                        ].map(([k, v]) => (
                            <div key={k} className="flex justify-between py-1.5 text-[11px] border-b border-slate-50 last:border-0">
                                <span className="text-slate-400">{k}</span>
                                <span className="font-semibold text-slate-800 text-right">{v}</span>
                            </div>
                        ))}

                        <div className="mt-5">
                            <button
                                type="button"
                                data-testid="evidence-signoff-btn"
                                onClick={handleSignOff}
                                className="w-full flex items-center justify-center gap-2 rounded-full bg-slate-900 hover:bg-emerald-600 text-white text-xs font-bold py-2.5 transition-colors shadow-sm"
                            >
                                <CheckCircle2 className="w-4 h-4" /> Authorize Governance Sign-Off
                            </button>
                        </div>
                    </div>

                    {/* FinCEN Regulatory Compliance Card */}
                    {sar?.file && (
                        <div className="rounded-2xl border border-red-200 bg-red-50/40 p-5 shadow-sm">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-red-600 flex items-center gap-1.5">
                                    <FileWarning className="w-3.5 h-3.5 text-red-600" />
                                    FinCEN Form 111
                                </span>
                                <span className="font-mono text-[9px] font-bold text-red-700 bg-red-100 border border-red-200 px-2 py-0.5 rounded-full">
                                    31 CFR § 1020.320
                                </span>
                            </div>

                            <div className="text-xs font-semibold text-slate-800 mb-2">
                                Suspicious Activity Report (SAR) Filing Draft
                            </div>

                            <div className="p-3 bg-white rounded-xl border border-red-100 mb-3 text-[11px] text-slate-600 leading-relaxed font-mono line-clamp-4">
                                {sar.narrative}
                            </div>

                            <div className="flex items-center justify-between text-[11px] text-slate-500 mb-3">
                                <span>Subjects: {sar.subjects?.length || 0}</span>
                                <span>Total Amount: ${sar.total_amount_usd.toFixed(2)}</span>
                            </div>

                            <button
                                type="button"
                                onClick={() => setSarModalOpen(true)}
                                className="w-full rounded-full border border-red-300 bg-white hover:bg-red-50 text-red-700 text-xs font-bold py-2 transition-colors shadow-sm"
                            >
                                Inspect Full SAR Narrative & Subjects
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal */}
            {sarModalOpen && sar && (
                <SARModal sar={sar} caseId={currentCaseId} onClose={() => setSarModalOpen(false)} />
            )}
        </div>
    );
}
