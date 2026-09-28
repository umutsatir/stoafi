"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { Input } from "@/components/ui/input";
import { formatPercentForInput, parsePercent } from "@/lib/amount-text";

export interface PercentInputProps {
  id: string;
  /** A ratio: 0.3 means 30%. */
  value: number;
  onChange: (ratio: number) => void;
  "aria-label"?: string;
}

/** The user types "30"; the caller gets 0.3. Same invalid-text rules as MoneyInput. */
export function PercentInput({ id, value, onChange, "aria-label": ariaLabel }: PercentInputProps) {
  const locale = useLocale();
  const [text, setText] = useState(() => formatPercentForInput(value, locale));
  const [invalid, setInvalid] = useState(false);
  // Latest text for the sync effect below, without re-running it on every keystroke.
  const textRef = useRef(text);
  textRef.current = text;

  useEffect(() => {
    const parsed = parsePercent(textRef.current, locale);
    if (parsed === null || Math.abs(parsed - value) > 1e-9) {
      setText(formatPercentForInput(value, locale));
      setInvalid(false);
    }
  }, [value, locale]);

  return (
    <span className="flex items-center gap-2">
      <Input
        className="w-40"
        id={id}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        placeholder="0"
        aria-label={ariaLabel}
        aria-invalid={invalid ? "true" : undefined}
        value={text}
        onChange={(e) => {
          const next = e.target.value;
          setText(next);
          const ratio = parsePercent(next, locale);
          setInvalid(ratio === null);
          if (ratio !== null) onChange(ratio);
        }}
      />
      <span aria-hidden="true" className="text-sm text-muted-foreground">
        %
      </span>
    </span>
  );
}
