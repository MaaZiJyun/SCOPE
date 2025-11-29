

import { UserInfo } from "@/types";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface PreferenceState {
    // General Preferences
    userInfo: UserInfo | null;        // 用户信息对象
    language: string;                 // 语言（如 "en", "zh-CN"）
    darkMode: boolean;                // 是否开启暗黑模式
    autoSave: boolean;                // 是否自动保存
    autoSaveInterval: number;         // 自动保存间隔（秒/分钟）
    timezone: string;                 // 时区设置（如 "Asia/Shanghai"）

    // Accessibility
    highContrast: boolean;            // 高对比度模式
    reduceMotion: boolean;            // 降低动画

    // Canvas & Workspace
    canvasBackgroundColor: string;   // 画布背景颜色
    constellColor: string;
    orbColor: string;
    islColor: string;
    gsColor: string;
    sglColor: string;
    roiColor: string;
    swathColor: string;

    // System/UI layout
    showTooltips: boolean;            // 是否显示提示气泡

    setUserInfo: (userInfo: UserInfo | null) => void;
    setLanguage: (language: string) => void;
    setDarkMode: (dark: boolean) => void;
    setAutoSave: (autoSave: boolean) => void;
    setAutoSaveInterval: (interval: number) => void;
    setTimezone: (tz: string) => void;
    setHighContrast: (high: boolean) => void;
    setReduceMotion: (reduce: boolean) => void;
    setCanvasBackgroundColor: (color: string) => void;
    setConstellColor: (color: string) => void;
    setOrbColor: (color: string) => void;
    setIslColor: (color: string) => void;
    setGsColor: (color: string) => void;
    setSglColor: (color: string) => void;
    setRoiColor: (color: string) => void;
    setSwathColor: (color: string) => void;
    setShowTooltips: (show: boolean) => void;

    // 可选：重置所有设置
    reset: () => void;
}


export const preferenceStore = create<PreferenceState>()(
    persist(
        (set, get) => ({
            // 默认值
            userInfo: null,
            language: "en",
            darkMode: false,
            autoSave: true,
            autoSaveInterval: 5,
            timezone: "UTC",
            highContrast: false,
            reduceMotion: false,
            canvasBackgroundColor: "#ffffff",
            constellColor: "#2196f3",
            orbColor: "#e91e63",
            islColor: "#4caf50",
            gsColor: "#ff9800",
            sglColor: "#9c27b0",
            roiColor: "#607d8b",
            swathColor: "#ffeb3b",
            showTooltips: true,

            // setter 函数
            setUserInfo: (userInfo) => set({ userInfo }),
            setLanguage: (language) => set({ language }),
            setDarkMode: (darkMode) => set({ darkMode }),
            setAutoSave: (autoSave) => set({ autoSave }),
            setAutoSaveInterval: (autoSaveInterval) => set({ autoSaveInterval }),
            setTimezone: (timezone) => set({ timezone }),
            setHighContrast: (highContrast) => set({ highContrast }),
            setReduceMotion: (reduceMotion) => set({ reduceMotion }),
            setCanvasBackgroundColor: (canvasBackgroundColor) => set({ canvasBackgroundColor }),
            setConstellColor: (constellColor) => set({ constellColor }),
            setOrbColor: (orbColor) => set({ orbColor }),
            setIslColor: (islColor) => set({ islColor }),
            setGsColor: (gsColor) => set({ gsColor }),
            setSglColor: (sglColor) => set({ sglColor }),
            setRoiColor: (roiColor) => set({ roiColor }),
            setSwathColor: (swathColor) => set({ swathColor }),
            setShowTooltips: (showTooltips) => set({ showTooltips }),

            // 重置
            reset: () =>
                set({
                    userInfo: null,
                    language: "en",
                    darkMode: false,
                    autoSave: true,
                    autoSaveInterval: 5,
                    timezone: "UTC",
                    highContrast: false,
                    reduceMotion: false,
                    canvasBackgroundColor: "#ffffff",
                    constellColor: "#2196f3",
                    orbColor: "#e91e63",
                    islColor: "#4caf50",
                    gsColor: "#ff9800",
                    sglColor: "#9c27b0",
                    roiColor: "#607d8b",
                    swathColor: "#ffeb3b",
                    showTooltips: true,
                }),
        }),
        {
            name: "preference-storage",
        }
    )
);
