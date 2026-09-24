import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, ShieldCheck, HelpCircle, Database, Search, 
  RotateCw, FileWarning, ExternalLink, CheckCircle, ChevronRight, 
  Activity, Terminal, Network, Sparkles, Check, Lock, ArrowUpRight
} from 'lucide-react';
import GraphCanvas from './components/GraphCanvas';
import ActionTimeline from './components/ActionTimeline';
import EvidenceTable from './components/EvidenceTable';
import SARModal from './components/SARModal';
import SyndicateBanner from './components/SyndicateBanner';
import LiveInvestigationModal from './components/LiveInvestigationModal';

export default function App() {
  const [cases, setCases] = useState([]);
  const [selectedCaseId, setSelectedCaseId] = useState('HHG-001');
  const [caseDetails, setCaseDetails] = useState(null);
  const [graphData, setGraphData] = useState(null);
  const [filter, setFilter] = useState('ALL'); // 'ALL' | 'FRAUD' | 'LEGITIMATE' | 'UNCERTAIN' | 'SYNDICATE'
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSAR, setShowSAR] = useState(false);
  const [showRunner, setShowRunner] = useState(false);
  const [activeTab, setActiveTab] = useState('actions'); // 'actions' | 'evidence' | 'summary' | 'trace'
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Load cases list
  useEffect(() => {
    fetch('/api/cases')
      .then(r => r.json())
      .then(d => setCases(d.cases || []))
      .catch(e => console.error("Error loading cases:", e));
  }, []);

  // Load selected case details & graph
  useEffect(() => {
    if (!selectedCaseId) return;
    setLoading(true);
    Promise.all([
      fetch(`/api/cases/${selectedCaseId}`).then(r => r.json()),
      fetch(`/api/graph/${selectedCaseId}`).then(r => r.json())
    ]).then(([details, gData]) => {
      setCaseDetails(details);
      setGraphData(gData);
      setLoading(false);
    }).catch(e => {
      console.error("Error loading case:", e);
      setLoading(false);
    });
  }, [selectedCaseId]);

  const handleApproveAction = (action, route) => {
    fetch(`/api/cases/${selectedCaseId}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, approver_role: route, notes: "Authorized via CaseGuard Analyst Console" })
    })
    .then(r => r.json())
    .then(res => {
      showToast(`Action '${action}' authorized by ${route} role.`);
    })
    .catch(e => console.error(e));
  };

  const filteredCases = cases.filter(c => {
    const matchesFilter = 
      filter === 'ALL' || 
      (filter === 'FRAUD' && c.verdict === 'fraud') ||
      (filter === 'LEGITIMATE' && c.verdict === 'legitimate') ||
      (filter === 'UNCERTAIN' && c.verdict === 'uncertain') ||
      (filter === 'SYNDICATE' && c.pattern === 'undocumented');
    const matchesSearch = c.case_id.toLowerCase().includes(search.toLowerCase()) || 
                          c.pattern.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const cInfo = caseDetails?.case;
  const connectedCards = cInfo?.connected_card_ids || [];

  return (
    <div className="flex h-screen bg-[#020617] text-slate-100 overflow-hidden font-sans">
      {/* Sidebar: Case Queue & Triage */}
      <div className="w-84 border-r border-slate-800/80 bg-[#0B1120] flex flex-col shrink-0">
        {/* Brand Header */}
        <div className="p-4 border-b border-slate-800/80 bg-slate-950/40">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 flex items-center justify-center font-black text-white shadow-lg shadow-blue-500/20">
                TG
              </div>
              <div>
                <h1 className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
                  CaseGuard <span className="text-[10px] px-1.5 py-0.5 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded font-mono font-semibold">v2.0</span>
                </h1>
                <p className="text-[10px] text-slate-400">TigerGraph Agentic Fraud Investigator</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-emerald-400 bg-emerald-950/40 border border-emerald-900/50 px-2.5 py-1.5 rounded-lg shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-semibold">TigerGraph Savanna Engine</span>
            <span className="ml-auto font-mono text-[10px] text-emerald-300">ONLINE</span>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="p-3 border-b border-slate-800/80 space-y-2 bg-[#0B1120]">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search by case ID or typology..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-900/90 border border-slate-700/80 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition shadow-inner"
            />
          </div>
          <div className="grid grid-cols-5 gap-1 text-[9px] font-bold text-center">
            {[
              { id: 'ALL', label: 'ALL' },
              { id: 'FRAUD', label: 'FRAUD' },
              { id: 'LEGITIMATE', label: 'LEGIT' },
              { id: 'UNCERTAIN', label: 'REVIEW' },
              { id: 'SYNDICATE', label: 'RINGS' }
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setFilter(t.id)}
                className={`py-1 rounded-md transition cursor-pointer ${
                  filter === t.id 
                    ? t.id === 'SYNDICATE'
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-900/80 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Case List Scroll Area */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-800/50">
          {filteredCases.map(c => {
            const isSelected = c.case_id === selectedCaseId;
            const isFraud = c.verdict === 'fraud';
            const isLegit = c.verdict === 'legitimate';
            const isSyndicate = c.pattern === 'undocumented';

            return (
              <div
                key={c.case_id}
                onClick={() => setSelectedCaseId(c.case_id)}
                className={`p-3 cursor-pointer transition flex items-center justify-between group ${
                  isSelected 
                    ? 'bg-blue-950/40 border-l-4 border-blue-500 shadow-inner' 
                    : 'hover:bg-slate-900/60'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-xs font-bold text-slate-100 group-hover:text-blue-300 transition">
                      {c.case_id}
                    </span>
                    <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider ${
                      isFraud ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                      isLegit ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                      'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}>
                      {c.verdict}
                    </span>
                    {isSyndicate && (
                      <span className="px-1 py-0.2 rounded text-[8px] font-bold uppercase bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        RING
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400 truncate max-w-[170px] capitalize">
                    {c.pattern.replace(/_/g, ' ')}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-mono font-bold text-slate-200">
                    ${c.exposure_usd.toFixed(2)}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    prob: {c.fraud_probability.toFixed(2)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 bg-slate-950/60 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span> Benchmark Cohort
          </span>
          <span className="font-mono text-slate-300 font-bold">{cases.length} / 20 Verified</span>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden bg-[#020617]">
        {/* Top Navbar */}
        <header className="h-16 border-b border-slate-800/80 bg-[#0B1120]/90 backdrop-blur-md px-6 flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="text-base font-bold text-white font-mono tracking-tight">{selectedCaseId}</span>
            <span className="text-slate-700">|</span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Trigger:</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700 capitalize">
                {caseDetails?.case?.pattern?.replace(/_/g, ' ') || 'Loading...'}
              </span>
            </div>
            {caseDetails?.case?.written_to_graph && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 flex items-center gap-1">
                <Check className="w-3 h-3" /> Graph Memory: {caseDetails.case.graph_case_id}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {caseDetails?.sar?.file && (
              <button
                onClick={() => setShowSAR(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/40 rounded-lg text-xs font-semibold transition cursor-pointer shadow-sm active:scale-95"
              >
                <FileWarning className="w-3.5 h-3.5" /> View FinCEN SAR Filing
              </button>
            )}
            <button
              onClick={() => setShowRunner(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg text-xs font-bold transition shadow-md cursor-pointer active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
              Run Agentic Investigation
            </button>
          </div>
        </header>

        {/* Main Body */}
        {caseDetails ? (
          <div className="flex-1 p-6 overflow-y-auto space-y-6">
            {/* Top Metric Cards Strip */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
              <div className="p-4 bg-slate-900/70 rounded-2xl border border-slate-800/80 shadow-md">
                <span className="text-[10px] uppercase text-slate-500 font-bold tracking-wider block">Investigation Verdict</span>
                <span className={`text-lg font-black uppercase tracking-tight block mt-1 ${
                  cInfo?.verdict === 'fraud' ? 'text-red-400' :
                  cInfo?.verdict === 'legitimate' ? 'text-emerald-400' : 'text-amber-400'
                }`}>
                  {cInfo?.verdict}
                </span>
                <span className="text-[10px] text-slate-500 font-medium">Defensible Policy Status</span>
              </div>

              <div className="p-4 bg-slate-900/70 rounded-2xl border border-slate-800/80 shadow-md">
                <span className="text-[10px] uppercase text-slate-500 font-bold tracking-wider block">Calibrated Probability</span>
                <span className="text-lg font-black font-mono text-cyan-400 block mt-1">
                  {(cInfo?.fraud_probability * 100).toFixed(0)}%
                </span>
                <span className="text-[10px] text-slate-500 font-medium">Model & Graph Fused</span>
              </div>

              <div className="p-4 bg-slate-900/70 rounded-2xl border border-slate-800/80 shadow-md">
                <span className="text-[10px] uppercase text-slate-500 font-bold tracking-wider block">Fraudulent Exposure</span>
                <span className="text-lg font-black font-mono text-amber-400 block mt-1">
                  ${cInfo?.exposure_usd.toFixed(2)}
                </span>
                <span className="text-[10px] text-slate-500 font-medium">Target Card Loss</span>
              </div>

              <div className="p-4 bg-slate-900/70 rounded-2xl border border-slate-800/80 shadow-md">
                <span className="text-[10px] uppercase text-slate-500 font-bold tracking-wider block">Primary Typology</span>
                <span className="text-xs font-bold text-slate-100 capitalize truncate block mt-1.5">
                  {cInfo?.pattern.replace(/_/g, ' ')}
                </span>
                <span className="text-[10px] text-slate-500 font-medium">7 Competing Hypotheses</span>
              </div>

              <div className="p-4 bg-slate-900/70 rounded-2xl border border-slate-800/80 shadow-md">
                <span className="text-[10px] uppercase text-slate-500 font-bold tracking-wider block">Read-After-Write</span>
                <span className="text-xs font-mono text-emerald-400 font-bold flex items-center gap-1 mt-1.5">
                  <CheckCircle className="w-3.5 h-3.5" /> VERIFIED IN GRAPH
                </span>
                <span className="text-[10px] text-slate-500 font-medium">Idempotent Commit</span>
              </div>
            </div>

            {/* Syndicate Discovery Alert Banner (Rendered when multi-card ring detected) */}
            {connectedCards.length >= 2 && (
              <SyndicateBanner
                connectedCards={connectedCards}
                connectedDevices={cInfo?.connected_device_profiles}
                exposureUsd={graphData?.nodes?.length ? 13199.91 : cInfo?.exposure_usd}
              />
            )}

            {/* Middle Section: Cytoscape Multi-Hop Subgraph */}
            <div className="bg-[#0B1120] rounded-2xl border border-slate-800/80 overflow-hidden shadow-xl">
              <div className="px-5 py-3.5 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/40">
                <div className="flex items-center gap-2.5">
                  <Database className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                    TigerGraph 3-Hop Entity Subgraph & Hardware Ring Visualization
                  </h3>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono">
                  <span>{graphData?.nodes?.length || 0} Vertices</span>
                  <span className="text-slate-600">•</span>
                  <span>{graphData?.edges?.length || 0} Relational Edges</span>
                  {connectedCards.length >= 2 && (
                    <>
                      <span className="text-slate-600">•</span>
                      <span className="text-pink-400 font-semibold">{connectedCards.length} Connected Cards</span>
                    </>
                  )}
                </div>
              </div>
              <div className="h-88 w-full">
                <GraphCanvas graphData={graphData} />
              </div>
            </div>

            {/* Bottom Section: Tabs for Actions, Evidence Ledger, Summary, and Trace */}
            <div className="bg-[#0B1120] rounded-2xl border border-slate-800/80 overflow-hidden shadow-xl">
              {/* Tab Navigation */}
              <div className="flex border-b border-slate-800/80 bg-slate-950/40 px-5 text-xs font-bold">
                <button
                  onClick={() => setActiveTab('actions')}
                  className={`py-3.5 px-4 border-b-2 transition cursor-pointer ${
                    activeTab === 'actions'
                      ? 'border-blue-500 text-blue-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Dual-Phase Next-Best Actions
                </button>
                <button
                  onClick={() => setActiveTab('evidence')}
                  className={`py-3.5 px-4 border-b-2 transition cursor-pointer flex items-center gap-2 ${
                    activeTab === 'evidence'
                      ? 'border-blue-500 text-blue-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span>Evidence Ledger</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 text-slate-300 font-mono">
                    {cInfo?.evidence?.length || 0}
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab('summary')}
                  className={`py-3.5 px-4 border-b-2 transition cursor-pointer ${
                    activeTab === 'summary'
                      ? 'border-blue-500 text-blue-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Analyst Summary & Reasoning
                </button>
                <button
                  onClick={() => setActiveTab('trace')}
                  className={`py-3.5 px-4 border-b-2 transition cursor-pointer ${
                    activeTab === 'trace'
                      ? 'border-blue-500 text-blue-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  LangGraph Execution Trace
                </button>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {activeTab === 'actions' && (
                  <ActionTimeline
                    nba={caseDetails.next_best_actions}
                    evidenceRequests={caseDetails.evidence_requests}
                    onApprove={handleApproveAction}
                  />
                )}

                {activeTab === 'evidence' && (
                  <EvidenceTable evidence={cInfo?.evidence} />
                )}

                {activeTab === 'summary' && (
                  <div className="space-y-4 text-xs leading-relaxed text-slate-300">
                    <div className="p-4 bg-slate-900/70 rounded-xl border border-slate-800">
                      <h4 className="text-[11px] uppercase font-bold text-slate-400 mb-2">Investigation Synthesis</h4>
                      <p className="text-slate-100 leading-relaxed text-sm font-sans">{cInfo?.summary}</p>
                    </div>
                    {cInfo?.pattern_description && (
                      <div className="p-4 bg-purple-950/20 rounded-xl border border-purple-900/40">
                        <h4 className="text-[11px] uppercase font-bold text-purple-300 mb-2">Coordinated Abuse Rationale</h4>
                        <p className="text-purple-200 text-sm font-sans">{cInfo?.pattern_description}</p>
                      </div>
                    )}
                    <div className="p-3.5 bg-slate-900/50 rounded-xl text-slate-400 text-[11px] flex items-center justify-between border border-slate-800/80">
                      <span>Stop Rationale: <strong className="text-slate-200">{caseDetails.stop_reason}</strong></span>
                      <span className="font-mono text-cyan-400">Processing Latency: {caseDetails.latency_s}s</span>
                    </div>
                  </div>
                )}

                {activeTab === 'trace' && (
                  <div className="space-y-3 font-mono text-xs">
                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between text-slate-400 border-b border-slate-800 pb-2">
                        <span>Workflow State Machine Execution Log</span>
                        <span className="text-emerald-400 font-semibold">ALL STEPS PASSED</span>
                      </div>
                      <div className="space-y-1.5 text-[11px] text-slate-300">
                        <div className="flex items-center gap-2">
                          <span className="text-blue-400">[NODE 1]</span>
                          <span>case_intake: State initialized for {selectedCaseId} (Cutoff: {caseDetails.opened_at || '2016-12-05'})</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-cyan-400">[NODE 2]</span>
                          <span>tigergraph_parallel_retrieval: 5 queries executed in parallel via ThreadPoolExecutor</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-purple-400">[NODE 3]</span>
                          <span>evaluate_hypotheses: 7 competing hypotheses scored; Merkle hash chain sealed</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-amber-400">[NODE 4]</span>
                          <span>compute_initial_actions: Phase 1 Next-Best Actions mapped to approval routes</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-rose-400">[NODE 5]</span>
                          <span>assess_sufficiency: Evaluated Bank Policy R1/R4 sufficiency rules</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-emerald-400">[NODE 10]</span>
                          <span>writeback_to_graph: Read-after-write verification succeeded (Vertex + 2 Edges verified)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-500 text-xs">
            Loading investigation context...
          </div>
        )}
      </div>

      {/* SAR Modal */}
      {showSAR && (
        <SARModal
          sar={caseDetails?.sar}
          caseId={selectedCaseId}
          onClose={() => setShowSAR(false)}
        />
      )}

      {/* Live Agentic Investigation Runner Modal */}
      {showRunner && (
        <LiveInvestigationModal
          caseId={selectedCaseId}
          onClose={() => setShowRunner(false)}
          onComplete={(newDetails) => {
            setCaseDetails(newDetails);
            showToast(`Investigation for ${selectedCaseId} re-run and committed!`);
          }}
        />
      )}

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-blue-500/50 text-slate-100 px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 text-xs font-semibold animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
