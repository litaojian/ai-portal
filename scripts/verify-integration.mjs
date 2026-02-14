
const BASE_URL = 'http://localhost:3000';

async function testDataSources() {
    console.log('Testing Data Sources API...');
    try {
        const res = await fetch(`${BASE_URL}/api/integration/data-sources`);
        console.log(`Status: ${res.status}`);
        if (res.ok) {
            const data = await res.json();
            console.log('Data Sources:', data);
        } else {
            const err = await res.text();
            console.log('Error:', err);
        }
    } catch (e) {
        console.error('Fetch failed:', e.message);
    }
}

async function testDailyReports() {
    console.log('\nTesting Daily Reports API...');
    try {
        // Test with a dummy dataSource "test-source"
        const res = await fetch(`${BASE_URL}/api/integration/daily-reports?dataSource=test-source`);
        console.log(`Status: ${res.status}`);
        if (res.ok) {
            const data = await res.json();
            console.log('Daily Reports:', data);
        } else {
            const err = await res.text();
            console.log('Error:', err);
        }
    } catch (e) {
        console.error('Fetch failed:', e.message);
    }
}

async function main() {
    await testDataSources();
    await testDailyReports();
}

main();
