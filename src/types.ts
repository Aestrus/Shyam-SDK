/**
 * A LotR movie from the API.
 *
 * @remarks
 * Movies represent both the Lord of the Rings trilogy and The Hobbit trilogy.
 * Note that `/movie/{id}/quote` only works for LotR trilogy movies (upstream API limitation).
 *
 * LotR trilogy movie IDs:
 * - The Two Towers: `5cd95395de30eff6ebccde5b`
 * - The Fellowship of the Ring: `5cd95395de30eff6ebccde5c`
 * - The Return of the King: `5cd95395de30eff6ebccde5d`
 *
 * @example
 * ```ts
 * const movie: Movie = {
 *   _id: '5cd95395de30eff6ebccde5c',
 *   name: 'The Fellowship of the Ring',
 *   runtimeInMinutes: 178,
 *   budgetInMillions: 93,
 *   boxOfficeRevenueInMillions: 871,
 *   academyAwardNominations: 13,
 *   academyAwardWins: 4,
 *   rottenTomatoesScore: 91
 * };
 * ```
 */
export interface Movie {
    /** Unique movie identifier (24-character hex string) */
    _id: string
    /** Movie title */
    name: string
    /** Runtime in minutes */
    runtimeInMinutes: number
    /** Production budget in millions USD */
    budgetInMillions: number
    /** Box office revenue in millions USD */
    boxOfficeRevenueInMillions: number
    /** Academy Award nominations count */
    academyAwardNominations: number
    /** Academy Award wins count */
    academyAwardWins: number
    /** Rotten Tomatoes score (0-100) */
    rottenTomatoesScore: number
}

/**
 * A quote from the LotR movies.
 *
 * @remarks
 * Quotes are associated with both a movie and a character. The `movie` field
 * references a Movie's `_id`, and `character` references a Character's `_id`
 * (if the character endpoint were implemented).
 *
 * @example
 * ```ts
 * const quote: Quote = {
 *   _id: '5cd96e05de30eff6ebcce7e9',
 *   dialog: 'You shall not pass!',
 *   movie: '5cd95395de30eff6ebccde5c',
 *   character: '5cd99d4bde30eff6ebccfea3',
 *   id: '5cd96e05de30eff6ebcce7e9'
 * };
 * ```
 */
export interface Quote {
    /** Unique quote identifier (24-character hex string) */
    _id: string
    /** The quoted dialogue text */
    dialog: string
    /** Movie ID this quote is from (references Movie._id) */
    movie: string
    /** Character ID who spoke this quote (references Character._id) */
    character: string
    /** Duplicate of _id (API returns both fields) */
    id: string
}

/**
 * Paginated response from list endpoints.
 *
 * @remarks
 * All `list()` methods return this wrapper type containing the array of results
 * (`docs`) plus pagination metadata.
 *
 * @template T - The type of items in the `docs` array
 *
 * @example
 * ```ts
 * const response: PaginatedResponse<Movie> = await client.movies.list({
 *   pagination: { limit: 5, page: 1 }
 * });
 *
 * console.log(response.docs); // Movie[]
 * console.log(response.total); // total matching records (e.g., 8)
 * console.log(response.pages); // total pages (e.g., 2)
 * console.log(response.page); // current page (1)
 * console.log(response.limit); // items per page (5)
 * console.log(response.offset); // items skipped (0)
 * ```
 */
export interface PaginatedResponse<T> {
    /** Array of results for the current page */
    docs: T[]
    /** Total number of records matching the query */
    total: number
    /** Maximum number of results per page */
    limit: number
    /** Number of results skipped (offset from start) */
    offset: number
    /** Current page number (1-indexed) */
    page: number
    /** Total number of pages available */
    pages: number
}

/**
 * Numeric range filter options.
 *
 * @remarks
 * Use for filtering numeric fields by range. All operators are optional and
 * can be combined.
 *
 * @example
 * ```ts
 * // Movies with budget less than $100M
 * filter: { budgetInMillions: { lt: 100 } }
 *
 * // Movies with at least 1 Oscar nomination AND at most 5 wins
 * filter: {
 *   academyAwardNominations: { gte: 1 },
 *   academyAwardWins: { lte: 5 }
 * }
 *
 * // Runtime between 2 and 3 hours
 * filter: { runtimeInMinutes: { gte: 120, lte: 180 } }
 * ```
 */
export interface NumericFilter {
    /** Less than (exclusive) */
    lt?: number
    /** Greater than (exclusive) */
    gt?: number
    /** Less than or equal (inclusive) */
    lte?: number
    /** Greater than or equal (inclusive) */
    gte?: number
}

