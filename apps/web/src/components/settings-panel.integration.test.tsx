import { fireEvent, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { StoafiDb, SINGLETON_ID } from "@/storage/db";
import { exportToJson, importFromJson } from "@/storage/backup";
import { renderWithIntl } from "@/test-utils";
import { SettingsPanel } from "./settings-panel";

const validProfile = {
  incomes: [{ label: "Salary", monthly: 10000, variable: false }],
  fixedExpenses: [],
  avgVariableExpenses: [],
  savings: 0,
  emergencyFundTargetMonths: 6,
  annualInflationExpectation: 0.3,
};

describe("SettingsPanel wired to the real db (export -> clear -> import)", () => {
  it("restores everything through the UI action handlers", async () => {
    const db = new StoafiDb(`settings-integration-${Math.random()}`);
    await db.open();
    await db.profile.put({ id: SINGLETON_ID, data: validProfile });

    let capturedJson = "";

    renderWithIntl(
      <SettingsPanel
        currency="TRY"
        onCurrencyChange={vi.fn()}
        onExport={() => exportToJson(db, "2026-01-01T00:00:00.000Z")}
        onImport={(json) => importFromJson(db, json)}
        downloadJson={(json) => {
          capturedJson = json;
        }}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Export backup" }));
    await waitFor(() => expect(capturedJson).not.toBe(""));

    await db.profile.clear();
    expect(await db.profile.get(SINGLETON_ID)).toBeUndefined();

    const file = new File([capturedJson], "backup.json", { type: "application/json" });
    const input = screen.getByLabelText("Import backup") as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(async () => {
      expect(await db.profile.get(SINGLETON_ID)).toBeDefined();
    });

    const row = await db.profile.get(SINGLETON_ID);
    expect(row?.data).toEqual(validProfile);

    db.close();
  });
});
