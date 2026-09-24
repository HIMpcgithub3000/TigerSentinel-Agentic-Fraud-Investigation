import React from 'react';
import { X, FileWarning, ShieldCheck, Download } from 'lucide-react';

export default function SARModal({ sar, caseId, onClose }) {
  if (!sar || !sar.file) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-[#0F172A] border border-red-500/30 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-red-950/40 border-b border-red-900/40">
          <div className="flex items-center gap-2.5">
            <FileWarning className="w-5 h-5 text-red-400" />
            <div>
              <h3 className="text-sm font-bold text-red-100 uppercase tracking-wider">
                FinCEN Suspicious Activity Report (SAR) Draft
              </h3>
              <p className="text-xs text-red-400/80">Compliance Filing for Case {caseId}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto text-xs text-slate-300">
          <div className="grid grid-cols-3 gap-3 p-3 bg-slate-900/60 rounded-xl border border-slate-800">
            <div>
              <span className="text-[10px] uppercase text-slate-500 font-semibold block">Total Amount</span>
              <span className="text-sm font-bold text-amber-400 font-mono">${sar.total_amount_usd.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase text-slate-500 font-semibold block">Activity Window</span>
              <span className="text-xs font-mono text-slate-300">
                {sar.activity_dates ? sar.activity_dates.join(' to ') : 'N/A'}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase text-slate-500 font-semibold block">Filing Authority</span>
              <span className="text-xs font-semibold text-rose-400">L2 Manager / FinCEN</span>
            </div>
          </div>

          <div>
            <h4 className="text-[11px] uppercase font-bold text-slate-400 mb-1">Subjects Identified</h4>
            <div className="flex flex-wrap gap-1.5 font-mono">
              {sar.subjects.map((s, idx) => (
                <span key={idx} className="px-2 py-0.5 bg-slate-900 border border-slate-700 text-cyan-400 rounded">
                  {s}
                </span>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-[11px] uppercase font-bold text-slate-400 mb-1">Statutory Filing Justification</h4>
            <p className="p-2.5 bg-slate-900/80 rounded-lg border border-slate-800 text-slate-300">
              {sar.reason}
            </p>
          </div>

          <div>
            <h4 className="text-[11px] uppercase font-bold text-slate-400 mb-1">Narrative (FinCEN 31 CFR 1020.320 Standard)</h4>
            <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 text-slate-200 leading-relaxed font-sans text-xs whitespace-pre-line shadow-inner">
              {sar.narrative}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 bg-slate-900 border-t border-slate-800 text-xs">
          <span className="text-slate-500 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" /> Grounded in TigerGraph Verified Evidence
          </span>
          <button
            onClick={() => {
              alert("SAR submitted to simulated regulatory gateway.");
              onClose();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white font-medium rounded-lg transition shadow-md"
          >
            <Download className="w-3.5 h-3.5" /> Sign & Transmit Filing
          </button>
        </div>
      </div>
    </div>
  );
}
