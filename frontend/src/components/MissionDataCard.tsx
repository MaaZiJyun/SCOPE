import { Task } from "@/types/simulation";
import React from "react";
import StepProgressBar from "./StepProgressBar";
import { MissionStatus, MissionStatusCode } from "@/lib/missionStatus";
import ProcessBar from "@/components/ProcessBar";

interface MissionDataCardProps {
  mission: Task;
}

const MissionDataCard: React.FC<MissionDataCardProps> = ({ mission }) => {
  const getStatus = (mission: Task): string => {
    // Case 1: done
    if (mission.is_done) return "done";

    // Case 2: computing (acted == 5 and some workload done)
    if (Number(mission.acted) === 5 && (mission.workload_done ?? 0) > 0) {
      return "comp";
    }

    // Case 3: transferring (acted in 1..4 and some data already sent)
    if (
      [1, 2, 3, 4].includes(Number(mission.acted)) &&
      (mission.data_sent ?? 0) > 0
    ) {
      return "tran";
    }

    // Case 4: idle
    return "idle";
  };

  const status = getStatus(mission);
  const statusColor = ((s: string) => {
    switch (s) {
      case "idle":
        return "gray-400";
      case "done":
        return "green-500";
      case "comp":
        return "purple-500";
      case "tran":
        return "blue-500";
      default:
        return "white";
    }
  })(status);

  return (
    <div className="w-full p-2">
      <div className="flex justify-between mb-1">
        Task Status:
        <span
          className={`text-${statusColor} px-3 rounded-full border border-${statusColor} bg-${statusColor}/20 text-xs`}
        >
          {status.toUpperCase()}
        </span>
      </div>
      <div className="mb-1">
        Location: Plane {mission.plane_at}, Order {mission.order_at}
      </div>
      <div className="mb-1">
        Latency: {mission.t_end - mission.t_start} slots
      </div>
      <div className="mb-1">
        {!mission.is_done && (
          <ProcessBar progress={mission.infer_percent} name={"Completion"} />
        )}
        {mission.workload_percent != 0 && (
          <ProcessBar
            progress={mission.workload_percent}
            name={"Temp. Processing"}
          />
        )}
        {/* {mission.data_percent != 0 && ( */}
          <ProcessBar
            progress={mission.data_percent}
            name={"Temp. Transferring"}
          />
        {/* )} */}
      </div>
    </div>
  );
};

export default MissionDataCard;
