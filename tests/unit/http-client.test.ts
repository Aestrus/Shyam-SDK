import { describe, it, expect, vi } from 'vitest';
import { HttpClient } from '../../src/http-client.js';
import { AuthenticationError, RateLimitError, NotFoundError, ServerError, ValidationError, LotrApiError } from '../../src/errors.js';

// A helper that builds a fake fetch function returning whatever response shape we need.
function mockFetchWith(status: number, ok: boolean, body: unknown = {}) {
    return vi.fn().mockResolvedValue({
        ok,
        status,
        json: async () => body,
    } as unknown as Response);
}

const defaultBody = { docs: [], total: 0, limit: 1000, offset: 0, page: 1, pages: 1 };

describe('HttpClient — constructor', () => {
    it('throws if no API key is provided', () => {
        const original = process.env['LOTR_API_KEY'];
        delete process.env['LOTR_API_KEY'];

        expect(() => new HttpClient({}, vi.fn() as unknown as typeof fetch)).toThrow(AuthenticationError);

        process.env['LOTR_API_KEY'] = original;
    });

    it('accepts apiKey from config', () => {
        expect(
            () => new HttpClient({ apiKey: 'test-key' }, vi.fn() as unknown as typeof fetch)
        ).not.toThrow();
    });

    it('accepts apiKey from environment variable', () => {
        process.env['LOTR_API_KEY'] = 'env-key';
        expect(
            () => new HttpClient({}, vi.fn() as unknown as typeof fetch)
        ).not.toThrow();
        delete process.env['LOTR_API_KEY'];
    });
});

describe('HttpClient — Authorization header', () => {
    it('sends Bearer token on every request', async () => {
        const mockFetch = mockFetchWith(200, true, defaultBody);
        const client = new HttpClient(
            { apiKey: 'my-secret-key', cache: { enabled: false } },
            mockFetch as unknown as typeof fetch
        );

        await client.get('/movie');

        expect(mockFetch).toHaveBeenCalledWith(
            expect.stringContaining('/movie'),
            expect.objectContaining({
                headers: expect.objectContaining({
                    Authorization: 'Bearer my-secret-key',
                }),
            })
        );
    });
});

describe('HttpClient — error mapping', () => {
    it('throws AuthenticationError on 401', async () => {
        const client = new HttpClient(
            { apiKey: 'test', cache: { enabled: false } },
            mockFetchWith(401, false) as unknown as typeof fetch
        );
        await expect(client.get('/movie')).rejects.toThrow(AuthenticationError);
    });

    it('throws RateLimitError on 429', async () => {
        const client = new HttpClient(
            { apiKey: 'test', cache: { enabled: false }, retry: { enabled: false } },
            mockFetchWith(429, false) as unknown as typeof fetch
        );
        await expect(client.get('/movie')).rejects.toThrow(RateLimitError);
    });

    it('throws NotFoundError on 404', async () => {
        const client = new HttpClient(
            { apiKey: 'test', cache: { enabled: false } },
            mockFetchWith(404, false) as unknown as typeof fetch
        );
        await expect(client.get('/movie/bad-id')).rejects.toThrow(NotFoundError);
    });

    it('throws ServerError on 500', async () => {
        const client = new HttpClient(
            { apiKey: 'test', cache: { enabled: false } },
            mockFetchWith(500, false) as unknown as typeof fetch
        );
        await expect(client.get('/movie')).rejects.toBeInstanceOf(ServerError);
    });

    it('throws ValidationError on 400', async () => {
        const client = new HttpClient(
            { apiKey: 'test', cache: { enabled: false } },
            mockFetchWith(400, false) as unknown as typeof fetch
        );
        await expect(client.get('/movie')).rejects.toBeInstanceOf(ValidationError);
    });

    it('throws LotrApiError for other non-2xx responses', async () => {
        const client = new HttpClient(
            { apiKey: 'test', cache: { enabled: false } },
            mockFetchWith(503, false) as unknown as typeof fetch
        );
        await expect(client.get('/movie')).rejects.toThrow(LotrApiError);
    });
});

describe('HttpClient — cache', () => {
    it('returns cached response without calling fetch again', async () => {
        const mockFetch = mockFetchWith(200, true, defaultBody);
        const client = new HttpClient(
            { apiKey: 'test', cache: { enabled: true, ttl: 60000 } },
            mockFetch as unknown as typeof fetch
        );

        await client.get('/movie');
        await client.get('/movie');

        // fetch was only called once — second call served from cache
        expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('bypasses cache when disabled', async () => {
        const mockFetch = mockFetchWith(200, true, defaultBody);
        const client = new HttpClient(
            { apiKey: 'test', cache: { enabled: false } },
            mockFetch as unknown as typeof fetch
        );

        await client.get('/movie');
        await client.get('/movie');

        expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('caches different URLs separately', async () => {
        const mockFetch = mockFetchWith(200, true, defaultBody);
        const client = new HttpClient(
            { apiKey: 'test', cache: { enabled: true, ttl: 60000 } },
            mockFetch as unknown as typeof fetch
        );

        await client.get('/movie');
        await client.get('/quote');

        expect(mockFetch).toHaveBeenCalledTimes(2);
    });
});

describe('HttpClient — retry', () => {
    it('retries on RateLimitError up to maxAttempts then throws', async () => {
        const mockFetch = mockFetchWith(429, false);
        const client = new HttpClient(
            { apiKey: 'test', cache: { enabled: false }, retry: { enabled: true, maxAttempts: 3 } },
            mockFetch as unknown as typeof fetch
        );

        await expect(client.get('/movie')).rejects.toThrow(RateLimitError);
        expect(mockFetch).toHaveBeenCalledTimes(3);
    }, 30000);

    it('does not retry on AuthenticationError', async () => {
        const mockFetch = mockFetchWith(401, false);
        const client = new HttpClient(
            { apiKey: 'test', cache: { enabled: false }, retry: { enabled: true, maxAttempts: 3 } },
            mockFetch as unknown as typeof fetch
        );

        await expect(client.get('/movie')).rejects.toThrow(AuthenticationError);
        expect(mockFetch).toHaveBeenCalledTimes(1);
    });
});
