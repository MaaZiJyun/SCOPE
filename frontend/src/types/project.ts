import { Constellation, Satellite } from "./constellation";
import { GroundStation, ROI } from "./geo";
import { Experiment } from "./experiment";
import { Hardware } from "./hardware";

export interface Project {
  id: string;
  userId: string;
  title: string;
  description: string;
  hardware: Hardware;
  experiment: Experiment;
  constellation: Constellation;
  satellites: Satellite[];
  groundStations: GroundStation[];
  rois: ROI[];
}