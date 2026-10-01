"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type { LucideIcon } from "lucide-react";
import { Coins } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PotVisualProps {
  /** How full the pot is, 0 to 1 (clamped). */
  fraction: number;
  /** The picture in the middle: a piggy bank, a gold bar, a share certificate. */
  icon: LucideIcon;
  /** Changes every time money goes in; each change drops one coin into the pot. */
  dropKey?: number;
  /** What falls in. Defaults to a coin. */
  dropIcon?: LucideIcon;
  className?: string;
}

/** A pot that fills up as you save. Under reduced motion the level changes without the coin. */
export function PotVisual({
  fraction,
  icon: Icon,
  dropKey = 0,
  dropIcon: DropIcon = Coins,
  className,
}: PotVisualProps) {
  const reduced = useReducedMotion();
  const level = Math.min(1, Math.max(0, fraction));
  return (
    <div
      aria-hidden="true"
      className={cn(
        "relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-3xl bg-muted",
        className,
      )}
    >
      <motion.div
        className="absolute inset-x-0 bottom-0 bg-primary/25"
        initial={false}
        animate={{ height: `${level * 100}%` }}
        transition={{ type: "spring", stiffness: 120, damping: 20 }}
      />
      <Icon className="relative h-12 w-12 text-primary" strokeWidth={1.5} />
      <AnimatePresence>
        {dropKey > 0 && !reduced && (
          <motion.span
            key={dropKey}
            className="absolute left-1/2 top-0 -ml-3 text-highlight"
            initial={{ y: -28, opacity: 1, rotate: -20 }}
            animate={{ y: 44, opacity: 0, rotate: 20 }}
            transition={{ duration: 0.7, ease: "easeIn" }}
          >
            <DropIcon className="h-6 w-6" />
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}
