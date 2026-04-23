import React, { useState } from 'react';
import { Download, Table } from 'lucide-react';
import type { TrussConfig, TrussResult } from '../../types/truss.types';
import { exportAsPNG, exportAsCSV } from '../../lib/exportUtils';

interface TrussDiagramProps {
    config: TrussConfig;
    result: TrussResult;
}

export const TrussDiagram: React.FC<TrussDiagramProps> = ({ config, result }) => {
    const [hoveredMember, setHoveredMember] = useState<string | null>(null);

    const handleExportPNG = () => exportAsPNG('truss-diagram-container', 'truss-analysis');
    const handleExportCSV = () => {
        const csvData = result.memberResults.map(r => ({
            MemberID: r.id,
            Force_kN: (r.force / 1000).toFixed(3),
            Type: r.isZero ? 'Zero' : r.isTension ? 'Tension' : 'Compression'
        }));
        exportAsCSV(csvData, 'truss-results');
    };

    // Find bounding box to scale SVG

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    config.nodes.forEach(n => {
        if (n.x < minX) minX = n.x;
        if (n.x > maxX) maxX = n.x;
        if (n.y < minY) minY = n.y;
        if (n.y > maxY) maxY = n.y;
    });

    // Add padding
    const paddingX = (maxX - minX) * 0.1 || 2;
    const paddingY = (maxY - minY) * 0.2 || 2;
    
    // ViewBox sizing
    const vbMinX = minX - paddingX;
    const vbMaxX = maxX + paddingX;
    const vbMinY = minY - paddingY; // Note: SVG y is down, but typically in engineering Y is up. We will flip Y in transform.
    const vbMaxY = maxY + paddingY;
    const vbWidth = vbMaxX - vbMinX;
    const vbHeight = vbMaxY - vbMinY;

    return (
        <div className="flex-1 flex flex-col gap-4">
            <div className="flex-1 bg-slate-50 border border-slate-200 rounded-lg overflow-hidden relative min-h-[400px]">
                <svg 
                    width="100%" 
                    height="100%" 
                    viewBox={`${vbMinX} ${-vbMaxY} ${vbWidth} ${vbHeight}`} 
                    preserveAspectRatio="xMidYMid meet"
                    className="absolute inset-0"
                >
                    {/* Y is flipped in viewBox (-vbMaxY) and we flip elements with transform scaleY(-1) */}
                    <g transform={`scale(1, -1)`}>
                        {/* Grid/Axes could go here */}

                        {/* Members */}
                        {config.members.map(member => {
                            const n1 = config.nodes.find(n => n.id === member.source);
                            const n2 = config.nodes.find(n => n.id === member.target);
                            if (!n1 || !n2) return null;

                            const res = result.memberResults.find(r => r.id === member.id);
                            const isHovered = hoveredMember === member.id;
                            
                            // Color coding: Compression = red, Tension = green, Zero = gray
                            let strokeColor = '#94a3b8'; // default gray
                            if (res) {
                                if (res.isZero) strokeColor = '#94a3b8';
                                else if (res.isTension) strokeColor = '#10b981'; // Green
                                else strokeColor = '#ef4444'; // Red
                            }

                            return (
                                <g key={member.id}>
                                    <line 
                                        x1={n1.x} y1={n1.y} 
                                        x2={n2.x} y2={n2.y} 
                                        stroke={strokeColor} 
                                        strokeWidth={isHovered ? vbWidth * 0.015 : vbWidth * 0.008} 
                                        strokeLinecap="round"
                                        onMouseEnter={() => setHoveredMember(member.id)}
                                        onMouseLeave={() => setHoveredMember(null)}
                                        className="transition-all cursor-pointer"
                                    />
                                    {/* Invisible thicker line for easier hovering */}
                                    <line 
                                        x1={n1.x} y1={n1.y} 
                                        x2={n2.x} y2={n2.y} 
                                        stroke="transparent" 
                                        strokeWidth={vbWidth * 0.04} 
                                        onMouseEnter={() => setHoveredMember(member.id)}
                                        onMouseLeave={() => setHoveredMember(null)}
                                        className="cursor-pointer"
                                    />
                                </g>
                            );
                        })}

                        {/* Nodes */}
                        {config.nodes.map(node => (
                            <circle 
                                key={node.id} 
                                cx={node.x} 
                                cy={node.y} 
                                r={vbWidth * 0.015} 
                                fill="#fff" 
                                stroke="#1e293b" 
                                strokeWidth={vbWidth * 0.005} 
                            />
                        ))}

                        {/* Loads */}
                        {config.loads.map(load => {
                            const n = config.nodes.find(node => node.id === load.nodeId);
                            if (!n) return null;
                            const forceDir = load.fy < 0 ? -1 : 1; // Simplify to vertical drawing
                            const arrowLen = vbHeight * 0.15;
                            // Arrow points TO the node if downward
                            const y1 = n.y - forceDir * arrowLen;
                            const y2 = n.y; // close to node
                            
                            return (
                                <g key={`load-${load.id}`}>
                                    {Math.abs(load.fy) > 0 && (
                                        <>
                                            <line x1={n.x} y1={y1} x2={n.x} y2={y2 + (forceDir < 0 ? vbHeight*0.02 : -vbHeight*0.02)} stroke="#ea580c" strokeWidth={vbWidth * 0.008} />
                                            {/* Arrow head */}
                                            <polygon 
                                                points={`${n.x},${y2} ${n.x - vbWidth*0.015},${y2 - forceDir*vbHeight*0.03} ${n.x + vbWidth*0.015},${y2 - forceDir*vbHeight*0.03}`} 
                                                fill="#ea580c" 
                                            />
                                            {/* Text needs to be flipped hack to display correctly */}
                                            <g transform={`translate(${n.x + vbWidth*0.02}, ${y1 + forceDir*arrowLen/2}) scale(1, -1)`}>
                                                <text fill="#ea580c" fontSize={vbWidth * 0.025} fontWeight="bold">
                                                    {(Math.abs(load.fy)/1000).toFixed(1)} kN
                                                </text>
                                            </g>
                                        </>
                                    )}
                                </g>
                            )
                        })}

                        {/* Supports */}
                        {config.supports.map(sup => {
                            const n = config.nodes.find(node => node.id === sup.nodeId);
                            if (!n) return null;
                            const size = vbWidth * 0.03;
                            if (sup.rx && sup.ry) {
                                // Pin support (triangle)
                                return (
                                    <polygon 
                                        key={`sup-${sup.nodeId}`}
                                        points={`${n.x},${n.y - size*0.1} ${n.x - size},${n.y - size*1.5} ${n.x + size},${n.y - size*1.5}`}
                                        fill="#e2e8f0" stroke="#64748b" strokeWidth={vbWidth*0.004}
                                    />
                                );
                            } else if (sup.ry) {
                                // Roller (circle)
                                return (
                                    <circle 
                                        key={`sup-${sup.nodeId}`}
                                        cx={n.x} cy={n.y - size*0.8} r={size*0.6}
                                        fill="#e2e8f0" stroke="#64748b" strokeWidth={vbWidth*0.004}
                                    />
                                )
                            }
                            return null;
                        })}
                    </g>
                </svg>
            </div>

            {/* Results Legend & Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm">
                    <h4 className="font-semibold text-slate-800 mb-2">Legend</h4>
                    <div className="flex gap-4">
                        <div className="flex items-center gap-2"><div className="w-4 h-1 bg-emerald-500 rounded-full"></div><span>Tension</span></div>
                        <div className="flex items-center gap-2"><div className="w-4 h-1 bg-rose-500 rounded-full"></div><span>Compression</span></div>
                        <div className="flex items-center gap-2"><div className="w-4 h-1 bg-slate-400 rounded-full"></div><span>Zero Force</span></div>
                    </div>
                </div>
                
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm min-h-[5rem]">
                    <h4 className="font-semibold text-slate-800 mb-1">Member Inspector</h4>
                    {hoveredMember ? (() => {
                        const res = result.memberResults.find(r => r.id === hoveredMember);
                        if (!res) return <span className="text-slate-400 italic">No data</span>;
                        return (
                            <div>
                                <span className="font-mono bg-slate-200 px-1 py-0.5 rounded mr-2">{res.id}</span>
                                <span className={`font-semibold ${res.isZero ? 'text-slate-500' : res.isTension ? 'text-emerald-600' : 'text-rose-600'}`}>
                                    {(res.force / 1000).toFixed(2)} kN {res.isZero ? '' : res.isTension ? '(Tension)' : '(Compression)'}
                                </span>
                            </div>
                        )
                    })() : (
                        <span className="text-slate-400 italic">Hover over a member in the diagram...</span>
                    )}
                </div>
            </div>
        </div>
    );
};
