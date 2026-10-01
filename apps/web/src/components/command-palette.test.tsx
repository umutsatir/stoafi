import { act, fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAppStore } from "@/store";
import { renderWithIntl } from "@/test-utils";
import { CommandPalette } from "./command-palette";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }), usePathname: () => "/" }));

beforeEach(() => {
  push.mockClear();
  useAppStore.setState({ quickAction: null });
});

function open(onOpenChange = vi.fn()) {
  renderWithIntl(<CommandPalette open onOpenChange={onOpenChange} />);
  return {
    onOpenChange,
    input: screen.getByRole("combobox", { name: "Search pages and actions" }),
  };
}

describe("CommandPalette", () => {
  it("lists pages and actions, with the first one ready", () => {
    open();
    expect(screen.getAllByRole("option").length).toBeGreaterThanOrEqual(16);
    expect(screen.getAllByRole("option")[0]).toHaveAttribute("aria-selected", "true");
  });

  it("narrows the list as you type, ignoring case", () => {
    const { input } = open();
    fireEvent.change(input, { target: { value: "QUEUE" } });
    const names = screen.getAllByRole("option").map((o) => o.textContent);
    expect(names.some((n) => n?.includes("Queue"))).toBe(true);
    expect(names.every((n) => /queue/i.test(n ?? ""))).toBe(true);
  });

  it("says when nothing matches", () => {
    const { input } = open();
    fireEvent.change(input, { target: { value: "zzzzz" } });
    expect(screen.getByText("Nothing matches.")).toBeInTheDocument();
    expect(screen.queryByRole("option")).not.toBeInTheDocument();
  });

  it("goes to the page with Enter, and closes", () => {
    const { input, onOpenChange } = open();
    fireEvent.change(input, { target: { value: "health" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(push).toHaveBeenCalledWith("/health");
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(useAppStore.getState().quickAction).toBeNull();
  });

  it("moves the choice with the arrow keys and never past the ends", () => {
    const { input } = open();
    fireEvent.change(input, { target: { value: "s" } });
    fireEvent.keyDown(input, { key: "ArrowUp" });
    expect(screen.getAllByRole("option")[0]).toHaveAttribute("aria-selected", "true");
    fireEvent.keyDown(input, { key: "ArrowDown" });
    expect(screen.getAllByRole("option")[1]).toHaveAttribute("aria-selected", "true");
    for (let i = 0; i < 50; i++) fireEvent.keyDown(input, { key: "ArrowDown" });
    const options = screen.getAllByRole("option");
    expect(options[options.length - 1]).toHaveAttribute("aria-selected", "true");
  });

  it("starts an action: opens the page and asks it to open its add panel", () => {
    const { input } = open();
    fireEvent.change(input, { target: { value: "add a card" } });
    fireEvent.click(screen.getByRole("option", { name: /Add a card/ }));
    expect(push).toHaveBeenCalledWith("/cards");
    expect(useAppStore.getState().quickAction).toBe("addCard");
  });

  it("does nothing on Enter when there is no match", () => {
    const { input } = open();
    fireEvent.change(input, { target: { value: "zzzzz" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(push).not.toHaveBeenCalled();
  });
});

describe("palette shortcut", () => {
  it("opens with Ctrl+K from anywhere in the app", async () => {
    const { Nav } = await import("./nav");
    renderWithIntl(<Nav />);
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    act(() => {
      fireEvent.keyDown(window, { key: "k", ctrlKey: true });
    });
    expect(
      await screen.findByRole("combobox", { name: "Search pages and actions" }),
    ).toBeInTheDocument();
  });
});
