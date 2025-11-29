import { Canvas } from "@react-three/fiber";
import { Box, Html, Line } from "@react-three/drei";
import * as THREE from "three";

export default function CameraVisualizer({
  focalLength = 64, // 单位：mm，假定焦距
  widthPx = 4096,
  lengthPx = 4096,
  pxSizeLength = 5.5, // μm
  pxSizeWidth = 5.5, // μm
  h = 500000, // 卫星高度，单位：m
}: {
  focalLength?: number;
  widthPx?: number;
  lengthPx?: number;
  pxSizeLength?: number;
  pxSizeWidth?: number;
  h?: number;
}) {
  // 计算传感器尺寸（mm）
  const sensorW = widthPx * pxSizeWidth * 0.001;
  const sensorL = lengthPx * pxSizeLength * 0.001;

  // 计算 FOV（弧度）
  const fovW = 2 * Math.atan(sensorW / (2 * focalLength));
  const fovL = 2 * Math.atan(sensorL / (2 * focalLength));

  // 地面投影宽度和长度（m）
  const swathW = 2 * h * Math.tan(fovW / 2);
  const swathL = 2 * h * Math.tan(fovL / 2);
  const gsd = (swathW / widthPx + swathL / lengthPx) / 2; // m/pixel

  // 三维可视化参数缩放
  const R = 0.0003;
  const r = 0.5;

  const satPos: [number, number, number] = [0, 0, 0];
  const planePos: [number, number, number] = [0, focalLength * r, 0];
  const groundPos: [number, number, number] = [0, -h * R, 0];

  // 成像面四角（朝上，Y轴为法线）
  const planeCorners: [number, number, number][] = [
    [
      planePos[0] + (sensorW * r) / 2,
      planePos[1],
      planePos[2] + (sensorL * r) / 2,
    ],
    [
      planePos[0] - (sensorW * r) / 2,
      planePos[1],
      planePos[2] + (sensorL * r) / 2,
    ],
    [
      planePos[0] - (sensorW * r) / 2,
      planePos[1],
      planePos[2] - (sensorL * r) / 2,
    ],
    [
      planePos[0] + (sensorW * r) / 2,
      planePos[1],
      planePos[2] - (sensorL * r) / 2,
    ],
  ];
  // 地面影像四角（朝上，Y轴为法线）
  const groundCorners: [number, number, number][] = [
    [
      groundPos[0] + (swathW * R) / 2,
      groundPos[1],
      groundPos[2] + (swathL * R) / 2,
    ],
    [
      groundPos[0] - (swathW * R) / 2,
      groundPos[1],
      groundPos[2] + (swathL * R) / 2,
    ],
    [
      groundPos[0] - (swathW * R) / 2,
      groundPos[1],
      groundPos[2] - (swathL * R) / 2,
    ],
    [
      groundPos[0] + (swathW * R) / 2,
      groundPos[1],
      groundPos[2] - (swathL * R) / 2,
    ],
  ];

  return (
    <Canvas camera={{ position: [500, -200, 200], fov: 20 }}>
      <group position={[0, (h * R) / 2, 0]}>
        <mesh position={satPos}>
          <sphereGeometry args={[0.5, 16, 16]} />
          <meshStandardMaterial
            color="white"
            emissive="#ffffff"
            emissiveIntensity={2}
          />
        </mesh>
        {/* 成像面（蓝色） */}
        <Box args={[sensorW * r, 0.2, sensorL * r]} position={planePos}>
          <meshStandardMaterial color="#3399ff" opacity={0.5} transparent />
        </Box>
        {/* 地面影像（红色） */}
        <Box args={[swathW * R, 0.2, swathL * R]} position={groundPos}>
          <meshStandardMaterial color="#ff3333" opacity={0.5} transparent />
        </Box>
        {/* 卫星到成像面四角的线 */}
        {planeCorners.map((corner, i) => (
          <Line
            key={`sat-plane-${i}`}
            points={[satPos, corner]}
            color="#fff"
            lineWidth={0.5}
          />
        ))}
        {/* 卫星到地面影像四角的线 */}
        {groundCorners.map((corner, i) => (
          <Line
            key={`sat-ground-${i}`}
            points={[satPos, corner]}
            color="#fff"
            lineWidth={0.5}
          />
        ))}
        {/* 成像面四边框 */}
        <Line
          points={[...planeCorners, planeCorners[0]]}
          color="#3399ff"
          lineWidth={0.5}
        />
        {/* 地面影像四边框 */}
        <Line
          points={[...groundCorners, groundCorners[0]]}
          color="#ff3333"
          lineWidth={0.5}
        />

        <Html position={satPos}>
          <div className="w-40" style={{ color: "#ffffff" }}>
            <p className="text-xs">
              FoV-Width: {((fovW * 180) / Math.PI).toFixed(2)}°
            </p>
            <p className="text-xs">
              FoV-Length: {((fovL * 180) / Math.PI).toFixed(2)}°
            </p>
            <p className="text-xs">GSD: {gsd.toFixed(2)} m/pixel</p>
          </div>
        </Html>
        <Html position={planePos}>
          <div className="w-40" style={{ color: "#3399ff" }}>
            <p className="text-sm">Imaging Plane</p>
            <p className="text-xs">w: {sensorW.toFixed(1)} mm</p>
            <p className="text-xs">l: {sensorL.toFixed(1)} mm</p>
          </div>
        </Html>
        <Html position={groundPos}>
          <div className="w-40" style={{ color: "#ff3333" }}>
            <p className="text-sm">Ground Coverage</p>
            <p className="text-xs">W: {swathW.toFixed(1)} m</p>
            <p className="text-xs">L: {swathL.toFixed(1)} m</p>
          </div>
        </Html>
        <ambientLight intensity={0.8} />
      </group>
    </Canvas>
  );
}
