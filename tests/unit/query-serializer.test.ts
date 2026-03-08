import { describe, it, expect } from 'vitest';
import { serializeFilter, serializeStringFilter, serializeSort, serializePagination, serializeQueryOptions } from '../../src/query-serializer.js';


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

    it('dispatches StringFilter through serializeFilter', () => {
        expect(serializeFilter({ name: { neq: 'Frodo' } })).toBe('name!=Frodo');
    });

    it('dispatches StringFilter include through serializeFilter', () => {
        expect(serializeFilter({ race: { in: ['Hobbit', 'Human'] } })).toBe('race=Hobbit,Human');
    });
});

describe('serializeStringFilter', () => {
    it('serializes eq as key=value', () => {
        expect(serializeStringFilter('name', { eq: 'Gandalf' })).toEqual(['name=Gandalf']);
    });

    it('serializes neq as key!=value', () => {
        expect(serializeStringFilter('name', { neq: 'Frodo' })).toEqual(['name!=Frodo']);
    });

    it('serializes in as key=a,b,c', () => {
        expect(serializeStringFilter('race', { in: ['Hobbit', 'Human'] })).toEqual(['race=Hobbit,Human']);
    });

    it('serializes nin as key!=a,b,c', () => {
        expect(serializeStringFilter('race', { nin: ['Orc', 'Goblin'] })).toEqual(['race!=Orc,Goblin']);
    });

    it('serializes exists:true as the bare key', () => {
        expect(serializeStringFilter('name', { exists: true })).toEqual(['name']);
    });

    it('serializes exists:false as !key', () => {
        expect(serializeStringFilter('name', { exists: false })).toEqual(['!name']);
    });

    it('serializes regex as key=/pattern/flags', () => {
        expect(serializeStringFilter('name', { regex: '/foot/i' })).toEqual(['name=/foot/i']);
    });

    it('serializes regexNegate as key!=/pattern/flags', () => {
        expect(serializeStringFilter('name', { regexNegate: '/foot/i' })).toEqual(['name!=/foot/i']);
    });

    it('serializes multiple operators together', () => {
        const result = serializeStringFilter('race', { in: ['Hobbit'], exists: true });
        expect(result).toEqual(['race=Hobbit', 'race']);
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