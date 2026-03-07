import { HttpClient } from './http-client.js';
import { MoviesClient } from './resources/movies.js';
import { QuotesClient } from './resources/quotes.js';
import type { LotrClientConfig } from './types.js';

export class LotrClient {
    public readonly movies: MoviesClient;
    public readonly quotes: QuotesClient;

    constructor(config: LotrClientConfig = {}) {
        const http = new HttpClient(config);
        this.movies = new MoviesClient(http);
        this.quotes = new QuotesClient(http);
    }
}
