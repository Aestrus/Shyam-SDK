import type { NumericFilter, SortOptions, PaginationOptions } from "./types.js";

export function serializeFilter(filter: object): string {
    const reqs: string[] = []
    for (const [key, value] of Object.entries(filter)) {
        if (typeof value === 'string') {
            reqs.push(`${key}=${value}`);
        } else if (typeof value === 'object' && value !== null) {
            reqs.push(...serializeNumericFilter(key, value as NumericFilter));
        }
    }

    return reqs.join('&');
}

export function serializeNumericFilter(field: string, filter: NumericFilter): string[] {
    const reqs: string[] = [];

    const operatorMap: Record<string, string> = {
        lt:  '<',
        gt:  '>',
        lte: '<=',
        gte: '>=',
    };

    for (const [operator, number] of Object.entries(filter)) {
        if (number === undefined) continue;
        const symbol = operatorMap[operator];
        if (symbol) {
            reqs.push(`${field}${symbol}${number}`);
        }
    }
    
    return reqs;
}

export function serializeSort(sort: SortOptions): string {
    return `sort=${sort.field}:${sort.order}`;
}

export function serializePagination(pagination: PaginationOptions): string {
    const reqs: string[] = []

    if (pagination.limit !== undefined) reqs.push(`limit=${pagination.limit}`);
    if (pagination.page !== undefined) reqs.push(`page=${pagination.page}`);
    if (pagination.offset !== undefined) reqs.push(`offset=${pagination.offset}`);

    return reqs.join('&');
}

export function serializeQueryOptions(options: {
    filter?: object;
    sort?: SortOptions;
    pagination?:PaginationOptions
}): string {
    const reqs: string[] = []
    
    if (options.filter) reqs.push(serializeFilter(options.filter));
    if (options.sort) reqs.push(serializeSort(options.sort));
    if (options.pagination) reqs.push(serializePagination(options.pagination));

    return reqs.join('&');
}