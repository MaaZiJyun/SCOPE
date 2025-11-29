// components/SatDataPercentageCard.tsx

import { SatelliteFrame } from "@/types/simulation";
import {
  Battery0Icon,
  Battery100Icon,
  Battery50Icon,
  SignalIcon,
} from "@heroicons/react/24/outline";
import React from "react";
import ProcessBar from "./ProcessBar";

interface SatDataPercentageCardProps {
  sat: SatelliteFrame | undefined;
}

const SatDataPercentageCard: React.FC<SatDataPercentageCardProps> = ({
  sat,
}) => {
  const isUndefined = sat === undefined;

  const batteryPercent = isUndefined ? 0.0 : sat.batteryPercent / 100;
  // const procBuffDataRatio = isUndefined ? 0.0 : sat.procBuffDataRatio;
  // const storageDataRatio = isUndefined ? 0.0 : sat.storageDataRatio;

  // let BatteryIcon = Battery0Icon;
  // let batteryColor = "text-red-600";
  // if (batteryPercent >= 0.9) {
  //   BatteryIcon = Battery100Icon;
  //   batteryColor = "text-green-600";
  // } else if (batteryPercent >= 0.6) {
  //   BatteryIcon = Battery50Icon;
  //   batteryColor = "text-lime-600";
  // } else if (batteryPercent >= 0.3) {
  //   BatteryIcon = Battery50Icon;
  //   batteryColor = "text-yellow-600";
  // } else if (isUndefined) {
  //   BatteryIcon = SignalIcon;
  //   batteryColor = "text-gray-04";
  // }

  return (
    <div className={`w-full px-2 ${isUndefined ? "opacity-50" : ""} `}>
      <ProcessBar progress={batteryPercent} name="Battery" />
    </div>
  );
};

export default SatDataPercentageCard;
