import {
  addMonths,
  type Card,
  type Decision,
  type Holding,
  type Month,
  type PlanStateInput,
  type Profile,
  type QueueItem,
  type SinkingFund,
} from "@stoafi/core";

/** The names shown in the sample data, in the user's language. */
export interface DemoLabels {
  salary: string;
  rent: string;
  car: string;
  streaming: string;
  headphones: string;
  washer: string;
  laptop: string;
  phone: string;
  insurance: string;
  holiday: string;
  gold: string;
  fund: string;
  card: string;
  spouse: string;
  jacket: string;
  watch: string;
}

export interface DemoData {
  profile: Profile;
  planState: PlanStateInput;
  queueItems: QueueItem[];
  sinkingFunds: SinkingFund[];
  cards: Card[];
  decisions: Decision[];
  holdings: Holding[];
}

/** A believable month of sample data, dated from `today` so it always looks current. */
export function buildDemoData(today: string, labels: DemoLabels): DemoData {
  const month = today.slice(0, 7) as Month;
  const day = (offset: number): string => {
    const [y, m, d] = today.split("-").map(Number) as [number, number, number];
    const date = new Date(Date.UTC(y, m - 1, d + offset));
    return date.toISOString().slice(0, 10);
  };
  const stamp = (offset: number): string => `${day(offset)}T10:00:00.000Z`;

  const queueBase = {
    urgency: 2,
    importance: 2,
    expectedUses: 500,
    addedDate: day(-60),
    priceUpdatedDate: day(-60),
  };
  return {
    profile: {
      incomes: [{ label: labels.salary, monthly: 5_500_000, payDay: 15 }],
      fixedExpenses: [
        { label: labels.rent, monthly: 1_600_000, bucket: "needs", dueDay: 1 },
        {
          label: labels.car,
          monthly: 380_000,
          bucket: "needs",
          dueDay: 5,
          endMonth: addMonths(month, 14),
        },
        {
          label: labels.streaming,
          monthly: 25_000,
          bucket: "wants",
          isSubscription: true,
          dueDay: 8,
        },
      ],
      livingExpenses: 1_100_000,
      savings: 7_500_000,
      emergencyFundTargetMonths: 6,
      annualInflationExpectation: 0.35,
      countryCode: "TR",
    },
    planState: { strategyId: "fifty-thirty-twenty", params: {} },
    queueItems: [
      {
        ...queueBase,
        id: "demo-headphones",
        name: labels.headphones,
        price: 300_000,
        importance: 3,
        urgency: 1,
        isNeed: false,
        order: 0,
      },
      {
        ...queueBase,
        id: "demo-washer",
        name: labels.washer,
        price: 2_200_000,
        urgency: 3,
        importance: 3,
        isNeed: true,
        order: 1,
      },
      {
        ...queueBase,
        id: "demo-laptop",
        name: labels.laptop,
        price: 4_200_000,
        isNeed: false,
        order: 2,
      },
      {
        ...queueBase,
        id: "demo-phone",
        name: labels.phone,
        price: 2_800_000,
        isNeed: false,
        order: 3,
        installmentPurchase: {
          offer: { months: 6, payments: Array.from({ length: 6 }, () => 480_000) },
          firstMonth: month,
          cardId: "demo-card",
        },
      },
    ],
    sinkingFunds: [
      {
        id: "demo-insurance",
        label: labels.insurance,
        target: 600_000,
        dueMonth: addMonths(month, 6),
        currentBalance: 200_000,
      },
      {
        id: "demo-holiday",
        label: labels.holiday,
        target: 1_500_000,
        dueMonth: addMonths(month, 9),
        currentBalance: 300_000,
      },
    ],
    cards: [
      {
        id: "demo-card",
        label: labels.card,
        statementDay: 15,
        dueDay: 5,
        kind: "main",
        bankId: "garanti-bbva",
        limit: 5_000_000,
        currentDebt: 900_000,
        last4: "4821",
        network: "mastercard",
      },
      {
        id: "demo-spouse",
        label: labels.spouse,
        statementDay: 20,
        dueDay: 10,
        kind: "supplementary",
        parentId: "demo-card",
        bankId: "garanti-bbva",
      },
    ],
    decisions: [
      {
        id: "demo-d1",
        queueItemRef: "gone-1",
        itemName: labels.jacket,
        outcome: "skipped",
        timestamp: stamp(-10),
        amount: 400_000,
      },
      {
        id: "demo-d2",
        queueItemRef: "gone-2",
        itemName: labels.watch,
        outcome: "postponed",
        timestamp: stamp(-20),
        amount: 900_000,
      },
    ],
    holdings: [
      {
        id: "demo-gold",
        label: labels.gold,
        typeId: "gold",
        unitLabel: "g",
        currentPrice: 280_000,
        priceDate: day(-3),
        trades: [{ id: "demo-t1", date: day(-200), side: "buy", quantity: 8, unitPrice: 210_000 }],
      },
      {
        id: "demo-fund",
        label: labels.fund,
        typeId: "index-fund",
        currentPrice: 4_300,
        priceDate: day(-3),
        trades: [{ id: "demo-t2", date: day(-120), side: "buy", quantity: 500, unitPrice: 4_000 }],
      },
    ],
  };
}
