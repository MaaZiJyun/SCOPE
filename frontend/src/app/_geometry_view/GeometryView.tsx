import React, { useRef, useEffect, useState } from "react";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { Html, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { SCALE, EARTH_DISPLAY_RADIUS_P } from "../../lib/DefaultObjects";
import ClockWidget from "@/components/ClockWidget";
import {
  EarthFrame,
  LinkFrame,
  ROIFrame,
  SatelliteFrame,
  StationFrame,
  SunFrame,
} from "@/types/simulation";
import VoidPage from "@/components/VoidPage";
import { useFrames } from "../workspace/useFramesContext";

// 地球自转组件
function Earth({ earth }: { earth: EarthFrame }) {
  const earthRef = useRef<THREE.Mesh>(null);
  const gridGroup = new THREE.Group();

  const defaultRotationY = -0.12; // 初始旋转角度，用来对齐texture和真实数据坐标

  useFrame(() => {
    if (earthRef.current) {
      earthRef.current.rotation.y = earth.rotation + defaultRotationY;
    }
  });

  return (
    <group>
      <mesh ref={earthRef}>
        <primitive object={gridGroup} />
      </mesh>
    </group>
  );
}

function Sun({ sun }: { sun: SunFrame }) {
  // DirectionalLight 位置是光源位置，target 默认是场景中心
  return (
    <directionalLight
      position={[sun.xyz.x * SCALE, sun.xyz.y * SCALE, sun.xyz.z * SCALE]}
      intensity={2}
      color="#fffbe6"
      castShadow
      target-position={[0, 0, 0]}
    />
  );
}

// 卫星组件
function Satellites({ satellites }: { satellites: SatelliteFrame[] }) {
  return (
    <>
      {satellites.map((sat) => {
        const color = sat.attnHead
          ? "white"
          : sat.onGS
          ? "red"
          : sat.onSun
          ? "#ffeb3b"
          : sat.onROI
          ? "#fb8c00"
          : "#aaaaaa";

        const imgColor = "green"; // 假设图像颜色为绿色
        // 新增：使用dimensions设置卫星大小（假设单位m，缩放以匹配场景）
        const [length, width, height] = sat.dimensions.map((d) => d * 100);

        // 新增：计算卫星旋转，使面朝向匹配face_orientations
        // 构建旋转矩阵：+x=zenith (from pos), -z=velocity_vector, +y=cross(zenith, velocity)
        const zenith = new THREE.Vector3(
          sat.pos.x,
          sat.pos.y,
          sat.pos.z
        ).normalize(); // +x (away from Earth)，匹配three.js y-up = ECEF z
        const velocity_vec = new THREE.Vector3(
          sat.velocityVector.x,
          sat.velocityVector.y,
          sat.velocityVector.z
        ).normalize(); // -z (flight direction)，匹配映射
        const solar_vec = new THREE.Vector3(
          sat.solarVector.x,
          sat.solarVector.y,
          sat.solarVector.z
        )
          .normalize()
          .negate(); // -z (flight direction)，匹配映射
        const z_dir = velocity_vec.clone().negate(); // +z = -velocity (adjust if needed)
        const unit_y = new THREE.Vector3()
          .crossVectors(z_dir, zenith)
          .normalize();
        const x_dir = zenith; // +x
        // 验证右手系: cross(x, y) should ≈ z
        const cross_xy = new THREE.Vector3()
          .crossVectors(x_dir, unit_y)
          .normalize();
        // const isRightHanded = cross_xy.distanceTo(z_dir) < 1e-6; // Approximate equality for floating point
        // console.log(isRightHanded); // Should be true if vectors are orthogonal and right-handed

        // 旋转矩阵：columns = [x_dir, y_dir, z_dir]
        const rotationMatrix = new THREE.Matrix4().makeBasis(
          x_dir,
          unit_y,
          z_dir
        );

        // 转换为Euler或Quaternion应用于mesh
        const quaternion = new THREE.Quaternion().setFromRotationMatrix(
          rotationMatrix
        );

        const cor = sat.imgCornersPos;

        if (!Array.isArray(cor) || cor.length !== 4) return null;

        // 生成顶点坐标
        const points = cor.map((c) => [c.x * SCALE, c.y * SCALE, c.z * SCALE]);
        // 闭合多边形
        const closedPoints = [...points, points[0]];

        const satPos: [number, number, number] = [
          sat.pos.x * SCALE,
          sat.pos.y * SCALE,
          sat.pos.z * SCALE,
        ];

        return (
          <group
            key={sat.id}
            // quaternion={quaternion} // 应用旋转，使面朝向匹配
          >
            <mesh
              position={satPos}
              quaternion={quaternion} // 应用旋转，使面朝向匹配
            >
              <boxGeometry args={[length, width, height]} />
              <meshBasicMaterial color={color} />
              <Html distanceFactor={5000} position={[0, 0, 0]}>
                <div
                  className="select-none w-20"
                  style={{
                    color: "white",
                    fontWeight: 200,
                    fontSize: 10,
                    padding: "1px 4px",
                  }}
                >
                  P{sat.plane} - O{sat.order}
                </div>
              </Html>
            </mesh>

            {/* 新增：用三个ArrowHelper表示satellite-centered coordinate system的x,y,z轴 */}
            {/* +X axis (red arrow, away from Earth) */}
            <arrowHelper
              position={satPos}
              args={[x_dir, new THREE.Vector3(0, 0, 0), length * 20, "red"]}
            />
            {/* +Y axis (green arrow) */}
            <arrowHelper
              position={satPos}
              args={[unit_y, new THREE.Vector3(0, 0, 0), width * 20, "green"]}
            />
            {/* +Z axis (blue arrow) */}
            <arrowHelper
              position={satPos}
              args={[z_dir, new THREE.Vector3(0, 0, 0), height * 20, "blue"]}
            />
            {/* 新增：太阳向量 (yellow arrow) */}
            {sat.onSun && (
              <arrowHelper
                position={satPos}
                args={[
                  solar_vec,
                  new THREE.Vector3(0, 0, 0),
                  Math.max(length, width, height) * 20,
                  "yellow",
                ]}
              />
            )}
            {points.length === 4 && (
              <mesh>
                <bufferGeometry
                  attach="geometry"
                  args={undefined}
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
                  opacity={0.3} // 半透明
                  side={THREE.DoubleSide}
                />
              </mesh>
            )}
          </group>
        );
      })}
    </>
  );
}

// 地面站组件
function Stations({ stations }: { stations: StationFrame[] }) {
  return (
    <>
      {stations.map((gs) => {
        const color = gs.onDownload ? "red" : gs.onUpload ? "blue" : "#ffeccf";
        return (
          <mesh
            key={gs.id}
            position={[
              gs.pos.x * SCALE,
              gs.pos.y * SCALE,
              gs.pos.z * SCALE,
            ]}
          >
            <sphereGeometry args={[10, 32, 32]} />
            <meshBasicMaterial color={color} />
            <Html distanceFactor={5000} position={[0, 0, 0]}>
              <div
                className="select-none w-20"
                style={{
                  color: "white",
                  fontWeight: 200,
                  fontSize: 10,
                  padding: "1px 4px",
                }}
              >
                GS-{gs.id.slice(-6)}
              </div>
            </Html>
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
        const cen = roi.centrePos;

        // 线条颜色
        const color = 0x00ff00;

        return (
          <group key={roi.id}>
            {/* 绘制 RoI 区域顶点 */}
            {points.length === 4 && (
              <mesh>
                <bufferGeometry
                  attach="geometry"
                  args={undefined}
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
                  color={color}
                  transparent
                  opacity={1} // 半透明
                  side={THREE.DoubleSide}
                />
                <mesh position={[cen.x * SCALE, cen.y * SCALE, cen.z * SCALE]}>
                  <sphereGeometry args={[10, 16, 16]} />
                  <meshBasicMaterial color={color} />
                </mesh>
              </mesh>
            )}
            <Html
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
            </Html>
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
              opacity={0.8}
            />
          </line>
        );
      })}
    </>
  );
}

function GeometryView({
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
  return (
    <Canvas
      camera={{ position: [0, 0, 20000], fov: 30, near: 0.1, far: 50000 }}
    >
      <group rotation={[-Math.PI / 2, 0, 0]}>
        {/* <primitive
          object={(() => {
            const arrow = new THREE.ArrowHelper(
              new THREE.Vector3(-1, 0, 0),
              new THREE.Vector3(0, 0, 0),
              10000,
              0xff0000,
              400,
              200
            );
            return arrow;
          })()}
        />
        <primitive
          object={(() => {
            const arrow = new THREE.ArrowHelper(
              new THREE.Vector3(0, 1, 0),
              new THREE.Vector3(0, 0, 0),
              10000,
              0x00ff00,
              400,
              200
            );
            return arrow;
          })()}
        />
        <primitive
          object={(() => {
            const arrow = new THREE.ArrowHelper(
              new THREE.Vector3(0, 0, 1),
              new THREE.Vector3(0, 0, 0),
              10000,
              0x0000ff,
              400,
              200
            );
            return arrow;
          })()}
        /> */}
        {/* <Html position={[-10000, 0, 0]}>
          <span style={{ color: "red" }}>X</span>
        </Html>
        <Html position={[0, 10000, 0]}>
          <span style={{ color: "green" }}>Y</span>
        </Html>
        <Html position={[0, 0, 10000]}>
          <span style={{ color: "blue" }}>Z</span>
        </Html> */}
        <Sun sun={sun} />
        <Satellites satellites={satellites} />
        <Stations stations={stations} />
        <Links links={links} />
        <RoIs rois={rois} />
      </group>
      <Earth earth={earth} />
      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        minDistance={6371}
        maxDistance={50000}
      />
    </Canvas>
  );
}

export default function UniverseView() {
  const { frames, currentFrame, setCurrentFrame } = useFrames();

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
      setRoiStates(frame.rois);
      setCurrentSlot(frame.currentFrame);
      setCurrentTime(frame.time);
    }
  }, [currentFrame, frames]);

  if (frames.length === 0) {
    return <VoidPage />;
  }

  return (
    <>
      <div className="flex flex-col h-full w-full py-12 px-6 bg-black text-white">
        <div className="absolute top-10 right-0 z-2">
          <ClockWidget timeSlot={currentSlot} time={currentTime} />
        </div>
        {sunStates &&
          earthStates &&
          satStates &&
          stationStates &&
          linkStates && (
            <GeometryView
              sun={sunStates}
              earth={earthStates}
              satellites={satStates}
              stations={stationStates}
              links={linkStates}
              rois={roiStates}
            />
          )}
      </div>
    </>
  );
}

