import { LatLon, XYZ } from "@/types";
import { send } from "process";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { RealTime, SatelliteFrame, StationFrame } from "@/types/simulation";
import VoidPage from "@/components/VoidPage";
import {
  ArrowsUpDownIcon,
  CameraIcon,
  CpuChipIcon,
  RssIcon,
  SunIcon,
} from "@heroicons/react/24/outline";

export default function StationPanel({
  gsStates,
}: {
  gsStates: StationFrame[];
}) {
  const sumRow = {
    // missionToUpload: gsStates.reduce((a, b) => a + b.missionToUpload, 0),
    phi: gsStates.reduce((a, b) => a + (b.phi ?? 0), 0),
    psi: gsStates.reduce((a, b) => a + (b.psi ?? 0), 0),
    // yBuff: gsStates.reduce((a, b) => a + b.yBuff, 0),
    // zBuff: gsStates.reduce((a, b) => a + b.zBuff, 0),
    // omega: gsStates.reduce((a, b) => a + b.omega, 0),
  };

  return (
    <div className="flex w-full h-full min-h-0">
      <div className="overflow-auto w-full h-full min-h-0">
        <table className="w-full h-full text-xs min-h-0">
          <thead className="bg-gray-07 text-white sticky top-0 z-10">
            <tr>
              <th className="px-2 py-1">ID</th>
              <th className="px-2 py-1">SI</th>
              {/* <th className="px-2 py-1">MTU</th> */}
              <th className="px-2 py-1">Phi</th>
              <th className="px-2 py-1">Psi</th>
              {/* <th className="px-2 py-1">Y Buff</th>
              <th className="px-2 py-1">Z Buff</th>
              <th className="px-2 py-1">Omega</th> */}
            </tr>
          </thead>
          <tbody>
            {gsStates.map((gs) => {
              const phi = gs.phi ?? 0;
              const psi = gs.psi ?? 0;
              return (
                <tr key={gs.id} className="hover:bg-white/5">
                  <td className="px-2 py-1">{gs.id.slice(-6)}</td>
                  <td className="px-2 py-1">
                  <div
                    className={`${
                      gs.onUpload || gs.onDownload
                        ? "text-green-500"
                        : "text-gray-05"
                    }`}
                  >
                    <ArrowsUpDownIcon className="h-4 w-4" />
                  </div>
                </td>
                {/* <td className="px-2 py-1">{gs.missionToUpload}</td> */}
                <td className="px-2 py-1">{phi.toFixed(4)}</td>
                <td className="px-2 py-1">{psi.toFixed(4)}</td>
                {/* <td className="px-2 py-1">{gs.yBuff.toFixed(4)}</td>
                <td className="px-2 py-1">{gs.zBuff.toFixed(4)}</td>
                <td className="px-2 py-1">{gs.omega.toFixed(4)}</td> */}
              </tr>
            )})}
          </tbody>
          <tfoot>
            <tr className="bg-black text-yellow-700 sticky bottom-0 font-bold">
              <td className="px-2 py-1">SUM</td>
              <td className="px-2 py-1"></td>
              {/* <td className="px-2 py-1">{sumRow.missionToUpload}</td> */}
              <td className="px-2 py-1">{sumRow.phi.toFixed(4)}</td>
              <td className="px-2 py-1">{sumRow.psi.toFixed(4)}</td>
              {/* <td className="px-2 py-1">{sumRow.yBuff.toFixed(4)}</td>
              <td className="px-2 py-1">{sumRow.zBuff.toFixed(4)}</td>
              <td className="px-2 py-1">{sumRow.omega.toFixed(4)}</td> */}
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
