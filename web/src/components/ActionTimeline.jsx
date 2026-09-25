import React, { useState } from 'react';
import { ArrowRight, ShieldAlert, CheckCircle2, UserCheck, Clock, ShieldCheck, Check } from 'lucide-react';

export default function ActionTimeline({ nba, evidenceRequests, onApprove }) {
  const [approvedActions, setApprovedActions] = useState({});

  if (!nba) return null;

  const initial = nba.initial || [];
  const final = nba.final || [];
  const whatChanged = nba.what_changed || "nothing";
  const evReq = evidenceRequests && evidenceRequests.length > 0 ? evidenceRequests[0] : null;

  const handleActionClick = (action, route) => {
    if (onApprove) {
      onApprove(action, route);
      setApprovedActions(prev => ({ ...prev, [action]: true }));
    }
  };

  const getRouteBadge = (route) => {
    switch (route) {
      case 'auto':
        return (
          <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded uppercase tracking-wider">
            AUTO
          </span>
        );
      case 'L1':
        return (
          <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded uppercase tracking-wider">
            L1 APPROVAL
          </span>
        );
      case 'L2':
        return (
          <span className="px-2 py-0.5 text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded uppercase tracking-wider">
            L2 MANAGER
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700 rounded uppercase tracking-wider">
            {route}
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* 2-Phase Action Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Phase 1: Initial Actions */}
        <div className="bg-[#0B0D14] p-4 rounded-xl border border-orange-950/40 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-orange-950/40">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-orange-400" /> Phase 1: Initial Actions
              </span>
              <span className="text-[10px] font-mono text-slate-500 bg-[#121520] px-2 py-0.5 rounded border border-orange-950/30">
                Pre-Evidence
              </span>
            </div>
            <div className="space-y-2.5">
              {initial.map((a, idx) => (
                <div key={idx} className="p-3 bg-[#11141E]/80 rounded-lg border border-orange-950/30 transition hover:border-orange-500/40">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-100">{a.action}</span>
                    {getRouteBadge(a.route)}
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">{a.reason}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Phase 2: Final Actions */}
        <div className="bg-[#0D0F18] p-4 rounded-xl border border-orange-500/30 shadow-md shadow-orange-950/20 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-orange-950/40">
              <span className="text-xs font-bold text-orange-400 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-[#FF5500]" /> Phase 2: Final Actions
              </span>
              <span className="text-[10px] font-mono text-orange-300 bg-orange-950/60 border border-orange-800/40 px-2 py-0.5 rounded">
                Post-Evidence
              </span>
            </div>
            <div className="space-y-2.5">
              {final.map((a, idx) => {
                const isApproved = approvedActions[a.action];
                return (
                  <div key={idx} className="p-3 bg-orange-950/20 rounded-lg border border-orange-900/40 transition hover:border-orange-600/50">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-orange-200">{a.action}</span>
                      <div className="flex items-center gap-2">
                        {getRouteBadge(a.route)}
                        {a.route !== 'auto' && (
                          <button
                            onClick={() => handleActionClick(a.action, a.route)}
                            disabled={isApproved}
                            className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition flex items-center gap-1 shadow-sm ${
                              isApproved
                                ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 cursor-default'
                                : 'bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white cursor-pointer active:scale-95'
                            }`}
                          >
                            {isApproved ? (
                              <>
                                <Check className="w-3 h-3" /> Authorized
                              </>
                            ) : (
                              'Authorize'
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">{a.reason}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Controlled Evidence Request & Response Interlude */}
      {evReq && (
        <div className="p-3.5 bg-orange-950/30 rounded-xl border border-orange-900/50 flex items-start gap-3">
          <div className="w-7 h-7 rounded-lg bg-orange-900/40 border border-orange-700/50 flex items-center justify-center text-orange-400 shrink-0">
            <UserCheck className="w-4 h-4 text-orange-300" />
          </div>
          <div className="text-xs space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-orange-300">Controlled Follow-Up Verification Ingested</span>
              <span className="text-[10px] font-mono bg-orange-900/60 text-orange-200 px-1.5 py-0.5 rounded">
                Type: {evReq.type}
              </span>
            </div>
            <p className="text-slate-200 italic font-serif">"{evReq.assumed_response}"</p>
          </div>
        </div>
      )}

      {/* What Changed Banner */}
      {whatChanged && whatChanged !== "nothing" && (
        <div className="p-3.5 bg-emerald-950/30 rounded-xl border border-emerald-900/50 flex items-center gap-3 text-xs text-emerald-300">
          <div className="w-7 h-7 rounded-lg bg-emerald-900/40 border border-emerald-700/50 flex items-center justify-center text-emerald-400 shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-emerald-200 block text-[11px] uppercase tracking-wider">
              Autonomous Governance Progression Shift
            </span>
            <p className="text-emerald-300 font-sans text-xs mt-0.5">{whatChanged}</p>
          </div>
        </div>
      )}
    </div>
  );
}
