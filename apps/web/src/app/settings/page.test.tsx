import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/storage/instance";
import { useAppStore } from "@/store";
import { renderWithIntl } from "@/test-utils";
import SettingsPage from "./page";

beforeEach(async () => {
  await db.guards.clear();
  useAppStore.setState({ guardThresholds: { installmentCapPct: 0.2 }, hydrated: true });
});

describe("Settings screen installment cap", () => {
  it("saves a new cap so the queue and a reload use it", async () => {
    renderWithIntl(<SettingsPage />);
    fireEvent.change(screen.getByLabelText("Installment cap (% of net income)"), {
      target: { value: "10" },
    });
    expect(useAppStore.getState().guardThresholds.installmentCapPct).toBeCloseTo(0.1, 10);
    await waitFor(async () => {
      const row = await db.guards.get("singleton");
      expect((row?.data as { installmentCapPct: number }).installmentCapPct).toBeCloseTo(0.1, 10);
    });
  });
});
