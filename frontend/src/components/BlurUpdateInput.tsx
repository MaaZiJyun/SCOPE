import { useState } from "react";

interface BlurUpdateInputProps {
  value: any;
  min?: number;
  max?: number;
  onSave: (value: any) => void;
  type?: "text" | "number" | "datetime-local";
}

export const BlurUpdateInput = ({
  value,
  min,
  max,
  onSave,
  type = "text",
}: BlurUpdateInputProps) => {
  const [localValue, setLocalValue] = useState(value);

  const handleBlur = () => {
    if (localValue !== value) {
      onSave(localValue);
    }
  };

  const commonProps = {
    value:
      type === "datetime-local" && typeof localValue === "string"
        ? localValue.slice(0, 16)
        : localValue ?? "",
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      setLocalValue(
        type === "number" ? Number(e.target.value) : e.target.value
      ),
    onBlur: handleBlur,
    className: "w-full rounded-lg bg-white/20 px-2 py-1 text-white text-sm",
  };

  return type === "number" ? (
    <input type="number" {...commonProps} min={min} max={max} />
  ) : (
    <input type={type} {...commonProps} />
  );
};
