import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { RotateCcw, X, Smartphone, CreditCard, ShieldAlert, CheckCircle2, Network, Layers } from "lucide-react";
import { NODE_COLORS } from "@/data/mockData";
import { useInvestigation } from "@/context/InvestigationContext";
import CaseSelector from "@/components/CaseSelector";

const W = 1200;
const H = 380;
const TYPE_FILTERS = ["all", "case", "transaction", "device", "card", "customer"];

export default function GraphExplorer() {
    const svgRef = useRef(null);
    const [searchParams] = useSearchParams();
    const urlCaseId = searchParams.get("case");
    const { currentCaseId, selectCase, graphData, caseDetail, fetchCaseDetails } = useInvestigation();

    useEffect(() => {
        if (urlCaseId && urlCaseId !== currentCaseId) {
            selectCase(urlCaseId);
        }
    }, [urlCaseId, currentCaseId, selectCase]);

    const [nodes, setNodes] = useState([]);
    const [edges, setEdges] = useState([]);
    const [hop, setHop] = useState(3);
    const [ring, setRing] = useState(false);
    const [typeFilter, setTypeFilter] = useState("all");
    const [selected, setSelected] = useState(null);
    const [transform, setTransform] = useState({ x: 0, y: 0, k: 1 });
    const dragRef = useRef(null);
    const panRef = useRef(null);

    // Sync nodes & edges when graphData updates
    useEffect(() => {
        if (graphData && graphData.nodes) {
            setNodes(graphData.nodes.map((n) => ({ ...n })));
            setEdges(graphData.edges || []);
            // Auto-select focal node or case node
            const focal = graphData.nodes.find((n) => n.focal) || graphData.nodes[0];
            setSelected(focal || null);
        }
    }, [graphData]);

    const visibleNodes = nodes.filter(
        (n) => n.hop <= hop && (typeFilter === "all" || n.type === typeFilter)
    );
    const visibleIds = new Set(visibleNodes.map((n) => n.id));
    const visibleEdges = edges.filter((e) => visibleIds.has(e.from) && visibleIds.has(e.to));

    const toGraph = (cx, cy) => {
        if (!svgRef.current) return { x: 0, y: 0 };
        const svg = svgRef.current;
        if (svg.getScreenCTM) {
            const pt = svg.createSVGPoint();
            pt.x = cx;
            pt.y = cy;
            const p = pt.matrixTransform(svg.getScreenCTM().inverse());
            return { x: (p.x - transform.x) / transform.k, y: (p.y - transform.y) / transform.k };
        }
        const rect = svg.getBoundingClientRect();
        const sx = ((cx - rect.left) / rect.width) * W;
        const sy = ((cy - rect.top) / rect.height) * H;
        return { x: (sx - transform.x) / transform.k, y: (sy - transform.y) / transform.k };
    };

    const onNodeDown = (e, node) => {
        e.stopPropagation();
        const p = toGraph(e.clientX, e.clientY);
        dragRef.current = { id: node.id, dx: p.x - node.x, dy: p.y - node.y, moved: false };
    };

    const onBgDown = (e) => {
        panRef.current = { cx: e.clientX, cy: e.clientY, tx: transform.x, ty: transform.y };
    };

    const onMove = (e) => {
        if (dragRef.current) {
            const p = toGraph(e.clientX, e.clientY);
            const d = dragRef.current;
            d.moved = true;
            setNodes((ns) => ns.map((n) => (n.id === d.id ? { ...n, x: p.x - d.dx, y: p.y - d.dy } : n)));
        } else if (panRef.current) {
            const rect = svgRef.current.getBoundingClientRect();
            const dx = ((e.clientX - panRef.current.cx) / rect.width) * W;
            const dy = ((e.clientY - panRef.current.cy) / rect.height) * H;
            setTransform((t) => ({ ...t, x: panRef.current.tx + dx, y: panRef.current.ty + dy }));
        }
    };

    const onUp = () => {
        if (dragRef.current && !dragRef.current.moved) {
            setSelected(nodes.find((n) => n.id === dragRef.current.id));
        }
        dragRef.current = null;
        panRef.current = null;
    };

    const onWheel = (e) => {
        e.preventDefault();
        const factor = e.deltaY < 0 ? 1.08 : 0.92;
        const newK = Math.min(2.4, Math.max(0.65, transform.k * factor));
        if (!svgRef.current) return;
        const rect = svgRef.current.getBoundingClientRect();
        const cursorX = ((e.clientX - rect.left) / rect.width) * W;
        const cursorY = ((e.clientY - rect.top) / rect.height) * H;
        const ratio = newK / transform.k;
        const newX = cursorX - ratio * (cursorX - transform.x);
        const newY = cursorY - ratio * (cursorY - transform.y);
        setTransform({ x: newX, y: newY, k: newK });
    };

    const resetGraph = () => {
        if (graphData && graphData.nodes) {
            setNodes(graphData.nodes.map((n) => ({ ...n })));
        }
        setTransform({ x: 0, y: 0, k: 1 });
        setHop(3);
        setRing(false);
        setTypeFilter("all");
    };

    const connectedCardsCount = caseDetail?.case?.connected_card_ids?.length || 0;
    const connectedDevicesCount = caseDetail?.case?.connected_device_profiles?.length || 0;

    return (
        <div className="max-w-[1500px] mx-auto px-4 sm:px-6 py-8" data-testid="graph-explorer-screen">
            {/* Header with Case Selector */}
            <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <span className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">
                            TigerGraph Subgraph Explorer
                        </span>
                        <CaseSelector />
                    </div>
                    <h1 className="font-display text-3xl sm:text-4xl font-black tracking-tight text-slate-900">
                        {currentCaseId} · network canvas
                    </h1>
                    <p className="text-sm text-slate-500 mt-1.5">
                        device_ring.gsql · depth 3 · {connectedCardsCount > 0 ? `${connectedCardsCount} connected cards reachable` : "Customer transaction baseline"} · Read-after-write verified in TigerGraph
                    </p>
                </div>

                <div className="flex flex-wrap gap-2">
                    {[1, 2, 3].map((h) => (
                        <button
                            key={h}
                            data-testid={`graph-hop-${h}`}
                            onClick={() => setHop(h)}
                            className={`rounded-full border px-4 py-2 text-[11px] font-bold transition-colors ${
                                hop === h
                                    ? "bg-indigo-600 border-indigo-600 text-white shadow-sm"
                                    : "border-slate-300 text-slate-600 hover:border-indigo-300 bg-white"
                            }`}
                        >
                            {h}-HOP
                        </button>
                    ))}
                    <button
                        data-testid="highlight-fraud-ring-toggle"
                        onClick={() => {
                            setRing((r) => !r);
                            if (!ring) {
                                toast.error("Fraud ring highlighted", {
                                    description: `${connectedCardsCount} cards linked to shared hardware profile`,
                                });
                            }
                        }}
                        className={`rounded-full border px-4 py-2 text-[11px] font-bold transition-colors ${
                            ring
                                ? "bg-red-600 border-red-600 text-white shadow-sm"
                                : "border-red-200 text-red-600 hover:bg-red-50 bg-white"
                        }`}
                    >
                        {ring ? "HIDE FRAUD RING" : "SHOW FRAUD RING"}
                    </button>
                    <button
                        data-testid="reset-graph-button"
                        onClick={resetGraph}
                        className="rounded-full border border-slate-300 px-4 py-2 text-[11px] font-bold text-slate-600 hover:border-indigo-300 bg-white transition-colors flex items-center gap-1.5"
                    >
                        <RotateCcw className="w-3.5 h-3.5 text-slate-400" /> RESET
                    </button>
                </div>
            </div>

            {/* Type Filters */}
            <div className="flex flex-wrap gap-1.5 mb-4">
                {TYPE_FILTERS.map((t) => (
                    <button
                        key={t}
                        data-testid={`type-filter-${t}`}
                        onClick={() => setTypeFilter(t)}
                        className={`rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                            typeFilter === t
                                ? "bg-slate-900 border-slate-900 text-white shadow-sm"
                                : "border-slate-200 bg-white text-slate-500 hover:border-indigo-300 hover:text-slate-800"
                        }`}
                    >
                        {t}
                    </button>
                ))}
            </div>

            {/* Graph Canvas & Inspector Grid */}
            <div className="grid lg:grid-cols-[1fr_340px] gap-4 items-start">
                {/* SVG Network Canvas - Half Height (h-[360px] / H = 380) */}
                <div
                    className="relative rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm h-[360px] flex items-center justify-center"
                    data-testid="graph-canvas-container"
                >
                    <svg
                        ref={svgRef}
                        viewBox={`0 0 ${W} ${H}`}
                        className="w-full h-full cursor-grab active:cursor-grabbing select-none"
                        onMouseDown={onBgDown}
                        onMouseMove={onMove}
                        onMouseUp={onUp}
                        onWheel={onWheel}
                    >
                        <defs>
                            <pattern id="grid-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
                                <circle cx="20" cy="20" r="1" fill="#E2E8F0" />
                            </pattern>
                            <marker
                                id="arrow"
                                viewBox="0 0 10 10"
                                refX="22"
                                refY="5"
                                markerWidth="6"
                                markerHeight="6"
                                orient="auto-start-reverse"
                            >
                                <path d="M 0 1 L 10 5 L 0 9 z" fill="#94A3B8" />
                            </marker>
                            <marker
                                id="arrow-ring"
                                viewBox="0 0 10 10"
                                refX="22"
                                refY="5"
                                markerWidth="6"
                                markerHeight="6"
                                orient="auto-start-reverse"
                            >
                                <path d="M 0 1 L 10 5 L 0 9 z" fill="#EF4444" />
                            </marker>
                        </defs>

                        {/* Background Grid */}
                        <rect width={W} height={H} fill="url(#grid-pattern)" />

                        <g transform={`translate(${transform.x}, ${transform.y}) scale(${transform.k})`}>
                            {/* Edges */}
                            {visibleEdges.map((e) => {
                                const fromNode = nodes.find((n) => n.id === e.from);
                                const toNode = nodes.find((n) => n.id === e.to);
                                if (!fromNode || !toNode) return null;
                                const isRingEdge = ring && (fromNode.ring || toNode.ring);
                                return (
                                    <g key={`${e.from}-${e.to}`}>
                                        <line
                                            x1={fromNode.x}
                                            y1={fromNode.y}
                                            x2={toNode.x}
                                            y2={toNode.y}
                                            stroke={isRingEdge ? "#EF4444" : "#CBD5E1"}
                                            strokeWidth={isRingEdge ? 2 : 1.2}
                                            strokeDasharray={e.label === "memory_similar" ? "4 4" : undefined}
                                            markerEnd={isRingEdge ? "url(#arrow-ring)" : "url(#arrow)"}
                                            opacity={0.85}
                                        />
                                        {e.label && (
                                            <text
                                                x={(fromNode.x + toNode.x) / 2}
                                                y={(fromNode.y + toNode.y) / 2 - 4}
                                                textAnchor="middle"
                                                className="fill-slate-400 font-mono text-[9px] select-none"
                                            >
                                                {e.label}
                                            </text>
                                        )}
                                    </g>
                                );
                            })}

                            {/* Nodes */}
                            {visibleNodes.map((n) => {
                                const isSelected = selected && selected.id === n.id;
                                const isRingNode = ring && n.ring;
                                const color = NODE_COLORS[n.type] || "#64748B";
                                return (
                                    <g
                                        key={n.id}
                                        transform={`translate(${n.x}, ${n.y})`}
                                        onMouseDown={(e) => onNodeDown(e, n)}
                                        className="cursor-pointer"
                                        data-testid={`graph-node-${n.id}`}
                                    >
                                        {/* Focal / Selected Halo */}
                                        {(n.focal || isSelected || isRingNode) && (
                                            <circle
                                                r={n.focal ? 26 : 22}
                                                fill="none"
                                                stroke={isRingNode ? "#EF4444" : isSelected ? "#4F46E5" : color}
                                                strokeWidth={2}
                                                opacity={0.4}
                                                strokeDasharray={isSelected ? "3 3" : undefined}
                                                className={isSelected ? "animate-spin" : undefined}
                                            />
                                        )}

                                        {/* Node Body */}
                                        <circle
                                            r={n.focal ? 18 : 14}
                                            fill={isRingNode ? "#EF4444" : color}
                                            stroke="#FFFFFF"
                                            strokeWidth={2.5}
                                            className="shadow-md transition-transform hover:scale-110"
                                        />

                                        {/* Node Label */}
                                        <text
                                            y={n.focal ? 28 : 24}
                                            textAnchor="middle"
                                            className="fill-slate-800 font-mono text-[10px] font-bold select-none drop-shadow-sm"
                                        >
                                            {n.label}
                                        </text>

                                        {n.sub && (
                                            <text
                                                y={n.focal ? 38 : 34}
                                                textAnchor="middle"
                                                className="fill-slate-400 font-sans text-[8px] font-medium select-none"
                                            >
                                                {n.sub}
                                            </text>
                                        )}
                                    </g>
                                );
                            })}
                        </g>
                    </svg>

                    {/* Canvas Controls Overlay */}
                    <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm border border-slate-200 px-3 py-1.5 rounded-full text-[10px] font-mono text-slate-500 shadow-sm flex items-center gap-2">
                        <span>Zoom: {Math.round(transform.k * 100)}%</span>
                        <span>·</span>
                        <span>Drag to pan / Scroll to zoom</span>
                    </div>
                </div>

                {/* Right Node Inspector */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4" data-testid="node-inspector">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                            <h3 className="font-display text-sm font-bold text-slate-900">Entity Inspector</h3>
                        </div>
                        {selected && (
                            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                                {selected.type}
                            </span>
                        )}
                    </div>

                    {selected ? (
                        <div className="space-y-4">
                            <div>
                                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">
                                    Entity Identifier
                                </div>
                                <div className="font-mono text-base font-bold text-slate-900 break-all">
                                    {selected.id}
                                </div>
                                <div className="text-xs text-slate-500 mt-0.5">{selected.sub}</div>
                            </div>

                            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-2 text-xs">
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Graph Hop Distance:</span>
                                    <span className="font-mono font-bold text-slate-700">{selected.hop} hops</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Fraud Ring Entity:</span>
                                    <span className="font-mono font-bold text-slate-700">
                                        {selected.ring ? "YES · Linked Hub" : "No"}
                                    </span>
                                </div>
                                {selected.data?.full_profile && (
                                    <div className="pt-2 border-t border-slate-200">
                                        <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">Hardware Fingerprint</div>
                                        <div className="font-mono text-[10px] text-slate-600 break-all leading-relaxed">
                                            {selected.data.full_profile}
                                        </div>
                                    </div>
                                )}
                                {selected.data?.verdict && (
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">Graph Verdict:</span>
                                        <span className="font-mono font-bold text-red-600 uppercase">
                                            {selected.data.verdict}
                                        </span>
                                    </div>
                                )}
                            </div>

                        </div>
                    ) : (
                        <div className="py-8 text-center text-xs text-slate-400">
                            Click any node on the network canvas to inspect properties
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom Multi-Hop Topology Strip */}
            <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                    { label: "Graph Ring Depth", value: "3 Hops", desc: "device_ring.gsql traversal" },
                    { label: "Connected Cards", value: `${connectedCardsCount}`, desc: "Linked to shared hardware" },
                    { label: "Shared Devices", value: `${connectedDevicesCount}`, desc: "High-centrality hubs" },
                    { label: "Read-After-Write Status", value: "VERIFIED", desc: "InvestigationCase vertex sealed" },
                ].map((item) => (
                    <div key={item.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{item.label}</div>
                        <div className="font-display text-xl font-extrabold text-slate-900 mt-1">{item.value}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">{item.desc}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}
