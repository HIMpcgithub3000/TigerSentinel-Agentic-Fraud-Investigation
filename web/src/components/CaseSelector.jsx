import { useEffect, useRef, useState } from "react";
import { ChevronDown, Search, ShieldAlert, CheckCircle2, AlertTriangle, Layers } from "lucide-react";
import { useInvestigation } from "@/context/InvestigationContext";

export default function CaseSelector({ className = "" }) {
    const { allCases, currentCaseId, selectCase } = useInvestigation();
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("all"); // 'all' | 'fraud' | 'legit'
    const popoverRef = useRef(null);

    const activeCase = allCases?.find((c) => c.id === currentCaseId) || {
        id: currentCaseId,
        risk: 86,
        pattern: "Multi-hop device ring",
        verdict: "fraud",
        status: "INVESTIGATING",
    };

    useEffect(() => {
        const handler = (e) => {
            if (popoverRef.current && !popoverRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const filtered = (allCases || []).filter((c) => {
        const matchSearch =
            !search.trim() ||
            c.id.toLowerCase().includes(search.toLowerCase()) ||
            (c.pattern && c.pattern.toLowerCase().includes(search.toLowerCase())) ||
            (c.card && c.card.toLowerCase().includes(search.toLowerCase()));

        if (!matchSearch) return false;
        if (filter === "fraud") return c.verdict === "fraud";
        if (filter === "legit") return c.verdict === "legitimate";
        return true;
    });

    const getRiskBadge = (score) => {
        if (score >= 80) return "bg-red-50 text-red-600 border-red-200";
        if (score >= 60) return "bg-orange-50 text-orange-600 border-orange-200";
        if (score >= 40) return "bg-amber-50 text-amber-600 border-amber-200";
        return "bg-emerald-50 text-emerald-600 border-emerald-200";
    };

    return (
        <div ref={popoverRef} className={`relative inline-block text-left ${className}`}>
            <button
                type="button"
                data-testid="case-selector-trigger"
                onClick={() => setOpen((prev) => !prev)}
                className="flex items-center gap-3 rounded-full border border-slate-300 bg-white hover:border-indigo-400 px-4 py-2 text-xs font-medium text-slate-800 shadow-sm transition-all hover:shadow"
            >
                <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
                        {activeCase.id}
                    </span>
                    <span className="hidden sm:inline font-medium text-slate-600">
                        {activeCase.pattern || "Fraud Investigation"}
                    </span>
                </div>

                <span
                    className={`rounded-full border px-2 py-0.5 font-mono text-[10px] font-bold ${getRiskBadge(
                        activeCase.risk || 50
                    )}`}
                >
                    Risk {activeCase.risk || 50}
                </span>

                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
            </button>

            {open && (
                <div
                    data-testid="case-selector-dropdown"
                    className="absolute left-0 mt-2 w-80 sm:w-96 rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150"
                >
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                            <Layers className="w-3.5 h-3.5 text-indigo-600" />
                            Select Benchmark Case ({allCases?.length || 20})
                        </span>
                        <div className="flex gap-1">
                            <button
                                type="button"
                                onClick={() => setFilter("all")}
                                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full transition-colors ${
                                    filter === "all" ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-100"
                                }`}
                            >
                                All
                            </button>
                            <button
                                type="button"
                                onClick={() => setFilter("fraud")}
                                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full transition-colors ${
                                    filter === "fraud" ? "bg-red-600 text-white" : "text-slate-500 hover:bg-slate-100"
                                }`}
                            >
                                Fraud
                            </button>
                            <button
                                type="button"
                                onClick={() => setFilter("legit")}
                                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full transition-colors ${
                                    filter === "legit" ? "bg-emerald-600 text-white" : "text-slate-500 hover:bg-slate-100"
                                }`}
                            >
                                Legitimate
                            </button>
                        </div>
                    </div>

                    <div className="relative mb-2">
                        <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by case ID, card, pattern..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-400 focus:bg-white"
                        />
                    </div>

                    <div className="max-h-64 overflow-y-auto space-y-1 pr-1">
                        {filtered.map((c) => {
                            const isSelected = c.id === currentCaseId;
                            return (
                                <button
                                    key={c.id}
                                    type="button"
                                    data-testid={`case-option-${c.id}`}
                                    onClick={() => {
                                        selectCase(c.id);
                                        setOpen(false);
                                    }}
                                    className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-colors ${
                                        isSelected
                                            ? "bg-indigo-50/80 border border-indigo-200/80"
                                            : "hover:bg-slate-50 border border-transparent"
                                    }`}
                                >
                                    <div className="min-w-0 pr-2">
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono text-xs font-bold text-slate-900">{c.id}</span>
                                            {c.cards_count > 1 && (
                                                <span className="text-[9px] font-mono font-semibold bg-purple-50 text-purple-700 border border-purple-200 rounded px-1">
                                                    {c.cards_count} cards
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-[11px] text-slate-500 truncate mt-0.5">
                                            {c.pattern || c.trigger}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <span
                                            className={`rounded-full border px-2 py-0.5 font-mono text-[9px] font-bold ${getRiskBadge(
                                                c.risk
                                            )}`}
                                        >
                                            {c.risk}
                                        </span>
                                        {c.verdict === "fraud" ? (
                                            <ShieldAlert className="w-3.5 h-3.5 text-red-500" />
                                        ) : (
                                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                        {filtered.length === 0 && (
                            <div className="py-4 text-center text-xs text-slate-400">
                                No matching cases found
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
