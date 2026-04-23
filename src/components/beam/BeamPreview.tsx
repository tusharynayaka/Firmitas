import React from 'react';
import type { BeamConfig, BeamSupport, BeamLoad } from '../../types/beam.types';

interface BeamPreviewProps {
  config: BeamConfig;
}

export const BeamPreview: React.FC<BeamPreviewProps> = ({ config }) => {
  const W = 800; // Inner coordinate width
  const H = 220; // Total height
  const padX = 60; // Left and right padding
  const beamY = 110; // Center Y of the beam
  const bH = 12; // Beam thickness

  const scale = W / Math.max(config.length, 0.1);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col">
      <h2 className="text-lg font-semibold text-slate-900 mb-4">Beam Model Preview</h2>
      <div className="w-full overflow-hidden bg-slate-50 border border-slate-200 rounded-lg">
        <svg viewBox={`0 0 ${W + padX * 2} ${H}`} className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#ef4444" />
            </marker>
            <marker id="arrow-moment" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#f59e0b" />
            </marker>
            <pattern id="fixed-hatch" width="8" height="8" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
              <line x1="0" y1="0" x2="0" y2="8" stroke="#94a3b8" strokeWidth="2" />
            </pattern>
            <pattern id="fixed-hatch-left" width="8" height="8" patternTransform="rotate(-45 0 0)" patternUnits="userSpaceOnUse">
              <line x1="0" y1="0" x2="0" y2="8" stroke="#94a3b8" strokeWidth="2" />
            </pattern>
          </defs>

          {/* Rulers / Dimensions */}
          <line x1={padX} y1={H - 20} x2={padX + W} y2={H - 20} stroke="#cbd5e1" strokeWidth="1" />
          <line x1={padX} y1={H - 25} x2={padX} y2={H - 15} stroke="#cbd5e1" strokeWidth="1" />
          <line x1={padX + W} y1={H - 25} x2={padX + W} y2={H - 15} stroke="#cbd5e1" strokeWidth="1" />
          <text x={padX + W / 2} y={H - 5} textAnchor="middle" fill="#64748b" fontSize="12" fontWeight="500">
            L = {config.length} m
          </text>

          {/* Supports */}
          {config.supports.map(sup => {
            const sx = padX + sup.x * scale;
            const bottomY = beamY + bH / 2;

            if (sup.type === 'fixed') {
              const isRight = sup.x > config.length * 0.5;
              return (
                <g key={sup.id}>
                  <rect x={sx + (isRight ? 0 : -15)} y={beamY - 30} width={15} height={60} fill="url(#fixed-hatch)" stroke="#64748b" strokeWidth="2" />
                  <line x1={sx} y1={beamY - 30} x2={sx} y2={beamY + 30} stroke="#1e293b" strokeWidth="4" />
                </g>
              );
            }
            if (sup.type === 'pin') {
              return (
                <g key={sup.id}>
                  <polygon points={`${sx},${bottomY} ${sx - 12},${bottomY + 20} ${sx + 12},${bottomY + 20}`} fill="#f1f5f9" stroke="#64748b" strokeWidth="2" strokeLinejoin="round" />
                  <line x1={sx - 18} y1={bottomY + 20} x2={sx + 18} y2={bottomY + 20} stroke="#64748b" strokeWidth="3" strokeLinecap="round" />
                </g>
              );
            }
            if (sup.type === 'roller') {
              return (
                <g key={sup.id}>
                  <polygon points={`${sx},${bottomY} ${sx - 12},${bottomY + 16} ${sx + 12},${bottomY + 16}`} fill="#f1f5f9" stroke="#64748b" strokeWidth="2" strokeLinejoin="round" />
                  <circle cx={sx - 6} cy={bottomY + 20} r="4" fill="#f1f5f9" stroke="#64748b" strokeWidth="2" />
                  <circle cx={sx + 6} cy={bottomY + 20} r="4" fill="#f1f5f9" stroke="#64748b" strokeWidth="2" />
                  <line x1={sx - 18} y1={bottomY + 24} x2={sx + 18} y2={bottomY + 24} stroke="#64748b" strokeWidth="3" strokeLinecap="round" />
                </g>
              );
            }
            return null;
          })}

          {/* Beam Body */}
          <rect
            x={padX}
            y={beamY - bH / 2}
            width={W}
            height={bH}
            fill="#cbd5e1"
            stroke="#64748b"
            strokeWidth="2"
            rx="2"
          />

          {/* Loads */}
          {config.loads.map(load => {
            const sx = padX + (load.x * scale);
            const mag = load.magnitude;

            if (load.type === 'point') {
              const isDown = mag <= 0;
              const yStart = isDown ? beamY - 60 : beamY + 60;
              const yEnd = isDown ? beamY - bH / 2 - 2 : beamY + bH / 2 + 2;

              return (
                <g key={load.id}>
                  <line
                    x1={sx} y1={yStart}
                    x2={sx} y2={yEnd}
                    stroke="#ef4444" strokeWidth="3"
                    markerEnd="url(#arrow)"
                  />
                  <text x={sx} y={isDown ? yStart - 8 : yStart + 16} textAnchor="middle" fill="#ef4444" fontSize="13" fontWeight="bold">
                    {Math.abs(mag)} kN
                  </text>
                </g>
              );
            }

            if (load.type === 'distributed') {
              const loadX = Number(load.x) || 0;
              const endX = Number(load.endX) || loadX;
              const sx = padX + (loadX * scale);
              const ex = padX + Math.min(Number(config.length) || 1, endX || (Number(config.length) || 1)) * scale;
              const width = Math.max(2, ex - sx);
              
              const mag1 = Number(load.magnitude) || 0;
              const mag2 = (load.endMagnitude !== undefined && load.endMagnitude !== '') ? Number(load.endMagnitude) : mag1;
              
              const maxMag = Math.max(0.1, Math.abs(mag1), Math.abs(mag2));
              const h1 = (Math.abs(mag1) / maxMag) * 40;
              const h2 = (Math.abs(mag2) / maxMag) * 40;
              
              const isUp1 = mag1 > 0;
              const isUp2 = mag2 > 0;
              
              const yTop = beamY - bH / 2 - 2;
              const yBot = beamY + bH / 2 + 2;
              
              const yBase1 = isUp1 ? yBot : yTop;
              const yEnd1 = isUp1 ? yBot + h1 : yTop - h1;
              
              const yBase2 = isUp2 ? yBot : yTop;
              const yEnd2 = isUp2 ? yBot + h2 : yTop - h2;

              const points = `${sx},${yBase1} ${sx},${yEnd1} ${ex},${yEnd2} ${ex},${yBase2}`;

              const arrows = [];
              const numArrows = Math.max(2, Math.floor(width / 20));
              const step = width / numArrows;
              
              for (let i = 0; i <= numArrows; i++) {
                const cx = sx + i * step;
                const t = numArrows === 0 ? 0 : i / numArrows;
                const magT = mag1 + t * (mag2 - mag1);
                
                if (Math.abs(magT) < 0.1) continue;
                
                const isUpT = magT > 0;
                const hT = (Math.abs(magT) / maxMag) * 40;
                const yBT = isUpT ? yBot : yTop;
                const yET = isUpT ? yBot + hT : yTop - hT;
                
                arrows.push(
                  <line key={i} x1={cx} y1={yET} x2={cx} y2={yBT} stroke="#ef4444" strokeWidth="1.5" markerEnd="url(#arrow)" />
                );
              }

              return (
                <g key={load.id}>
                  <polygon points={points} fill="#fee2e2" opacity="0.4" stroke="#ef4444" strokeWidth="1" />
                  {arrows}
                  <text x={sx} y={mag1 > 0 ? yEnd1 + 15 : yEnd1 - 5} textAnchor="middle" fill="#ef4444" fontSize="11" fontWeight="bold">
                    {mag1}
                  </text>
                  <text x={ex} y={mag2 > 0 ? yEnd2 + 15 : yEnd2 - 5} textAnchor="middle" fill="#ef4444" fontSize="11" fontWeight="bold">
                    {mag2}
                  </text>
                </g>
              );
            }

            if (load.type === 'moment') {
              const isCW = mag < 0; 
              // A semi-circle arc for moment
              return (
                <g key={load.id}>
                  <path
                    d={`M ${sx - 20} ${beamY} A 20 20 0 1 ${isCW ? 1 : 0} ${sx + 20} ${beamY + (isCW ? 5 : -5)}`}
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="3"
                    markerEnd="url(#arrow-moment)"
                  />
                  <text x={sx} y={beamY - 28} textAnchor="middle" fill="#f59e0b" fontSize="13" fontWeight="bold">
                    {Math.abs(mag)} kNm
                  </text>
                </g>
              );
            }

            return null;
          })}
        </svg>
      </div>
    </div>
  );
};
