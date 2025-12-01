import { useEffect, useState } from "react";
import { Project, Satellite, GroundStation, ROI } from "@/types";
import {
  ChevronRightIcon,
  ClockIcon,
  Cog6ToothIcon,
  CubeIcon,
  EllipsisHorizontalIcon,
  LinkIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import { useFrames } from "../useFramesContext";
import {
  LinkFrame,
  Task,
  SatelliteFrame,
  StationFrame,
} from "@/types/simulation";
import SatDataPercentageCard from "@/components/SatDataPercentageCard";
import GsDataPercentageCard from "@/components/GsDataPercentageCard";
import { ShakingIcon } from "@/components/ShakingIcon";
import LinkDataCard from "@/components/LinkDataCard";
import MissionDataCard from "@/components/MissionDataCard";
import ProcessBar from "@/components/ProcessBar";

interface InventoryProps {
  project: Project;
}

export const Inventory = ({ project }: InventoryProps) => {
  const { frames, currentFrame } = useFrames();
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("Entities");
  const [satStates, setSatStates] = useState<SatelliteFrame[]>([]);
  const [linkStates, setLinkStates] = useState<LinkFrame[]>([]);
  const [missionStates, setMissionStates] = useState<Task[]>([]);
  const [stationStates, setStationStates] = useState<StationFrame[]>([]);

  useEffect(() => {
    const frame = frames[currentFrame];
    if (frame) {
      setSatStates(frame.satellites);
      setStationStates(frame.stations);
      setLinkStates(frame.links);
      setMissionStates(frame.tasks);
    }
  }, [currentFrame, frames]);

  // 搜索过滤函数
  const filterBySearch = (items: any[], keys: string[]) =>
    items.filter((item) =>
      keys.some((key) =>
        String(item[key] ?? "")
          .toLowerCase()
          .includes(search.toLowerCase())
      )
    );

  const filteredSats = filterBySearch(project.satellites ?? [], ["id", "name"]);
  const filteredGS = filterBySearch(project.groundStations ?? [], [
    "id",
    "name",
  ]);
  const filteredROIs = filterBySearch(project.rois ?? [], ["id", "name"]);
  return (
    <div className="flex h-full w-full">
      <div className="h-full flex flex-col items-center justify-between border border-white/10">
        <div>
          <ShakingIcon
            className={`p-2 hover:text-white hover:cursor-pointer 
            ${
              tab === "Entities"
                ? "text-yellow-600 border-l-2"
                : "text-white/60"
            }`}
            onClick={() => setTab("Entities")}
          >
            <CubeIcon className="h-7 w-7" />
          </ShakingIcon>
          <ShakingIcon
            className={`p-2 hover:text-white hover:cursor-pointer
            ${
              tab === "Search" ? "text-yellow-600 border-l-2" : "text-white/60"
            }`}
            onClick={() => setTab("Search")}
          >
            <MagnifyingGlassIcon className="h-7 w-7" />
          </ShakingIcon>
          <ShakingIcon
            className={`p-2 hover:text-white hover:cursor-pointer 
            ${
              tab === "Timeline"
                ? "text-yellow-600 border-l-2"
                : "text-white/60"
            }`}
            onClick={() => setTab("Timeline")}
          >
            <ClockIcon className="h-7 w-7" />
          </ShakingIcon>
          <ShakingIcon
            className={`p-2 hover:text-white hover:cursor-pointer 
            ${
              tab === "Links" ? "text-yellow-600 border-l-2" : "text-white/60"
            }`}
            onClick={() => setTab("Links")}
          >
            <LinkIcon className="h-7 w-7" />
          </ShakingIcon>
        </div>
        <ShakingIcon className="p-2">
          <Cog6ToothIcon className="h-7 w-7 text-gray-500" />
        </ShakingIcon>
      </div>
      <div className="w-full h-full flex flex-col px-3 py-2">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xs font-semibold">EXPLORER</h2>
        </div>
        {tab === "Links" && (
          <div className="flex flex-col h-full text-xs text-white/80">
            <div className="overflow-y-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
              <CollapsibleSection title="Inter-Satellite Links">
                {linkStates.length === 0 ? (
                  <div className="flex items-center justify-center py-4">
                    <p className="text-gray-04">Simulation has not started</p>
                  </div>
                ) : (
                  linkStates
                    .filter((link) => link.type === "ISL")
                    .map((link, i) => <LinkDataCard key={i} link={link} />)
                )}
              </CollapsibleSection>
              <CollapsibleSection title="Uplink">
                {linkStates.length === 0 ? (
                  <div className="flex items-center justify-center py-4">
                    <p className="text-gray-04">Simulation has not started</p>
                  </div>
                ) : (
                  linkStates
                    .filter((link) => link.type === "UL")
                    .map((link, i) => <LinkDataCard key={i} link={link} />)
                )}
              </CollapsibleSection>
              <CollapsibleSection title="Downlink">
                {linkStates.length === 0 ? (
                  <div className="flex items-center justify-center py-4">
                    <p className="text-gray-04">Simulation has not started</p>
                  </div>
                ) : (
                  linkStates
                    .filter((link) => link.type === "DL")
                    .map((link, i) => <LinkDataCard key={i} link={link} />)
                )}
              </CollapsibleSection>
            </div>
          </div>
        )}
        {tab === "Timeline" && (
          <div className="flex flex-col h-full text-xs text-white/80">
            <div className="py-2">
              <p className="mb-1">Total Missions: {missionStates.length}</p>
              <p className="mb-1">
                Completed: {missionStates.filter((m) => m.is_done).length}
              </p>
              <ProcessBar
                progress={
                  missionStates.filter((m) => m.is_done).length /
                  missionStates.length
                }
                name={"Total Completion"}
              />
            </div>
            {missionStates.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-04">Simulation has not started</p>
              </div>
            ) : (
              <div className="overflow-y-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
                {missionStates.map((mission, i) => (
                  <CollapsibleSection
                    title={"Mission NO." + mission.id.toString()}
                    key={i}
                  >
                    <MissionDataCard mission={mission} />
                  </CollapsibleSection>
                ))}
              </div>
            )}
          </div>
        )}
        {tab === "Search" && (
          <div className="flex flex-col h-full text-xs text-white/80">
            <div className="relative text-gray-400 mb-4">
              <input
                type="text"
                placeholder="Search items..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded text-sm bg-gray-07 px-2 py-1 text-gray-02 placeholder-gray-02 focus:outline-none focus:ring-2 focus:ring-gray-300"
              />
              <MagnifyingGlassIcon className="w-4 h-4 absolute right-3 top-1.5 text-gray-04 pointer-events-none" />
            </div>
            <div className="overflow-y-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
              <CollapsibleSection title={project.constellation.name}>
                {filteredSats.map((sat) => (
                  <SatelliteItem
                    key={sat.id}
                    sat={sat}
                    satFrame={(satStates ?? []).find((s) => s.id === sat.id)}
                  />
                ))}
              </CollapsibleSection>
              <CollapsibleSection title="Ground Stations">
                {filteredGS.map((gs) => (
                  <GroundStationItem
                    key={gs.id}
                    gs={gs}
                    gsFrame={(stationStates ?? []).find((g) => g.id === gs.id)}
                  />
                ))}
              </CollapsibleSection>
              <CollapsibleSection title="ROIs">
                {filteredROIs.map((roi) => (
                  <RoiItem key={roi.id} roi={roi} />
                ))}
              </CollapsibleSection>
            </div>
          </div>
        )}
        {tab === "Entities" && (
          <div className="flex flex-col h-full text-xs text-white/80">
            <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
              <CollapsibleSection title={project.constellation.name}>
                {project.satellites.map((sat) => (
                  <SatelliteItem
                    key={sat.id}
                    sat={sat}
                    satFrame={(satStates ?? []).find((s) => s.id === sat.id)}
                  />
                ))}
              </CollapsibleSection>
              <CollapsibleSection title="Ground Stations">
                {project.groundStations.map((gs) => (
                  <GroundStationItem
                    key={gs.id}
                    gs={gs}
                    gsFrame={(stationStates ?? []).find((g) => g.id === gs.id)}
                  />
                ))}
              </CollapsibleSection>
              <CollapsibleSection title="ROIs">
                {project.rois.map((roi) => (
                  <RoiItem key={roi.id} roi={roi} />
                ))}
              </CollapsibleSection>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// 折叠 Section 组件
function CollapsibleSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);

  return (
    <div className="mb-4">
      <div
        className="flex items-center cursor-pointer select-none mb-2"
        onClick={() => setOpen(!open)}
      >
        <ChevronRightIcon
          className={`w-4 h-4 inline-block mr-1 transition-transform ${
            open ? "rotate-90" : ""
          }`}
          aria-hidden="true"
        />
        <span className="text-white text-xs cursor-pointer select-none">
          {title.toUpperCase()}
        </span>
      </div>
      <div className="space-y-2">{open && children}</div>
    </div>
  );
}

function SatelliteItem({
  sat,
  satFrame,
}: {
  sat: Satellite;
  satFrame: SatelliteFrame | undefined;
}) {
  // const [expanded, setExpanded] = useState(false);
  const [folded, setFolded] = useState(true);
  // Remove useState for satStates, just use satFrame directly
  return (
    <div className="select-none relative ml-4 cursor-pointer">
      <div
        className="flex items-center justify-between text-white/80 hover:text-white transition-colors"
        onClick={() => setFolded(!folded)}
      >
        <div className="flex items-center">
          <ChevronRightIcon
            className={`w-4 h-4 inline-block mr-1 transition-transform ${
              folded ? "rotate-90" : ""
            }`}
            aria-hidden="true"
          />
          <span>{sat.name}</span>
        </div>
        {/* <div
          onMouseOver={() => setExpanded(true)}
          onMouseLeave={() => setExpanded(false)}
        >
          <EllipsisHorizontalIcon className="w-4 h-4 inline-block mx-1 text-gray-400" />

          {expanded && (
            <div className="absolute right-0 z-10 w-32 bg-gray-07 p-2 rounded-md">
              <InfoItem label="ID" value={sat.id.slice(-6)} />
              <InfoItem label="Name" value={sat.name} />
              <InfoItem label="Plane" value={sat.plane} />
              <InfoItem label="Order" value={sat.order} />
            </div>
          )}
        </div> */}
      </div>
      {folded && (
        <>
          <div className="mt-1 mb-2 px-2">
            <InfoItem label="ID" value={sat.id} />
            {/* <InfoItem label="Name" value={sat.name} /> */}
            <InfoItem label="Plane" value={sat.plane} />
            <InfoItem label="Order" value={sat.order} />
            {/* <SatDataPercentageCard key={sat.id} sat={satFrame} /> */}
            <ProcessBar
              progress={satFrame ? satFrame.batteryPercent / 100 : 0}
              name={"Battery Level"}
            />
          </div>
        </>
      )}
    </div>
  );
}

function GroundStationItem({
  gs,
  gsFrame,
}: {
  gs: GroundStation;
  gsFrame: StationFrame | undefined;
}) {
  const [expanded, setExpanded] = useState(false);
  const [folded, setFolded] = useState(false);
  return (
    <div className="select-none relative ml-4 cursor-pointer">
      <div
        className="flex items-center justify-between text-white/80 hover:text-white transition-colors"
        onClick={() => setFolded(!folded)}
      >
        <div className="flex items-center">
          <ChevronRightIcon
            className={`w-4 h-4 inline-block mr-1 transition-transform ${
              folded ? "rotate-90" : ""
            }`}
            aria-hidden="true"
            onMouseOver={() => setExpanded(true)}
            onMouseLeave={() => setExpanded(false)}
          />
          <span>{gs.name}</span>
        </div>
        <EllipsisHorizontalIcon
          className="w-4 h-4 inline-block mx-1 text-gray-400"
          onMouseOver={() => setExpanded(true)}
          onMouseLeave={() => setExpanded(false)}
        />
        {expanded && (
          <div className="absolute right-0 z-10 w-48 bg-gray-07 p-2 rounded-md">
            <InfoItem label="ID" value={gs.id.slice(-6)} />
            <InfoItem label="Name" value={gs.name} />
            <InfoItem label="Lat" value={gs.location.lat} />
            <InfoItem label="Lon" value={gs.location.lon} />
          </div>
        )}
      </div>
      {folded && (
        <div className="mt-1 mb-4">
          <GsDataPercentageCard key={gs.id} gs={gsFrame} />
        </div>
      )}
    </div>
  );
}

function RoiItem({ roi }: { roi: ROI }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="select-none relative ml-4 cursor-pointer">
      <div
        className="text-white/80 hover:text-white transition-colors"
        onMouseOver={() => setExpanded(true)}
        onMouseLeave={() => setExpanded(false)}
      >
        {roi.name}
        {expanded && (
          <div className="absolute right-0 bottom-0 z-10 w-48 bg-gray-07 p-2 rounded-md">
            <InfoItem label="ID" value={roi.id.slice(-6)} />
            <InfoItem label="Name" value={roi.name} />
            <InfoItem label="Length" value={roi.length} />
            <InfoItem label="Width" value={roi.width} />
            <InfoItem label="Lat" value={roi.location.lat} />
            <InfoItem label="Lon" value={roi.location.lon} />
          </div>
        )}
      </div>
    </div>
  );
}

// 单项信息组件
function InfoItem({ label, value }: { label: string; value: any }) {
  return (
    <div className="flex justify-between gap-2 text-white/70 text-xs">
      <span>{label}</span>
      <span className="text-right break-all">{value ?? "-"}</span>
    </div>
  );
}
