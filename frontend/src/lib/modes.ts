export enum LayerMode {
  SolidMesh = "Solid/Mesh",
  Wireframe = "Wireframe",
  Material = "Material"
}

export interface ElementDisplaySettings {
  showConstellation: boolean;
  showOrbit: boolean;
  showISL: boolean;
  showGroundStation: boolean;
  showSGL: boolean;
  showROI: boolean;
  showSwath: boolean;
}