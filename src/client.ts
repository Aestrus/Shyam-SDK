import { HttpClient } from './http-client.js';
import { MoviesClient } from './resources/movies.js';
import { QuotesClient } from './resources/quotes.js';
import type { LotrClientConfig } from './types.js';

/**
 * Lord of the Rings API client.
 *
 * @remarks
 * The main entry point for interacting with The One API. This client provides
 * access to movie and quote resources through its {@link movies} and {@link quotes} properties.
 *
 * The client requires an API key, which can be provided via the `apiKey` config option
 * or the `LOTR_API_KEY` environment variable. If neither is present, construction will
 * throw an {@link AuthenticationError} immediately.
 *
 * @example
 * ```ts
 * // Direct API key
 * const client = new LotrClient({ apiKey: 'your-api-key' });
 *
 * // Environment variable (LOTR_API_KEY)
 * const client = new LotrClient();
 *
 * // With custom base URL (for testing)
 * const client = new LotrClient({
 *   apiKey: 'key',
 *   baseUrl: 'http://localhost:3000'
 * });
 *
 * // Using the client
 * const movies = await client.movies.list();
 * const movie = await client.movies.getById('5cd95395de30eff6ebccde5b');
 * const quotes = await client.movies.getQuotes('5cd95395de30eff6ebccde5b');
 * ```
 */
export class LotrClient {
    /**
     * Client for LotR movie endpoints.
     *
     * @remarks
     * Provides methods to list, retrieve, and query movies. All methods support
     * filtering, sorting, and pagination via the `QueryOptions` parameter.
     *
     * @example
     * ```ts
     * const movies = await client.movies.list({
     *   filter: { academyAwardWins: { gt: 0 } },
     *   pagination: { limit: 10 }
     * });
     * ```
     */
    public readonly movies: MoviesClient;

    /**
     * Client for LotR quote endpoints.
     *
     * @remarks
     * Provides methods to list and retrieve quotes. All methods support
     * filtering, sorting, and pagination via the `QueryOptions` parameter.
     *
     * @example
     * ```ts
     * const quotes = await client.quotes.list({
     *   filter: { movie: '5cd95395de30eff6ebccde5b' }
     * });
     * ```
     */
    public readonly quotes: QuotesClient;

    /**
     * Creates a new LotR API client instance.
     *
     * @remarks
     * The client requires an API key, which can be provided via the `apiKey` config option
     * or the `LOTR_API_KEY` environment variable. If neither is present, construction will
     * throw an error immediately.
     *
     * @param config - Client configuration options
     * @throws {@link AuthenticationError}
     * Thrown when no API key is provided and `LOTR_API_KEY` environment variable is not set.
     *
     * @example
     * ```ts
     * // Direct API key
     * const client = new LotrClient({ apiKey: 'your-api-key' });
     *
     * // Environment variable
     * const client = new LotrClient(); // uses LOTR_API_KEY env var
     *
     * // With custom base URL (for testing)
     * const client = new LotrClient({ apiKey: 'key', baseUrl: 'http://localhost:3000' });
     *
     * // With custom cache settings
     * const client = new LotrClient({
     *   apiKey: 'key',
     *   cache: { enabled: true, ttl: 600_000 } // 10 minutes
     * });
     * ```
     */
    constructor(config: LotrClientConfig = {}) {
        const http = new HttpClient(config);
        this.movies = new MoviesClient(http);
        this.quotes = new QuotesClient(http);
    }
}
