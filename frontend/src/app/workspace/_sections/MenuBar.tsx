import { SpinnerWidget } from "@/components/SpinnerWidget";
import { Project } from "@/types";
import {
  ArrowPathIcon,
  BoltIcon,
  BoltSlashIcon,
  PauseIcon,
  PlayIcon,
  PowerIcon,
  StopIcon,
} from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";

type MenuItem = {
  label: string;
  children: string[];
};

type MenuBarProps = {
  className?: string;
  project: Project;
  disabled: boolean;
  isLoading: boolean;
  onMenuClick?: (parent: string, child: string) => void;
  onRunSimulation?: () => void;
  onPauseSimulation?: () => void;
  onStopSimulation?: () => void;
};

const menuItems: MenuItem[] = [
  {
    label: "Project",
    children: ["Config", "Import", "Export", "Save", "Exit"],
  },
  {
    label: "View",
    children: [
      // "Terminal",
      "Inventory",
      "Controller",
    ],
  },
  {
    label: "Visualization",
    children: [
      "Universe View",
      "Geometry View",
      "Object View",
      "Map View",
      "Satellite Panel",
      "Data Flow Panel",
    ],
  },
  {
    label: "Simulation",
    children: [
      "Initialization",
      "Train Model",
      "Launch Simulation",
      "Shutdown",
      "Download Datasets",
      "Clear Datasets",
    ],
  },
];

const buttonBase = "px-3 py-1 transition-colors";
const buttonActive = "text-white/80 hover:bg-white/10 hover:cursor-pointer";
const buttonDisabled = "text-white/30";

const childButtonBase =
  "block text-left px-2 py-1 text-sm w-full transition-colors";

const MenuBar = ({
  className = "",
  project,
  disabled,
  isLoading,
  onMenuClick,
  onRunSimulation,
  onPauseSimulation,
  onStopSimulation,
}: MenuBarProps) => {
  const [openMenu, setOpenMenu] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const [cacheSize, setCacheSize] = useState<number>(0);
  const [cacheIntegrity, setCacheIntegrity] = useState<boolean>(false);

  useEffect(() => {
    getCacheSize().then((size) => setCacheSize(size / (1024 * 1024)));
  }, [openMenu]);

  useEffect(() => {
    checkCacheIntegrity(project).then((integrity) =>
      setCacheIntegrity(integrity)
    );
  }, [openMenu]);

  return (
    <div
      className={`flex items-center justify-between bg-gray-08 backdrop-blur-sm border-b border-white/10 px-2 space-x-6 text-sm font-medium z-10 relative ${className}`}
      onMouseLeave={() => setOpenMenu(null)}
    >
      <div className="flex">
        {menuItems.map((menu, idx) => (
          <div key={menu.label} className="relative">
            <button
              className={`${buttonBase} ${
                disabled &&
                menu.label !== "Visualization" &&
                menu.label !== "Simulation"
                  ? buttonDisabled
                  : buttonActive
              }`}
              onMouseEnter={() => setOpenMenu(idx)}
              onFocus={() => setOpenMenu(idx)}
              onClick={() => setOpenMenu(idx)}
              type="button"
              disabled={
                disabled &&
                menu.label !== "Visualization" &&
                menu.label !== "Simulation"
              }
            >
              {menu.label}
            </button>
            {openMenu === idx && (
              <div className="absolute w-52 left-0 top-full bg-gray-08 z-20 animate-fade-in">
                {menu.children.map((child) => (
                  <button
                    key={child}
                    className={`${childButtonBase} ${
                      (disabled &&
                        menu.label !== "Visualization" &&
                        menu.label !== "Simulation") ||
                      (child === "Launch Simulation" && !cacheIntegrity) ||
                      (child === "Shutdown" && !cacheIntegrity)
                        ? buttonDisabled
                        : buttonActive
                    }`}
                    type="button"
                    onClick={() => {
                      onMenuClick?.(menu.label, child);
                      setOpenMenu(null);
                    }}
                    disabled={
                      (disabled &&
                        menu.label !== "Visualization" &&
                        menu.label !== "Simulation") ||
                      (child === "Launch Simulation" && !cacheIntegrity) ||
                      (child === "Shutdown" && !cacheIntegrity)
                    }
                  >
                    {child}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="flex items-center">
        {disabled && (
          <>
            <div className="flex items-center mr-3">
              <span className="px-3 py-1 text-xs text-white rounded-full bg-gray-07">
                Simulation Web Socket | Cache Size: {cacheSize.toFixed(2)} MB
              </span>
              <button
                className="px-3 py-1 flex items-center hover:cursor-pointer"
                onClick={() => {
                  isPlaying ? onPauseSimulation?.() : onRunSimulation?.();
                  setIsPlaying(!isPlaying);
                }}
              >
                {isPlaying ? (
                  <ArrowPathIcon className="w-5 h-5 text-green-500 animate-spin hover:text-green-800" />
                ) : (
                  <PlayIcon className="w-5 h-5 text-green-700 hover:text-green-500" />
                )}
              </button>
              <button
                className="py-1 disabled:opacity-30 flex items-center hover:cursor-pointer"
                onClick={() => {
                  onStopSimulation?.();
                  setIsPlaying(false);
                }}
              >
                <PowerIcon className="w-5 h-5 text-red-500 hover:text-red-700" />
              </button>
            </div>
          </>
        )}
        {isLoading && (
          <div className="flex px-3 items-center justify-center text-white/70 animate-pulse">
            <span className="mr-2">Initializing Datasets...</span>
            <SpinnerWidget className={"w-4 h-4 border-2 border-white"} />{" "}
          </div>
        )}
      </div>
    </div>
  );
};

export default MenuBar;

async function getCacheSize() {
  try {
    const resp = await fetch("/api/local-cache/size", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    if (!resp.ok) {
      const error = await resp.json();
      console.error("获取缓存大小失败:", error);
      return -1;
    }
    const data: { data: number } = await resp.json();
    return data.data;
  } catch (error) {
    console.error("获取缓存大小异常:", error);
    return -1;
  }
}

async function checkCacheIntegrity(project: Project) {
  try {
    const resp = await fetch("/api/local-cache/check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(project),
    });
    if (!resp.ok) {
      const error = await resp.json();
      console.error("检查缓存完整性失败:", error);
      return false;
    }
    const result = await resp.json();

    // 检查所有字段是否都是 true
    const integrityObj = result.data;
    const allTrue = [
      integrityObj.earth_datas,
      integrityObj.gs_datas,
      integrityObj.roi_datas,
      integrityObj.sat_datas,
      integrityObj.sun_datas,
    ].every(Boolean);

    return allTrue;
  } catch (error) {
    console.error("检查缓存完整性异常:", error);
    return false;
  }
}
