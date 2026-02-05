import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const connection = await mysql.createConnection(process.env.DATABASE_URL);

console.log('🔍 Checking OIDC client configuration...\n');

const [clients] = await connection.execute(
    `SELECT * FROM oidc_client WHERE clientId = 'oidc-test-client'`
);

if (clients.length === 0) {
    console.log('❌ Client not found in database!');
    await connection.end();
    process.exit(1);
}

const client = clients[0];
console.log('Client configuration:');
Object.keys(client).forEach(key => {
    if (key === 'clientSecret') {
        console.log(`  ${key}: ${client[key] ? '***' + client[key].substring(client[key].length - 4) : 'null'}`);
    } else {
        console.log(`  ${key}:`, client[key]);
    }
});

console.log('\n🔍 Comparing with test script...');
console.log('Test script uses:');
console.log('  client_id: oidc-test-client');
console.log('  client_secret: test-secret-key-min-32-characters-long');

await connection.end();
process.exit(0);
