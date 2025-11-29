export interface XYZ {
  x: number; // Meters (ECEF)
  y: number; // Meters (ECEF)
  z: number; // Meters (ECEF)
}

export interface LatLon {
  lat: number; // Degrees, -90 to 90
  lon: number; // Degrees, -180 to 180
}

export interface LatLonAlt {
  lat: number; // Degrees, -90 to 90
  lon: number; // Degrees, -180 to 180
  alt: number; // Meters
}

export interface Quaternion {
  x: number;
  y: number;
  z: number;
  w: number;
}