"use client";

import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { notify } from "@/components/ui/toaster";
import { createLock, isValidPin, verifyPin } from "@/lib/pin";
import { useAppStore } from "@/store";

/** Hide amounts on screen, and cover the app with a PIN. */
export function PrivacySettings() {
  const t = useTranslations("privacy");
  const hideAmounts = useAppStore((s) => s.hideAmounts);
  const setHideAmounts = useAppStore((s) => s.setHideAmounts);
  const lock = useAppStore((s) => s.lock);
  const setLock = useAppStore((s) => s.setLock);
  const [mode, setMode] = useState<"idle" | "set" | "remove">("idle");
  const [current, setCurrent] = useState("");
  const [pin, setPin] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<"format" | "mismatch" | "current" | null>(null);

  function reset() {
    setMode("idle");
    setCurrent("");
    setPin("");
    setConfirm("");
    setError(null);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (lock && !(await verifyPin(current, lock))) return setError("current");
    if (mode === "remove") {
      setLock(null);
      notify(t("removed"));
      return reset();
    }
    if (!isValidPin(pin)) return setError("format");
    if (pin !== confirm) return setError("mismatch");
    setLock(await createLock(pin));
    notify(t("saved"));
    reset();
  }

  return (
    <div className="flex flex-col">
      <div className="mt-[18px] flex items-center justify-between gap-4">
        <div>
          <p className="text-[14.5px] font-bold">{t("hideTitle")}</p>
          <p className="mt-0.5 text-[12.5px] leading-snug text-muted-foreground">{t("hideText")}</p>
        </div>
        <Switch checked={hideAmounts} onCheckedChange={setHideAmounts} label={t("hideTitle")} />
      </div>

      <div className="flex flex-col gap-3">
        <div className="mt-[18px] flex items-center justify-between gap-4">
          <div>
            <p className="text-[14.5px] font-bold">{t("pinTitle")}</p>
            <p className="mt-0.5 text-[12.5px] leading-snug text-muted-foreground">
              {lock ? t("pinOn") : t("pinOff")} {t("pinNote")}
            </p>
          </div>
          <Switch
            checked={lock !== null}
            onCheckedChange={(on) => setMode(on ? "set" : "remove")}
            label={t("pinTitle")}
          />
        </div>

        {mode === "idle" ? (
          lock && (
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setMode("set")}>
                {t("change")}
              </Button>
            </div>
          )
        ) : (
          <form onSubmit={submit} className="flex max-w-xs flex-col gap-3">
            {lock && (
              <Field
                label={t("currentPin")}
                htmlFor="pin-current"
                {...(error === "current" ? { error: t("currentWrong") } : {})}
              >
                <Input
                  id="pin-current"
                  type="password"
                  inputMode="numeric"
                  autoComplete="off"
                  value={current}
                  onChange={(e) => setCurrent(e.target.value.replace(/\D/g, ""))}
                  maxLength={8}
                />
              </Field>
            )}
            {mode === "set" && (
              <>
                <Field
                  label={t("newPin")}
                  htmlFor="pin-new"
                  hint={t("pinFormat")}
                  {...(error === "format" ? { error: t("formatError") } : {})}
                >
                  <Input
                    id="pin-new"
                    type="password"
                    inputMode="numeric"
                    autoComplete="off"
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                    maxLength={8}
                  />
                </Field>
                <Field
                  label={t("confirmPin")}
                  htmlFor="pin-confirm"
                  {...(error === "mismatch" ? { error: t("mismatchError") } : {})}
                >
                  <Input
                    id="pin-confirm"
                    type="password"
                    inputMode="numeric"
                    autoComplete="off"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value.replace(/\D/g, ""))}
                    maxLength={8}
                  />
                </Field>
              </>
            )}
            <div className="flex gap-2">
              <Button type="submit">{mode === "remove" ? t("remove") : t("save")}</Button>
              <Button type="button" variant="outline" onClick={reset}>
                {t("cancel")}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
