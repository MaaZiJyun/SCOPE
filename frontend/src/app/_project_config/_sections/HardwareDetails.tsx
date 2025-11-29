"use client";

import { Hardware } from "@/types";
import { BlurUpdateInput } from "../../../components/BlurUpdateInput";
import { useState } from "react";
import CameraVisualizer from "@/components/CameraVisualizer";

interface HardwareDetailsProps {
  hardware: Hardware;
  updateField: (path: string[], value: any) => void;
}

export const HardwareDetails = ({
  hardware,
  updateField,
}: HardwareDetailsProps) => {
  const renderInput = (
    label: string,
    path: string[],
    value: number | undefined,
    min?: number,
    max?: number,
    placeholder?: string
  ) => (
    <div className="mb-2">
      <label className="block mb-1 text-xs">{label}</label>
      <BlurUpdateInput
        type="number"
        value={value ?? ""}
        onSave={(val) => updateField(path, isNaN(val) ? undefined : val)}
      />
    </div>
  );

  return (
    <div className="mt-4 mb-8 mx-20">
      {/* Imagery */}
      <div className="mb-2 text-xl">Imagery</div>
      <div className="flex">
        <div className="w-2/3">
          {renderInput(
            "Channels per Pixel",
            ["hardware", "channelsPerPx"],
            hardware.channelsPerPx
          )}
          {renderInput(
            "Bits per Channel",
            ["hardware", "bitsPerChannel"],
            hardware.bitsPerChannel
          )}
          {renderInput(
            "Focal Length (mm)",
            ["hardware", "focalLength"],
            hardware.focalLength
          )}
          {renderInput("Width (px)", ["hardware", "widthPx"], hardware.widthPx)}
          {renderInput(
            "Length (px)",
            ["hardware", "lengthPx"],
            hardware.lengthPx
          )}
          {renderInput("Pixel Length (μm)", ["hardware", "pxSizeLength"], hardware.pxSizeLength)}
          {renderInput(
            "Pixel Width (μm)",
            ["hardware", "pxSizeWidth"],
            hardware.pxSizeWidth
          )}
        </div>
        <div className="w-1/3 flex items-center justify-center">
          <CameraVisualizer
            focalLength={hardware.focalLength}
            widthPx={hardware.widthPx}
            lengthPx={hardware.lengthPx}
          />
        </div>
      </div>

      {/* Uplink */}
      <div className="mt-8 mb-2 text-xl">Uplink</div>
      {renderInput(
        "Uplink Frequency (Hz)",
        ["hardware", "uplinkFrequencyHz"],
        hardware.uplinkFrequencyHz
      )}
      {renderInput(
        "Uplink Bandwidth (Hz)",
        ["hardware", "uplinkBandwidthHz"],
        hardware.uplinkBandwidthHz
      )}
      {renderInput(
        "Uplink TX Power (W)",
        ["hardware", "uplinkTxPowerW"],
        hardware.uplinkTxPowerW
      )}
      {renderInput(
        "Uplink TX Gain (dBi)",
        ["hardware", "uplinkGainTxDbi"],
        hardware.uplinkGainTxDbi
      )}
      {renderInput(
        "Uplink RX Gain (dBi)",
        ["hardware", "uplinkGainRxDbi"],
        hardware.uplinkGainRxDbi
      )}
      {renderInput(
        "Uplink Noise Temp (K)",
        ["hardware", "uplinkNoiseTempK"],
        hardware.uplinkNoiseTempK
      )}

      {/* Downlink */}
      <div className="mt-8 mb-2 text-xl">Downlink</div>
      {renderInput(
        "Downlink Frequency (Hz)",
        ["hardware", "downlinkFrequencyHz"],
        hardware.downlinkFrequencyHz
      )}
      {renderInput(
        "Downlink Bandwidth (Hz)",
        ["hardware", "downlinkBandwidthHz"],
        hardware.downlinkBandwidthHz
      )}
      {renderInput(
        "Downlink TX Power (W)",
        ["hardware", "downlinkTxPowerW"],
        hardware.downlinkTxPowerW
      )}
      {renderInput(
        "Downlink TX Gain (dBi)",
        ["hardware", "downlinkGainTxDbi"],
        hardware.downlinkGainTxDbi
      )}
      {renderInput(
        "Downlink RX Gain (dBi)",
        ["hardware", "downlinkGainRxDbi"],
        hardware.downlinkGainRxDbi
      )}
      {renderInput(
        "Downlink Noise Temp (K)",
        ["hardware", "downlinkNoiseTempK"],
        hardware.downlinkNoiseTempK
      )}

      {/* ISL */}
      <div className="mt-8 mb-2 text-xl">ISL (Inter-Satellite Link)</div>
      {renderInput(
        "ISL Frequency (Hz)",
        ["hardware", "islFrequencyHz"],
        hardware.islFrequencyHz
      )}
      {renderInput(
        "ISL Bandwidth (Hz)",
        ["hardware", "islBandwidthHz"],
        hardware.islBandwidthHz
      )}
      {renderInput(
        "ISL TX Power (W)",
        ["hardware", "islTxPowerW"],
        hardware.islTxPowerW
      )}
      {renderInput(
        "ISL TX Gain (dBi)",
        ["hardware", "islGainTxDbi"],
        hardware.islGainTxDbi
      )}
      {renderInput(
        "ISL RX Gain (dBi)",
        ["hardware", "islGainRxDbi"],
        hardware.islGainRxDbi
      )}
      {renderInput(
        "ISL Noise Temp (K)",
        ["hardware", "islNoiseTempK"],
        hardware.islNoiseTempK
      )}
    </div>
  );
};
