import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { exportToJson } from "@/storage/backup";
import { db } from "@/storage/instance";
import { clearCopies, saveBeforeImport, saveDailyCopy } from "@/storage/internal-backup";
import { useAppStore } from "@/store";
import { renderWithIntl } from "@/test-utils";

const mocks = vi.hoisted(() => ({
  enable: vi.fn(async () => "on" as const),
  allow: vi.fn(async () => "on" as const),
  disable: vi.fn(async () => undefined),
  backupNow: vi.fn(async () => "written" as const),
}));
vi.mock("@/lib/auto-backup-run", () => ({
  enableAutoBackup: mocks.enable,
  allowAutoBackup: mocks.allow,
  disableAutoBackup: mocks.disable,
}));
vi.mock("@/lib/use-data-safety", () => ({ backupToFileNow: mocks.backupNow }));

import { DataSafetySettings } from "./data-safety-settings";

function storage(persisted: boolean, grants = true) {
  Object.defineProperty(navigator, "storage", {
    configurable: true,
    value: { persisted: async () => persisted, persist: async () => grants },
  });
}

beforeEach(async () => {
  vi.clearAllMocks();
  await clearCopies(db);
  await db.profile.clear();
  useAppStore.setState({ autoBackup: { status: "off", lastWritten: null } });
  storage(false);
});

describe("DataSafetySettings: the browser's promise", () => {
  it("says the data is protected when the browser promised", async () => {
    storage(true);
    renderWithIntl(<DataSafetySettings onRestored={vi.fn()} />);
    expect(await screen.findByTestId("persist-state")).toHaveTextContent("Protected");
    expect(
      screen.queryByRole("button", { name: "Ask the browser to keep my data" }),
    ).not.toBeInTheDocument();
  });

  it("warns when it is not, and asks the browser on request", async () => {
    renderWithIntl(<DataSafetySettings onRestored={vi.fn()} />);
    expect(await screen.findByTestId("persist-state")).toHaveTextContent("Not protected");
    fireEvent.click(screen.getByRole("button", { name: "Ask the browser to keep my data" }));
    await waitFor(() => expect(screen.getByTestId("persist-state")).toHaveTextContent("Protected"));
  });
});

describe("DataSafetySettings: the backup file", () => {
  it("explains what to do in a browser that cannot write files", () => {
    useAppStore.setState({ autoBackup: { status: "unsupported", lastWritten: null } });
    renderWithIntl(<DataSafetySettings onRestored={vi.fn()} />);
    expect(screen.getByTestId("file-unsupported")).toHaveTextContent("Export backup");
  });

  it("turns on after the user picks a file, and writes the first backup at once", async () => {
    renderWithIntl(<DataSafetySettings onRestored={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Choose a backup file" }));
    await waitFor(() => expect(mocks.backupNow).toHaveBeenCalledTimes(1));
    expect(useAppStore.getState().autoBackup.status).toBe("on");
    expect(screen.getByTestId("file-on")).toBeInTheDocument();
  });

  it("asks again for permission with a click, and can be stopped", async () => {
    useAppStore.setState({ autoBackup: { status: "needs-permission", lastWritten: null } });
    renderWithIntl(<DataSafetySettings onRestored={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Allow again" }));
    await waitFor(() => expect(mocks.allow).toHaveBeenCalled());
    await waitFor(() => expect(screen.getByTestId("file-on")).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "Stop automatic backup" }));
    await waitFor(() => expect(mocks.disable).toHaveBeenCalled());
    expect(useAppStore.getState().autoBackup.status).toBe("off");
  });

  it("shows when the file was last written", () => {
    useAppStore.setState({
      autoBackup: { status: "on", lastWritten: "2026-10-05T08:30:00.000Z" },
    });
    renderWithIntl(<DataSafetySettings onRestored={vi.fn()} />);
    expect(screen.getByTestId("file-on")).toHaveTextContent("Last written");
  });
});

describe("DataSafetySettings: copies in the browser", () => {
  it("says so when there are none", async () => {
    renderWithIntl(<DataSafetySettings onRestored={vi.fn()} />);
    expect(await screen.findByText("No copies yet.")).toBeInTheDocument();
  });

  it("restores a copy only after a second click", async () => {
    await db.profile.put({
      id: "singleton",
      data: {
        incomes: [],
        fixedExpenses: [],
        livingExpenses: 0,
        savings: 11,
        emergencyFundTargetMonths: 6,
        annualInflationExpectation: 0.3,
      },
    });
    const json = await exportToJson(db, "2026-10-04T08:00:00.000Z");
    await saveDailyCopy(db, "2026-10-04", json, "2026-10-04T08:00:00.000Z");
    await saveBeforeImport(db, json, "2026-10-04T09:00:00.000Z");
    await db.profile.clear();

    const onRestored = vi.fn();
    renderWithIntl(<DataSafetySettings onRestored={onRestored} />);
    const list = await screen.findByTestId("copies-list");
    expect(within(list).getAllByRole("listitem")[0]).toHaveTextContent("Before the last import");

    fireEvent.click(screen.getByRole("button", { name: "Restore 2026-10-04" }));
    expect(onRestored).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Yes, replace my data" }));
    await waitFor(() => expect(onRestored).toHaveBeenCalledTimes(1));
    expect(((await db.profile.get("singleton"))?.data as { savings: number }).savings).toBe(11);
  });

  it("lets the user change their mind before replacing anything", async () => {
    await saveDailyCopy(db, "2026-10-04", "{}", "2026-10-04T08:00:00.000Z");
    renderWithIntl(<DataSafetySettings onRestored={vi.fn()} />);
    fireEvent.click(await screen.findByRole("button", { name: "Restore 2026-10-04" }));
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.getByRole("button", { name: "Restore 2026-10-04" })).toBeInTheDocument();
  });
});
