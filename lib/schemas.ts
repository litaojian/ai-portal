import { z } from "zod";

export const projectSchema = z.object({
  name: z.string().min(1, "项目名称不能为空"),
  description: z.string().optional(),
  leader: z.string().optional(),
  budget: z.coerce.number().min(0, "预算不能为负数").default(0),
  status: z.enum(["进行中", "已完成", "暂停", "未开始"]).default("进行中"),
  priority: z.enum(["高", "中", "低"]).default("中"),
  startDate: z.date(),
  endDate: z.date().optional(),
}).refine((data) => {
  if (data.endDate && data.startDate) {
    return data.endDate >= data.startDate;
  }
  return true;
}, {
  message: "结束日期必须晚于开始日期",
  path: ["endDate"],
});

export type ProjectFormValues = z.infer<typeof projectSchema>;
