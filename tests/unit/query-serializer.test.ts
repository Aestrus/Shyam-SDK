import { describe, it, expect } from 'vitest';
import { serializeFilter, serializeSort, serializePagination, serializeQueryOptions } from '../../src/query-serializer.js';


describe('serializeFilter', () => {
    it('serializes a string field as key=value', () => {
        expect(serializeFilter({ name: 'Gandalf' })).toBe('name=Gandalf');
    });

    it('serializes a numeric lt filter', () => {
        expect(serializeFilter({ budgetInMillions: { lt: 100 }
        })).toBe('budgetInMillions<100');
    });

    it('serializes a numeric gt filter', () => {                                       
        expect(serializeFilter({ academyAwardWins: { gt: 0 }
        })).toBe('academyAwardWins>0');                                                    
    });                                                                              
                                                                                        
    it('serializes a numeric gte filter', () => {                                      
        expect(serializeFilter({ runtimeInMinutes: { gte: 160 }
        })).toBe('runtimeInMinutes>=160');
    });

    it('serializes a numeric lte filter', () => {
        expect(serializeFilter({ budgetInMillions: { lte: 200 }
        })).toBe('budgetInMillions<=200');
    });

    it('returns empty string for empty filter', () => {
        expect(serializeFilter({})).toBe('');
    });
});

describe('serializeSort', () => {                                                  
    it('serializes ascending sort', () => {
        expect(serializeSort({ field: 'name', order: 'asc' })).toBe('sort=name:asc');  
    });                                                                            
                                                                                     
    it('serializes descending sort', () => {                                         
        expect(serializeSort({ field: 'budgetInMillions', order: 'desc'
        })).toBe('sort=budgetInMillions:desc');
    });
});

describe('serializePagination', () => {
    it('serializes limit', () => {
        expect(serializePagination({ limit: 10 })).toBe('limit=10');
    });

    it('serializes page', () => {
        expect(serializePagination({ page: 2 })).toBe('page=2');
    });

    it('serializes limit and page together', () => {
        expect(serializePagination({ limit: 10, page: 2 })).toBe('limit=10&page=2');
    });

    it('returns empty string for empty pagination', () => {
        expect(serializePagination({})).toBe('');
    });
});

describe('serializeQueryOptions', () => {                                          
    it('combines filter, sort, and pagination into one query string', () => {        
        expect(serializeQueryOptions({                                                 
            filter: { budgetInMillions: { lt: 100 } },                                   
            sort: { field: 'name', order: 'asc' },                                       
            pagination: { limit: 5 },
        })).toBe('budgetInMillions<100&sort=name:asc&limit=5');
    });

    it('returns empty string for empty options', () => {
        expect(serializeQueryOptions({})).toBe('');
    });

    it('handles only pagination', () => {
        expect(serializeQueryOptions({ pagination: { limit: 10 } })).toBe('limit=10');
    });
  });