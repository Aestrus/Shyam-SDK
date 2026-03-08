/**
 * Base error class for all LotR API errors.
 *
 * @remarks
 * All errors thrown by the SDK extend this class, allowing consumers to catch
 * all SDK errors with a single `instanceof LotrApiError` check.
 *
 * @example
 * ```ts
 * try {
 *   await client.movies.getById(id);
 * } catch (err) {
 *   if (err instanceof LotrApiError) {
 *     console.error(`API Error: ${err.message} (Status: ${err.statusCode})`);
 *   }
 * }
 * ```
 *
 * @example
 * ```ts
 * // Catch all SDK errors
 * try {
 *   await client.movies.list();
 * } catch (err) {
 *   if (err instanceof LotrApiError) {
 *     // Handle any API error
 *     handleApiError(err);
 *   } else {
 *     // Handle non-API errors
 *     throw err;
 *   }
 * }
 * ```
 */
export class LotrApiError extends Error {
    /**
     * The HTTP status code associated with this error.
     *
     * @remarks
     * Will be `undefined` for errors that don't have a specific HTTP status.
     */
    public readonly statusCode?: number;

    /**
     * Creates a new LotrApiError.
     *
     * @param message - Human-readable error message
     * @param statusCode - HTTP status code associated with this error
     */
    constructor(message: string, statusCode?: number) {
        super(message);
        this.name = 'LotrApiError';
        Object.setPrototypeOf(this, new.target.prototype);
        if (statusCode !== undefined) {
            this.statusCode = statusCode;
        }
    }
}

/**
 * Thrown when API authentication fails.
 *
 * @remarks
 * This error occurs when the API key is missing, invalid, or expired.
 * It corresponds to HTTP 401 responses from the API.
 *
 * @example
 * ```ts
 * try {
 *   const client = new LotrClient({ apiKey: 'invalid-key' });
 *   await client.movies.list();
 * } catch (err) {
 *   if (err instanceof AuthenticationError) {
 *     console.error('Authentication failed. Please check your API key.');
 *     console.error('Get an API key at: https://the-one-api.dev/sign-up');
 *   }
 * }
 * ```
 *
 * @example
 * ```ts
 * // Handle missing API key
 * try {
 *   const client = new LotrClient(); // No API key provided
 *   await client.movies.list();
 * } catch (err) {
 *   if (err instanceof AuthenticationError) {
 *     console.error('Please set LOTR_API_KEY environment variable or pass apiKey config');
 *   }
 * }
 * ```
 */
export class AuthenticationError extends LotrApiError {
    constructor() {
        super('Invalid or missing API key.', 401);
        this.name = 'AuthenticationError';
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

/**
 * Thrown when the API rate limit is exceeded.
 *
 * @remarks
 * The One API allows 100 requests per 10 minutes. This error is thrown
 * when that limit is exceeded and all retry attempts have been exhausted.
 * Corresponds to HTTP 429 responses.
 *
 * The SDK automatically retries 429 responses with exponential backoff.
 * This error only appears when all retry attempts fail.
 *
 * @example
 * ```ts
 * try {
 *   await client.movies.list();
 * } catch (err) {
 *   if (err instanceof RateLimitError) {
 *     console.error('Rate limit exceeded. Please wait before retrying.');
 *     console.error('Consider increasing cache TTL to reduce API calls.');
 *   }
 * }
 * ```
 *
 * @example
 * ```ts
 * // Configure for high-volume requests
 * const client = new LotrClient({
 *   apiKey: 'your-key',
 *   cache: { ttl: 600_000 }, // 10 minutes - cache longer
 *   retry: { maxAttempts: 5 } // Retry more times
 * });
 * ```
 */
export class RateLimitError extends LotrApiError {
    constructor() {
        super('Rate limit exceeded.', 429);
        this.name = 'RateLimitError';
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

/**
 * Thrown when the API returns a server-side error.
 *
 * @remarks
 * Corresponds to HTTP 500 responses. On this API, sorting on the `/movie`
 * and `/quote` endpoints is a known cause of 500 errors (upstream bug).
 *
 * @example
 * ```ts
 * try {
 *   await client.movies.list({ sort: { field: 'name', order: 'asc' } });
 * } catch (err) {
 *   if (err instanceof ServerError) {
 *     // Known upstream bug: sort is not supported on /movie
 *     console.error('Server error — try removing the sort option');
 *   }
 * }
 * ```
 */
export class ServerError extends LotrApiError {
    constructor(message = 'Internal server error.') {
        super(message, 500);
        this.name = 'ServerError';
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

/**
 * Thrown when the API rejects a request due to invalid parameters.
 *
 * @remarks
 * Corresponds to HTTP 400 responses. Typically indicates a malformed
 * query string or invalid field value that the API cannot process.
 *
 * @example
 * ```ts
 * try {
 *   await client.movies.list();
 * } catch (err) {
 *   if (err instanceof ValidationError) {
 *     console.error('Bad request — check your filter or pagination options');
 *   }
 * }
 * ```
 */
export class ValidationError extends LotrApiError {
    constructor(message = 'Bad request.') {
        super(message, 400);
        this.name = 'ValidationError';
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

/**
 * Thrown when a requested resource is not found.
 *
 * @remarks
 * This error occurs when requesting a movie or quote with an ID that
 * does not exist in the API. Corresponds to HTTP 404 responses.
 *
 * @example
 * ```ts
 * try {
 *   await client.movies.getById('non-existent-id');
 * } catch (err) {
 *   if (err instanceof NotFoundError) {
 *     console.error('Movie not found');
 *   }
 * }
 * ```
 *
 * @example
 * ```ts
 * // Handle missing resources gracefully
 * async function getMovieOrNull(id: string): Promise<Movie | null> {
 *   try {
 *     return await client.movies.getById(id);
 *   } catch (err) {
 *     if (err instanceof NotFoundError) {
 *       return null;
 *     }
 *     throw err; // Re-throw other errors
 *   }
 * }
 * ```
 */
export class NotFoundError extends LotrApiError {
    constructor(message = 'Resource not found.') {
        super(message, 404);
        this.name = 'NotFoundError';
        Object.setPrototypeOf(this, new.target.prototype);
    }
}