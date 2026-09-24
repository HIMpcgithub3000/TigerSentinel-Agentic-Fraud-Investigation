import React, { useState } from 'react';
import { X, FileWarning, ShieldCheck, Download, Copy, Check, Building2, User, CreditCard, Calendar } from 'lucide-react';

export default function SARModal({ sar, caseId, onClose }) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('narrative'); // 'narrative' | 'subjects' | 'meta'
  const [transmitted, setTransmitted] = useState(false);

  if (!sar || !sar.file) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(sar.narrative);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTransmit = () => {
    setTransmitted(true);
    setTimeout(() => {
      alert(`SAR for Case ${caseId} formally transmitted to FinCEN Gateway (Simulated E-Filing ID: BSA-${Date.now().toString().slice(-6)})`);
      onClose();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-[#0F172A] border border-red-500/40 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-red-950/40 border-b border-red-900/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-400">
              <FileWarning className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-red-100 uppercase tracking-wider flex items-center gap-2">
                FinCEN Suspicious Activity Report (SAR)
                <span className="text-[10px] font-mono bg-red-900/60 text-red-200 px-1.5 py-0.5 rounded border border-red-700/50">
                  Form 111 / 31 CFR 1020.320
                </span>
              </h3>
              <p className="text-xs text-red-400/80">Autonomous Regulatory Filing Draft for {caseId}</p>
            </div>
          </div>
          <button
            id="close-sar-x"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-900/60 px-6 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('narrative')}
            className={`py-3 px-4 border-b-2 transition ${
              activeTab === 'narrative'
                ? 'border-red-500 text-red-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Official Statutory Narrative
          </button>
          <button
            onClick={() => setActiveTab('subjects')}
            className={`py-3 px-4 border-b-2 transition ${
              activeTab === 'subjects'
                ? 'border-red-500 text-red-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Identified Subjects ({sar.subjects?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('meta')}
            className={`py-3 px-4 border-b-2 transition ${
              activeTab === 'meta'
                ? 'border-red-500 text-red-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Filing Metadata
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto text-xs text-slate-300">
          {/* Key Facts Strip */}
          <div className="grid grid-cols-3 gap-3 p-3.5 bg-slate-900/80 rounded-xl border border-slate-800">
            <div>
              <span className="text-[10px] uppercase text-slate-500 font-bold block">Suspicious Exposure</span>
              <span className="text-base font-bold text-amber-400 font-mono">${sar.total_amount_usd.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase text-slate-500 font-bold block">Activity Dates</span>
              <span className="text-xs font-mono text-slate-200 block mt-0.5">
                {sar.activity_dates ? sar.activity_dates.join(' to ') : '2016-12-05'}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase text-slate-500 font-bold block">Mandatory Mandate</span>
              <span className="text-xs font-semibold text-rose-400 block mt-0.5">Policy R2 / 31 CFR</span>
            </div>
          </div>

          {activeTab === 'narrative' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Chronological Narrative Summary
                </span>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] rounded transition"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied to Clipboard' : 'Copy Text'}
                </button>
              </div>
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-slate-200 leading-relaxed font-sans text-xs whitespace-pre-line shadow-inner select-text">
                {sar.narrative}
              </div>
            </div>
          )}

          {activeTab === 'subjects' && (
            <div className="space-y-3">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Target & Connected Graph Entities
              </span>
              <div className="grid grid-cols-2 gap-2">
                {sar.subjects.map((s, idx) => (
                  <div key={idx} className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 flex items-center justify-between font-mono">
                    <span className="text-slate-200">{s}</span>
                    <span className="text-[10px] px-1.5 py-0.5 bg-blue-950/60 text-blue-400 border border-blue-800/40 rounded uppercase">
                      {s.startsWith('C') && !s.includes('-K') ? 'Customer' : 'Payment Card'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'meta' && (
            <div className="space-y-3">
              <div className="p-3.5 bg-slate-900/60 rounded-xl border border-slate-800 space-y-2">
                <h4 className="text-[11px] uppercase font-bold text-slate-400">Statutory Reason Code</h4>
                <p className="text-slate-200 leading-relaxed">{sar.reason}</p>
              </div>
              <div className="p-3.5 bg-slate-900/60 rounded-xl border border-slate-800 space-y-2">
                <h4 className="text-[11px] uppercase font-bold text-slate-400">BSA E-Filing Authorization</h4>
                <p className="text-slate-400 text-xs">
                  Required Routing: <strong className="text-amber-400">L2 Fraud Manager Approval</strong>. Report is filed under FinCEN regulation 31 CFR 1020.320 for transactions aggregating &gt; $1,000 or linked to syndicated fraud rings.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 bg-slate-900 border-t border-slate-800 text-xs">
          <span className="text-slate-400 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" /> Grounded in TigerGraph Graph Entities
          </span>
          <div className="flex items-center gap-2">
            <button
              id="close-sar-btn"
              onClick={onClose}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-lg transition"
            >
              Close
            </button>
            <button
              onClick={handleTransmit}
              disabled={transmitted}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-lg transition shadow-md disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" /> {transmitted ? 'Transmitting...' : 'Sign & Submit to FinCEN'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
