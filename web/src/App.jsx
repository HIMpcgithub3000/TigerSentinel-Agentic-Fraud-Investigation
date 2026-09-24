import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, ShieldCheck, HelpCircle, Database, Search, 
  RotateCw, FileWarning, ExternalLink, CheckCircle, ChevronRight, Activity, Terminal
} from 'lucide-react';
import GraphCanvas from './components/GraphCanvas';
import ActionTimeline from './components/ActionTimeline';
import EvidenceTable from './components/EvidenceTable';
import SARModal from './components/SARModal';

export default function App() {
  const [cases, setCases] = useState([]);
  const [selectedCaseId, setSelectedCaseId] = useState('HHG-001');
  const [caseDetails, setCaseDetails] = useState(null);
  const [graphData, setGraphData] = useState(null);
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSAR, setShowSAR] = useState(false);
  const [activeTab, setActiveTab] = useState('actions'); // 'actions' | 'evidence' | 'summary' | 'trace'

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

  const handleReInvestigate = () => {
    if (!selectedCaseId) return;
    setLoading(true);
    fetch(`/api/cases/${selectedCaseId}/investigate`, { method: 'POST' })
      .then(r => r.json())
      .then(details => {
        setCaseDetails(details);
        setLoading(false);
      })
      .catch(e => {
        console.error(e);
        setLoading(false);
      });
  };

  const handleApproveAction = (action, route) => {
    fetch(`/api/cases/${selectedCaseId}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, approver_role: route, notes: "Approved via Analyst Console" })
    })
    .then(r => r.json())
    .then(res => alert(res.message))
    .catch(e => console.error(e));
  };

  const filteredCases = cases.filter(c => {
    const matchesFilter = 
      filter === 'ALL' || 
      (filter === 'FRAUD' && c.verdict === 'fraud') ||
      (filter === 'LEGITIMATE' && c.verdict === 'legitimate') ||
      (filter === 'UNCERTAIN' && c.verdict === 'uncertain');
    const matchesSearch = c.case_id.toLowerCase().includes(search.toLowerCase()) || 
                          c.pattern.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const cInfo = caseDetails?.case;

  return (
    <div className="flex h-screen bg-[#0B0F19] text-slate-100 overflow-hidden font-sans">
      {/* Sidebar: Case Queue */}
      <div className="w-80 border-r border-slate-800 bg-[#0F172A] flex flex-col shrink-0">
        {/* Brand Header */}
        <div className="p-4 border-b border-slate-800">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-bold text-white shadow-md">
              TG
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
                CaseGuard <span className="text-[10px] px-1.5 py-0.2 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded font-mono">v2.0</span>
              </h1>
              <p className="text-[10px] text-slate-400">TigerGraph Agentic Investigator</p>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2 text-[11px] text-emerald-400 bg-emerald-950/30 border border-emerald-900/40 px-2 py-1 rounded-md">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            TigerGraph Savanna Engine Active
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="p-3 border-b border-slate-800 space-y-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search benchmark cases..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-700/80 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
            />
          </div>
          <div className="grid grid-cols-4 gap-1 text-[10px] font-semibold text-center">
            {['ALL', 'FRAUD', 'LEGITIMATE', 'UNCERTAIN'].map(t => (
              <button
                key={t}
                onClick={() => setFilter(t)}
                className={`py-1 rounded transition ${
                  filter === t 
                    ? 'bg-blue-600 text-white shadow-sm' 
                    : 'bg-slate-900/60 text-slate-400 hover:bg-slate-800'
                }`}
              >
                {t === 'LEGITIMATE' ? 'LEGIT' : t}
              </button>
            ))}
          </div>
        </div>

        {/* Case List Scroll Area */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60">
          {filteredCases.map(c => {
            const isSelected = c.case_id === selectedCaseId;
            const isFraud = c.verdict === 'fraud';
            const isLegit = c.verdict === 'legitimate';
            return (
              <div
                key={c.case_id}
                onClick={() => setSelectedCaseId(c.case_id)}
                className={`p-3 cursor-pointer transition flex items-center justify-between ${
                  isSelected 
                    ? 'bg-blue-950/40 border-l-4 border-blue-500' 
                    : 'hover:bg-slate-800/40'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-100">{c.case_id}</span>
                    <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold uppercase ${
                      isFraud ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                      isLegit ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                      'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}>
                      {c.verdict}
                    </span>
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
        <div className="p-3 border-t border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
          <span>Benchmark Suite</span>
          <span className="font-mono text-slate-400">20 / 20 Loaded</span>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navbar */}
        <header className="h-14 border-b border-slate-800 bg-[#0F172A]/80 backdrop-blur-md px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-white font-mono">{selectedCaseId}</span>
            <span className="text-slate-600">|</span>
            <span className="text-xs text-slate-400">
              Investigation Trigger: <strong className="text-slate-200">{caseDetails?.case?.pattern}</strong>
            </span>
          </div>

          <div className="flex items-center gap-3">
            {caseDetails?.sar?.file && (
              <button
                onClick={() => setShowSAR(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/40 rounded-lg text-xs font-semibold transition"
              >
                <FileWarning className="w-3.5 h-3.5" /> View FinCEN SAR Filing
              </button>
            )}
            <button
              onClick={handleReInvestigate}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition shadow-md disabled:opacity-50"
            >
              <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Re-Investigate
            </button>
          </div>
        </header>

        {/* Main Body */}
        {caseDetails ? (
          <div className="flex-1 p-6 overflow-y-auto space-y-6">
            {/* Top Metric Strip */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div className="p-3.5 bg-slate-900/80 rounded-xl border border-slate-800">
                <span className="text-[10px] uppercase text-slate-500 font-semibold block">Investigation Verdict</span>
                <span className={`text-base font-bold uppercase ${
                  cInfo?.verdict === 'fraud' ? 'text-red-400' :
                  cInfo?.verdict === 'legitimate' ? 'text-emerald-400' : 'text-amber-400'
                }`}>
                  {cInfo?.verdict}
                </span>
              </div>

              <div className="p-3.5 bg-slate-900/80 rounded-xl border border-slate-800">
                <span className="text-[10px] uppercase text-slate-500 font-semibold block">Fraud Probability</span>
                <span className="text-base font-bold font-mono text-cyan-400">
                  {(cInfo?.fraud_probability * 100).toFixed(0)}%
                </span>
              </div>

              <div className="p-3.5 bg-slate-900/80 rounded-xl border border-slate-800">
                <span className="text-[10px] uppercase text-slate-500 font-semibold block">Verified Exposure</span>
                <span className="text-base font-bold font-mono text-amber-400">
                  ${cInfo?.exposure_usd.toFixed(2)}
                </span>
              </div>

              <div className="p-3.5 bg-slate-900/80 rounded-xl border border-slate-800">
                <span className="text-[10px] uppercase text-slate-500 font-semibold block">Detected Typology</span>
                <span className="text-xs font-semibold text-slate-200 capitalize truncate block mt-0.5">
                  {cInfo?.pattern.replace(/_/g, ' ')}
                </span>
              </div>

              <div className="p-3.5 bg-slate-900/80 rounded-xl border border-slate-800">
                <span className="text-[10px] uppercase text-slate-500 font-semibold block">TigerGraph Memory</span>
                <span className="text-xs font-mono text-emerald-400 flex items-center gap-1 mt-0.5">
                  <CheckCircle className="w-3.5 h-3.5" /> {cInfo?.graph_case_id || 'COMMITTED'}
                </span>
              </div>
            </div>

            {/* Middle Section: Cytoscape Multi-hop Graph */}
            <div className="bg-[#0F172A] rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
              <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-blue-400" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    TigerGraph Multi-Hop Subgraph & Hardware Ring Visualization
                  </h3>
                </div>
                <span className="text-[11px] text-slate-500">
                  {graphData?.nodes?.length || 0} Entities | {graphData?.edges?.length || 0} Relational Edges
                </span>
              </div>
              <div className="h-80 w-full">
                <GraphCanvas graphData={graphData} />
              </div>
            </div>

            {/* Bottom Section: Tabs for Actions, Evidence Ledger, Summary, and Trace */}
            <div className="bg-[#0F172A] rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
              {/* Tab Navigation */}
              <div className="flex border-b border-slate-800 bg-slate-900/40 px-4 text-xs font-semibold">
                <button
                  onClick={() => setActiveTab('actions')}
                  className={`py-3 px-4 border-b-2 transition ${
                    activeTab === 'actions'
                      ? 'border-blue-500 text-blue-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Dual-Phase Next-Best Actions
                </button>
                <button
                  onClick={() => setActiveTab('evidence')}
                  className={`py-3 px-4 border-b-2 transition ${
                    activeTab === 'evidence'
                      ? 'border-blue-500 text-blue-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Evidence Ledger ({cInfo?.evidence?.length || 0})
                </button>
                <button
                  onClick={() => setActiveTab('summary')}
                  className={`py-3 px-4 border-b-2 transition ${
                    activeTab === 'summary'
                      ? 'border-blue-500 text-blue-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Analyst Summary & Reasoning
                </button>
              </div>

              {/* Tab Content */}
              <div className="p-5">
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
                    <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800">
                      <h4 className="text-[11px] uppercase font-bold text-slate-400 mb-2">Investigation Synthesis</h4>
                      <p className="text-slate-200 leading-relaxed text-sm font-sans">{cInfo?.summary}</p>
                    </div>
                    {cInfo?.pattern_description && (
                      <div className="p-4 bg-purple-950/20 rounded-xl border border-purple-900/40">
                        <h4 className="text-[11px] uppercase font-bold text-purple-300 mb-2">Undocumented Typology Rationale</h4>
                        <p className="text-purple-200 text-sm font-sans">{cInfo?.pattern_description}</p>
                      </div>
                    )}
                    <div className="p-3 bg-slate-900/40 rounded-lg text-slate-500 text-[11px] flex items-center justify-between">
                      <span>Investigation Stop Rationale: <strong>{caseDetails.stop_reason}</strong></span>
                      <span className="font-mono">Latency: {caseDetails.latency_s}s</span>
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
    </div>
  );
}
