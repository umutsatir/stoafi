/**
 * A report the user can save and send if something breaks. It holds what is needed to find the bug
 * (what failed, where, which app version) and nothing from their finances: no amounts, no names.
 */
export interface ErrorReport {
  app: string;
  version: string;
  time: string;
  path: string;
  userAgent: string;
  error: { name: string; message: string; stack: string[]; digest?: string };
}

export interface ErrorContext {
  version: string;
  /** ISO time, passed in from the app boundary. */
  time: string;
  path: string;
  userAgent: string;
}

const MAX_STACK_LINES = 12;
const MAX_MESSAGE = 300;

export function buildErrorReport(
  error: Error & { digest?: string },
  context: ErrorContext,
): ErrorReport {
  return {
    app: "stoafi",
    version: context.version,
    time: context.time,
    path: context.path,
    userAgent: context.userAgent,
    error: {
      name: error.name,
      message: error.message.slice(0, MAX_MESSAGE),
      stack: (error.stack ?? "").split("\n").slice(0, MAX_STACK_LINES),
      ...(error.digest ? { digest: error.digest } : {}),
    },
  };
}
