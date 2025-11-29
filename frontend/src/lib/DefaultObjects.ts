import * as THREE from "three";
import { LayerMode } from "./modes";

export const EARTH_RADIUS_METERS = 6356752;
export const EARTH_DISPLAY_RADIUS_P = 6356.752;
export const EARTH_DISPLAY_RADIUS_E = 6378.137;
export const OFFSET = 0.5;  // 线稍微抬高
export const SCALE = EARTH_DISPLAY_RADIUS_P / EARTH_RADIUS_METERS;

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


/**
 * 创建地球及经纬线
 */
export async function createEarth(
    activeLayer: LayerMode,
): Promise<THREE.Group> {
    let material: THREE.MeshStandardMaterial; // 这样声明即可，后续保证必定赋值

    let showGrid = false;           // 是否显示经纬线

    if (activeLayer === LayerMode.Material) {
        // 贴图，完全不透明，无经纬线
        const loader = new THREE.TextureLoader();
        const texture: THREE.Texture = await new Promise((resolve, reject) => {
            loader.load(
                "/planet_texture/earth_texture.jpg",
                resolve,
                undefined,
                reject
            );
        });
        material = new THREE.MeshStandardMaterial({
            map: texture,
            roughness: 0.9,
            metalness: 0.1,
            transparent: false,
            opacity: 1.0,
        });
    } else if (activeLayer === LayerMode.Wireframe) {
        // 仅显示线框，球体透明度10%，不加载贴图
        material = new THREE.MeshStandardMaterial({
            map: null,
            color: 0x000000,
            roughness: 0.9,
            metalness: 0.1,
            transparent: true,
            opacity: 0, // 10% 不透明
        });
        showGrid = true;
    } else {
        // SolidMesh: 只显示球体
        material = new THREE.MeshStandardMaterial({
            map: null,
            color: 0x000000,
            roughness: 0.9,
            metalness: 0.1,
            transparent: true,
            opacity: 0.3, // 30% 不透明
        });
    }

    const geometry = new THREE.SphereGeometry(6371 - OFFSET, 64, 64);
    // const geometry = new THREE.SphereGeometry(1, 64, 64);
    const earth = new THREE.Mesh(geometry, material);
    // earth.scale.set(EARTH_DISPLAY_RADIUS_E, EARTH_DISPLAY_RADIUS_P, EARTH_DISPLAY_RADIUS_E);
    earth.name = "Earth";

    const group = new THREE.Group();
    group.name = "EarthWithLines";
    group.add(earth);

    // 经纬线组
    const gridGroup = new THREE.Group();
    gridGroup.name = "LatLonIndicator";
    gridGroup.visible = showGrid;

    if (showGrid) {
        // 纬线
        for (let lat = -90; lat <= 90; lat += 10) {
            const isEquator = lat === 0;
            gridGroup.add(createLatitudeLine(
                EARTH_DISPLAY_RADIUS_P + OFFSET,
                lat,
                256,
                isEquator ? 0xff0000 : 0x2b2b2b,
                1
            ));
        }
        // 经线
        for (let lon = -180; lon <= 180; lon += 10) {
            gridGroup.add(createLongitudeLine(
                EARTH_DISPLAY_RADIUS_P + OFFSET,
                lon,
                256,
                0x2b2b2b,
                1
            ));
        }
    }

    group.add(gridGroup);
    group.position.set(0, 0, 0);
    return group;
}