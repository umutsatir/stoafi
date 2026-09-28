import { z } from "zod";

/** 'YYYY-MM', always zero-padded. */
export type Month = `${number}-${number}`;

const MONTH_PATTERN = /^(\d{4})-(\d{2})$/;

export const MonthSchema = z
  .string()
  .regex(MONTH_PATTERN)
  .refine(
    (value) => {
      const monthNumber = Number(value.slice(5, 7));
      return monthNumber >= 1 && monthNumber <= 12;
    },
    { message: "Month must be between 01 and 12" },
  ) as unknown as z.ZodType<Month>; // zod infers `string`; Month is a template-literal refinement of it

export function parseMonth(month: string): { year: number; month: number } {
  const match = MONTH_PATTERN.exec(month);
  if (!match) {
    throw new Error(`Invalid Month string: ${month}`);
  }
  const year = Number(match[1]);
  const monthNumber = Number(match[2]);
  if (monthNumber < 1 || monthNumber > 12) {
    throw new Error(`Invalid Month string: ${month}`);
  }
  return { year, month: monthNumber };
}

function formatMonth(year: number, month: number): Month {
  const paddedMonth = String(month).padStart(2, "0");
  return `${year}-${paddedMonth}` as Month;
}

export function addMonths(month: Month, offset: number): Month {
  const { year, month: m } = parseMonth(month);
  const zeroBased = year * 12 + (m - 1) + offset;
  const newYear = Math.floor(zeroBased / 12);
  const newMonth = (zeroBased % 12) + 1;
  return formatMonth(newYear, newMonth);
}

export function compareMonths(a: Month, b: Month): number {
  const pa = parseMonth(a);
  const pb = parseMonth(b);
  return pa.year * 12 + pa.month - (pb.year * 12 + pb.month);
}

export function monthsBetween(from: Month, to: Month): number {
  const pFrom = parseMonth(from);
  const pTo = parseMonth(to);
  return pTo.year * 12 + pTo.month - (pFrom.year * 12 + pFrom.month);
}
