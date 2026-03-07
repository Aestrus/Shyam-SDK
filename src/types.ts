export interface Movie {
    _id: string
    name: string
    runtimeInMinutes: number
    budgetInMillions: number
    boxOfficeRevenueInMillions: number
    academyAwardNominations: number
    academyAwardWins: number
    rottenTomatoesScore: number
}

export interface Quote {
    _id: string
    dialog: string
    movie: string
    character: string
    id: string
}

export interface PaginatedResponse<T> {
    docs: T[]
    total: number
    limit: number
    offset: number
    page: number
    pages: number
}

export interface NumericFilter {
    lt?: number
    gt?: number
    lte?: number
    gte?: number
}

export interface MovieFilter {
    name?: string
    budgetInMillions?: NumericFilter
    boxOfficeRevenueInMillions?: NumericFilter
    runtimeInMinutes?: NumericFilter
    academyAwardNominations?: NumericFilter
    academyAwardWins?: NumericFilter
    rottenTomatoesScore?: NumericFilter
}

export interface QuoteFilter {
    dialog?: string
    movie?: string
    character?: string
}

export interface SortOptions {
    field: string
    order: 'asc' | 'desc'
}

export interface PaginationOptions {
    limit?: number
    page?: number
    offset?: number
}

export interface LotrClientConfig {
    apiKey?: string
    baseUrl?: string
    retry?: { enabled?: boolean; maxAttempts?: number }
    cache?: { enabled?: boolean; ttl?: number }
}

export interface QueryOptions<TFilter> {
    filter?: TFilter
    sort?: SortOptions
    pagination?: PaginationOptions
}