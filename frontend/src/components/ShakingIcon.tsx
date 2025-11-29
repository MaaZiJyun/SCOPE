import React, { useState } from "react";

// 通用抖动Icon容器
export function ShakingIcon({
  className = "",
  children,
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  const [rotated, setRotated] = useState(false);

  const shake = () => {
    let shakeCount = 0;
    const doShake = () => {
      setRotated(true);
      setTimeout(() => {
        setRotated(false);
        shakeCount++;
        if (shakeCount < 2) {
          setTimeout(doShake, 150);
        }
      }, 150);
    };
    doShake();
  };

  return (
    <div className={className} onMouseEnter={shake}>
      <div
        className={`transition-transform duration-150 ${
          rotated ? "rotate-[25deg]" : ""
        }`}
        style={rotated ? { transform: "rotate(25deg)" } : {}}
        onClick={onClick}
      >
        {children}
      </div>
    </div>
  );
}
