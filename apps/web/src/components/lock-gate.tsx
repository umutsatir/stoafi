"use client";

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { verifyPin } from "@/lib/pin";
import { useAppStore } from "@/store";

/** The app locks again after being out of sight this long (milliseconds). */
export const AUTO_LOCK_AFTER_MS = 5 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const WAIT_MS = 30_000;

/** Shows the PIN screen instead of the app while it is locked, and locks again after a while away. */
export function LockGate({ children }: { children: ReactNode }) {
  const t = useTranslations("lock");
  const lock = useAppStore((s) => s.lock);
  const locked = useAppStore((s) => s.locked);
  const setLocked = useAppStore((s) => s.setLocked);
  const [pin, setPin] = useState("");
  const [wrong, setWrong] = useState(false);
  const [waitUntil, setWaitUntil] = useState(0);
  const attempts = useRef(0);
  const hiddenAt = useRef<number | null>(null);

  useEffect(() => {
    if (!lock) return;
    function onVisibility() {
      if (document.visibilityState === "hidden") {
        hiddenAt.current = Date.now();
      } else if (hiddenAt.current !== null && Date.now() - hiddenAt.current >= AUTO_LOCK_AFTER_MS) {
        setLocked(true);
      }
    }
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [lock, setLocked]);

  if (!lock || !locked) return <>{children}</>;

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!lock || Date.now() < waitUntil) return;
    if (await verifyPin(pin, lock)) {
      attempts.current = 0;
      setWrong(false);
      setPin("");
      setLocked(false);
      return;
    }
    attempts.current += 1;
    setWrong(true);
    setPin("");
    if (attempts.current >= MAX_ATTEMPTS) {
      attempts.current = 0;
      setWaitUntil(Date.now() + WAIT_MS);
    }
  }

  const waiting = Date.now() < waitUntil;
  return (
    <main
      data-testid="lock-screen"
      className="mx-auto flex min-h-[60vh] max-w-sm flex-col items-center justify-center gap-5 text-center"
    >
      <Lock className="h-10 w-10 text-primary" aria-hidden="true" />
      <h1 className="text-title font-semibold">{t("title")}</h1>
      <form onSubmit={submit} className="flex w-full flex-col gap-3">
        <label htmlFor="lock-pin" className="sr-only">
          {t("pin")}
        </label>
        <Input
          id="lock-pin"
          type="password"
          inputMode="numeric"
          autoComplete="off"
          autoFocus
          maxLength={8}
          value={pin}
          aria-invalid={wrong ? "true" : undefined}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
          className="text-center text-lg tracking-widest"
        />
        {wrong && !waiting && (
          <p role="alert" className="text-sm font-medium text-destructive">
            {t("wrong")}
          </p>
        )}
        {waiting && (
          <p role="alert" className="text-sm font-medium text-destructive">
            {t("wait")}
          </p>
        )}
        <Button type="submit" disabled={waiting || pin.length < 4}>
          {t("unlock")}
        </Button>
      </form>
    </main>
  );
}
