import { AuthService } from '../../src/services/auth';
import dotenv from 'dotenv';
dotenv.config();

async function debug() {
    console.log('--- DEBUG AUTH ---');
    try {
        const username = 'DebugUser' + Date.now();
        const email = 'debug' + Date.now() + '@example.com';
        const password = 'Password123!';

        console.log(`Attempting to register: ${email}`);
        const user = await AuthService.register(username, email, password);
        console.log('Registration Success:', user);

        console.log(`Attempting to login: ${email}`);
        const loginResult = await AuthService.login(email, password);
        console.log('Login Success:', loginResult.user.email);

    } catch (error: any) {
        console.error('Auth Error:', error.message);
        if (error.stack) console.error(error.stack);
    }
}

debug();
