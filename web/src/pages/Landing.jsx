import { useEffect } from "react";
import { Link } from "react-router-dom";
import Lenis from "lenis";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, Network, GitBranch, ShieldCheck, Layers, Cpu, Database } from "lucide-react";
import Logo from "@/components/Logo";

const HERO_IMG =
    "https://images.unsplash.com/photo-1479839672679-a46483c0e7c8?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1ODR8MHwxfHNlYXJjaHwzfHxtb2Rlcm4lMjBmaW5hbmNpYWwlMjB0ZWNobm9sb2d5JTIwb2ZmaWNlJTIwYXJjaGl0ZWN0dXJlJTIwbWluaW1hbHxlbnwwfHx8fDE3OTAyNzk4NjF8MA&ixlib=rb-4.1.0&q=85";

const STATS = [
    { value: "4.2M", label: "graph vertices under analysis" },
    { value: "380ms", label: "3-hop traversal, p95" },
    { value: "96.4%", label: "pattern identification precision" },
    { value: "$2.1M", label: "monthly exposure blocked" },
];

const MARQUEE = [
    "MULTI-HOP TRAVERSAL",
    "GSQL MCP TOOLING",
    "FRAUD-RING DISCOVERY",
    "HYPOTHESIS ENGINE",
    "SUFFICIENCY GATE",
    "POLICY ENFORCEMENT",
    "CASE MEMORY",
    "SAR NARRATIVES",
    "GRAPH WRITE-BACK",
];

const FLOW = [
    { icon: Layers, label: "Analyst UI", sub: "React console" },
    { icon: Cpu, label: "Orchestrator", sub: "8-state machine" },
    { icon: GitBranch, label: "TigerGraph MCP", sub: "Tool interface" },
    { icon: Database, label: "TigerGraph", sub: "Evidence core" },
    { icon: ShieldCheck, label: "Policy Engine", sub: "Deterministic" },
];

function MaskedLine({ children, delay = 0, className = "" }) {
    return (
        <span className={`mask-line ${className}`}>
            <motion.span
                className="block"
                initial={{ y: "112%" }}
                animate={{ y: 0 }}
                transition={{ duration: 0.9, delay, ease: [0.22, 1, 0.36, 1] }}
            >
                {children}
            </motion.span>
        </span>
    );
}

