declare const BRAND: unique symbol;

/**
 * Branded types make fabrication conspicuous (spec 15). A raw string cannot be
 * passed where a `ClipId` is expected, so an invented identifier has to be
 * minted deliberately — and minting is confined to domain/mappers by lint.
 */
export type Brand<TValue, TName extends string> = TValue & {
  readonly [BRAND]: TName;
};

/**
 * Mints a branded value. Callable only from domain/mappers/ — the boundary lint
 * rejects this import anywhere else.
 */
export function unsafeBrand<TBranded>(value: string | number): TBranded {
  return value as TBranded;
}
