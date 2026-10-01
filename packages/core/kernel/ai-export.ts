import type { Minor } from "./money";

/**
 * Builds the text a user can paste into an AI chat: instructions plus their own figures. Pure: the app never
 * sends it anywhere, the user copies it and decides. How much is revealed depends on the privacy level.
 *
 * The wording lives here, not in the UI language files, because it is the content of the export, in the
 * language the user asked for, rather than text drawn on a screen.
 */
export type AiPrivacyLevel = "full" | "rounded" | "ratios";
export type AiLanguage = "en" | "tr";

export type AiQuestion =
  | { id: "assessBudget" | "whatToCut" | "installmentOrCash" | "emergencyFaster" }
  | { id: "canIBuy"; item: string }
  | { id: "free"; text: string };

export interface AiExportData {
  incomes: { label: string; monthly: Minor }[];
  expenses: {
    label: string;
    monthly: Minor;
    bucket: "needs" | "wants" | "savings" | "investing";
  }[];
  living: Minor;
  emergency: { balance: Minor; targetMonths: number; monthsSaved: number };
  left: Minor;
  plan?: { name: string; source: string };
  queue: { name: string; price: Minor; month: string | null }[];
  installments: { name: string; payment: Minor; endsMonth: string }[];
  /** A pot without a `dueMonth` is an open one that just keeps growing. */
  pots: { label: string; balance: Minor; target: Minor; dueMonth?: string }[];
  holdings: { label: string; type: string; value: Minor; cost: Minor }[];
  cards: { label: string; limit?: Minor; dueDay: number }[];
  decisions: { name: string; outcome: "bought" | "postponed" | "skipped"; amount: Minor }[];
  health: { savingsRate: number; installmentRatio: number; runwayMonths: number };
}

export interface AiExportInput {
  language: AiLanguage;
  currency: string;
  level: AiPrivacyLevel;
  question: AiQuestion;
  data: AiExportData;
}

interface Words {
  role: string;
  rules: string;
  units: (currency: string) => string;
  levelNote: Record<AiPrivacyLevel, string>;
  headerData: (levelName: string) => string;
  headerQuestion: string;
  levelName: Record<AiPrivacyLevel, string>;
  income: string;
  expenses: string;
  expenseLine: (label: string, amount: string, bucket: string) => string;
  bucket: Record<"needs" | "wants" | "savings" | "investing", string>;
  living: string;
  emergency: (balance: string, target: number, months: string) => string;
  emergencyRatio: (target: number, months: string) => string;
  left: string;
  plan: (name: string, source: string) => string;
  queueHeader: string;
  queueFits: (name: string, price: string, month: string) => string;
  queueNever: (name: string, price: string) => string;
  installmentsHeader: string;
  installmentLine: (name: string, payment: string, ends: string) => string;
  potsHeader: string;
  potLine: (label: string, balance: string, target: string, due: string) => string;
  /** A pot with no deadline; `balance` is hidden at the safest privacy level. */
  potOpenLine: (label: string, balance: string | null) => string;
  holdingsHeader: string;
  holdingLine: (label: string, type: string, value: string, profit: string) => string;
  cardsHeader: string;
  cardLine: (label: string, limit: string | null, due: number) => string;
  decisionsHeader: string;
  decisionLine: (name: string, outcome: string, amount: string) => string;
  outcome: Record<"bought" | "postponed" | "skipped", string>;
  health: (rate: string, ratio: string, runway: string) => string;
  generic: {
    income: string;
    expense: string;
    item: string;
    installment: string;
    pot: string;
    holding: string;
    card: string;
  };
  share: (part: string) => string;
  months: (n: string) => string;
  noIncome: string;
  question: (q: AiQuestion) => string;
  numberLocale: string;
}

