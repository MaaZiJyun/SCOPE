import React, {
  useRef,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { Html, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { TextureLoader } from "three";
import { SCALE, EARTH_DISPLAY_RADIUS_P } from "../../lib/DefaultObjects";
import {
  EarthFrame,
  LinkFrame,
  ROIFrame,
  SatelliteFrame,
  StationFrame,
  SunFrame,
} from "@/types/simulation";
import { useFrames } from "../workspace/useFramesContext";
import ClockWidget from "@/components/ClockWidget";
import VoidPage from "@/components/VoidPage";

function invertTexture(texture: THREE.Texture) {
  const canvas = document.createElement("canvas");
  canvas.width = texture.image.width;
  canvas.height = texture.image.height;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(texture.image, 0, 0);
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  for (let i = 0; i < imgData.data.length; i += 4) {
    // 反相灰度
    const gray = imgData.data[i]; // R=G=B
    const inv = 255 - gray;
    imgData.data[i] = inv;
    imgData.data[i + 1] = inv;
    imgData.data[i + 2] = inv;
    // alpha不变
  }
  ctx.putImageData(imgData, 0, 0);
  const newTexture = new THREE.Texture(canvas);
  newTexture.needsUpdate = true;
  return newTexture;
}

function Earth({
  earth,
  earthRef,
}: {
  earth: EarthFrame;
  earthRef: React.RefObject<THREE.Object3D>;
}) {
  const texture = useLoader(TextureLoader, "/planet_texture/_earth.jpg");
  const cloudTexture = useLoader(TextureLoader, "/planet_texture/_clouds.jpg");
  // const cloudTexture = useMemo(
  //   () => invertTexture(rawCloudTexture),
  //   [rawCloudTexture]
  // );
  const defaultRotationY = 3.14;

  useFrame(() => {
    if (earthRef.current) {
      earthRef.current.rotation.y = earth.rotation + defaultRotationY;
    }
  });

  return (
    <group>
      <mesh rotation={[Math.PI / 2, earth.rotation + defaultRotationY, 0]}>
        <sphereGeometry args={[EARTH_DISPLAY_RADIUS_P * 1.04, 64, 64]} />
        <meshBasicMaterial
          color={0xffffff}
          transparent
          opacity={0.1}
          depthWrite={false}
        />
      </mesh>
      <mesh rotation={[Math.PI / 2, earth.rotation + defaultRotationY, 0]}>
        <sphereGeometry args={[EARTH_DISPLAY_RADIUS_P * 1.02, 64, 64]} />
        <meshPhongMaterial
          color={0xffffff}
          alphaMap={cloudTexture}
          transparent
          opacity={0.8}
          depthWrite={false}
        />
      </mesh>
      <mesh
        ref={earthRef}
        rotation={[Math.PI / 2, earth.rotation + defaultRotationY, 0]}
      >
        <sphereGeometry args={[EARTH_DISPLAY_RADIUS_P, 64, 64]} />
        <meshStandardMaterial map={texture} roughness={0.8} />
      </mesh>
    </group>
  );
}

function Sun({ sun }: { sun: SunFrame }) {
  // DirectionalLight 位置是光源位置，target 默认是场景中心
  const lightRef = useRef<THREE.DirectionalLight>(null);
  const targetRef = useRef(new THREE.Object3D());

  useEffect(() => {
    if (lightRef.current) {
      lightRef.current.target = targetRef.current;
    }
  }, []);

  return (
    <group>
      <directionalLight
        ref={lightRef}
        position={[sun.xyz.x * SCALE, sun.xyz.y * SCALE, sun.xyz.z * SCALE]}
        intensity={2}
        color="#fffbe6"
        castShadow
      />
      <primitive object={targetRef.current} position={[0, 0, 0]} />
    </group>
  );
}

function Satellites({
  satellites,
  earthRef,
}: {
  satellites: SatelliteFrame[];
  earthRef: React.RefObject<THREE.Object3D>;
}) {
  return (
    <>
      {satellites.map((sat) => {
        const color = sat.onSun ? "green" : "red";
        // 新增：使用dimensions设置卫星大小（假设单位m，缩放以匹配场景）
        const pjColor = "white"; // 假设图像颜色为白色
        const imgColor = "yellow"; // 假设图像颜色为黄色
        const [length, width, height] = sat.dimensions.map((d) => d * 100);

        const cor = sat.imgCornersPos;

        if (!Array.isArray(cor) || cor.length !== 4) return null;

        // 生成顶点坐标
        const points = cor.map((c) => [c.x * SCALE, c.y * SCALE, c.z * SCALE]);

        return (
          <group
            key={sat.id}
            // quaternion={quaternion} // 应用旋转，使面朝向匹配
          >
            <mesh
              position={[
                sat.pos.x * SCALE,
                sat.pos.y * SCALE,
                sat.pos.z * SCALE,
              ]}
            >
              <boxGeometry args={[length, width, height]} />
              <meshBasicMaterial color={color} />
              {/* <Html
                distanceFactor={5000}
                position={[0, 0, 0]}
                occlude={[earthRef as React.RefObject<THREE.Object3D>]}
              >
                <div
                  className="select-none flex flex-col w-20 items-center"
                  style={{
                    color: "white",
                    fontWeight: 200,
                    fontSize: 10,
                    padding: "1px 4px",
                  }}
                >
                  <span>SAT-{sat.id.slice(-6)}</span>
                </div>
              </Html> */}
            </mesh>
            {points.length === 4 && (
              <>
                {/* 方锥体四个侧面 */}
                {points.map((p, idx) => {
                  const nextIdx = (idx + 1) % 4;
                  const vertices = [
                    ...p,
                    ...points[nextIdx],
                    sat.pos.x * SCALE,
                    sat.pos.y * SCALE,
                    sat.pos.z * SCALE,
                  ];
                  return (
                    <mesh key={idx}>
                      <bufferGeometry
                        ref={(geo) => {
                          if (geo) {
                            geo.setAttribute(
                              "position",
                              new THREE.Float32BufferAttribute(vertices, 3)
                            );
                            geo.setIndex([0, 1, 2]);
                          }
                        }}
                      />
                      <meshBasicMaterial
                        color={pjColor}
                        transparent
                        opacity={0.2}
                        side={THREE.DoubleSide}
                      />
                    </mesh>
                  );
                })}
                {/* 底面（四边形） */}
                <mesh>
                  <bufferGeometry
                    ref={(geo) => {
                      if (geo) {
                        geo.setAttribute(
                          "position",
                          new THREE.Float32BufferAttribute(points.flat(), 3)
                        );
                        geo.setIndex([0, 1, 2, 0, 2, 3]);
                      }
                    }}
                  />
                  <meshBasicMaterial
                    color={imgColor}
                    transparent
                    opacity={0.5}
                    side={THREE.DoubleSide}
                  />
                </mesh>
              </>
            )}
          </group>
        );
      })}
    </>
  );
}

// 地面站组件
function Stations({
  stations,
  earthRef,
}: {
  stations: StationFrame[];
  earthRef: React.RefObject<THREE.Object3D>;
}) {
  return (
    <>
      {stations.map((gs) => {
        const color = gs.onDownload ? "red" : gs.onUpload ? "blue" : "#ffffff";
        return (
          <mesh
            key={gs.id}
            position={[gs.pos.x * SCALE, gs.pos.y * SCALE, gs.pos.z * SCALE]}
          >
            <sphereGeometry args={[10, 32, 32]} />
            <meshBasicMaterial color={color} />
            {/* <Html
              distanceFactor={5000}
              position={[0, 0, 0]}
              occlude={[earthRef as React.RefObject<THREE.Object3D>]}
            >
              <div
                className="select-none flex flex-col w-20 items-center"
                style={{
                  color: "white",
                  fontWeight: 200,
                  fontSize: 10,
                  padding: "1px 4px",
                }}
              >
                <span>GS-{gs.id.slice(-6)}</span>
              </div>
            </Html> */}
          </mesh>
        );
      })}
    </>
  );
}

function RoIs({ rois }: { rois: ROIFrame[] }) {
  return (
    <>
      {rois.map((roi) => {
        // 生成 RoI 区域的四个角点
        const cor = roi.cornersPos;
        if (!Array.isArray(cor) || cor.length !== 4) return null;

        // 生成顶点坐标
        const points = cor.map((c) => [c.x * SCALE, c.y * SCALE, c.z * SCALE]);
        // 闭合多边形
        const closedPoints = [...points, points[0]];
        // 线条颜色
        const color = 0x00ff00;

        return (
          <group key={roi.id}>
            {/* 绘制 RoI 区域顶点 */}
            {points.map((p, idx) => (
              <mesh key={idx} position={p as [number, number, number]}>
                <sphereGeometry args={[10, 16, 16]} />
                <meshBasicMaterial color={color} />
              </mesh>
            ))}
            {/* 绘制 RoI 区域边界线 */}
            <line>
              <bufferGeometry>
                <bufferAttribute
                  attach="attributes-position"
                  args={[new Float32Array(closedPoints.flat()), 3]}
                />
              </bufferGeometry>
              <lineBasicMaterial color={color} linewidth={2} />
            </line>
            {/* <Html
              distanceFactor={5000}
              position={[
                roi.centrePos.x * SCALE,
                roi.centrePos.y * SCALE,
                roi.centrePos.z * SCALE,
              ]}
            >
              <div
                className="select-none w-20"
                style={{
                  color: "white",
                  fontWeight: 200,
                  fontSize: 10,
                  padding: "1px 4px",
                }}
              >
                RoI-{roi.id.slice(-6)}
              </div>
            </Html> */}
          </group>
        );
      })}
    </>
  );
}

function Links({ links }: { links: LinkFrame[] }) {
  // 先在顶层一次性用 map 生成所有 positions，保证 hooks 只在顶层调用
  const positionsList = React.useMemo(() => {
    return links.map((link) => {
      const [start, end] = link.linkPos;
      const a = new THREE.Vector3(
        start.x * SCALE,
        start.y * SCALE,
        start.z * SCALE
      );
      const b = new THREE.Vector3(end.x * SCALE, end.y * SCALE, end.z * SCALE);
      return new Float32Array([a.x, a.y, a.z, b.x, b.y, b.z]);
    });
  }, [links]);

  return (
    <>
      {links.map((link, idx) => {
        const color = link.type === "ISL" ? "white" : "red";
        const positions = positionsList[idx];

        return (
          <line key={`${link.src}_${link.dst}_link`}>
            <bufferGeometry attach="geometry">
              <bufferAttribute
                attach="attributes-position"
                args={[positions, 3]}
              />
            </bufferGeometry>
            <lineBasicMaterial
              attach="material"
              color={color}
              transparent
              opacity={0.1}
            />
          </line>
        );
      })}
    </>
  );
}

function UniverseScene({
  sun,
  earth,
  satellites,
  stations,
  links,
  rois,
}: {
  sun: SunFrame;
  earth: EarthFrame;
  satellites: SatelliteFrame[];
  stations: StationFrame[];
  links: LinkFrame[];
  rois: ROIFrame[];
}) {
  const earthRef = useRef<THREE.Object3D>(null!);

  return (
    <Canvas
      camera={{ position: [0, 0, 20000], fov: 30, near: 1000, far: 50000 }}
    >
      <group rotation={[-Math.PI / 2, 0, 0]}>
        <Earth earth={earth} earthRef={earthRef} />
        <Sun sun={sun} />
        <Satellites satellites={satellites} earthRef={earthRef} />
        <Stations stations={stations} earthRef={earthRef} />
        <Links links={links} />
        <RoIs rois={rois} />
      </group>
      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        minDistance={7500}
        maxDistance={50000}
      />
    </Canvas>
  );
}

export default function UniverseView() {
  const { frames, currentFrame, setCurrentFrame } = useFrames();
  const [timestamp, setTimestamp] = useState<string>("Waiting to start");
  const [totalSlots, setTotalSlots] = useState<number>(0);

  const [sunStates, setSunStates] = useState<SunFrame>();
  const [earthStates, setEarthStates] = useState<EarthFrame>();
  const [satStates, setSatStates] = useState<SatelliteFrame[]>([]);
  const [linkStates, setLinkStates] = useState<LinkFrame[]>([]);
  const [stationStates, setStationStates] = useState<StationFrame[]>([]);
  const [roiStates, setRoiStates] = useState<ROIFrame[]>([]);
  const [currentSlot, setCurrentSlot] = useState(0);
  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    const frame = frames[currentFrame];
    if (frame) {
      setSunStates(frame.sun);
      setEarthStates(frame.earth);
      setSatStates(frame.satellites);
      setLinkStates(frame.links);
      setStationStates(frame.stations);
      setTimestamp(frame.time);
      setTotalSlots(frame.MaxSlotNumbers * frame.MaxPeriod);
      setRoiStates(frame.rois);
      setCurrentSlot(frame.currentFrame);
      setCurrentTime(frame.time);
    }
  }, [currentFrame, frames]);

  if (frames.length === 0) {
    return <VoidPage />;
  }

  return (
    <div className="flex flex-col h-full w-full py-12 px-6 bg-black text-white">
      <div className="absolute top-10 right-0 z-5">
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
      {sunStates && earthStates && satStates && stationStates && linkStates && (
        <UniverseScene
          sun={sunStates}
          earth={earthStates}
          satellites={satStates}
          stations={stationStates}
          links={linkStates}
          rois={roiStates}
        />
      )}
    </div>
  );
}
function createLongitudeLine(arg0: any, lon: number, arg2: number, arg3: number, arg4: number): THREE.Object3D<THREE.Object3DEventMap> {
  throw new Error("Function not implemented.");
}

