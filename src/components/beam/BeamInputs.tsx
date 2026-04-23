import React from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Trash2, Plus, GripVertical } from 'lucide-react';
import type { BeamConfig, BeamSupport, BeamLoad, SupportType, LoadType } from '../../types/beam.types';

interface BeamInputsProps {
  config: BeamConfig;
  onChange: (config: Partial<BeamConfig>) => void;
}

export const BeamInputs: React.FC<BeamInputsProps> = ({ config, onChange }) => {

  const addSupport = () => {
    onChange({ supports: [...config.supports, { id: uuidv4(), x: config.length / 2, type: 'roller' }] });
  };

  const removeSupport = (id: string) => {
    onChange({ supports: config.supports.filter(s => s.id !== id) });
  };

  const updateSupport = (id: string, updates: Partial<BeamSupport>) => {
    onChange({
      supports: config.supports.map(s => s.id === id ? { ...s, ...updates } : s)
    });
  };

  const addLoad = () => {
    onChange({ loads: [...config.loads, { id: uuidv4(), type: 'point', x: config.length / 2, magnitude: -10 }] });
  };

  const removeLoad = (id: string) => {
    onChange({ loads: config.loads.filter(l => l.id !== id) });
  };

  const updateLoad = (id: string, updates: Partial<BeamLoad>) => {
    onChange({
      loads: config.loads.map(l => l.id === id ? { ...l, ...updates } : l)
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
      <div className="bg-slate-50 px-5 py-4 border-b border-slate-200">
        <h2 className="text-sm font-semibold text-slate-800 uppercase tracking-wider">Beam Properties</h2>
      </div>
      
      <div className="p-5 space-y-6">
        <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Beam Length (L)</label>
            <div className="flex gap-2 items-center">
                <input 
                    type="number" 
                    value={config.length} 
                    onChange={e => onChange({ length: Math.max(0.1, Number(e.target.value)) })}
                    className="flex-1 rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                    min="0.1" step="any"
                />
                <span className="text-slate-500 text-sm font-medium w-6">m</span>
            </div>
        </div>

        <div>
            <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium text-slate-700">Supports</label>
                <button onClick={addSupport} className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1">
                    <Plus size={14}/> Add Support
                </button>
            </div>
            <div className="space-y-3">
                {config.supports.map((supp, idx) => (
                    <div key={supp.id} className="flex gap-2 items-center bg-slate-50 p-2 rounded border border-slate-200">
                        <span className="text-slate-400"><GripVertical size={16}/></span>
                        <div className="flex-1 grid grid-cols-2 gap-2">
                            <div>
                                <select 
                                    className="w-full text-sm border-slate-300 rounded focus:ring-indigo-500 p-1.5 border"
                                    value={supp.type}
                                    onChange={e => updateSupport(supp.id, { type: e.target.value as SupportType })}
                                >
                                    <option value="pin">Pin</option>
                                    <option value="roller">Roller</option>
                                    <option value="fixed">Fixed</option>
                                </select>
                            </div>
                            <div className="relative">
                                <input 
                                    type="number" 
                                    className="w-full text-sm border-slate-300 rounded focus:ring-indigo-500 p-1.5 border pr-6" 
                                    value={supp.x} 
                                    onChange={e => updateSupport(supp.id, { x: Number(e.target.value) })}
                                />
                                <span className="absolute right-2 top-1.5 text-xs text-slate-400">m</span>
                            </div>
                        </div>
                        <button onClick={() => removeSupport(supp.id)} className="text-rose-500 hover:bg-rose-50 p-1 rounded transition-colors"><Trash2 size={16}/></button>
                    </div>
                ))}
                {config.supports.length === 0 && <p className="text-xs text-slate-500 italic text-center">No supports added. Structure unstable.</p>}
            </div>
        </div>

        <div className="h-px bg-slate-200"></div>

        <div>
            <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium text-slate-700">Loads</label>
                <button onClick={addLoad} className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1">
                    <Plus size={14}/> Add Load
                </button>
            </div>
            <div className="space-y-3">
                {config.loads.map((load, idx) => (
                    <div key={load.id} className="bg-slate-50 p-3 rounded border border-slate-200 flex flex-col gap-3">
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Load {idx + 1}</span>
                            <button onClick={() => removeLoad(load.id)} className="text-rose-500 hover:bg-rose-50 p-1 rounded transition-colors"><Trash2 size={16}/></button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="col-span-2">
                                <select 
                                    className="w-full text-sm border-slate-300 rounded focus:ring-indigo-500 p-1.5 border"
                                    value={load.type}
                                    onChange={e => {
                                        const type = e.target.value as LoadType;
                                        updateLoad(load.id, { type, endX: type === 'distributed' ? Math.min(config.length, load.x + 2) : undefined });
                                    }}
                                >
                                    <option value="point">Point Load</option>
                                    <option value="distributed">Distributed Load</option>
                                    <option value="moment">Moment</option>
                                </select>
                            </div>
                            
                            <div>
                                <label className="text-xs text-slate-500 block mb-1">Position {load.type === 'distributed' && '(Start)'}</label>
                                <div className="relative">
                                    <input type="number" className="w-full text-sm border-slate-300 rounded p-1.5 border pr-6" value={load.x} onChange={e => updateLoad(load.id, { x: Number(e.target.value) })}/>
                                    <span className="absolute right-2 top-1.5 text-xs text-slate-400">m</span>
                                </div>
                            </div>

                            {load.type === 'distributed' && (
                                <div>
                                    <label className="text-xs text-slate-500 block mb-1">Position (End)</label>
                                    <div className="relative">
                                        <input type="number" className="w-full text-sm border-slate-300 rounded p-1.5 border pr-6" value={load.endX || 0} onChange={e => updateLoad(load.id, { endX: Number(e.target.value) })}/>
                                        <span className="absolute right-2 top-1.5 text-xs text-slate-400">m</span>
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="text-xs text-slate-500 block mb-1">Magnitude {load.type === 'distributed' && '(Start)'}</label>
                                <div className="relative">
                                    <input type="number" className="w-full text-sm border-slate-300 rounded p-1.5 border pr-8" value={load.magnitude} onChange={e => updateLoad(load.id, { magnitude: Number(e.target.value) })}/>
                                    <span className="absolute right-2 top-1.5 text-xs text-slate-400">{load.type === 'moment' ? 'kNm' : 'kN'}</span>
                                </div>
                            </div>

                            {load.type === 'distributed' && (
                                <div>
                                    <label className="text-xs text-slate-500 block mb-1">Magnitude (End)</label>
                                    <div className="relative">
                                        <input type="number" className="w-full text-sm border-slate-300 rounded p-1.5 border pr-8" value={load.endMagnitude ?? load.magnitude} onChange={e => updateLoad(load.id, { endMagnitude: Number(e.target.value) })}/>
                                        <span className="absolute right-2 top-1.5 text-xs text-slate-400">kN/m</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                {config.loads.length === 0 && <p className="text-xs text-slate-500 italic text-center">No loads applied.</p>}
            </div>
        </div>

        <div className="flex gap-2">
            <button 
                onClick={() => onChange({ supports: [], loads: [] })}
                className="flex-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-medium py-2 px-4 rounded-md transition-colors text-sm"
            >
                Clear All
            </button>
            <button 
                onClick={() => onChange({ 
                    length: 12, 
                    supports: [{ id: uuidv4(), x: 0, type: 'fixed' }], 
                    loads: [{ id: uuidv4(), type: 'distributed', x: 0, endX: 12, magnitude: -5 }]
                })}
                className="flex-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-medium py-2 px-4 rounded-md transition-colors text-sm"
            >
                Cantilever Example
            </button>
        </div>
      </div>
    </div>
  );
};
