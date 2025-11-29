import { LatLon } from "./basic";

export interface GroundStation {
  id: string;
  projectId: string;
  name: string;
  location: LatLon;
}

export interface ROI {
  id: string;
  projectId: string;
  name: string;
  length: number; // Meters
  width?: number; // Meters
  location: LatLon;
}