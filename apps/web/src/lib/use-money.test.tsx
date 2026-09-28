import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithIntl } from "@/test-utils";
import { useMoney } from "./use-money";

function Amount({ minor }: { minor: number }) {
  const money = useMoney();
  return <p data-testid="amount">{money(minor)}</p>;
}

describe("useMoney", () => {
  it("formats minor units as currency in English", () => {
    renderWithIntl(<Amount minor={500_000} />, "en");
    expect(screen.getByTestId("amount")).toHaveTextContent("₺5,000.00");
  });

  it("formats minor units as currency in Turkish", () => {
    renderWithIntl(<Amount minor={500_000} />, "tr");
    expect(screen.getByTestId("amount")).toHaveTextContent("₺5.000,00");
  });

  it("shows one kuruş and zero exactly", () => {
    renderWithIntl(<Amount minor={1} />, "en");
    expect(screen.getByTestId("amount")).toHaveTextContent("₺0.01");
  });
});
