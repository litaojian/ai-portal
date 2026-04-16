import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { SiteHeader } from "@/components/site-header";
import {
    SidebarInset,
    SidebarProvider,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { TopicDetailClient } from "@/components/cms/topic-detail-client";

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function TopicDetailPage({ params }: PageProps) {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    const breadcrumbs = [
        { label: "首页", href: "/" },
        { label: "工作台", href: "#" },
        { label: "新开专栏", href: "/portal/cms/topics" },
        { label: "专栏详情", href: "#" },
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
                <SiteHeader
                    user={session?.user}
                    breadcrumbs={breadcrumbs}
                />
                <div className="flex flex-1 flex-col gap-4 p-2 md:p-4">
                    <TopicDetailClient topicId={id} />
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
