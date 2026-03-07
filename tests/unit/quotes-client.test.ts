import { describe, it, expect, vi } from 'vitest';
import { QuotesClient } from '../../src/resources/quotes.js';
import type { HttpClient } from '../../src/http-client.js';
import type { PaginatedResponse, Quote } from '../../src/types.js';

function makeHttpMock(returnValue: unknown) {
    return {
        get: vi.fn().mockResolvedValue(returnValue),
    } as unknown as HttpClient;
}

const fakeQuote: Quote = {
    _id: 'q1',
    dialog: 'My precious.',
    movie: 'm1',
    character: 'c1',
    id: 'q1',
};

const fakePaginatedQuotes: PaginatedResponse<Quote> = {
    docs: [fakeQuote],
    total: 1, limit: 1000, offset: 0, page: 1, pages: 1,
};

describe('QuotesClient.list', () => {
    it('calls GET /quote with no query string when no options given', async () => {
        const http = makeHttpMock(fakePaginatedQuotes);
        const client = new QuotesClient(http);

        const result = await client.list();

        expect(http.get).toHaveBeenCalledWith('/quote', undefined);
        expect(result.docs).toHaveLength(1);
    });

    it('passes serialized filter as query string', async () => {
        const http = makeHttpMock(fakePaginatedQuotes);
        const client = new QuotesClient(http);

        await client.list({ filter: { movie: 'm1' } });

        expect(http.get).toHaveBeenCalledWith('/quote', 'movie=m1');
    });

    it('passes serialized pagination as query string', async () => {
        const http = makeHttpMock(fakePaginatedQuotes);
        const client = new QuotesClient(http);

        await client.list({ pagination: { limit: 10 } });

        expect(http.get).toHaveBeenCalledWith('/quote', 'limit=10');
    });
});

describe('QuotesClient.getById', () => {
    it('calls GET /quote/{id} and returns a single Quote', async () => {
        const http = makeHttpMock(fakePaginatedQuotes);
        const client = new QuotesClient(http);

        const quote = await client.getById('q1');

        expect(http.get).toHaveBeenCalledWith('/quote/q1', undefined);
        expect(quote.dialog).toBe('My precious.');
    });

    it('throws NotFoundError when docs is empty', async () => {
        const http = makeHttpMock({ docs: [], total: 0, limit: 1000, offset: 0, page: 1, pages: 1 });
        const client = new QuotesClient(http);

        const { NotFoundError } = await import('../../src/errors.js');
        await expect(client.getById('bad-id')).rejects.toThrow(NotFoundError);
    });
});
