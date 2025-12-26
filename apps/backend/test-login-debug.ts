import { AuthService } from './src/services/auth';
import dotenv from 'dotenv';
dotenv.config();

async function testLogin() {
    try {
        console.log('Testing login with wrong password...');
        const result = await AuthService.login('Test@gmail.com', 'wrongpassword');
        console.log('Login Success (Unexpected!):', result);
    } catch (error: any) {
        console.error('Login Failed (Expected):', error.message);
    }
}

testLogin();
