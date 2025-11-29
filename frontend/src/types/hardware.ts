export interface Hardware {
  id: string;
  projectId: string;
  // Imagery
  focalLength?: number; // mm
  widthPx?: number; // px
  lengthPx?: number; // px
  pxSizeWidth?: number; // pixel size in μm, e.g. 0.0055 for typical CMOS
  pxSizeLength?: number; // pixel size in μm, e.g. 0.0055 for typical CMOS
  channelsPerPx?: number; // e.g. 3 for RGB
  bitsPerChannel?: number; // e.g. 8 for RGB
  // Network
  // Downlink  
  downlinkFrequencyHz: number;
  downlinkBandwidthHz: number;
  downlinkTxPowerW: number;
  downlinkGainTxDbi: number;
  downlinkGainRxDbi: number;
  downlinkNoiseTempK: number;

  // Uplink  
  uplinkFrequencyHz: number;
  uplinkBandwidthHz: number;
  uplinkGainTxDbi: number;
  uplinkTxPowerW: number;
  uplinkGainRxDbi: number;
  uplinkNoiseTempK: number;

  // ISL
  islFrequencyHz: number;
  islBandwidthHz: number;
  islTxPowerW: number;
  islGainTxDbi: number;
  islGainRxDbi: number;
  islNoiseTempK: number;
}