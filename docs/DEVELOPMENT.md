# Development Guide

## Project scope

FXBoard is a full-stack dashboard for ECB daily reference rates and currency conversion. It uses Next.js App Router, React, TypeScript, Tailwind CSS, Chart.js, and decimal.js. The Frankfurter API supplies reference-rate data without an API key.

## Commands

```bash
npm run dev
npm run lint
npm run test
npm run build
npm run start
```

GitHub Actions runs lint, unit tests, and a production build for pushes and pull requests. Dependency changes include updates to both `package.json` and `package-lock.json`.

## Data flow

- `src/app/api/rates/route.ts` provides the latest reference rates.
- `src/app/api/history/route.ts` provides recent business-day series.
- `src/lib/frankfurter.ts` is the server-side Frankfurter client.
- `src/lib/api-query.ts` validates supported currencies and history ranges.
- `src/lib/server-config.ts` validates server-only environment settings.
- `src/lib/cache.ts` provides per-instance TTL caching and concurrent-request deduplication.
- `src/lib/rate-limit.ts` provides basic per-instance request limiting.

Route Handler responses include CDN cache directives. The in-memory cache and rate limiter are scoped to a warm Serverless instance and are not persistent or globally shared.

## Currency and precision rules

Currency conversion is implemented in `src/lib/convert.ts` with decimal.js. Display precision is provided by `currencyDecimals()` in `src/lib/currencies.ts`. JPY, KRW, HUF, and ISK use zero decimal places in the current display model; other supported currencies use two.

`POPULAR_CURRENCIES` and `BASE_OPTIONS` contain currencies supported by the configured ECB/Frankfurter data source. TWD is not included because it is unavailable from that source.

## Historical series

ECB reference rates are not published on weekends and some holidays. `fetchTimeSeries()` requests a wider calendar range and the API response layer keeps the most recent requested number of available observations.

## Design system

Design tokens are defined in `src/styles/globals.css`. Components reference CSS custom properties for surfaces, typography, borders, chart series, and status colors. Light and dark themes use separately selected token values.

Chart.js renders on canvas, so `src/lib/tokens.ts` resolves CSS custom properties into concrete color values at render time. Status information uses labels or signed values in addition to color.

## Test coverage

- `convert.test.ts`: conversion, cross rates, rounding, and zero-rate handling.
- `cache.test.ts`: hit, expiry, key isolation, and concurrent-request deduplication.
- `api-query.test.ts`: defaults, normalization, supported currencies, and history ranges.
- `rate-limit.test.ts`: request limits and window reset behavior.

The test suite does not require network access. Production API behavior is verified separately with deployment smoke tests.
