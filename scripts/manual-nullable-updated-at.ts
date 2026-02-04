
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

    const tablesToUpdate = [
        "uc_user",
        "uc_menu",
        "uc_application",
        "oidc_client",
        "oidc_payload"
    ];

    try {
        for (const table of tablesToUpdate) {
            console.log(`Modifying ${table}.updated_at to allow NULL...`);
            try {
                // Check if column exists first to avoid error if table missing
                const [cols] = await connection.execute(
                    `SHOW COLUMNS FROM \`${table}\` LIKE 'updated_at'`
                );
                if ((cols as any[]).length > 0) {
                    // Modify column to be nullable. Default behavior for DATETIME without NOT NULL is nullable.
                    // We keep ON UPDATE CURRENT_TIMESTAMP if desired, but user asked for "allow null on insert".
                    // schema says: timestamp("updated_at", { mode: "date" }).onUpdateNow()
                    // Drizzle usually maps .onUpdateNow() to ON UPDATE CURRENT_TIMESTAMP. 
                    // Removing .notNull() means we just drop NOT NULL constraints.
                    // Let's explicitly set it.
                    // Note: Syntax depends on MySQL version, but MODIFY COLUMN is standard.
                    await connection.execute(`ALTER TABLE \`${table}\` MODIFY COLUMN updated_at DATETIME NULL ON UPDATE CURRENT_TIMESTAMP`);
                    console.log(`✓ Updated ${table}`);
                } else {
                    console.log(`⚠ Column updated_at not found in ${table}, skipping.`);
                }
            } catch (e: any) {
                console.error(`X Failed to update ${table}:`, e.message);
            }
        }

        console.log("All operations completed.");
    } catch (err) {
        console.error("Error performing database operations:", err);
    } finally {
        await connection.end();
    }
}

main();
