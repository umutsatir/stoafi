import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { createLock, verifyPin } from "@/lib/pin";
import { HIDDEN_AMOUNT, useMoney } from "@/lib/use-money";
import { useAppStore } from "@/store";
import { renderWithIntl } from "@/test-utils";
import { PrivacySettings } from "./privacy-settings";

beforeEach(() =>
  useAppStore.setState({ hideAmounts: false, lock: null, locked: false, currency: "TRY" }),
);

function Amount() {
  const money = useMoney();
  return <p data-testid="amount">{money(123_456)}</p>;
}

describe("hiding amounts", () => {
  it("turns every amount into a mask and back", () => {
    renderWithIntl(
      <>
        <PrivacySettings />
        <Amount />
      </>,
    );
    expect(screen.getByTestId("amount")).toHaveTextContent("₺1,234.56");
    fireEvent.click(screen.getByRole("switch"));
    expect(useAppStore.getState().hideAmounts).toBe(true);
    expect(screen.getByTestId("amount")).toHaveTextContent(HIDDEN_AMOUNT);
    expect(screen.getByTestId("amount")).not.toHaveTextContent("1,234");
    fireEvent.click(screen.getByRole("switch"));
    expect(screen.getByTestId("amount")).toHaveTextContent("₺1,234.56");
  });
});

describe("PIN settings", () => {
  async function setPin(pin: string, confirm = pin) {
    fireEvent.click(screen.getByRole("button", { name: "Set a PIN" }));
    fireEvent.change(screen.getByLabelText("New PIN"), { target: { value: pin } });
    fireEvent.change(screen.getByLabelText("Type it again"), { target: { value: confirm } });
    fireEvent.click(screen.getByRole("button", { name: "Save PIN" }));
  }

  it("says plainly that the PIN hides the app and does not encrypt the data", () => {
    renderWithIntl(<PrivacySettings />);
    expect(screen.getByText(/does not encrypt your data/)).toBeInTheDocument();
  });

  it("sets a PIN, storing only a hash", async () => {
    renderWithIntl(<PrivacySettings />);
    await setPin("4821");
    await waitFor(() => expect(useAppStore.getState().lock).not.toBeNull());
    const lock = useAppStore.getState().lock;
    expect(JSON.stringify(lock)).not.toContain("4821");
    expect(await verifyPin("4821", lock as NonNullable<typeof lock>)).toBe(true);
  });

  it("refuses a PIN that is too short, and two that do not match", async () => {
    renderWithIntl(<PrivacySettings />);
    await setPin("12");
    expect(await screen.findByText("Use 4 to 8 digits.")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("New PIN"), { target: { value: "4821" } });
    fireEvent.change(screen.getByLabelText("Type it again"), { target: { value: "4822" } });
    fireEvent.click(screen.getByRole("button", { name: "Save PIN" }));
    expect(await screen.findByText("The two PINs are different.")).toBeInTheDocument();
    expect(useAppStore.getState().lock).toBeNull();
  });

  it("needs the current PIN to remove it, and a wrong one changes nothing", async () => {
    useAppStore.setState({ lock: await createLock("4821") });
    renderWithIntl(<PrivacySettings />);
    fireEvent.click(screen.getByRole("button", { name: "Remove the PIN" }));
    fireEvent.change(screen.getByLabelText("Current PIN"), { target: { value: "0000" } });
    fireEvent.click(screen.getByRole("button", { name: "Remove the PIN" }));
    expect(await screen.findByText("That is not your current PIN.")).toBeInTheDocument();
    expect(useAppStore.getState().lock).not.toBeNull();

    fireEvent.change(screen.getByLabelText("Current PIN"), { target: { value: "4821" } });
    fireEvent.click(screen.getByRole("button", { name: "Remove the PIN" }));
    await waitFor(() => expect(useAppStore.getState().lock).toBeNull());
  });

  it("needs the current PIN to change it", async () => {
    useAppStore.setState({ lock: await createLock("4821") });
    renderWithIntl(<PrivacySettings />);
    fireEvent.click(screen.getByRole("button", { name: "Change the PIN" }));
    fireEvent.change(screen.getByLabelText("Current PIN"), { target: { value: "1111" } });
    fireEvent.change(screen.getByLabelText("New PIN"), { target: { value: "9999" } });
    fireEvent.change(screen.getByLabelText("Type it again"), { target: { value: "9999" } });
    fireEvent.click(screen.getByRole("button", { name: "Save PIN" }));
    expect(await screen.findByText("That is not your current PIN.")).toBeInTheDocument();
  });
});
