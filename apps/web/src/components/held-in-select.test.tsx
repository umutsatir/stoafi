import { fireEvent, renderHook, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { NextIntlClientProvider } from "next-intl";
import tr from "@/i18n/tr.json";
import { renderWithIntl } from "@/test-utils";
import { HeldInSelect, useHeldInName } from "./held-in-select";

describe("HeldInSelect", () => {
  it("offers not set, plain cash, the investment types and something else", () => {
    renderWithIntl(<HeldInSelect value={undefined} onChange={vi.fn()} />);
    const options = screen.getAllByRole("option").map((o) => o.textContent);
    expect(options[0]).toBe("Not set");
    expect(options).toContain("Plain cash (lira in an account)");
    expect(options).toContain("Gold");
    expect(options).toContain("Deposit account");
    expect(options.at(-1)).toBe("Something else…");
  });

  it("reports a preset choice, and clearing it", () => {
    const onChange = vi.fn();
    renderWithIntl(<HeldInSelect value={undefined} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText("Kept in"), { target: { value: "gold" } });
    expect(onChange).toHaveBeenLastCalledWith("gold");
    fireEvent.change(screen.getByLabelText("Kept in"), { target: { value: "" } });
    expect(onChange).toHaveBeenLastCalledWith(undefined);
  });

  it("asks for a name when the user picks something else, and reports it", () => {
    const onChange = vi.fn();
    renderWithIntl(<HeldInSelect value={undefined} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText("Kept in"), { target: { value: "custom" } });
    expect(onChange).toHaveBeenLastCalledWith(undefined); // no name yet
    fireEvent.change(screen.getByLabelText("Name it"), { target: { value: "Gram gold account" } });
    expect(onChange).toHaveBeenLastCalledWith("custom:Gram gold account");
  });

  it("starts from the saved value, including a custom one", () => {
    renderWithIntl(<HeldInSelect value="custom:My vault" onChange={vi.fn()} />);
    expect(screen.getByLabelText("Kept in")).toHaveValue("custom");
    expect(screen.getByLabelText("Name it")).toHaveValue("My vault");
  });
});

describe("useHeldInName", () => {
  it("names presets in the active language, and passes a custom name through", () => {
    const { result } = renderHook(() => useHeldInName(), {
      wrapper: ({ children }) => (
        <NextIntlClientProvider locale="tr" messages={tr} timeZone="UTC">
          {children}
        </NextIntlClientProvider>
      ),
    });
    expect(result.current("gold")).toBe("Altın");
    expect(result.current("cash")).toBe("Düz nakit (hesapta lira)");
    expect(result.current("custom:Kasa")).toBe("Kasa");
    expect(result.current(undefined)).toBe("");
  });
});
