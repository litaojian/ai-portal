
import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config({ path: ".env" });

async function main() {
    if (!process.env.DATABASE_URL) {
        console.error("DATABASE_URL is not set");
        process.exit(1);
    }

    console.log("Connecting to database...");
    const connection = await mysql.createConnection(process.env.DATABASE_URL);

    try {
        console.log("Creating uc_role table if it doesn't exist...");
        // Drizzle definition:
        // id: varchar(255) PK, name: varchar(255), code: varchar(50) UQ
        // description: text, status: varchar(50) default 'enabled', createdAt, updatedAt

        await connection.execute(`
      CREATE TABLE IF NOT EXISTS \`uc_role\` (
        \`id\` varchar(255) NOT NULL,
        \`name\` varchar(255) NOT NULL,
        \`code\` varchar(50) NOT NULL,
        \`description\` text,
        \`status\` varchar(50) NOT NULL DEFAULT 'enabled',
        \`created_at\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`uc_role_code_unique\` (\`code\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
    `);

        console.log("✓ Table uc_role checked/created.");

    } catch (err) {
        console.error("Error creating table:", err);
    } finally {
        await connection.end();
    }
}

main();
