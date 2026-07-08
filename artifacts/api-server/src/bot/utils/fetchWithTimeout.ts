// Small helper to race a promise against a timeout and return a clear error when timed out.
export async function fetchWithTimeout<T>(promise: Promise<T>, ms = 3000): Promise<T> {
  let timeout: NodeJS.Timeout;
  const timeoutPromise = new Promise<never>((_, rej) => {
    timeout = setTimeout(() => rej(new Error("timeout")), ms);
  });

  try {
    const res = await Promise.race([promise, timeoutPromise]) as T;
    return res;
  } finally {
    clearTimeout(timeout!);
  }
}
