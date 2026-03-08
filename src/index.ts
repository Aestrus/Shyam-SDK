export { LotrClient } from './client.js';
export { MoviesClient } from './resources/movies.js';
export { QuotesClient } from './resources/quotes.js';

export {
    LotrApiError,
    AuthenticationError,
    RateLimitError,
    NotFoundError,
    ServerError,
    ValidationError,
} from './errors.js';

export type {
    LotrClientConfig,
    Movie,
    Quote,
    MovieWithQuotes,
    QuoteWithMovie,
    PaginatedResponse,
    QueryOptions,
    MovieFilter,
    QuoteFilter,
    NumericFilter,
    StringFilter,
    SortOptions,
    PaginationOptions,
} from './types.js';
