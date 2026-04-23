export interface TrussNode {
  id: string;
  x: number;
  y: number;
}

export interface TrussMember {
  id: string;
  source: string;
  target: string;
  E: number; // Young's modulus
  A: number; // Cross-sectional area
}

export interface TrussSupport {
  nodeId: string;
  rx: boolean; // Constraint in x
  ry: boolean; // Constraint in y
}

export interface TrussLoad {
  id: string;
  nodeId: string;
  fx: number;
  fy: number;
}

export interface TrussConfig {
  nodes: TrussNode[];
  members: TrussMember[];
  supports: TrussSupport[];
  loads: TrussLoad[];
}

export interface MemberResult {
  id: string;
  force: number;
  stress: number;
  isTension: boolean;
  isZero: boolean;
}

export interface ReactionResult {
  nodeId: string;
  fx: number;
  fy: number;
}

export interface TrussResult {
  memberResults: MemberResult[];
  reactions: ReactionResult[];
  displacements: { nodeId: string; dx: number; dy: number }[];
}
