import type { HttpClient } from '../http-client.js';
import type { Movie, Quote, QuoteWithMovie, PaginatedResponse, QueryOptions, QuoteFilter } from '../types.js';
import { serializeQueryOptions } from '../query-serializer.js';
import { NotFoundError } from '../errors.js';

/**
 * Client for LotR quote endpoints.
 *
 * @remarks
 * Provides methods to list and retrieve quotes. All methods support
 * filtering, sorting, and pagination via the {@link QueryOptions} parameter.
 *
 * Access via the {@link LotrClient.quotes} property:
 * ```ts
 * const client = new LotrClient({ apiKey: 'your-api-key' });
 * const quotes = await client.quotes.list();
 * ```
 *
 * @example
 * ```ts
 * // Get all quotes from a specific movie
 * const quotes = await client.quotes.list({
 *   filter: { movie: '5cd95395de30eff6ebccde5b' }
 * });
 *
 * // Get a specific quote
 * const quote = await client.quotes.getById('5cd96e05de30eff6ebccec8a');
 *
 * // Search for quotes by text (regex)
 * const quotes = await client.quotes.list({
 *   filter: { dialog: { regex: '/ring/i' } }
 * });
 * ```
 */
export class QuotesClient {
    /**
     * Creates a new QuotesClient instance.
     *
     * @remarks
     * HttpClient is injected — QuotesClient never creates one itself.
     * This constructor is for internal use by the SDK.
     *
     * @internal
     */
    constructor(private readonly http: HttpClient) {}

    /**
     * Lists all quotes with optional filtering, sorting, and pagination.
     *
     * @param options - Query options for filtering, sorting, and pagination
     * @returns Paginated response containing array of quotes and metadata
     *
     * @throws {@link RateLimitError}
     * Thrown when API rate limit is exceeded after all retry attempts.
     * @throws {@link AuthenticationError}
     * Thrown when API key is invalid or missing.
     *
     * @example
     * ```ts
     * // Get all quotes
     * const result = await client.quotes.list();
     * console.log(result.docs); // Quote[]
     *
     * // Get quotes from a specific movie
     * const result = await client.quotes.list({
     *   filter: { movie: '5cd95395de30eff6ebccde5b' }
     * });
     *
     * // Get quotes from a specific character
     * const result = await client.quotes.list({
     *   filter: { character: '5cd99d4bde30eff6ebccfea3' }
     * });
     *
     * // Search for quotes containing specific text (regex)
     * const result = await client.quotes.list({
     *   filter: { dialog: { regex: '/shall not pass/i' } }
     * });
     *
     * // Complex query: quotes from Fellowship, sorted by dialog
     * const result = await client.quotes.list({
     *   filter: {
     *     movie: '5cd95395de30eff6ebccde5c',
     *     dialog: { regex: '/the/i' }
     *   },
     *   sort: { field: 'dialog', order: 'asc' },
     *   pagination: { limit: 20, page: 1 }
     * });
     *
     * // Negation: quotes NOT containing "ring"
     * const result = await client.quotes.list({
     *   filter: { dialog: { regexNegate: '/ring/i' } }
     * });
     *
     * // Field existence: quotes with empty dialog
     * const result = await client.quotes.list({
     *   filter: { dialog: { exists: false } }
     * });
     * ```
     */
    async list(options: QueryOptions<QuoteFilter> = {}): Promise<PaginatedResponse<Quote>> {
        const qs = serializeQueryOptions(options) || undefined;
        return this.http.get<PaginatedResponse<Quote>>('/quote', qs);
    }

    /**
     * Retrieves a single quote by its ID.
     *
     * @param id - The quote ID (24-character hex string)
     * @returns The quote object
     *
     * @throws {@link NotFoundError}
     * Thrown when no quote exists with the given ID.
     * @throws {@link AuthenticationError}
     * Thrown when API key is invalid or missing.
     *
     * @example
     * ```ts
     * // Get a specific quote
     * const quote = await client.quotes.getById('5cd96e05de30eff6ebccec8a');
     * console.log(quote.dialog); // "You shall not pass!"
     * console.log(quote.character); // character ID
     * console.log(quote.movie); // movie ID
     *
     * // Handle missing quote
     * try {
     *   const quote = await client.quotes.getById('invalid-id');
     * } catch (err) {
     *   if (err instanceof NotFoundError) {
     *     console.error('Quote not found');
     *   }
     * }
     * ```
     */
    async getById(id: string): Promise<Quote> {
        const response = await this.http.get<PaginatedResponse<Quote>>(`/quote/${id}`, undefined);
        const quote = response.docs[0];
        if (!quote) throw new NotFoundError(`Quote with id '${id}' not found`);
        return quote;
    }

