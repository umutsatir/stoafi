import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/test-utils";
import { useAppStore } from "@/store";
import { AnimatedNumber } from "./animated-number";
import { ConfirmDialog, Dialog, DialogContent, DialogTrigger } from "./dialog";
import { EmptyState } from "./empty-state";
import { InfoPopover } from "./info-popover";
import { Money } from "./money";
import { MonthTrack } from "./month-track";
import { ProgressBar } from "./progress-bar";
import { ProgressRing } from "./progress-ring";
import { SegmentedControl } from "./segmented-control";
import { Sheet, SheetContent, SheetTrigger } from "./sheet";
import { Skeleton } from "./skeleton";
import { StatCard } from "./stat-card";
import { StatusChip } from "./status-chip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";
import { notifyUndo, Toaster } from "./toaster";

describe("Money", () => {
  it("draws minor units in the app currency, including zero and one minor unit", () => {
    useAppStore.setState({ currency: "TRY" });
    renderWithIntl(
      <>
        <Money value={0} testId="zero" />
        <Money value={1} testId="one" />
        <Money value={123_456_78} testId="big" />
      </>,
    );
    expect(screen.getByTestId("zero")).toHaveTextContent("₺0.00");
    expect(screen.getByTestId("one")).toHaveTextContent("₺0.01");
    expect(screen.getByTestId("big")).toHaveTextContent("₺123,456.78");
  });
});

describe("AnimatedNumber", () => {
  it("ends on exactly the new value after counting", async () => {
    const { rerender } = renderWithIntl(<AnimatedNumber value={0} testId="n" duration={0.05} />);
    rerender(<AnimatedNumber value={1000} testId="n" duration={0.05} />);
    await waitFor(() => expect(screen.getByTestId("n")).toHaveTextContent("1000"));
  });

  it("shows the start value on first render without counting", () => {
    renderWithIntl(<AnimatedNumber value={42} testId="n" />);
    expect(screen.getByTestId("n")).toHaveTextContent("42");
  });
});

describe("ProgressBar and ProgressRing", () => {
  it("expose their progress to assistive tech and clamp out-of-range values", () => {
    renderWithIntl(
      <>
        <ProgressBar value={30} max={120} label="Needs" />
        <ProgressRing value={500} max={100} label="Fund" />
      </>,
    );
    const bar = screen.getByRole("progressbar", { name: "Needs" });
    expect(bar).toHaveAttribute("aria-valuenow", "30");
    expect(bar).toHaveAttribute("aria-valuemax", "120");
    expect(screen.getByRole("progressbar", { name: "Fund" })).toHaveAttribute(
      "aria-valuenow",
      "100",
    );
  });

  it("treats a zero maximum as empty instead of dividing by zero", () => {
    renderWithIntl(<ProgressBar value={5} max={0} label="Empty" />);
    expect(screen.getByRole("progressbar", { name: "Empty" }).firstElementChild).toHaveStyle({
      width: "0%",
    });
  });
});