const EN: Words = {
  role: "Your role: speak like a calm, Stoic personal finance coach. You are not a licensed investment adviser.",
  rules:
    "Rules: Stoafi, a budgeting app, worked out the numbers below. Do not make up new numbers; if you need to calculate something yourself, say what you assumed. Say so when you are unsure. First ask me two or three clarifying questions, then give at most three suggestions.",
  units: (currency) =>
    `Currency: ${currency}. Amounts are in whole ${currency} (not cents or minor units).`,
  levelNote: {
    full: "",
    rounded: "Amounts are rounded to the nearest hundred and names are generic.",
    ratios: "There are no amounts: figures are shares of my monthly income, or months.",
  },
  headerData: (name) => `--- MY STOAFI DATA (${name}) ---`,
  headerQuestion: "--- MY QUESTION ---",
  levelName: { full: "Full detail", rounded: "Rounded", ratios: "Ratios only" },
  income: "Monthly income",
  expenses: "Recurring expenses",
  expenseLine: (label, amount, bucket) => `${label}: ${amount} (${bucket})`,
  bucket: { needs: "need", wants: "want", savings: "saving", investing: "investing" },
  living: "Living costs",
  emergency: (balance, target, months) =>
    `Emergency fund: ${balance} (target ${target} months, now ${months} months)`,
  emergencyRatio: (target, months) => `Emergency fund: now ${months} (target ${target} months)`,
  left: "Left this month after everything planned",
  plan: (name, source) => `Plan: ${name} (source: ${source})`,
  queueHeader: "Queue of things I might buy",
  queueFits: (name, price, month) => `${name}: ${price}, fits in ${month}`,
  queueNever: (name, price) => `${name}: ${price}, does not fit in the next 12 months`,
  installmentsHeader: "Installments I am paying",
  installmentLine: (name, payment, ends) => `${name}: ${payment} a month until ${ends}`,
  potsHeader: "Savings pots",
  potLine: (label, balance, target, due) => `${label}: ${balance} of ${target}, due ${due}`,
  potOpenLine: (label, balance) =>
    balance === null
      ? `${label}: open savings, no deadline`
      : `${label}: ${balance} saved, no deadline`,
  holdingsHeader: "Investments",
  holdingLine: (label, type, value, profit) => `${label} (${type}): worth ${value}, ${profit}`,
  cardsHeader: "Cards",
  cardLine: (label, limit, due) => `${label}: ${limit ? `limit ${limit}, ` : ""}due day ${due}`,
  decisionsHeader: "Recent shopping decisions",
  decisionLine: (name, outcome, amount) => `${name}: ${outcome}, ${amount}`,
  outcome: { bought: "bought", postponed: "postponed", skipped: "skipped" },
  health: (rate, ratio, runway) =>
    `Health: saving ${rate} of income, installments ${ratio} of income, savings last ${runway} months`,
  generic: {
    income: "Income",
    expense: "Expense",
    item: "Item",
    installment: "Installment",
    pot: "Pot",
    holding: "Holding",
    card: "Card",
  },
  share: (part) => `${part} of income`,
  months: (n) => `${n} months`,
  noIncome: "no income entered",
  question: (q) => {
    switch (q.id) {
      case "assessBudget":
        return "Assess my budget.";
      case "whatToCut":
        return "What should I cut this month?";
      case "canIBuy":
        return `Should I buy ${q.item}?`;
      case "installmentOrCash":
        return "Is it better to pay in installments or cash?";
      case "emergencyFaster":
        return "How can I reach my emergency fund faster?";
      case "free":
        return q.text.trim();
    }
  },
  numberLocale: "en-US",
};

