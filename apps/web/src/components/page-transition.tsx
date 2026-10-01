"use client";

import { MotionConfig } from "motion/react";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/**
 * Every page rises in when you arrive on it. `MotionConfig` makes the `motion` library honour the
 * device's reduced-motion setting too; the CSS animations are switched off by a media query.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <MotionConfig reducedMotion="user">
      <div key={pathname} className="rise-in">
        {children}
      </div>
    </MotionConfig>
  );
}
