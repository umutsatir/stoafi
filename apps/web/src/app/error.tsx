"use client";

import { ErrorScreen } from "@/components/error-screen";

export default function RouteError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorScreen {...props} />;
}
