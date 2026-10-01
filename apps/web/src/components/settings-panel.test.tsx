import { fireEvent, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/test-utils";
import { SettingsPanel } from "./settings-panel";

describe("SettingsPanel", () => {
  it("clicking export calls onExport and passes the result to the download function", async () => {
    const onExport = vi.fn().mockResolvedValue('{"version":1}');
    const downloadJson = vi.fn();

    renderWithIntl(
      <SettingsPanel
        currency="TRY"
        onCurrencyChange={vi.fn()}
        onExport={onExport}
        onImport={vi.fn()}
        downloadJson={downloadJson}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Export backup" }));

    await waitFor(() => expect(downloadJson).toHaveBeenCalledWith('{"version":1}'));
  });

  it("selecting a corrupted file surfaces the returned error list instead of failing silently", async () => {
    const onImport = vi.fn().mockResolvedValue({ errors: ["profile[0]: invalid"] });

    renderWithIntl(
      <SettingsPanel
        currency="TRY"
        onCurrencyChange={vi.fn()}
        onExport={vi.fn()}
        onImport={onImport}
      />,
    );

    const file = new File(["{}"], "backup.json", { type: "application/json" });
    const input = screen.getByLabelText("Import backup") as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file] } });
    fireEvent.click(await screen.findByRole("button", { name: "Replace my data" }));

    await waitFor(() => expect(screen.getByTestId("import-errors")).toBeInTheDocument());
    expect(screen.getByText("profile[0]: invalid")).toBeInTheDocument();
  });

  it("does not touch the data until the user confirms, and cancelling leaves it alone", async () => {
    const onImport = vi.fn().mockResolvedValue({});
    renderWithIntl(
      <SettingsPanel
        currency="TRY"
        onCurrencyChange={vi.fn()}
        onExport={vi.fn()}
        onImport={onImport}
      />,
    );
    const file = new File(["{}"], "backup.json", { type: "application/json" });
    fireEvent.change(screen.getByLabelText("Import backup"), { target: { files: [file] } });

    expect(await screen.findByRole("dialog", { name: /replace your data/i })).toBeInTheDocument();
    expect(onImport).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(onImport).not.toHaveBeenCalled();
  });
});
