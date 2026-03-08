import { AuthenticationError, RateLimitError, NotFoundError, ServerError, ValidationError, LotrApiError } from "./errors.js";
import type { LotrClientConfig } from "./types.js";

interface CacheEntry {
    data: unknown;
    expiresAt: number;
}

/** @internal */
export class HttpClient {
    private readonly baseUrl: string;
    private readonly apiKey: string;
    private readonly fetchFn: typeof fetch;
    private readonly cache = new Map<string, CacheEntry>();
    private readonly config: LotrClientConfig;

    constructor(config: LotrClientConfig, fetchFn: typeof fetch = fetch) {
        const apiKey = config.apiKey ?? process.env['LOTR_API_KEY'];
        if (!apiKey) {
            throw new AuthenticationError();
        }
        this.apiKey = apiKey;
        this.baseUrl = config.baseUrl ?? 'https://the-one-api.dev/v2';
        this.fetchFn = fetchFn;
        this.config = config;
    }

    async get<T>(path: string, queryString?: string): Promise<T> {
        const url = queryString
            ? `${this.baseUrl}${path}?${queryString}`
            : `${this.baseUrl}${path}`;

        const cacheEnabled = this.config.cache?.enabled ?? true;
        const ttl = this.config.cache?.ttl ?? 300_000;

        if (cacheEnabled) {
            const cached = this.cache.get(url);
            if (cached && cached.expiresAt > Date.now()) {
                return cached.data as T;
            }
        }

        const data = await this.requestWithRetry<T>(() => this.executeRequest<T>(url));

        if (cacheEnabled) {
            this.cache.set(url, { data, expiresAt: Date.now() + ttl });
        }

        return data;
    }

    private async executeRequest<T>(url: string): Promise<T> {
        const response = await this.fetchFn(url, {
            headers: {
                Authorization: `Bearer ${this.apiKey}`,
            },
        });

        if (response.status === 401) throw new AuthenticationError();
        if (response.status === 429) throw new RateLimitError();
        if (response.status === 404) throw new NotFoundError();
        if (response.status === 400) throw new ValidationError();
        if (response.status === 500) throw new ServerError();
        if (!response.ok) {
            throw new LotrApiError(`Request failed with status ${response.status}`, response.status);
        }

        return response.json() as Promise<T>;
    }

    private async requestWithRetry<T>(fn: () => Promise<T>, attempt = 1): Promise<T> {
        try {
            return await fn();
        } catch (error) {
            const maxAttempts = this.config.retry?.maxAttempts ?? 3;
            const enabled = this.config.retry?.enabled ?? true;

            if (enabled && error instanceof RateLimitError && attempt < maxAttempts) {
                const delay = Math.pow(2, attempt) * 1000;
                const jitter = Math.random() * 500;
                await new Promise(resolve => setTimeout(resolve, delay + jitter));
                return this.requestWithRetry(fn, attempt + 1);
            }

            throw error;
        }
    }
}