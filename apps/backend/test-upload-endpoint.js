
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

async function testUpload() {
    console.log('Testing file upload...');

    // Create a dummy file
    const filePath = path.join(__dirname, 'test-upload.txt');
    fs.writeFileSync(filePath, 'This is a test file content.');

    const form = new FormData();
    form.append('file', fs.createReadStream(filePath));

    try {
        const response = await axios.post('http://localhost:3001/upload', form, {
            headers: {
                ...form.getHeaders()
            }
        });
        console.log('✅ Upload response:', response.data);
    } catch (error) {
        if (error.response) {
            console.error('❌ Upload failed:', error.response.status, error.response.data);
        } else {
            console.error('❌ Upload failed:', error.message);
        }
    } finally {
        fs.unlinkSync(filePath);
    }
}

testUpload();
