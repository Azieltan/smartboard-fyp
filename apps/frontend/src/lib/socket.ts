import { io } from 'socket.io-client';

// Use environment variable or default to localhost
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL ||
    (process.env.NEXT_PUBLIC_API_URL?.startsWith('http') ? process.env.NEXT_PUBLIC_API_URL : undefined) ||
    'http://localhost:3001';

export const socket = io(SOCKET_URL, {
    autoConnect: false, // We will connect manually when needed (e.g. auth)
});
