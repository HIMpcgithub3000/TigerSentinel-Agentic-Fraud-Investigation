import React, { useEffect, useRef } from 'react';
import cytoscape from 'cytoscape';

export default function GraphCanvas({ graphData, onNodeClick }) {
  const containerRef = useRef(null);
  const cyRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || !graphData || !graphData.nodes) return;

    if (cyRef.current) {
      cyRef.current.destroy();
    }

    const elements = [
      ...graphData.nodes.map(n => ({ data: n.data })),
      ...graphData.edges.map(e => ({ data: e.data }))
    ];

    cyRef.current = cytoscape({
      container: containerRef.current,
      elements: elements,
      style: [
        {
          selector: 'node',
          style: {
            'label': 'data(label)',
            'color': '#F1F5F9',
            'font-size': '11px',
            'font-weight': 600,
            'text-valign': 'bottom',
            'text-margin-y': '6px',
            'background-color': '#3B82F6',
            'border-width': 2,
            'border-color': '#1D4ED8',
            'width': 36,
            'height': 36
          }
        },
        {
          selector: 'node[type="case"]',
          style: {
            'background-color': '#8B5CF6',
            'border-color': '#6D28D9',
            'width': 44,
            'height': 44
          }
        },
        {
          selector: 'node[type="transaction"]',
          style: {
            'background-color': '#EF4444',
            'border-color': '#B91C1C',
            'width': 34,
            'height': 34
          }
        },
        {
          selector: 'node[type="card"]',
          style: {
            'background-color': '#F59E0B',
            'border-color': '#B45309',
            'width': 36,
            'height': 36
          }
        },
        {
          selector: 'node[type="device"]',
          style: {
            'background-color': '#06B6D4',
            'border-color': '#0891B2',
            'width': 40,
            'height': 40
          }
        },
        {
          selector: 'node[type="prior_case"]',
          style: {
            'background-color': '#10B981',
            'border-color': '#047857',
            'width': 34,
            'height': 34
          }
        },
        {
          selector: 'edge',
          style: {
            'width': 2,
            'line-color': '#475569',
            'target-arrow-color': '#475569',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            'label': 'data(label)',
            'font-size': '9px',
            'color': '#94A3B8',
            'text-rotation': 'autorotate',
            'text-margin-y': '-6px'
          }
        }
      ],
      layout: {
        name: 'cose',
        animate: false,
        padding: 40,
        componentSpacing: 60,
        nodeRepulsion: 450000,
        idealEdgeLength: 80
      }
    });

    cyRef.current.on('tap', 'node', (evt) => {
      const node = evt.target;
      if (onNodeClick) {
        onNodeClick(node.data());
      }
    });

    return () => {
      if (cyRef.current) {
        cyRef.current.destroy();
      }
    };
  }, [graphData]);

  return (
    <div className="relative w-full h-full bg-[#0F172A] rounded-xl border border-slate-800 overflow-hidden shadow-inner">
      <div className="absolute top-3 left-3 z-10 flex gap-2 text-xs">
        <span className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-900/80 rounded-md border border-slate-700 backdrop-blur-sm">
          <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span> Case
        </span>
        <span className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-900/80 rounded-md border border-slate-700 backdrop-blur-sm">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span> Transaction
        </span>
        <span className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-900/80 rounded-md border border-slate-700 backdrop-blur-sm">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Card
        </span>
        <span className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-900/80 rounded-md border border-slate-700 backdrop-blur-sm">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-500"></span> Device
        </span>
        <span className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-900/80 rounded-md border border-slate-700 backdrop-blur-sm">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Prior Memory
        </span>
      </div>
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
    </div>
  );
}
