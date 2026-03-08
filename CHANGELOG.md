# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-03-07

### Added
- Initial release of Shyam SDK for The One API
- Movies resource client with list, get by ID, and quotes endpoints
- Quotes resource client with list and get by ID endpoints
- Filtering support for numeric ranges (lt, gt, lte, gte)
- Filtering support for strings (exact match, regex, in, nin, exists)
- Sorting and pagination support
- Async iterators (`all()` methods) for automatic pagination
- Combined convenience methods:
  - `MoviesClient.getWithQuotes()` - fetch movie and all quotes in parallel
  - `MoviesClient.findByName()` - find movie by exact title
  - `QuotesClient.getWithMovie()` - fetch quote with embedded movie details
  - `QuotesClient.search()` - search quotes by text
- In-memory caching with TTL (5 minutes default, configurable)
- Automatic retry on HTTP 429 (rate limit exceeded) with exponential backoff and jitter
- Typed error hierarchy (LotrApiError, AuthenticationError, RateLimitError, NotFoundError, ServerError, ValidationError)
- Full TSDoc documentation with examples
- 74 unit tests with mocked fetch
- Integration tests for real API calls
- TypeDoc API documentation
- Demo file showing all major features

[1.0.0]: https://github.com/Aestrus/Shyam-SDK/releases/tag/v1.0.0
