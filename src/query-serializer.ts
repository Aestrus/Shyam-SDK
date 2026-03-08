import type { NumericFilter, StringFilter, SortOptions, PaginationOptions } from "./types.js";

function isNumericFilter(value: object): boolean {
    return 'lt' in value || 'gt' in value || 'lte' in value || 'gte' in value;
}

export function serializeFilter(filter: object): string {
    const reqs: string[] = []
    for (const [key, value] of Object.entries(filter)) {
        if (typeof value === 'string') {
            reqs.push(`${key}=${value}`);
        } else if (typeof value === 'object' && value !== null) {
            if (isNumericFilter(value)) {
                reqs.push(...serializeNumericFilter(key, value as NumericFilter));
            } else {
                reqs.push(...serializeStringFilter(key, value as StringFilter));
            }
        }
    }

    return reqs.join('&');
}

export function serializeStringFilter(field: string, filter: StringFilter): string[] {
    const parts: string[] = [];
    if (filter.eq !== undefined)           parts.push(`${field}=${filter.eq}`);
    if (filter.neq !== undefined)          parts.push(`${field}!=${filter.neq}`);
    if (filter.in !== undefined && filter.in.length > 0)
                                           parts.push(`${field}=${filter.in.join(',')}`);
    if (filter.nin !== undefined && filter.nin.length > 0)
                                           parts.push(`${field}!=${filter.nin.join(',')}`);
    if (filter.exists === true)            parts.push(field);
    if (filter.exists === false)           parts.push(`!${field}`);
    if (filter.regex !== undefined)        parts.push(`${field}=${filter.regex}`);
    if (filter.regexNegate !== undefined)  parts.push(`${field}!=${filter.regexNegate}`);
    return parts;
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

    if (options.filter) {
        const serialized = serializeFilter(options.filter);
        if (serialized) reqs.push(serialized);
    }
    if (options.sort) reqs.push(serializeSort(options.sort));
    if (options.pagination) reqs.push(serializePagination(options.pagination));

    return reqs.join('&');
}