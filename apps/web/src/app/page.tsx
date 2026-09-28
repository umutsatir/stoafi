"use client";

import { CORE_VERSION } from "@stoafi/core";
import { useTranslations } from "next-intl";

export default function Home() {
  const t = useTranslations("app");
  return <main>{t("coreVersion", { version: CORE_VERSION })}</main>;
}
