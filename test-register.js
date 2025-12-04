const axios = require('axios');

async function testRegistration() {
    const user = {
        username: 'testuser_' + Date.now(),
        email: 'test_' + Date.now() + '@example.com',
        password: 'password123'
    };

    try {
        console.log('Attempting first registration...');
        await axios.post('http://localhost:3001/auth/register', user);
        console.log('First registration successful');

        console.log('Attempting second registration (should fail)...');
        await axios.post('http://localhost:3001/auth/register', user);
    } catch (error) {
        if (error.response) {
            console.log('Error Status:', error.response.status);
            console.log('Error Message:', error.response.data.error);
            if (error.response.data.error === 'User already exists') {
                console.log('SUCCESS: Duplicate user caught correctly');
            } else {
                console.log('FAILURE: Unexpected error message');
            }
        } else {
            console.log('Error:', error.message);
        }
    }
}

testRegistration();
