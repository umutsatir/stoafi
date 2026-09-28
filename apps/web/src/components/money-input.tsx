"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { formatMinorForInput, parseMinor } from "@/lib/amount-text";

export interface MoneyInputProps {
  id: string;
  /** Integer minor units (kuruş / cents). */
  value: number;
  onChange: (minor: number) => void;
  currency?: string;
  required?: boolean;
  "aria-label"?: string;
}

function currencySymbol(locale: string, currency: string): string {
  const parts = new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    currencyDisplay: "narrowSymbol",
  }).formatToParts(0);
  return parts.find((p) => p.type === "currency")?.value ?? currency;
}

/**
 * The user types major units ("300", "1.250,50"); the caller only ever sees
 * integer minor units. Invalid text is kept on screen (flagged) but never
 * emitted, so a half-typed "-" can't corrupt stored money.
 */
export function MoneyInput({
  id,
  value,
  onChange,
  currency = "TRY",
  required,
  "aria-label": ariaLabel,
}: MoneyInputProps) {
  const locale = useLocale();
  const [text, setText] = useState(() => formatMinorForInput(value, locale));
  const [invalid, setInvalid] = useState(false);
  // Latest text for the sync effect below, without re-running it on every keystroke.
  const textRef = useRef(text);
  textRef.current = text;

  useEffect(() => {
    // Re-sync only when the value changed from outside (e.g. form reset),
    // not while the user's own text already parses to it.
    if (parseMinor(textRef.current, locale) !== value) {
      setText(formatMinorForInput(value, locale));
      setInvalid(false);
    }
  }, [value, locale]);

  return (
    <span>
      <input
        id={id}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        placeholder="0"
        required={required}
        aria-label={ariaLabel}
        aria-invalid={invalid ? "true" : undefined}
        value={text}
        onChange={(e) => {
          const next = e.target.value;
          setText(next);
          const minor = parseMinor(next, locale);
          setInvalid(minor === null);
          if (minor !== null) onChange(minor);
        }}
      />
      <span aria-hidden="true">{currencySymbol(locale, currency)}</span>
    </span>
  );
}
