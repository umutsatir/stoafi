import { screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LESSON_IDS, getLessonCard } from "@/lessons";
import { renderWithIntl } from "@/test-utils";
import LessonsPage from "./page";

describe("Lessons screen", () => {
  beforeEach(() => {
    window.location.hash = "";
    Element.prototype.scrollIntoView = vi.fn();
  });

  it("shows every lesson card once, each with its source and all its sections", () => {
    renderWithIntl(<LessonsPage />);
    for (const id of LESSON_IDS) {
      const card = getLessonCard(id, "en");
      expect(card).toBeDefined();
      const article = document.getElementById(id);
      expect(article, `card ${id} has an element with its id`).not.toBeNull();
      const scope = within(article as HTMLElement);
      expect(scope.getByRole("heading", { name: card?.title })).toBeInTheDocument();
      expect(scope.getByText(`${card?.source.author}, ${card?.source.work}`)).toBeInTheDocument();
      expect(scope.getByText(card?.principle ?? "")).toBeInTheDocument();
      expect(scope.getByText(card?.fitsWhen ?? "")).toBeInTheDocument();
      expect(scope.getByText(card?.critique ?? "")).toBeInTheDocument();
      if (card?.formula) expect(scope.getByText(card.formula)).toBeInTheDocument();
    }
    expect(document.querySelectorAll("article")).toHaveLength(LESSON_IDS.length);
  });

  it("renders the Turkish cards in Turkish", () => {
    renderWithIntl(<LessonsPage />, "tr");
    const tr = getLessonCard("fifty-thirty-twenty", "tr");
    const en = getLessonCard("fifty-thirty-twenty", "en");
    expect(tr?.title).not.toBe(en?.title);
    expect(screen.getByRole("heading", { name: tr?.title })).toBeInTheDocument();
  });

  it("scrolls to the card named in the URL hash", () => {
    window.location.hash = "#baby-steps";
    renderWithIntl(<LessonsPage />);
    expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
  });

  it("does not scroll when there is no hash", () => {
    renderWithIntl(<LessonsPage />);
    expect(Element.prototype.scrollIntoView).not.toHaveBeenCalled();
  });
});
