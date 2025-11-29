import os
from datetime import timedelta
import datetime
from typing import Any, List, Tuple
import numpy as np
from app.models.api_dict.pj import ProjectDict
from app.models.camera_model import CameraModel
from app.models.satellite_model import SatelliteModel
from app.models.station_model import StationModel
from app.models.roi_model import ROIModel
from pyproj import Geod
from app.entities.earth_entity import EarthEntity
from app.entities.roi_entity import ROIEntity
from app.entities.sun_entity import SunEntity
from skyfield.api import wgs84, load, Time
from config import EPHEMERIS
from entities.satellite_entity import SatelliteEntity
from entities.station_entity import StationEntity
import pickle
from typing import List

TS = load.timescale()
GEOD = Geod(ellps="WGS84")

BASE_AZI = np.array([45, 135, 225, 315])
SUN = EPHEMERIS['sun']
EARTH = EPHEMERIS['earth']
MOON = EPHEMERIS['moon']

def to_times(datetimes: List[datetime.datetime]):
    return TS.utc(datetimes)

def preparation_of_satellite(
    input: ProjectDict, 
    steps: int, 
    times: Time, 
    datetimes: List[datetime.datetime]
    ) -> Tuple[List[SatelliteEntity], List[dict[str, np.ndarray]]]:
    sats: List[SatelliteModel] = get_sat_from_project(input=input)
    project_id = input.id
    constellation_id = input.constellation.id
    cache_path = f"cache/{project_id}/sat_datas/{constellation_id}.pkl"
    if os.path.exists(cache_path):
        sat_datas = load_pickle(cache_path)
        sat_module_list = [SatelliteEntity(time_series=sat_data) for sat_data in sat_datas]
        return sat_module_list, sat_datas
    
    ast_sun = EARTH.at(times).observe(SUN)
    # sun_xyz = SUN.at(times).position.m.T
    sun_xyz = ast_sun.apparent().position.m.T
    
    sat_datas = []
    sat_module_list = []
    for s in sats:
        geos = s.motion.at(times)
        sat_xyz = geos.position.m.T
        
        sun_vec = sun_xyz - sat_xyz
        norm = np.linalg.norm(sun_vec, axis=1, keepdims=True)
        unit_solar_vector = sun_vec / norm
        
        is_sunlit = geos.is_sunlit(EPHEMERIS)
        
        sp = geos.subpoint()
        lats = sp.latitude.degrees
        lons = sp.longitude.degrees
        
        topos = wgs84.latlon(lats, lons)
        sub_geos = topos.at(times)
        sub_xyz = sub_geos.position.m.T

        az12 = np.zeros(steps)
        azimuths = np.array([
            GEOD.inv(lons[i], lats[i], lons[i + 1], lats[i + 1])[0]
            for i in range(steps - 1)
        ])
        az12[:-1] = azimuths % 360
        az12[-1] = az12[-2]
        
        # rotated_azimuths = (az12[:, None] + BASE_AZI[None, :]) % 360

        cor_latlon = np.zeros((steps, 4, 2))
        
        swath_w, swath_l = s.camera.calc_swath_width(s.altitude), s.camera.calc_swath_length(s.altitude)
        half_w = swath_w / 2
        half_l = swath_l / 2

        for i in range(steps):
            lon0, lat0 = lons[i], lats[i]
            az_center = az12[i]
            # offsets: (dy, dx) 顺序为 NE, NW, SW, SE
            offsets = [
                (half_l, half_w),    # NE
                (half_l, -half_w),   # NW
                (-half_l, -half_w),  # SW
                (-half_l, half_w),   # SE
            ]
            azs = []
            dists = []
            for dy, dx in offsets:
                az = (np.degrees(np.arctan2(dx, dy)) + az_center) % 360
                dist = np.sqrt(dx**2 + dy**2)
                azs.append(az)
                dists.append(dist)
            lons_out, lats_out, _ = GEOD.fwd(
                np.full(4, lon0), np.full(4, lat0), azs, dists
            )
            lons_out = ((lons_out + 180) % 360) - 180
            cor_latlon[i, :, 0], cor_latlon[i, :, 1] = lats_out, lons_out

        corners_xyz = np.zeros((steps, 4, 3))
        for i in range(steps):
            for j in range(4):
                lat, lon = cor_latlon[i][j]
                corners_xyz[i, j, :] = wgs84.latlon(lat, lon).at(times[i]).position.m

        # Compute velocity vector
        velocity = np.zeros((steps, 3))
        velocity[:-1] = sat_xyz[1:] - sat_xyz[:-1]
        velocity[-1] = velocity[-2]
        norm_vel = np.linalg.norm(velocity, axis=1, keepdims=True)
        unit_velocity_vector = velocity / norm_vel

        sat_data = {
            "id": s.id,
            "order": s.order,
            "plane": s.plane,
            "altitude": s.altitude,
            "time": np.array(datetimes, dtype="datetime64[ns]"),
            "is_sunlit": is_sunlit,
            "space_xyz": sat_xyz,
            "subpoint_xyz": sub_xyz,
            "subpoint_latlon": np.stack([lats, lons], axis=-1),
            "azimuth": az12,
            "swath_length": swath_l,
            "swath_width": swath_w,
            "footprint_corners_latlon": cor_latlon,
            "footprint_corners_xyz": corners_xyz,
            "solar_vector": unit_solar_vector,
            "velocity_vector": unit_velocity_vector,
        }
        
        sat_datas.append(sat_data)
        sat_module = SatelliteEntity(time_series=sat_data)
        sat_module_list.append(sat_module)
        
    save_pickle(sat_datas, cache_path)
    return sat_module_list, sat_datas

