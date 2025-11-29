import { LatLon, XYZ } from "@/types";
import { send } from "process";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useFrames } from "../workspace/useFramesContext";
import {
  Message,
  RealTime,
  SatelliteFrame,
  StationFrame,
} from "@/types/simulation";
import VoidPage from "@/components/VoidPage";
import {
  ArrowsUpDownIcon,
  CameraIcon,
  CpuChipIcon,
  RssIcon,
  SunIcon,
} from "@heroicons/react/24/outline";
import ClockWidget from "@/components/ClockWidget";
import SatellitePanel from "./_partial/satellitePanel";
import StationPanel from "./_partial/stationPanel";
import PipePanel from "./_partial/PipePanel";

export default function ParameterPanel() {
  const { frames, currentFrame, setCurrentFrame } = useFrames();
  const [satStates, setSatStates] = useState<SatelliteFrame[]>([]);
  const [gsStates, setGsStates] = useState<StationFrame[]>([]);
  const [pipeStates, setPipeStates] = useState<Message[]>([]);
  const [currentSlot, setCurrentSlot] = useState(0);
  const [currentTime, setCurrentTime] = useState("");

  // 每次 currentFrame 变动，更新显示内容
  useEffect(() => {
    const frame = frames[currentFrame];
    if (frame) {
      setSatStates(frame.satellites);
      setGsStates(frame.stations);
      setPipeStates(frame.pipe);
      setCurrentSlot(frame.currentFrame);
      setCurrentTime(frame.time);
    }
  }, [currentFrame, frames]);

  if (frames.length === 0) {
    return <VoidPage />;
  }

  return (
    <div className="flex flex-col h-full w-full py-12 bg-black text-white">
      <div className="absolute bg-black top-0 right-0 z-50">
        <ClockWidget timeSlot={currentSlot} time={currentTime} />
      </div>
      {/* <LineChart width={600} height={300} data={data}>
        <CartesianGrid stroke="#eee" />
        <XAxis dataKey="time" />
        <YAxis domain={[0, 1]} />
        <Tooltip />
        <Line
          type="monotone"
          dataKey="value"
          stroke="#8884d8"
          isAnimationActive={false}
        />
      </LineChart> */}
      <div className="flex w-full h-2/5">
        <SatellitePanel satStates={satStates} />
      </div>
      <div className="flex w-full h-2/5">
          <PipePanel pipeStates={pipeStates} />
      </div>
        <div className="flex w-full h-1/5">
          <StationPanel gsStates={gsStates} />
        </div>
    </div>
  );
}
