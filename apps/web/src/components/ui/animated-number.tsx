"use client";

import { animate, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";

export interface AnimatedNumberProps {
  value: number;
  /** Turns the (possibly in-between) number into text, e.g. a money formatter. */
  format?: (n: number) => string;
  /** Seconds. Under reduced motion the final value shows at once. */
  duration?: number;
  className?: string;
  testId?: string;
}

/** Counts from the previous value to the new one. The text always ends on exactly `value`. */
export function AnimatedNumber({
  value,
  format = (n) => String(Math.round(n)),
  duration = 0.6,
  className,
  testId,
}: AnimatedNumberProps) {
  const reduced = useReducedMotion();
  const [shown, setShown] = useState(value);
  const from = useRef(value);

  useEffect(() => {
    if (reduced || from.current === value) {
      from.current = value;
      setShown(value);
      return;
    }
    const controls = animate(from.current, value, {
      duration,
      ease: "easeOut",
      onUpdate: setShown,
      onComplete: () => setShown(value),
    });
    from.current = value;
    return () => controls.stop();
  }, [value, reduced, duration]);

  return (
    <span className={className} data-testid={testId}>
      {format(shown === value ? value : shown)}
    </span>
  );
}
