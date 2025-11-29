import { LatLon, XYZ } from "@/types";
import { send } from "process";
import React from "react";
import { SatelliteFrame } from "@/types/simulation";
import {
  ArrowsUpDownIcon,
  CameraIcon,
  CpuChipIcon,
  RssIcon,
  SunIcon,
} from "@heroicons/react/24/outline";

export default function SatellitePanel({
  satStates,
}: {
  satStates: SatelliteFrame[];
}) {
  const totalBattery = satStates.reduce((a, s) => a + (s.batteryPercent ?? 0), 0);
  const avgBattery = satStates.length ? totalBattery / satStates.length : 0;

  return (
    <div className="flex w-full h-full min-h-0">
      <div className="overflow-auto h-full min-h-0">
        <table className="w-full h-full min-h-0 text-xs">
          <thead className="bg-gray-07 text-white sticky top-0">
            <tr>
              <th className="px-2 py-1 text-left">ID</th>
              <th className="px-2 py-1 text-left">Status Indicators</th>
              <th className="px-2 py-1 text-right">Battery (%)</th>
            </tr>
          </thead>

          <tbody>
            {satStates.map((sat) => (
              <tr key={sat.id} className="hover:bg-white/5">
                <td className="px-2 py-1">{sat.id.slice(-6)}</td>
                <td className="px-2 py-1">
                  <div className="flex w-full justify-between items-center gap-3">
                    <div className={`${sat.onComm ? "text-green-500" : "text-gray-05"}`}>
                      <RssIcon className="h-4 w-4" />
                    </div>
                    <div className={`${sat.onGS ? "text-green-500" : "text-gray-05"}`}>
                      <ArrowsUpDownIcon className="h-4 w-4" />
                    </div>
                    <div className={`${sat.onProc ? "text-green-500" : "text-gray-05"}`}>
                      <CpuChipIcon className="h-4 w-4" />
                    </div>
                    <div className={`${sat.onROI ? "text-green-500" : "text-gray-05"}`}>
                      <CameraIcon className="h-4 w-4" />
                    </div>
                    <div className={`${sat.onSun ? "text-green-500" : "text-gray-05"}`}>
                      <SunIcon className="h-4 w-4" />
                    </div>
                  </div>
                </td>
                <td className="px-2 py-1 text-right">{(sat.batteryPercent ?? 0).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>

          <tfoot className="bg-gray-08 text-white sticky bottom-0">
            <tr>
              <td className="px-2 py-1">Summary</td>
              <td className="px-2 py-1">Sat count: {satStates.length}</td>
              <td className="px-2 py-1 text-right">Avg: {avgBattery.toFixed(2)}%</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