    /**
     * Retrieves a quote with its associated movie details embedded.
     *
     * @remarks
     * Combines `/quote/{id}` and `/movie/{id}` into two sequential calls,
     * replacing the raw `movie` ID string with a full {@link Movie} object
     * under `movieDetails`. All original {@link Quote} fields are preserved.
     *
     * @param quoteId - The quote ID to fetch
     * @returns The quote with a `movieDetails` property containing the full movie object
     *
     * @throws {@link NotFoundError}
     * Thrown when no quote exists with the given ID.
     * @throws {@link AuthenticationError}
     * Thrown when API key is invalid or missing.
     *
     * @example
     * ```ts
     * const result = await client.quotes.getWithMovie('5cd96e05de30eff6ebccec8a');
     * console.log(result.dialog);               // "You shall not pass!"
     * console.log(result.movieDetails.name);    // "The Two Towers"
     * console.log(result.movieDetails.academyAwardWins); // 2
     * ```
     */
    async getWithMovie(quoteId: string): Promise<QuoteWithMovie> {
        const quote = await this.getById(quoteId);
        const movieResponse = await this.http.get<PaginatedResponse<Movie>>(`/movie/${quote.movie}`, undefined);
        const movie = movieResponse.docs[0];
        if (!movie) throw new NotFoundError(`Movie with id '${quote.movie}' not found`);
        return { ...quote, movieDetails: movie };
    }

    /**
     * Searches all quotes by dialog text using a case-insensitive match.
     *
     * @remarks
     * An async iterator that applies a case-insensitive regex filter on the
     * `dialog` field and yields matching quotes across all pages. Equivalent
     * to `all({ filter: { dialog: { regex: '/term/i' } } })` but with a
     * simpler API for the common case of text search.
     *
     * @param term - The text to search for in quote dialog
     * @returns Async iterable yielding each matching quote
     *
     * @throws {@link AuthenticationError}
     * Thrown when API key is invalid or missing.
     *
     * @example
     * ```ts
     * // Find all quotes mentioning "ring"
     * for await (const quote of client.quotes.search('ring')) {
     *   console.log(quote.dialog);
     * }
     *
     * // Count quotes without storing them all
     * let count = 0;
     * for await (const _ of client.quotes.search('precious')) {
     *   count++;
     * }
     * console.log(`Found ${count} quotes`);
     * ```
     */
    async *search(term: string): AsyncIterable<Quote> {
        yield* this.all({ filter: { dialog: { regex: `/${term}/i` } } });
    }

    /**
     * Iterates through all quotes using async pagination.
     *
     * @remarks
     * This method automatically handles pagination, yielding each quote one at a time.
     * It's memory-efficient for large result sets as it doesn't load all records into memory.
     *
     * The method uses a maximum page size of 100 for efficiency, fetching multiple pages
     * as needed until all quotes have been yielded.
     *
     * @param options - Optional query options for filtering and sorting (pagination is handled automatically)
     * @returns Async iterable yielding each quote
     *
     * @throws {@link RateLimitError}
     * Thrown when API rate limit is exceeded after all retry attempts.
     * @throws {@link AuthenticationError}
     * Thrown when API key is invalid or missing.
     *
     * @example
     * ```ts
     * // Iterate through all quotes
     * for await (const quote of client.quotes.all()) {
     *   console.log(quote.dialog);
     * }
     *
     * // With filter for specific movie
     * for await (const quote of client.quotes.all({ filter: { movie: 'movie-id' } })) {
     *   console.log(`"${quote.dialog}"`);
     * }
     *
     * // Search for quotes by text
     * for await (const quote of client.quotes.all({ filter: { dialog: { regex: '/ring/i' } } })) {
     *   console.log(quote.dialog);
     * }
     *
     * // Memory efficient — count quotes without storing them all
     * let count = 0;
     * for await (const quote of client.quotes.all()) {
     *   if (quote.dialog.includes('ring')) count++;
     * }
     * ```
     */
    async *all(options?: Omit<QueryOptions<QuoteFilter>, 'pagination'>): AsyncIterable<Quote> {
        let page = 1;
        const limit = 100; // Use max limit for efficiency

        while (true) {
            const result = await this.list({
                ...options,
                pagination: { limit, page }
            });

            // Yield each quote from this page
            for (const quote of result.docs) {
                yield quote;
            }

            // Check if we've fetched all pages
            if (page >= result.pages) break;
            page++;
        }
    }
}
