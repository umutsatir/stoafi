import { describe, expect, it } from "vitest";
import { addDeposit, depositedInMonth, editDeposit, removeDeposit, type Deposit } from "./deposit";

const d = (id: string, date: string, amount: number): Deposit => ({ id, date, amount });

describe("addDeposit", () => {
  it("adds money to the balance and records it", () => {
    const result = addDeposit({ balance: 1_000, deposits: [] }, d("a", "2026-10-03", 500));
    expect(result).toEqual({ ok: true, balance: 1_500, deposits: [d("a", "2026-10-03", 500)] });
  });

  it("takes money out when the amount is negative, down to exactly zero", () => {
    const result = addDeposit({ balance: 500, deposits: [] }, d("w", "2026-10-03", -500));
    expect(result).toMatchObject({ ok: true, balance: 0 });
  });

  it("refuses to take out more than the balance and changes nothing", () => {
    expect(addDeposit({ balance: 499, deposits: [] }, d("w", "2026-10-03", -500))).toEqual({
      ok: false,
      reason: "insufficient-balance",
    });
  });

  it("refuses a zero or fractional amount, and a bad date", () => {
    expect(addDeposit({ balance: 0, deposits: [] }, d("a", "2026-10-03", 0))).toEqual({
      ok: false,
      reason: "invalid",
    });
    expect(addDeposit({ balance: 0, deposits: [] }, d("a", "2026-10-03", 0.5))).toEqual({
      ok: false,
      reason: "invalid",
    });
    expect(addDeposit({ balance: 0, deposits: [] }, d("a", "03.10.2026", 5))).toEqual({
      ok: false,
      reason: "invalid",
    });
  });

  it("handles one minor unit and very large amounts", () => {
    expect(addDeposit({ balance: 0, deposits: [] }, d("a", "2026-10-03", 1))).toMatchObject({
      balance: 1,
    });
    const big = Number.MAX_SAFE_INTEGER - 10;
    expect(addDeposit({ balance: 5, deposits: [] }, d("a", "2026-10-03", big))).toMatchObject({
      balance: big + 5,
    });
  });

  it("keeps a balance that was entered before deposits existed", () => {
    const result = addDeposit({ balance: 7_000, deposits: undefined }, d("a", "2026-10-03", 100));
    expect(result).toMatchObject({ ok: true, balance: 7_100 });
  });
});

describe("removeDeposit", () => {
  it("undoes a deposit: the balance goes back and the record disappears", () => {
    const start = { balance: 1_500, deposits: [d("a", "2026-10-03", 500)] };
    expect(removeDeposit(start, "a")).toEqual({ ok: true, balance: 1_000, deposits: [] });
  });

  it("undoes a withdrawal by putting the money back", () => {
    const start = { balance: 0, deposits: [d("w", "2026-10-03", -500)] };
    expect(removeDeposit(start, "w")).toEqual({ ok: true, balance: 500, deposits: [] });
  });

  it("refuses when removing would make the balance negative", () => {
    const start = { balance: 100, deposits: [d("a", "2026-10-03", 500)] };
    expect(removeDeposit(start, "a")).toEqual({ ok: false, reason: "insufficient-balance" });
  });

  it("leaves an unknown id alone", () => {
    const start = { balance: 100, deposits: [d("a", "2026-10-03", 100)] };
    expect(removeDeposit(start, "zzz")).toEqual({ ok: false, reason: "not-found" });
  });
});

describe("editDeposit", () => {
  it("changes the amount and fixes the balance by the difference", () => {
    const start = { balance: 1_500, deposits: [d("a", "2026-10-03", 500)] };
    expect(editDeposit(start, d("a", "2026-10-04", 300))).toEqual({
      ok: true,
      balance: 1_300,
      deposits: [d("a", "2026-10-04", 300)],
    });
  });

  it("refuses an edit that would make the balance negative", () => {
    const start = { balance: 100, deposits: [d("a", "2026-10-03", 500)] };
    expect(editDeposit(start, d("a", "2026-10-03", 50))).toEqual({
      ok: false,
      reason: "insufficient-balance",
    });
  });

  it("refuses an unknown id", () => {
    expect(editDeposit({ balance: 0, deposits: [] }, d("a", "2026-10-03", 5))).toEqual({
      ok: false,
      reason: "not-found",
    });
  });
});

describe("depositedInMonth", () => {
  it("adds deposits and subtracts withdrawals made in that month only", () => {
    const deposits = [
      d("a", "2026-10-01", 500),
      d("b", "2026-10-31", 250),
      d("c", "2026-10-15", -100),
      d("d", "2026-09-30", 9_999),
      d("e", "2026-11-01", 9_999),
    ];
    expect(depositedInMonth(deposits, "2026-10")).toBe(650);
  });

  it("counts several deposits on the same day and nothing for no deposits", () => {
    expect(depositedInMonth([d("a", "2026-10-03", 5), d("b", "2026-10-03", 5)], "2026-10")).toBe(
      10,
    );
    expect(depositedInMonth([], "2026-10")).toBe(0);
    expect(depositedInMonth(undefined, "2026-10")).toBe(0);
  });
});
