"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Project } from "@/types";
import MenuBar from "@/app/workspace/_sections/MenuBar";
import WindowTabs from "@/app/workspace/_sections/WindowTabs";
import { useWindowTabsStore } from "../../store/windowsStore";
import { useSelectedProject } from "./useSelectedProject";
import { ProjectConfig } from "../_project_config/ProjectConfig";
import { Inventory } from "./_sections/Inventory";
import ParameterPanel from "../_parameter_panel/ParameterPanel";
import DataFlowPanel from "../_flow_panel/DataFlowPanel";
import UniverseView from "../_universe_view/UniverseView";
import GeometryView from "../_geometry_view/GeometryView";
import { useFrames } from "./useFramesContext";
import Player from "./_sections/Controller";
import MapView from "../_map_view/MapView";
import MapViewPage from "../_map_view/MapView";
import ObjectView from "../_object_view/ObjectView";

interface WorkspaceProps {
  selected: Project | null;
}

export default function Workspace({ selected }: WorkspaceProps) {
  const { selectedProject, setSelectedProject } = useSelectedProject(selected);
  const addTab = useWindowTabsStore((s) => s.addTab);
  const {
    frames,
    isLoading,
    isConnected,
    isRunning,
    connect,
    disconnect,
    runSimulation,
    pauseSimulation,
  } = useFrames();

  const [showSidebar, setShowSidebar] = useState(true);
  const [showTerminal, setShowTerminal] = useState(false);
  const [showPlayer, setShowPlayer] = useState(false);
  const [isCacheLoading, setIsCacheLoading] = useState(false);

  const router = useRouter();

  const handleMenuClick = async (parent: string, child: string) => {
    if (!selectedProject) return;

    if (parent === "Visualization") {
      if (child === "Universe View") {
        addTab({
          id: "scene",
          title: "Universe View",
          content: <UniverseView />,
        });
      }
      if (child === "Geometry View") {
        addTab({
          id: "geometryView",
          title: "Geometry View",
          content: <GeometryView />,
        });
      }
      if (child === "Object View") {
        addTab({
          id: "objectView",
          title: "Object View",
          content: <ObjectView />,
        });
      }
      if (child === "Map View") {
        addTab({
          id: "mapView",
          title: "Map View",
          content: <MapViewPage />,
        });
      }
      if (child === "Satellite Panel") {
        addTab({
          id: "satPanel",
          title: "Satellite Panel",
          content: <ParameterPanel />,
        });
      }
      if (child === "Data Flow Panel") {
        addTab({
          id: "dataFlowPanel",
          title: "Data Flow Panel",
          content: <DataFlowPanel />,
        });
      }
    }
    if (parent === "Simulation") {
      if (child === "Launch Simulation") {
        connect(selectedProject);
        setShowPlayer(true);
      }
      if (child === "Shutdown") disconnect();
      if (child === "Initialization") {
        setIsCacheLoading(true);
        initializeCache(selectedProject).then((success) => {
          setIsCacheLoading(false);
        });
      }
      if (child === "Train Model") {
        setIsCacheLoading(true);
        trainModelCache(selectedProject).then((success) => {
          setIsCacheLoading(false);
        });
      }
      if (child === "Auto Testing") {
        setIsCacheLoading(true);
        autoTestingCache(selectedProject).then((success) => {
          setIsCacheLoading(false);
        });
      }
      if (child === "Clear Datasets") clearCache();
    }
    if (parent === "Project") {
      if (child === "Config") {
        addTab({
          id: "pconfig",
          title: "ProjectConfig",
          content: (
            <ProjectConfig
              project={selectedProject}
              onSave={(newProject) => setSelectedProject(newProject)}
            />
          ),
        });
      }
      if (child === "Import") {
        // Handle import logic
      }
      if (child === "Export") {
        // Handle export logic
      }
      if (child === "Save") {
        // Handle save project logic
      }
      if (child === "Exit") {
        router.back();
      }
    }
    if (parent === "View") {
      // if (child === "Terminal") {
      //   setShowTerminal((v) => !v);
      // }
      if (child === "Inventory") {
        setShowSidebar((v) => !v);
      }
      if (child === "Controller") {
        setShowPlayer((v) => !v);
      }
    }
  };

  // 监听 Ctrl+B 快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
        setShowSidebar((v) => !v);
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "t") {
        setShowTerminal((v) => !v);
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "p") {
        setShowPlayer((v) => !v);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  if (!selectedProject) {
    return <div className="text-gray-400 p-4">No project selected</div>;
  }

  return (
    <div className="h-screen w-screen text-gray-300 font-sans flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-gray-08 backdrop-blur-sm border-b border-white/10 px-4 py-3 flex justify-between items-center z-10">
        <h1 className="text-xl font-semibold text-white">
          {selectedProject.title}
        </h1>
      </div>

      {/* Menu Bar */}
      <MenuBar
        disabled={isRunning}
        isLoading={isCacheLoading}
        project={selectedProject}
        onMenuClick={handleMenuClick}
        onRunSimulation={runSimulation}
        onPauseSimulation={pauseSimulation}
        onStopSimulation={disconnect}
      />

      {/* Main */}
      <div className="flex w-full h-full overflow-hidden">
        {/* Sidebar */}
        {showSidebar && (
          <aside className="w-1/5 bg-gray-08 backdrop-blur-sm border-r border-white/10 flex flex-col">
            <Inventory project={selectedProject} />
          </aside>
        )}

        {/* Main Tabs + Canvas */}
        <main
          className={
            showSidebar
              ? "flex w-4/5 h-full relative"
              : "flex w-full h-full relative"
          }
        >
          <WindowTabs />
          {showTerminal && (
            <div className="absolute bottom-0 left-0 w-full h-1/5 bg-gray-09 border-t border-white/10 z-50">
              <div className="bg-black">terminal</div>
            </div>
          )}
          {showPlayer && <Player />}
        </main>
      </div>
    </div>
  );
}

async function clearCache() {
  try {
    const resp = await fetch("/api/local-cache/clear", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    if (!resp.ok) {
      const error = await resp.json();
      console.error("清理缓存失败:", error);
      return false;
    }
    const data = await resp.json();
    console.log("缓存清理成功:", data);
    return true;
  } catch (error) {
    console.error("清理缓存异常:", error);
    return false;
  }
}

async function initializeCache(project: Project) {
  try {
    const resp = await fetch("/api/local-cache/initial", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(project),
    });
    if (!resp.ok) {
      const error = await resp.json();
      console.error("初始化模拟失败:", error);
      return false;
    }
    const data = await resp.json();
    console.log("模拟初始化成功:", data);
    return true;
  } catch (error) {
    console.error("初始化模拟异常:", error);
    return false;
  }
}

async function trainModelCache(project: Project) {
  try {
    const resp = await fetch("/api/local-cache/train", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(project),
    });
    if (!resp.ok) {
      const error = await resp.json();
      console.error("初始化模拟失败:", error);
      return false;
    }
    const data = await resp.json();
    console.log("模拟初始化成功:", data);
    return true;
  } catch (error) {
    console.error("初始化模拟异常:", error);
    return false;
  }
}

async function autoTestingCache(project: Project) {
  try {
    const resp = await fetch("/api/local-cache/auto", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(project),
    });
    if (!resp.ok) {
      const error = await resp.json();
      console.error("初始化模拟失败:", error);
      return false;
    }
    const data = await resp.json();
    console.log("模拟初始化成功:", data);
    return true;
  } catch (error) {
    console.error("初始化模拟异常:", error);
    return false;
  }
}
