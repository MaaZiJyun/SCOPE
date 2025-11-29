"use client";

import { Experiment, GroundStation, ROI } from "@/types";
import { BlurUpdateInput } from "../../../components/BlurUpdateInput";
import {
  toInputLocal,
  localToUTCISOString,
} from "@/services/date_time/time_convert";
import { PlusIcon, TrashIcon } from "@heroicons/react/24/outline";

interface ExperimentDetailsProps {
  experiment: Experiment;
  groundStations: GroundStation[];
  rois: ROI[];
  updateField: (path: string[], value: any) => void;
  addListItem: (listName: "groundStations" | "rois" | "missions") => void;
  deleteListItem: (
    listName: "groundStations" | "rois" | "missions",
    index: number
  ) => void;
  updateListItem: (
    listName: "missions",
    index: number,
    field: string,
    value: any
  ) => void;
}

export const ExperimentDetails = ({
  experiment,
  groundStations,
  rois,
  updateField,
  updateListItem,
  addListItem,
  deleteListItem,
}: ExperimentDetailsProps) => {
  const formatValue = (val: any) => {
    if (val instanceof Date) return val.toISOString();
    if (typeof val === "boolean") return String(val);
    return val ?? "None";
  };

  return (
    <div className="mt-4 mb-8 mx-20">
      <div className="mt-8 mb-2">
        <span className="text-xl">Time & Duration</span>
      </div>

      {/* Editable Inputs */}
      <div className="mb-4">
        <label className="block mb-1 text-xs">Time Slot (s)</label>
        <BlurUpdateInput
          type="number"
          value={experiment.timeSlot ?? ""}
          onSave={(val) => updateField(["experiment", "timeSlot"], val)}
        />
      </div>

      <div className="mb-4">
        <label className="block mb-1 text-xs">Start Time</label>
        <BlurUpdateInput
          type="datetime-local"
          value={experiment.startTime ? toInputLocal(experiment.startTime) : ""}
          onSave={(val) => {
            // val 是本地时间字符串 '2025-06-25T09:04'
            const iso = localToUTCISOString(val); // 转为 '2025-06-25T01:04:00.000Z'
            updateField(["experiment", "startTime"], iso);
          }}
        />
      </div>

      <div className="mb-4">
        <label className="block mb-1 text-xs">End Time</label>
        <BlurUpdateInput
          type="datetime-local"
          value={experiment.endTime ? toInputLocal(experiment.endTime) : ""}
          onSave={(val) => {
            const iso = localToUTCISOString(val);
            updateField(["experiment", "endTime"], iso);
          }}
        />
      </div>
      <div className="mt-8 mb-2">
        <span className="text-xl">Missions</span>
      </div>
      <button
        className="flex items-center justify-center w-full p-4 mb-4
        text-white hover:bg-yellow-600 hover:cursor-pointer 
        rounded border border-white/10 transition-colors"
        onClick={() => addListItem("missions")}
      >
        <PlusIcon className="h-5 w-5" />
      </button>
      <div className="space-y-4">
        {(experiment.missions ?? []).map((mission, i) => (
          <div key={i} className="flex border border-white/10 rounded-lg">
            <div className="w-full p-3">
              <div className="flex w-full gap-4">
                <div className="mb-2 w-1/2">
                  <label className="block mb-1 text-xs">Name</label>
                  <BlurUpdateInput
                    type="text"
                    value={mission.name ?? ""}
                    onSave={(val) => updateListItem("missions", i, "name", val)}
                  />
                </div>
                <div className="mb-2 w-1/2">
                  <label className="block mb-1 text-xs">Target ROI</label>
                  <select
                    className="w-full bg-gray-06 text-sm text-white rounded-lg px-2 py-1"
                    value={mission.targetId ?? ""}
                    onChange={(e) =>
                      updateListItem("missions", i, "targetId", e.target.value)
                    }
                  >
                    <option value="">Please select target ROI</option>
                    {rois.map((roi) => (
                      <option key={roi.id} value={roi.id}>
                        {roi.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex w-full gap-4">
                <div className="mb-2 w-1/2">
                  <label className="block mb-1 text-xs">Source Node</label>
                  <select
                    className="w-full bg-gray-06 text-sm text-white rounded-lg px-2 py-1"
                    value={mission.sourceNodeId ?? ""}
                    onChange={(e) =>
                      updateListItem(
                        "missions",
                        i,
                        "sourceNodeId",
                        e.target.value
                      )
                    }
                  >
                    <option value="">Please select source node</option>
                    {groundStations.map((gs) => (
                      <option key={gs.id} value={gs.id}>
                        {gs.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mb-2 w-1/2">
                  <label className="block mb-1 text-xs">End Node</label>
                  <select
                    className="w-full bg-gray-06 text-sm text-white rounded-lg px-2 py-1"
                    value={mission.endNodeId ?? ""}
                    onChange={(e) =>
                      updateListItem("missions", i, "endNodeId", e.target.value)
                    }
                  >
                    <option value="">Please select end node</option>
                    {groundStations.map((gs) => (
                      <option key={gs.id} value={gs.id}>
                        {gs.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex w-full gap-4">
                <div className="mb-2 w-1/3">
                  <label className="block mb-1 text-xs">Start Time</label>
                  <BlurUpdateInput
                    type="datetime-local"
                    value={
                      mission.startTime ? toInputLocal(mission.startTime) : ""
                    }
                    onSave={(val) =>
                      updateListItem(
                        "missions",
                        i,
                        "startTime",
                        localToUTCISOString(val)
                      )
                    }
                  />
                </div>
                <div className="mb-2 w-1/3">
                  <label className="block mb-1 text-xs">End Time</label>
                  <div className="w-full flex items-center px-2 py-1 text-sm rounded-lg bg-gray-06">
                    <span className={`font-semibold text-white`}>
                      {mission.endTime ?? "Not calculated"}
                    </span>
                    {!mission.endTime && (
                      <span className="ml-2 text-gray-04">
                        (Not calculated)
                      </span>
                    )}
                  </div>
                </div>
                <div className="mb-2 w-1/3">
                  <label className="block mb-1 text-xs">Duration (s)</label>
                  <div className="w-full flex items-center px-2 py-1 text-sm rounded-lg bg-gray-06">
                    <span className={`font-semibold text-white`}>
                      {mission.duration === -1
                        ? "Not calculated"
                        : mission.duration}
                    </span>
                    {!mission.duration && (
                      <span className="ml-2 text-gray-04">
                        (Not calculated)
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div
              className="w-12 flex items-center justify-center 
              rounded-r-lg bg-red-800/20 text-red-400
              hover:text-white hover:cursor-pointer hover:bg-red-700 transition-colors"
              onClick={() => deleteListItem("missions", i)}
            >
              <TrashIcon className="h-6 w-6 " />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
