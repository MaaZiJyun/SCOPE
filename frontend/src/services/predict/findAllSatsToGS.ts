import { GroundStation, Project, ROI, Satellite } from "@/types";
import { API_PATHS } from "@/lib/apiConfig";

export const findAllSatsToGS = async (
    t_start: string,
    project: Project,
    gs: GroundStation,
    ts_duration: number,
    max_duration: number) => {
    try {
        const res = await fetch(API_PATHS.findAllSatsToGS, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                t_start: t_start,
                project: project,
                gs: gs,
                ts_duration: ts_duration,
                max_duration: max_duration
            }),
        });
        if (!res.ok) return null;
        const json = await res.json();
        const data = json.data;
        console.log(data)
        if (data.length != 0)
            return data
        else
            return null
    } catch {
        return null;
    }
};