"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Clock, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

interface CalendarEvent {
  date: string;
  title: string;
  time: string;
  type: "meeting" | "deadline" | "reminder";
}

const eventTypeConfig = {
  meeting: {
    label: "会议",
    color: "bg-primary text-primary-foreground",
    dotColor: "bg-primary"
  },
  deadline: {
    label: "截止日期",
    color: "bg-destructive text-destructive-foreground",
    dotColor: "bg-destructive"
  },
  reminder: {
    label: "提醒",
    color: "bg-accent text-accent-foreground",
    dotColor: "bg-accent"
  }
};

const mockEvents: CalendarEvent[] = [
  {
    date: "2026-02-13",
    title: "团队周会",
    time: "14:00",
    type: "meeting"
  },
  {
    date: "2026-02-14",
    title: "项目截止日期",
    time: "18:00",
    type: "deadline"
  },
  {
    date: "2026-02-15",
    title: "代码评审",
    time: "10:00",
    type: "meeting"
  },
  {
    date: "2026-02-15",
    title: "提交月度报告",
    time: "17:00",
    type: "reminder"
  },
  {
    date: "2026-02-18",
    title: "客户演示",
    time: "15:30",
    type: "meeting"
  }
];

export function CalendarWidget() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  // 获取有事件的日期
  const datesWithEvents = mockEvents.map(event => new Date(event.date));

  // 获取选中日期的事件
  const selectedDateEvents = selectedDate
    ? mockEvents.filter(event => {
        const eventDate = new Date(event.date);
        return eventDate.toDateString() === selectedDate.toDateString();
      })
    : [];

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold">日历</CardTitle>
          <Badge variant="outline" className="text-xs">
            {mockEvents.length} 项日程
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 p-4 pt-0">
        {/* 日历组件 */}
        <div className="flex justify-center">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            className="rounded-lg border shadow-sm"
            modifiers={{
              hasEvent: datesWithEvents,
            }}
            modifiersClassNames={{
              hasEvent: "relative after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:rounded-full after:bg-primary"
            }}
          />
        </div>

        {/* 选中日期的事件列表 */}
        {selectedDateEvents.length > 0 ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
              <Clock className="h-4 w-4" />
              {selectedDate?.toLocaleDateString("zh-CN", {
                month: "long",
                day: "numeric"
              })} 的日程
            </div>

            <div className="space-y-2">
              {selectedDateEvents.map((event, index) => (
                <div
                  key={index}
                  className="group flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className={cn(
                    "w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0",
                    eventTypeConfig[event.type].dotColor
                  )} />

                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm leading-tight">
                      {event.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">
                        {event.time}
                      </span>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs h-5",
                          eventTypeConfig[event.type].color
                        )}
                      >
                        {eventTypeConfig[event.type].label}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : selectedDate ? (
          <div className="text-center py-4 text-muted-foreground">
            <Circle className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-xs">当天暂无日程安排</p>
          </div>
        ) : null}

        {/* 事件类型图例 */}
        <div className="flex items-center justify-center gap-4 pt-2 border-t">
          {Object.entries(eventTypeConfig).map(([type, config]) => (
            <div key={type} className="flex items-center gap-1.5">
              <div className={cn("w-2 h-2 rounded-full", config.dotColor)} />
              <span className="text-xs text-muted-foreground">
                {config.label}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