const TR: Words = {
  role: "Rolün: sakin, Stoacı bir kişisel finans danışmanı gibi konuş. Düzenlemeye tabi bir yatırım danışmanı değilsin.",
  rules:
    "Kurallar: Aşağıdaki rakamları Stoafi adlı bütçe uygulaması hesapladı. Yeni rakam uydurma; kendi hesabını yapman gerekirse neyi varsaydığını söyle. Emin olmadığın yerde söyle. Önce bana iki üç netleştirici soru sor, sonra en fazla üç öneri ver.",
  units: (currency) =>
    `Para birimi: ${currency}. Tutarlar bütün ${currency} cinsindendir (kuruş değil).`,
  levelNote: {
    full: "",
    rounded: "Tutarlar en yakın yüze yuvarlandı ve adlar genelleştirildi.",
    ratios: "Tutar yok: rakamlar aylık gelirimin payı ya da aydır.",
  },
  headerData: (name) => `--- STOAFI VERİLERİM (${name}) ---`,
  headerQuestion: "--- SORUM ---",
  levelName: { full: "Tam ayrıntı", rounded: "Yuvarlanmış", ratios: "Yalnızca oranlar" },
  income: "Aylık gelir",
  expenses: "Düzenli giderler",
  expenseLine: (label, amount, bucket) => `${label}: ${amount} (${bucket})`,
  bucket: { needs: "ihtiyaç", wants: "istek", savings: "birikim", investing: "yatırım" },
  living: "Yaşam giderleri",
  emergency: (balance, target, months) =>
    `Acil durum fonu: ${balance} (hedef ${target} ay, şu an ${months} ay)`,
  emergencyRatio: (target, months) => `Acil durum fonu: şu an ${months} (hedef ${target} ay)`,
  left: "Planlanan her şeyden sonra bu ay kalan",
  plan: (name, source) => `Plan: ${name} (kaynak: ${source})`,
  queueHeader: "Almayı düşündüklerimin sırası",
  queueFits: (name, price, month) => `${name}: ${price}, ${month} ayına sığıyor`,
  queueNever: (name, price) => `${name}: ${price}, önümüzdeki 12 aya sığmıyor`,
  installmentsHeader: "Ödediğim taksitler",
  installmentLine: (name, payment, ends) => `${name}: ayda ${payment}, ${ends} tarihine kadar`,
  potsHeader: "Birikim kumbaraları",
  potLine: (label, balance, target, due) => `${label}: ${target} içinden ${balance}, vade ${due}`,
  potOpenLine: (label, balance) =>
    balance === null ? `${label}: süresiz birikim` : `${label}: ${balance} birikti, vadesiz`,
  holdingsHeader: "Yatırımlar",
  holdingLine: (label, type, value, profit) => `${label} (${type}): değeri ${value}, ${profit}`,
  cardsHeader: "Kartlar",
  cardLine: (label, limit, due) =>
    `${label}: ${limit ? `limit ${limit}, ` : ""}son ödeme günü ${due}`,
  decisionsHeader: "Son alışveriş kararlarım",
  decisionLine: (name, outcome, amount) => `${name}: ${outcome}, ${amount}`,
  outcome: { bought: "aldım", postponed: "erteledim", skipped: "vazgeçtim" },
  health: (rate, ratio, runway) =>
    `Sağlık: gelirimin ${rate} kadarını biriktiriyorum, taksitler gelirimin ${ratio} kadarı, birikimim ${runway} ay yeter`,
  generic: {
    income: "Gelir",
    expense: "Gider",
    item: "Ürün",
    installment: "Taksit",
    pot: "Kumbara",
    holding: "Yatırım",
    card: "Kart",
  },
  share: (part) => `gelirin ${part}`,
  months: (n) => `${n} ay`,
  noIncome: "gelir girilmemiş",
  question: (q) => {
    switch (q.id) {
      case "assessBudget":
        return "Bütçemi değerlendir.";
      case "whatToCut":
        return "Bu ay neyi kısmalıyım?";
      case "canIBuy":
        return `${q.item} almalı mıyım?`;
      case "installmentOrCash":
        return "Taksit mi peşin mi daha iyi?";
      case "emergencyFaster":
        return "Acil durum fonuma nasıl daha hızlı ulaşırım?";
      case "free":
        return q.text.trim();
    }
  },
  numberLocale: "tr-TR",
};

