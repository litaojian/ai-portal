"use server";

import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { hash } from "bcryptjs";
import { sql } from "drizzle-orm";

interface InitializeSystemInput {
    adminName: string;
    adminEmail: string;
    adminPassword: string;
}

export async function initializeSystem(input: InitializeSystemInput) {
    try {
        const { adminName, adminEmail, adminPassword } = input;

        // 1. Check if tables exist by attempting to query
        let tableExists = true;
        try {
            await db.select().from(users).limit(1);
        } catch (error: any) {
            console.log("Table check error:", error);
            // Check multiple error indicators for table not existing
            const isTableMissing =
                error?.code === 'ER_NO_SUCH_TABLE' ||
                error?.errno === 1146 ||
                error?.message?.includes("doesn't exist") ||
                error?.message?.includes("Table") && error?.message?.includes("doesn't exist") ||
                (error?.cause?.code === 'ER_NO_SUCH_TABLE') ||
                (error?.cause?.errno === 1146);

            if (isTableMissing) {
                tableExists = false;
            } else {
                // Re-throw if it's a different error
                throw error;
            }
        }

        if (!tableExists) {
            // Auto-create ALL required tables using raw SQL
            try {
                console.log("Creating database tables...");

                // Execute complete schema creation
                const createTablesSQL = `
                    CREATE TABLE IF NOT EXISTS \`uc_user\` (
                        \`id\` varchar(255) NOT NULL,
                        \`name\` varchar(255) NOT NULL,
                        \`email\` varchar(255) NOT NULL,
                        \`emailVerified\` datetime DEFAULT NULL,
                        \`image\` varchar(255) DEFAULT NULL,
                        \`password\` varchar(255) DEFAULT NULL,
                        \`role\` varchar(50) NOT NULL DEFAULT 'USER',
                        \`created_at\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
                        \`updated_at\` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
                        PRIMARY KEY (\`id\`),
                        UNIQUE KEY \`user_email_idx\` (\`email\`)
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

                    CREATE TABLE IF NOT EXISTS \`uc_account\` (
                        \`userId\` varchar(255) NOT NULL,
                        \`type\` varchar(255) NOT NULL,
                        \`provider\` varchar(255) NOT NULL,
                        \`providerAccountId\` varchar(255) NOT NULL,
                        \`refresh_token\` text,
                        \`access_token\` text,
                        \`expires_at\` int DEFAULT NULL,
                        \`token_type\` varchar(255) DEFAULT NULL,
                        \`scope\` varchar(255) DEFAULT NULL,
                        \`id_token\` text,
                        \`session_state\` varchar(255) DEFAULT NULL,
                        UNIQUE KEY \`account_provider_providerAccountId_key\` (\`provider\`, \`providerAccountId\`)
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

                    CREATE TABLE IF NOT EXISTS \`uc_session\` (
                        \`sessionToken\` varchar(255) NOT NULL,
                        \`userId\` varchar(255) NOT NULL,
                        \`expires\` datetime NOT NULL,
                        PRIMARY KEY (\`sessionToken\`)
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

                    CREATE TABLE IF NOT EXISTS \`uc_verificationtoken\` (
                        \`identifier\` varchar(255) NOT NULL,
                        \`token\` varchar(255) NOT NULL,
                        \`expires\` datetime NOT NULL,
                        UNIQUE KEY \`verificationToken_identifier_token_key\` (\`identifier\`, \`token\`)
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

                    CREATE TABLE IF NOT EXISTS \`uc_menu\` (
                        \`id\` varchar(255) NOT NULL,
                        \`title\` varchar(255) NOT NULL,
                        \`url\` varchar(255) DEFAULT '#',
                        \`icon\` varchar(255) DEFAULT NULL,
                        \`group\` varchar(50) DEFAULT 'main',
                        \`order\` int DEFAULT 0,
                        \`parentId\` varchar(255) DEFAULT NULL,
                        \`created_at\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
                        \`updated_at\` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
                        PRIMARY KEY (\`id\`)
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

                    CREATE TABLE IF NOT EXISTS \`uc_application\` (
                        \`id\` varchar(255) NOT NULL,
                        \`name\` varchar(255) NOT NULL,
                        \`description\` text,
                        \`icon\` varchar(255) DEFAULT NULL,
                        \`url\` varchar(255) DEFAULT NULL,
                        \`type\` varchar(50) NOT NULL DEFAULT 'internal',
                        \`status\` varchar(50) NOT NULL DEFAULT 'draft',
                        \`version\` varchar(50) NOT NULL DEFAULT '1.0.0',
                        \`developer\` varchar(255) DEFAULT NULL,
                        \`category\` varchar(50) DEFAULT NULL,
                        \`created_at\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
                        \`updated_at\` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
                        PRIMARY KEY (\`id\`)
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

                    CREATE TABLE IF NOT EXISTS \`oidc_client\` (
                        \`id\` varchar(255) NOT NULL,
                        \`applicationId\` varchar(255) DEFAULT NULL,
                        \`clientId\` varchar(255) NOT NULL,
                        \`clientSecret\` varchar(255) DEFAULT NULL,
                        \`clientName\` varchar(255) DEFAULT NULL,
                        \`clientUri\` varchar(255) DEFAULT NULL,
                        \`logoUri\` varchar(255) DEFAULT NULL,
                        \`redirectUris\` json NOT NULL,
                        \`postLogoutRedirectUris\` json DEFAULT NULL,
                        \`grantTypes\` json NOT NULL,
                        \`responseTypes\` json NOT NULL,
                        \`scope\` varchar(255) DEFAULT 'openid profile email',
                        \`tokenEndpointAuthMethod\` varchar(50) DEFAULT 'client_secret_basic',
                        \`created_at\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
                        \`updated_at\` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
                        PRIMARY KEY (\`id\`),
                        UNIQUE KEY \`oidc_client_clientId_unique\` (\`clientId\`)
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

                    CREATE TABLE IF NOT EXISTS \`oidc_payload\` (
                        \`id\` varchar(255) NOT NULL,
                        \`type\` varchar(50) NOT NULL,
                        \`payload\` json NOT NULL,
                        \`grantId\` varchar(255) DEFAULT NULL,
                        \`userCode\` varchar(255) DEFAULT NULL,
                        \`uid\` varchar(255) DEFAULT NULL,
                        \`expiresAt\` datetime DEFAULT NULL,
                        \`consumedAt\` datetime DEFAULT NULL,
                        \`created_at\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
                        \`updated_at\` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
                        PRIMARY KEY (\`id\`),
                        KEY \`oidc_payload_type_idx\` (\`type\`),
                        KEY \`oidc_payload_grantId_idx\` (\`grantId\`),
                        KEY \`oidc_payload_expiresAt_idx\` (\`expiresAt\`)
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

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
                `;

                // Split and execute each CREATE TABLE statement
                const statements = createTablesSQL
                    .split(';')
                    .map(s => s.trim())
                    .filter(s => s.length > 0);

                for (const statement of statements) {
                    await db.execute(sql.raw(statement));
                }

                console.log("✓ All database tables created successfully");
            } catch (createError) {
                console.error("Failed to create tables:", createError);
                return {
                    success: false,
                    error: "自动创建数据库表失败: " + (createError instanceof Error ? createError.message : String(createError))
                };
            }
        }

        // 2. Check if admin already exists
        const existingAdmin = await db.select()
            .from(users)
            .where(sql`${users.role} = 'ADMIN'`)
            .limit(1);

        if (existingAdmin.length > 0) {
            return {
                success: false,
                error: "管理员账户已存在，系统已初始化"
            };
        }

        // 3. Check if email already exists
        const existingUser = await db.select()
            .from(users)
            .where(sql`${users.email} = ${adminEmail}`)
            .limit(1);

        if (existingUser.length > 0) {
            return {
                success: false,
                error: "该邮箱已被使用"
            };
        }

        // 4. Create admin user
        const hashedPassword = await hash(adminPassword, 10);

        await db.insert(users).values({
            id: crypto.randomUUID(),
            name: adminName,
            email: adminEmail,
            password: hashedPassword,
            role: "ADMIN",
            createdAt: new Date(),
            updatedAt: new Date()
        });

        return {
            success: true,
            message: "系统初始化成功！管理员账户已创建。"
        };

    } catch (error: any) {
        console.error("System initialization error:", error);
        console.error("Error details:", {
            code: error?.code,
            errno: error?.errno,
            message: error?.message,
            cause: error?.cause
        });
        return {
            success: false,
            error: `初始化失败: ${error?.message || String(error)}`
        };
    }
}
