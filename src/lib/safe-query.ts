export function logClientError(label: string, error: unknown) {
  console.error(`[SevaNet] ${label}`, error);
  if (typeof window !== "undefined") {
    window.__lovableEvents?.captureException?.(error, { source: label }, { handled: true, severity: "error" });
  }
}

export async function withTimeout<T>(work: PromiseLike<T>, label: string, ms = 12000): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      Promise.resolve(work),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`${label} timed out`)), ms);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}