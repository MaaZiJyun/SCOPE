import { useEffect, useRef, useState } from "react";
import { useFrames } from "../useFramesContext";
import { PauseIcon, PlayIcon, StopIcon } from "@heroicons/react/24/outline";
import { toInputLocal } from "@/services/date_time/time_convert";

export default function Player() {
  const { frames, currentFrame, setCurrentFrame } = useFrames();
  const [totalTime, setTotalTime] = useState("");
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        setIsPlaying((prev) => !prev);
        e.preventDefault();
      }
      if (e.code === "right" || e.code === "ArrowRight") {
        setCurrentFrame((prev) => {
          const step = e.shiftKey ? 10 : 1;
          return prev + step < frames.length ? prev + step : frames.length - 1;
        });
        e.preventDefault();
      }
      if (e.code === "left" || e.code === "ArrowLeft") {
        setCurrentFrame((prev) => {
          const step = e.shiftKey ? 10 : 1;
          return prev - step >= 0 ? prev - step : 0;
        });
        e.preventDefault();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [frames.length]);

  useEffect(() => {
    const frame = frames[currentFrame];
    if (frame) {
      setTotalTime(frames[frames.length - 1].time);
      setCurrentFrameIndex(frame.currentFrame);
      setCurrentTime(frame.time);
    }
  }, [currentFrame, frames]);

  useEffect(() => {
    // 如果正在播放并且定时器没设置过
    if (isPlaying && intervalRef.current === null) {
      intervalRef.current = setInterval(() => {
        setCurrentFrame((prev) => (prev + 1 < frames.length ? prev + 1 : prev));
      }, 200);
    }
    // 如果暂停播放
    if (!isPlaying && intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // 卸载时清理
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isPlaying, frames.length]);

  const onPlay = () => setIsPlaying(true);
  const onPause = () => setIsPlaying(false);
  const onStop = () => {
    setIsPlaying(false);
    setCurrentFrame(0);
  };

  return (
    <div className="absolute w-full bottom-0 left-0 z-10 opacity-10 hover:opacity-100 transition-opacity duration-500">
      <div className="flex flex-col items-center w-full px-6">
        <div className="relative flex items-center gap-2 w-full">
          <input
            type="range"
            min={0}
            max={frames.length - 1}
            value={currentFrame}
            onChange={(e) => {
              const frame = parseInt(e.target.value);
              setCurrentFrame(frame);
              setIsPlaying(false);
            }}
            className={`
              w-full h-1 appearance-none
              bg-white/20 rounded-full mb-1
              [&::-webkit-slider-thumb]:appearance-none
              [&::-webkit-slider-thumb]:w-1
              [&::-webkit-slider-thumb]:h-1
              [&::-webkit-slider-thumb]:bg-white
              [&::-webkit-slider-thumb]:rounded-full
              [&::-webkit-slider-thumb]:shadow
              [&::-webkit-slider-thumb]:cursor-pointer

              [&::-moz-range-thumb]:w-1
              [&::-moz-range-thumb]:h-1
              [&::-moz-range-thumb]:bg-white
              [&::-moz-range-thumb]:rounded-full
              [&::-moz-range-thumb]:cursor-pointer
            `}
          />
          <div className="absolute w-full top-2">
            <div className="flex justify-between items-center">
              <div className="text-xs">
                <span className="text-white">
                  {toInputLocal(currentTime)}[{currentFrameIndex}]
                </span>
              </div>
              <div className="text-xs">
                <span className="text-white">
                  {toInputLocal(totalTime)}[{frames.length}]
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex justify-center items-center w-full pt-2 pb-4">
          <div className="flex space-x-3">
            <button
              onClick={onPlay}
              disabled={isPlaying}
              className="bg-white rounded-full p-2 shadow disabled:opacity-50"
            >
              <PlayIcon className="w-4 h-4 text-black" />
            </button>
            <button
              onClick={onPause}
              disabled={!isPlaying}
              className="bg-white rounded-full p-2 shadow disabled:opacity-50"
            >
              <PauseIcon className="w-4 h-4 text-black" />
            </button>
            <button
              onClick={onStop}
              disabled={currentFrame === 0}
              className="bg-white rounded-full p-2 shadow"
            >
              <StopIcon className="w-4 h-4 text-black" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
