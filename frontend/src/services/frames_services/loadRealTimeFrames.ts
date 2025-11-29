import { RealTime } from "@/types";

export const loadRealTimeFrames = async (constellationId: string): Promise<RealTime[] | null> => {
    try {
        const res = await fetch(`/api/get-realtime-data/${constellationId}`);

        if (!res.ok) {
            console.error("Failed to fetch real-time frames");
            return null;
        }

        const json = await res.json();
        const set = json.data;
        // console.log(set)
        const data = parseAndSortByTimeSlot<RealTime>(set);
        return data.length !== 0 ? data : null;

    } catch (err) {
        console.error("Error while loading real-time frames:", err);
        return null;
    }
};

function parseAndSortByTimeSlot<T extends { timeSlot: number; frameTime: string | Date }>(
    rawData: any[]
): T[] {
    return rawData
        .map((item) => ({
            ...item,
            frameTime: new Date(item.frameTime),
        }))
        .sort((a, b) => a.timeSlot - b.timeSlot);
}
