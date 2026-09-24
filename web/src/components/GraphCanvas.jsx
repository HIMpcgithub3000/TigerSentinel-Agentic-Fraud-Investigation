import React, { useEffect, useRef, useState } from 'react';
import cytoscape from 'cytoscape';
import { ZoomIn, ZoomOut, Maximize2, RefreshCw, Layers, Info, X } from 'lucide-react';

export default function GraphCanvas({ graphData }) {
  const containerRef = useRef(null);
  const cyRef = useRef(null);
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [layoutName, setLayoutName] = useState('cose');

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
            'color': '#F8FAFC',
            'font-size': '11px',
            'font-weight': 600,
            'text-valign': 'bottom',
            'text-margin-y': '6px',
            'background-color': '#3B82F6',
            'border-width': 2,
            'border-color': '#1D4ED8',
            'width': 36,
            'height': 36,
            'transition-property': 'background-color, border-color, border-width, width, height',
            'transition-duration': '0.2s'
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
          selector: 'node[role="syndicate_card"]',
          style: {
            'background-color': '#EC4899',
            'border-color': '#BE185D',
            'width': 38,
            'height': 38
          }
        },
        {
          selector: 'node[type="device"]',
          style: {
            'background-color': '#06B6D4',
            'border-color': '#0891B2',
            'width': 42,
            'height': 42
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
          selector: 'node:selected',
          style: {
            'border-width': 4,
            'border-color': '#FFFFFF',
            'shadow-blur': 12,
            'shadow-color': '#38BDF8',
            'shadow-opacity': 0.8
          }
        },
        {
          selector: 'edge',
          style: {
            'width': 2,
            'line-color': '#334155',
            'target-arrow-color': '#475569',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            'label': 'data(label)',
            'font-size': '9px',
            'color': '#94A3B8',
            'text-rotation': 'autorotate',
            'text-margin-y': '-6px',
            'opacity': 0.85
          }
        },
        {
          selector: 'edge:selected',
          style: {
            'width': 3,
            'line-color': '#38BDF8',
            'target-arrow-color': '#38BDF8',
            'opacity': 1
          }
        }
      ],
      layout: getLayoutConfig(layoutName)
    });

    // Ensure Cytoscape recalculates container dimensions after DOM paint
    const timer = setTimeout(() => {
      if (cyRef.current) {
        cyRef.current.resize();
        cyRef.current.fit(null, 30);
      }
    }, 100);

    const handleWindowResize = () => {
      if (cyRef.current) {
        cyRef.current.resize();
        cyRef.current.fit(null, 30);
      }
    };
    window.addEventListener('resize', handleWindowResize);

    cyRef.current.on('tap', 'node', (evt) => {
      const node = evt.target;
      setSelectedEntity(node.data());
    });

    cyRef.current.on('tap', (evt) => {
      if (evt.target === cyRef.current) {
        setSelectedEntity(null);
      }
    });

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleWindowResize);
      if (cyRef.current) {
        cyRef.current.destroy();
      }
    };
  }, [graphData, layoutName]);

  function getLayoutConfig(name) {
    if (name === 'concentric') {
      return {
        name: 'concentric',
        concentric: (node) => (node.data('type') === 'case' ? 4 : node.data('type') === 'device' ? 3 : 2),
        levelWidth: () => 1,
        padding: 40,
        animate: true,
        animationDuration: 300
      };
    }
    if (name === 'circle') {
      return {
        name: 'circle',
        padding: 40,
        animate: true,
        animationDuration: 300
      };
    }
    return {
      name: 'cose',
      animate: false,
      padding: 40,
      componentSpacing: 60,
      nodeRepulsion: 450000,
      idealEdgeLength: 80
    };
  }

  const handleZoomIn = () => cyRef.current && cyRef.current.zoom(cyRef.current.zoom() * 1.25);
  const handleZoomOut = () => cyRef.current && cyRef.current.zoom(cyRef.current.zoom() * 0.8);
  const handleFit = () => cyRef.current && cyRef.current.fit(null, 30);
  const toggleLayout = () => {
    const next = layoutName === 'cose' ? 'concentric' : layoutName === 'concentric' ? 'circle' : 'cose';
    setLayoutName(next);
  };

  return (
    <div className="relative w-full h-full bg-[#0F172A] rounded-xl border border-slate-800/80 overflow-hidden shadow-inner">
      {/* Legend Badge Strip */}
      <div className="absolute top-3 left-3 z-10 flex flex-wrap gap-1.5 text-[11px] font-medium pointer-events-none">
        <span className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-900/90 rounded-md border border-slate-700/80 backdrop-blur-md shadow-sm">
          <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shadow-sm shadow-purple-500/50"></span> Case
        </span>
        <span className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-900/90 rounded-md border border-slate-700/80 backdrop-blur-md shadow-sm">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-sm shadow-red-500/50"></span> Flagged Txn
        </span>
        <span className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-900/90 rounded-md border border-slate-700/80 backdrop-blur-md shadow-sm">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-sm shadow-amber-500/50"></span> Target Card
        </span>
        <span className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-900/90 rounded-md border border-slate-700/80 backdrop-blur-md shadow-sm">
          <span className="w-2.5 h-2.5 rounded-full bg-pink-500 shadow-sm shadow-pink-500/50"></span> Syndicate Card
        </span>
        <span className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-900/90 rounded-md border border-slate-700/80 backdrop-blur-md shadow-sm">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 shadow-sm shadow-cyan-500/50"></span> Hardware Hub
        </span>
        <span className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-900/90 rounded-md border border-slate-700/80 backdrop-blur-md shadow-sm">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50"></span> Prior Memory
        </span>
      </div>

      {/* Floating Control Toolbar */}
      <div className="absolute top-3 right-3 z-10 flex items-center gap-1 bg-slate-900/90 p-1 rounded-lg border border-slate-700/80 backdrop-blur-md shadow-md">
        <button
          onClick={handleZoomIn}
          title="Zoom In"
          className="p-1.5 hover:bg-slate-800 text-slate-300 hover:text-white rounded transition"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleZoomOut}
          title="Zoom Out"
          className="p-1.5 hover:bg-slate-800 text-slate-300 hover:text-white rounded transition"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleFit}
          title="Fit to Screen"
          className="p-1.5 hover:bg-slate-800 text-slate-300 hover:text-white rounded transition"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
        <div className="w-[1px] h-4 bg-slate-700 mx-0.5" />
        <button
          onClick={toggleLayout}
          title={`Switch Layout (Current: ${layoutName})`}
          className="flex items-center gap-1 px-2 py-1 hover:bg-slate-800 text-[11px] font-semibold text-cyan-400 rounded transition"
        >
          <Layers className="w-3 h-3" />
          <span className="capitalize">{layoutName}</span>
        </button>
      </div>

      {/* Selected Entity Inspector Popover */}
      {selectedEntity && (
        <div className="absolute bottom-3 left-3 z-20 w-80 bg-slate-900/95 border border-slate-700 rounded-xl p-3.5 backdrop-blur-lg shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-150">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
            <div className="flex items-center gap-1.5">
              <Info className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold text-slate-200">Entity Details</span>
            </div>
            <button
              onClick={() => setSelectedEntity(null)}
              className="text-slate-400 hover:text-white p-0.5 rounded"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400 text-[11px]">Type:</span>
              <span className="font-semibold text-slate-200 uppercase text-[10px] px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700">
                {selectedEntity.type}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400 text-[11px]">Label / ID:</span>
              <span className="font-mono text-cyan-300 font-semibold truncate max-w-[180px]">
                {selectedEntity.label}
              </span>
            </div>
            {selectedEntity.full_profile && (
              <div className="pt-1 text-[11px]">
                <span className="text-slate-400 block mb-0.5">Hardware Signature:</span>
                <p className="font-mono text-[10px] text-slate-300 bg-slate-950 p-1.5 rounded border border-slate-800 break-words">
                  {selectedEntity.full_profile}
                </p>
              </div>
            )}
            {selectedEntity.role && (
              <div className="flex justify-between">
                <span className="text-slate-400 text-[11px]">Syndicate Role:</span>
                <span className="font-semibold text-pink-400 capitalize">{selectedEntity.role.replace(/_/g, ' ')}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Interactive Cytoscape Canvas */}
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
    </div>
  );
}
