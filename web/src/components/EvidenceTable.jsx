import React from 'react';
import { Database, FileText, UserCheck, Globe } from 'lucide-react';

export default function EvidenceTable({ evidence }) {
  if (!evidence || evidence.length === 0) {
    return <div className="p-4 text-xs text-slate-500 italic">No evidence recorded for this case.</div>;
  }

  const getSourceIcon = (source) => {
    switch (source) {
      case 'graph':
        return <Database className="w-3.5 h-3.5 text-blue-400" />;
      case 'document':
        return <FileText className="w-3.5 h-3.5 text-purple-400" />;
      case 'customer':
        return <UserCheck className="w-3.5 h-3.5 text-emerald-400" />;
      default:
        return <Globe className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs text-slate-300">
        <thead className="bg-slate-900/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
          <tr>
            <th className="py-2.5 px-3">#</th>
            <th className="py-2.5 px-3">Source</th>
            <th className="py-2.5 px-3">Verified Claim</th>
            <th className="py-2.5 px-3">Query / Ref</th>
            <th className="py-2.5 px-3">Citations</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/60 font-mono">
          {evidence.map((item, idx) => (
            <tr key={idx} className="hover:bg-slate-800/30 transition">
              <td className="py-2.5 px-3 font-semibold text-slate-500">EV-{String(idx + 1).padStart(3, '0')}</td>
              <td className="py-2.5 px-3">
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700/60">
                  {getSourceIcon(item.source)}
                  <span className="capitalize">{item.source}</span>
                </span>
              </td>
              <td className="py-2.5 px-3 font-sans text-slate-200 leading-snug">{item.claim}</td>
              <td className="py-2.5 px-3 text-cyan-400 text-[11px]">{item.ref}</td>
              <td className="py-2.5 px-3 text-slate-400 text-[11px]">
                {item.entity_ids && item.entity_ids.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {item.entity_ids.slice(0, 3).map((e, eIdx) => (
                      <span key={eIdx} className="px-1.5 py-0.5 bg-slate-900 rounded border border-slate-700 text-amber-400">
                        {e}
                      </span>
                    ))}
                    {item.entity_ids.length > 3 && (
                      <span className="text-slate-500">+{item.entity_ids.length - 3}</span>
                    )}
                  </div>
                ) : (
                  <span className="text-slate-600">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
