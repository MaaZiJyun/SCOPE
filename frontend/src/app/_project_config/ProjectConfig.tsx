"use client";

import { useState } from "react";
import { ExperimentDetails } from "@/app/_project_config/_sections/ExpDetails";
import { GroundStation, Project, ROI } from "@/types";
import { openMapPicker } from "@/components/MapPickerModal";
import { ProjectDetails } from "./_sections/ProjectDetails";
import { ConstellationDetails } from "./_sections/ConstellationDetails";
import { HardwareDetails } from "./_sections/HardwareDetails";
import { GSDetails } from "./_sections/GSDetails";
import { ROIDetails } from "./_sections/ROIDetails";
// import { SatDetails } from "./_sections/SatDetails";
import { API_PATHS } from "@/lib/apiConfig";

interface ProjectConfigProps {
  project: Project;
  onSave: (updated: Project) => void;
}
const TABS = [
  "project",
  "constellation",
  "hardware",
  "entity",
  "experiment",
] as const;
export const ProjectConfig = ({ project, onSave }: ProjectConfigProps) => {
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>("project");

  const [form, setForm] = useState<Project>(project);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(false);
  const [modified, setModified] = useState(false);

  const updateField = async (path: string[], value: any) => {
    setForm((prev) => {
      if (!prev) return null;

      const copy = JSON.parse(JSON.stringify(prev));
      let curr = copy;

      for (let i = 0; i < path.length - 1; i++) {
        curr = curr[path[i]];
      }
      curr[path[path.length - 1]] = value;

      // 调用后端检测并更新
      projectUpdateDetection(copy).then((checkedProject) => {
        if (checkedProject) setForm(checkedProject);
      });
      setModified(true);
      return copy;
    });
  };

  const updateListItem = (
    listName: "groundStations" | "rois" | "missions",
    index: number,
    field: string,
    value: any
  ) => {
    setForm((prev) => {
      const copy = { ...prev };
      if (listName === "groundStations") {
        const list = [...copy.groundStations];
        list[index] = { ...list[index], [field]: value };
        copy.groundStations = list;
      } else if (listName === "rois") {
        const list = [...copy.rois];
        list[index] = { ...list[index], [field]: value };
        copy.rois = list;
      } else if (listName === "missions") {
        // 修复：如果 missions 为空，先初始化
        const missions = Array.isArray(copy.experiment.missions)
          ? [...copy.experiment.missions]
          : [];
        missions[index] = { ...missions[index], [field]: value };
        copy.experiment.missions = missions;
      }
      projectUpdateDetection(copy).then((checkedProject) => {
        if (checkedProject) setForm(checkedProject);
      });
      setModified(true);
      return copy;
    });
  };

  const deleteListItem = (
    listName: "groundStations" | "rois" | "missions",
    index: number
  ) => {
    setForm((prev) => {
      const copy = { ...prev };
      if (listName === "groundStations") {
        copy.groundStations = copy.groundStations.filter((_, i) => i !== index);
      } else if (listName === "rois") {
        copy.rois = copy.rois.filter((_, i) => i !== index);
      } else if (listName === "missions") {
        copy.experiment.missions = copy.experiment.missions.filter(
          (_, i) => i !== index
        );
      }
      // 调用后端检测并更新
      projectUpdateDetection(copy).then((checkedProject) => {
        if (checkedProject) setForm(checkedProject);
      });
      setModified(true);
      return copy;
    });
  };

  const addListItem = (listName: "groundStations" | "rois" | "missions") => {
    setForm((prev) => {
      const copy = { ...prev };
      if (listName === "groundStations") {
        copy.groundStations = [
          ...copy.groundStations,
          {
            id: "",
            projectId: project.id,
            name: "",
            location: { lat: 0, lon: 0 },
          },
        ];
      } else if (listName === "rois") {
        copy.rois = [
          ...copy.rois,
          {
            id: "",
            projectId: project.id,
            name: "",
            length: 100,
            location: { lat: 0, lon: 0 },
          },
        ];
      } else if (listName === "missions") {
        copy.experiment.missions = [
          ...copy.experiment.missions,
          {
            id: "",
            projectId: project.id,
            name: "New Mission",
            targetId: "",
            sourceNodeId: "",
            endNodeId: "",
            startTime: new Date().toISOString(),
            endTime: "",
            duration: -1,
          },
        ];
      }
      return copy;
    });
  };

  const selectLocation = async (
    listName: "groundStations" | "rois",
    index: number
  ) => {
    const location = await openMapPicker();
    if (location) {
      updateListItem(listName, index, "location", location);
    }
  };

  async function projectUpdateDetection(
    project: Project
  ): Promise<Project | null> {
    const resp = await fetch(API_PATHS.detectProjectInfo, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(project),
    });
    if (!resp.ok) {
      return null;
    }
    const json = await resp.json();
    return json.data;
  }

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const checkedForm = await projectUpdateDetection(form);
      const res = await fetch(API_PATHS.saveProjectInfo, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(checkedForm),
      });
      const json = await res.json();
      const data = json.data;
      // console.log(data)
      if (!res.ok) console.error("上传失败:", json);

      if (data) {
        setForm(data);
        onSave(data);
        setModified(false);
      }
    } catch (error) {
      console.error("请求异常:", error);
    }
    setLoading(false);
  };

  return (
    <div className="h-full w-full px-4 py-12 text-white bg-gray-09">
      <div className="flex justify-between mb-4 border-b border-white/20">
        <nav className="flex gap-4 text-white">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 transition-colors hover:cursor-pointer ${
                activeTab === tab
                  ? "border-b-2 border-white font-semibold"
                  : "text-white/70 hover:text-white"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>

        <button
          disabled={!modified}
          onClick={handleSubmit}
          className={`mx-3 px-6 my-1  ${
            modified ? "bg-white hover:bg-white/80" : "bg-gray-04"
          } rounded-3xl flex items-center text-black transition-colors hover:cursor-pointer`}
        >
          Save
        </button>
      </div>

      {/* tab content */}
      <div className="h-full w-full px-4 overflow-y-auto">
        {activeTab === "project" && (
          <ProjectDetails form={form} updateField={updateField} />
        )}
        {activeTab === "constellation" && (
          <ConstellationDetails
            constellation={form.constellation}
            updateField={updateField}
          />
        )}
        {activeTab === "hardware" && (
          <HardwareDetails hardware={form.hardware} updateField={updateField} />
        )}
        {activeTab === "entity" && (
          <div className="space-y-4 mt-4 mb-8 mx-20">
            <div className="mb-2">
              <span className="text-xl">Entities</span>
            </div>
            <GSDetails
              groundStations={form.groundStations}
              updateListItem={updateListItem}
              addListItem={addListItem}
              deleteListItem={deleteListItem}
              selectLocation={selectLocation}
            />
            <ROIDetails
              rois={form.rois}
              updateListItem={updateListItem}
              addListItem={addListItem}
              deleteListItem={deleteListItem}
              selectLocation={selectLocation}
            />
            {/* <SatDetails satellites={form.satellites} /> */}
          </div>
        )}
        {activeTab === "experiment" && (
          <ExperimentDetails
            experiment={form.experiment}
            groundStations={form.groundStations}
            rois={form.rois}
            addListItem={addListItem}
            updateField={updateField}
            deleteListItem={deleteListItem}
            updateListItem={updateListItem}
          />
        )}
      </div>
    </div>
  );
};
