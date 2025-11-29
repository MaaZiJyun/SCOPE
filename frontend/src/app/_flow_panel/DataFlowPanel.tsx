import React, { useRef, useEffect, useState, useCallback } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import { SCALE } from "../../lib/DefaultObjects";
import * as THREE from "three";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
} from "recharts";
import {
  LinkFrame,
  SatelliteFrame,
  StationFrame,
  Task,
} from "@/types/simulation";
import { useFrames } from "../workspace/useFramesContext";
import VoidPage from "@/components/VoidPage";
import { PauseIcon, PlayIcon, StopIcon } from "@heroicons/react/24/outline";
import ClockWidget from "@/components/ClockWidget";

interface DataPoint {
  time: number;
  value: number;
}

function SatDataNode({ sat }: { sat: SatelliteFrame }) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const ratio =
    // sat.storageDataRatio + sat.rawBuffDataRatio + sat.procBuffDataRatio;
    1;

  useFrame(() => {
    if (meshRef.current) {
      const { x, y, z } = sat.pos;
      meshRef.current.position.set(x * SCALE, y * SCALE, z * SCALE);
      const size = 1;
      meshRef.current.scale.set(size, size, size);
    }
  });

  let color = "#ffffff";

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[5, 16, 16]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={2}
      />
      <Html distanceFactor={5000} position={[0, 0, 0]}>
        <div
          className="select-none flex flex-col w-20 items-center"
          style={{
            color: sat.onGS
              ? "red"
              : sat.attnHead || ratio > 0
              ? "white"
              : "#333",
            fontWeight: 200,
            fontSize: 10,
            padding: "1px 4px",
          }}
        >
          <span>SAT-{sat.id.slice(-6)}</span>
          <span>{ratio.toFixed(4)}</span>
        </div>
      </Html>
    </mesh>
  );
}
function TaskDataNode({ sat, task }: { sat: SatelliteFrame; task: Task }) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const ratio = 1 - task.infer_percent;

  useFrame(() => {
    if (meshRef.current) {
      const { x, y, z } = sat.pos;
      meshRef.current.position.set(x * SCALE, y * SCALE, z * SCALE);
      const size = THREE.MathUtils.clamp(
        ratio * 5000,
        sat.attnHead ? 1 : 0,
        100
      );
      meshRef.current.scale.set(size, size, size);
    }
  });

  let color = getColorFromId(task.id);

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[5, 16, 16]} />
      <meshStandardMaterial
        color={color}
        transparent
        opacity={task.acted === 5 ? 1 : 0.5}
        emissive={color}
        emissiveIntensity={2}
      />
      <Html distanceFactor={5000} position={[0, 0, 0]}>
        <div className="select-none flex flex-col w-20 items-center">
          <span>Task {task.id}</span>
        </div>
      </Html>
    </mesh>
  );
}

function GsDataNode({ gs }: { gs: StationFrame }) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const ratio = gs.omega;

  useFrame(() => {
    if (meshRef.current) {
      const { x, y, z } = gs.pos;
      meshRef.current.position.set(x * SCALE, y * SCALE, z * SCALE);
      const size = THREE.MathUtils.clamp(
        ratio * 5000,
        gs.missionToUpload ? 1 : 0,
        100
      );
      meshRef.current.scale.set(size, size, size);
    }
  });

  let color = "#ff8585";
  if (gs.onUpload) color = "blue";
  if (gs.onDownload) color = "red";

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[5, 16, 16]} />
      <meshStandardMaterial
        color={color}
        transparent
        opacity={Math.min(ratio * 100, 1)}
        emissive={color}
        emissiveIntensity={2}
      />
      <Html distanceFactor={5000} position={[0, 0, 0]}>
        <div
          className="select-none flex flex-col w-20 items-center"
          style={{
            color: gs.onDownload ? "red" : "white",
            fontWeight: 200,
            fontSize: 10,
            padding: "1px 4px",
          }}
        >
          <span>GS-{gs.id.slice(-6)}</span>
          {/* <span>{ratio.toFixed(4)}</span> */}
        </div>
      </Html>
    </mesh>
  );
}

