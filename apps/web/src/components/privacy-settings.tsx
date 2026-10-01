"use client";

import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { Eye, EyeOff, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
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
    <div className="flex flex-col gap-5 rounded-xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-medium">{t("hideTitle")}</p>
          <p className="text-sm text-muted-foreground">{t("hideText")}</p>
        </div>
        <Button
          type="button"
          variant="outline"
          role="switch"
          aria-checked={hideAmounts}
          onClick={() => setHideAmounts(!hideAmounts)}
        >
          {hideAmounts ? (
            <EyeOff className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Eye className="h-4 w-4" aria-hidden="true" />
          )}
          {hideAmounts ? t("hideOn") : t("hideOff")}
        </Button>
      </div>

      <div className="flex flex-col gap-3 border-t border-border pt-5">
        <div>
          <p className="flex items-center gap-2 font-medium">
            <KeyRound className="h-4 w-4 text-primary" aria-hidden="true" />
            {t("pinTitle")}
          </p>
          <p className="text-sm text-muted-foreground">{lock ? t("pinOn") : t("pinOff")}</p>
          <p className="text-xs text-muted-foreground">{t("pinNote")}</p>
        </div>

        {mode === "idle" ? (
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => setMode("set")}>
              {lock ? t("change") : t("set")}
            </Button>
            {lock && (
              <Button type="button" variant="ghost" onClick={() => setMode("remove")}>
                {t("remove")}
              </Button>
            )}
          </div>
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
