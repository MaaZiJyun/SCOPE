"use client";

import {
  MapContainer,
  TileLayer,
  Marker,
  Polygon,
  Popup,
  CircleMarker,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useFrames } from "../workspace/useFramesContext";
import { useEffect, useState } from "react";
import { ROIFrame, SatelliteFrame, StationFrame } from "@/types/simulation";
import VoidPage from "@/components/VoidPage";
import ClockWidget from "@/components/ClockWidget";

// 解决默认 marker 图标不显示的问题
const DefaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});
L.Marker.prototype.options.icon = DefaultIcon;

export default function MapViewPage() {
  const { frames, currentFrame } = useFrames();
  const [coverageStates, setCoverageStates] = useState<[number, number][][]>(
    []
  );
  const [satStates, setSatStates] = useState<SatelliteFrame[]>([]);
  const [stationStates, setStationStates] = useState<StationFrame[]>([]);
  const [roiStates, setRoiStates] = useState<ROIFrame[]>([]);
  const [currentSlot, setCurrentSlot] = useState(0);
  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    const frame = frames[currentFrame];
    if (frame) {
      setSatStates(frame.satellites);
      setStationStates(frame.stations);
      setRoiStates(frame.rois);
      setCurrentSlot(frame.currentFrame);
      setCurrentTime(frame.time);
      // 让 coverageStates 成为所有卫星覆盖区角点列表
      // const coverage = frame.satellites.map((sat) => {
      //   const corners: [number, number][] = sat.imgCornersLon.map((corner) => [
      //     corner.lat,
      //     corner.lon,
      //   ]);
      //   return corners;
      // });
      // setCoverageStates(coverage);
      const coverage: [number, number][][] = frames
        .slice(0, currentFrame)
        .flatMap((frame) =>
          frame.satellites.map((sat) =>
            sat.imgCornersLon
              .filter(
                (corner) =>
                  typeof corner.lat === "number" &&
                  typeof corner.lon === "number" &&
                  !isNaN(corner.lat) &&
                  !isNaN(corner.lon)
              )
              .map((corner) => [corner.lat, corner.lon] as [number, number])
          )
        );
      setCoverageStates(coverage);
    }
  }, [currentFrame, frames]);

  if (frames.length === 0) {
    return <VoidPage />;
  }

  // 设置最大和最小纬度
  const minLat = -91;
  const maxLat = 91;
  const minLon = -181;
  const maxLon = 181;
  const bounds: [[number, number], [number, number]] = [
    [minLat, minLon],
    [maxLat, maxLon],
  ];

  return (
    <div className="flex flex-col h-full w-full py-12 bg-black text-white relative">
      {/* 让ClockWidget绝对定位并z-index高于地图 */}
      <div className="absolute top-10 right-0 z-30">
        <ClockWidget timeSlot={currentSlot} time={currentTime} />
      </div>

      {/* 地图容器设置较低z-index */}
      <div
        className="w-full h-full"
        style={{ zIndex: 10, position: "relative" }}
      >
        <MapContainer
          bounds={bounds}
          center={[0, 0]}
          zoom={1.5}
          minZoom={1.5}
          className="w-full h-full"
          maxBounds={bounds}
          dragging={true}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution=""
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />

          {/* 卫星覆盖区域（多边形） */}
          {satStates.map((sat, idx) => {
            const corners: [number, number][] = sat.imgCornersLon.map(
              (corner) => [corner.lat, corner.lon]
            );
            // 检查所有相邻点的经纬度差
            let valid = true;
            for (let i = 1; i < corners.length; i++) {
              const prev = corners[i - 1];
              const curr = corners[i];
              if (
                Math.abs(prev[0] - curr[0]) >= 90 ||
                Math.abs(prev[1] - curr[1]) >= 90
              ) {
                valid = false;
                break;
              }
            }
            if (corners.length >= 3 && valid) {
              return (
                <Polygon
                  key={`sat-poly-${sat.id}`}
                  positions={corners}
                  pathOptions={{ color: "white", // 边框颜色
                    opacity: 0.1,
                    weight: 1, // 边框宽度
                    fillColor: "white", // 填充颜色
                    fillOpacity: 0.2, // 填充透明度
                  }}
                >
                  <Popup>{sat.id}</Popup>
                </Polygon>
              );
            }
            return null;
          })}

          {coverageStates.map((corners, idx) => {
            let valid = true;
            for (let i = 1; i < corners.length; i++) {
              const prev = corners[i - 1];
              const curr = corners[i];
              if (
                Math.abs(prev[0] - curr[0]) >= 90 ||
                Math.abs(prev[1] - curr[1]) >= 90
              ) {
                valid = false;
                break;
              }
            }
            if (corners.length >= 3 && valid) {
              return (
                <Polygon
                  key={`sat-poly-${idx}`}
                  positions={corners}
                  pathOptions={{
                    color: "green", // 边框颜色
                    opacity: 0.1,
                    weight: 1, // 边框宽度
                    fillColor: "green", // 填充颜色
                    fillOpacity: 0.2, // 填充透明度
                  }}
                />
              );
            }
            return null;
          })}

          {/* 地面站点（圆形标记） */}
          {stationStates.map((station, idx) => (
            <CircleMarker
              key={`station-${station.id}`}
              center={[station.loc.lat, station.loc.lon]}
              radius={1}
              color="green"
              fillColor="green"
              fillOpacity={0.7}
            >
              <Popup>{station.id}</Popup>
            </CircleMarker>
          ))}

          {/* ROI区域（多边形） */}
          {roiStates.map((roi, idx) => {
            const corners: [number, number][] = roi.cornersLoc.map((corner) => [
              corner.lat,
              corner.lon,
            ]);
            if (corners.length >= 3) {
              return (
                <Polygon
                  key={`roi-poly-${roi.id}`}
                  positions={corners}
                  pathOptions={{ color: "red" }}
                >
                  <Popup>{roi.id}</Popup>
                </Polygon>
              );
            }
            return null;
          })}
        </MapContainer>
      </div>

      <style jsx global>{`
        .leaflet-control-attribution {
          display: none !important;
        }
      `}</style>
    </div>
  );
}