/**
 * String filter options.
 *
 * @remarks
 * Provides rich string matching beyond exact equality. Use for filtering
 * string fields by negation, inclusion, existence, or regex patterns.
 *
 * For exact match, use a plain string instead of this interface.
 *
 * @example
 * ```ts
 * // Exact match (shorthand)
 * filter: { name: 'Frodo' }
 *
 * // Negation
 * filter: { race: { neq: 'Orc' } }
 *
 * // Include multiple values
 * filter: { race: { in: ['Hobbit', 'Human', 'Elf'] } }
 *
 * // Exclude multiple values
 * filter: { race: { nin: ['Orc', 'Goblin', 'Troll'] } }
 *
 * // Field exists
 * filter: { name: { exists: true } }
 *
 * // Field does not exist
 * filter: { name: { exists: false } }
 *
 * // Regex pattern (case-insensitive)
 * filter: { dialog: { regex: '/ring/i' } }
 *
 * // Negate regex
 * filter: { name: { regexNegate: '/sauron/i' } }
 * ```
 */
export interface StringFilter {
    /** Exact match: ?field=value */
    eq?: string
    /** Negate match: ?field!=value */
    neq?: string
    /** Include (comma-separated): ?field=a,b,c */
    in?: string[]
    /** Exclude (comma-separated): ?field!=a,b,c */
    nin?: string[]
    /** Field existence check: ?field (true) or ?!field (false) */
    exists?: boolean
    /** Regex match: ?field=/pattern/flags */
    regex?: string
    /** Negate regex: ?field!=/pattern/flags */
    regexNegate?: string
}

/**
 * A movie combined with all of its quotes.
 *
 * @remarks
 * Returned by {@link MoviesClient.getWithQuotes}. Combines two API calls
 * (`/movie/{id}` and `/movie/{id}/quote`) into a single SDK call.
 *
 * @example
 * ```ts
 * const result = await client.movies.getWithQuotes('5cd95395de30eff6ebccde5b');
 * console.log(result.movie.name);        // "The Fellowship of the Ring"
 * console.log(result.quotes.length);     // number of quotes from this movie
 * console.log(result.quotes[0]?.dialog); // first quote
 * ```
 */
export interface MovieWithQuotes {
    /** The movie details */
    movie: Movie
    /** All quotes from this movie */
    quotes: Quote[]
}

/**
 * A quote with its associated movie details embedded.
 *
 * @remarks
 * Returned by {@link QuotesClient.getWithMovie}. Combines two API calls
 * (`/quote/{id}` and `/movie/{id}`) into a single SDK call, replacing the
 * raw `movie` ID with a full {@link Movie} object under `movieDetails`.
 *
 * @example
 * ```ts
 * const result = await client.quotes.getWithMovie('5cd96e05de30eff6ebcce7e9');
 * console.log(result.dialog);               // "You shall not pass!"
 * console.log(result.movieDetails.name);    // "The Fellowship of the Ring"
 * ```
 */
export interface QuoteWithMovie extends Quote {
    /** The full movie object this quote is from */
    movieDetails: Movie
}

/**
 * Filter options for movie queries.
 *
 * @remarks
 * All fields are optional. String fields (like `name`) accept either a plain string
 * for exact match or a {@link StringFilter} for advanced filtering. Numeric fields
 * accept a {@link NumericFilter} for range queries.
 *
 * @example
 * ```ts
 * // Exact name match
 * filter: { name: 'The Fellowship of the Ring' }
 *
 * // Name pattern (regex)
 * filter: { name: { regex: '/fellowship/i' } }
 *
 * // Oscar winners only
 * filter: { academyAwardWins: { gt: 0 } }
 *
 * // High-budget, high-grossing movies
 * filter: {
 *   budgetInMillions: { gte: 200 },
 *   boxOfficeRevenueInMillions: { gte: 500 }
 * }
 *
 * // Combined filters
 * filter: {
 *   name: { regex: '/ring/i' },
 *   academyAwardWins: { gte: 1 },
 *   runtimeInMinutes: { lte: 180 }
 * }
 * ```
 */
export interface MovieFilter {
    /** Movie name filter (exact match or StringFilter) */
    name?: string | StringFilter
    /** Budget in millions USD range filter */
    budgetInMillions?: NumericFilter
    /** Box office revenue in millions USD range filter */
    boxOfficeRevenueInMillions?: NumericFilter
    /** Runtime in minutes range filter */
    runtimeInMinutes?: NumericFilter
    /** Academy Award nominations count range filter */
    academyAwardNominations?: NumericFilter
    /** Academy Award wins count range filter */
    academyAwardWins?: NumericFilter
    /** Rotten Tomatoes score (0-100) range filter */
    rottenTomatoesScore?: NumericFilter
}

/**
 * Filter options for quote queries.
 *
 * @remarks
 * All fields are optional. String fields accept either a plain string for exact match
 * or a {@link StringFilter} for advanced filtering.
 *
 * @example
 * ```ts
 * // Exact dialog match
 * filter: { dialog: 'You shall not pass!' }
 *
 * // Dialog contains text (regex)
 * filter: { dialog: { regex: '/ring/i' } }
 *
 * // Quotes from specific movie
 * filter: { movie: '5cd95395de30eff6ebccde5b' }
 *
 * // Quotes from specific character
 * filter: { character: '5cd99d4bde30eff6ebccfea3' }
 *
 * // Negation: quotes NOT containing "ring"
 * filter: { dialog: { regexNegate: '/ring/i' } }
 *
 * // Multiple filters
 * filter: {
 *   movie: '5cd95395de30eff6ebccde5b',
 *   dialog: { regex: '/shall/i' }
 * }
 * ```
 */
