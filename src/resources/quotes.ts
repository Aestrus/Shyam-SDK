import type { HttpClient } from '../http-client.js';
import type { Quote, PaginatedResponse, QueryOptions, QuoteFilter } from '../types.js';
import { serializeQueryOptions } from '../query-serializer.js';
import { NotFoundError } from '../errors.js';

export class QuotesClient {
    constructor(private readonly http: HttpClient) {}

    async list(options: QueryOptions<QuoteFilter> = {}): Promise<PaginatedResponse<Quote>> {
        const qs = serializeQueryOptions(options) || undefined;
        return this.http.get<PaginatedResponse<Quote>>('/quote', qs);
    }

    async getById(id: string): Promise<Quote> {
        const response = await this.http.get<PaginatedResponse<Quote>>(`/quote/${id}`, undefined);
        const quote = response.docs[0];
        if (!quote) throw new NotFoundError(`Quote with id '${id}' not found`);
        return quote;
    }
}
