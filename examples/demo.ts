/**
 * Demo: Shyam SDK — Lord of the Rings API
 *
 * Run with: npm run demo
 * Requires: LOTR_API_KEY in .env or environment
 */

import { config } from 'dotenv';
config();

import { LotrClient } from '../src/index.js';
import { AuthenticationError, RateLimitError, NotFoundError } from '../src/index.js';

const client = new LotrClient();

// ── 1. List all movies ───────────────────────────────────────────────────────
console.log('=== All Movies ===');
const movies = await client.movies.list();
for (const movie of movies.docs) {
    console.log(`  ${movie.name} (${movie.academyAwardWins} Academy Awards)`);
}

// ── 2. Filter: only movies with Oscar wins ───────────────────────────────────
console.log('\n=== Movies with Oscar Wins ===');
const awardWinners = await client.movies.list({
    filter: { academyAwardWins: { gt: 0 } },
});
for (const movie of awardWinners.docs) {
    console.log(`  ${movie.name} — ${movie.academyAwardWins} wins`);
}

// ── 3. Combined call: movie + all its quotes in parallel ─────────────────────
console.log('\n=== Fellowship of the Ring + Quotes (combined call) ===');
// The Fellowship of the Ring ID — verified from live API
const FELLOWSHIP_ID = '5cd95395de30eff6ebccde5c';
const { movie: fellowship, quotes: fellowshipQuotes } = await client.movies.getWithQuotes(FELLOWSHIP_ID);
console.log(`  Movie: ${fellowship.name} (${fellowshipQuotes.length} quotes total)`);
console.log(`  First quote: "${fellowshipQuotes[0]?.dialog}"`);

// ── 4. Find a movie by name ───────────────────────────────────────────────────
console.log('\n=== Find Movie by Name ===');
const twoTowers = await client.movies.findByName('The Two Towers');
console.log(`  Found: ${twoTowers?.name} (ID: ${twoTowers?._id})`);

// ── 5. Combined call: quote + full movie details ──────────────────────────────
console.log('\n=== Quote with Embedded Movie Details ===');
// "You shall not pass!" — verified from live API (in The Two Towers per the API)
const YOU_SHALL_NOT_PASS_ID = '5cd96e05de30eff6ebccec8a';
const quoteWithMovie = await client.quotes.getWithMovie(YOU_SHALL_NOT_PASS_ID);
console.log(`  "${quoteWithMovie.dialog}"`);
console.log(`  From: ${quoteWithMovie.movieDetails.name} (${quoteWithMovie.movieDetails.academyAwardWins} Academy Awards)`);

// ── 6. Async iterator: search quotes by text ──────────────────────────────────
console.log('\n=== Quote Search: "precious" ===');
let count = 0;
for await (const quote of client.quotes.search('precious')) {
    if (count < 3) console.log(`  "${quote.dialog}"`);
    count++;
}
console.log(`  (${count} total matches)`);

// ── 7. Typed error handling ──────────────────────────────────────────────────
console.log('\n=== Error Handling Demo ===');
try {
    await client.movies.getById('000000000000000000000000');
} catch (err) {
    if (err instanceof NotFoundError) {
        console.log(`  NotFoundError caught: ${err.message} (status ${err.statusCode ?? 'N/A'})`);
    } else if (err instanceof AuthenticationError) {
        console.log(`  AuthenticationError: ${err.message}`);
    } else if (err instanceof RateLimitError) {
        console.log(`  RateLimitError: ${err.message}`);
    } else {
        throw err;
    }
}

console.log('\nDemo complete.');