export interface QuoteFilter {
    /** Quote dialogue text filter (exact match or StringFilter) */
    dialog?: string | StringFilter
    /** Movie ID filter to get quotes from specific movie */
    movie?: string | StringFilter
    /** Character ID filter to get quotes from specific character */
    character?: string | StringFilter
}

/**
 * Sorting options for list queries.
 *
 * @remarks
 * Specifies which field to sort by and the sort direction.
 *
 * @example
 * ```ts
 * // Sort movies by name ascending
 * { sort: { field: 'name', order: 'asc' } }
 *
 * // Sort quotes by character descending
 * { sort: { field: 'character', order: 'desc' } }
 * ```
 */
export interface SortOptions {
    /** The field to sort by */
    field: string
    /** Sort direction: ascending or descending */
    order: 'asc' | 'desc'
}

/**
 * Pagination options for list queries.
 *
 * @remarks
 * Controls how many results to return and which page to fetch.
 *
 * @example
 * ```ts
 * // Get first 10 results
 * { pagination: { limit: 10, page: 1 } }
 *
 * // Get next 10 results
 * { pagination: { limit: 10, page: 2 } }
 *
 * // Use offset instead of page
 * { pagination: { limit: 10, offset: 20 } }
 * ```
 */
export interface PaginationOptions {
    /** Maximum number of results to return per page */
    limit?: number
    /** Page number (1-indexed) */
    page?: number
    /** Number of results to skip (alternative to page) */
    offset?: number
}

/**
 * Configuration options for the LotR API client.
 *
 * @remarks
 * All options are optional except for the API key requirement (see {@link LotrClient} constructor
 * for API key sourcing). Caching and retry are enabled by default given the API's strict rate limits.
 *
 * @example
 * ```ts
 * const config: LotrClientConfig = {
 *   apiKey: 'your-key',
 *   cache: { enabled: true, ttl: 300_000 },
 *   retry: { enabled: true, maxAttempts: 3 }
 * };
 *
 * const client = new LotrClient(config);
 * ```
 */
export interface LotrClientConfig {
    /**
     * The One API key.
     *
     * @remarks
     * Can be provided here or via the `LOTR_API_KEY` environment variable.
     * If neither is provided, construction will throw an {@link AuthenticationError}.
     */
    apiKey?: string

    /**
     * Override the base API URL.
     *
     * @remarks
     * Defaults to `https://the-one-api.dev/v2`. Useful for testing against local mock servers.
     */
    baseUrl?: string

    /**
     * Retry configuration options.
     *
     * @remarks
     * Retry only applies to HTTP 429 (rate limit exceeded) errors. Authentication errors (401)
     * and not found errors (404) are never retried as they will not resolve by waiting.
     * Uses exponential backoff with jitter to prevent thundering herd.
     *
     * @default `{ enabled: true, maxAttempts: 3 }`
     */
    retry?: { enabled?: boolean; maxAttempts?: number }

    /**
     * Cache configuration options.
     *
     * @remarks
     * Cache is keyed by full URL including query parameters. Different filter combinations
     * are cached independently. Cache is per-client instance and does not persist across
     * process restarts.
     *
     * Given the API's strict rate limit (100 requests per 10 minutes) and static data,
     * caching is enabled by default.
     *
     * @default `{ enabled: true, ttl: 300_000 }` (5 minutes)
     */
    cache?: { enabled?: boolean; ttl?: number }
}

/**
 * Query options for list endpoints.
 *
 * @remarks
 * Combines filtering, sorting, and pagination options for list queries.
 * All options are optional and can be combined.
 *
 * @template TFilter - The filter type (e.g., MovieFilter or QuoteFilter)
 *
 * @example
 * ```ts
 * // Filter only
 * const movies = await client.movies.list({
 *   filter: { academyAwardWins: { gt: 0 } }
 * });
 *
 * // Sort and paginate
 * const quotes = await client.quotes.list({
 *   sort: { field: 'dialog', order: 'asc' },
 *   pagination: { limit: 20, page: 1 }
 * });
 *
 * // All options combined
 * const results = await client.movies.list({
 *   filter: { budgetInMillions: { lt: 100 } },
 *   sort: { field: 'name', order: 'desc' },
 *   pagination: { limit: 5, page: 1 }
 * });
 * ```
 */
export interface QueryOptions<TFilter> {
    /** Filter criteria to apply */
    filter?: TFilter
    /** Sort options */
    sort?: SortOptions
    /** Pagination options */
    pagination?: PaginationOptions
}