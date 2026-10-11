import data from "../../data/held-in.json";

export type EmergencyFit = "good" | "ok" | "risky";

export interface HeldInOption {
  id: string;
  /** The picture used for it, as for investment types. */
  icon: string;
  emergencyFit: EmergencyFit;
}

export const HELD_IN_OPTIONS: HeldInOption[] = data.options as HeldInOption[];

const CUSTOM_PREFIX = "custom:";
const MAX_CUSTOM = 40;

/** The stored value for a choice: a preset id, or `custom:Name` for something the user names. */
export function heldInValue(typeId: string, customName?: string): string | undefined {
  if (typeId === "") return undefined;
  if (typeId === "custom") {
    const name = (customName ?? "").trim().slice(0, MAX_CUSTOM);
    return name === "" ? undefined : `${CUSTOM_PREFIX}${name}`;
  }
  return HELD_IN_OPTIONS.some((o) => o.id === typeId) ? typeId : undefined;
}

/** Splits a stored value back into the choice and, for a custom one, its name. */
export function parseHeldIn(value: string | undefined): { typeId: string; customName: string } {
  if (!value) return { typeId: "", customName: "" };
  if (value.startsWith(CUSTOM_PREFIX)) {
    return { typeId: "custom", customName: value.slice(CUSTOM_PREFIX.length) };
  }
  return HELD_IN_OPTIONS.some((o) => o.id === value)
    ? { typeId: value, customName: "" }
    : { typeId: "", customName: "" };
}

/** How well what an emergency fund is kept in suits it; something the user named is taken as "ok". */
export function emergencyFit(value: string | undefined): EmergencyFit | null {
  if (!value) return null;
  if (value.startsWith(CUSTOM_PREFIX)) return "ok";
  return HELD_IN_OPTIONS.find((o) => o.id === value)?.emergencyFit ?? null;
}
