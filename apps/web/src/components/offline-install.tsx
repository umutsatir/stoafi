"use client";

import { Check, Download } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/** The event browsers fire when the app can be installed; it is not in the DOM typings. */
interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/** Tells the user the app works offline, offers to install it, and reminds them their data is local. */
export function OfflineInstall() {
  const t = useTranslations("settings.offline");
  const [prompt, setPrompt] = useState<InstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [online, setOnline] = useState(true);

  useEffect(() => {
    setInstalled(window.matchMedia("(display-mode: standalone)").matches);
    setOnline(navigator.onLine);
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setPrompt(event as InstallPromptEvent);
    };
    const onInstalled = () => setInstalled(true);
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  async function install() {
    if (!prompt) return;
    await prompt.prompt();
    const choice = await prompt.userChoice;
    if (choice.outcome === "accepted") setInstalled(true);
    setPrompt(null);
  }

  return (
    <div data-testid="offline-install" className="flex flex-col gap-4">
      <div>
        <p className="flex items-center gap-2.5 text-sm font-bold">
          <span
            aria-hidden="true"
            className={cn(
              "h-[11px] w-[11px] rounded-full [animation:pulse_2.4s_infinite]",
              online ? "bg-success" : "bg-c2",
            )}
          />
          {online ? t("works") : t("offlineNow")}
        </p>
        <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted-foreground">{t("hint")}</p>
      </div>
      <div>
        <button
          type="button"
          onClick={() => void install()}
          disabled={installed || !prompt}
          className={cn(
            "press flex items-center gap-2 rounded-full px-5 py-[11px] text-[13px] font-extrabold disabled:cursor-default",
            installed ? "bg-c4 text-on" : "bg-primary text-primary-foreground disabled:opacity-60",
          )}
        >
          {installed ? (
            <Check className="h-3.5 w-3.5" aria-hidden="true" />
          ) : (
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
          )}
          {installed ? t("installed") : t("install")}
        </button>
        {!installed && !prompt && (
          <p className="mt-2 text-xs text-muted-foreground">{t("installHelp")}</p>
        )}
      </div>
      <p className="rounded-[20px] bg-muted px-4 py-3 text-[12.5px] font-semibold leading-relaxed">
        {t("localNote")}
      </p>
    </div>
  );
}
