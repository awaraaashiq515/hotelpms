export class APIError extends Error {
  constructor(public message: string, public status: number, public data?: any) {
    super(message);
    this.name = 'APIError';
  }
}

interface RequestOptions extends RequestInit {
  params?: Record<string, string>;
}

async function handleResponse<T>(response: Response): Promise<T> {
  // Read the body as text first to check if it's empty
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  
  if (!response.ok) {
    if (response.status === 401 && typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    // Safely extract string message — error field may be array/object (e.g. ZodError)
    const extractMsg = (val: any): string => {
      if (!val) return '';
      if (typeof val === 'string') return val;
      if (Array.isArray(val) && val[0]?.message) return val[0].message;
      if (typeof val === 'object' && val.message) return String(val.message);
      return JSON.stringify(val);
    };
    const msg = extractMsg(data?.message) || extractMsg(data?.error) || 'An unexpected error occurred';
    throw new APIError(msg, response.status, data);
  }
  
  return data?.data ?? data;
}

export const apiClient = {
  async get<T>(url: string, options: RequestOptions = {}): Promise<T> {
    const { params, ...init } = options;
    
    let queryString = '';
    if (params) {
      const cleanParams = Object.fromEntries(
        Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== '')
      );
      if (Object.keys(cleanParams).length > 0) {
        queryString = '?' + new URLSearchParams(cleanParams as Record<string, string>).toString();
      }
    }
    
    const response = await fetch(url + queryString, {
      ...init,
      method: 'GET',
      credentials: 'include',
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
        ...init.headers,
      },
    });
    
    return handleResponse<T>(response);
  },

  async post<T>(url: string, body?: any, options: RequestOptions = {}): Promise<T> {
    const response = await fetch(url, {
      ...options,
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    
    return handleResponse<T>(response);
  },

  async put<T>(url: string, body?: any, options: RequestOptions = {}): Promise<T> {
    const response = await fetch(url, {
      ...options,
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    
    return handleResponse<T>(response);
  },

  async patch<T>(url: string, body?: any, options: RequestOptions = {}): Promise<T> {
    const response = await fetch(url, {
      ...options,
      method: 'PATCH',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    
    return handleResponse<T>(response);
  },

  async delete<T>(url: string, options: RequestOptions = {}): Promise<T> {
    const response = await fetch(url, {
      ...options,
      method: 'DELETE',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    
    return handleResponse<T>(response);
  },
};
