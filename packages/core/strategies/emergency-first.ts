import type { Bucket } from "../kernel/bucket";
import type { Month } from "../kernel/month";
import type { Minor } from "../kernel/money";
import { emergencyGap } from "../modules/profile/emergency-deposits";
import type { Profile } from "../modules/profile/schema";
import { monthlyNeeds } from "../modules/profile/selectors";

/**
 * Emergency fund first: while the emergency fund is below its target, the money a plan would invest goes
 * to savings instead, so the fund fills before anything is invested. Once the fund is at its target the
 * plan is used as it is. `month` picks which month's needs set the target; without it every expense counts.
 */
export function emergencyFirst(
  allocation: Record<Bucket, Minor>,
  profile: Profile,
  month?: Month,
): Record<Bucket, Minor> {
  const gap = emergencyGap(
    profile.savings,
    monthlyNeeds(profile, month),
    profile.emergencyFundTargetMonths,
  );
  if (gap <= 0 || allocation.investing === 0) return allocation;
  return {
    ...allocation,
    savings: allocation.savings + allocation.investing,
    investing: 0,
  };
}
