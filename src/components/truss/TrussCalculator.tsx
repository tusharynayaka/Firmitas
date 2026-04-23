import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { TrussConfig, TrussResult } from '../../types/truss.types';
import { solveTruss } from '../../lib/trussSolver';
import { TrussInputs } from './TrussInputs';
import { TrussDiagram } from './TrussDiagram';
import { exportAsPNG, exportAsCSV } from '../../lib/exportUtils';

// Simple Pratt Truss template
const generatePrattTruss = (span: number, height: number, panels: number): TrussConfig => {
    let nodes = [];
    let members = [];
    let supports = [];
    let loads = [];
    
    const panelWidth = span / panels;
    
    // Nodes
    for(let i=0; i<=panels; i++) {
        // Bottom chord nodes
        nodes.push({ id: `b${i}`, x: i * panelWidth, y: 0 });
        // Top chord nodes (for internal panels)
        if (i > 0 && i < panels) {
            nodes.push({ id: `t${i}`, x: i * panelWidth, y: height });
        }
    }
    
    // Material/Section
    const E = 200e9; // Steel N/m^2
    const A = 0.005; // 50 cm^2
    
    // Members
    // Bottom chord
    for(let i=0; i<panels; i++) {
        members.push({ id: `bc${i}`, source: `b${i}`, target: `b${i+1}`, E, A });
    }
    // Top chord
    for(let i=1; i<panels-1; i++) {
        members.push({ id: `tc${i}`, source: `t${i}`, target: `t${i+1}`, E, A });
    }
    // End diagonals
    members.push({ id: 'ed1', source: 'b0', target: 't1', E, A });
    members.push({ id: `ed2`, source: `t${panels-1}`, target: `b${panels}`, E, A });
    
    // Verticals
    for(let i=1; i<panels; i++) {
        members.push({ id: `v${i}`, source: `b${i}`, target: `t${i}`, E, A });
    }
    // Internal diagonals (Pratt: tension diagonals towards center)
    const midPanel = panels / 2;
    for(let i=1; i<panels-1; i++) {
        if (i < midPanel) {
            members.push({ id: `d${i}`, source: `t${i}`, target: `b${i+1}`, E, A });
        } else if (i >= midPanel) {
            members.push({ id: `d${i}`, source: `b${i}`, target: `t${i+1}`, E, A });
        }
    }
    
    // Supports
    supports.push({ nodeId: 'b0', rx: true, ry: true });
    supports.push({ nodeId: `b${panels}`, rx: false, ry: true });
    
    // Load at center
    const centerNode = panels % 2 === 0 ? `b${panels/2}` : `b${Math.floor(panels/2)}`;
    loads.push({ id: uuidv4(), nodeId: centerNode, fx: 0, fy: -10000 }); // 10kN down
    
    return { nodes, members, supports, loads };
};

export const TrussCalculator = () => {
    const [config, setConfig] = useState<TrussConfig>(() => generatePrattTruss(20, 5, 4));
    const [result, setResult] = useState<TrussResult | null>(null);

    useEffect(() => {
        const handler = setTimeout(() => {
            const res = solveTruss(config);
            setResult(res);
        }, 100);
        return () => clearTimeout(handler);
    }, [config]);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-1 space-y-6">
                <TrussInputs config={config} onChange={setConfig} generateTemplate={generatePrattTruss} />
            </div>
            <div className="lg:col-span-3 flex flex-col gap-6">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 h-full min-h-[600px] flex flex-col">
                    <h2 className="text-lg font-semibold text-slate-900">Truss Analysis</h2>
                    <div className="flex gap-2">
                        <button onClick={() => exportAsCSV(result?.memberResults.map(r => ({ ...r, force: (r.force/1000).toFixed(3) })) || [], 'truss-results')} className="p-2 text-sm text-slate-600 hover:text-indigo-600 bg-slate-100 hover:bg-indigo-50 rounded flex items-center gap-1 transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg> CSV
                        </button>
                        <button onClick={() => exportAsPNG('truss-diagram-container', 'truss-diagram')} className="p-2 text-sm text-slate-600 hover:text-indigo-600 bg-slate-100 hover:bg-indigo-50 rounded flex items-center gap-1 transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg> PNG
                        </button>
                    </div>
                </div>
                <div id="truss-diagram-container" className="flex-1 flex flex-col gap-4">
                    {result ? (
                        <TrussDiagram config={config} result={result} />
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-500 bg-slate-50 rounded-lg border border-dashed border-slate-300 p-8 text-center">
                            <span className="font-semibold text-rose-500 mb-2">Unstable Structure or Singular Matrix</span>
                            <p className="text-sm">Truss configuration is invalid. Ensure you have at least 3 constraints (e.g., one pin and one roller) and that the truss is fully triangulated without mechanisms.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
