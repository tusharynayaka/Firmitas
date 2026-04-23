export type SupportType = 'pin' | 'roller' | 'fixed' | 'free';

export interface BeamSupport {
  id: string;
  x: number | '';
  type: SupportType;
}

export type LoadType = 'point' | 'distributed' | 'moment';

export interface BeamLoad {
  id: string;
  type: LoadType;
  x: number | '';
  endX?: number | '';
  magnitude: number | ''; 
  endMagnitude?: number | ''; 
}

export interface BeamMaterial {
  E: number; 
  I: number; 
}

export interface BeamConfig {
  length: number | '';
  supports: BeamSupport[];
  loads: BeamLoad[];
  material: BeamMaterial;
}

export interface BeamPointData {
  x: number;
  v: number; 
  m: number; 
  d: number; 
}

export interface BeamResult {
  reactions: { x: number; R: number; M: number }[];
  maxShear: number;
  maxMoment: number;
  maxDeflection: number;
  points: BeamPointData[];
}
