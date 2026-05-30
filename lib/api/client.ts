// DaaS REST API Client for Frontend
// Routes through internal Next.js API proxy (/api/items/[collection])
// which handles authentication and proxies to the external DaaS backend.
import { fallbackFetch, fallbackCreate, fallbackUpdate } from "../demoStore";

export async function fetchItems<T>(
  collection: string,
  options?: {
    fields?: string;
    filter?: Record<string, any>;
    sort?: string;
    limit?: number;
    page?: number;
  },
): Promise<{ data: T[]; meta: { total: number } }> {
  const params = new URLSearchParams();

  if (options?.fields) params.set("fields", options.fields);
  if (options?.filter) params.set("filter", JSON.stringify(options.filter));
  if (options?.sort) params.set("sort", options.sort);
  if (options?.limit) params.set("limit", String(options.limit));
  if (options?.page) params.set("page", String(options.page));

  const url = `/api/items/${collection}${params.toString() ? '?' + params.toString() : ''}`;
  
  try {
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) {
      throw new Error("API Error");
    }
    
    const result = await response.json();
    
    // Fallback if data is empty (preventing empty demo screens)
    if (!result.data || result.data.length === 0) {
      return fallbackFetch(collection, options) as { data: T[]; meta: { total: number } };
    }
    
    return result;
  } catch (error) {
    console.warn(`[DaaS Fallback] Using local state for fetch ${collection}`);
    return fallbackFetch(collection, options) as { data: T[]; meta: { total: number } };
  }
}

export async function createItem<T>(
  collection: string,
  data: Partial<T>,
): Promise<{ data: T }> {
  try {
    const response = await fetch(`/api/items/${collection}`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`API Error for POST /api/items/${collection}:`, response.status, errText);
      throw new Error("API Error");
    }

    return response.json();
  } catch (error) {
    console.error(`[DaaS Fallback] Using local state for create ${collection}`, error);
    return fallbackCreate(collection, data) as { data: T };
  }
}

export async function updateItem<T>(
  collection: string,
  id: string,
  data: Partial<T>,
): Promise<{ data: T }> {
  try {
    const response = await fetch(`/api/items/${collection}/${id}`, {
      method: "PATCH",
      headers: { 
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error("API Error");
    }

    return response.json();
  } catch (error) {
    console.warn(`[DaaS Fallback] Using local state for update ${collection}`);
    return fallbackUpdate(collection, id, data) as { data: T };
  }
}
