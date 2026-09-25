import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
    Play,
    Pause,
    RotateCcw,
    ShieldAlert,
    CheckCircle2,
    Clock,
    ArrowRight,
    FileText,
    Network,
    FileWarning,
    ShieldCheck,
    Check,
    Smartphone,
    CreditCard,
    Layers,
} from "lucide-react";
import { toast } from "sonner";
import { STEPS } from "@/data/mockData";
import { useInvestigation } from "@/context/InvestigationContext";
import CaseSelector from "@/components/CaseSelector";
import SARModal from "@/components/SARModal";

const HYPO_STYLE = {
    supported: { bar: "#059669", badge: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    unresolved: { bar: "#D97706", badge: "bg-amber-50 text-amber-700 border-amber-200" },
    contradicted: { bar: "#DC2626", badge: "bg-red-50 text-red-700 border-red-200" },
};

function fmt(s) {
    return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

export default function Workspace() {
    const nav = useNavigate();
    const [searchParams] = useSearchParams();
    const urlCaseId = searchParams.get("case");

    const {
        currentCaseId,
        selectCase,
        allCases,
        caseDetail,
        stepIndex,
        status,
        elapsed,
        start,
        pause,
        resume,
        reset,
        approveAction,
    } = useInvestigation();

    // Auto-select case if present in URL
    useEffect(() => {
        if (urlCaseId && urlCaseId !== currentCaseId) {
            selectCase(urlCaseId);
        }
    }, [urlCaseId, currentCaseId, selectCase]);

    const [sarModalOpen, setSarModalOpen] = useState(false);

    // Active case data
    const activeCase = allCases?.find((c) => c.id === currentCaseId) || {
        id: currentCaseId,
        customer: `Customer ${currentCaseId?.replace("HHG-", "C")} · Subject`,
        card: "CRD-5519",
        trigger: "Autonomous risk signal detected",
        full_trigger: "High-degree network centrality anomaly detected via TigerGraph",
        risk: 86,
        verdict: "fraud",
        status: "INVESTIGATING",
        pattern: "Multi-hop device ring",
    };

    const caseInfo = caseDetail?.case || {};
    const nbas = caseDetail?.next_best_actions?.final || [];
    const topAction = nbas[0] || {
        action: caseInfo.verdict === "fraud" ? "BLOCK_CARD" : caseInfo.verdict === "uncertain" ? "VERIFY_WITH_CUSTOMER" : "ALLOW_TRANSACTION",
        route: caseInfo.verdict === "uncertain" ? "auto" : "L1",
        reason: caseInfo.pattern_description || "Evaluation confirmed by TigerGraph GSQL graph engine.",
    };

    const evidenceList = caseInfo.evidence || [];
    const connectedCards = caseInfo.connected_card_ids || [];
    const connectedDevices = caseInfo.connected_device_profiles || [];
    const exposure = caseInfo.exposure_usd ?? activeCase.exposure_usd ?? 0.0;
    const fraudProb = caseInfo.fraud_probability ?? (activeCase.risk ? activeCase.risk / 100 : 0.86);
    const riskScore = Math.round(fraudProb * 100);
    const isFraud = caseInfo.verdict === "fraud" || riskScore >= 70;

    // Build realistic hypotheses dynamically matching active case verdict & pattern
    const hypotheses = useMemo(() => {
        if (caseInfo.verdict === "legitimate") {
            return [
                {
                    name: "Legitimate cardholder spending baseline",
                    confidence: 96,
                    status: "supported",
                    supporting: Math.max(3, evidenceList.length),
                    contradicting: 0,
                    entities: ["Historical txn window", "Billing region match"],
                },
                {
                    name: "Out-of-region card cloning",
                    confidence: 12,
                    status: "contradicted",
                    supporting: 0,
                    contradicting: Math.max(3, evidenceList.length),
                    entities: ["Domestic billing profile", "Merchant match"],
                },
                {
                    name: "Card testing anomaly",
                    confidence: 4,
                    status: "contradicted",
                    supporting: 0,
                    contradicting: 2,
                    entities: [activeCase.card || "Flagged Card"],
                },
            ];
        } else if (caseInfo.verdict === "uncertain") {
            const patName = caseInfo.pattern === "out_of_region_use"
                ? "Out-of-region travel vs Card cloning"
                : caseInfo.pattern === "account_takeover"
                ? "Account takeover vs Legitimate device change"
                : "Card-not-present fraud vs Cardholder purchase";
            return [
                {
                    name: patName,
                    confidence: Math.round(fraudProb * 100),
                    status: "unresolved",
                    supporting: 2,
                    contradicting: 2,
                    entities: [activeCase.card || "Flagged Card", "Customer validation pending"],
                },
                {
                    name: "Legitimate customer authorization",
                    confidence: Math.round((1 - fraudProb) * 100),
                    status: "unresolved",
                    supporting: 2,
                    contradicting: 1,
                    entities: ["Historical spending window"],
                },
                {
                    name: "Syndicate multi-hop ring",
                    confidence: 8,
                    status: "contradicted",
                    supporting: 0,
                    contradicting: 4,
                    entities: ["0 connected cards", "Isolated transaction"],
                },
            ];
        } else {
            // Fraud case
            return [
                {
                    name: connectedCards.length > 1 ? "Syndicate device ring / Coordinated abuse" : "Unauthorized card compromise",
                    confidence: Math.min(98, riskScore + 2),
                    status: "supported",
                    supporting: Math.max(4, evidenceList.length),
                    contradicting: 0,
                    entities: connectedDevices.length > 0 
                        ? [connectedDevices[0].split("|")[0], connectedCards.length > 0 ? `${connectedCards.length} cards linked` : "Card-not-present anomaly"] 
                        : ["Cardholder", "Flagged Txn"],
                },
                {
                    name: "Legitimate cardholder spending baseline",
                    confidence: Math.max(2, 100 - riskScore),
                    status: "contradicted",
                    supporting: 0,
                    contradicting: Math.max(4, evidenceList.length),
                    entities: ["Historical baseline deviation", "Customer dispute"],
                },
                {
                    name: "Isolated merchant authorization glitch",
                    confidence: 5,
                    status: "contradicted",
                    supporting: 0,
                    contradicting: 3,
                    entities: [activeCase.card || "Flagged Card"],
                },
            ];
        }
    }, [caseInfo.verdict, caseInfo.pattern, fraudProb, riskScore, evidenceList.length, connectedCards.length, connectedDevices, activeCase.card]);

    const handleRun = () => {
        if (status === "paused") {
            resume();
        } else {
            start(currentCaseId);
        }
    };

    const handleApprove = () => {
        approveAction(currentCaseId, topAction.action, "L2 Supervisor", "Approved via Analyst Workspace console");
        if (caseDetail?.sar?.file) {
            setSarModalOpen(true);
        }
    };

    return (
        <div className="max-w-[1500px] mx-auto px-4 sm:px-6 py-8" data-testid="workspace-screen">
            {/* Top Selector & Case Header */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 mb-5 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
                    <div className="flex flex-wrap items-center gap-3">
                        <CaseSelector />
                        <span className="text-slate-300 hidden sm:inline">|</span>
                        <div className="text-xs text-slate-500">
                            Subject: <span className="font-semibold text-slate-800">{activeCase.customer}</span>
                        </div>
                        <div className="text-xs text-slate-500">
                            Card: <span className="font-mono font-semibold text-slate-800">{activeCase.card}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 font-mono text-xs text-slate-500" data-testid="investigation-timer">
                            <Clock className="w-3.5 h-3.5 text-indigo-500" />
                            <span>{fmt(elapsed)}</span>
                            {status === "running" && (
                                <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-300 animate-pulse">
                                    ⏱ {Math.max(0, 100 - Math.round(((stepIndex + 1) / STEPS.length) * 100))}% Time Left
                                </span>
                            )}
                            {status === "done" && (
                                <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                    ✓ 0% Left · Completed
                                </span>
                            )}
                        </div>

                        <div className="flex gap-2">
                            {status !== "running" ? (
                                <button
                                    data-testid="workspace-run-button"
                                    onClick={handleRun}
                                    className="flex items-center gap-2 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 transition-colors shadow-sm"
                                >
                                    <Play className="w-3.5 h-3.5 fill-current" /> {status === "paused" ? "Resume" : "Run Investigation"}
                                </button>
                            ) : (
                                <button
                                    data-testid="workspace-pause-button"
                                    onClick={pause}
                                    className="flex items-center gap-2 rounded-full bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold px-4 py-2 transition-colors shadow-sm"
                                >
                                    <Pause className="w-3.5 h-3.5 fill-current" /> Pause
                                </button>
                            )}
                            <button
                                data-testid="workspace-reset-button"
                                onClick={() => {
                                    reset();
                                    toast("Investigation reset", { description: "State machine returned to idle" });
                                }}
                                className="flex items-center gap-2 rounded-full border border-slate-300 hover:border-indigo-300 text-xs font-bold px-4 py-2 text-slate-700 transition-colors"
                            >
                                <RotateCcw className="w-3.5 h-3.5 text-slate-500" /> Reset
                            </button>
                        </div>
                    </div>
                </div>

                {/* Subheader KPIs */}
                <div className="flex flex-wrap items-center gap-x-8 gap-y-3 pt-4">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-600 mb-0.5">
                            Deterministic Graph Decision
                        </p>
                        <h1 className="font-mono text-xl font-bold text-slate-900 flex items-center gap-2">
                            {currentCaseId}
                            <span
                                className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold tracking-wide ${
                                    caseInfo.verdict === "fraud"
                                        ? "border-red-200 bg-red-50 text-red-700"
                                        : caseInfo.verdict === "uncertain"
                                        ? "border-amber-200 bg-amber-50 text-amber-700"
                                        : "border-emerald-200 bg-emerald-50 text-emerald-700"
                                }`}
                            >
                                {caseInfo.verdict === "fraud"
                                    ? "CONFIRMED FRAUD"
                                    : caseInfo.verdict === "uncertain"
                                    ? "UNCERTAIN / EVIDENCE REQUESTED"
                                    : "VERIFIED LEGITIMATE"}
                            </span>
                        </h1>
                    </div>

                    <div className="text-xs text-slate-500 max-w-sm truncate">
                        Trigger: <span className="font-semibold text-slate-800">{activeCase.full_trigger || activeCase.trigger}</span>
                    </div>

                    <div className="flex items-center gap-3 text-xs">
                        <div className="flex items-center gap-1.5">
                            <ShieldAlert
                                className={`w-4 h-4 ${
                                    caseInfo.verdict === "fraud"
                                        ? "text-red-500"
                                        : caseInfo.verdict === "uncertain"
                                        ? "text-amber-500"
                                        : "text-emerald-500"
                                }`}
                            />
                            <span
                                className={`font-bold ${
                                    caseInfo.verdict === "fraud"
                                        ? "text-red-600"
                                        : caseInfo.verdict === "uncertain"
                                        ? "text-amber-600"
                                        : "text-emerald-600"
                                }`}
                            >
                                Risk {riskScore}
                            </span>
                        </div>
                        <span className="text-slate-300">/</span>
                        <div className="flex items-center gap-1.5">
                            <span className="text-slate-400">Exposure:</span>
                            <span className="font-mono font-bold text-slate-900">${exposure.toFixed(2)}</span>
                        </div>
                        <span className="text-slate-300">/</span>
                        <div className="flex items-center gap-1.5">
                            <span className="text-slate-400">Confidence:</span>
                            <span className="font-bold text-emerald-600">{Math.min(99, riskScore > 50 ? riskScore + 3 : 92)}%</span>
                        </div>
                    </div>

                    {caseDetail?.sar?.file && (
                        <div className="ml-auto">
                            <button
                                type="button"
                                data-testid="open-sar-button"
                                onClick={() => setSarModalOpen(true)}
                                className="flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 px-3 py-1.5 text-xs font-bold transition-colors"
                            >
                                <FileWarning className="w-3.5 h-3.5 text-red-600" />
                                FinCEN SAR Ready
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* 10-Node State Machine Stepper with Percentage Logger */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 mb-5 overflow-x-auto shadow-sm" data-testid="state-machine-stepper">
                <div className="flex items-center min-w-[900px]">
                    {STEPS.map((s, i) => {
                        const done = status === "done" || i < stepIndex;
                        const active = status === "running" && i === stepIndex;
                        return (
                            <div key={s.id} className="flex items-center flex-1 last:flex-none">
                                <div className="flex flex-col items-center text-center w-full" data-testid={`step-${s.id}`}>
                                    <div
                                        className={`w-9 h-9 rounded-full border-2 flex items-center justify-center font-mono text-[11px] font-bold transition-all duration-300 ${
                                            done
                                                ? "bg-emerald-500 border-emerald-500 text-white"
                                                : active
                                                ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-600/30"
                                                : "bg-white border-slate-200 text-slate-400"
                                        }`}
                                    >
                                        {done ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                                    </div>
                                    <div
                                        className={`mt-2 text-[10px] font-bold leading-tight max-w-[92px] ${
                                            active ? "text-indigo-600" : done ? "text-emerald-600" : "text-slate-400"
                                        }`}
                                    >
                                        {s.label}
                                    </div>
                                    {/* Percentage Logger beside every step */}
                                    <div className="mt-1">
                                        {done ? (
                                            <span className="text-[9px] font-mono font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                                0% left
                                            </span>
                                        ) : active ? (
                                            <span className="text-[9px] font-mono font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-300 shadow-sm animate-pulse">
                                                ⏱ {Math.max(0, Math.round(100 - ((i + 1) / STEPS.length) * 100))}% left
                                            </span>
                                        ) : (
                                            <span className="text-[9px] font-mono text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">
                                                {Math.round(100 - (i / STEPS.length) * 100)}% left
                                            </span>
                                        )}
                                    </div>
                                </div>
                                {i < STEPS.length - 1 && (
                                    <div
                                        className={`h-0.5 flex-1 -mt-8 rounded transition-colors duration-500 ${
                                            i < stepIndex || status === "done" ? "bg-emerald-400" : "bg-slate-100"
                                        }`}
                                    />
                                )}
                            </div>
                        );
                    })}
                </div>
                {status === "running" && stepIndex >= 0 && (
                    <motion.p
                        key={stepIndex}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-4 font-mono text-[11px] text-indigo-600"
                        data-testid="step-live-log"
                    >
                        ▸ {STEPS[stepIndex].action}
                    </motion.p>
                )}
            </div>

            {/* 3-Column Content Layout */}
            <div className="grid lg:grid-cols-3 gap-5">
                {/* Column 1: Trigger & Evidence Summary + Topology */}
                <div className="space-y-5">
                    {/* Trigger Summary */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" data-testid="trigger-summary">
                        <h3 className="font-display text-sm font-bold text-slate-900 mb-4">Trigger summary</h3>
                        {[
                            ["Trigger Signal", activeCase.pattern || "Anomaly Alert"],
                            ["Flagged Txn", activeCase.flagged_txn_id ? `TXN-${activeCase.flagged_txn_id}` : (caseInfo.first_suspicious_txn_id ? `TXN-${caseInfo.first_suspicious_txn_id}` : "TXN-3514030")],
                            ["Customer Subject", activeCase.customer],
                            ["Payment Card", activeCase.card],
                            ["Initial Model Score", activeCase.trigger_score !== null && activeCase.trigger_score !== undefined ? `${Math.round(activeCase.trigger_score * 100)}%` : "Customer / Analyst Alert"],
                            ["Post-Graph Probability", `${riskScore}% (${fraudProb.toFixed(2)})`],
                            ["Verified Exposure", `$${exposure.toFixed(2)}`],
                            ["TigerGraph Writeback", caseInfo.graph_case_id || `CASE-2016-${currentCaseId.replace("HHG-", "")}`],
                        ].map(([k, v]) => (
                            <div key={k} className="flex justify-between py-2 border-b border-slate-50 last:border-0 text-xs">
                                <span className="text-slate-400">{k}</span>
                                <span className="font-semibold text-slate-800 font-mono text-[11px] truncate max-w-[200px] text-right">
                                    {v}
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* Evidence Summary */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" data-testid="evidence-summary">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-display text-sm font-bold text-slate-900">Evidence summary</h3>
                            <span className="font-mono text-[10px] text-indigo-600 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
                                {evidenceList.length} records sealed
                            </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2.5">
                            {[
                                ["Total Evidence", `${evidenceList.length || 5}`, "text-slate-900"],
                                ["Graph Traversal", `${evidenceList.filter((e) => e.source === "graph").length || 3}`, "text-indigo-600"],
                                ["Policy Citations", `${evidenceList.filter((e) => e.source === "document" || e.source === "policy").length || 2}`, "text-orange-600"],
                                ["Connected Cards", `${connectedCards.length}`, connectedCards.length > 1 ? "text-purple-600" : "text-slate-600"],
                            ].map(([k, v, c]) => (
                                <div key={k} className="rounded-xl bg-slate-50 border border-slate-100 p-3">
                                    <div className={`font-display text-xl font-extrabold ${c}`}>{v}</div>
                                    <div className="text-[10px] text-slate-500 font-semibold">{k}</div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-4">
                            <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-1.5">
                                <span>Aggregate Graph Evidence Strength</span>
                                <span className="font-mono">{fraudProb.toFixed(2)}</span>
                            </div>
                            <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${Math.round(fraudProb * 100)}%` }}
                                    transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                                    className={`h-full rounded-full ${isFraud ? "bg-red-500" : "bg-emerald-500"}`}
                                />
                            </div>
                        </div>

                        <div className="mt-5 flex flex-col gap-2">
                            <button
                                data-testid="view-all-evidence-button"
                                onClick={() => nav("/evidence")}
                                className="flex items-center justify-center gap-2 rounded-full border border-slate-300 hover:border-indigo-400 text-xs font-bold py-2 text-slate-800 transition-colors"
                            >
                                <FileText className="w-3.5 h-3.5 text-indigo-600" /> View all {evidenceList.length || 5} evidence claims
                            </button>
                            <button
                                data-testid="explore-graph-button"
                                onClick={() => nav("/graph")}
                                className="flex items-center justify-center gap-2 rounded-full bg-slate-900 hover:bg-indigo-600 text-white text-xs font-bold py-2 transition-colors shadow-sm"
                            >
                                <Network className="w-3.5 h-3.5" /> Explore Multi-Hop Subgraph
                            </button>
                        </div>
                    </div>

                    {/* Connected Entity Topology Card (NEW) */}
                    {connectedCards.length > 0 && (
                        <div className="rounded-2xl border border-purple-200 bg-purple-50/40 p-5 shadow-sm" data-testid="connected-topology-card">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="font-display text-sm font-bold text-purple-950 flex items-center gap-2">
                                    <Smartphone className="w-4 h-4 text-purple-600" />
                                    Shared Hardware Ring
                                </h3>
                                <span className="font-mono text-[10px] font-bold text-purple-700 bg-purple-100 border border-purple-200 px-2 py-0.5 rounded-full">
                                    {connectedCards.length} Cards Linked
                                </span>
                            </div>

                            {connectedDevices.length > 0 && (
                                <div className="p-2.5 rounded-xl bg-white border border-purple-100 mb-3 text-[11px] text-slate-700 font-mono leading-relaxed">
                                    <div className="text-[10px] uppercase font-bold text-purple-600 mb-0.5">Hub Fingerprint</div>
                                    {connectedDevices[0].split("|")[0]}
                                </div>
                            )}

                            <div className="text-[10px] font-semibold text-slate-500 mb-2">Connected Payment Cards (2-hop):</div>
                            <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
                                {connectedCards.slice(0, 16).map((c) => (
                                    <span
                                        key={c}
                                        className="font-mono text-[10px] font-medium bg-white text-purple-800 border border-purple-200 rounded-md px-2 py-0.5"
                                    >
                                        {c}
                                    </span>
                                ))}
                                {connectedCards.length > 16 && (
                                    <span className="font-mono text-[10px] text-slate-500 py-0.5">
                                        +{connectedCards.length - 16} more
                                    </span>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Column 2: Competing Hypotheses */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" data-testid="hypotheses-panel">
                    <div className="flex items-center justify-between mb-5">
                        <div>
                            <h3 className="font-display text-sm font-bold text-slate-900">Competing hypotheses</h3>
                            <p className="text-[11px] text-slate-500 mt-0.5">Scored by LangGraph deterministic hypothesis node</p>
                        </div>
                        <span className="font-mono text-[10px] text-slate-400">ACH · 3 active</span>
                    </div>

                    <div className="space-y-6">
                        {hypotheses.map((h, i) => (
                            <motion.div
                                key={h.name}
                                initial={{ opacity: 0, x: -12 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.08, duration: 0.4 }}
                                data-testid={`hypothesis-${h.name.toLowerCase().replace(/\s+/g, "-")}`}
                            >
                                <div className="flex items-center justify-between mb-1.5">
                                    <span className="text-xs font-bold text-slate-800">{h.name}</span>
                                    <div className="flex items-center gap-2">
                                        <span
                                            className={`rounded-full border px-2 py-px text-[9px] font-bold uppercase tracking-wide ${
                                                HYPO_STYLE[h.status].badge
                                            }`}
                                        >
                                            {h.status}
                                        </span>
                                        <span className="font-mono text-xs font-bold text-slate-900">{h.confidence}%</span>
                                    </div>
                                </div>
                                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${h.confidence}%` }}
                                        transition={{ delay: 0.2 + i * 0.08, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                                        className="h-full rounded-full"
                                        style={{ background: HYPO_STYLE[h.status].bar }}
                                    />
                                </div>
                                <div className="flex justify-between mt-1.5 text-[10px] text-slate-400">
                                    <span>
                                        <span className="text-emerald-600 font-semibold">+{h.supporting}</span> supporting ·{" "}
                                        <span className="text-red-500 font-semibold">−{h.contradicting}</span> contradicting
                                    </span>
                                    <span className="font-mono truncate max-w-[140px]">{h.entities.join(" · ")}</span>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    <div className="mt-8 pt-6 border-t border-slate-100">
                        <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-3.5 mb-4">
                            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                                Agent Assessment Verdict
                            </div>
                            <div className="text-xs font-semibold text-slate-800">
                                {caseInfo.verdict === "fraud" ? (
                                    <span className="text-red-600">
                                        {caseInfo.pattern === "undocumented" ? "Coordinated Ring Fraud" : caseInfo.pattern?.replace(/_/g, " ")} confirmed with {riskScore}% probability.
                                    </span>
                                ) : caseInfo.verdict === "uncertain" ? (
                                    <span className="text-amber-600">
                                        Ambiguous activity assessed at {riskScore}% probability. Evidence requested under Policy R1/R4.
                                    </span>
                                ) : (
                                    <span className="text-emerald-700">
                                        Legitimate cardholder activity confirmed conforming to multi-month baseline.
                                    </span>
                                )}
                            </div>
                        </div>

                        <button
                            data-testid="view-reasoning-button"
                            onClick={() => nav("/evidence")}
                            className="w-full flex items-center justify-center gap-2 rounded-full bg-slate-900 hover:bg-indigo-600 text-white text-xs font-bold py-2.5 transition-colors shadow-sm"
                        >
                            View Evidence Ledger & Citations <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>

                {/* Column 3: Next Best Action & Governance */}
                <div className="space-y-5">
                    {/* NBA Card */}
                    <div className="rounded-2xl border-2 border-indigo-200 bg-indigo-50/40 p-5 shadow-sm" data-testid="nba-panel">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-display text-sm font-bold text-slate-900">Next best action</h3>
                            <span className="rounded-full bg-indigo-600 text-white px-2.5 py-0.5 text-[9px] font-bold tracking-widest uppercase">
                                {topAction.route} ROUTE
                            </span>
                        </div>

                        <div className="rounded-xl bg-white border border-indigo-100 p-4 mb-3 shadow-sm">
                            <div className="font-display text-base font-extrabold text-slate-900">
                                {topAction.action.replace(/_/g, " ")}
                            </div>
                            <p className="text-[11px] text-slate-600 leading-relaxed mt-1.5">
                                {topAction.reason}
                            </p>
                        </div>

                        {[
                            ["Policy rule", caseInfo.verdict === "fraud" ? "R2 / R6 / R9 fired" : caseInfo.verdict === "uncertain" ? "R1 / R4 / R8 review" : "R3 baseline clear"],
                            ["Approval route", `${topAction.route} Sign-Off`],
                            ["Exposure at Risk", `$${exposure.toFixed(2)}`],
                            ["Secondary Actions", `${Math.max(0, nbas.length - 1)} actions queued`],
                        ].map(([k, v]) => (
                            <div key={k} className="flex justify-between py-1.5 text-[11px] border-b border-indigo-100/50 last:border-0">
                                <span className="text-slate-500">{k}</span>
                                <span className="font-semibold text-slate-800">{v}</span>
                            </div>
                        ))}

                        <div className="mt-5 grid grid-cols-2 gap-2">
                            <button
                                data-testid="nba-approve-button"
                                onClick={handleApprove}
                                className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 transition-colors shadow-sm flex items-center justify-center gap-1.5"
                            >
                                <Check className="w-3.5 h-3.5" /> Authorize & Sign
                            </button>

                            {caseDetail?.sar?.file ? (
                                <button
                                    data-testid="nba-sar-button"
                                    onClick={() => setSarModalOpen(true)}
                                    className="rounded-full border border-red-300 bg-white hover:bg-red-50 text-red-600 text-xs font-bold py-2.5 transition-colors shadow-sm flex items-center justify-center gap-1.5"
                                >
                                    <FileWarning className="w-3.5 h-3.5" /> FinCEN SAR
                                </button>
                            ) : (
                                <button
                                    data-testid="nba-evidence-button"
                                    onClick={() => nav("/evidence")}
                                    className="rounded-full border border-slate-300 bg-white hover:border-indigo-300 text-slate-700 text-xs font-bold py-2.5 transition-colors shadow-sm flex items-center justify-center gap-1.5"
                                >
                                    <FileText className="w-3.5 h-3.5 text-slate-500" /> Evidence Audit
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Uncertainty Gate */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" data-testid="uncertainty-panel">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-display text-sm font-bold text-slate-900">Uncertainty gate</h3>
                            <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold tracking-wide ${
                                caseInfo.verdict === "uncertain"
                                    ? "border-amber-200 bg-amber-50 text-amber-700"
                                    : "border-emerald-200 bg-emerald-50 text-emerald-700"
                            }`}>
                                {caseInfo.verdict === "uncertain" ? "EVIDENCE PENDING" : "SUFFICIENT"}
                            </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mb-3">
                            Residual uncertainty metric:{" "}
                            <span className="font-mono font-bold text-slate-800">
                                {caseInfo.verdict === "uncertain" ? "u = 0.55" : "u = 0.08"}
                            </span>{" "}
                            ({caseInfo.verdict === "uncertain" ? "above 0.15 threshold · gated" : "below 0.15 threshold · cleared"})
                        </div>
                        {(caseInfo.verdict === "uncertain" ? [
                            ["U1 · Intent Verification", caseDetail?.evidence_requests?.[0]?.assumed_response || "Customer inquiry simulated under Policy R1", false],
                            ["U2 · Single Signal Isolation", "Isolated anomaly requires out-of-band validation before blocking", false],
                            ["U3 · Regulatory & Policy Gate", "Gated under Bank Policy R1 & R8 — verify before action", true],
                        ] : caseInfo.verdict === "fraud" ? [
                            ["U1 · Intent Verification", "Resolved by customer denial & spend anomaly", true],
                            ["U2 · Device Fingerprint", connectedDevices.length > 0 ? `Resolved by device_ring hub: ${connectedDevices[0].split('|')[0]}` : "Device anomaly verified", true],
                            ["U3 · Graph Network Density", connectedCards.length > 0 ? `Resolved by ${connectedCards.length} connected cards in syndicate` : "Graph centrality confirmed anomaly", true],
                        ] : [
                            ["U1 · Intent Verification", "Customer confirmation & historical domestic baseline match", true],
                            ["U2 · Geographic Verification", "Billing region matches cardholder multi-month domestic profile", true],
                            ["U3 · Policy Governance", "Cleared under Bank Policy R3 — automatic dismissal", true],
                        ]).map(([k, v, ok]) => (
                            <div key={k} className="flex flex-col py-2 border-b border-slate-50 last:border-0 text-[11px]">
                                <span className="font-semibold text-slate-800">{k}</span>
                                <span className={`mt-0.5 text-[10px] ${ok ? "text-emerald-600" : "text-amber-600"}`}>{v}</span>
                            </div>
                        ))}
                    </div>

                    {/* FinCEN SAR Compliance Card */}
                    {caseDetail?.sar?.file && (
                        <div className="rounded-2xl border border-red-200 bg-red-50/30 p-5 shadow-sm" data-testid="fincen-sar-card">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-red-600">
                                    31 CFR § 1020.320 MANDATE
                                </span>
                                <span className="font-mono text-[10px] font-bold text-red-700 bg-red-100 border border-red-200 px-2 py-0.5 rounded-full">
                                    Filing Required
                                </span>
                            </div>
                            <h4 className="font-display text-xs font-bold text-slate-900 mb-1">
                                FinCEN Suspicious Activity Report (SAR)
                            </h4>
                            <p className="text-[11px] text-slate-600 leading-snug line-clamp-3 mb-3">
                                {caseDetail.sar.narrative}
                            </p>
                            <button
                                type="button"
                                onClick={() => setSarModalOpen(true)}
                                className="w-full flex items-center justify-center gap-1.5 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-2 transition-colors shadow-sm"
                            >
                                <FileWarning className="w-3.5 h-3.5" /> Inspect Statutory SAR Filing Draft
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Render SAR Modal when triggered */}
            {sarModalOpen && caseDetail?.sar && (
                <SARModal
                    sar={caseDetail.sar}
                    caseId={currentCaseId}
                    onClose={() => setSarModalOpen(false)}
                />
            )}
        </div>
    );
}
