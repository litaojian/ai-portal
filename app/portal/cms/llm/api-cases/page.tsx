import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { SiteHeader } from "@/components/site-header";
import {
    SidebarInset,
    SidebarProvider,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import ApiCasesClient from "@/components/cms/api-cases-client";
import fs from "fs/promises";
import path from "path";

export default async function ApiCasesPage() {
    const session = await getServerSession(authOptions);

    const filePath = path.join(process.cwd(), "config", "data", "cms", "api-cases.json");
    const raw = await fs.readFile(filePath, "utf-8");
    const data = JSON.parse(raw);

    const breadcrumbs = [
        { label: "首页", href: "/" },
        { label: "AI内容生产线", href: "#" },
        { label: "AI应用场景测试", href: "#" },
    ];

    return (
        <SidebarProvider
            style={
                {
                    "--sidebar-width": "calc(var(--spacing) * 72)",
                    "--header-height": "calc(var(--spacing) * 12)",
                } as React.CSSProperties
            }
        >
            <AppSidebar variant="inset" />
            <SidebarInset>
                <SiteHeader user={session?.user} breadcrumbs={breadcrumbs} />
                <div className="flex flex-1 flex-col p-4 md:p-6">
                    <ApiCasesClient data={data} />
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