def preparation_of_station(
    input: ProjectDict, 
    times: Time, 
    datetimes: List[datetime.datetime]
    ):
    gs: List[StationModel] = get_gs_from_project(input=input)
    project_id = input.id
    cache_path = f"cache/{project_id}/gs_datas.pkl"
    if os.path.exists(cache_path):
        gs_datas = load_pickle(cache_path)
        gs_module_list = [StationEntity(time_series=gs_data) for gs_data in gs_datas]
        return gs_module_list, gs_datas

    gs_datas = []
    gs_module_list: List[StationEntity] = []
    for g in gs:
        topos = wgs84.latlon(g.loc.lat, g.loc.lon)
        geos = topos.at(times)
        gs_xyz = geos.position.m.T
        gs_data = {
            "id": g.id,
            "time": np.array(datetimes, dtype="datetime64[ns]"),
            "latlon": np.array([g.loc.lat, g.loc.lon]),
            "xyz": gs_xyz,
        }
        gs_datas.append(gs_data)
        gs_module = StationEntity(time_series=gs_data)
        gs_module_list.append(gs_module)
    save_pickle(gs_datas, cache_path)
    return gs_module_list, gs_datas

def preparation_of_roi(
    input: ProjectDict, 
    steps: int, 
    times: Time, 
    datetimes: List[datetime.datetime]
    ):
    roi_models: List[ROIModel] = get_roi_from_project(input=input) 
    project_id = input.id
    cache_path = f"cache/{project_id}/roi_datas.pkl"
    if os.path.exists(cache_path):
        roi_datas = load_pickle(cache_path)
        roi_module_list = [ROIEntity(time_series=roi_data) for roi_data in roi_datas]
        return roi_module_list, roi_datas

    roi_datas = []
    roi_module_list: List[ROIEntity] = []
    for roi in roi_models:
        topos = wgs84.latlon(roi.loc.lat, roi.loc.lon)
        geos = topos.at(times)
        roi_center_xyz = geos.position.m.T
        az = np.array(BASE_AZI)
        # half_diag_roi = roi.side_length / np.sqrt(2)
        half_w = roi.width / 2
        half_l = roi.length / 2
        distances = np.array([half_w, half_l, half_w, half_l])
        lon_out, lat_out, _ = GEOD.fwd(np.full(4, roi.loc.lon), np.full(4, roi.loc.lat), az, distances)
        lon_out = ((lon_out + 180) % 360) - 180
        cor_latlon = np.zeros((4, 2))
        cor_latlon[:, 0], cor_latlon[:, 1] = lat_out, lon_out
        corners_xyz = np.zeros((steps, 4, 3))
        for i in range(steps):
            for j in range(4):
                lat, lon = cor_latlon[j]
                corners_xyz[i, j, :] = wgs84.latlon(lat, lon).at(times[i]).position.m
        roi_data = {
            "id": roi.id,
            "time": np.array(datetimes, dtype="datetime64[ns]"),
            "roi_length": roi.length,
            "roi_width": roi.width,
            "center_latlon": np.array([roi.loc.lat, roi.loc.lon]),
            "center_xyz": roi_center_xyz,
            "target_corners_latlon": cor_latlon,
            "target_corners_xyz": corners_xyz,
        }
        roi_datas.append(roi_data)
        roi_module = ROIEntity(time_series=roi_data)
        roi_module_list.append(roi_module)
    save_pickle(roi_datas, cache_path)
    return roi_module_list, roi_datas

