from skyfield.api import wgs84, load, Topos
from pyproj import Transformer
from app.config import DATA_OTHERS, EPHEMERIS
from utils.polygon import calculate_coverage, generate_square, latlon_to_xy

def is_daytime(lat, lon, time):
    earth = EPHEMERIS['earth']
    sun = EPHEMERIS['sun']
    observer = earth + Topos(latitude_degrees=lat, longitude_degrees=lon)
    apparent = observer.at(time).observe(sun).apparent()
    alt, az, _ = apparent.altaz()
    return alt.degrees + 0.5 > 0

def is_satellite_over_gs(sat, gs_lat, gs_lon, time):
    """判断卫星在给定时刻是否对地面站可见（仰角超过阈值）"""
    gs = wgs84.latlon(gs_lat, gs_lon)
    difference = sat - gs
    topocentric = difference.at(time)
    elevation, _, _ = topocentric.altaz()
    is_visible = elevation.degrees > 10
    return elevation, is_visible

def is_satellite_cover_roi(sub_lat, sub_lon, roi_lat, roi_lon, image_length, roi_length, angle_deg):
    """判断卫星在给定时刻是否能覆盖 ROI 区域"""
    sub_xy = latlon_to_xy(sub_lat, sub_lon, roi_lat, roi_lon)
    roi_xy = (0, 0)

    # image_poly = generate_square(sub_xy, image_length, inclination)
    image_poly = generate_square(sub_xy, image_length, angle_deg)
    roi_poly = generate_square(roi_xy, roi_length)
    # print(f"image_poly = {image_poly} \nroi_poly = {roi_poly}")
    coverage = calculate_coverage(image_poly, roi_poly)
    is_covered = coverage > 0.9
    return coverage, is_covered, image_poly, roi_poly

def try_split_dateline(coords):
    # 仅对image_coords如果跨线尝试切分
    lons = [lon for lon, _ in coords]
    if max(lons) - min(lons) > 180:
        # 方案1：把跨线的多边形分割为两块（不再整体归一化！）
        coords1 = [(lon if lon > 0 else 180, lat) for lon, lat in coords]
        coords2 = [(lon if lon < 0 else -180, lat) for lon, lat in coords]
        return [coords1, coords2]
    else:
        return [coords]

