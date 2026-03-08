import { describe, it, expect, beforeAll } from 'vitest';
import { LotrClient } from '../../src/client.js';
import type { Movie } from '../../src/types.js';
import { config } from 'dotenv';

config();

// Only runs when LOTR_API_KEY is set in the environment or .env file.
// Run with: npm run test:integration
const runSuite = process.env['LOTR_API_KEY'] ? describe : describe.skip;

runSuite('Movies — integration', () => {
    let client: LotrClient;

    beforeAll(() => {
        client = new LotrClient();
    });

    it('lists movies and returns a valid paginated response', async () => {
        const result = await client.movies.list();
        expect(result).toHaveProperty('docs');
        expect(result).toHaveProperty('total');
        expect(Array.isArray(result.docs)).toBe(true);
        expect(result.docs.length).toBeGreaterThan(0);
    });

    it('returns movies with the expected fields', async () => {
        const result = await client.movies.list({ pagination: { limit: 1 } });
        const movie = result.docs[0] as Movie;
        expect(movie).toHaveProperty('_id');
        expect(movie).toHaveProperty('name');
        expect(typeof movie.runtimeInMinutes).toBe('number');
        expect(typeof movie.budgetInMillions).toBe('number');
    });

    it('filters movies by academyAwardWins > 0', async () => {
        const result = await client.movies.list({
            filter: { academyAwardWins: { gt: 0 } },
        });
        expect(result.docs.every((m) => m.academyAwardWins > 0)).toBe(true);
    });

    // NOTE: The API returns 500 for sort requests on /movie and /quote — confirmed API-side bug.
    // Sorting works on /character but is broken on these two endpoints specifically.
    // Sorting is verified at the unit level via query-serializer tests.
    it.skip('sorts movies by name ascending (skipped — API returns 500 on /movie sort)', async () => {
        const result = await client.movies.list({
            sort: { field: 'name', order: 'asc' },
        });
        const names = result.docs.map((m) => m.name);
        expect(names).toEqual([...names].sort());
    });

    it('fetches a specific movie by id', async () => {
        const listResult = await client.movies.list({ pagination: { limit: 1 } });
        const id = (listResult.docs[0] as Movie)._id;

        const movie = await client.movies.getById(id);
        expect(movie._id).toBe(id);
    });

    it('fetches quotes for a LotR movie', async () => {
        // /movie/{id}/quote only works for the LotR trilogy, not The Hobbit
        // The Two Towers ID — verified from live API
        const result = await client.movies.getQuotes('5cd95395de30eff6ebccde5b', {
            pagination: { limit: 3 },
        });
        expect(Array.isArray(result.docs)).toBe(true);
        expect(result.docs.length).toBeGreaterThan(0);
    });
});
