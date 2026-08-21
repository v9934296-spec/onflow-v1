export type ApiErrorKind =
  | "offline"
  | "unauthorized"
  | "rate_limited"
  | "quota"
  | "client"
  | "server"
  | "contract"
  | "configuration"
  | "cancelled";

export interface ApiError {
  readonly kind: ApiErrorKind;
  readonly status?: number;
  readonly code?: string;
  readonly retryAfterSeconds?: number;
}

export type ApiResult<T> =
  | { readonly ok: true; readonly data: T }
  | { readonly ok: false; readonly error: ApiError };

export function ok<T>(data: T): ApiResult<T> {
  return { ok: true, data };
}

export function fail(error: ApiError): ApiResult<never> {
  return { ok: false, error };
}
