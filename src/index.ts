// Public API surface — only what is exported here is visible to SDK consumers.
// HttpClient, QuerySerializer, and other internals are intentionally not exported.

export { LotrClient } from './client.js';

export {
    LotrApiError,
    AuthenticationError,
    RateLimitError,
    NotFoundError,
} from './errors.js';

export type {
    LotrClientConfig,
    Movie,
    Quote,
    PaginatedResponse,
    QueryOptions,
    MovieFilter,
    QuoteFilter,
    NumericFilter,
    SortOptions,
    PaginationOptions,
} from './types.js';
