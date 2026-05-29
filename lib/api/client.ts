// DaaS REST API Client for Frontend
const DAAS_URL = process.env.NEXT_PUBLIC_BUILDPAD_DAAS_URL;
const DAAS_TOKEN = "Y45aktNq5TgbalfTlggMJ8ukwjwU3wdR"; // Use static token for hackathon demo

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

  const url = `${DAAS_URL}/api/items/${collection}${params.toString() ? '?' + params.toString() : ''}`;
  
  const response = await fetch(url, {
    headers: {
      "Authorization": `Bearer ${DAAS_TOKEN}`,
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
  const response = await fetch(`${DAAS_URL}/api/items/${collection}`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "Authorization": `Bearer ${DAAS_TOKEN}`
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.errors?.[0]?.message || "API Error");
  }

  return response.json();
}
