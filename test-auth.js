async function test() {
  const email = `node.test.${Date.now()}@example.com`;
  const password = 'password123';

  console.log('Registering...');
  try {
    const regRes = await fetch('http://localhost:3001/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'NodeUser', email, password })
    });
    const regData = await regRes.json();
    console.log('Registration:', regRes.status, JSON.stringify(regData));

    if (regRes.ok) {
      console.log('Logging in...');
      const loginRes = await fetch('http://localhost:3001/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const loginData = await loginRes.json();
      console.log('Login:', loginRes.status, JSON.stringify(loginData));
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

test();
