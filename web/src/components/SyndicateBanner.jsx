import React, { useState } from 'react';
import { Network, AlertTriangle, ChevronDown, ChevronUp, Cpu, CreditCard, DollarSign } from 'lucide-react';

export default function SyndicateBanner({ connectedCards, connectedDevices, exposureUsd }) {
  const [expanded, setExpanded] = useState(false);

  if (!connectedCards || connectedCards.length < 2) return null;

  return (
    <div id="syndicate-banner" className="bg-gradient-to-r from-red-950/50 via-[#1C0D08]/60 to-orange-950/40 border border-orange-500/40 rounded-2xl p-4 shadow-xl laser-glow">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-600/20 border border-orange-500/50 flex items-center justify-center text-orange-400 shrink-0 shadow-lg shadow-orange-950/50">
            <Network className="w-5 h-5 animate-pulse text-[#FF5500]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-orange-200 uppercase tracking-wider">
                Multi-Hop Syndicate Ring Discovered
              </span>
              <span className="text-[10px] font-mono font-bold bg-orange-500/20 text-orange-300 border border-orange-500/40 px-2 py-0.5 rounded-full">
                3 Graph Hops
              </span>
            </div>
            <p className="text-xs text-orange-200/80 mt-0.5">
              Deep graph traversal connected <strong className="text-white font-mono">{connectedCards.length} payment cards</strong> sharing hardware device profiles and historical transaction bridges.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <span className="text-[10px] uppercase text-orange-400/80 font-semibold block">Syndicate Exposure</span>
            <span className="text-sm font-bold font-mono text-[#FF7A00]">
              ${(exposureUsd || 13199.91).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>

          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 px-3 py-1.5 bg-orange-950/50 hover:bg-orange-900/60 border border-orange-600/50 text-orange-200 text-xs font-semibold rounded-lg transition"
          >
            {expanded ? 'Hide Cards' : `Inspect ${connectedCards.length} Cards`}
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-3 pt-3 border-t border-orange-900/40 space-y-2 animate-in fade-in duration-150">
          <div className="flex items-center justify-between text-[11px] text-orange-300">
            <span>Connected Card Identifiers:</span>
            <span className="font-mono text-orange-400 font-bold">{connectedCards.length} Instruments</span>
          </div>
          <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2.5 bg-[#090A0E] rounded-xl border border-orange-900/40 font-mono text-[11px]">
            {connectedCards.map((cardId, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 bg-orange-950/70 border border-orange-800/60 text-orange-200 rounded shadow-xs"
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
