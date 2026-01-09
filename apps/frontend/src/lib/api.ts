const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const getHeaders = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    return {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
};

const handleResponse = async (res: Response) => {
    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
        let data;
        try {
            data = await res.json();
        } catch (e) {
            console.error("Failed to parse JSON response:", e);
            throw new Error(`Failed to parse JSON response from ${res.url}`);
        }

        if (!res.ok) {
            // Auto-logout if token is invalid or expired
            if (typeof window !== 'undefined') {
                if (res.status === 401 || (res.status === 400 && data?.error === 'Invalid token.')) {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    window.location.href = '/login';
                }
            }

            throw {
                response: { data, status: res.status, url: res.url }
            };
        }
        return data;
    } else {
        // Not JSON (likely HTML error page)
        const text = await res.text();
        console.error(`API Error (${res.status}) at ${res.url}:`, text.substring(0, 200)); // Log first 200 chars
        throw new Error(`API returned non-JSON response (${res.status}) from ${res.url}`);
    }
};

export const api = {
    get: async (endpoint: string) => {
        const res = await fetch(`${API_URL}${endpoint}`, {
            headers: getHeaders(),
            cache: 'no-store'
        });
        return handleResponse(res);
    },
    post: async (endpoint: string, body: any) => {
        const res = await fetch(`${API_URL}${endpoint}`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(body),
        });
        return handleResponse(res);
    },
    put: async (endpoint: string, body: any) => {
        const res = await fetch(`${API_URL}${endpoint}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(body),
        });
        return handleResponse(res);
    },
    delete: async (endpoint: string, body?: any) => {
        const res = await fetch(`${API_URL}${endpoint}`, {
            method: 'DELETE',
            headers: getHeaders(),
            ...(body ? { body: JSON.stringify(body) } : {}),
        });
        return handleResponse(res);
    }
};
