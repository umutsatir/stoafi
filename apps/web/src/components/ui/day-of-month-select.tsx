"use client";

import { NativeSelect } from "@/components/ui/native-select";

const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

export interface DayOfMonthSelectProps {
  id?: string;
  value: number;
  onChange: (value: number) => void;
  className?: string;
  "aria-label"?: string;
}

/** A plain <select> of 1-31 for picking a day of month (pay day, due day). */
export function DayOfMonthSelect({
  id,
  value,
  onChange,
  className,
  ...rest
}: DayOfMonthSelectProps) {
  return (
    <NativeSelect
      id={id}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      {...(className ? { className } : {})}
      {...rest}
    >
      {DAYS.map((day) => (
        <option key={day} value={day}>
          {day}
        </option>
      ))}
    </NativeSelect>
  );
}
