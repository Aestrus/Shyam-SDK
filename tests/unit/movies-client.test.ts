import { describe, it, expect, vi } from 'vitest';
import { MoviesClient } from '../../src/resources/movies.js';
import type { HttpClient } from '../../src/http-client.js';
import type { PaginatedResponse, Movie, Quote, MovieWithQuotes } from '../../src/types.js';

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

describe('MoviesClient.all', () => {
    it('should iterate through all movies using pagination', async () => {
        const page1: PaginatedResponse<Movie> = {
            docs: [
                { ...fakeMovie, _id: '1', name: 'Movie 1' },
                { ...fakeMovie, _id: '2', name: 'Movie 2' },
            ],
            total: 4,
            limit: 2,
            offset: 0,
            page: 1,
            pages: 2,
        };

        const page2: PaginatedResponse<Movie> = {
            docs: [
                { ...fakeMovie, _id: '3', name: 'Movie 3' },
                { ...fakeMovie, _id: '4', name: 'Movie 4' },
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

        const client = new MoviesClient(http);
        const movies: Movie[] = [];

        for await (const movie of client.all()) {
            movies.push(movie);
        }

        expect(movies).toHaveLength(4);
        expect(movies[0]._id).toBe('1');
        expect(movies[3]._id).toBe('4');

        expect(http.get).toHaveBeenCalledTimes(2);

        expect(http.get).toHaveBeenNthCalledWith(1, '/movie', 'limit=100&page=1');
        expect(http.get).toHaveBeenNthCalledWith(2, '/movie', 'limit=100&page=2');
    });

    it('should handle empty results', async () => {
        const emptyResult: PaginatedResponse<Movie> = {
            docs: [],
            total: 0,
            limit: 100,
            offset: 0,
            page: 1,
            pages: 0,
        };

        const http = makeHttpMock(emptyResult);
        const client = new MoviesClient(http);
        const movies: Movie[] = [];

        for await (const movie of client.all()) {
            movies.push(movie);
        }

        expect(movies).toHaveLength(0);
        expect(http.get).toHaveBeenCalledTimes(1);
    });

    it('should handle single page of results', async () => {
        const singlePage: PaginatedResponse<Movie> = {
            docs: [
                { ...fakeMovie, _id: '1', name: 'Movie 1' },
            ],
            total: 1,
            limit: 100,
            offset: 0,
            page: 1,
            pages: 1,
        };

        const http = makeHttpMock(singlePage);
        const client = new MoviesClient(http);
        const movies: Movie[] = [];

        for await (const movie of client.all()) {
            movies.push(movie);
        }

        expect(movies).toHaveLength(1);
        expect(http.get).toHaveBeenCalledTimes(1);
    });

    it('should pass filter options to pagination calls', async () => {
        const filteredResult: PaginatedResponse<Movie> = {
            docs: [{ ...fakeMovie, _id: '1', name: 'Movie 1', academyAwardWins: 4 }],
            total: 1,
            limit: 100,
            offset: 0,
            page: 1,
            pages: 1,
        };

        const http = makeHttpMock(filteredResult);
        const client = new MoviesClient(http);
        const movies: Movie[] = [];

        for await (const movie of client.all({ filter: { academyAwardWins: { gt: 0 } } })) {
            movies.push(movie);
        }

        expect(movies).toHaveLength(1);

        const queryString = (http.get as ReturnType<typeof vi.fn>).mock.calls[0][1] as string;
        expect(queryString).toContain('academyAwardWins>0');
        expect(queryString).toContain('limit=100');
        expect(queryString).toContain('page=1');
    });

    it('should pass sort options to pagination calls', async () => {
        const sortedResult: PaginatedResponse<Movie> = {
            docs: [{ ...fakeMovie, _id: '1', name: 'Movie 1' }],
            total: 1,
            limit: 100,
            offset: 0,
            page: 1,
            pages: 1,
        };

        const http = makeHttpMock(sortedResult);
        const client = new MoviesClient(http);
        const movies: Movie[] = [];

        for await (const movie of client.all({ sort: { field: 'name', order: 'desc' } })) {
            movies.push(movie);
        }

        expect(movies).toHaveLength(1);

        const queryString = (http.get as ReturnType<typeof vi.fn>).mock.calls[0][1] as string;
        expect(queryString).toContain('sort=name:desc');
        expect(queryString).toContain('limit=100');
        expect(queryString).toContain('page=1');
    });
});

describe('MoviesClient.getWithQuotes', () => {
    function makePathMock() {
        return {
            get: vi.fn().mockImplementation((path: string) => {
                if (path === '/movie/abc123') return Promise.resolve(fakePaginatedMovies);
                if (path === '/movie/abc123/quote') return Promise.resolve(fakePaginatedQuotes);
            }),
        } as unknown as HttpClient;
    }

    it('returns the movie and its quotes combined', async () => {
        const client = new MoviesClient(makePathMock());

        const result: MovieWithQuotes = await client.getWithQuotes('abc123');

        expect(result.movie.name).toBe('The Fellowship of the Ring');
        expect(result.quotes).toHaveLength(1);
        expect(result.quotes[0]?.dialog).toBe('You shall not pass!');
    });

    it('fetches movie and quotes with a single SDK call (two API calls)', async () => {
        const http = makePathMock();
        const client = new MoviesClient(http);

        await client.getWithQuotes('abc123');

        expect(http.get).toHaveBeenCalledTimes(2);
        const paths = (http.get as ReturnType<typeof vi.fn>).mock.calls.map((c: unknown[]) => c[0]);
        expect(paths).toContain('/movie/abc123');
        expect(paths).toContain('/movie/abc123/quote');
    });
});

describe('MoviesClient.findByName', () => {
    it('returns the first movie matching the given name', async () => {
        const http = makeHttpMock(fakePaginatedMovies);
        const client = new MoviesClient(http);

        const movie = await client.findByName('The Fellowship of the Ring');

        expect(movie?.name).toBe('The Fellowship of the Ring');
        expect(http.get).toHaveBeenCalledWith('/movie', 'name=The Fellowship of the Ring');
    });

    it('returns undefined when no movie matches the name', async () => {
        const emptyResult: PaginatedResponse<Movie> = {
            docs: [], total: 0, limit: 1000, offset: 0, page: 1, pages: 0,
        };
        const http = makeHttpMock(emptyResult);
        const client = new MoviesClient(http);

        const movie = await client.findByName('Nonexistent Movie');

        expect(movie).toBeUndefined();
    });
});
