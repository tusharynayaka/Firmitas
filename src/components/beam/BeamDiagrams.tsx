import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import type { BeamConfig, BeamResult, BeamPointData } from '../../types/beam.types';

interface BeamDiagramsProps {
  config: BeamConfig;
  result: BeamResult;
}

export const BeamDiagrams: React.FC<BeamDiagramsProps> = ({ config, result }) => {
  const data = result.points.map(p => ({
    x: Number(p.x.toFixed(2)),
    v: p.v,
    m: p.m,
    d: p.d * 1000 // Convert m to mm for display
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 border border-slate-700 p-3 rounded-lg shadow-xl text-slate-200 text-xs">
          <p className="font-semibold text-white mb-1">Position: {label} m</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {entry.value.toExponential(3)} {entry.dataKey === 'v' ? 'kN' : entry.dataKey === 'm' ? 'kNm' : 'mm'}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8">
        
        {/* Support Reactions Output */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {result.reactions.map((r, i) => (
                <div key={i} className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <p className="text-xs text-slate-500 font-medium">Support at {r.x.toFixed(2)}m</p>
                    <p className="text-sm font-semibold text-slate-800">Ry: {r.R.toExponential(3)} kN</p>
                    {Math.abs(r.M) > 0 && <p className="text-sm font-semibold text-slate-800">M: {r.M.toExponential(3)} kNm</p>}
                </div>
            ))}
        </div>

      {/* Shear Force Diagram */}
      <div>
        <h3 className="text-sm font-semibold text-slate-700 mb-2">Shear Force Diagram (V)</h3>
        <div className="h-48 bg-white border border-slate-100 rounded-lg p-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="x" type="number" domain={[0, config.length]} tick={{fontSize: 10, fill: '#64748b'}} />
              <YAxis tick={{fontSize: 10, fill: '#64748b'}} tickFormatter={v => v.toExponential(1)}/>
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={0} stroke="#94a3b8" />
              <Area type="monotone" dataKey="v" name="Shear" stroke="#3b82f6" fillOpacity={0.2} fill="#3b82f6" isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bending Moment Diagram */}
      <div>
        <h3 className="text-sm font-semibold text-slate-700 mb-2">Bending Moment Diagram (M)</h3>
        <div className="h-48 bg-white border border-slate-100 rounded-lg p-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="x" type="number" domain={[0, config.length]} tick={{fontSize: 10, fill: '#64748b'}} />
              <YAxis tick={{fontSize: 10, fill: '#64748b'}} tickFormatter={v => v.toExponential(1)} />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={0} stroke="#94a3b8" />
              {/* In engineering, moment diagrams are often drawn on the tension side (flipped). We'll keep standard math plotting for now */}
              <Area type="step" dataKey="m" name="Moment" stroke="#ef4444" fillOpacity={0.2} fill="#ef4444" isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Deflection Diagram */}
      <div>
        <h3 className="text-sm font-semibold text-slate-700 mb-2">Deflection (δ)</h3>
        <div className="h-48 bg-white border border-slate-100 rounded-lg p-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="x" type="number" domain={[0, config.length]} tick={{fontSize: 10, fill: '#64748b'}} />
              <YAxis tick={{fontSize: 10, fill: '#64748b'}} tickFormatter={v => v.toExponential(1)} />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={0} stroke="#94a3b8" />
              <Area type="monotone" dataKey="d" name="Deflection" stroke="#10b981" fillOpacity={0} strokeWidth={2} strokeDasharray="5 5" isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
};
