import React, { useState, useMemo, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { BeamConfig, BeamSupport, BeamLoad, BeamResult } from '../../types/beam.types';
import { solveBeam } from '../../lib/beamSolver';
import { BeamInputs } from './BeamInputs';
import { BeamDiagrams } from './BeamDiagrams';
import { BeamPreview } from './BeamPreview';
import { exportAsPNG, exportAsCSV } from '../../lib/exportUtils';

const DEFAULT_CONFIG: BeamConfig = {
  length: 10, // m
  supports: [
    { id: uuidv4(), x: 0, type: 'pin' },
    { id: uuidv4(), x: 10, type: 'roller' },
  ],
  loads: [
    { id: uuidv4(), type: 'point', x: 5, magnitude: -10 } // 10 kN downwards
  ],
  material: {
    E: 200e9, // 200 GPa (Steel) -> N/m^2
    I: 0.0001 // m^4
  }
};

export const BeamCalculator = () => {
  const [config, setConfig] = useState<BeamConfig>(DEFAULT_CONFIG);
  const [result, setResult] = useState<BeamResult | null>(null);

  // Debounced solving
  useEffect(() => {
    const handler = setTimeout(() => {
      const res = solveBeam(config, 200); // 200 elements for smooth curves
      setResult(res);
    }, 100);
    return () => clearTimeout(handler);
  }, [config]);

  const updateConfig = (newConfig: Partial<BeamConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-4 space-y-6">
        <BeamInputs config={config} onChange={updateConfig} />
      </div>
      <div className="lg:col-span-8 flex flex-col gap-6">
        <BeamPreview config={config} />
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 h-full flex flex-col">
            <div className="flex justify-between items-start mb-6">
                <h2 className="text-lg font-semibold text-slate-900">Analysis Results</h2>
                <div className="flex gap-2">
                    <button onClick={() => exportAsCSV(result?.points || [], 'beam-results')} className="p-2 text-sm text-slate-600 hover:text-indigo-600 bg-slate-100 hover:bg-indigo-50 rounded flex items-center gap-1 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg> CSV
                    </button>
                    <button onClick={() => exportAsPNG('beam-diagrams-container', 'beam-diagrams')} className="p-2 text-sm text-slate-600 hover:text-indigo-600 bg-slate-100 hover:bg-indigo-50 rounded flex items-center gap-1 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg> PNG
                    </button>
                </div>
            </div>
            
            <div id="beam-diagrams-container" className="flex-1">
                {result ? (
                    <BeamDiagrams config={config} result={result} />
                ) : (
                    <div className="h-64 flex items-center justify-center text-slate-500 bg-slate-50 rounded-lg border border-dashed border-slate-300">
                        Structure is unstable or invalid inputs. Please check supports and configuration.
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};
