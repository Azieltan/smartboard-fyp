const axios = require('axios');

async function testSmarty() {
    const userId = 'test-user';

    try {
        console.log('Testing "Ask Smarty"...');
        const askRes = await axios.post('http://localhost:3001/smarty/ask', {
            userId,
            question: 'how to add member'
        });
        console.log('Ask Response:', askRes.data);

        console.log('Testing "Let Smarty Do"...');
        const autoRes = await axios.post('http://localhost:3001/smarty/automate', {
            userId,
            prompt: 'add user to group'
        });
        console.log('Automate Response:', autoRes.data);

    } catch (error) {
        console.error('Error:', error.message);
        if (error.response) {
            console.error('Response Data:', error.response.data);
        }
    }
}

testSmarty();
