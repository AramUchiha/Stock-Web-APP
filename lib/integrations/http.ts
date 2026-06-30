type FetchJsonOptions = {
  headers?: HeadersInit;
  timeoutMs?: number;
  retries?: number;
};

const DEFAULT_TIMEOUT_MS = 5_000;
const DEFAULT_RETRIES = 0;

export class ApiRequestError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly body?: string
  ) {
    super(message);
    this.name = "ApiRequestError";
  }
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchJson<T>(url: URL, options: FetchJsonOptions = {}): Promise<T> {
  const body = await fetchText(url, options);
  return JSON.parse(body) as T;
}

export async function fetchText(url: URL, options: FetchJsonOptions = {}): Promise<string> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const retries = options.retries ?? DEFAULT_RETRIES;
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
          ...options.headers
        },
        signal: controller.signal,
        cache: "no-store"
      });

      const body = await response.text();

      if (!response.ok) {
        throw new ApiRequestError(`Request failed with status ${response.status}`, response.status, body);
      }

      return body;
    } catch (error) {
      lastError = error;

      if (attempt === retries) {
        break;
      }

      await wait(250 * (attempt + 1));
    } finally {
      clearTimeout(timeout);
    }
  }

  if (lastError instanceof Error) {
    throw lastError;
  }

  throw new ApiRequestError("Request failed for an unknown reason.");
}
