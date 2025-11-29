import { LinkData, Project, RealTime } from "@/types";

export const calcRealTimeFrames = async (project: Project) => {
  if (!project) return null;
  try {
    const res = await fetch("/api/calc-realtime-data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(project),
    });
    if (!res.ok) return null;
    const json = await res.json();
    const set = json.data;
    // console.log(set)
    const data = parseAndSortByTimeSlot<RealTime>(set);
    if (data.length != 0)
      return data
    else
      return null
  } catch {
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

