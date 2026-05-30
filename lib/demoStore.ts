// Fallback Data Layer for Hackathon Demo
import { INITIAL_DB } from "./demoData";

const STORAGE_KEY = "batchnexus_demo_db";

export function getDemoDB() {
    if (typeof window === "undefined") return INITIAL_DB;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
    
    // Initialize if not present
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DB));
    return INITIAL_DB;
}

export function saveDemoDB(db: any) {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

export function resetDemoDB() {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DB));
}

export function fallbackFetch(collection: string, options?: any) {
    const db = getDemoDB();
    let data = db[collection] || [];

    // Basic filtering for demo
    if (options?.filter) {
        Object.entries(options.filter).forEach(([key, val]) => {
            if (typeof val === 'object' && val !== null) {
                // simple equal handling for directus style
                if ('_eq' in val) {
                    data = data.filter((item: any) => item[key] === (val as any)._eq);
                }
            } else {
                data = data.filter((item: any) => item[key] === val);
            }
        });
    }
    
    // Sort logic (very basic for demo)
    if (options?.sort) {
        const desc = options.sort.startsWith('-');
        const field = options.sort.replace('-', '');
        data = [...data].sort((a: any, b: any) => {
            if (a[field] < b[field]) return desc ? 1 : -1;
            if (a[field] > b[field]) return desc ? -1 : 1;
            return 0;
        });
    }

    if (options?.limit) {
        data = data.slice(0, options.limit);
    }

    return { data, meta: { total: data.length } };
}

export function fallbackCreate(collection: string, payload: any) {
    const db = getDemoDB();
    if (!db[collection]) db[collection] = [];
    
    const newItem = {
        id: crypto.randomUUID(),
        date_created: new Date().toISOString(),
        ...payload
    };
    
    db[collection] = [newItem, ...db[collection]];
    saveDemoDB(db);
    return { data: newItem };
}

export function fallbackUpdate(collection: string, id: string, payload: any) {
    const db = getDemoDB();
    if (!db[collection]) db[collection] = [];
    
    const idx = db[collection].findIndex((i: any) => i.id === id);
    if (idx === -1) throw new Error("Item not found in fallback DB");
    
    db[collection][idx] = { ...db[collection][idx], ...payload };
    saveDemoDB(db);
    return { data: db[collection][idx] };
}
