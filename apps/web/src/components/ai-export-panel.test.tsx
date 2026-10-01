import { fireEvent, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { AiExportData } from "@stoafi/core";
import { renderWithIntl } from "@/test-utils";
import { AiExportPanel } from "./ai-export-panel";

const data: AiExportData = {
  incomes: [{ label: "Acme salary", monthly: 6_000_000 }],
  expenses: [{ label: "Rent", monthly: 1_800_000, bucket: "needs" }],
  living: 1_200_000,
  emergency: { balance: 9_000_000, targetMonths: 6, monthsSaved: 2.6 },
  left: 1_755_000,
  queue: [
    { name: "Headphones", price: 300_000, month: "2026-11" },
    { name: "Laptop", price: 4_500_000, month: null },
  ],
  installments: [],
  pots: [],
  holdings: [],
  cards: [],
  decisions: [],
  health: { savingsRate: 0.1, installmentRatio: 0.1, runwayMonths: 3 },
};

function setup(over: Partial<Parameters<typeof AiExportPanel>[0]> = {}) {
  const copyText = vi.fn().mockResolvedValue(undefined);
  const openUrl = vi.fn();
  const downloadText = vi.fn();
  renderWithIntl(
    <AiExportPanel
      data={data}
      currency="TRY"
      itemNames={["Headphones", "Laptop"]}
      copyText={copyText}
      openUrl={openUrl}
      downloadText={downloadText}
      {...over}
    />,
  );
  return { copyText, openUrl, downloadText };
}

const preview = () => screen.getByLabelText("Exactly what will be copied") as HTMLTextAreaElement;

describe("AiExportPanel", () => {
  it("starts at the safest level: no amounts and no names in the preview", () => {
    setup();
    expect(screen.getByRole("radio", { name: "Only ratios" })).toBeChecked();
    expect(preview().value).not.toContain("Acme");
    expect(preview().value).not.toContain("60,000");
    expect(preview().value).toMatch(/\d+%/);
  });

  it("shows more only when the user chooses to, and says what each level shares", () => {
    setup();
    fireEvent.click(screen.getByText("Full detail", { selector: "label" }));
    expect(preview().value).toContain("Acme salary");
    expect(preview().value).toContain("60,000");
    expect(screen.getByTestId("level-hint")).toHaveTextContent("Real amounts and real names");
    fireEvent.click(screen.getByText("Rounded", { selector: "label" }));
    expect(preview().value).not.toContain("Acme");
    expect(preview().value).toContain("60,000");
  });

  it("changes the question at the end of the prompt, including a chosen item and a free question", () => {
    setup();
    fireEvent.click(screen.getByRole("radio", { name: "What should I cut?" }));
    expect(preview().value.trim().endsWith("What should I cut this month?")).toBe(true);
    fireEvent.click(screen.getByRole("radio", { name: "Should I buy something?" }));
    fireEvent.change(screen.getByLabelText("Which item?"), { target: { value: "Laptop" } });
    expect(preview().value.trim().endsWith("Should I buy Laptop?")).toBe(true);
    fireEvent.click(screen.getByRole("radio", { name: "My own question" }));
    fireEvent.change(screen.getByLabelText("Your question"), {
      target: { value: "Is gold wise?" },
    });
    expect(preview().value.trim().endsWith("Is gold wise?")).toBe(true);
  });

  it("copies exactly what the preview shows, including the user's own edits", async () => {
    const { copyText } = setup();
    fireEvent.change(preview(), { target: { value: "My edited prompt" } });
    fireEvent.click(screen.getByRole("button", { name: "Copy prompt" }));
    await waitFor(() => expect(copyText).toHaveBeenCalledWith("My edited prompt"));
  });

  it("opens Claude or ChatGPT after copying, and puts no data in the address", async () => {
    const { copyText, openUrl } = setup();
    fireEvent.click(screen.getByRole("button", { name: "Ask Claude" }));
    await waitFor(() => expect(openUrl).toHaveBeenCalledWith("https://claude.ai/new"));
    expect(copyText).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: "Ask ChatGPT" }));
    await waitFor(() => expect(openUrl).toHaveBeenCalledWith("https://chatgpt.com/"));
    for (const [url] of openUrl.mock.calls) {
      expect(String(url)).not.toMatch(/\?|#|Acme|%/);
    }
  });

  it("does not open the site when copying failed", async () => {
    const { openUrl } = setup({ copyText: vi.fn().mockRejectedValue(new Error("denied")) });
    fireEvent.click(screen.getByRole("button", { name: "Ask Claude" }));
    await waitFor(() =>
      expect(screen.queryByRole("button", { name: "Ask Claude" })).toBeInTheDocument(),
    );
    expect(openUrl).not.toHaveBeenCalled();
  });

  it("downloads the prompt as a file", () => {
    const { downloadText } = setup();
    fireEvent.click(screen.getByRole("button", { name: "Download as a file" }));
    expect(downloadText).toHaveBeenCalledWith(
      expect.stringContaining("MY STOAFI DATA"),
      "stoafi-prompt.md",
    );
  });

  it("warns that the text goes to a third party", () => {
    setup();
    expect(screen.getByRole("note")).toHaveTextContent(/privacy policy/i);
  });

  it("forgets edits when the level changes, so the preview never shows a stale level", () => {
    setup();
    fireEvent.change(preview(), { target: { value: "edited" } });
    fireEvent.click(screen.getByText("Full detail", { selector: "label" }));
    expect(preview().value).toContain("Acme salary");
  });

  it("writes the prompt in Turkish for a Turkish user", () => {
    renderWithIntl(
      <AiExportPanel
        data={data}
        currency="TRY"
        itemNames={[]}
        copyText={vi.fn()}
        openUrl={vi.fn()}
        downloadText={vi.fn()}
      />,
      "tr",
    );
    expect(
      (screen.getByLabelText("Kopyalanacak metin, tam olarak") as HTMLTextAreaElement).value,
    ).toContain("Rolün");
  });
});
