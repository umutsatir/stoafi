export type Milestone = 25 | 50 | 75 | 100;

const MILESTONES: Milestone[] = [25, 50, 75, 100];

/**
 * The highest milestone a deposit just crossed, or null. A pot with no target has none.
 * Only moving up counts: a withdrawal never cheers.
 */
export function crossedMilestone(before: number, after: number, target: number): Milestone | null {
  if (target <= 0 || after <= before) return null;
  const reached = (balance: number): number =>
    MILESTONES.filter((m) => balance * 100 >= target * m).length;
  const gained = reached(after) - reached(before);
  return gained > 0 ? (MILESTONES[reached(after) - 1] ?? null) : null;
}
