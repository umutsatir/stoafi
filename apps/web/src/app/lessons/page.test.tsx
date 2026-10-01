import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LESSON_IDS, getLessonCard } from "@/lessons";
import { useAppStore } from "@/store";
import { renderWithIntl } from "@/test-utils";
import LessonsPage from "./page";

describe("Lessons screen", () => {
  beforeEach(() => {
    window.location.hash = "";
    Element.prototype.scrollIntoView = vi.fn();
    useAppStore.setState({ readLessons: [] });
  });

  it("lists every lesson card once with its title, source and a short preview", () => {
    renderWithIntl(<LessonsPage />);
    for (const id of LESSON_IDS) {
      const card = getLessonCard(id, "en");
      const item = document.getElementById(id);
      expect(item, `card ${id} has an element with its id`).not.toBeNull();
      const scope = within(item as HTMLElement);
      expect(scope.getByText(card?.title ?? "")).toBeInTheDocument();
      expect(scope.getByText(`${card?.source.author}, ${card?.source.work}`)).toBeInTheDocument();
    }
    expect(screen.getAllByRole("listitem").length).toBeGreaterThanOrEqual(LESSON_IDS.length);
  });

  it("opens a card to show all its sections, and closes it again", () => {
    renderWithIntl(<LessonsPage />);
    const card = getLessonCard("baby-steps", "en");
    const item = within(screen.getByTestId("lesson-baby-steps"));
    fireEvent.click(item.getByRole("button", { name: new RegExp(card?.title ?? "") }));
    expect(item.getByText(card?.fitsWhen ?? "")).toBeInTheDocument();
    expect(item.getByText(card?.critique ?? "")).toBeInTheDocument();
    fireEvent.click(item.getByRole("button", { name: new RegExp(card?.title ?? "") }));
    expect(item.queryByText(card?.fitsWhen ?? "")).not.toBeInTheDocument();
  });

  it("renders the Turkish cards in Turkish", () => {
    renderWithIntl(<LessonsPage />, "tr");
    const tr = getLessonCard("fifty-thirty-twenty", "tr");
    const en = getLessonCard("fifty-thirty-twenty", "en");
    expect(tr?.title).not.toBe(en?.title);
    expect(screen.getByText(tr?.title ?? "")).toBeInTheDocument();
  });

  it("opens and scrolls to the card named in the URL hash", async () => {
    window.location.hash = "#baby-steps";
    renderWithIntl(<LessonsPage />);
    await waitFor(() => expect(Element.prototype.scrollIntoView).toHaveBeenCalled());
    const card = getLessonCard("baby-steps", "en");
    expect(
      within(screen.getByTestId("lesson-baby-steps")).getByText(card?.critique ?? ""),
    ).toBeInTheDocument();
  });

  it("does not scroll when there is no hash", () => {
    renderWithIntl(<LessonsPage />);
    expect(Element.prototype.scrollIntoView).not.toHaveBeenCalled();
  });

  it("filters by shelf and by search text", () => {
    renderWithIntl(<LessonsPage />);
    fireEvent.click(screen.getByText("Investing", { selector: "label" }));
    expect(screen.getByTestId("lesson-index-funds")).toBeInTheDocument();
    expect(screen.queryByTestId("lesson-baby-steps")).not.toBeInTheDocument();
    fireEvent.click(screen.getByText("All", { selector: "label" }));
    fireEvent.change(screen.getByLabelText("Search lessons"), { target: { value: "bogle" } });
    expect(screen.getByTestId("lesson-index-funds")).toBeInTheDocument();
    expect(screen.queryByTestId("lesson-baby-steps")).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Search lessons"), { target: { value: "zzzzzz" } });
    expect(screen.getByText("No lesson matches your search.")).toBeInTheDocument();
  });

  it("tracks which lessons were read, and lets the user undo it", () => {
    renderWithIntl(<LessonsPage />);
    expect(screen.getByTestId("read-progress")).toHaveTextContent(
      `0 of ${LESSON_IDS.length} lessons read`,
    );
    const card = getLessonCard("baby-steps", "en");
    const item = within(screen.getByTestId("lesson-baby-steps"));
    fireEvent.click(item.getByRole("button", { name: new RegExp(card?.title ?? "") }));
    fireEvent.click(item.getByRole("button", { name: "Mark as read" }));
    expect(useAppStore.getState().readLessons).toEqual(["baby-steps"]);
    expect(screen.getByTestId("read-progress")).toHaveTextContent(`1 of ${LESSON_IDS.length}`);
    expect(item.getAllByText("Read").length).toBeGreaterThan(0);
    fireEvent.click(item.getByRole("button", { name: "Mark as unread" }));
    expect(useAppStore.getState().readLessons).toEqual([]);
  });
});
