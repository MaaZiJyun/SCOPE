import { LatLon, XYZ } from "./basic";

export interface DataPoint {
  time: number;
  value: number;
}

export interface Project {
  id: string;
}

export interface ControlMessage {
  action: "play" | "pause" | "stop" | "jump" | "init";
  frameIndex?: number;
  payload?: any;
}

export interface Message {
  id: string;
  sender: string;
  senderType: string;
  receiver: string;
  receiverType: string;
  type: number;
  size: number;
  targetId: string | null;
  targetLoc: LatLon | null;
  targetLen: number | null;
  ts: string;
  status: number;
}

export interface Task {
  id: number;
  layer_id: number;
  completion: number;
  plane_at: number;
  order_at: number;
  t_start: number;
  t_end: number;
  acted: number;
  workload_done: number;
  workload_percent: number;
  data_sent: number;
  data_percent: number;
  is_done: boolean;
}

export interface SatelliteFrame {
  // spatial
  id: string;
  plane: number;
  order: number;
  dimensions: [number, number, number];
  pos: XYZ;
  loc: LatLon;
  velocityVector: XYZ;
  solarVector: XYZ;

  // imagery
  imgCornersPos: XYZ[];
  imgCornersLon: LatLon[];

  // Storage Utilization Rate
  activities: Message[];
  attnHead: Message | null;
  rawBuffUtilizationRate: number;
  procBuffUtilizationRate: number;
  storageUtilizationRate: number;

  // energy
  batteryPercent: number;
  gainPercent: number;
  costPercent: number;

  // indicators
  onROI: boolean;
  onGS: boolean;
  onProc: boolean;
  onComm: boolean;
  onSun: boolean;
}

export interface LinkFrame {
  src: string;
  dst: string;
  type: string;
  distance: number;
  linkPos: [XYZ, XYZ];
  snr: number;
  rate: number;
}

// export interface MissionFrame {
//   id: string;
//   projectId: string;
//   name: string;
//   status: string;
//   step: number;
//   statusProcess: string;
//   targetId: string;
//   sourceNodeId: string;
//   endNodeId: string;
//   dataDelivered: number;
//   rawDelivered: number;
//   procDelivered: number;
//   dataLost: number;
//   lostRate: number;
//   startTime: string | null;
//   endTime: string | null;
//   duration: number | null;
// }

// export interface PipeFrame {
//   [key: string]: string;
// }

export interface StationFrame {
  id: string;
  pos: XYZ;
  loc: LatLon;
  missionToUpload: number;
  phi: number;
  psi: number;
  yBuff: number;
  zBuff: number;
  omega: number;
  onUpload: boolean;
  onDownload: boolean;
}

export interface ROIFrame {
  id: string;
  cornersPos: XYZ[];
  cornersLoc: LatLon[];
  centrePos: XYZ;
  centreLoc: LatLon;
}

export interface RLInfo {
  num_nodes: number,
  num_edges: number,
  num_tasks: number,
  reward: number,
  truncated_reason: string,
  terminated_reason: string,
  is_truncated: boolean,
  is_terminated: boolean,
}

export interface RealTime {
  time: string;
  currentFrame: number;
  slotCounter: number;
  MaxSlotNumbers: number;
  periodCounter: number;
  MaxPeriod: number;
  satellites: SatelliteFrame[];
  stations: StationFrame[];
  rois: ROIFrame[];
  links: LinkFrame[];
  pipe: Message[];
  sun: SunFrame;
  earth: EarthFrame;
  tasks: Task[];
  info: RLInfo;

}

export interface SunFrame {
  xyz: XYZ;
}

export interface EarthFrame {
  xyz: XYZ;
  rotation: number;
}