# Shyam SDK — Lord of the Rings API

A TypeScript SDK for [The One API](https://the-one-api.dev/). Covers movies and quotes with filtering, sorting, pagination, async iterators, automatic caching, and retry on rate limits.

**Node.js >= 22 required.**

---

## Setup

This package is not published to npm. Clone the repo and install dependencies:

```bash
git clone https://github.com/Aestrus/Shyam-SDK.git
cd Shyam-SDK
npm install
```

Get an API key from [the-one-api.dev](https://the-one-api.dev/sign-up), then:

> **⚠️ Rate Limit:** The API allows 100 requests per 10 minutes. The SDK includes caching (enabled by default) and automatic retry to help manage this limit.

```bash
cp .env.example .env
# Add your LOTR_API_KEY to .env
```

---

## Quick Start

> **Note:** This package is not yet published to npm. For local development, use the import path shown below.

```ts
import { LotrClient } from './src/index.js';
```

```ts
// Option 1: pass API key directly
const client = new LotrClient({ apiKey: 'your-api-key' });
```

```ts
// Option 2: read from LOTR_API_KEY environment variable
const client = new LotrClient();
```

```ts
const movies = await client.movies.list();
console.log(movies.docs);

const quote = await client.quotes.getById('5cd96e05de30eff6ebcce7e9');
console.log(quote.dialog); // "You shall not pass!"
```

---

## Combined Calls

Fetch related data in a single SDK call — no manual multi-step wiring:

```ts
// Movie + all its quotes in parallel (two API calls, one SDK call)
const { movie, quotes } = await client.movies.getWithQuotes('5cd95395de30eff6ebccde5c');
console.log(movie.name);        // "The Fellowship of the Ring"
console.log(quotes[0]?.dialog); // first quote

// Quote with full movie details embedded
const result = await client.quotes.getWithMovie('5cd96e05de30eff6ebcce7e9');
console.log(result.dialog);            // "You shall not pass!"
console.log(result.movieDetails.name); // "The Fellowship of the Ring"

// Find a movie by name (no ID required)
const movie = await client.movies.findByName('The Two Towers');
console.log(movie?._id);

// Search quotes by text (case-insensitive)
for await (const quote of client.quotes.search('precious')) {
  console.log(quote.dialog);
}
```

---

## Filtering

```ts
// Numeric range filters
const result = await client.movies.list({
  filter: {
    academyAwardWins: { gt: 0 },
    budgetInMillions: { lte: 100 },
  }
});
```

```ts
// Exact string match
const result = await client.movies.list({
  filter: { name: 'The Fellowship of the Ring' }
});
```

```ts
// Case-insensitive regex
const result = await client.quotes.list({
  filter: { dialog: { regex: '/ring/i' } }
});
```

**Numeric operators:** `lt`, `gt`, `lte`, `gte`

**String operators:**

| Operator | Example | Effect |
|---|---|---|
| *(plain string)* | `name: 'Frodo'` | Exact match |
| `neq` | `name: { neq: 'Sauron' }` | Not equal |
| `in` | `race: { in: ['Hobbit', 'Elf'] }` | Matches any value |
| `nin` | `race: { nin: ['Orc'] }` | Excludes values |
| `exists` | `name: { exists: true }` | Field present/absent |
| `regex` | `dialog: { regex: '/ring/i' }` | Regex match |
| `regexNegate` | `name: { regexNegate: '/hobbit/i' }` | Negated regex |

---

## Async Iterators

Iterate all records without managing pagination:

```ts
// All movies
for await (const movie of client.movies.all()) {
  console.log(movie.name);
}

// With filter
for await (const movie of client.movies.all({ filter: { academyAwardWins: { gt: 0 } } })) {
  console.log(`${movie.name}: ${movie.academyAwardWins} Oscars`);
}
```

---

## Sorting & Pagination

```ts
const result = await client.movies.list({
  sort: { field: 'runtimeInMinutes', order: 'desc' },
  pagination: { limit: 5, page: 1 },
});

console.log(result.docs);  // current page results
console.log(result.total); // total matching records
console.log(result.pages); // total pages
```

> **Note:** Sorting on `/movie` and `/quote` returns HTTP 500 due to an upstream API bug. Sort is correctly serialised by the SDK — this is a server-side limitation.

---

## Configuration

```ts
const client = new LotrClient({
  apiKey: 'your-api-key',  // or set LOTR_API_KEY env var
  baseUrl: 'https://...',  // override base URL (useful for testing)

  cache: {
    enabled: true,    // default: true
    ttl: 300_000,     // milliseconds, default: 5 minutes
  },

  retry: {
    enabled: true,    // default: true
    maxAttempts: 3,   // default: 3 (429s only, with exponential backoff)
  },
});
```

---

## Error Handling

All errors extend `LotrApiError`:

```ts
import {
  LotrApiError,
  AuthenticationError,
  RateLimitError,
  NotFoundError,
  ServerError,
  ValidationError,
} from './src/index.js';

try {
  const movie = await client.movies.getById(id);
} catch (err) {
  if (err instanceof NotFoundError) { /* 404 */ }
  else if (err instanceof AuthenticationError) { /* 401 */ }
  else if (err instanceof RateLimitError) { /* 429, after retries exhausted */ }
  else if (err instanceof ValidationError) { /* 400 — bad request parameters */ }
  else if (err instanceof ServerError) { /* 500 — e.g. upstream sort bug */ }
  else if (err instanceof LotrApiError) { /* other API error */ }
}
```

---

## Running the Demo

```bash
npm run demo
```

---

## Development

```bash
npm test                   # unit tests (no API key needed)
npm run test:integration   # integration tests (requires LOTR_API_KEY)
npm run build              # compile to dist/
npm run docs:generate      # generate TypeDoc HTML → docs/api/
```

Full API documentation is in `docs/api/index.html` (open in browser).

---

## License

MIT
