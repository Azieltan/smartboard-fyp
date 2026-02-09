import { AuthService } from '../../src/services/auth';
import dotenv from 'dotenv';
dotenv.config();

async function list() {
    try {
        const users = await AuthService.getAllUsers();
        console.log('--- USERS ---');
        users.forEach(u => console.log(`${u.email} (${u.user_id})`));
    } catch (error: any) {
        console.error('Error listing users:', error.message);
    }
}

list();
