import type { HttpClient } from '../http-client.js';
import type { Movie, Quote, PaginatedResponse, QueryOptions, MovieFilter, QuoteFilter } from '../types.js';
import { serializeQueryOptions } from '../query-serializer.js';
import { NotFoundError } from '../errors.js';

export class MoviesClient {
    // HttpClient is injected — MoviesClient never creates one itself
    constructor(private readonly http: HttpClient) {}

    async list(options: QueryOptions<MovieFilter> = {}): Promise<PaginatedResponse<Movie>> {
        const qs = serializeQueryOptions(options) || undefined;
        return this.http.get<PaginatedResponse<Movie>>('/movie', qs);
    }

    async getById(id: string): Promise<Movie> {
        const response = await this.http.get<PaginatedResponse<Movie>>(`/movie/${id}`, undefined);
        const movie = response.docs[0];
        if (!movie) throw new NotFoundError(`Movie with id '${id}' not found`);
        return movie;
    }

    async getQuotes(movieId: string, options: QueryOptions<QuoteFilter> = {}): Promise<PaginatedResponse<Quote>> {
        const qs = serializeQueryOptions(options) || undefined;
        return this.http.get<PaginatedResponse<Quote>>(`/movie/${movieId}/quote`, qs);
    }
}
