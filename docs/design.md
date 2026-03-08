# Design

## Contents

- [Architecture](#architecture)
- [Module System and Runtime](#module-system-and-runtime)
- [Two tsconfig Files](#two-tsconfig-files)
- [Filtering](#filtering)
- [Error Handling](#error-handling)
- [Caching](#caching)
- [Retry](#retry)
- [SDK Structure Philosophy](#sdk-structure-philosophy)
- [Pagination Abstraction: `all()`](#pagination-abstraction-all)
- [Combined Calls](#combined-calls)
- [Known API Limitations](#known-api-limitations)

---

## Architecture

The SDK is four layers:

```
LotrClient
  └── MoviesClient / QuotesClient   (resource clients)
        └── HttpClient              (auth, cache, retry, error mapping)
              └── QuerySerializer   (pure function: options → query string)
```

`LotrClient` is the single entry point consumers instantiate. It wires the layers together via dependency injection: `HttpClient` is constructed once and shared between resource clients. This makes each layer testable in isolation — unit tests inject a mock `fetch` into `HttpClient` directly, without touching the network.

---

## Module System and Runtime

With generated SDKs supporting modern standards, ESM was chosen with the current active LTS of Node, Node >= 22.

---

## Two tsconfig Files

- `tsconfig.json` — type checks all files (src, tests, examples). Used by `npx tsc --noEmit`.
- `tsconfig.build.json` — extends base config, scopes to `src/` only with `rootDir`/`outDir`. Used by `npm run build`.

Separating them keeps compiled output clean (no test files in `dist/`) while still type-checking tests and examples in the IDE and CI.

---

## Filtering

Typed options objects were chosen over a fluent builder pattern (e.g. `.budgetLessThan(100).sortBy('name')`) because they are idiomatic TypeScript, easier to test in isolation, and more consistent with what a code generator would emit.

The `operatorMap` in `query-serializer.ts` acts as a whitelist for numeric operators. Unknown operators return `undefined` and are silently skipped, so bad input can never produce malformed query strings. TypeScript's type system prevents unknown operators from reaching the serializer at compile time anyway.

The API supports two distinct filter shapes: `NumericFilter` (numeric comparisons: `lt`, `gt`, `lte`, `gte`) and `StringFilter` (match, negate, include, exclude, exists, regex). The serializer detects which shape to use by checking for the presence of numeric keys — the two filter types have non-overlapping key sets.

String fields in `MovieFilter` and `QuoteFilter` accept `string | StringFilter`. A plain string is the shorthand for an exact match (`eq`). `StringFilter` unlocks the full operator set: `eq`, `neq`, `in`, `nin`, `exists`, `regex`, `regexNegate`.

Adding a new filter operator: for numeric, one field in `NumericFilter` + one entry in `operatorMap`. For string, one field in `StringFilter` + one branch in `serializeStringFilter`. Zero other files change.

---

## Error Handling

Typed error hierarchy: `LotrApiError` → `AuthenticationError`, `RateLimitError`, `NotFoundError`, `ServerError`, `ValidationError`.

This allows consumers to catch specific failure modes with `instanceof` rather than parsing string messages. Errors throw rather than returning a Result type because throwing is the idiomatic JavaScript/TypeScript convention for HTTP client errors.

| Class | HTTP Status | When thrown |
|---|---|---|
| `AuthenticationError` | 401 | Invalid or missing API key |
| `NotFoundError` | 404 | Resource ID does not exist |
| `RateLimitError` | 429 | Rate limit exceeded (after retries) |
| `ValidationError` | 400 | Malformed query parameters |
| `ServerError` | 500 | Upstream server error (e.g. the known sort bug) |
| `LotrApiError` | other | Any other non-2xx response |

`ServerError` is particularly meaningful for this API: sorting on `/movie` and `/quote` is a documented upstream bug that returns 500. Consumers can catch `ServerError` specifically and handle it (e.g. retry without sort) rather than receiving a generic error.

`Object.setPrototypeOf(this, new.target.prototype)` is set in each constructor to ensure `instanceof` works correctly when TypeScript compiles to ES5 — a well-known gotcha with extending built-in classes.

---

## Caching

In-memory TTL cache is on by default. Given the API's strict rate limit (100 req/10 min) and static data (8 movies, fixed quotes), caching by default is the responsible choice for SDK consumers who might not think about it themselves.

Cache is keyed by full URL including query params — different filter combinations are cached separately. Known limitation: cache is per SDK instance and does not persist across restarts.

---

## Retry

Automatic exponential backoff + jitter on 429 `RateLimitError` only. Other errors (401, 404) are not retried — they won't resolve by waiting.

Jitter prevents thundering herd: if multiple SDK instances hit the rate limit simultaneously, spread retries avoid hammering the API at the same instant.

---

## SDK Structure Philosophy

Structure is intentionally regular and generator-friendly: consistent naming (`list`, `getById`), consistent options shape (`QueryOptions<TFilter>`), consistent error types. A code generator could emit this pattern from an OpenAPI spec.

Adding a new resource endpoint (e.g. `/character`) requires one new file in `src/resources/` and two lines in `src/client.ts`. Zero other files change.

---

## Pagination Abstraction: `all()`

**Problem:** Manual pagination (`limit` + `page`) is tedious and error-prone.

**Solution:** Add `all()` methods that return async iterators:

```ts
// Before: Manual pagination
let page = 1;
let allQuotes: Quote[] = [];
while (true) {
  const result = await client.quotes.list({ pagination: { page, limit: 100 } });
  allQuotes.push(...result.docs);
  if (page >= result.pages) break;
  page++;
}

// After: Async iterator
for await (const quote of client.quotes.all()) {
  console.log(quote.dialog);
}
```

**Implementation:**
- Add `async *all(options?): AsyncIterable<T>` to each resource client
- Internally handles pagination loop with `pagination: { limit, page }`
- Respects `QueryOptions.filter` and `QueryOptions.sort` if provided
- Type-safe: `AsyncIterable<Movie>` for movies, `AsyncIterable<Quote>` for quotes

**Why:**
- Idiomatic JavaScript/TypeScript for lazy sequences
- Memory-efficient — doesn't load all records into memory
- Familiar to Java developers (similar to `Stream` iteration)

---

## Combined Calls

The API returns raw IDs for related entities — a `Quote` contains `movie: string` (the movie's `_id`), not the full movie object. Fetching a quote and its movie context requires two separate API calls. This is a common friction point for consumers.

Four methods abstract this:

### `movies.getWithQuotes(movieId)` → `MovieWithQuotes`

Combines `/movie/{id}` and `/movie/{id}/quote` using `Promise.all` — both requests run in parallel since neither depends on the other's result. Returns `{ movie: Movie, quotes: Quote[] }`.

### `movies.findByName(name)` → `Movie | undefined`

Delegates to `list({ filter: { name } })` and returns the first match. Returns `undefined` rather than throwing when not found, making it safe without a try/catch. Useful when you know the title but not the opaque MongoDB ID.

### `quotes.getWithMovie(quoteId)` → `QuoteWithMovie`

Fetches `/quote/{id}` first, extracts `quote.movie`, then fetches `/movie/{id}`. Sequential (not parallel) because the movie ID is unknown until the quote is resolved. Returns the full `Quote` with a `movieDetails: Movie` field added.

### `quotes.search(term)` → `AsyncIterable<Quote>`

Delegates to `all({ filter: { dialog: { regex: `/${term}/i` } } })`. A simpler API for the common case of text search — no need to know the filter syntax.

### Relevant Types

- `MovieWithQuotes` — `{ movie: Movie; quotes: Quote[] }`
- `QuoteWithMovie` — `Quote & { movieDetails: Movie }`

---

## Known API Limitations

**Sorting on `/movie` and `/quote` returns HTTP 500.** Verified by direct curl against `/movie?sort=name:asc`, `/quote?sort=dialog:asc`, and the exact documented example `/quote?sort=character:desc`. Notably, `/character?sort=name:asc` returns 200 correctly — the bug is specific to the movie and quote endpoints. The SDK correctly serialises sort options (verified by unit tests) and correctly surfaces the 500 as a `LotrApiError`. Integration tests for sorting are skipped with this explanation.

**`/movie/{id}/quote` only works for the LotR trilogy.** Hobbit movie IDs return empty results. Documented in integration tests.

---