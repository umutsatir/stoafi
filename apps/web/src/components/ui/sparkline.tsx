import { cn } from "@/lib/utils";

export interface SparklineProps {
  points: number[];
  /** Screen-reader description of the line, e.g. "Savings rate over the last 6 months". */
  label: string;
  className?: string;
}

/** A tiny line of how a number moved. Needs two points or more; a flat line is drawn in the middle. */
export function Sparkline({ points, label, className }: SparklineProps) {
  if (points.length < 2) return null;
  const width = 120;
  const height = 36;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min;
  const coords = points.map((p, i) => {
    const x = (i / (points.length - 1)) * (width - 4) + 2;
    const y = span === 0 ? height / 2 : height - 3 - ((p - min) / span) * (height - 6);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const last = coords[coords.length - 1] as string;
  const [lx, ly] = last.split(",") as [string, string];
  return (
    <svg
      role="img"
      aria-label={label}
      viewBox={`0 0 ${width} ${height}`}
      className={cn("h-9 w-full text-primary", className)}
    >
      <polyline
        points={coords.join(" ")}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={lx} cy={ly} r="3" fill="currentColor" />
    </svg>
  );
}
