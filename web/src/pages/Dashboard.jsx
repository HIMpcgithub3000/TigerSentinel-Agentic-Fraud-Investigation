import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
    Briefcase, Flame, Hourglass, Stamp, CheckCircle2, Network, Plus, Search, RefreshCw, ArrowUpRight,
} from "lucide-react";
import { toast } from "sonner";
import { KPIS, CASES } from "@/data/mockData";
import { useInvestigation } from "@/context/InvestigationContext";

const ICONS = {
    briefcase: Briefcase,
    flame: Flame,
    hourglass: Hourglass,
    stamp: Stamp,
    check: CheckCircle2,
    network: Network,
};

const KPI_STYLES = {
    indigo: {
        iconBg: "bg-blue-50 text-blue-600 border border-blue-100",
    },
    red: {
        iconBg: "bg-red-50 text-red-500 border border-red-100",
    },
    amber: {
        iconBg: "bg-amber-50 text-amber-500 border border-amber-100",
    },
    orange: {
        iconBg: "bg-orange-50 text-orange-500 border border-orange-100",
    },
    emerald: {
        iconBg: "bg-emerald-50 text-emerald-500 border border-emerald-100",
    },
    violet: {
        iconBg: "bg-purple-50 text-purple-500 border border-purple-100",
    },
};

const getRiskCircleStyle = (score) => {
    if (score >= 90) return "bg-red-50 text-red-500 border-red-200/80";
    if (score >= 70) return "bg-orange-50 text-orange-500 border-orange-200/80";
    if (score >= 40) return "bg-amber-50 text-amber-500 border-amber-200/80";
    return "bg-emerald-50 text-emerald-500 border-emerald-200/80";
};

const STATUS_BADGE = {
    INVESTIGATING: "bg-[#EEF2FF] text-[#4F46E5] border-indigo-200/80",
    AWAITING_APPROVAL: "bg-[#FFF7ED] text-[#EA580C] border-orange-200/80",
    AWAITING_EVIDENCE: "bg-[#FFFBEB] text-[#D97706] border-amber-200/80",
    MONITORING: "bg-[#F0F9FF] text-[#0284C7] border-sky-200/80",
    RESOLVED_FRAUD: "bg-[#FEF2F2] text-[#DC2626] border-red-200/80",
    RESOLVED_LEGITIMATE: "bg-[#ECFDF5] text-[#059669] border-emerald-200/80",
};

const RISK_FILTER_STYLES = {
    CRITICAL: "border-red-200 bg-red-50 text-red-600",
    HIGH: "border-orange-200 bg-orange-50 text-orange-600",
    MEDIUM: "border-amber-200 bg-amber-50 text-amber-600",
    LOW: "border-emerald-200 bg-emerald-50 text-emerald-600",
};

const LOG_KIND = {
    gsql: "text-indigo-600",
    ok: "text-emerald-600",
    sys: "text-slate-500",
    agent: "text-blue-600",
    policy: "text-orange-600",
};

