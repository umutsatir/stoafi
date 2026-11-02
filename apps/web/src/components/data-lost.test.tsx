import { fireEvent, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/test-utils";
import { DataLost } from "./data-lost";

describe("DataLost", () => {
  it("explains what happened and offers a restore and a fresh start", () => {
    renderWithIntl(<DataLost onRestore={async () => null} onStartFresh={() => {}} />);
    expect(screen.getByRole("heading", { name: "Your data looks gone" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Restore from a backup file" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Start from scratch" })).toBeInTheDocument();
  });

  it("starts fresh when asked", () => {
    const onStartFresh = vi.fn();
    renderWithIntl(<DataLost onRestore={async () => null} onStartFresh={onStartFresh} />);
    fireEvent.click(screen.getByRole("button", { name: "Start from scratch" }));
    expect(onStartFresh).toHaveBeenCalledTimes(1);
  });

  it("reads the chosen file and shows what was wrong with it", async () => {
    const onRestore = vi.fn(async () => ["Not a backup"]);
    renderWithIntl(<DataLost onRestore={onRestore} onStartFresh={() => {}} />);
    const file = new File(['{"bad":true}'], "backup.json", { type: "application/json" });
    fireEvent.change(screen.getByLabelText("Restore from a backup file"), {
      target: { files: [file] },
    });
    await waitFor(() => expect(onRestore).toHaveBeenCalledWith('{"bad":true}'));
    expect(await screen.findByRole("alert")).toHaveTextContent("Not a backup");
  });
});
