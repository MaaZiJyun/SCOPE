"use client";

import EmptyPage from "@/components/EmptyPage";
import { GroundStation, Project, ROI, Satellite } from "@/types";
import { PencilIcon, TrashIcon } from "@heroicons/react/24/outline";

interface DemoProps {
  selectedProject: Project | null;
  onEdit: (project: Project) => void;
  onDelete: (id: string) => void;
}

export default function Demo({ selectedProject, onEdit, onDelete }: DemoProps) {
  // Utility function to format Date in local time zone
  const formatDateForDisplay = (
    date: Date | string | undefined | null
  ): string => {
    if (!date) {
      return "N/A";
    } else {
      date = new Date(date);
    }
    return date.toLocaleString(undefined, {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false, // Use 24-hour format; set to true for 12-hour format with AM/PM
    });
  };

  if (!selectedProject) {
    return <EmptyPage />;
  }

  return (
    <div className="h-full w-full flex-col px-12 py-6 overflow-auto text-gray-300">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-5xl font-bold text-white">
          {selectedProject.title}
        </h2>
      </div>

      <div>
        <p className="mb-1 text-xl text-white">
          {selectedProject.description || "No description"}
        </p>
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm">
            ID: <span className="text-white">{selectedProject.id}</span>
          </p>
          <div className="flex gap-2 items-center">
            <button
              onClick={() => onEdit(selectedProject)}
              title="Edit Project"
              className="text-white/80 hover:text-white transition-colors"
            >
              <PencilIcon className="w-4 h-4 hover:cursor-pointer" />
            </button>
            <button
              type="button"
              onClick={() => {
                onDelete(selectedProject.id);
                deleteProjectFromStore(selectedProject.id);
              }}
              title="Delete Project"
              className="text-white/80 hover:text-red-400 transition-colors"
            >
              <TrashIcon className="w-4 h-4 hover:cursor-pointer" />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Project Details Card */}
        <div className="bg-black/50 rounded-lg border border-white/20 shadow-lg p-4">
          <h3 className="text-lg font-semibold text-white mb-3">
            Experiment Details
          </h3>

          <p className="mb-2">
            Start Time:{" "}
            <span className="font-semibold text-white">
              {formatDateForDisplay(selectedProject.experiment.startTime)}
            </span>
          </p>
          <p className="mb-2">
            End Time:{" "}
            <span className="font-semibold text-white">
              {formatDateForDisplay(selectedProject.experiment.endTime)} seconds
            </span>
          </p>
          <p className="mb-2">
            Time Slot Duration:{" "}
            <span className="font-semibold text-white">
              {selectedProject.experiment.timeSlot} seconds
            </span>
          </p>
          {/* <p className="mb-2">
            Mission Duration:{" "}
            <span className="font-semibold text-white">
              {selectedProject.experiment.missionDuration || "N/A"}
            </span>
          </p> */}
        </div>

        {/* Constellation Card */}
        <div className="bg-black/50 rounded-lg border border-white/20 shadow-lg p-4">
          <h3 className="text-lg font-semibold text-white mb-3">
            Constellation
          </h3>
          <p className="mb-2">
            ID:{" "}
            <span className="font-semibold text-white">
              {selectedProject.constellation.id}
            </span>
          </p>
          <p className="mb-2">
            Name:{" "}
            <span className="font-semibold text-white">
              {selectedProject.constellation.name}
            </span>
          </p>
          <p className="mb-2">
            Description:{" "}
            <span className="text-gray-400">
              {selectedProject.constellation.description || "No description"}
            </span>
          </p>
          <p className="mb-2">
            Number of Planes:{" "}
            <span className="font-semibold text-white">
              {selectedProject.constellation.numberOfPlanes}
            </span>
          </p>
          <p className="mb-2">
            Satellites per Plane:{" "}
            <span className="font-semibold text-white">
              {selectedProject.constellation.numberOfSatPerPlanes}
            </span>
          </p>
          <p className="mb-2">
            Altitude:{" "}
            <span className="font-semibold text-white">
              {selectedProject.constellation.altitude} meters
            </span>
          </p>
          <p className="mb-2">
            Inclination:{" "}
            <span className="font-semibold text-white">
              {selectedProject.constellation.inclination}°
            </span>
          </p>
          <p className="mb-2">
            Phase Factor:{" "}
            <span className="font-semibold text-white">
              {selectedProject.constellation.phaseFactor}°
            </span>
          </p>
        </div>

        {/* Satellites Card */}
        <div className="bg-black/50 rounded-lg border border-white/20 shadow-lg p-4">
          <h3 className="text-lg font-semibold text-white mb-3">Satellites</h3>
          {selectedProject.satellites?.length > 0 ? (
            <ul className="list-inside text-gray-300 max-h-64 overflow-y-auto">
              {selectedProject.satellites.map((sat: Satellite, i) => (
                <li key={sat.id || i} className="mb-2">
                  <div>
                    <span className="font-semibold text-white">{sat.name}</span>{" "}
                    (ID: {sat.id})
                  </div>
                  <div className="ml-4 text-sm">
                    <p>Constellation ID: {sat.constellationId || "N/A"}</p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-400 italic">No satellites</p>
          )}
        </div>

        {/* Ground Stations Card */}
        <div className="bg-black/50 rounded-lg border border-white/20 shadow-lg p-4">
          <h3 className="text-lg font-semibold text-white mb-3">
            Ground Stations
          </h3>
          {selectedProject.groundStations.length > 0 ? (
            <ul className="list-inside text-gray-300 max-h-64 overflow-y-auto">
              {selectedProject.groundStations.map((gs: GroundStation, i) => (
                <li key={gs.id || i} className="mb-2">
                  <div>
                    <span className="font-semibold text-white">{gs.name}</span>{" "}
                    (ID: {gs.id})
                  </div>
                  <div className="ml-4 text-sm">
                    <p>
                      Location: Lat {gs.location?.lat?.toFixed(4) || "N/A"}°,
                      Lon {gs.location?.lon?.toFixed(4) || "N/A"}°
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-400 italic">No ground stations</p>
          )}
        </div>

        {/* ROIs Card */}
        <div className="bg-black/50 rounded-lg border border-white/20 shadow-lg p-4">
          <h3 className="text-lg font-semibold text-white mb-3">
            Regions of Interest (ROIs)
          </h3>
          {selectedProject.rois?.length > 0 ? (
            <ul className="list-inside text-gray-300 max-h-64 overflow-y-auto">
              {selectedProject.rois.map((roi: ROI, i) => (
                <li key={roi.id || i} className="mb-2">
                  <div>
                    <span className="font-semibold text-white">{roi.name}</span>{" "}
                    (ID: {roi.id})
                  </div>
                  <div className="ml-4 text-sm">
                    <p>Length: {roi.length || "N/A"} meters</p>
                    <p>
                      Width:{" "}
                      {roi.width
                        ? `${roi.width} meters`
                        : `${roi.length} meters`}
                    </p>
                    <p>
                      Location: Lat {roi.location?.lat?.toFixed(4) || "N/A"}°,
                      Lon {roi.location?.lon?.toFixed(4) || "N/A"}°
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-400 italic">No ROIs</p>
          )}
        </div>
      </div>
    </div>
  );
}

async function deleteProjectFromStore(
  project_id: string
): Promise<Project | null> {
  const resp = await fetch(`/api/local-project/delete/${project_id}`, {
    method: "DELETE", // 必须指定 DELETE 方法
    cache: "no-store",
  });
  if (!resp.ok) {
    return null;
  }
  const json = await resp.json();
  return json.data;
}
