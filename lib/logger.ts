/** Server-side error logging. Logs what happened, never secrets or customer payloads. */
export function logError(scope: string, error: unknown, context?: Record<string, string | number | boolean | null>) {
  const detail =
    error instanceof Error
      ? { name: error.name, message: error.message }
      : typeof error === "object" && error !== null
        ? {
            code: (error as { code?: string }).code,
            message: (error as { message?: string }).message,
            details: (error as { details?: string }).details,
          }
        : { message: String(error) };
  console.error(`[nova:${scope}]`, { ...detail, ...context });
}
