import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { exportToJson } from "@/storage/backup";
import { db } from "@/storage/instance";
import { clearCopies, saveDailyCopy } from "@/storage/internal-backup";
import { renderWithIntl } from "@/test-utils";
import { DataLostScreen } from "./data-lost-screen";

const profile = {
  incomes: [{ label: "Job", monthly: 100_000 }],
  fixedExpenses: [],
  livingExpenses: 0,
  savings: 7,
  emergencyFundTargetMonths: 6,
  annualInflationExpectation: 0.3,
};

async function validBackup(): Promise<string> {
  await db.profile.put({ id: "singleton", data: profile });
  const json = await exportToJson(db, "2026-10-05T08:00:00.000Z");
  await db.profile.clear();
  return json;
}

beforeEach(async () => {
  await db.profile.clear();
  await clearCopies(db);
});

describe("DataLostScreen", () => {
  it("says what happened and offers ways back", () => {
    renderWithIntl(<DataLostScreen onRestored={vi.fn()} onStartFresh={vi.fn()} />);
    expect(screen.getByRole("heading", { name: "Your data seems to be gone" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Restore from a backup file" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Start again with nothing" })).toBeInTheDocument();
    expect(screen.queryByTestId("internal-copies")).not.toBeInTheDocument();
  });

  it("restores from a backup file", async () => {
    const json = await validBackup();
    const onRestored = vi.fn();
    renderWithIntl(<DataLostScreen onRestored={onRestored} onStartFresh={vi.fn()} />);
    const file = new File([json], "stoafi-backup.json", { type: "application/json" });
    fireEvent.change(screen.getByLabelText("Backup file"), { target: { files: [file] } });
    await waitFor(() => expect(onRestored).toHaveBeenCalledTimes(1));
    expect(await db.profile.get("singleton")).toBeDefined();
  });

  it("refuses a file that is not a backup, and changes nothing", async () => {
    const onRestored = vi.fn();
    renderWithIntl(<DataLostScreen onRestored={onRestored} onStartFresh={vi.fn()} />);
    const file = new File([JSON.stringify({ nope: true })], "x.json", { type: "application/json" });
    fireEvent.change(screen.getByLabelText("Backup file"), { target: { files: [file] } });
    await waitFor(() => expect(db.profile.count()).resolves.toBe(0));
    expect(onRestored).not.toHaveBeenCalled();
  });

  it("restores a copy kept inside the browser", async () => {
    const json = await validBackup();
    await saveDailyCopy(db, "2026-10-04", json, "2026-10-04T08:00:00.000Z");
    const onRestored = vi.fn();
    renderWithIntl(<DataLostScreen onRestored={onRestored} onStartFresh={vi.fn()} />);
    fireEvent.click(await screen.findByRole("button", { name: "Copy from 2026-10-04" }));
    await waitFor(() => expect(onRestored).toHaveBeenCalledTimes(1));
    expect(await db.profile.get("singleton")).toBeDefined();
  });

  it("lets the user start again with nothing", () => {
    const onStartFresh = vi.fn();
    renderWithIntl(<DataLostScreen onRestored={vi.fn()} onStartFresh={onStartFresh} />);
    fireEvent.click(screen.getByRole("button", { name: "Start again with nothing" }));
    expect(onStartFresh).toHaveBeenCalledTimes(1);
  });

  it("speaks Turkish", () => {
    renderWithIntl(<DataLostScreen onRestored={vi.fn()} onStartFresh={vi.fn()} />, "tr");
    expect(
      screen.getByRole("heading", { name: "Verilerin silinmiş görünüyor" }),
    ).toBeInTheDocument();
  });
});
