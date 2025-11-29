"use client";

import { Constellation } from "@/types";
import { useState } from "react";
import { BlurUpdateInput } from "../../../components/BlurUpdateInput";
import HintLabel from "@/components/HintLabel";

interface ConstellationDetailsProps {
  constellation: Constellation;
  updateField: (path: string[], value: any) => void;
}

export const ConstellationDetails = ({
  constellation,
  updateField,
}: ConstellationDetailsProps) => {
  const [desc, setDesc] = useState(constellation.description ?? "");

  return (
    <div className="mt-4 mb-8 mx-20">
      {/* Basic */}
      <div className="mb-2">
        <span className="text-xl">Basic</span>
      </div>

      <div className="mb-4">
        <label className="block mb-1 text-xs">
          Name {constellation.id && `(ID: ${constellation.id})`}
        </label>
        <BlurUpdateInput
          value={constellation.name ?? ""}
          onSave={(val) => updateField(["constellation", "name"], val)}
        />
      </div>

      {/* <div className="mb-4">
        <label className="block mb-1 text-xs">Description</label>
        <textarea
          rows={3}
          defaultValue={desc}
          onBlur={(e) => {
            if (e.target.value !== constellation.description) {
              updateField(["constellation", "description"], e.target.value);
              setDesc(e.target.value);
            }
          }}
          className="w-full rounded-lg bg-white/20 px-3 py-2 text-white resize-none"
          placeholder="Describe the constellation"
        />
      </div> */}

      {/* Orbital Parameters */}
      <div className="mt-8 mb-2">
        <span className="text-xl">Orbital Parameters</span>
      </div>

      <div className="mb-4">
        <HintLabel
          label="Orbital Period (s)"
          hint="The amount of time an object complete one full revolution around another object along its orbit. (* second)"
        />
        <div className="w-full flex items-center px-2 py-1 rounded-lg bg-green-200/20 border border-green-200/20">
          <span
            className={`text-sm font-semibold ${
              constellation.orbitalPeriod ? "text-green-300" : "text-red-400"
            }`}
          >
            {constellation.orbitalPeriod ?? "Not calculated"}
          </span>
          {!constellation.orbitalPeriod && (
            <span className="ml-2 text-sm text-gray-400">(Not calculated)</span>
          )}
        </div>
      </div>

      <div className="mb-4">
        <HintLabel
          label="Planes Quantity"
          hint="The number of orbital planes in the constellation. "
        />
        <BlurUpdateInput
          type="number"
          min={1}
          max={100}
          value={constellation.numberOfPlanes ?? ""}
          onSave={(val) =>
            updateField(
              ["constellation", "numberOfPlanes"],
              isNaN(val) ? undefined : val
            )
          }
        />
      </div>

      <div className="mb-4">
        <HintLabel
          label="Sat per Plane"
          hint="The number of satellites in each orbital plane"
        />
        <BlurUpdateInput
          type="number"
          min={1}
          max={100}
          value={constellation.numberOfSatPerPlanes ?? ""}
          onSave={(val) =>
            updateField(
              ["constellation", "numberOfSatPerPlanes"],
              isNaN(val) ? undefined : val
            )
          }
        />
      </div>

      <div className="mb-4">
        <HintLabel
          label="Altitude (m)"
          hint="The height of constellation orbit. (* meters)"
        />
        <BlurUpdateInput
          type="number"
          value={constellation.altitude ?? ""}
          onSave={(val) =>
            updateField(
              ["constellation", "altitude"],
              isNaN(val) ? undefined : val
            )
          }
        />
      </div>

      <div className="mb-4">
        <HintLabel
          label="Inclination (deg)"
          hint="The angle between the plane of an orbit and a reference plane. (* degrees)"
        />
        <BlurUpdateInput
          type="number"
          value={constellation.inclination ?? ""}
          onSave={(val) =>
            updateField(
              ["constellation", "inclination"],
              isNaN(val) ? undefined : val
            )
          }
        />
      </div>

      <div className="mb-4">
        <HintLabel
          label="Phase Factor"
          hint="The relative phase offset between two adjacent satellites in their orbit. (* degrees)"
        />
        <BlurUpdateInput
          type="number"
          value={constellation.phaseFactor ?? ""}
          onSave={(val) =>
            updateField(
              ["constellation", "phaseFactor"],
              isNaN(val) ? undefined : val
            )
          }
        />
      </div>
    </div>
  );
};
