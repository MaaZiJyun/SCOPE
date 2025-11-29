import { toInputLocal } from "@/services/date_time/time_convert";

interface ClockWidgetProps {
  timeSlot: number; // 外部传入的 timeslot 编号
  time: string;
}

export default function ClockWidget({ timeSlot, time }: ClockWidgetProps) {
  // console.log("ClockWidget", timeSlot, time);
  return (
    <div className="select-none text-white/30 text-xs px-4 py-2 text-right">
      <div>{toInputLocal(time)}</div>
      <div>
        TimeSlot: <span className="text-white/80">{timeSlot}</span>
      </div>
    </div>
  );
}