def preparation_of_sun(
    times: Time,
    datetimes: List[datetime.datetime]):
    cache_path = f"cache/sun_datas.pkl"
    if os.path.exists(cache_path):
        sun_datas = load_pickle(cache_path)
        sun_module = SunEntity(time_series=sun_datas)
        return sun_module, sun_datas
    ast_sun = EARTH.at(times).observe(SUN)
    sun_ecef = ast_sun.apparent().position.m.T
    sun_datas = {
            "id": "sun",
            "time": np.array(datetimes, dtype="datetime64[ns]"),
            "xyz": sun_ecef,
        }
    sun_module = SunEntity(time_series=sun_datas)
    save_pickle(sun_datas, cache_path)
    return sun_module, sun_datas
    
def preparation_of_moon(
    times: Time,
    datetimes: List[datetime.datetime]):
    cache_path = "cache/moon_datas.pkl"
    if os.path.exists(cache_path):
        moon_datas = load_pickle(cache_path)
        return moon_datas
    ast_moon = EARTH.at(times).observe(MOON)
    moon_ecef = ast_moon.apparent().position.m
    moon_datas = {
            "id": "moon",
            "time": np.array(datetimes, dtype="datetime64[ns]"),
            "xyz": moon_ecef,
        }
    save_pickle(moon_datas, cache_path)
    return moon_datas
    
def preparation_of_earth(
    dt: timedelta,
    times: Time,
    datetimes: List[datetime.datetime]):
    cache_path = "cache/earth_datas.pkl"
    if os.path.exists(cache_path):
        earth_datas = load_pickle(cache_path)
        eth_module = EarthEntity(time_series=earth_datas)
        return eth_module, earth_datas
    if len(datetimes) < 2:
        raise ValueError("At least two datetimes are required to calculate Earth rotation.")
    ts_duration = dt.total_seconds()
    ast_earth = EARTH.at(times)
    ecef_earth = ast_earth.position.m.T
    rotate = [(2 * np.pi / 86400) * ts_duration * i for i in range(len(datetimes))]
    earth_datas = {
            "id": "earth",
            "time": np.array(datetimes, dtype="datetime64[ns]"),
            "xyz": ecef_earth,
            "rotation": np.array(rotate, dtype=float)
        }
    eth_module = EarthEntity(time_series=earth_datas)
    save_pickle(earth_datas, cache_path)
    return eth_module, earth_datas


def get_sat_from_project(input: ProjectDict) -> SatelliteModel:
    co = input.constellation
    hd = input.hardware
    
    cam = CameraModel.from_dict(hd)
    
    sats = [
        SatelliteModel(
            altitude=co.altitude,
            id=s.id,
            order=s.order,
            plane=s.plane,
            tle1text=s.tle1,
            tle2text=s.tle2,
        )
        for s in input.satellites or []
    ]
    
    for s in sats:
        s.camera = cam
    
    return sats

def get_gs_from_project(input: ProjectDict) -> List[StationModel]:
    gss = [
        StationModel(
            lat=g.location.lat,
            lon=g.location.lon,
            id=g.id
        )
        for g in input.ground_stations or []
    ]
    return gss

def get_roi_from_project(input: ProjectDict) -> List[ROIModel]:
    rois = [
        ROIModel(
            lat=r.location.lat,
            lon=r.location.lon,
            id=r.id,
            length=r.length,
            width=r.width
        )
        for r in input.rois or []
    ]
    return rois
    
def save_pickle(obj: Any, path: str) -> None:
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "wb") as f:
        pickle.dump(obj, f)

def load_pickle(path: str) -> Any:
    with open(path, "rb") as f:
        return pickle.load(f)