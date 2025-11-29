// components/SatDataPercentageCard.tsx

import { StationFrame } from "@/types/simulation";
import React from "react";
import ProcessBar from "./ProcessBar";

interface GsDataPercentageCardProps {
  gs: StationFrame | undefined;
}

const GsDataPercentageCard: React.FC<GsDataPercentageCardProps> = ({ gs }) => {
  const isUndefined = gs === undefined;
  const rawBuffDataRatio = isUndefined ? 0.0 : gs.yBuff;
  const procBuffDataRatio = isUndefined ? 0.0 : gs.zBuff;
  return (
    <div className={`w-full px-2 ${isUndefined ? "opacity-50" : ""}`}>
      <ProcessBar progress={rawBuffDataRatio} name="Raw Data" />
      <ProcessBar progress={procBuffDataRatio} name="Processed Data" />
    </div>
  );
};

export default GsDataPercentageCard;
