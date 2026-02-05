import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { sql } from "drizzle-orm";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // Try to query users table directly - if it doesn't exist, we'll catch the error
        let tableExists = true;
        let adminUsers = [];

        try {
            // Attempt to query the users table
            adminUsers = await db.select()
                .from(users)
                .where(sql`${users.role} = 'ADMIN'`)
                .limit(1);
        } catch (error: any) {
            // If table doesn't exist, error code will be ER_NO_SUCH_TABLE
            if (error?.code === 'ER_NO_SUCH_TABLE' ||
                error?.message?.includes("doesn't exist") ||
                error?.errno === 1146) {
                tableExists = false;
            } else {
                // Re-throw other errors
                throw error;
            }
        }

        if (!tableExists) {
            return NextResponse.json({
                initialized: false,
                reason: "database_not_initialized",
                message: "数据库表不存在，需要初始化"
            });
        }

        // Check if any admin user exists
        if (adminUsers.length === 0) {
            return NextResponse.json({
                initialized: false,
                reason: "no_admin_user",
                message: "未找到管理员账户，需要创建初始管理员"
            });
        }

        return NextResponse.json({
            initialized: true,
            message: "系统已初始化"
        });

    } catch (error) {
        console.error("Init status check error:", error);

        return NextResponse.json({
            initialized: false,
            reason: "database_error",
            message: "数据库检查失败，可能需要初始化"
        });
    }
}
