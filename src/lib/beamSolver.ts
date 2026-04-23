import { evaluate, inv, multiply, add, zeros, Matrix, matrix } from 'mathjs';
import type { BeamConfig, BeamResult, BeamPointData, BeamSupport, SupportType } from '../types/beam.types';

export function solveBeam(config: BeamConfig, numElements: number = 100): BeamResult | null {
  try {
    const { length, supports, loads, material } = config;
    const { E, I } = material;
    
    // EI
    const EI = E * I;
    
    // Nodes
    const L_el = length / numElements;
    const numNodes = numElements + 1;
    const totalDof = numNodes * 2; // 2 DOF per node: [v, theta]
    
    // Initialize global stiffness K and force vector F
    // mathjs matrices are easier. But using nested arrays is also fine.
    const K = Array.from({ length: totalDof }, () => new Float64Array(totalDof));
    const F = new Float64Array(totalDof);
    
    // Assemble stiffness
    for (let i = 0; i < numElements; i++) {
        const k_el = [
            [12, 6 * L_el, -12, 6 * L_el],
            [6 * L_el, 4 * L_el * L_el, -6 * L_el, 2 * L_el * L_el],
            [-12, -6 * L_el, 12, -6 * L_el],
            [6 * L_el, 2 * L_el * L_el, -6 * L_el, 4 * L_el * L_el]
        ];
        
        const mult = EI / Math.pow(L_el, 3);
        const dofIndices = [2 * i, 2 * i + 1, 2 * i + 2, 2 * i + 3];
        
        for (let r = 0; r < 4; r++) {
            for (let c = 0; c < 4; c++) {
                K[dofIndices[r]][dofIndices[c]] += k_el[r][c] * mult;
            }
        }
    }
    
    // Handle specific loads
    // Point loads / moments
    loads.filter(l => l.type === 'point' || l.type === 'moment').forEach(load => {
        // Find closest node
        let closestNode = Math.round((load.x / length) * numElements);
        closestNode = Math.max(0, Math.min(numNodes - 1, closestNode));
        if (load.type === 'point') {
            F[2 * closestNode] += load.magnitude; // magnitude > 0 is up.
        } else if (load.type === 'moment') {
            F[2 * closestNode + 1] += load.magnitude; // CCW is positive
        }
    });
    
    // Distributed loads
    loads.filter(l => l.type === 'distributed').forEach(load => {
        const startX = load.x;
        const endX = load.endX!;
        const qStart = load.magnitude;
        const qEnd = load.endMagnitude ?? load.magnitude;
        
        // Loop over elements, check if element intersects load
        for (let i = 0; i < numElements; i++) {
            const elStart = i * L_el;
            const elEnd = (i + 1) * L_el;
            
            // If element is completely outside load
            if (elEnd <= startX || elStart >= endX) continue;
            
            // Interaction segment
            const segStart = Math.max(startX, elStart);
            const segEnd = Math.min(endX, elEnd);
            const segL = segEnd - segStart;
            if (segL <= 1e-10) continue;
            
            // Interpolate q at segStart and segEnd
            const fracStart = (segStart - startX) / (endX - startX);
            const fracEnd = (segEnd - startX) / (endX - startX);
            const q1 = qStart + fracStart * (qEnd - qStart);
            const q2 = qStart + fracEnd * (qEnd - qStart);
            const qAvg = (q1 + q2) / 2; // Approximate as uniform for small elements
            
            // Apply equivalent nodal forces to element nodes.
            // A more exact integration is better, but since elements are small, uniform approx is usually fine.
            // Using local forces for element based on global position:
            // For simplicity, add to closest nodes or apply fixed end forces
            // Fixed end forces for uniform load on element: P = qL/2, M = qL^2/12
            // Since the load might not cover the whole element, we use the fraction.
            const P = qAvg * segL / 2;
            const M = qAvg * segL * segL / 12;
            
            F[2 * i] += P;
            F[2 * i + 1] += M;
            F[2 * i + 2] += P;
            F[2 * i + 3] -= M;
        }
    });

    // Apply boundary conditions (supports)
    const fixedDofs = new Set<number>();
    const nodeSupports = new Map<number, SupportType>();
    
    supports.forEach(sup => {
        let closestNode = Math.round((sup.x / length) * numElements);
        closestNode = Math.max(0, Math.min(numNodes - 1, closestNode));
        nodeSupports.set(closestNode, sup.type);
        
        if (sup.type === 'pin' || sup.type === 'roller') {
            fixedDofs.add(2 * closestNode); // Fix vertical
        } else if (sup.type === 'fixed') {
            fixedDofs.add(2 * closestNode); // Fix vertical
            fixedDofs.add(2 * closestNode + 1); // Fix rotation
        }
    });
    
    // Check if stable (at least two vertical constraints or one fixed)
    if (fixedDofs.size < 2) {
        // Technically 1 fixed is enough (2 dofs). Let's just check fixedDofs size
        if (fixedDofs.size < 2) return null; // Unstable
    }

    // Solve Kd = F -> Partition matrices
    // Instead of rearranging, set diagonal to 1 and row/col to 0 for fixed DOFs
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

    // Invert K_solve and multiply with F_solve
    let U: number[];
    try {
        const K_inv = inv(K_solve.map(row => Array.from(row)));
        U = multiply(K_inv, Array.from(F_solve)) as number[];
    } catch(e) {
        return null; // Singular matrix
    }

    // Recover reactions
    const reactF = new Float64Array(totalDof);
    const K_mat = K; // Original K
    for (let r = 0; r < totalDof; r++) {
        let sum = 0;
        for (let c = 0; c < totalDof; c++) {
            sum += K_mat[r][c] * U[c];
        }
        reactF[r] = sum - F[r]; // Reaction = Ku - applied force
    }

    const reactions = [];
    nodeSupports.forEach((type, node) => {
        reactions.push({
            x: node * L_el,
            R: Math.abs(reactF[2 * node]) > 1e-6 ? reactF[2 * node] : 0,
            M: Math.abs(reactF[2 * node + 1]) > 1e-6 ? reactF[2 * node + 1] : 0,
        });
    });

    // Calculate V, M, Deflection along the beam
    const points: BeamPointData[] = [];
    let maxV = 0;
    let maxM = 0;
    let maxD = 0;

    for (let i = 0; i < numElements; i++) {
        const x = i * L_el;
        const v1 = U[2 * i];
        const theta1 = U[2 * i + 1];
        const v2 = U[2 * i + 2];
        const theta2 = U[2 * i + 3];
        
        // At element start (local x=0)
        // From stiffness eq: {f} = [k]{u}
        // f_y1 = V, M_1 = -M
        // More directly, M = EI * d2v/dx2, V = dM/dx
        // For FEM beam element, shape functions:
        // M(x) = (6x/L^2 - 6/L)v1 + (3x/L - 4)theta1 + (-6x/L^2 + 6/L)v2 + (3x/L - 2)theta2 * EI / L
        // at x=0: M = EI/L * ( -6/L v1 - 4 theta1 + 6/L v2 - 2 theta2 )
        const M_val = (EI / L_el) * (-6 / L_el * v1 - 4 * theta1 + 6 / L_el * v2 - 2 * theta2);
        // V = EI * d3v/dx3 (constant for element without distributed load, but we approximated Q)
        // Constant V: V = EI/L^3 * (12v1 + 6L theta1 - 12v2 + 6L theta2)
        const V_val = (EI / Math.pow(L_el, 3)) * (12 * v1 + 6 * L_el * theta1 - 12 * v2 + 6 * L_el * theta2);

        points.push({ x, v: V_val, m: M_val, d: v1 });

        if (Math.abs(V_val) > Math.abs(maxV)) maxV = V_val;
        if (Math.abs(M_val) > Math.abs(maxM)) maxM = M_val;
        if (Math.abs(v1) > Math.abs(maxD)) maxD = v1;
    }
    
    // Add last node
    const lastNode = numNodes - 1;
    points.push({ x: length, v: points[points.length-1].v, m: 0, d: U[2 * lastNode] }); // M is approx 0 or from reaction

    return {
        reactions,
        maxShear: maxV,
        maxMoment: maxM,
        maxDeflection: maxD,
        points
    };
  } catch (err) {
      console.error(err);
      return null;
  }
}
