import {
  DEFAULT_BASE,
  POPULAR_CURRENCIES,
  quoteSymbolsFor,
} from "./currencies";

const SUPPORTED = new Set(POPULAR_CURRENCIES);
const MAX_SYMBOLS = 10;

export type ParsedFxQuery = {
  base: string;
  symbols: string[];
};

export class QueryValidationError extends Error {}

export function parseFxQuery(searchParams: URLSearchParams): ParsedFxQuery {
  const base = (searchParams.get("base") ?? DEFAULT_BASE).trim().toUpperCase();
  if (!SUPPORTED.has(base)) {
    throw new QueryValidationError(`Unsupported base currency: ${base}`);
  }

  const rawSymbols = searchParams.get("symbols");
  if (rawSymbols == null) {
    return { base, symbols: quoteSymbolsFor(base) };
  }

  const symbols = [
    ...new Set(
      rawSymbols
        .split(",")
        .map((symbol) => symbol.trim().toUpperCase())
        .filter(Boolean)
    ),
  ].filter((symbol) => symbol !== base);

  if (symbols.length === 0 || symbols.length > MAX_SYMBOLS) {
    throw new QueryValidationError(
      `symbols must contain between 1 and ${MAX_SYMBOLS} currencies`
    );
  }

  const unsupported = symbols.find((symbol) => !SUPPORTED.has(symbol));
  if (unsupported) {
    throw new QueryValidationError(`Unsupported quote currency: ${unsupported}`);
  }

  return { base, symbols };
}

export function parseHistoryDays(searchParams: URLSearchParams): number {
  const raw = searchParams.get("days");
  if (raw == null) return 8;
  if (!/^\d+$/.test(raw)) {
    throw new QueryValidationError("days must be an integer between 2 and 90");
  }

  const days = Number(raw);
  if (days < 2 || days > 90) {
    throw new QueryValidationError("days must be an integer between 2 and 90");
  }
  return days;
}
