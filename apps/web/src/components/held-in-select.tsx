"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { HELD_IN_OPTIONS, heldInValue, parseHeldIn } from "@stoafi/core";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

/** The name to show for a stored held-in value, in the active language. */
export function useHeldInName(): (value: string | undefined) => string {
  const t = useTranslations("savings.heldIn");
  const tTypes = useTranslations("investments.types");
  return (value) => {
    const { typeId, customName } = parseHeldIn(value);
    if (typeId === "") return "";
    if (typeId === "custom") return customName;
    return typeId === "cash" ? t("cash") : tTypes(`${typeId}.name`);
  };
}

export interface HeldInSelectProps {
  /** The stored value, or undefined when nothing was chosen. */
  value: string | undefined;
  onChange: (value: string | undefined) => void;
  id?: string;
}

/** Pick what a pot's money is kept in: plain cash, one of the investment types, or something you name. */
export function HeldInSelect({ value, onChange, id = "held-in" }: HeldInSelectProps) {
  const t = useTranslations("savings.heldIn");
  const tTypes = useTranslations("investments.types");
  const initial = parseHeldIn(value);
  const [typeId, setTypeId] = useState(initial.typeId);
  const [custom, setCustom] = useState(initial.customName);

  function choose(nextType: string, nextCustom: string) {
    setTypeId(nextType);
    setCustom(nextCustom);
    onChange(heldInValue(nextType, nextCustom));
  }

  return (
    <div className="flex flex-col gap-2">
      <Field label={t("label")} htmlFor={id} hint={t("hint")}>
        <select
          id={id}
          value={typeId}
          onChange={(e) => choose(e.target.value, custom)}
          className="h-9 rounded-md border border-input bg-card px-3 text-sm"
        >
          <option value="">{t("notSet")}</option>
          {HELD_IN_OPTIONS.map((option) => (
            <option key={option.id} value={option.id}>
              {option.id === "cash" ? t("cash") : tTypes(`${option.id}.name`)}
            </option>
          ))}
          <option value="custom">{t("other")}</option>
        </select>
      </Field>
      {typeId === "custom" && (
        <Field label={t("customLabel")} htmlFor={`${id}-custom`}>
          <Input
            id={`${id}-custom`}
            value={custom}
            maxLength={40}
            placeholder={t("customPlaceholder")}
            onChange={(e) => choose("custom", e.target.value)}
          />
        </Field>
      )}
    </div>
  );
}
