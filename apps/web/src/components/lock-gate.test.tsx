import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createLock } from "@/lib/pin";
import { useAppStore } from "@/store";
import { renderWithIntl } from "@/test-utils";
import { AUTO_LOCK_AFTER_MS, LockGate } from "./lock-gate";

let lock: Awaited<ReturnType<typeof createLock>>;
beforeEach(async () => {
  lock = await createLock("4821");
  useAppStore.setState({ lock, locked: true });
});
afterEach(() => vi.useRealTimers());

function renderGate() {
  renderWithIntl(
    <LockGate>
      <p>the app</p>
    </LockGate>,
  );
}

async function tryPin(pin: string) {
  fireEvent.change(screen.getByLabelText("PIN"), { target: { value: pin } });
  fireEvent.click(screen.getByRole("button", { name: "Unlock" }));
}

describe("LockGate", () => {
  it("covers the app with the PIN screen while locked", () => {
    renderGate();
    expect(screen.getByTestId("lock-screen")).toBeInTheDocument();
    expect(screen.queryByText("the app")).not.toBeInTheDocument();
  });

  it("shows the app straight away when no PIN is set", () => {
    useAppStore.setState({ lock: null, locked: false });
    renderGate();
    expect(screen.getByText("the app")).toBeInTheDocument();
  });

  it("unlocks with the right PIN", async () => {
    renderGate();
    await tryPin("4821");
    expect(await screen.findByText("the app")).toBeInTheDocument();
    expect(useAppStore.getState().locked).toBe(false);
  });

  it("stays locked and says so after a wrong PIN, and clears what was typed", async () => {
    renderGate();
    await tryPin("0000");
    expect(await screen.findByRole("alert")).toHaveTextContent("That PIN is not right.");
    expect(screen.getByLabelText("PIN")).toHaveValue("");
    expect(screen.queryByText("the app")).not.toBeInTheDocument();
  });

  it("only takes digits, and will not try a PIN shorter than four", () => {
    renderGate();
    fireEvent.change(screen.getByLabelText("PIN"), { target: { value: "12ab" } });
    expect(screen.getByLabelText("PIN")).toHaveValue("12");
    expect(screen.getByRole("button", { name: "Unlock" })).toBeDisabled();
  });

  it("makes the user wait after five wrong tries, even for the right PIN", async () => {
    renderGate();
    for (let i = 0; i < 5; i++) {
      await tryPin("0000");
      await waitFor(() => expect(screen.getByLabelText("PIN")).toHaveValue(""));
    }
    expect(await screen.findByText(/Too many tries/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Unlock" })).toBeDisabled();
  });

  it("locks again after five minutes away, but not after a short break", () => {
    useAppStore.setState({ locked: false });
    renderGate();
    const now = vi.spyOn(Date, "now");
    now.mockReturnValue(1_000_000);
    const visibility = (state: "hidden" | "visible") => {
      Object.defineProperty(document, "visibilityState", { value: state, configurable: true });
      act(() => {
        document.dispatchEvent(new Event("visibilitychange"));
      });
    };
    visibility("hidden");
    now.mockReturnValue(1_000_000 + 60_000);
    visibility("visible");
    expect(useAppStore.getState().locked).toBe(false);

    visibility("hidden");
    now.mockReturnValue(1_000_000 + 60_000 + AUTO_LOCK_AFTER_MS);
    visibility("visible");
    expect(useAppStore.getState().locked).toBe(true);
    now.mockRestore();
  });
});
