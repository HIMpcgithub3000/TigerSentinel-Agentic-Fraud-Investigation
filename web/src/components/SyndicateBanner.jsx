import React, { useState } from 'react';
import { Network, AlertTriangle, ChevronDown, ChevronUp, Cpu, CreditCard, DollarSign } from 'lucide-react';

export default function SyndicateBanner({ connectedCards, connectedDevices, exposureUsd }) {
  const [expanded, setExpanded] = useState(false);

  if (!connectedCards || connectedCards.length < 2) return null;

  return (
    <div className="bg-gradient-to-r from-purple-950/40 via-pink-950/30 to-purple-950/40 border border-purple-500/40 rounded-2xl p-4 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/50 flex items-center justify-center text-purple-400 shrink-0 shadow-lg shadow-purple-950/50">
            <Network className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-purple-200 uppercase tracking-wider">
                Multi-Hop Syndicate Ring Discovered
              </span>
              <span className="text-[10px] font-mono font-bold bg-pink-500/20 text-pink-400 border border-pink-500/40 px-2 py-0.5 rounded-full">
                3 Graph Hops
              </span>
            </div>
            <p className="text-xs text-purple-300/80 mt-0.5">
              Deep graph traversal connected <strong className="text-white font-mono">{connectedCards.length} payment cards</strong> sharing hardware device profiles and historical transaction bridges.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <span className="text-[10px] uppercase text-purple-400 font-semibold block">Syndicate Exposure</span>
            <span className="text-sm font-bold font-mono text-pink-400">
              ${(exposureUsd || 13199.91).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>

          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 px-3 py-1.5 bg-purple-900/40 hover:bg-purple-900/60 border border-purple-700/50 text-purple-200 text-xs font-semibold rounded-lg transition"
          >
            {expanded ? 'Hide Cards' : `Inspect ${connectedCards.length} Cards`}
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-3 pt-3 border-t border-purple-900/40 space-y-2 animate-in fade-in duration-150">
          <div className="flex items-center justify-between text-[11px] text-purple-300">
            <span>Connected Card Identifiers:</span>
            <span className="font-mono text-purple-400">{connectedCards.length} Instruments</span>
          </div>
          <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2 bg-slate-950/60 rounded-xl border border-purple-900/30 font-mono text-[11px]">
            {connectedCards.map((cardId, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 bg-purple-950/70 border border-purple-800/60 text-purple-300 rounded shadow-xs"
              >
                {cardId}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
