import { describe, it, expect, vi } from 'vitest';
import { MoviesClient } from '../../src/resources/movies.js';
import type { HttpClient } from '../../src/http-client.js';
import type { PaginatedResponse, Movie, Quote } from '../../src/types.js';

// We don't need a real HttpClient — just an object with a get() method we control.
// This is the same dependency injection pattern as HttpClient + fetch.
function makeHttpMock(returnValue: unknown) {
    return {
        get: vi.fn().mockResolvedValue(returnValue),
    } as unknown as HttpClient;
}

const fakeMovie: Movie = {
    _id: 'abc123',
    name: 'The Fellowship of the Ring',
    runtimeInMinutes: 178,
    budgetInMillions: 93,
    boxOfficeRevenueInMillions: 871.5,
    academyAwardNominations: 13,
    academyAwardWins: 4,
    rottenTomatoesScore: 91,
};

const fakePaginatedMovies: PaginatedResponse<Movie> = {
    docs: [fakeMovie],
    total: 1, limit: 1000, offset: 0, page: 1, pages: 1,
};

const fakePaginatedQuotes: PaginatedResponse<Quote> = {
    docs: [{ _id: 'q1', dialog: 'You shall not pass!', movie: 'abc123', character: 'char1', id: 'q1' }],
    total: 1, limit: 1000, offset: 0, page: 1, pages: 1,
};

describe('MoviesClient.list', () => {
    it('calls GET /movie with no query string when no options given', async () => {
        const http = makeHttpMock(fakePaginatedMovies);
        const client = new MoviesClient(http);

        const result = await client.list();

        expect(http.get).toHaveBeenCalledWith('/movie', undefined);
        expect(result.docs).toHaveLength(1);
    });

    it('passes serialized filter as query string', async () => {
        const http = makeHttpMock(fakePaginatedMovies);
        const client = new MoviesClient(http);

        await client.list({ filter: { academyAwardWins: { gt: 0 } } });

        expect(http.get).toHaveBeenCalledWith('/movie', 'academyAwardWins>0');
    });

    it('passes serialized sort as query string', async () => {
        const http = makeHttpMock(fakePaginatedMovies);
        const client = new MoviesClient(http);

        await client.list({ sort: { field: 'name', order: 'asc' } });

        expect(http.get).toHaveBeenCalledWith('/movie', 'sort=name:asc');
    });

    it('passes serialized pagination as query string', async () => {
        const http = makeHttpMock(fakePaginatedMovies);
        const client = new MoviesClient(http);

        await client.list({ pagination: { limit: 5, page: 1 } });

        expect(http.get).toHaveBeenCalledWith('/movie', 'limit=5&page=1');
    });
});

describe('MoviesClient.getById', () => {
    it('calls GET /movie/{id} and returns the first doc', async () => {
        const http = makeHttpMock(fakePaginatedMovies);
        const client = new MoviesClient(http);

        const movie = await client.getById('abc123');

        expect(http.get).toHaveBeenCalledWith('/movie/abc123', undefined);
        expect(movie.name).toBe('The Fellowship of the Ring');
    });
});

describe('MoviesClient.getQuotes', () => {
    it('calls GET /movie/{id}/quote', async () => {
        const http = makeHttpMock(fakePaginatedQuotes);
        const client = new MoviesClient(http);

        const result = await client.getQuotes('abc123');

        expect(http.get).toHaveBeenCalledWith('/movie/abc123/quote', undefined);
        expect(result.docs[0]?.dialog).toBe('You shall not pass!');
    });

    it('passes filter options to /movie/{id}/quote', async () => {
        const http = makeHttpMock(fakePaginatedQuotes);
        const client = new MoviesClient(http);

        await client.getQuotes('abc123', { filter: { character: 'char1' } });

        expect(http.get).toHaveBeenCalledWith('/movie/abc123/quote', 'character=char1');
    });
});
