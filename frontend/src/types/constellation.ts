export interface Constellation {
  // basic
  id: string;
  projectId: string;
  name: string;
  description?: string;
  // orbital
  numberOfPlanes: number; // Positive integer
  numberOfSatPerPlanes: number; // Positive integer
  phaseFactor: number; // Degrees
  altitude: number; // Meters
  inclination: number; // Degrees, 0–180
  orbitalPeriod?: number;
}

export interface Satellite {
  id: string;
  constellationId?: string;
  name: string;
  order?: number;
  plane?: number;
  tle1?: string;
  tle2?: string;
}