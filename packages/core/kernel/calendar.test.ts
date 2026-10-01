import { describe, expect, it } from "vitest";
import { dueDateInMonth, eventsInMonth, upcomingEvents, type DayRule } from "./calendar";

const rule = (over: Partial<DayRule> & { id: string }): DayRule => ({
  label: over.id,
  kind: "expense",
  day: 5,
  ...over,
});

describe("dueDateInMonth", () => {
  it("puts the day in the month, and clamps a day the month does not have", () => {
    expect(dueDateInMonth("2026-10", 5)).toBe("2026-10-05");
    expect(dueDateInMonth("2026-02", 30)).toBe("2026-02-28");
    expect(dueDateInMonth("2028-02", 31)).toBe("2028-02-29");
    expect(dueDateInMonth("2026-04", 31)).toBe("2026-04-30");
  });
});

describe("upcomingEvents", () => {
  const today = "2026-10-20";

  it("lists the events in the next days, today included, in date order", () => {
    const events = upcomingEvents(
      [
        rule({ id: "rent", day: 25 }),
        rule({ id: "today", day: 20 }),
        rule({ id: "later", day: 29 }),
      ],
      today,
      7,
    );
    expect(events.map((e) => [e.id, e.date])).toEqual([
      ["today", "2026-10-20"],
      ["rent", "2026-10-25"],
    ]);
  });

  it("includes the last day of the window and leaves out the day after", () => {
    const events = upcomingEvents(
      [rule({ id: "a", day: 27 }), rule({ id: "b", day: 28 })],
      today,
      7,
    );
    expect(events.map((e) => e.id)).toEqual(["a"]);
  });

  it("carries on into the next month, clamping short months", () => {
    const events = upcomingEvents(
      [rule({ id: "early", day: 3 }), rule({ id: "end", day: 31 })],
      "2027-01-28",
      14,
    );
    expect(events.map((e) => [e.id, e.date])).toEqual([
      ["end", "2027-01-31"],
      ["early", "2027-02-03"],
    ]);
    const feb = upcomingEvents([rule({ id: "thirty", day: 30 })], "2027-02-20", 14);
    expect(feb.map((e) => e.date)).toEqual(["2027-02-28"]);
  });

  it("crosses the year", () => {
    const events = upcomingEvents([rule({ id: "a", day: 2 })], "2026-12-30", 7);
    expect(events.map((e) => e.date)).toEqual(["2027-01-02"]);
  });

  it("stops a rule after its end month, but still lists it in that month", () => {
    const rules = [rule({ id: "loan", day: 5, endMonth: "2026-10" })];
    expect(upcomingEvents(rules, "2026-10-01", 10).map((e) => e.date)).toEqual(["2026-10-05"]);
    expect(upcomingEvents(rules, "2026-10-28", 14)).toEqual([]);
  });

  it("keeps the amount, kind and label of each event", () => {
    const [event] = upcomingEvents(
      [rule({ id: "pay", kind: "income", day: 21, amount: 6_000_000, label: "Main job" })],
      today,
      3,
    );
    expect(event).toEqual({
      id: "pay",
      label: "Main job",
      kind: "income",
      date: "2026-10-21",
      amount: 6_000_000,
      daysAway: 1,
    });
  });

  it("lists two rules on the same day by label, and an empty window gives nothing", () => {
    const same = upcomingEvents(
      [rule({ id: "b", label: "B bill", day: 22 }), rule({ id: "a", label: "A bill", day: 22 })],
      today,
      3,
    );
    expect(same.map((e) => e.label)).toEqual(["A bill", "B bill"]);
    expect(upcomingEvents([], today, 14)).toEqual([]);
    expect(upcomingEvents([rule({ id: "a", day: 22 })], today, 0).map((e) => e.date)).toEqual([]);
  });
});

describe("eventsInMonth", () => {
  it("lists every rule that applies in the month, by date", () => {
    const events = eventsInMonth(
      [
        rule({ id: "rent", day: 28 }),
        rule({ id: "pay", kind: "income", day: 15, amount: 100 }),
        rule({ id: "end", day: 31 }),
      ],
      "2027-02",
    );
    expect(events.map((e) => [e.id, e.date])).toEqual([
      ["pay", "2027-02-15"],
      ["end", "2027-02-28"],
      ["rent", "2027-02-28"],
    ]);
  });

  it("leaves out a rule after its end month and keeps it in the end month", () => {
    const rules = [rule({ id: "loan", day: 5, endMonth: "2026-10" })];
    expect(eventsInMonth(rules, "2026-10")).toHaveLength(1);
    expect(eventsInMonth(rules, "2026-11")).toEqual([]);
  });

  it("is empty for no rules", () => {
    expect(eventsInMonth([], "2026-10")).toEqual([]);
  });
});
