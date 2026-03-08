import type { HttpClient } from '../http-client.js';
import type { Movie, Quote, MovieWithQuotes, PaginatedResponse, QueryOptions, MovieFilter, QuoteFilter } from '../types.js';
import { serializeQueryOptions } from '../query-serializer.js';
import { NotFoundError } from '../errors.js';

/**
 * Client for LotR movie endpoints.
 *
 * @remarks
 * Provides methods to list, retrieve, and query movies. All methods support
 * filtering, sorting, and pagination via the {@link QueryOptions} parameter.
 *
 * Access via the {@link LotrClient.movies} property:
 * ```ts
 * const client = new LotrClient({ apiKey: 'your-api-key' });
 * const movies = await client.movies.list();
 * ```
 *
 * @example
 * ```ts
 * // List all Oscar-winning movies
 * const result = await client.movies.list({
 *   filter: { academyAwardWins: { gt: 0 } }
 * });
 * console.log(result.docs);
 *
 * // Get a specific movie
 * const movie = await client.movies.getById('5cd95395de30eff6ebccde5b');
 * console.log(movie.name);
 *
 * // Get quotes from a movie
 * const quotes = await client.movies.getQuotes('5cd95395de30eff6ebccde5b');
 * console.log(quotes.docs);
 * ```
 */
export class MoviesClient {
    /**
     * Creates a new MoviesClient instance.
     *
     * @remarks
     * HttpClient is injected — MoviesClient never creates one itself.
     * This constructor is for internal use by the SDK.
     *
     * @internal
     */
    constructor(private readonly http: HttpClient) {}

    /**
     * Lists all movies with optional filtering, sorting, and pagination.
     *
     * @param options - Query options for filtering, sorting, and pagination
     * @returns Paginated response containing array of movies and metadata
     *
     * @throws {@link RateLimitError}
     * Thrown when API rate limit is exceeded after all retry attempts.
     * @throws {@link AuthenticationError}
     * Thrown when API key is invalid or missing.
     *
     * @example
     * ```ts
     * // Get all movies
     * const result = await client.movies.list();
     * console.log(result.docs); // Movie[]
     *
     * // Get Oscar-winning movies only
     * const result = await client.movies.list({
     *   filter: { academyAwardWins: { gt: 0 } }
     * });
     *
     * // Sort by runtime, limit to 5 results
     * const result = await client.movies.list({
     *   sort: { field: 'runtimeInMinutes', order: 'desc' },
     *   pagination: { limit: 5 }
     * });
     *
     * // Complex query: high-budget, award-winning movies
     * const result = await client.movies.list({
     *   filter: {
     *     budgetInMillions: { gte: 200 },
     *     academyAwardWins: { gte: 1 }
     *   },
     *   sort: { field: 'academyAwardWins', order: 'desc' },
     *   pagination: { limit: 10, page: 1 }
     * });
     *
     * // Access pagination metadata
     * const result = await client.movies.list();
     * console.log(`Found ${result.total} movies`);
     * console.log(`Page ${result.page} of ${result.pages}`);
     * ```
     */
    async list(options: QueryOptions<MovieFilter> = {}): Promise<PaginatedResponse<Movie>> {
        const qs = serializeQueryOptions(options) || undefined;
        return this.http.get<PaginatedResponse<Movie>>('/movie', qs);
    }

    /**
     * Retrieves a single movie by its ID.
     *
     * @param id - The movie ID (24-character hex string)
     * @returns The movie object
     *
     * @throws {@link NotFoundError}
     * Thrown when no movie exists with the given ID.
     * @throws {@link AuthenticationError}
     * Thrown when API key is invalid or missing.
     *
     * @example
     * ```ts
     * // Get a specific movie
     * const movie = await client.movies.getById('5cd95395de30eff6ebccde5c');
     * console.log(movie.name); // "The Fellowship of the Ring"
     * console.log(movie.runtimeInMinutes); // 178
     * console.log(movie.academyAwardWins); // 4
     * console.log(movie.budgetInMillions); // 93
     *
     * // Handle missing movie
     * try {
     *   const movie = await client.movies.getById('invalid-id');
     * } catch (err) {
     *   if (err instanceof NotFoundError) {
     *     console.error('Movie not found');
     *   }
     * }
     * ```
     */
    async getById(id: string): Promise<Movie> {
        const response = await this.http.get<PaginatedResponse<Movie>>(`/movie/${id}`, undefined);
        const movie = response.docs[0];
        if (!movie) throw new NotFoundError(`Movie with id '${id}' not found`);
        return movie;
    }

