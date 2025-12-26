import axios from 'axios';

async function testRegister() {
    console.log('Testing /auth/register endpoint...');
    try {
        const response = await axios.post('http://localhost:3001/auth/register', {
            username: 'Test User',
            email: 'test' + Date.now() + '@example.com',
            password: 'Password123!'
        });
        console.log('Registration Success:', response.data);
    } catch (error: any) {
        console.error('Registration Failed:', error.response?.data || error.message);
    }
}

async function testLogin() {
    console.log('\nTesting /auth/login endpoint (with intentional wrong credentials)...');
    try {
        const response = await axios.post('http://localhost:3001/auth/login', {
            email: 'nonexistent@example.com',
            password: 'wrongpassword'
        });
        console.log('Login Success (Unexpected!):', response.data);
    } catch (error: any) {
        console.error('Login Failed (Expected):', error.response?.data || error.message);
    }
}

async function runTests() {
    await testRegister();
    await testLogin();
}

runTests();
