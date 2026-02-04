require('dotenv').config();
const mysql = require('mysql2/promise');

async function test() {
    console.log('Testing MySQL connection...');
    console.log('URL:', process.env.DATABASE_URL ? 'Defined' : 'Undefined');

    if (!process.env.DATABASE_URL) {
        console.error('DATABASE_URL is missing in .env');
        process.exit(1);
    }

    try {
        const connection = await mysql.createConnection(process.env.DATABASE_URL);
        console.log('Connected successfully!');
        await connection.end();
    } catch (e) {
        console.error('Connection failed:', e);
        process.exit(1);
    }
}

test();
