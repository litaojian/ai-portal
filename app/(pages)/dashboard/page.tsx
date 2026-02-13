import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { WelcomeModal } from "@/components/welcome-modal"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"

import { DashboardTable } from "./components/dashboard-table"
import { StatCards } from "./components/stat-cards"
import { VisitorsChart } from "./components/visitors-chart"
import { QuickApps } from "./components/quick-apps"
import { TodoList } from "./components/todo-list"
import { CalendarWidget } from "./components/calendar-widget"
import data from "./data.json"

export default async function Page() {
  const session = await getServerSession(authOptions)

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "350px",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader user={session?.user} />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-6 py-6 px-4 lg:px-6">
              {/* 统计卡片 - 全宽 */}
              <div>
                <StatCards />
              </div>

              {/* 网格布局区域 */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* 趋势图表 - 左侧 12 列 */}
                <div className="lg:col-span-12">
                  <VisitorsChart />
                </div>

                {/* 快捷应用 - 右侧 4 列 */}
                <div className="lg:col-span-4">
                  <QuickApps />
                </div>

                {/* 待办事项 - 左侧 4 列 */}
                <div className="lg:col-span-4">
                  <TodoList />
                </div>

                {/* 日历 - 中间 4 列 */}
                <div className="lg:col-span-4">
                  <CalendarWidget />
                </div>

                {/* 数据表格 - 右侧 4 列 */}
                <div className="lg:col-span-4">
                  <DashboardTable data={data} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>

      {/* 首次登录欢迎弹窗 */}
      <WelcomeModal userName={session?.user?.name || undefined} />
    </SidebarProvider>
  )
}