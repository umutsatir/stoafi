import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "@/storage/instance";
import { useAppStore } from "@/store";
import { renderWithIntl } from "@/test-utils";
import { Onboarding } from "./onboarding";

beforeEach(async () => {
  await db.profile.clear();
  await db.plan.clear();
  useAppStore.setState({ profile: null, currency: "TRY", hydrated: true });
});

function start() {
  const onDemo = vi.fn();
  renderWithIntl(<Onboarding onDemo={onDemo} />);
  return { onDemo };
}

describe("Onboarding", () => {
  it("welcomes a new user with two ways in, and says nothing leaves the device", () => {
    const { onDemo } = start();
    expect(screen.getByText("Turn your salary into a plan")).toBeInTheDocument();
    expect(screen.getByText(/stays on this device/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Look around with sample data" }));
    expect(onDemo).toHaveBeenCalledTimes(1);
  });

  it("will not go past the income step without a salary, and says why", () => {
    start();
    fireEvent.click(screen.getByRole("button", { name: /Get started/ }));
    expect(screen.getByTestId("onboarding-step")).toHaveTextContent("Step 1 of 4");
    fireEvent.click(screen.getByRole("button", { name: /Next/ }));
    expect(screen.getByText("Enter your monthly pay to continue.")).toBeInTheDocument();
    expect(screen.getByTestId("onboarding-step")).toHaveTextContent("Step 1 of 4");
  });

  it("goes back to the welcome from the first step, and back one step at a time", () => {
    start();
    fireEvent.click(screen.getByRole("button", { name: /Get started/ }));
    fireEvent.click(screen.getByRole("button", { name: /Back/ }));
    expect(screen.getByTestId("onboarding-welcome")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Get started/ }));
    fireEvent.change(screen.getByLabelText("Monthly amount"), { target: { value: "60000" } });
    fireEvent.click(screen.getByRole("button", { name: /Next/ }));
    expect(screen.getByTestId("onboarding-step")).toHaveTextContent("Step 2 of 4");
    fireEvent.click(screen.getByRole("button", { name: /Back/ }));
    expect(screen.getByTestId("onboarding-step")).toHaveTextContent("Step 1 of 4");
  });

  it("walks through all four steps and saves a profile and a plan", async () => {
    start();
    fireEvent.click(screen.getByRole("button", { name: /Get started/ }));
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Acme" } });
    fireEvent.change(screen.getByLabelText("Monthly amount"), { target: { value: "60000" } });
    fireEvent.change(screen.getByLabelText("Paid on day"), { target: { value: "15" } });
    fireEvent.click(screen.getByRole("button", { name: /Next/ }));

    fireEvent.click(screen.getByRole("button", { name: "+ Rent" }));
    fireEvent.click(screen.getByRole("button", { name: "+ Subscription" }));
    const [rent, subscription] = screen.getAllByLabelText(
      /Rent|Subscription/,
    ) as HTMLInputElement[];
    fireEvent.change(rent as HTMLInputElement, { target: { value: "18000" } });
    fireEvent.change(subscription as HTMLInputElement, { target: { value: "250" } });
    fireEvent.change(screen.getByLabelText("Living costs"), { target: { value: "12000" } });
    fireEvent.click(screen.getByRole("button", { name: /Next/ }));

    fireEvent.change(screen.getByLabelText("Current savings"), { target: { value: "90000" } });
    fireEvent.change(screen.getByLabelText("Country"), { target: { value: "TR" } });
    fireEvent.click(screen.getByRole("button", { name: /Next/ }));

    // 60,000 - 18,000 - 250 - 12,000
    expect(screen.getByTestId("onboarding-left")).toHaveTextContent("₺29,750.00");
    fireEvent.click(screen.getByRole("radio", { name: /Pay yourself first|Clason/ }));
    fireEvent.click(screen.getByRole("button", { name: "Finish" }));

    await waitFor(() => expect(useAppStore.getState().profile).not.toBeNull());
    const profile = useAppStore.getState().profile;
    expect(profile).toMatchObject({
      incomes: [{ label: "Acme", monthly: 6_000_000, payDay: 15 }],
      livingExpenses: 1_200_000,
      savings: 9_000_000,
      countryCode: "TR",
    });
    expect(profile?.fixedExpenses).toEqual([
      { label: "Rent", monthly: 1_800_000, bucket: "needs" },
      { label: "Subscription", monthly: 25_000, bucket: "wants", isSubscription: true },
    ]);
    expect(useAppStore.getState().planState?.strategyId).toBe("pay-yourself-first");
    await waitFor(async () => expect(await db.profile.count()).toBe(1));
    expect(await db.plan.count()).toBe(1);
  });

  it("lets the user skip optional steps and still finish, with the default plan", async () => {
    start();
    fireEvent.click(screen.getByRole("button", { name: /Get started/ }));
    fireEvent.change(screen.getByLabelText("Monthly amount"), { target: { value: "10000" } });
    fireEvent.click(screen.getByRole("button", { name: /Next/ }));
    fireEvent.click(screen.getByRole("button", { name: "Skip" }));
    fireEvent.click(screen.getByRole("button", { name: "Skip" }));
    fireEvent.click(screen.getByRole("button", { name: "Finish" }));
    await waitFor(() => expect(useAppStore.getState().profile).not.toBeNull());
    expect(useAppStore.getState().planState?.strategyId).toBe("fifty-thirty-twenty");
    expect(useAppStore.getState().profile?.fixedExpenses).toEqual([]);
  });

  it("warns, but does not block, when regular costs are above income", () => {
    start();
    fireEvent.click(screen.getByRole("button", { name: /Get started/ }));
    fireEvent.change(screen.getByLabelText("Monthly amount"), { target: { value: "1000" } });
    fireEvent.click(screen.getByRole("button", { name: /Next/ }));
    fireEvent.change(screen.getByLabelText("Living costs"), { target: { value: "5000" } });
    fireEvent.click(screen.getByRole("button", { name: /Next/ }));
    fireEvent.click(screen.getByRole("button", { name: /Next/ }));
    expect(screen.getByTestId("onboarding-left")).toHaveTextContent(/above your income/);
    expect(screen.getByRole("button", { name: "Finish" })).toBeEnabled();
  });
});