function createLatitudeLine(
  radius: number,
  latDeg: number,
  segments: number = 256,
  color: number = 0xffffff,
  opacity: number = 1
): THREE.LineLoop {
  const positions: number[] = [];
  const latRad = THREE.MathUtils.degToRad(latDeg);
  const y = radius * Math.sin(latRad);
  const r = radius * Math.cos(latRad);

  for (let i = 0; i <= segments; i++) {
    const theta = (i / segments) * Math.PI * 2;
    const x = r * Math.cos(theta);
    const z = r * Math.sin(theta);
    positions.push(x, y, z);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3)
  );

  const material = new THREE.LineBasicMaterial({
    color,
    linewidth: 2,
    transparent: opacity < 1,
    opacity,
  });

  return new THREE.LineLoop(geometry, material);
}

function createLongitudeLine(
  radius: number,
  lonDeg: number,
  segments: number = 256,
  color: number = 0xffffff,
  opacity: number = 1
): THREE.Line {
  const positions: number[] = [];
  const lonRad = THREE.MathUtils.degToRad(lonDeg);

  for (let i = 0; i <= segments; i++) {
    const latRad = THREE.MathUtils.degToRad(-90 + (i / segments) * 180);
    const x = radius * Math.cos(latRad) * Math.cos(lonRad);
    const y = radius * Math.sin(latRad);
    const z = radius * Math.cos(latRad) * Math.sin(lonRad);
    positions.push(x, y, z);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3)
  );

  const material = new THREE.LineBasicMaterial({
    color,
    linewidth: 1,
    transparent: opacity < 1,
    opacity,
  });

  return new THREE.Line(geometry, material);
}
