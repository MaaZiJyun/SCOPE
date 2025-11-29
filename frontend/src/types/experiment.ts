import { ROI } from "./geo";

export interface Experiment {
  id: string;
  projectId: string;
  startTime: string;
  endTime?: string;
  timeSlot?: number;
  missions: Mission[];
}

export interface Mission {
  id: string;
  projectId: string;
  name: string;
  targetId: string;
  sourceNodeId: string;
  endNodeId: string;
  startTime: string;
  endTime: string;
  duration: number;
}