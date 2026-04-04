import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { SiteHeader } from "@/components/site-header";
import {
    SidebarInset,
    SidebarProvider,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import WriterClient from "@/components/cms/writer-client";

export default async function WriterPage() {
    const session = await getServerSession(authOptions);

    const breadcrumbs = [
        { label: "首页", href: "/" },
        { label: "AI 内容生产线", href: "#" },
        { label: "AI 智能创作", href: "#" },
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
                <div className="flex flex-1 flex-col p-4 md:p-6 overflow-hidden">
                    <WriterClient />
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
