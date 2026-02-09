import { AuthService } from '../../src/services/auth';
import dotenv from 'dotenv';
dotenv.config();

async function testLogin() {
    try {
        console.log('Testing login with Test@gmail.com / Password123!...');
        const result = await AuthService.login('Test@gmail.com', 'Password123!');
        console.log('Login Success:', result.user.email);
    } catch (error: any) {
        console.error('Login Failed:', error.message);
    }
}

testLogin();
