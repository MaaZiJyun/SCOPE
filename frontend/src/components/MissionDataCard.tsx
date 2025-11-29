import { Task } from "@/types/simulation";
import React from "react";
import StepProgressBar from "./StepProgressBar";
import { MissionStatus, MissionStatusCode } from "@/lib/missionStatus";
import ProcessBar from "@/components/ProcessBar";

interface MissionDataCardProps {
  mission: Task;
}

const MissionDataCard: React.FC<MissionDataCardProps> = ({ mission }) => {
  const titleStyle = "text-xs text-white/60";

  const getStatus = (mission: Task): string => {
    // Case 1: done
    if (mission.is_done) return "done";

    // Case 2: computing (acted == 5 and some workload done)
    if (Number(mission.acted) === 5 && (mission.workload_done ?? 0) > 0) {
      return "under_processing";
    }

    // Case 3: transferring (acted in 1..4 and some data already sent)
    if (
      [1, 2, 3, 4].includes(Number(mission.acted)) &&
      (mission.data_sent ?? 0) > 0
    ) {
      return "under_transferring";
    }

    // Case 4: idle
    return "idle";
  };

  const status = getStatus(mission)

  return (
    <div className="w-full mb-2 px-2">
      <div className="flex justify-between mb-1">
        <span className="text-yellow-600 font-bold">
          {status.toUpperCase()}
        </span>
        <div className="flex">
          <span className="text-xs text-white/40">
            (ID: {mission.id})
          </span>
        </div>
      </div>
      <div className="mb-1">
        Location: Plane {mission.plane_at}, Order {mission.order_at}
      </div>
      <div className="mb-1">
        Latency: {mission.t_end - mission.t_start} slots
      </div>
      <div className="mb-1">
        <ProcessBar progress={mission.infer_percent} name={"Completion"}/>
        <ProcessBar progress={mission.workload_percent} name={"Temp. Processing"}/>
        <ProcessBar progress={mission.data_percent} name={"Temp. Transferring"}/>
      </div>
    </div>
  );
};

export default MissionDataCard;
