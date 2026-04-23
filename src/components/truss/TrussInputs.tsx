import React, { useState } from 'react';
import type { TrussConfig } from '../../types/truss.types';

interface TrussInputsProps {
    config: TrussConfig;
    onChange: (config: TrussConfig) => void;
    generateTemplate: (span: number, height: number, panels: number) => TrussConfig;
}

export const TrussInputs: React.FC<TrussInputsProps> = ({ config, onChange, generateTemplate }) => {
    const [span, setSpan] = useState(20);
    const [height, setHeight] = useState(5);
    const [panels, setPanels] = useState(4);

    const handleApplyTemplate = () => {
        const newPanels = Math.max(2, Math.floor(panels));
        if (newPanels % 2 !== 0 && false) {
           // Pratt truss usually easier with even panels, but works with any.
        }
        onChange(generateTemplate(span, height, newPanels));
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-slate-50 px-5 py-4 border-b border-slate-200">
                <h2 className="text-sm font-semibold text-slate-800 uppercase tracking-wider">Truss Properties (Pratt Template)</h2>
            </div>
            <div className="p-5 space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Span Length (m)</label>
                    <input 
                        type="number" 
                        value={span} 
                        onChange={e => setSpan(Number(e.target.value))}
                        className="w-full text-sm border-slate-300 rounded focus:ring-indigo-500 p-2 border"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Height (m)</label>
                    <input 
                        type="number" 
                        value={height} 
                        onChange={e => setHeight(Number(e.target.value))}
                        className="w-full text-sm border-slate-300 rounded focus:ring-indigo-500 p-2 border"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Number of Panels</label>
                    <input 
                        type="number" 
                        value={panels} 
                        onChange={e => setPanels(Number(e.target.value))}
                        className="w-full text-sm border-slate-300 rounded focus:ring-indigo-500 p-2 border"
                        min="2"
                        step="1"
                    />
                </div>
                
                <button 
                    onClick={handleApplyTemplate}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
                >
                    Apply Pratt Truss Template
                </button>
            </div>
            <div className="p-5 border-t border-slate-200 bg-slate-50">
                <p className="text-xs text-slate-500">
                    Advanced node/member editing is restricted in this template MVP. The template automatically applies a 10kN downward load at the center bottom node.
                </p>
            </div>
        </div>
    );
};
