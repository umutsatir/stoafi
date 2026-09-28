"use client";

import { useState } from "react";
import { minimumPaymentPayoff } from "@stoafi/core";

export function MinimumPaymentCalculator() {
  const [balance, setBalance] = useState(1000);
  const [monthlyRate, setMonthlyRate] = useState(0.02);
  const [pct, setPct] = useState(0.05);
  const [floor, setFloor] = useState(0);

  const result = minimumPaymentPayoff(balance, monthlyRate, { pct, floor });

  return (
    <div>
      <h2>Minimum-payment trap calculator</h2>
      <label htmlFor="balance">Balance</label>
      <input
        id="balance"
        type="number"
        value={balance}
        onChange={(e) => setBalance(Number(e.target.value))}
      />

      <label htmlFor="monthly-rate">Monthly rate</label>
      <input
        id="monthly-rate"
        type="number"
        step="0.001"
        value={monthlyRate}
        onChange={(e) => setMonthlyRate(Number(e.target.value))}
      />

      <label htmlFor="min-pct">Minimum payment %</label>
      <input
        id="min-pct"
        type="number"
        step="0.01"
        value={pct}
        onChange={(e) => setPct(Number(e.target.value))}
      />

      <label htmlFor="min-floor">Minimum payment floor</label>
      <input
        id="min-floor"
        type="number"
        value={floor}
        onChange={(e) => setFloor(Number(e.target.value))}
      />

      <p data-testid="months-to-payoff">Months to payoff: {result.months}</p>
      <p data-testid="total-interest">Total interest: {result.totalInterest.toFixed(2)}</p>
    </div>
  );
}
