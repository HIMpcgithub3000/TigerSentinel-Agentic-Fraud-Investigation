import { useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, Play, Search, ShieldAlert, CheckCircle2 } from "lucide-react";
import Logo from "@/components/Logo";
import { useInvestigation } from "@/context/InvestigationContext";

const TABS = [
    { to: "/dashboard", label: "Dashboard", testid: "nav-tab-dashboard" },
    { to: "/workspace", label: "Workspace", testid: "nav-tab-workspace" },
    { to: "/graph", label: "Graph Explorer", testid: "nav-tab-graph-explorer" },
    { to: "/evidence", label: "Evidence & Approval", testid: "nav-tab-evidence-approval" },
    { to: "/memory", label: "Case Memory", testid: "nav-tab-case-memory" },
];

function GlobalSearch() {
    const { allCases, selectCase } = useInvestigation();
    const [q, setQ] = useState("");
    const [open, setOpen] = useState(false);
    const nav = useNavigate();
    const ref = useRef(null);

    const results = q.trim()
        ? (allCases || []).filter(
              (c) =>
                  c.id.toLowerCase().includes(q.toLowerCase()) ||
                  (c.pattern && c.pattern.toLowerCase().includes(q.toLowerCase())) ||
                  (c.customer && c.customer.toLowerCase().includes(q.toLowerCase())) ||
                  (c.card && c.card.toLowerCase().includes(q.toLowerCase()))
          ).slice(0, 8)
        : [];

    useEffect(() => {
        const fn = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener("mousedown", fn);
        return () => document.removeEventListener("mousedown", fn);
    }, []);

    return (
        <div ref={ref} className="relative hidden md:block">
            <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3.5 py-1.5 w-64 focus-within:border-indigo-400 focus-within:bg-white transition-colors">
                <Search className="w-3.5 h-3.5 text-slate-400" />
                <input
                    data-testid="global-search-input"
                    value={q}
                    onChange={(e) => {
                        setQ(e.target.value);
                        setOpen(true);
                    }}
                    onFocus={() => setOpen(true)}
                    placeholder="Search 20 benchmark cases…"
                    className="bg-transparent text-xs outline-none w-full placeholder:text-slate-400"
                />
                <kbd className="text-[9px] font-mono text-slate-400 border border-slate-200 rounded px-1">⌘K</kbd>
            </div>
            <AnimatePresence>
                {open && results.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 6 }}
                        transition={{ duration: 0.16 }}
                        className="absolute top-11 left-0 w-80 rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden z-50 p-1"
                        data-testid="global-search-results"
                    >
                        <div className="px-3 py-1.5 text-[10px] font-bold uppercase text-slate-400 border-b border-slate-100">
                            Matching Cases ({results.length})
                        </div>
                        {results.map((r) => (
                            <button
                                key={r.id}
                                data-testid={`search-result-${r.id}`}
                                onClick={() => {
                                    selectCase(r.id);
                                    nav("/workspace");
                                    setOpen(false);
                                    setQ("");
                                }}
                                className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-indigo-50/70 text-left transition-colors"
                            >
                                <div>
                                    <div className="font-mono text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                        {r.id}
                                        <span className="text-[10px] font-normal text-slate-400 font-sans">
                                            {r.card}
                                        </span>
                                    </div>
                                    <div className="text-[11px] text-slate-500 truncate max-w-[190px]">
                                        {r.pattern || r.trigger}
                                    </div>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span
                                        className={`text-[9px] font-mono font-bold rounded-full px-2 py-0.5 border ${
                                            r.verdict === "fraud"
                                                ? "bg-red-50 text-red-600 border-red-200"
                                                : "bg-emerald-50 text-emerald-600 border-emerald-200"
                                        }`}
                                    >
                                        Risk {r.risk}
                                    </span>
                                </div>
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function Notifications() {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    const notifications = [
        {
            id: "n-1",
            title: "HHG-014 Device Ring Discovered",
            body: "Multi-hop traversal flagged 60 payment cards linked to shared hardware profile SM-G935F.",
            time: "2m ago",
            unread: true,
        },
        {
            id: "n-2",
            title: "HHG-006 FinCEN SAR Draft Prepared",
            body: "Statutory Form 111 filing narrative compiled pursuant to 31 CFR § 1020.320.",
            time: "14m ago",
            unread: true,
        },
        {
            id: "n-3",
            title: "HHG-001 Domestic Baseline Cleared",
            body: "Flagged transaction verified against 360-day historical pattern; false positive suppressed.",
            time: "1h ago",
            unread: false,
        },
    ];

    useEffect(() => {
        const fn = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener("mousedown", fn);
        return () => document.removeEventListener("mousedown", fn);
    }, []);

    return (
        <div ref={ref} className="relative">
            <button
                data-testid="notifications-bell"
                onClick={() => setOpen((o) => !o)}
                className="relative w-9 h-9 rounded-full border border-slate-200 bg-white flex items-center justify-center hover:border-indigo-300 hover:bg-indigo-50/50 transition-colors shadow-sm"
            >
                <Bell className="w-4 h-4 text-slate-600" />
                <span className="absolute top-1.5 right-2 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            </button>
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 6 }}
                        transition={{ duration: 0.16 }}
                        className="absolute right-0 top-12 w-96 rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden z-50 p-2"
                        data-testid="notifications-panel"
                    >
                        <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between">
                            <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Live Case Alerts</span>
                            <span className="text-[10px] font-mono text-red-500 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                                2 unread
                            </span>
                        </div>
                        {notifications.map((n) => (
                            <div
                                key={n.id}
                                className="px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-colors flex gap-2.5 mt-1"
                            >
                                <span
                                    className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${
                                        n.unread ? "bg-indigo-500" : "bg-slate-200"
                                    }`}
                                />
                                <div className="min-w-0">
                                    <div className="text-xs font-bold text-slate-800">{n.title}</div>
                                    <div className="text-[11px] text-slate-500 leading-snug mt-0.5">{n.body}</div>
                                </div>
                                <span className="ml-auto text-[10px] font-mono text-slate-400 shrink-0">{n.time}</span>
                            </div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default function AppShell() {
    const { start, status, currentCaseId } = useInvestigation();
    const nav = useNavigate();

    return (
        <div className="min-h-screen bg-slate-50">
            <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 flex items-center gap-5">
                <NavLink to="/" aria-label="TigerSentinel home">
                    <Logo />
                </NavLink>

                <nav className="hidden lg:flex items-center gap-1 ml-2">
                    {TABS.map((t) => (
                        <NavLink
                            key={t.to}
                            to={t.to}
                            data-testid={t.testid}
                            className={({ isActive }) =>
                                `px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                                    isActive
                                        ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/25"
                                        : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                                }`
                            }
                        >
                            {t.label}
                        </NavLink>
                    ))}
                </nav>

                <div className="ml-auto flex items-center gap-3">
                    <div
                        data-testid="tigergraph-status-badge"
                        className="hidden xl:flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5"
                    >
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="font-mono text-[10px] font-medium text-emerald-700">
                            TigerGraph v3.10.2 · GSQL MCP · 12ms
                        </span>
                    </div>

                    <GlobalSearch />

                    <button
                        data-testid="run-investigation-button"
                        onClick={() => {
                            nav("/workspace");
                            start(currentCaseId);
                        }}
                        disabled={status === "running"}
                        className="hidden sm:flex items-center gap-2 rounded-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-xs font-bold px-4 py-2 transition-colors shadow-sm shadow-indigo-600/25"
                    >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        Run Investigation
                    </button>

                    <Notifications />

                    <div data-testid="analyst-profile-chip" className="hidden md:flex items-center gap-2.5 pl-1">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-white flex items-center justify-center text-xs font-bold shadow-sm">
                            AR
                        </div>
                        <div className="leading-tight hidden xl:block">
                            <div className="text-xs font-bold text-slate-800">Ava Reyes</div>
                            <div className="text-[10px] text-slate-400">L1 Fraud Analyst</div>
                        </div>
                    </div>
                </div>
            </header>
            <main className="pt-16">
                <Outlet />
            </main>
        </div>
    );
}
