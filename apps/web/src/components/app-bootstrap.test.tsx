import { act, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "@/storage/instance";
import { useAppStore } from "@/store";
import { renderWithIntl } from "@/test-utils";
import { AppBootstrap } from "./app-bootstrap";

describe("AppBootstrap", () => {
  it("renders nothing until saved data is loaded, then puts it in the store with today's date", async () => {
    await db.profile.put({
      id: "singleton",
      data: {
        incomes: [{ label: "Job", monthly: 100_000 }],
        fixedExpenses: [],
        livingExpenses: 0,
        savings: 0,
        emergencyFundTargetMonths: 6,
        annualInflationExpectation: 0.3,
      },
    });

    renderWithIntl(
      <AppBootstrap>
        <p>app ready</p>
      </AppBootstrap>,
    );
    expect(screen.queryByText("app ready")).not.toBeInTheDocument();

    await waitFor(() => expect(screen.getByText("app ready")).toBeInTheDocument());
    const state = useAppStore.getState();
    expect(state.profile?.incomes[0]?.monthly).toBe(100_000);
    expect(state.planState?.strategyId).toBe("fifty-thirty-twenty");
    expect(state.today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(state.today).not.toBe("1970-01-01");
  });

  describe("settings", () => {
    beforeEach(async () => {
      await db.settings.clear();
      useAppStore.setState({ hydrated: false, locale: "en", currency: "TRY" });
    });

    it("applies saved language and currency and sets the page language", async () => {
      await db.settings.put({ id: "singleton", data: { locale: "tr", currency: "EUR" } });
      renderWithIntl(
        <AppBootstrap>
          <p>app ready</p>
        </AppBootstrap>,
      );
      await waitFor(() => expect(screen.getByText("app ready")).toBeInTheDocument());
      expect(useAppStore.getState().locale).toBe("tr");
      expect(useAppStore.getState().currency).toBe("EUR");
      await waitFor(() => expect(document.documentElement.lang).toBe("tr"));
    });

    it("saves a language or currency change so a reload keeps it", async () => {
      renderWithIntl(
        <AppBootstrap>
          <p>app ready</p>
        </AppBootstrap>,
      );
      await waitFor(() => expect(screen.getByText("app ready")).toBeInTheDocument());

      act(() => {
        useAppStore.getState().setLocale("tr");
        useAppStore.getState().setCurrency("USD");
      });

      await waitFor(async () => {
        const row = await db.settings.get("singleton");
        expect(row?.data).toEqual({ locale: "tr", currency: "USD" });
      });
      expect(document.documentElement.lang).toBe("tr");
    });
  });

  describe("today", () => {
    beforeEach(async () => {
      await db.settings.clear();
      useAppStore.setState({ hydrated: false });
      vi.useFakeTimers({ toFake: ["Date"] });
      vi.setSystemTime(new Date(2026, 9, 1, 9, 0, 0));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    async function renderReady() {
      renderWithIntl(
        <AppBootstrap>
          <p>app ready</p>
        </AppBootstrap>,
      );
      await waitFor(() => expect(screen.getByText("app ready")).toBeInTheDocument());
    }

    it("moves to the new day when the app is brought back after midnight", async () => {
      await renderReady();
      expect(useAppStore.getState().today).toBe("2026-10-01");

      vi.setSystemTime(new Date(2026, 9, 2, 8, 0, 0));
      act(() => {
        document.dispatchEvent(new Event("visibilitychange"));
      });
      expect(useAppStore.getState().today).toBe("2026-10-02");
    });

    it("also catches up when the window regains focus", async () => {
      await renderReady();
      vi.setSystemTime(new Date(2026, 10, 3, 8, 0, 0));
      act(() => {
        window.dispatchEvent(new Event("focus"));
      });
      expect(useAppStore.getState().today).toBe("2026-11-03");
    });

    it("leaves the state untouched when the day has not changed", async () => {
      await renderReady();
      const before = useAppStore.getState();
      vi.setSystemTime(new Date(2026, 9, 1, 23, 59, 0));
      act(() => {
        document.dispatchEvent(new Event("visibilitychange"));
      });
      expect(useAppStore.getState()).toBe(before);
    });
  });
});
