import { describe, it, expect, vi } from 'vitest';
import { QuotesClient } from '../../src/resources/quotes.js';
import type { HttpClient } from '../../src/http-client.js';
import type { PaginatedResponse, Movie, Quote, QuoteWithMovie } from '../../src/types.js';

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

const fakeMovie: Movie = {
    _id: 'm1',
    name: 'The Fellowship of the Ring',
    runtimeInMinutes: 178,
    budgetInMillions: 93,
    boxOfficeRevenueInMillions: 871.5,
    academyAwardNominations: 13,
    academyAwardWins: 4,
    rottenTomatoesScore: 91,
};

const fakePaginatedQuotes: PaginatedResponse<Quote> = {
    docs: [fakeQuote],
    total: 1, limit: 1000, offset: 0, page: 1, pages: 1,
};

const fakePaginatedMovies: PaginatedResponse<Movie> = {
    docs: [fakeMovie],
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

describe('QuotesClient.all', () => {
    it('should iterate through all quotes using pagination', async () => {
        const page1: PaginatedResponse<Quote> = {
            docs: [
                { ...fakeQuote, _id: '1', dialog: 'Quote 1' },
                { ...fakeQuote, _id: '2', dialog: 'Quote 2' },
            ],
            total: 4,
            limit: 2,
            offset: 0,
            page: 1,
            pages: 2,
        };

        const page2: PaginatedResponse<Quote> = {
            docs: [
                { ...fakeQuote, _id: '3', dialog: 'Quote 3' },
                { ...fakeQuote, _id: '4', dialog: 'Quote 4' },
            ],
            total: 4,
            limit: 2,
            offset: 2,
            page: 2,
            pages: 2,
        };

        const http = {
            get: vi.fn()
                .mockResolvedValueOnce(page1)
                .mockResolvedValueOnce(page2),
        } as unknown as HttpClient;

        const client = new QuotesClient(http);
        const quotes: Quote[] = [];

        for await (const quote of client.all()) {
            quotes.push(quote);
        }

        expect(quotes).toHaveLength(4);
        expect(quotes[0]._id).toBe('1');
        expect(quotes[3]._id).toBe('4');

        expect(http.get).toHaveBeenCalledTimes(2);

        expect(http.get).toHaveBeenNthCalledWith(1, '/quote', 'limit=100&page=1');
        expect(http.get).toHaveBeenNthCalledWith(2, '/quote', 'limit=100&page=2');
    });

    it('should handle empty results', async () => {
        const emptyResult: PaginatedResponse<Quote> = {
            docs: [],
            total: 0,
            limit: 100,
            offset: 0,
            page: 1,
            pages: 0,
        };

        const http = makeHttpMock(emptyResult);
        const client = new QuotesClient(http);
        const quotes: Quote[] = [];

        for await (const quote of client.all()) {
            quotes.push(quote);
        }

        expect(quotes).toHaveLength(0);
        expect(http.get).toHaveBeenCalledTimes(1);
    });

    it('should handle single page of results', async () => {
        const singlePage: PaginatedResponse<Quote> = {
            docs: [
                { ...fakeQuote, _id: '1', dialog: 'Quote 1' },
            ],
            total: 1,
            limit: 100,
            offset: 0,
            page: 1,
            pages: 1,
        };

        const http = makeHttpMock(singlePage);
        const client = new QuotesClient(http);
        const quotes: Quote[] = [];

        for await (const quote of client.all()) {
            quotes.push(quote);
        }

        expect(quotes).toHaveLength(1);
        expect(http.get).toHaveBeenCalledTimes(1);
    });

    it('should pass filter options to pagination calls', async () => {
        const filteredResult: PaginatedResponse<Quote> = {
            docs: [{ ...fakeQuote, _id: '1', dialog: 'Quote 1', movie: 'm1' }],
            total: 1,
            limit: 100,
            offset: 0,
            page: 1,
            pages: 1,
        };

        const http = makeHttpMock(filteredResult);
        const client = new QuotesClient(http);
        const quotes: Quote[] = [];

        for await (const quote of client.all({ filter: { movie: 'm1' } })) {
            quotes.push(quote);
        }

        expect(quotes).toHaveLength(1);

        const queryString = (http.get as ReturnType<typeof vi.fn>).mock.calls[0][1] as string;
        expect(queryString).toContain('movie=m1');
        expect(queryString).toContain('limit=100');
        expect(queryString).toContain('page=1');
    });

    it('should pass sort options to pagination calls', async () => {
        const sortedResult: PaginatedResponse<Quote> = {
            docs: [{ ...fakeQuote, _id: '1', dialog: 'Quote 1' }],
            total: 1,
            limit: 100,
            offset: 0,
            page: 1,
            pages: 1,
        };

        const http = makeHttpMock(sortedResult);
        const client = new QuotesClient(http);
        const quotes: Quote[] = [];

        for await (const quote of client.all({ sort: { field: 'dialog', order: 'asc' } })) {
            quotes.push(quote);
        }

        expect(quotes).toHaveLength(1);

        const queryString = (http.get as ReturnType<typeof vi.fn>).mock.calls[0][1] as string;
        expect(queryString).toContain('sort=dialog:asc');
        expect(queryString).toContain('limit=100');
        expect(queryString).toContain('page=1');
    });
});

describe('QuotesClient.getWithMovie', () => {
    function makePathMock() {
        return {
            get: vi.fn().mockImplementation((path: string) => {
                if (path === '/quote/q1') return Promise.resolve(fakePaginatedQuotes);
                if (path === '/movie/m1') return Promise.resolve(fakePaginatedMovies);
            }),
        } as unknown as HttpClient;
    }

    it('returns the quote with its movie details embedded', async () => {
        const client = new QuotesClient(makePathMock());

        const result: QuoteWithMovie = await client.getWithMovie('q1');

        expect(result.dialog).toBe('My precious.');
        expect(result.movieDetails.name).toBe('The Fellowship of the Ring');
    });

    it('fetches quote then movie sequentially (two API calls)', async () => {
        const http = makePathMock();
        const client = new QuotesClient(http);

        await client.getWithMovie('q1');

        expect(http.get).toHaveBeenCalledTimes(2);
        expect(http.get).toHaveBeenNthCalledWith(1, '/quote/q1', undefined);
        expect(http.get).toHaveBeenNthCalledWith(2, '/movie/m1', undefined);
    });

    it('preserves all original quote fields on the enriched result', async () => {
        const client = new QuotesClient(makePathMock());

        const result: QuoteWithMovie = await client.getWithMovie('q1');

        expect(result._id).toBe('q1');
        expect(result.movie).toBe('m1');
        expect(result.character).toBe('c1');
    });
});

describe('QuotesClient.search', () => {
    it('yields quotes whose dialog matches the search term', async () => {
        const matchingQuote = { ...fakeQuote, dialog: 'My precious ring.' };
        const result: PaginatedResponse<Quote> = {
            docs: [matchingQuote],
            total: 1, limit: 100, offset: 0, page: 1, pages: 1,
        };
        const http = makeHttpMock(result);
        const client = new QuotesClient(http);

        const found: Quote[] = [];
        for await (const quote of client.search('ring')) {
            found.push(quote);
        }

        expect(found).toHaveLength(1);
        expect(found[0]?.dialog).toBe('My precious ring.');
    });

    it('passes the term as a case-insensitive regex filter on dialog', async () => {
        const result: PaginatedResponse<Quote> = {
            docs: [], total: 0, limit: 100, offset: 0, page: 1, pages: 0,
        };
        const http = makeHttpMock(result);
        const client = new QuotesClient(http);

        for await (const _ of client.search('precious')) { /* drain */ }

        const queryString = (http.get as ReturnType<typeof vi.fn>).mock.calls[0][1] as string;
        expect(queryString).toContain('dialog=/precious/i');
    });

    it('returns no results when no quotes match the term', async () => {
        const empty: PaginatedResponse<Quote> = {
            docs: [], total: 0, limit: 100, offset: 0, page: 1, pages: 0,
        };
        const http = makeHttpMock(empty);
        const client = new QuotesClient(http);

        const found: Quote[] = [];
        for await (const quote of client.search('xyzzy')) {
            found.push(quote);
        }

        expect(found).toHaveLength(0);
    });
});