export function buildAiExport(input: AiExportInput): string {
  const { level, data } = input;
  const w = input.language === "tr" ? TR : EN;
  const income = data.incomes.reduce((sum, i) => sum + i.monthly, 0);
  const number = new Intl.NumberFormat(w.numberLocale, { maximumFractionDigits: 2 });

  const percent = (part: number, whole: number): string =>
    whole > 0 ? `${Math.round((part / whole) * 100)}%` : "n/a";
  const money = (minor: Minor): string => {
    const major = minor / 100;
    return number.format(level === "rounded" ? Math.round(major / 100) * 100 : major);
  };
  /** An amount as the privacy level allows: exact, rounded, or as a share of income. */
  const amount = (minor: Minor): string =>
    level === "ratios" ? w.share(percent(minor, income)) : money(minor);
  const months = (n: number): string => w.months(number.format(Math.round(n * 10) / 10));
  const name = (label: string, kind: keyof Words["generic"], index: number): string =>
    level === "full" ? label : `${w.generic[kind]} ${index + 1}`;

  const lines: string[] = [w.role, w.rules, w.units(input.currency)];
  if (w.levelNote[level]) lines.push(w.levelNote[level]);
  lines.push("", w.headerData(w.levelName[level]));

  if (data.incomes.length > 0) {
    lines.push(
      `${w.income}: ${data.incomes
        .map((i, n) => `${amount(i.monthly)} (${name(i.label, "income", n)})`)
        .join(", ")}`,
    );
  } else if (level === "ratios") {
    lines.push(`${w.income}: ${w.noIncome}`);
  }
  if (data.expenses.length > 0) {
    lines.push(`${w.expenses}:`);
    data.expenses.forEach((e, n) =>
      lines.push(
        `- ${w.expenseLine(name(e.label, "expense", n), amount(e.monthly), w.bucket[e.bucket])}`,
      ),
    );
  }
  lines.push(`${w.living}: ${amount(data.living)}`);
  lines.push(
    level === "ratios"
      ? w.emergencyRatio(data.emergency.targetMonths, months(data.emergency.monthsSaved))
      : w.emergency(
          money(data.emergency.balance),
          data.emergency.targetMonths,
          months(data.emergency.monthsSaved),
        ),
  );
  lines.push(`${w.left}: ${amount(data.left)}`);
  if (data.plan) lines.push(w.plan(data.plan.name, data.plan.source));

  if (data.queue.length > 0) {
    lines.push(`${w.queueHeader}:`);
    data.queue.forEach((q, n) => {
      const label = name(q.name, "item", n);
      lines.push(
        `- ${q.month ? w.queueFits(label, amount(q.price), q.month) : w.queueNever(label, amount(q.price))}`,
      );
    });
  }
  if (data.installments.length > 0) {
    lines.push(`${w.installmentsHeader}:`);
    data.installments.forEach((i, n) =>
      lines.push(
        `- ${w.installmentLine(name(i.name, "installment", n), amount(i.payment), i.endsMonth)}`,
      ),
    );
  }
  if (data.pots.length > 0) {
    lines.push(`${w.potsHeader}:`);
    data.pots.forEach((p, n) =>
      lines.push(
        `- ${
          p.dueMonth === undefined
            ? w.potOpenLine(name(p.label, "pot", n), level === "ratios" ? null : money(p.balance))
            : level === "ratios"
              ? w.potLine(name(p.label, "pot", n), percent(p.balance, p.target), "100%", p.dueMonth)
              : w.potLine(name(p.label, "pot", n), money(p.balance), money(p.target), p.dueMonth)
        }`,
      ),
    );
  }
  if (data.holdings.length > 0) {
    lines.push(`${w.holdingsHeader}:`);
    data.holdings.forEach((h, n) => {
      const profit = h.cost > 0 ? `${Math.round(((h.value - h.cost) / h.cost) * 100)}%` : "n/a";
      lines.push(
        `- ${w.holdingLine(name(h.label, "holding", n), h.type, level === "ratios" ? w.share(percent(h.value, income)) : money(h.value), profit)}`,
      );
    });
  }
  if (data.cards.length > 0) {
    lines.push(`${w.cardsHeader}:`);
    data.cards.forEach((c, n) =>
      lines.push(
        `- ${w.cardLine(name(c.label, "card", n), c.limit !== undefined ? amount(c.limit) : null, c.dueDay)}`,
      ),
    );
  }
  if (data.decisions.length > 0) {
    lines.push(`${w.decisionsHeader}:`);
    data.decisions.forEach((d, n) =>
      lines.push(
        `- ${w.decisionLine(name(d.name, "item", n), w.outcome[d.outcome], amount(d.amount))}`,
      ),
    );
  }
  lines.push(
    w.health(
      `${Math.round(data.health.savingsRate * 100)}%`,
      `${Math.round(data.health.installmentRatio * 100)}%`,
      number.format(Math.round(data.health.runwayMonths * 10) / 10),
    ),
  );

  lines.push("", w.headerQuestion, w.question(input.question));
  return lines.join("\n");
}
