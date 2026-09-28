"use client";

import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import type { Profile } from "@stoafi/core";

export interface ProfileFormProps {
  initial?: Profile;
  onSave: (profile: Profile) => void | Promise<void>;
}

const EMPTY: Profile = {
  incomes: [{ label: "", monthly: 0 }],
  fixedExpenses: [],
  livingExpenses: 0,
  savings: 0,
  emergencyFundTargetMonths: 6,
  annualInflationExpectation: 0.3,
};

export function ProfileForm({ initial, onSave }: ProfileFormProps) {
  const [profile, setProfile] = useState<Profile>(initial ?? EMPTY);
  const t = useTranslations("profile");

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    void onSave(profile);
  }

  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor="income-monthly">{t("monthlyIncome")}</label>
      <input
        id="income-monthly"
        type="number"
        value={profile.incomes[0]?.monthly ?? 0}
        onChange={(e) =>
          setProfile((p) => ({
            ...p,
            incomes: [{ label: "Salary", monthly: Number(e.target.value) }],
          }))
        }
      />

      <label htmlFor="savings">{t("currentSavings")}</label>
      <input
        id="savings"
        type="number"
        value={profile.savings}
        onChange={(e) => setProfile((p) => ({ ...p, savings: Number(e.target.value) }))}
      />

      <label htmlFor="fund-months">{t("emergencyFundMonths")}</label>
      <input
        id="fund-months"
        type="number"
        value={profile.emergencyFundTargetMonths}
        onChange={(e) =>
          setProfile((p) => ({ ...p, emergencyFundTargetMonths: Number(e.target.value) }))
        }
      />

      <label htmlFor="inflation">{t("annualInflation")}</label>
      <input
        id="inflation"
        type="number"
        step="0.01"
        value={profile.annualInflationExpectation}
        onChange={(e) =>
          setProfile((p) => ({ ...p, annualInflationExpectation: Number(e.target.value) }))
        }
      />

      <button type="submit">{t("save")}</button>
    </form>
  );
}
