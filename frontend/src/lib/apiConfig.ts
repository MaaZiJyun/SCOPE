/**
 * 前端 API 配置文件
 * 用于统一管理后端接口路径
 */

export const DOM = "localhost:8000"

export const API_BASE_URL = "http://" + DOM;
export const WS_BASE_URL = "ws://" + DOM;

// 具体接口路径
export const API_PATHS = {
    findAllSatsToGS: "/api/predict/find-all-sats-to-gs",
    findAllSatsToROI: "/api/predict/find-all-sats-to-roi",
    detectProjectInfo: "/api/local-project/detect",
    saveProjectInfo: "/api/local-project/save",
    simulationWebSocket: "/api/simulation/websocket",
    rlWebSocket: "/api/simulation/ws/rl",
    baselineWebSocket: "/api/simulation/ws/baseline"
};
