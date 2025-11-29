IMG_SIZE = 15_000_000_000 * 8         # 120,000,000,000 bits (120 Gbits)
R_C = 50_000_000 * 8                  # 400,000,000 bps (400 Mbps processing)
R_T = 12_500_000_000 * 8             # 100,000,000,000 bps (100 Gbps ISL)
R_UL = 6_250_000 * 8                  # 50,000,000 bps (50 Mbps uplink)
R_DL = 18_750_000 * 8                # 150,000,000 bps (150 Mbps downlink)
STORAGE_MAX = 1_000_000_000_000 * 8  # 8,000,000,000,000 bits (8 Tb storage)
BUFFER_MAX = 500_000_000 * 8         # 4,000,000,000 bits (4 Gb buffer)
BATTERY_CAPACITY = 3_600_000      # 1 kWh battery (~1000 Wh → 3.6 MJ)
BATTERY_THRESHOLD = 0.3  # 最低可工作电量阈值

# === Link Budget & Channel Constants ===
# DL_POWER_W = 10.0        # Downlink transmit power (W)
# DL_G_T_DB = 32.13        # Downlink transmit antenna gain (dB)
# DL_G_R_DB = 34.20        # Downlink receive antenna gain (dB)
# DL_FREQ_HZ = 20e9        # Downlink carrier frequency (Hz)
# DL_BW_HZ = 500e6         # Downlink bandwidth (Hz)

# UL_POWER_W = 5.0         # Uplink transmit power (W)
# UL_G_T_DB = DL_G_R_DB    # Uplink transmit antenna gain (dB) (GS)
# UL_G_R_DB = DL_G_T_DB    # Uplink receive antenna gain (dB) (SAT)
# UL_FREQ_HZ = DL_FREQ_HZ  # Uplink frequency (Hz)
# UL_BW_HZ = DL_BW_HZ      # Uplink bandwidth (Hz)

DL_POWER_W = 0.3         # QPSK主下行发射功率（W）
DL_G_T_DB = 10           # 发射天线增益（dB）
DL_G_R_DB = 12           # 接收天线增益（dB）
DL_FREQ_HZ = 435_900_000 # 频率（Hz）
DL_BW_HZ = 24_890        # 带宽（Hz）

UL_POWER_W = 1.0         # 上行发射功率（W）
UL_G_T_DB = 12           # 上行发射天线增益（dB）
UL_G_R_DB = 10           # 上行接收天线增益（dB）
UL_FREQ_HZ = 435_900_000 # 上行频率（Hz）
UL_BW_HZ = 24_890        # 上行带宽（Hz）

ISL_POWER_W = 60.0       # ISL transmit power (W)
ISL_G_T_DB = 32.13       # ISL transmit antenna gain (dB)
ISL_G_R_DB = 34.20       # ISL receive antenna gain (dB)
ISL_FREQ_HZ = 14e9       # ISL carrier frequency (Hz)
ISL_BW_HZ = 500e6        # ISL bandwidth (Hz)


E_C_P: float = 0.0005  # 处理静态功率，单位：W（0.5 mW）
E_C_S: float = 0.0002  # 信号静态功率，单位：W（0.2 mW）
E_p: float = 0.0005    # 计算静态功率，单位：W（0.5 mW）
E_C_T: float = 0.0012  # 发送静态功率，单位：W（1.2 mW）
E_C_R: float = 0.0008  # 接收静态功率，单位：W（0.8 mW）
E_D: float = 0.001     # 下载静态功率，单位：W（1 mW）
E_SOL: float = 1000  # 光伏板功率，单位：W（1 kW）