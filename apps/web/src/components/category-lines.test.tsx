import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { CategoryAmount } from "@stoafi/core";
import { renderWithIntl } from "@/test-utils";
import { CategoryLines } from "./category-lines";

const rows: CategoryAmount[] = [
  {
    bucket: "needs",
    category: "bills",
    amount: 1_600_000,
    items: [{ key: "fixed-0", label: "Rent", amount: 1_600_000 }],
  },
  {
    bucket: "needs",
    category: "installments",
    amount: 240_000,
    items: [
      { key: "fixed-2", label: "Phone", amount: 150_000 },
      { key: "fridge", label: null, amount: 90_000 },
    ],
  },
  {
    bucket: "wants",
    category: "bills",
    amount: 25_000,
    items: [{ key: "fixed-1", label: "Streaming", amount: 25_000 }],
  },
];

describe("CategoryLines", () => {
  it("shows one short line of categories for a bucket", () => {
    renderWithIntl(<CategoryLines rows={rows} bucket="needs" />);
    expect(screen.getByTestId("categories-needs")).toHaveTextContent(
      "Bills ₺16,000.00 · Installments ₺2,400.00",
    );
  });

  it("lists every line item when detailed, naming purchases it only has an id for", () => {
    renderWithIntl(
      <CategoryLines rows={rows} bucket="needs" detailed names={{ fridge: "Fridge" }} />,
    );
    const installments = within(screen.getByTestId("category-needs-installments"));
    expect(installments.getByText("Phone")).toBeInTheDocument();
    expect(installments.getByText("Fridge")).toBeInTheDocument();
  });

  it("shows nothing for a bucket with nothing committed", () => {
    renderWithIntl(<CategoryLines rows={rows} bucket="savings" />);
    expect(screen.queryByTestId("categories-savings")).not.toBeInTheDocument();
  });
});
