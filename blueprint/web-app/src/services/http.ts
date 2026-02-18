// Define custom response types
// src/http.ts
// src/http.ts

export class Http {
  static async get<T>(url: string): Promise<{ status: number; data: T }> {
    const headers: Record<string, string> = {};
    const response = await fetch(url, { headers });
    const data = await response.json();
    return { status: response.status, data: data as T };
  }

  static async post<T, R>(
    url: string,
    payload: T
  ): Promise<{ status: number; data: R }> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    return { status: response.status, data: data as R };
  }

  static async del<T>(
    url: string,
    payload: T
  ): Promise<{ status: number } | { detail: string; status: number }> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    const response = await fetch(url, {
      method: 'DELETE',
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      // Return only the status if no response is expected
      return { status: response.status };
    }

    const text = await response.text();

    if (!text) {
      // Return only the status if no response is expected
      return { status: response.status };
    }

    // Still include the status with whatever response type
    return { detail: text, status: response.status };
  }
}
