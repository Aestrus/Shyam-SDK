export class LotrApiError extends Error {
    constructor(message: string, public readonly statusCode?: number) {
        super(message);
        this.name = 'LotrApiError';
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

export class AuthenticationError extends LotrApiError {
    constructor() {
        super('Invalid or missing API key.', 401);
        this.name = 'AuthenticationError';
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

export class RateLimitError extends LotrApiError {
    constructor() {
        super('Rate limit exceeded.', 429);
        this.name = 'RateLimitError';
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

export class NotFoundError extends LotrApiError {
    constructor(message = 'Resource not found.') {
        super(message, 404);
        this.name = 'NotFoundError';
        Object.setPrototypeOf(this, new.target.prototype);
    }
}