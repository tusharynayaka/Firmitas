import { inv, multiply } from 'mathjs';
import type { TrussConfig, TrussResult, MemberResult, ReactionResult } from '../types/truss.types';

export function solveTruss(config: TrussConfig): TrussResult | null {
  try {
    const { nodes, members, supports, loads } = config;
    
    // Map node IDs to indices
    const nodeMap = new Map<string, number>();
    nodes.forEach((n, i) => nodeMap.set(n.id, i));
    
    const numNodes = nodes.length;
    const totalDof = numNodes * 2;
    
    // Initialize global stiffness K and force vector F
    const K = Array.from({ length: totalDof }, () => new Float64Array(totalDof));
    const F = new Float64Array(totalDof);
    
    // Assemble stiffness matrix
    members.forEach(member => {
        const iNode = nodeMap.get(member.source);
        const jNode = nodeMap.get(member.target);
        if (iNode === undefined || jNode === undefined) return;
        
        const n1 = nodes[iNode];
        const n2 = nodes[jNode];
        
        const dx = n2.x - n1.x;
        const dy = n2.y - n1.y;
        const L = Math.sqrt(dx * dx + dy * dy);
        if (L === 0) return;
        
        const c = dx / L;
        const s = dy / L;
        const k = (member.E * member.A) / L;
        
        const k_local = [
            [c * c, c * s, -c * c, -c * s],
            [c * s, s * s, -c * s, -s * s],
            [-c * c, -c * s, c * c, c * s],
            [-c * s, -s * s, c * s, s * s]
        ];
        
        const dofIndices = [2 * iNode, 2 * iNode + 1, 2 * jNode, 2 * jNode + 1];
        
        for (let r = 0; r < 4; r++) {
            for (let c_idx = 0; c_idx < 4; c_idx++) {
                K[dofIndices[r]][dofIndices[c_idx]] += k * k_local[r][c_idx];
            }
        }
    });
    
    // Apply loads
    loads.forEach(load => {
        const idx = nodeMap.get(load.nodeId);
        if (idx !== undefined) {
            F[2 * idx] += load.fx;
            F[2 * idx + 1] += load.fy;
        }
    });
    
    // Apply boundary conditions
    const fixedDofs = new Set<number>();
    supports.forEach(sup => {
        const idx = nodeMap.get(sup.nodeId);
        if (idx !== undefined) {
            if (sup.rx) fixedDofs.add(2 * idx);
            if (sup.ry) fixedDofs.add(2 * idx + 1);
        }
    });
    
    if (fixedDofs.size < 3) return null; // Unstable (need at least 3 constraints to prevent rigid body motion in 2D)
    
    const K_solve = K.map(row => new Float64Array(row));
    const F_solve = new Float64Array(F);
    
    fixedDofs.forEach(dof => {
        for (let i = 0; i < totalDof; i++) {
            K_solve[dof][i] = 0;
            K_solve[i][dof] = 0;
        }
        K_solve[dof][dof] = 1;
        F_solve[dof] = 0;
    });
    
    // Solve for displacements
    let U: number[];
    try {
        const K_inv = inv(K_solve.map(row => Array.from(row)));
        U = multiply(K_inv, Array.from(F_solve)) as number[];
    } catch(e) {
        return null; // Singular matrix
    }
    
    // Calculate internal forces
    const memberResults: MemberResult[] = [];
    members.forEach(member => {
        const iNode = nodeMap.get(member.source)!;
        const jNode = nodeMap.get(member.target)!;
        
        const n1 = nodes[iNode];
        const n2 = nodes[jNode];
        
        const dx = n2.x - n1.x;
        const dy = n2.y - n1.y;
        const L = Math.sqrt(dx * dx + dy * dy);
        
        const c = dx / L;
        const s = dy / L;
        
        const u1 = U[2 * iNode];
        const v1 = U[2 * iNode + 1];
        const u2 = U[2 * jNode];
        const v2 = U[2 * jNode + 1];
        
        const force = (member.E * member.A / L) * (c * (u2 - u1) + s * (v2 - v1));
        
        memberResults.push({
            id: member.id,
            force: Math.abs(force) > 1e-6 ? Math.abs(force) : 0,
            stress: Math.abs(force / member.A),
            isTension: force > 1e-6,
            isZero: Math.abs(force) <= 1e-6
        });
    });
    
    // Recover reactions
    const reactF = new Float64Array(totalDof);
    const K_mat = K; 
    for (let r = 0; r < totalDof; r++) {
        let sum = 0;
        for (let c = 0; c < totalDof; c++) {
            sum += K_mat[r][c] * U[c];
        }
        reactF[r] = sum - F[r];
    }
    
    const reactions: ReactionResult[] = [];
    supports.forEach(sup => {
        const idx = nodeMap.get(sup.nodeId)!;
        reactions.push({
            nodeId: sup.nodeId,
            fx: Math.abs(reactF[2 * idx]) > 1e-6 ? reactF[2 * idx] : 0,
            fy: Math.abs(reactF[2 * idx + 1]) > 1e-6 ? reactF[2 * idx + 1] : 0
        });
    });
    
    const displacements = nodes.map(n => {
        const idx = nodeMap.get(n.id)!;
        return {
            nodeId: n.id,
            dx: U[2 * idx],
            dy: U[2 * idx + 1]
        };
    });
    
    return { memberResults, reactions, displacements };
  } catch (err) {
      console.error(err);
      return null;
  }
}
