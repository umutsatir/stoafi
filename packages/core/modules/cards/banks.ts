import banksData from "../../data/banks.json";

export interface BankPreset {
  id: string;
  name: string;
  country: string;
  from: string;
  to: string;
  text: string;
}

export interface CardColors {
  from: string;
  to: string;
  text: string;
}

export const BANKS: BankPreset[] = banksData.banks;
export const BANKS_ARE_APPROXIMATE: boolean = banksData.colorsAreApproximate;

export function bankById(id: string): BankPreset | undefined {
  return BANKS.find((bank) => bank.id === id);
}

function channels(hex: string): [number, number, number] {
  return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) as [number, number, number];
}

function toHex(values: number[]): string {
  return `#${values.map((v) => Math.round(v).toString(16).padStart(2, "0")).join("")}`;
}

function luminance(hex: string): number {
  const [r, g, b] = channels(hex).map((value) => {
    const c = value / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function ratio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

/** Mixes `hex` toward black (`amount` 0-1). */
function darken(hex: string, amount: number): string {
  return toHex(channels(hex).map((v) => v * (1 - amount)));
}

/**
 * The colours to draw a card in: its bank's gradient, else a gradient from its custom colour
 * (darkened until the text stays readable at both ends), else the neutral "other" card.
 */
export function cardColors(card: { bankId?: string; color?: string }): CardColors {
  const bank = card.bankId ? bankById(card.bankId) : undefined;
  if (bank) return { from: bank.from, to: bank.to, text: bank.text };
  if (card.color) {
    const from = card.color;
    const to = darken(from, 0.25);
    // Whichever of white or near-black reads better on the lighter end, then darken further if needed.
    const text = ratio("#ffffff", from) >= ratio("#101010", from) ? "#ffffff" : "#101010";
    let start = from;
    let end = to;
    for (let step = 0; step < 8 && Math.min(ratio(text, start), ratio(text, end)) < 4.5; step++) {
      const shift =
        text === "#ffffff"
          ? darken
          : (hex: string) => toHex(channels(hex).map((v) => v + (255 - v) * 0.2));
      start = shift(start, 0.2);
      end = shift(end, 0.2);
    }
    return { from: start, to: end, text };
  }
  const fallback = bankById("other") as BankPreset; // "other" is always in banks.json (tested)
  return { from: fallback.from, to: fallback.to, text: fallback.text };
}
