const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const api = {
    get: async (endpoint: string) => {
        const res = await fetch(`${API_URL}${endpoint}`);
        return res.json();
    },
    post: async (endpoint: string, body: any) => {
        const res = await fetch(`${API_URL}${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });
        return res.json();
    },
    put: async (endpoint: string, body: any) => {
        const res = await fetch(`${API_URL}${endpoint}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });
        return res.json();
    }
};
