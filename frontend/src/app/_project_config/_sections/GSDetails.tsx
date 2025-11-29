"use client";

import { MapPinIcon, PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { GroundStation } from "../../../types";

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
  return (
    <div>
      <h3 className="text-lg text-sm text-white mb-3 flex justify-between items-center">
        Ground Stations
        <button
          onClick={() => addListItem("groundStations")}
          className="text-white/80 hover:text-white flex items-center gap-1 transition-colors"
          type="button"
        >
          <PlusIcon className="w-5 h-5" />
          Add
        </button>
      </h3>
      {groundStations.length === 0 && (
        <p className="text-gray-400 italic text-sm mb-2">No ground stations</p>
      )}
      {groundStations.map((gs, i) => (
        <div key={i} className="mb-2">
          <div className="flex gap-4 mb-2 items-center justify-between">
            <div className="w-1/2 gap-2">
              <label className="block mb-1 text-xs">
                Name (ID: {gs.id.slice(-12)})
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
