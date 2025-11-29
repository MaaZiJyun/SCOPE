import { Project } from "@/types";
import { useAuthStore } from "@/store/userStore";

export function createInitialProject(): Project | null {
    const userInfo = useAuthStore((s) => s.userInfo);
    const now = new Date();
    if (!userInfo || !userInfo.id) {
        console.log("Unauthorized")
        return null
    } else
        return {
            id: "",
            userId: userInfo.id,
            title: 'Untitled',
            description: '',
            hardware: {
                id: "",
                projectId: "",
                focalLength: 50, // mm
                widthPx: 1920, // px
                lengthPx: 1080, // px
                pxSizeWidth: 5.5, // pixel size in μm, e.g. 5.5 for typical CMOS
                pxSizeLength: 5.5, // pixel size in μm, e.g. 5.5 for typical CMOS
                channelsPerPx: 3, // e.g. 3 for RGB
                bitsPerChannel: 8, // e.g. 8 for RGB
                downlinkFrequencyHz: 26000000000,
                downlinkBandwidthHz: 500000000,
                downlinkTxPowerW: 10,
                downlinkGainTxDbi: 30,
                downlinkGainRxDbi: 40,
                downlinkNoiseTempK: 300,
                uplinkFrequencyHz: 30000000000,
                uplinkBandwidthHz: 500000000,
                uplinkGainTxDbi: 40,
                uplinkTxPowerW: 50,
                uplinkGainRxDbi: 20,
                uplinkNoiseTempK: 500,
                islFrequencyHz: 50000000000,
                islBandwidthHz: 2000000000,
                islTxPowerW: 5,
                islGainTxDbi: 32,
                islGainRxDbi: 32,
                islNoiseTempK: 400,
            },
            experiment: {
                id: '',
                projectId: '',
                startTime: now.toISOString(),
                endTime: undefined,
                timeSlot: 38.83834135176245,
                missions: []
            },
            constellation: {
                id: '',
                projectId: '',
                name: 'Untitled',
                description: '',
                numberOfPlanes: 1,
                numberOfSatPerPlanes: 1,
                phaseFactor: 0,
                altitude: 600000,
                inclination: 90,
                orbitalPeriod: undefined
            },
            satellites: [],
            groundStations: [],
            rois: []
        };
}