describe("StatCard, StatusChip, EmptyState, Skeleton", () => {
  it("shows label, value, hint and a status that is text, not only colour", () => {
    renderWithIntl(
      <StatCard
        label="Runway"
        value="3.5 months"
        hint="How long your savings last."
        status={{ label: "Low", tone: "warning" }}
        testId="v"
      />,
    );
    expect(screen.getByText("Runway")).toBeInTheDocument();
    expect(screen.getByTestId("v")).toHaveTextContent("3.5 months");
    expect(screen.getByText("How long your savings last.")).toBeInTheDocument();
    expect(screen.getByText("Low")).toBeInTheDocument();
  });

  it("renders a chip and an empty state with its next step", () => {
    renderWithIntl(
      <>
        <StatusChip tone="success">On track</StatusChip>
        <EmptyState
          title="No cards yet"
          description="Add one."
          action={<button>Add card</button>}
        />
        <Skeleton className="h-4" />
      </>,
    );
    expect(screen.getByText("On track")).toBeInTheDocument();
    expect(screen.getByText("No cards yet")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add card" })).toBeInTheDocument();
  });
});

describe("SegmentedControl and Tabs", () => {
  it("changes the value and reports it", () => {
    const onChange = vi.fn();
    renderWithIntl(
      <SegmentedControl
        label="View"
        value="list"
        onChange={onChange}
        options={[
          { value: "list", label: "List" },
          { value: "time", label: "Time" },
        ]}
      />,
    );
    expect(screen.getByRole("radio", { name: "List" })).toBeChecked();
    fireEvent.click(screen.getByRole("radio", { name: "Time" }));
    expect(onChange).toHaveBeenCalledWith("time");
  });

  it("switches tab content", async () => {
    renderWithIntl(
      <Tabs defaultValue="pots">
        <TabsList>
          <TabsTrigger value="pots">Pots</TabsTrigger>
          <TabsTrigger value="invest">Investments</TabsTrigger>
        </TabsList>
        <TabsContent value="pots">pots body</TabsContent>
        <TabsContent value="invest">invest body</TabsContent>
      </Tabs>,
    );
    expect(screen.getByText("pots body")).toBeInTheDocument();
    await act(async () => {
      fireEvent.mouseDown(screen.getByRole("tab", { name: "Investments" }));
    });
    expect(screen.getByText("invest body")).toBeInTheDocument();
  });
});

describe("Dialog, ConfirmDialog and Sheet", () => {
  it("opens a dialog with a title and closes with the localized close button", async () => {
    renderWithIntl(
      <Dialog>
        <DialogTrigger>Open</DialogTrigger>
        <DialogContent title="Details" description="More info" />
      </Dialog>,
    );
    fireEvent.click(screen.getByText("Open"));
    expect(await screen.findByRole("dialog", { name: "Details" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("confirms only on the confirm button and cancels without calling it", async () => {
    const onConfirm = vi.fn();
    function Harness() {
      const [open, setOpen] = useState(true);
      return (
        <ConfirmDialog
          open={open}
          onOpenChange={setOpen}
          title="Delete card?"
          confirmLabel="Delete"
          destructive
          onConfirm={onConfirm}
        />
      );
    }
    renderWithIntl(<Harness />);
    fireEvent.click(await screen.findByRole("button", { name: "Cancel" }));
    expect(onConfirm).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("calls onConfirm and closes when confirmed", async () => {
    const onConfirm = vi.fn();
    function Harness() {
      const [open, setOpen] = useState(true);
      return (
        <ConfirmDialog
          open={open}
          onOpenChange={setOpen}
          title="Delete card?"
          confirmLabel="Delete"
          onConfirm={onConfirm}
        />
      );
    }
    renderWithIntl(<Harness />);
    fireEvent.click(await screen.findByRole("button", { name: "Delete" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("opens a sheet with its title", async () => {
    renderWithIntl(
      <Sheet>
        <SheetTrigger>Preview</SheetTrigger>
        <SheetContent title="Laptop" />
      </Sheet>,
    );
    fireEvent.click(screen.getByText("Preview"));
    expect(await screen.findByRole("dialog", { name: "Laptop" })).toBeInTheDocument();
  });
});

describe("InfoPopover", () => {
  it("opens an explanation from an accessible button", async () => {
    renderWithIntl(<InfoPopover label="What is runway?">Months your savings last.</InfoPopover>);
    fireEvent.click(screen.getByRole("button", { name: "What is runway?" }));
    expect(await screen.findByText("Months your savings last.")).toBeInTheDocument();
  });
});

describe("MonthTrack", () => {
  it("lists months with spoken descriptions", () => {
    renderWithIntl(
      <MonthTrack
        items={[
          { month: "2026-10", label: "Oct", state: "current", description: "October: this month" },
          {
            month: "2026-11",
            label: "Nov",
            state: "free",
            description: "November: room for 4,000",
          },
        ]}
      />,
    );
    expect(screen.getByLabelText("November: room for 4,000")).toHaveTextContent("Nov");
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
  });
});

describe("toast with undo", () => {
  it("shows the message and runs the undo action", async () => {
    const onUndo = vi.fn();
    renderWithIntl(<Toaster />);
    act(() => notifyUndo("Card deleted", "Undo", onUndo));
    fireEvent.click(await screen.findByRole("button", { name: "Undo" }));
    expect(onUndo).toHaveBeenCalledTimes(1);
  });
});
