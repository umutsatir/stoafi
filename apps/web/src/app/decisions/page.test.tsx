import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { useAppStore } from "@/store";
import { renderWithIntl } from "@/test-utils";
import DecisionsPage from "./page";

describe("Decisions screen", () => {
  beforeEach(() => useAppStore.setState({ decisions: [] }));

  it("explains what the page is for and links to the queue when there are no decisions", () => {
    renderWithIntl(<DecisionsPage />);
    expect(screen.getByText("No decisions yet")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Go to the queue" })).toHaveAttribute("href", "/queue");
  });

  it("shows the log, with the item name, once there is a decision", () => {
    useAppStore.setState({
      decisions: [
        {
          id: "d1",
          queueItemRef: "x",
          itemName: "Headphones",
          outcome: "skipped",
          timestamp: "t",
          amount: 5000,
        },
      ],
    });
    renderWithIntl(<DecisionsPage />);
    expect(screen.queryByText("No decisions yet")).not.toBeInTheDocument();
    expect(screen.getByText("Headphones")).toBeInTheDocument();
  });
});
