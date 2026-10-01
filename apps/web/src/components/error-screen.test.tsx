import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/test-utils";
import { ErrorScreen } from "./error-screen";

const saved: { text: string; name: string }[] = [];
beforeEach(() => {
  saved.length = 0;
  URL.createObjectURL = vi.fn((blob: Blob) => {
    void blob.text().then((text) => saved.push({ text, name: "" }));
    return "blob:test";
  });
  URL.revokeObjectURL = vi.fn();
  HTMLAnchorElement.prototype.click = vi.fn(function (this: HTMLAnchorElement) {
    const last = saved[saved.length - 1];
    if (last) last.name = this.download;
  });
});

describe("ErrorScreen", () => {
  it("tells the user what happened and that the data is safe, and lets them retry", () => {
    const reset = vi.fn();
    renderWithIntl(<ErrorScreen error={new Error("boom")} reset={reset} />);
    expect(screen.getByRole("alert")).toHaveTextContent("Your data is still on this device");
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(reset).toHaveBeenCalledTimes(1);
  });

  it("saves an error report with technical details and no finances", async () => {
    renderWithIntl(<ErrorScreen error={new TypeError("x is not a function")} reset={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Save an error report" }));
    await waitFor(() => expect(saved).toHaveLength(1));
    const report = JSON.parse(saved[0]?.text ?? "{}");
    expect(report).toMatchObject({
      app: "stoafi",
      error: { name: "TypeError", message: "x is not a function" },
    });
    expect(Object.keys(report).sort()).toEqual([
      "app",
      "error",
      "path",
      "time",
      "userAgent",
      "version",
    ]);
  });

  it("lets the user save a backup of their data from the error screen", async () => {
    renderWithIntl(<ErrorScreen error={new Error("boom")} reset={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Save a backup of my data" }));
    await waitFor(() => expect(saved).toHaveLength(1));
    expect(JSON.parse(saved[0]?.text ?? "{}")).toMatchObject({ version: 1 });
  });

  it("promises nothing is sent anywhere", () => {
    renderWithIntl(<ErrorScreen error={new Error("boom")} reset={vi.fn()} />);
    expect(screen.getByText(/Nothing is sent anywhere/)).toBeInTheDocument();
  });
});
