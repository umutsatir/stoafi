import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithIntl } from "@/test-utils";
import { LessonLink } from "./lesson-link";

describe("LessonLink", () => {
  it("links to the lesson's place on the lessons screen, titled in the active language", () => {
    renderWithIntl(<LessonLink lessonId="eisenhower-matrix" testId="lesson-link-x" />);
    const link = screen.getByTestId("lesson-link-x");
    expect(link).toHaveAttribute("href", "/lessons#eisenhower-matrix");
    expect(link).toHaveAttribute("aria-label", "eisenhower-matrix lesson");
    expect(link).toHaveTextContent("The Eisenhower matrix");
  });

  it("uses the Turkish title when the language is Turkish", () => {
    renderWithIntl(<LessonLink lessonId="eisenhower-matrix" testId="lesson-link-x" />, "tr");
    expect(screen.getByTestId("lesson-link-x")).not.toHaveTextContent("The Eisenhower matrix");
  });

  it("renders nothing for an unknown lesson", () => {
    const { container } = renderWithIntl(<LessonLink lessonId="nope" testId="lesson-link-x" />);
    expect(container).toBeEmptyDOMElement();
  });
});
