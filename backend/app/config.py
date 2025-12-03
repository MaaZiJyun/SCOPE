# utils/config.py
import os
from skyfield.api import load
import math

DEBUG = True

# 地球相关常量
R_EARTH = 6371000  # 地球半径，单位：米

# 物理常数
C_LIGHT = 299792458  # 光速，单位：米/秒
K_BOLTZMANN = 1.380649e-23  # 玻尔兹曼常数，单位：焦耳/开尔文 (J/K)

# 其他常用常量（可按需添加）
T_EARTH = 24 * 60 * 60  # 地球自转周期，单位：秒
OMEGA_EARTH = 7.2921159e-5  # 地球自转角速度，单位：弧度/秒
MU = 3.986004418e14  # 地球引力常数，单位：m^3/s^2

# TIME PARAMETERS:
T_SLOT = 31  # 每个时间槽的持续时间（秒）
STEP_PER_SLOT = 62  # 每个时间槽的步数
T_STEP = T_SLOT / STEP_PER_SLOT  # 每步的持续时间（秒）
STEP_PER_SECOND = 1 / T_STEP  # 每秒的步数

# SYSTEM PARAMETERS:

# ENERGY:
# BATTERY_MAX = 60 * 3600  # J (60Wh)
BATTERY_MAX = 30 * 3600  # J (60Wh)
B_MAX = 100

# ENERGY CONSUMPTION (all in J/s):
COMPUTE_ENERGY_COST = -60      # GPU inferencing power
TRANSMIT_ISL_ENERGY_COST = -30      # ISL power (30 W)
TRANSMIT_SGL_ENERGY_COST = -250      # SGL power (200 W)
STATIC_ENERGY_COST = -8        # 静态功耗

# ENERGY HARVESTING:
# ENERGY_HARVEST_AMOUNT = 120     # solar charging power (120 W)

# TASK PARAMETERS:
MAX_NUM_TASKS = 20
MAX_TRANS_RATE = 1_000_000_000
MAX_COMP_RATE = 1 # 1 unit per second

# DATA SIZE: (bits)
IMAGE_DATA_SIZE = 2_400_000_000
LAYER_OUTPUT_DATA_SIZE = [
    2400000000,   # layer 0: 原始/初级特征 ~ 2.40e9 bits  (输入影像)
     600000000,   # layer 1: downsampled / feature map
     150000000,   # layer 2
      37500000,   # layer 3
       9375000,   # layer 4: 最终输出（mask/小向量）
]
MAX_NUM_LAYERS = len(LAYER_OUTPUT_DATA_SIZE)

# REWARD WEIGHTS:
WEIGHT_DELAY = 0.7
WEIGHT_ENERGY = 0.3

# PENALTY:
NO_ACTION_PENALTY = -2
DATA_TRANSFER_PENALTY = -0.5
INTERRUPTION_PENALTY = -4
WRONG_EDGE_PENALTY = -10  # 每步错误边缘惩罚（下调以避免主导回报）
ENERGY_DROWN_PENALTY = -100  # 能量耗尽惩罚
OVERTIME_PENALTY = -100  # 超时惩罚

# REWARD:
DATA_COMPUTE_REWARD = 1.0  # 数据计算奖励
TRANS_COMPLETION_REWARD = 0.5  # 传输完成奖励
TASK_COMPLETION_REWARD = 10.0  # 任务完成奖励
ALL_TASK_COMPLETION_REWARD = 100.0  # 任务完成奖励
LAYER_COMPLETION_REWARD = 5.0  # 层完成奖励
DELTA_WORKLOAD_REWARD = 0.05  # 工作量增量奖励 (每步计算进度增量按比例奖励)
SUSTAINED_COMPUTE_BONUS = 0.3  # 连续计算每步的额外奖励，鼓励坚持计算

# 重复移动惩罚相关 (动作 1-4 连续发生时衰减探索)
REPEAT_MOVE_THRESHOLD = 2  # 超过该连续移动次数后开始惩罚
REPEAT_MOVE_PENALTY_BASE = -0.5  # 每超阈值一次额外惩罚 (线性累加)

# 首次计算奖励：从 idle/transfer 切到 compute 的即时奖励，鼓励探索动作5
FIRST_COMPUTE_BONUS = 2.0
REPEAT_MOVE_PENALTY_CAP = -5.0  # 每步重复移动惩罚下限（封顶，避免爆炸）
BASE_MOVE_PENALTY = -0.2  # 每步基础移动惩罚，抑制无效移动探索（1-4）

# LATENCY: (steps)
LAYER_PROCESS_SECOND_COST_GPU = [
    7.0,    # layer0  (大卷积/large tensor convs)
    4.0,    # layer1
    2.0,    # layer2
    1.5,    # layer3
    0.5,    # layer4
]

EXP_OUTPUT = './output/experiment'
LOG_OUTPUT = './output/log'
IMAGE_OUTPUT = './output/images'
DATA_ANALY = './data/analysis'
DATA_OTHERS = './data/others'

# 当前config.py文件的目录
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# 工程中的data目录（假设data文件夹在ConstellationSimulation下）
DATA_DIR = os.path.abspath(os.path.join(BASE_DIR, '..', 'data'))
DATA_OTHERS = os.path.join(DATA_DIR, 'others')
DATA_ANALY = os.path.join(DATA_DIR, 'analysis')

# 工程中的output目录
OUTPUT_DIR = os.path.abspath(os.path.join(BASE_DIR, '..', 'output'))
EXP_OUTPUT = os.path.join(OUTPUT_DIR, 'experiment')
LOG_OUTPUT = os.path.join(OUTPUT_DIR, 'log')
IMAGE_OUTPUT = os.path.join(OUTPUT_DIR, 'images')

# 例如你的DE421文件
BSP_FILE = os.path.join('de421.bsp')
EPHEMERIS = load(BSP_FILE)