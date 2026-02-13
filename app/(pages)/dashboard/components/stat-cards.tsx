import { IconTrendingDown, IconTrendingUp } from "@tabler/icons-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function StatCards() {
  return (
    <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      {/* 总收入卡片 */}
      <Card className="@container/card group hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 hover:scale-[1.02] hover:border-primary/30 relative overflow-hidden bg-gradient-to-br from-primary/5 via-card to-card">
        {/* 背景装饰 */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-colors duration-500" />

        <CardHeader className="relative">
          <CardDescription className="text-xs uppercase tracking-wider font-bold text-muted-foreground/70 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary/50 group-hover:animate-pulse" />
            总收入
          </CardDescription>
          <CardTitle className="text-3xl font-bold tabular-nums @[250px]/card:text-4xl bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
            ¥1,250.00
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="gap-1.5 bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20 hover:bg-green-500/20 transition-colors">
              <IconTrendingUp className="h-3.5 w-3.5" />
              +12.5%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-2 text-sm relative">
          <div className="line-clamp-1 flex items-center gap-2 font-semibold text-green-600 dark:text-green-400">
            <IconTrendingUp className="size-4 animate-bounce" />
            本月呈上升趋势
          </div>
          <div className="text-xs text-muted-foreground">
            过去 30 天增长 12.5%
          </div>
        </CardFooter>
      </Card>
      {/* 新增客户卡片 */}
      <Card className="@container/card group hover:shadow-xl hover:shadow-destructive/10 transition-all duration-300 hover:scale-[1.02] hover:border-destructive/30 relative overflow-hidden bg-gradient-to-br from-destructive/5 via-card to-card">
        <div className="absolute top-0 right-0 w-32 h-32 bg-destructive/10 rounded-full blur-3xl group-hover:bg-destructive/20 transition-colors duration-500" />

        <CardHeader className="relative">
          <CardDescription className="text-xs uppercase tracking-wider font-bold text-muted-foreground/70 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-accent/50 group-hover:animate-pulse" />
            新增客户
          </CardDescription>
          <CardTitle className="text-3xl font-bold tabular-nums @[250px]/card:text-4xl bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
            1,234
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="gap-1.5 bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20 hover:bg-red-500/20 transition-colors">
              <IconTrendingDown className="h-3.5 w-3.5" />
              -20%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-2 text-sm relative">
          <div className="line-clamp-1 flex items-center gap-2 font-semibold text-red-600 dark:text-red-400">
            <IconTrendingDown className="size-4" />
            本期下降 20%
          </div>
          <div className="text-xs text-muted-foreground">
            获客策略需要优化
          </div>
        </CardFooter>
      </Card>

      {/* 活跃账户卡片 */}
      <Card className="@container/card group hover:shadow-xl hover:shadow-accent/10 transition-all duration-300 hover:scale-[1.02] hover:border-accent/30 relative overflow-hidden bg-gradient-to-br from-accent/5 via-card to-card">
        <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 rounded-full blur-3xl group-hover:bg-accent/20 transition-colors duration-500" />

        <CardHeader className="relative">
          <CardDescription className="text-xs uppercase tracking-wider font-bold text-muted-foreground/70 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-accent/50 group-hover:animate-pulse" />
            活跃账户
          </CardDescription>
          <CardTitle className="text-3xl font-bold tabular-nums @[250px]/card:text-4xl bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
            45,678
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="gap-1.5 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20 hover:bg-cyan-500/20 transition-colors">
              <IconTrendingUp className="h-3.5 w-3.5" />
              +12.5%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-2 text-sm relative">
          <div className="line-clamp-1 flex items-center gap-2 font-semibold text-cyan-600 dark:text-cyan-400">
            <IconTrendingUp className="size-4 animate-bounce" />
            用户留存率高
          </div>
          <div className="text-xs text-muted-foreground">
            参与度超出目标 25%
          </div>
        </CardFooter>
      </Card>

      {/* 增长率卡片 */}
      <Card className="@container/card group hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 hover:scale-[1.02] hover:border-primary/30 relative overflow-hidden bg-gradient-to-br from-primary/5 via-accent/5 to-card">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/10 to-accent/10 rounded-full blur-3xl group-hover:opacity-100 opacity-70 transition-opacity duration-500" />

        <CardHeader className="relative">
          <CardDescription className="text-xs uppercase tracking-wider font-bold text-muted-foreground/70 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary/50 group-hover:animate-pulse" />
            增长率
          </CardDescription>
          <CardTitle className="text-3xl font-bold tabular-nums @[250px]/card:text-4xl bg-gradient-to-br from-primary via-accent to-primary bg-clip-text text-transparent">
            4.5%
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="gap-1.5 bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20 hover:bg-purple-500/20 transition-colors">
              <IconTrendingUp className="h-3.5 w-3.5" />
              +4.5%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-2 text-sm relative">
          <div className="line-clamp-1 flex items-center gap-2 font-semibold text-purple-600 dark:text-purple-400">
            <IconTrendingUp className="size-4 animate-bounce" />
            业绩稳步增长
          </div>
          <div className="text-xs text-muted-foreground">
            符合季度增长预期
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
