import type React from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Inline style that staggers `.rise-in` and `.pop-in` animations: item 0 first, then 55ms apart. */
export function stagger(index: number): React.CSSProperties {
  return { "--i": index } as React.CSSProperties;
}
