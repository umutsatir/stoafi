import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Nav } from "./nav";

describe("Nav", () => {
  it("renders a link for every route", () => {
    render(<Nav />);

    for (const label of ["Profile", "Plan", "Queue", "Cards", "Health", "Decisions", "Settings"]) {
      expect(screen.getByRole("link", { name: label })).toBeInTheDocument();
    }
  });
});