export default function Landing() {
    const { scrollY } = useScroll();
    const imgY = useTransform(scrollY, [0, 600], [0, 90]);
    const heroOpacity = useTransform(scrollY, [0, 420], [1, 0.35]);

    useEffect(() => {
        const lenis = new Lenis({ autoRaf: true, duration: 1.15 });
        return () => lenis.destroy();
    }, []);

    return (
        <div className="min-h-screen bg-[#F8FAFC] text-slate-900 overflow-x-clip">
            {/* nav */}
            <header className="fixed top-0 inset-x-0 z-50 h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 px-5 sm:px-10 flex items-center justify-between">
                <Logo />
                <div className="flex items-center gap-3">
                    <span className="hidden sm:flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 live-dot" />
                        <span className="font-mono text-[10px] font-medium text-emerald-700">GSQL MCP · 12ms</span>
                    </span>
                    <Link
                        to="/dashboard"
                        data-testid="launch-console-button"
                        className="flex items-center gap-2 rounded-full bg-slate-900 hover:bg-indigo-600 text-white text-xs font-bold px-4 py-2 transition-colors"
                    >
                        Launch Console <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                </div>
            </header>

            {/* hero */}
            <section className="relative pt-16 min-h-[92vh] flex flex-col justify-center bg-grid-swiss">
                <motion.div style={{ y: imgY, opacity: heroOpacity }} className="absolute inset-0 pt-16 overflow-hidden">
                    <img src={HERO_IMG} alt="" className="w-full h-full object-cover opacity-[0.10]" />
                    <div className="absolute inset-0 bg-gradient-to-b from-[#F8FAFC]/40 via-transparent to-[#F8FAFC]" />
                </motion.div>

                <div className="relative max-w-7xl mx-auto w-full px-5 sm:px-10 py-20">
                    <motion.p
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15, duration: 0.6 }}
                        className="text-xs font-bold uppercase tracking-[0.22em] text-indigo-600 mb-7 flex items-center gap-3"
                    >
                        <span className="w-8 h-px bg-indigo-600" />
                        TigerGraph-native · Agentic Fraud Investigation OS
                    </motion.p>

                    <h1 className="font-display font-black tracking-tight leading-[0.98] text-5xl sm:text-7xl lg:text-[6.5rem] text-slate-900">
                        <MaskedLine delay={0.25}>Follow the money.</MaskedLine>
                        <MaskedLine delay={0.4}>
                            <span className="text-orange-600">Prove the ring.</span>
                        </MaskedLine>
                    </h1>

                    <motion.p
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.65, duration: 0.7 }}
                        className="mt-8 max-w-xl text-base sm:text-lg text-slate-500 leading-relaxed"
                    >
                        TigerSentinel turns a fraud trigger into a defensible decision: multi-hop TigerGraph evidence,
                        competing hypotheses, a hard sufficiency gate, and policy-routed next-best-actions — with the
                        analyst in control of every consequential move.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8, duration: 0.7 }}
                        className="mt-10 flex flex-wrap items-center gap-4"
                    >
                        <Link
                            to="/dashboard"
                            data-testid="hero-launch-dashboard"
                            className="btn-pulse flex items-center gap-2.5 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold px-7 py-3.5 transition-colors"
                        >
                            Launch Investigation Console <ArrowRight className="w-4 h-4" />
                        </Link>
                        <Link
                            to="/graph"
                            data-testid="hero-explore-ring"
                            className="flex items-center gap-2.5 rounded-full border border-slate-300 bg-white/70 hover:border-orange-400 hover:text-orange-600 text-sm font-bold px-7 py-3.5 transition-colors"
                        >
                            <Network className="w-4 h-4" /> Explore a live fraud ring
                        </Link>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.05, duration: 0.8 }}
                        className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-px bg-slate-200 rounded-2xl overflow-hidden border border-slate-200 max-w-3xl"
                    >
                        {STATS.map((s) => (
                            <div key={s.label} className="bg-white/90 px-5 py-4">
                                <div className="font-display text-2xl font-extrabold tracking-tight text-slate-900">{s.value}</div>
                                <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">{s.label}</div>
                            </div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* marquee */}
            <div className="border-y border-slate-200 bg-white py-4 overflow-hidden" data-testid="landing-marquee">
                <div className="animate-marquee flex whitespace-nowrap w-max">
                    {[...MARQUEE, ...MARQUEE].map((m, i) => (
                        <span key={i} className="flex items-center gap-8 px-4 font-display text-sm font-bold tracking-[0.18em] text-slate-400">
                            {m} <span className="w-1.5 h-1.5 rotate-45 bg-orange-500 inline-block" />
                        </span>
                    ))}
                </div>
            </div>

            {/* architecture */}
            <section className="max-w-7xl mx-auto px-5 sm:px-10 py-24">
                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-80px" }}
                    transition={{ duration: 0.7 }}
                >
                    <p className="text-xs font-bold uppercase tracking-[0.22em] text-indigo-600 mb-4">The investigation pipeline</p>
                    <h2 className="font-display text-3xl sm:text-5xl font-black tracking-tight text-slate-900 max-w-2xl leading-tight">
                        TigerGraph proves the relationships. The evidence engine decides what they mean.
                    </h2>
                </motion.div>

                <div className="mt-14 grid grid-cols-2 md:grid-cols-5 gap-3">
                    {FLOW.map((f, i) => (
                        <motion.div
                            key={f.label}
                            initial={{ opacity: 0, y: 24 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-60px" }}
                            transition={{ duration: 0.55, delay: i * 0.09 }}
                            className="relative rounded-2xl border border-slate-200 bg-white p-5 hover:border-indigo-300 hover:shadow-lg hover:shadow-indigo-100 transition-all group"
                        >
                            <f.icon className="w-5 h-5 text-indigo-600 mb-8 group-hover:scale-110 transition-transform" />
                            <div className="font-display font-bold text-sm text-slate-900">{f.label}</div>
                            <div className="text-[11px] text-slate-500 mt-0.5">{f.sub}</div>
                            <span className="absolute top-4 right-4 font-mono text-[10px] text-slate-300">0{i + 1}</span>
                        </motion.div>
                    ))}
                </div>

                <div className="mt-20 grid md:grid-cols-3 gap-3">
                    {[
                        { n: "01", t: "Graph Evidence", d: "1–3 hop traversals, shared-device and shared-IP clusters, centrality and fraud-ring candidates — every claim cited to a GSQL query." },
                        { n: "02", t: "Competing Hypotheses", d: "Legitimate, takeover, cloning, coordinated ring — scored against each other with explicit contradiction detection and an uncertainty gate." },
                        { n: "03", t: "Defensible Action", d: "Deterministic policy rules R1–R8 route approvals, block cards, draft SAR narratives and write the case back to graph memory." },
                    ].map((c, i) => (
                        <motion.div
                            key={c.n}
                            initial={{ opacity: 0, y: 24 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-60px" }}
                            transition={{ duration: 0.55, delay: i * 0.1 }}
                            className="rounded-2xl border border-slate-200 bg-white p-7"
                        >
                            <span className="font-mono text-xs text-orange-600 font-semibold">{c.n}</span>
                            <h3 className="font-display text-xl font-bold text-slate-900 mt-3">{c.t}</h3>
                            <p className="text-sm text-slate-500 leading-relaxed mt-2">{c.d}</p>
                        </motion.div>
                    ))}
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.7 }}
                    className="mt-20 rounded-3xl bg-slate-900 text-white p-10 sm:p-14 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8"
                >
                    <div>
                        <h3 className="font-display text-2xl sm:text-4xl font-black tracking-tight">A live fraud ring is waiting.</h3>
                        <p className="text-slate-400 text-sm mt-2 max-w-md">
                            CASE-8941 is pre-loaded: one device, 56 cards, 11 accounts. Run the agentic investigation end to end.
                        </p>
                    </div>
                    <Link
                        to="/workspace"
                        data-testid="cta-open-case"
                        className="shrink-0 flex items-center gap-2.5 rounded-full bg-orange-500 hover:bg-orange-400 text-white text-sm font-bold px-7 py-3.5 transition-colors"
                    >
                        Open CASE-8941 <ArrowRight className="w-4 h-4" />
                    </Link>
                </motion.div>
            </section>

            <footer className="border-t border-slate-200 py-8 px-5 sm:px-10 flex flex-col sm:flex-row items-center justify-between gap-3 max-w-7xl mx-auto">
                <Logo compact={false} />
                <p className="font-mono text-[10px] text-slate-400">
                    TigerSentinel · demo build · all investigation data is simulated
                </p>
            </footer>
        </div>
    );
}
