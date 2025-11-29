import { useState, useEffect } from "react";
import { PuzzlePieceIcon } from "@heroicons/react/24/outline";

export default function VoidPage() {
  const [rotated, setRotated] = useState(false);

  useEffect(() => {
    let shakeCount = 0;
    const timer = setInterval(() => {
      setRotated(true);
      setTimeout(() => {
        setRotated(false);
        shakeCount++;
        if (shakeCount < 2) {
          setTimeout(() => setRotated(true), 150);
          setTimeout(() => setRotated(false), 300);
        } else {
          shakeCount = 0;
        }
      }, 150);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="select-none flex flex-col w-full h-full items-center justify-center">
      <span
        className="text-white/40 text-[30vh] transition-transform duration-300"
        style={{
          display: "inline-block",
          transform: rotated ? "rotate(15deg)" : "rotate(-15deg)",
        }}
      >
        <PuzzlePieceIcon className="h-42 w-42" />
      </span>
      <div className="mt-10 text-sm space-y-1 text-center">
        <p>
          There is no simulation dataset. Please upload a dataset or turn on
          simulation to start.
        </p>
        <p>
          Go to the{" "}
          <span className="rounded-lg px-2 py-1 bg-white/30 text-white/80">
            Simulation
          </span>{" "}
          tab and click{" "}
          <span className="rounded-lg px-2 py-1 bg-white/30 text-white/80">
            Start Simulation
          </span>
          .
        </p>
      </div>
    </div>
  );
}
