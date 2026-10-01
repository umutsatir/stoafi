"use client";

import { motion, useReducedMotion } from "motion/react";

const PIECES = Array.from({ length: 22 }, (_, i) => {
  const angle = (i / 22) * Math.PI * 2;
  const distance = 60 + ((i * 37) % 50);
  return {
    x: Math.cos(angle) * distance,
    y: Math.sin(angle) * distance - 20,
    rotate: (i * 47) % 360,
    delay: (i % 5) * 0.02,
    tone: ["bg-primary", "bg-highlight", "bg-info", "bg-success", "bg-warning"][i % 5] as string,
  };
});

/** A short burst when a goal is reached. Renders nothing under reduced motion. Mount it to play it. */
export function Confetti() {
  const reduced = useReducedMotion();
  if (reduced) return null;
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-visible">
      {PIECES.map((piece, i) => (
        <motion.span
          key={i}
          className={`absolute left-1/2 top-1/2 h-2 w-1.5 rounded-sm ${piece.tone}`}
          initial={{ x: 0, y: 0, opacity: 1, rotate: 0, scale: 1 }}
          animate={{ x: piece.x, y: piece.y + 40, opacity: 0, rotate: piece.rotate, scale: 0.8 }}
          transition={{ duration: 1.1, delay: piece.delay, ease: "easeOut" }}
        />
      ))}
    </div>
  );
}
