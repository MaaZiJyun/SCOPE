import { BeakerIcon } from "@heroicons/react/24/outline";
import { useState, useEffect } from "react";

export default function EmptyPage() {
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
    <div className="select-none flex flex-col select-none bg-white/5 w-full h-full text-white/30 items-center justify-center">
      <span
        className="text-white/40 text-[30vh] transition-transform duration-300"
        style={{
          display: "inline-block",
          transform: rotated ? "rotate(15deg)" : "rotate(-15deg)",
        }}
      >
        <BeakerIcon className="h-42 w-42" />
      </span>
      <div className="mt-10 text-sm space-y-1 text-center">
        <p>It seems that no windows are open.</p>{" "}
        <p>
          Try clicking the Tag
          <span className="rounded-lg px-2 py-1 mx-2 bg-white/30 text-white/80">
            Visualization
          </span>
          at the top.
        </p>
      </div>
    </div>
  );
}
