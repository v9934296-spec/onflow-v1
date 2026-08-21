import { fail, ok, type ApiError, type ApiResult } from "./types";
import { getApiBaseUrl, isApiConfigured } from "./config";

export type TokenProvider = () => Promise<string | null>;

let tokenProvider: TokenProvider = async () => null;
let onUnauthorized: () => void = () => {};

export function setTokenProvider(provider: TokenProvider): void {
  tokenProvider = provider;
}

export function setUnauthorizedHandler(handler: () => void): void {
  onUnauthorized = handler;
}

function parseRetryAfter(header: string | null): number | undefined {
  if (!header) return undefined;
  const seconds = Number.parseInt(header, 10);
  if (Number.isFinite(seconds) && seconds >= 0) return seconds;
  const date = Date.parse(header);
  if (!Number.isFinite(date)) return undefined;
  return Math.max(0, Math.ceil((date - Date.now()) / 1000));
}

function structuredCode(body: unknown): string | undefined {
  if (!body || typeof body !== "object") return undefined;
  const record = body as Record<string, unknown>;
  if (typeof record.detail === "string" && !record.detail.includes(" ")) {
    return record.detail;
  }
  if (typeof record.code === "string") return record.code;
  return undefined;
}

function classify(status: number, body: unknown, retryAfter?: number): ApiError {
  const code = structuredCode(body);
  if (status === 401) return { kind: "unauthorized", status, code };
  if (status === 429) {
    return { kind: "rate_limited", status, code, retryAfterSeconds: retryAfter };
  }
  if (status === 403 && (code === "tier_gate" || typeof code === "string")) {
    return { kind: "quota", status, code };
  }
  if (status >= 500) return { kind: "server", status, code };
  if (status === 409 || status === 422 || status === 413) {
    return { kind: "client", status, code };
  }
  if (status >= 400) return { kind: "client", status, code };
  return { kind: "contract", status, code };
}

export async function apiRequest<T>(
  path: string,
  options: {
    method?: string;
    json?: unknown;
    auth?: boolean;
    timeoutMs?: number;
    signal?: AbortSignal;
  } = {},
): Promise<ApiResult<T>> {
  if (!isApiConfigured()) {
    return fail({ kind: "configuration" });
  }

  const method = options.method ?? "GET";
  const headers: Record<string, string> = { Accept: "application/json" };
  if (options.json !== undefined) {
    headers["Content-Type"] = "application/json";
  }
  if (options.auth !== false) {
    const token = await tokenProvider();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 20_000);
  if (options.signal) {
    if (options.signal.aborted) controller.abort();
    else options.signal.addEventListener("abort", () => controller.abort(), { once: true });
  }

  try {
    const res = await fetch(`${getApiBaseUrl()}${path}`, {
      method,
      headers,
      body: options.json !== undefined ? JSON.stringify(options.json) : undefined,
      signal: controller.signal,
    });
    const retryAfter = parseRetryAfter(res.headers.get("Retry-After"));
    let body: unknown = null;
    const text = await res.text();
    if (text.trim()) {
      try {
        const parsed: unknown = JSON.parse(text);
        body = parsed;
      } catch {
        body = { _nonJson: text.slice(0, 200) };
      }
    }
    if (!res.ok) {
      const error = classify(res.status, body, retryAfter);
      if (error.kind === "unauthorized") onUnauthorized();
      return fail(error);
    }
    return ok(body as T);
  } catch (err) {
    const name = err instanceof Error ? err.name : "";
    if (name === "AbortError") return fail({ kind: "cancelled" });
    return fail({ kind: "offline" });
  } finally {
    clearTimeout(timeout);
  }
}
