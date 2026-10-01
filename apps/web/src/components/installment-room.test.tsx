import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithIntl } from "@/test-utils";
import { InstallmentRoom } from "./installment-room";

describe("InstallmentRoom", () => {
  it("says how much more installment can be taken on under the cap", () => {
    // 35,000 income at a 20% cap is 7,000; 3,000 is used.
    renderWithIntl(<InstallmentRoom income={3_500_000} capPct={0.2} used={300_000} />);
    expect(screen.getByTestId("installment-room-left")).toHaveTextContent(
      "You can take on ₺4,000.00 more a month.",
    );
    expect(screen.getByTestId("installment-room")).toHaveTextContent("20% of income: ₺7,000.00");
    expect(screen.getByTestId("installment-room-state")).toHaveTextContent("Room left");
  });

  it("warns when almost full, and says by how much the cap is passed", () => {
    const { unmount } = renderWithIntl(
      <InstallmentRoom income={3_500_000} capPct={0.2} used={650_000} />,
    );
    expect(screen.getByTestId("installment-room-state")).toHaveTextContent("Almost full");
    unmount();
    renderWithIntl(<InstallmentRoom income={3_500_000} capPct={0.2} used={800_000} />);
    expect(screen.getByTestId("installment-room-left")).toHaveTextContent(
      "₺1,000.00 over your cap",
    );
    expect(screen.getByTestId("installment-room-state")).toHaveTextContent("Over the cap");
  });

  it("is exactly at the cap without being over it", () => {
    renderWithIntl(<InstallmentRoom income={3_500_000} capPct={0.2} used={700_000} />);
    expect(screen.getByTestId("installment-room-state")).toHaveTextContent("Almost full");
    expect(screen.getByTestId("installment-room-left")).toHaveTextContent("₺0.00 more");
  });

  it("speaks Turkish", () => {
    renderWithIntl(<InstallmentRoom income={3_500_000} capPct={0.2} used={300_000} />, "tr");
    expect(screen.getByTestId("installment-room-left")).toHaveTextContent(
      "daha taksit alabilirsin",
    );
  });
});
