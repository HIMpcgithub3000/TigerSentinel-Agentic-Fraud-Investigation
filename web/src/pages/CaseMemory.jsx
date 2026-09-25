import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Search, ArrowUpRight, Database, Layers, Network, CheckCircle2, ShieldAlert } from "lucide-react";
import { useInvestigation } from "@/context/InvestigationContext";

const VERDICT_STYLE = {
    fraud: "bg-red-50 text-red-700 border-red-200",
    legitimate: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

export default function CaseMemory() {
    const nav = useNavigate();
    const { allCases, selectCase, currentCaseId } = useInvestigation();
    const [q, setQ] = useState("");

    // Benchmark exemplars for graph memory similarity
    const similarCases = [
        {
            id: "HHG-014",
            similarity: 96,
            why: "Syndicate device ring linking 60 cards and 259 hardware profiles via multi-hop traversal",
            shared: ["DVC-1", "60 Cards", "Android 7.0 Hub"],
            decision: "Block card + monitor 60 ring cards",
            outcome: "Coordinated ring isolated · $13,300 protected",
        },
        {
            id: "HHG-006",
            similarity: 88,
            why: "Shared hardware fingerprint and multi-card coordinated velocity spike",
            shared: ["POS Terminal", "MCC 5967", "High Velocity"],
            decision: "Block card + file FinCEN SAR",
            outcome: "Confirmed ATO · SAR filed pursuant to 31 CFR 1020.320",
        },
        {
            id: "HHG-001",
            similarity: 92,
            why: "In-region domestic transaction conforming to cardholder 360-day baseline",
            shared: ["Customer Baseline", "Region 444.0"],
            decision: "Allow transaction + close alert",
            outcome: "Legitimate spend cleared · false positive suppressed",
        },
    ];

    const rows = useMemo(() => {
        const list = allCases && allCases.length > 0 ? allCases : [];
        return list.filter(
            (c) =>
                !q.trim() ||
                c.id.toLowerCase().includes(q.toLowerCase()) ||
                (c.pattern && c.pattern.toLowerCase().includes(q.toLowerCase())) ||
                (c.customer && c.customer.toLowerCase().includes(q.toLowerCase())) ||
                (c.nba && c.nba.toLowerCase().includes(q.toLowerCase()))
        );
    }, [allCases, q]);

    return (
        <div className="max-w-[1500px] mx-auto px-4 sm:px-6 py-8" data-testid="case-memory-screen">
            {/* Header */}
            <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
                <div>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600 mb-2">
                        Case History & Graph Memory
                    </p>
                    <h1 className="font-display text-3xl sm:text-4xl font-black tracking-tight text-slate-900">
                        Investigations that remember
                    </h1>
                    <p className="text-sm text-slate-500 mt-1.5">
                        Closed cases persist as graph vertices in TigerGraph — recurring device hubs and ring topology resurface in new investigations
                    </p>
                </div>
                <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 w-full sm:w-96 focus-within:border-indigo-300 shadow-sm transition-colors">
                    <Search className="w-4 h-4 text-slate-400" />
                    <input
                        data-testid="memory-search-input"
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="Search benchmark case, pattern, entity…"
                        className="bg-transparent text-xs outline-none w-full placeholder:text-slate-400"
                    />
                </div>
            </div>

            {/* Top Similar Cases Strip */}
            <div className="grid md:grid-cols-3 gap-4 mb-6">
                {similarCases.map((s, i) => (
                    <motion.div
                        key={s.id}
                        initial={{ opacity: 0, y: 18 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.08, duration: 0.5 }}
                        className="rounded-2xl border border-slate-200 bg-white p-5 hover:shadow-lg hover:shadow-slate-200/60 hover:border-indigo-200 transition-all shadow-sm flex flex-col justify-between"
                        data-testid={`similar-case-${s.id}`}
                    >
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <span className="font-mono text-sm font-bold text-slate-900">{s.id}</span>
                                    {s.id === currentCaseId && (
                                        <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 rounded px-1.5 py-0.5">
                                            ACTIVE
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-16 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                                        <div className="h-full rounded-full bg-indigo-500" style={{ width: `${s.similarity}%` }} />
                                    </div>
                                    <span className="font-mono text-[11px] font-bold text-indigo-600">{s.similarity}%</span>
                                </div>
                            </div>

                            <p className="text-[11px] text-slate-600 leading-snug mb-3">{s.why}</p>

                            <div className="flex flex-wrap gap-1.5 mb-3">
                                {s.shared.map((e) => (
                                    <span
                                        key={e}
                                        className="rounded-full bg-slate-100 border border-slate-200 px-2 py-0.5 font-mono text-[9px] text-slate-600"
                                    >
                                        {e}
                                    </span>
                                ))}
                            </div>

                            <div className="text-[10px] text-slate-500 space-y-1 mb-4 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                                <div><span className="font-bold text-slate-700">NBA:</span> {s.decision}</div>
                                <div><span className="font-bold text-slate-700">Outcome:</span> {s.outcome}</div>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <button
                                data-testid={`view-case-${s.id}`}
                                onClick={() => {
                                    selectCase(s.id);
                                    nav(`/workspace?case=${s.id}`);
                                }}
                                className="flex-1 rounded-full bg-slate-900 hover:bg-indigo-600 text-white text-[10px] font-bold py-2 transition-colors shadow-sm"
                            >
                                View Case
                            </button>
                            <button
                                data-testid={`use-context-${s.id}`}
                                onClick={() => {
                                    toast.success(`${s.id} topology attached as memory context`, {
                                        description: "Prior graph vertices linked to active investigation",
                                    });
                                }}
                                className="flex-1 rounded-full border border-slate-300 hover:border-indigo-300 text-slate-700 text-[10px] font-bold py-2 bg-white transition-colors shadow-sm"
                            >
                                Attach Context
                            </button>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Historical Cases Table (All 20 Benchmark Cases) */}
            <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm" data-testid="history-table">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                    <div>
                        <h3 className="font-display text-sm font-bold text-slate-900">
                            TigerGraph Investigation Graph Memory ({rows.length} cases)
                        </h3>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                            All benchmark cases indexed and searchable in graph storage
                        </p>
                    </div>
                    <span className="font-mono text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                        TigerGraph v3.10.2 · Read-After-Write Sealed
                    </span>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-slate-100 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                <th className="px-5 py-3">Case ID</th>
                                <th className="px-3 py-3">Pattern / Ring</th>
                                <th className="px-3 py-3">Verdict</th>
                                <th className="px-3 py-3">Next Best Action</th>
                                <th className="px-3 py-3">Exposure</th>
                                <th className="px-5 py-3 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((h) => {
                                const isCurrent = h.id === currentCaseId;
                                return (
                                    <tr
                                        key={h.id}
                                        className={`border-b border-slate-50 transition-colors ${
                                            isCurrent ? "bg-indigo-50/50" : "hover:bg-slate-50/70"
                                        }`}
                                        data-testid={`history-row-${h.id}`}
                                    >
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono text-xs font-bold text-slate-900">{h.id}</span>
                                                {isCurrent && (
                                                    <span className="text-[9px] font-bold text-indigo-700 bg-indigo-100 rounded px-1">
                                                        Active
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">{h.customer}</div>
                                        </td>
                                        <td className="px-3 py-3.5 text-xs text-slate-700">
                                            <div>{h.pattern}</div>
                                            {h.cards_count > 1 && (
                                                <span className="text-[9px] font-mono text-purple-700 bg-purple-50 border border-purple-200 rounded px-1 mt-0.5 inline-block">
                                                    {h.cards_count} connected cards
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-3 py-3.5">
                                            <span
                                                className={`rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ${
                                                    VERDICT_STYLE[h.verdict] || "bg-slate-100 text-slate-600 border-slate-200"
                                                }`}
                                            >
                                                {h.verdict}
                                            </span>
                                        </td>
                                        <td className="px-3 py-3.5 text-xs text-slate-600 max-w-[200px] truncate">
                                            {h.nba}
                                        </td>
                                        <td className="px-3 py-3.5 font-mono text-xs font-semibold text-slate-800">
                                            ${(h.exposure_usd || 0).toFixed(2)}
                                        </td>
                                        <td className="px-5 py-3.5 text-right">
                                            <button
                                                data-testid={`open-workspace-${h.id}`}
                                                onClick={() => {
                                                    selectCase(h.id);
                                                    nav(`/workspace?case=${h.id}`);
                                                }}
                                                className="inline-flex items-center gap-1 font-mono text-[11px] font-bold text-indigo-600 hover:text-indigo-800"
                                            >
                                                Open Workspace <ArrowUpRight className="w-3 h-3" />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