    /**
     * Retrieves all quotes for a specific movie.
     *
     * @remarks
     * **API Limitation:** This endpoint only returns quotes for the Lord of the Rings trilogy.
     * Hobbit movie IDs will return empty results (upstream API limitation).
     *
     * LotR trilogy movie IDs:
     * - The Two Towers: `5cd95395de30eff6ebccde5b`
     * - The Fellowship of the Ring: `5cd95395de30eff6ebccde5c`
     * - The Return of the King: `5cd95395de30eff6ebccde5d`
     *
     * @param movieId - The movie ID to get quotes for
     * @param options - Query options for filtering, sorting, and pagination
     * @returns Paginated response containing array of quotes from the movie
     *
     * @throws {@link NotFoundError}
     * Thrown when no movie exists with the given ID.
     * @throws {@link AuthenticationError}
     * Thrown when API key is invalid or missing.
     *
     * @example
     * ```ts
     * // Get all quotes from Fellowship of the Ring
     * const quotes = await client.movies.getQuotes('5cd95395de30eff6ebccde5c', {
     *   pagination: { limit: 10 }
     * });
     * console.log(quotes.docs);
     *
     * // Get quotes and filter by character
     * const quotes = await client.movies.getQuotes('5cd95395de30eff6ebccde5c', {
     *   filter: { dialog: { regex: '/ring/i' } }
     * });
     *
     * // Paginate through all quotes
     * let page = 1;
     * const allQuotes: Quote[] = [];
     * while (true) {
     *   const result = await client.movies.getQuotes('5cd95395de30eff6ebccde5c', {
     *     pagination: { limit: 100, page }
     *   });
     *   allQuotes.push(...result.docs);
     *   if (page >= result.pages) break;
     *   page++;
     * }
     * ```
     */
    async getQuotes(movieId: string, options: QueryOptions<QuoteFilter> = {}): Promise<PaginatedResponse<Quote>> {
        const qs = serializeQueryOptions(options) || undefined;
        return this.http.get<PaginatedResponse<Quote>>(`/movie/${movieId}/quote`, qs);
    }

    /**
     * Retrieves a movie and all of its quotes in a single SDK call.
     *
     * @remarks
     * Combines `/movie/{id}` and `/movie/{id}/quote` into one call using
     * `Promise.all`, so both requests run in parallel. Returns a flat array
     * of quotes rather than a paginated response.
     *
     * **API Limitation:** Quote retrieval only works for the LotR trilogy.
     * Hobbit movie IDs will return an empty `quotes` array.
     *
     * @param movieId - The movie ID to fetch
     * @returns An object containing the movie and its quotes
     *
     * @throws {@link NotFoundError}
     * Thrown when no movie exists with the given ID.
     * @throws {@link AuthenticationError}
     * Thrown when API key is invalid or missing.
     *
     * @example
     * ```ts
     * const { movie, quotes } = await client.movies.getWithQuotes('5cd95395de30eff6ebccde5c');
     * console.log(movie.name);        // "The Fellowship of the Ring"
     * console.log(quotes.length);     // total quotes from this movie
     * console.log(quotes[0]?.dialog); // first quote
     * ```
     */
    async getWithQuotes(movieId: string): Promise<MovieWithQuotes> {
        const [movie, quotesResponse] = await Promise.all([
            this.getById(movieId),
            this.getQuotes(movieId, { pagination: { limit: 1000 } }),
        ]);
        return { movie, quotes: quotesResponse.docs };
    }

    /**
     * Finds a movie by its exact title.
     *
     * @remarks
     * Delegates to `list()` with an exact name filter and returns the first
     * match. Returns `undefined` rather than throwing when no movie is found,
     * making it safe to use without a try/catch.
     *
     * Useful when you know the title but not the ID, avoiding the need to
     * list all movies and search manually.
     *
     * @param name - The exact movie title to search for
     * @returns The matching movie, or `undefined` if not found
     *
     * @throws {@link AuthenticationError}
     * Thrown when API key is invalid or missing.
     *
     * @example
     * ```ts
     * const movie = await client.movies.findByName('The Fellowship of the Ring');
     * if (movie) {
     *   console.log(movie._id); // use the ID for further queries
     * }
     *
     * // Returns undefined for no match — no try/catch needed
     * const missing = await client.movies.findByName('The Silmarillion');
     * console.log(missing); // undefined
     * ```
     */
    async findByName(name: string): Promise<Movie | undefined> {
        const result = await this.list({ filter: { name } });
        return result.docs[0];
    }

    /**
     * Iterates through all movies using async pagination.
     *
     * @remarks
     * This method automatically handles pagination, yielding each movie one at a time.
     * It's memory-efficient for large result sets as it doesn't load all records into memory.
     *
     * The method uses a maximum page size of 100 for efficiency, fetching multiple pages
     * as needed until all movies have been yielded.
     *
     * @param options - Optional query options for filtering and sorting (pagination is handled automatically)
     * @returns Async iterable yielding each movie
     *
     * @throws {@link RateLimitError}
     * Thrown when API rate limit is exceeded after all retry attempts.
     * @throws {@link AuthenticationError}
     * Thrown when API key is invalid or missing.
     *
     * @example
     * ```ts
     * // Iterate through all movies
     * for await (const movie of client.movies.all()) {
     *   console.log(movie.name);
     * }
     *
     * // With filter
     * for await (const movie of client.movies.all({ filter: { academyAwardWins: { gt: 0 } } })) {
     *   console.log(`${movie.name}: ${movie.academyAwardWins} Oscars`);
     * }
     *
     * // Memory efficient — doesn't load all records into memory at once
     * const count = { 'Gandalf': 0, 'Frodo': 0 };
     * for await (const movie of client.movies.all()) {
     *   // Only keep counts, not all movies
     *   if (movie.name.includes('Gandalf')) count.Gandalf++;
     *   if (movie.name.includes('Frodo')) count.Frodo++;
     * }
     * ```
     */
    async *all(options?: Omit<QueryOptions<MovieFilter>, 'pagination'>): AsyncIterable<Movie> {
        let page = 1;
        const limit = 100; // Use max limit for efficiency

        while (true) {
            const result = await this.list({
                ...options,
                pagination: { limit, page }
            });

            // Yield each movie from this page
            for (const movie of result.docs) {
                yield movie;
            }

            // Check if we've fetched all pages
            if (page >= result.pages) break;
            page++;
        }
    }
}