function DataFlowScene({
  satellites,
  stations,
  links,
  tasks,
}: {
  satellites: SatelliteFrame[];
  stations: StationFrame[];
  links: LinkFrame[];
  tasks: Task[];
}) {
  return (
    <Canvas
      camera={{ position: [0, 0, 30000], fov: 30, near: 0.01, far: 100000 }}
    >
      <ambientLight intensity={0.5} />
      <pointLight position={[5, 5, 5]} intensity={1.5} />
      <OrbitControls />
      <group rotation={[-Math.PI / 2, 0, 0]}>
        {satellites.map((sat) => (
          <SatDataNode key={sat.id} sat={sat} />
        ))}
        {tasks.map((t) => {
          const sat = satellites.find(
            (s) => s.plane === t.plane_at && s.order === t.order_at
          );
          if (!sat) return null;

          const act = Number(t.acted);
          if ([1, 2, 3, 4].includes(act) === false) {
            if (sat) return <TaskDataNode key={t.id} sat={sat} task={t} />;
            return null;
          }
          let targetPlane = t.plane_at;
          let targetOrder = t.order_at;
          switch (act) {
            case 1:
              targetPlane++;
              break;
            case 2:
              targetPlane--;
              break;
            case 3:
              targetOrder++;
              break;
            default:
              targetOrder--;
              break;
          }
          const tar = satellites.find(
            (s) => s.plane === targetPlane && s.order === targetOrder
          );

          let arrowEl = null;
          if (tar) {
            const startVec = new THREE.Vector3(
              sat.pos.x,
              sat.pos.y,
              sat.pos.z
            ).multiplyScalar(SCALE);
            const endVec = new THREE.Vector3(
              tar.pos.x,
              tar.pos.y,
              tar.pos.z
            ).multiplyScalar(SCALE);

            const dir = new THREE.Vector3().subVectors(endVec, startVec);
            const dist = dir.length();
            const dirNorm = dir.clone().normalize();

            // --- cone size ---
            const coneHeight = Math.min(1000, Math.max(60, dist * 0.1));
            const coneRadius = coneHeight * 0.35;

            // --- short line: length = 1/2 of full distance ---
            const lineLength = dist * 0.2;
            const cylinderRadius = Math.max(8, dist * 0.01); // 控制粗细
            const cylPos = startVec
              .clone()
              .add(dirNorm.clone().multiplyScalar(lineLength * 0.5));
            const cylHeight = lineLength;

            // quaternion 从 +Y 轴指向 dirNorm（用于 cylinder 和 cone）
            const q = new THREE.Quaternion().setFromUnitVectors(
              new THREE.Vector3(0, 1, 0),
              dirNorm
            );

            // 把箭头放在目标方向但离目标一点（避免与 cylinder 相撞）
            const conePos = startVec
              .clone()
              .add(
                dirNorm.clone().multiplyScalar(lineLength + coneHeight * 0.5)
              );

            const color = getColorFromId(t.id);
            const trans = 0.5;

            arrowEl = (
              <group key={`arrow-${t.id}`}>
                {/* 粗线用 cylinder 实现 */}
                <mesh position={[cylPos.x, cylPos.y, cylPos.z]} quaternion={q}>
                  <cylinderGeometry
                    args={[cylinderRadius, cylinderRadius, cylHeight, 12]}
                  />
                  <meshStandardMaterial color={color} emissive={color} transparent opacity={trans} />
                </mesh>

                {/* 箭头锥体，放在 cylinder 末端外侧 */}
                <mesh
                  position={[conePos.x, conePos.y, conePos.z]}
                  quaternion={q}
                >
                  <coneGeometry args={[coneRadius, coneHeight, 8]} />
                  <meshStandardMaterial color={color} emissive={color} transparent opacity={trans} />
                </mesh>
              </group>
            );
          }

          return (
            <group key={`task-${t.id}`}>
              <TaskDataNode sat={sat} task={t} />
              {arrowEl}
            </group>
          );
        })}
        {stations.map((gs) => (
          <GsDataNode key={gs.id} gs={gs} />
        ))}
        {links.map((link, i) => {
          const [start, end] = link.linkPos;
          const startVec = new THREE.Vector3(
            start.x,
            start.y,
            start.z
          ).multiplyScalar(1 * SCALE);
          const endVec = new THREE.Vector3(end.x, end.y, end.z).multiplyScalar(
            1 * SCALE
          );
          const geometry = new THREE.BufferGeometry().setFromPoints([
            startVec,
            endVec,
          ]);

          // 计算线段中点
          const midVec = startVec.clone().add(endVec).multiplyScalar(0.5);

          return (
            <line key={i}>
              <primitive object={geometry} attach="geometry" />
              <lineBasicMaterial
                attach="material"
                transparent
                opacity={0.2}
                color={"#ffffff"}
                linewidth={2}
              />
              {/* <Html distanceFactor={1} position={[midVec.x, midVec.y, midVec.z]}>
              <div
                className="select-none w-20"
                style={{
                  color: "white",
                  fontWeight: 200,
                  fontSize: 5,
                  padding: "1px 4px",
                }}
              >
                {link.rate.toFixed(2)} bps
              </div>
            </Html> */}
            </line>
          );
        })}
      </group>
    </Canvas>
  );
}

export default function DataFlowPanel() {
  const { frames, currentFrame, setCurrentFrame } = useFrames();
  // const [currentFrame, setCurrentFrame] = useState(0);
  const [timestamp, setTimestamp] = useState<string>("Waiting to start");
  const [satStates, setSatStates] = useState<SatelliteFrame[]>([]);
  const [linkStates, setLinkStates] = useState<LinkFrame[]>([]);
  const [taskStates, setTaskStates] = useState<Task[]>([]);
  const [stationStates, setStationStates] = useState<StationFrame[]>([]);

  // 每次 currentFrame 变动，更新显示内容
  useEffect(() => {
    const frame = frames[currentFrame];
    if (frame) {
      setSatStates(frame.satellites);
      setLinkStates(frame.links);
      setStationStates(frame.stations);
      setTaskStates(frame.tasks);
      setTimestamp(frame.time);
    }
  }, [currentFrame, frames]);

  if (frames.length === 0) {
    return <VoidPage />;
  }

  return (
    <div className="flex flex-col h-full w-full py-12 px-6 bg-black text-white">
      <div className="absolute top-10 right-0 z-5">
        <ClockWidget
          timeSlot={frames[currentFrame].currentFrame}
          time={frames[currentFrame].time}
        />
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
      <div className="flex w-full h-full my-4">
        <DataFlowScene
          satellites={satStates}
          stations={stationStates}
          links={linkStates}
          tasks={taskStates}
        />
      </div>
    </div>
  );
}

function getColorFromId(id: string | number) {
  const s = String(id);
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  // 用常数乘并取无符号值再 mod 360，能把相邻输入扩散到不同 hue
  const hue = Math.abs(((h * 2654435761) >>> 0) % 360);
  return `hsl(${hue}, 70%, 50%)`;
}
