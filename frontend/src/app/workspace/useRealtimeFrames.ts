import { useCallback, useEffect, useRef, useState } from "react";
import { ControlMessage, RealTime } from "@/types/simulation";
import { Project } from "@/types";
import { API_PATHS, WS_BASE_URL } from "@/lib/apiConfig";
import { set } from "ol/transform";

export function useRealtimeFrames() {
  const [frames, setFrames] = useState<RealTime[]>([]);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [error, setError] = useState<Error | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isRunning, setIsRunning] = useState(false);

  // 加载器 WebSocket
  const wsRef = useRef<WebSocket | null>(null);

  const updateFrames = (frame: RealTime) => {
    // setFrames((prev) => [...prev, frame]);
    // setFrames((prev) => {
    //   if (
    //     prev.length === 0 ||
    //     frame.currentStep > prev[prev.length - 1].currentStep
    //   ) {
    //     // console.log("Frames:", [...prev, frame]);
    //     return [...prev, frame];
    //   }
    //   return prev;
    // });
    setFrames((prev) => [...prev, frame]);
  };

  // 启动 WebSocket
  const connect = useCallback((project: Project) => {
    if (!project) return;
    setIsLoading(true);
    setFrames([]);
    setCurrentFrame(0);
    setError(null);
    // const ws = new WebSocket(WS_BASE_URL + API_PATHS.simulationWebSocket);
    // const ws = new WebSocket(WS_BASE_URL + API_PATHS.rlWebSocket);
    const ws = new WebSocket(WS_BASE_URL + API_PATHS.baselineWebSocket);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      setIsRunning(true);
      ws.send(JSON.stringify({ action: "init", payload: project }));
    };
    ws.onmessage = (event) => {
      try {
        const frame: RealTime = JSON.parse(event.data);
        // setFrames((prev) => [...prev, frame])
        console.log("Received frame:", frame);
        updateFrames(frame);
      } catch (e) {
        console.error("Frame parsing error:", e);
      }
    };
    ws.onerror = (e) => console.error("WebSocket error:", e);
    ws.onclose = () => {
      setIsConnected(false);
      setIsRunning(false);
    };
  }, []);

  const sendControlMessage = (msg: ControlMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    }
  };

  const runSimulation = () => {
    sendControlMessage({ action: "play" });
  };

  const pauseSimulation = () => {
    sendControlMessage({ action: "pause" });
  };

  // 断开 WebSocket
  const disconnect = useCallback(() => {
    wsRef.current?.close();
    wsRef.current = null;
    setIsLoading(false);
  }, []);

  return {
    frames,
    currentFrame,
    isLoading,
    isConnected,
    isRunning,
    connect,
    disconnect,
    runSimulation,
    pauseSimulation,
    setCurrentFrame,
  };
}