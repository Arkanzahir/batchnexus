// DaaS REST API Client for Frontend
// Routes through internal Next.js API proxy (/api/items/[collection])
// which handles authentication and proxies to the external DaaS backend.

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
  
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json"
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.errors?.[0]?.message || "API Error");
  }

  return response.json();
}

export async function createItem<T>(
  collection: string,
  data: Partial<T>,
): Promise<{ data: T }> {
  const response = await fetch(`/api/items/${collection}`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.errors?.[0]?.message || "API Error");
  }

  return response.json();
}

export async function updateItem<T>(
  collection: string,
  id: string,
  data: Partial<T>,
): Promise<{ data: T }> {
  const response = await fetch(`/api/items/${collection}/${id}`, {
    method: "PATCH",
    headers: { 
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.errors?.[0]?.message || "API Error");
  }

  return response.json();
}
