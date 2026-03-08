import { describe, it, expect, beforeAll } from 'vitest';
import { LotrClient } from '../../src/client.js';
import type { Quote } from '../../src/types.js';
import { config } from 'dotenv';

config();

// Only runs when LOTR_API_KEY is set in the environment or .env file.
// Run with: npm run test:integration
const runSuite = process.env['LOTR_API_KEY'] ? describe : describe.skip;

runSuite('Quotes — integration', () => {
    let client: LotrClient;

    beforeAll(() => {
        client = new LotrClient();
    });

    it('lists quotes and returns a valid paginated response', async () => {
        const result = await client.quotes.list({ pagination: { limit: 5 } });
        expect(result).toHaveProperty('docs');
        expect(result.docs.length).toBeLessThanOrEqual(5);
    });

    it('returns quotes with the expected fields', async () => {
        const result = await client.quotes.list({ pagination: { limit: 1 } });
        const quote = result.docs[0] as Quote;
        expect(quote).toHaveProperty('_id');
        expect(quote).toHaveProperty('dialog');
        expect(quote).toHaveProperty('movie');
        expect(quote).toHaveProperty('character');
    });

    it('fetches a specific quote by id', async () => {
        const listResult = await client.quotes.list({ pagination: { limit: 1 } });
        const id = (listResult.docs[0] as Quote)._id;

        const quote = await client.quotes.getById(id);
        expect(quote._id).toBe(id);
    });

    it('filters quotes by movie id', async () => {
        // The Two Towers
        const movieId = '5cd95395de30eff6ebccde5b';
        const result = await client.quotes.list({
            filter: { movie: movieId },
            pagination: { limit: 5 },
        });
        expect(result.docs.every((q) => q.movie === movieId)).toBe(true);
    });
});
