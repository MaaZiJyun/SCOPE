"use client";

import { MapPinIcon, PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { GroundStation } from "../../../types";
import { useState } from "react";

interface GSDetailsProps {
  groundStations: GroundStation[];
  updateListItem: (
    listName: "groundStations" | "rois",
    index: number,
    field: string,
    value: any
  ) => void;
  addListItem: (listName: "groundStations" | "rois") => void;
  deleteListItem: (listName: "groundStations" | "rois", index: number) => void;
  selectLocation: (
    listName: "groundStations" | "rois",
    index: number
  ) => Promise<void>;
}

export const GSDetails = ({
  groundStations,
  updateListItem,
  addListItem,
  deleteListItem,
  selectLocation,
}: GSDetailsProps) => {
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState("");

  const handleImport = () => {
    try {
      // 支持两种格式：
      // 1) 直接 JSON 数组
      // 2) 包含变量名的文本，如 "ground_stations = [ ... ]"
      const lastIndex = groundStations.length;
      let text = importText.trim();
      console.log("Importing text:", text);
      const eqIdx = text.indexOf("=");
      if (eqIdx !== -1) {
        text = text.slice(eqIdx + 1).trim();
      }
      const arr = JSON.parse(text);
      if (!Array.isArray(arr)) throw new Error("JSON 需为数组");
      arr.forEach((gs: any, i:number) => {
        addListItem("groundStations");
        updateListItem("groundStations", lastIndex + i, "name", gs.name ?? "");
        updateListItem("groundStations", lastIndex + i, "location", {
          lat: Number(gs.lat ?? 0),
          lon: Number(gs.lon ?? 0),
        });
      });
      setImportOpen(false);
      setImportText("");
    } catch (e) {
      alert(`导入失败: ${(e as Error).message}`);
    }
  };
  return (
    <div>
      <h3 className="text-lg text-sm text-white mb-3 flex justify-between items-center">
        Ground Stations
        <div className="flex gap-4">
          <button
            onClick={() => addListItem("groundStations")}
            className="text-white/80 hover:text-white flex items-center gap-1 transition-colors"
            type="button"
          >
            <PlusIcon className="w-5 h-5" />
            Add
          </button>
          <button
            onClick={() => setImportOpen(true)}
            className="text-white/80 hover:text-white flex items-center gap-1 transition-colors"
            type="button"
          >
            <PlusIcon className="w-5 h-5" />
            Import
          </button>
        </div>
      </h3>
      {importOpen && (
        <div className="mb-3">
          <textarea
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            className="w-full h-28 rounded-lg bg-white/20 px-2 py-1 text-sm text-white focus:outline-none focus:ring-2 focus:ring-gray-300"
            placeholder='e.g.: ground_stations = [{"name":"Goldstone","lat":35.2472,"lon":-116.7933}]'
          />
          <div className="mt-2 flex gap-2 items-center justify-end">
            <button
              type="button"
              onClick={handleImport}
              className="px-3 py-1 rounded bg-white/80 text-black text-sm hover:bg-white"
            >
              Confirm
            </button>
            <button
              type="button"
              onClick={() => { setImportOpen(false); setImportText(""); }}
              className="px-3 py-1 rounded border border-white text-white text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      {groundStations.length === 0 && (
        <p className="text-gray-400 italic text-sm mb-2">No ground stations</p>
      )}
      {groundStations.map((gs, i) => (
        <div key={i} className="mb-2">
          <div className="flex gap-4 mb-2 items-center justify-between">
            <div className="w-1/2 gap-2">
              <label className="block mb-1 text-xs">
                Name (ID: {gs.id ? gs.id.slice(-12): "N/A"})
              </label>
              <input
                type="text"
                value={gs.name ?? ""}
                onChange={(e) =>
                  updateListItem("groundStations", i, "name", e.target.value)
                }
                className="w-full rounded-lg bg-white/20 px-2 py-1 text-sm text-white focus:outline-none focus:ring-2 focus:ring-gray-300"
                placeholder="Ground station name"
              />
            </div>
            <div className="w-1/2 flex justify-between">
              <div>
                <label className="block mb-1 text-xs">Location</label>
                <p className="py-1 text-sm text-gray-400">
                  Lat {(gs.location?.lat ?? 0).toFixed(4)}°, Lon{" "}
                  {(gs.location?.lon ?? 0).toFixed(4)}°
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => selectLocation("groundStations", i)}
                  className="text-white/80 hover:text-blue-400 transition-colors"
                  title="Pick location"
                >
                  <MapPinIcon className="w-5 h-5 hover:cursor-pointer" />
                </button>
                <button
                  type="button"
                  onClick={() => deleteListItem("groundStations", i)}
                  className="text-white/80 hover:text-red-400 transition-colors"
                  title="Delete station"
                >
                  <TrashIcon className="w-5 h-5 hover:cursor-pointer" />
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