export default function Dashboard() {
    const nav = useNavigate();
    const { log, allCases, kpis, selectCase, fetchCases } = useInvestigation();
    const [q, setQ] = useState("");
    const [riskFilter, setRiskFilter] = useState(null);

    const allCasesList = allCases && allCases.length > 0 ? allCases : CASES;
    const kpisList = kpis && kpis.length > 0 ? kpis : KPIS;

    const cases = useMemo(
        () =>
            allCasesList.filter((c) => {
                const matchesRisk =
                    !riskFilter ||
                    (riskFilter === "CRITICAL" && c.riskBand === "critical") ||
                    (riskFilter === "HIGH" && c.riskBand === "high") ||
                    (riskFilter === "MEDIUM" && c.riskBand === "medium") ||
                    (riskFilter === "LOW" && c.riskBand === "low");

                const matchesQuery =
                    !q.trim() ||
                    c.id.toLowerCase().includes(q.toLowerCase()) ||
                    c.customer.toLowerCase().includes(q.toLowerCase()) ||
                    c.pattern.toLowerCase().includes(q.toLowerCase()) ||
                    c.nba.toLowerCase().includes(q.toLowerCase());

                return matchesRisk && matchesQuery;
            }),
        [q, riskFilter, allCasesList]
    );

    return (
        <div className="max-w-[1500px] mx-auto px-4 sm:px-6 py-8" data-testid="dashboard-screen">
            {/* Header */}
            <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
                <div>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600 mb-2">
                        INVESTIGATION COMMAND
                    </p>
                    <h1 className="font-display text-3xl sm:text-4xl font-black tracking-tight text-slate-900">
                        Active investigations
                    </h1>
                    <p className="text-sm text-slate-500 mt-1.5">
                        Tuesday, July 14 · triage queue · analyst A. Reyes
                    </p>
                </div>
                <div className="flex items-center gap-2.5">
                    <button
                        data-testid="refresh-dashboard-button"
                        onClick={() => {
                            fetchCases();
                            toast.success("Queue refreshed", { description: `${allCasesList.length} cases synchronized · TigerGraph latency 12ms` });
                        }}
                        className="flex items-center gap-2 rounded-full border border-slate-300 bg-white hover:border-indigo-300 text-xs font-bold text-slate-700 px-4 py-2.5 transition-colors"
                    >
                        <RefreshCw className="w-3.5 h-3.5 text-slate-600" /> Refresh
                    </button>
                    <button
                        data-testid="start-investigation-button"
                        onClick={() => {
                            selectCase("HHG-014");
                            nav("/workspace");
                        }}
                        className="flex items-center gap-2 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-5 py-2.5 transition-colors shadow-sm shadow-indigo-600/30"
                    >
                        <Plus className="w-4 h-4" /> Start Investigation
                    </button>
                </div>
            </div>

            {/* KPI bento - 6 cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 mb-6">
                {kpisList.map((k, i) => {
                    const Icon = ICONS[k.icon] || Briefcase;
                    const style = KPI_STYLES[k.tone] || KPI_STYLES.indigo;
                    return (
                        <motion.div
                            key={k.label}
                            initial={{ opacity: 0, y: 14 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.04, duration: 0.4 }}
                            data-testid={`kpi-${k.label.toLowerCase().replace(/\s+/g, "-")}`}
                            className="rounded-2xl border border-slate-200 bg-white p-5 hover:shadow-md hover:shadow-slate-100 transition-shadow"
                        >
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-3 ${style.iconBg}`}>
                                <Icon className="w-4 h-4" />
                            </div>
                            <div className="font-display text-2xl font-extrabold tracking-tight text-slate-900">
                                {k.value}
                            </div>
                            <div className="text-[11px] font-semibold text-slate-800 mt-1">
                                {k.label}
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                                {k.delta}
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* Main content grid */}
            <div className="grid lg:grid-cols-[1fr_340px] gap-4 items-start">
                {/* Case table card */}
                <motion.div
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.45 }}
                    className="rounded-2xl border border-slate-200 bg-white overflow-hidden"
                >
                    {/* Toolbar */}
                    <div className="px-5 py-4 border-b border-slate-100 flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50/70 px-3.5 py-1.5 w-60">
                            <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <input
                                data-testid="case-table-search"
                                value={q}
                                onChange={(e) => setQ(e.target.value)}
                                placeholder="Filter cases..."
                                className="bg-transparent text-xs text-slate-700 outline-none w-full placeholder:text-slate-400"
                            />
                        </div>
                        <div className="flex gap-1.5">
                            {["CRITICAL", "HIGH", "MEDIUM", "LOW"].map((r) => (
                                <button
                                    key={r}
                                    data-testid={`filter-risk-${r.toLowerCase()}`}
                                    onClick={() => setRiskFilter(riskFilter === r ? null : r)}
                                    className={`rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                                        riskFilter === r
                                            ? RISK_FILTER_STYLES[r]
                                            : "border-slate-200 text-slate-400 hover:text-slate-600 hover:border-slate-300"
                                    }`}
                                >
                                    {r}
                                </button>
                            ))}
                        </div>
                        <span className="ml-auto font-mono text-[10px] text-slate-400">
                            {cases.length} of {allCasesList.length} cases
                        </span>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-slate-100 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                    <th className="px-6 py-4">CASE</th>
                                    <th className="px-4 py-4">CUSTOMER / CARD</th>
                                    <th className="px-4 py-4 text-center">RISK</th>
                                    <th className="px-4 py-4">PATTERN</th>
                                    <th className="px-4 py-4 text-center">STATUS</th>
                                    <th className="px-4 py-4">NEXT BEST ACTION</th>
                                    <th className="px-6 py-4 text-right">OPEN</th>
                                </tr>
                            </thead>
                            <tbody>
                                {cases.map((c) => (
                                    <tr
                                        key={c.id}
                                        data-testid={`case-table-row-${c.id}`}
                                        onClick={() => {
                                            selectCase(c.id);
                                            nav(`/workspace?case=${c.id}`);
                                        }}
                                        className="border-b border-slate-50 hover:bg-indigo-50/30 cursor-pointer transition-colors group"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-xs text-slate-900">{c.id}</div>
                                            <div className="text-[11px] text-slate-400 mt-0.5">{c.trigger}</div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="font-bold text-xs text-slate-800">{c.customer}</div>
                                            <div className="font-mono text-[10px] text-slate-400 mt-0.5">{c.card}</div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex justify-center">
                                                <div
                                                    className={`w-7 h-7 rounded-full border flex items-center justify-center font-bold text-[11px] ${getRiskCircleStyle(
                                                        c.risk
                                                    )}`}
                                                >
                                                    {c.risk}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-xs text-slate-700 font-medium">
                                            {c.pattern}
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <span
                                                className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[9px] font-bold tracking-wider uppercase ${
                                                    STATUS_BADGE[c.status] || STATUS_BADGE.INVESTIGATING
                                                }`}
                                            >
                                                {c.status.replace(/_/g, " ")}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 text-xs text-slate-600">
                                            {c.nba}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <ArrowUpRight className="w-3.5 h-3.5" />
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </motion.div>

                {/* Right rail */}
                <div className="space-y-4">
                    {/* Live agent activity card */}
                    <motion.div
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.28, duration: 0.45 }}
                        className="rounded-2xl border border-slate-200 bg-white p-5"
                        data-testid="agent-activity-feed"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-display text-sm font-bold text-slate-900">
                                Live agent activity
                            </h3>
                            <span className="flex items-center gap-1.5 text-[10px] font-semibold text-emerald-600">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> streaming
                            </span>
                        </div>
                        <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1">
                            {log && log.length > 0 ? (
                                log.slice(0, 9).map((l) => (
                                    <div key={l.id} className="flex gap-2.5 text-[11px] leading-snug">
                                        <span className="font-mono text-slate-300 shrink-0 pt-px">{l.ts}</span>
                                        <span className={LOG_KIND[l.kind] || "text-slate-600"}>{l.msg}</span>
                                    </div>
                                ))
                            ) : (
                                <>
                                    <div className="flex gap-2.5 text-[11px] leading-snug">
                                        <span className="font-mono text-slate-300 shrink-0 pt-px">14:02:11</span>
                                        <span className="text-indigo-600 font-medium">device_ring.gsql completed · 56 cards @ depth 3</span>
                                    </div>
                                    <div className="flex gap-2.5 text-[11px] leading-snug">
                                        <span className="font-mono text-slate-300 shrink-0 pt-px">14:02:04</span>
                                        <span className="text-emerald-600 font-medium">Customer denial recorded · uncertainty U1 resolved</span>
                                    </div>
                                    <div className="flex gap-2.5 text-[11px] leading-snug">
                                        <span className="font-mono text-slate-300 shrink-0 pt-px">14:01:58</span>
                                        <span className="text-blue-600 font-medium">customer_baseline.gsql · deviation 6.1x</span>
                                    </div>
                                    <div className="flex gap-2.5 text-[11px] leading-snug">
                                        <span className="font-mono text-slate-300 shrink-0 pt-px">14:01:36</span>
                                        <span className="text-slate-500 font-medium">Case CASE-8941 opened from risk signal 0.94</span>
                                    </div>
                                </>
                            )}
                        </div>
                    </motion.div>

                    {/* TigerGraph topology card */}
                    <motion.div
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.36, duration: 0.45 }}
                        className="rounded-2xl border border-slate-200 bg-white p-5"
                        data-testid="topology-summary"
                    >
                        <h3 className="font-display text-sm font-bold text-slate-900 mb-4">
                            TigerGraph topology
                        </h3>
                        {[
                            ["Customers", "1.2M", 64, "#2563EB"],
                            ["Cards", "1.8M", 88, "#7C3AED"],
                            ["Transactions", "940K", 52, "#4F46E5"],
                            ["Devices", "610K", 34, "#EA580C"],
                            ["Merchants", "88K", 14, "#059669"],
                        ].map(([label, n, w, color]) => (
                            <div key={label} className="mb-3">
                                <div className="flex justify-between text-[11px] mb-1.5">
                                    <span className="font-medium text-slate-700">{label}</span>
                                    <span className="font-mono text-slate-400">{n}</span>
                                </div>
                                <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${w}%` }}
                                        transition={{ delay: 0.5, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                                        className="h-full rounded-full"
                                        style={{ background: color }}
                                    />
                                </div>
                            </div>
                        ))}
                        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                            <span className="font-mono text-[10px] text-slate-400">
                                4.2M vertices · 9.7M edges
                            </span>
                            <span className="font-mono text-[10px] text-emerald-600 font-semibold">
                                12ms p50
                            </span>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
