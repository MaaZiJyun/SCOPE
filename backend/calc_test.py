import math

def calculate_orbital_period(R_m):
    """
    计算轨道周期
    R_m: 轨道半径 (m)
    return: T_s (s)
    """
    mu_m3_s2 = 3.986e14  # 地球引力常数 (m³/s²)
    T_s = 2 * math.pi * math.sqrt(R_m**3 / mu_m3_s2)
    return T_s

def calculate_fov(focal_length_m, sensor_width_m):
    """
    根据相机焦距和传感器宽度计算视场角
    focal_length_m: 焦距 (m)
    sensor_width_m: 传感器宽度 (m)
    return: fov_deg (度)
    """
    fov_deg = 2 * math.degrees(math.atan(sensor_width_m / (2 * focal_length_m)))
    return fov_deg

def calculate_swath_length(h_m, fov_deg):
    """
    计算刈幅宽度
    h_m: 卫星轨道高度 (m)
    fov_deg: 视场角 (度)
    return: L_swath_m (m)
    """
    L_swath_m = 2 * h_m * math.tan(math.radians(fov_deg / 2))
    return L_swath_m

def calculate_n_orb(T_e_s, t_max_s):
    return T_e_s / (2 * t_max_s)

def calculate_n_sat_per_orb(R_e_m, T_o_s, L_swath_m, T_e_s):
    return (2 * math.pi * R_e_m * T_o_s) / (L_swath_m * T_e_s)

def calculate_n_sat(R_e_m, T_o_s, L_swath_m, t_max_s):
    return (math.pi * R_e_m * T_o_s) / (L_swath_m * t_max_s)

def calculate_image_data_size(n_pixels, bpp_bit_per_px):
    """
    n_pixels: 图像像素总数 (px)
    bpp_bit_per_px: 每像素比特数 (bits/px)
    return: 图像大小 (bit)
    """
    image_size_bit = n_pixels * bpp_bit_per_px
    return image_size_bit

def calculate_gsd(L_swath_m, n_pixels_per_side):
    """
    L_swath_m: 刈幅宽度 (m)
    n_pixels_per_side: 图像行像素数 (px)
    return: GSD_m_per_px (m/px)
    """
    return L_swath_m / n_pixels_per_side

# ==============================
# 预设参数（SI 单位）
# ==============================

R_e_m = 6371e3        # 地球半径 (m)
T_e_s = 86.4e3          # 地球自转周期 (s)
h_m = 500e3            # 卫星轨道高度 (m)
R_m = R_e_m + h_m      # 卫星轨道半径 (m)

# 相机参数
# f_m = 93.9e-3            # 焦距 (m) = 93.9 mm
f_m = 64e-3
pixel_size_m = 5.5e-6  # 单像素尺寸 (m) = 5.5 μm
L_px = 4096           # 传感器像素数 (px, 假设方形)
L_sen_m = pixel_size_m * L_px  # 传感器宽度 (m)
# L_sen_m = 13.125e-3

# ==============================
# 计算
# ==============================

# 视场角 & 刈幅宽度
fov_deg = calculate_fov(f_m, L_sen_m)
L_swath_m = calculate_swath_length(h_m, fov_deg)

# 轨道周期
T_o_s = calculate_orbital_period(R_m)
t_max_s = 2 * T_o_s  # 最大观测时间 (s)

# 星座参数
n_orb = calculate_n_orb(T_e_s, t_max_s)
n_sat = calculate_n_sat(R_e_m, T_o_s, L_swath_m, t_max_s)
n_sat_per_orb = calculate_n_sat_per_orb(R_e_m, T_o_s, L_swath_m, T_e_s)

# 影像参数
channel = 401
pixel_depth = 12
bpp_bit_per_px = channel * pixel_depth
n_pixels = L_px ** 2
coverage_m2 = L_swath_m ** 2
gsd_m_per_px = calculate_gsd(L_swath_m, L_px)
img_size_bit = calculate_image_data_size(n_pixels, bpp_bit_per_px)
compressed_size_bit = img_size_bit / 2.8  # 假设压缩比10:1

# ==============================
# 输出
# ==============================

print("卫星覆盖计算器 (SI 单位版)")
print("-" * 50)

print(f"参数设置:")
print(f"地球半径 R_e = {R_e_m/1000:.2f} km")
print(f"卫星轨道高度 h = {h_m/1000:.2f} km")
print(f"卫星轨道半径 R = {R_m/1000:.2f} km")
print(f"地球自转周期 T_e = {T_e_s/3600:.2f} h")
print(f"卫星自转周期 T_o = {T_o_s/3600:.2f} h")
print(f"最大观测时间 t_max = {t_max_s/3600:.2f} h")
print("-" * 50)

print("\n相机参数:")
print(f"焦距 f = {f_m*1000:.2f} mm")
print(f"传感器宽度 = {L_sen_m*1000:.2f} mm")
print(f"像素数 = {L_px} px × {L_px} px")

print("\n计算结果:")
print(f"视场角 FOV = {fov_deg:.3f} deg")
print(f"刈幅宽度 L_swath = {L_swath_m/1000:.2f} km")
print(f"GSD = {gsd_m_per_px:.3f} m/px")
print(f"单景覆盖面积 = {coverage_m2/1e6:.2f} km²")
print(f"单景图像大小 = {img_size_bit/8/1e9:.2f} GB (十进制)")
print(f"压缩后单景图像大小 = {compressed_size_bit/8/1e9:.2f} GB (十进制)")

print("\n星座参数:")
print(f"轨道周期 T_o = {T_o_s:.2f} s ({T_o_s/3600:.2f} h)")
print(f"轨道数量 n_orb = {math.ceil(n_orb)}")
print(f"每轨卫星数 n_sat/orb = {math.ceil(n_sat_per_orb)}")
print(f"总卫星数 n_sat = {math.ceil(n_orb)*math.ceil(n_sat_per_orb)}")

# 验证计算
n_sat_verification = n_orb * n_sat_per_orb
print(f"\n验证: n_orb * n_sat/orb = {n_sat_verification:.2f}")
if abs(n_sat - n_sat_verification) < 0.01:
    print("验证成功")
else:
    print(f"警告: 直接计算结果 ({n_sat:.2f}) 与验证结果 ({n_sat_verification:.2f}) 不一致")
