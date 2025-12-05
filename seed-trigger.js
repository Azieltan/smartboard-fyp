async function seed() {
  try {
    const response = await fetch('http://localhost:3001/seed', {
      method: 'POST'
    });
    const data = await response.json();
    console.log('Seed result:', data);
  } catch (error) {
    console.error('Seed error:', error);
  }
}
seed();
