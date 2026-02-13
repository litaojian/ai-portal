"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DateRangePicker } from "@/components/common/date-range-picker";
import { DateRange } from "react-day-picker";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Search, RotateCcw, Printer, Download, MoreVertical } from "lucide-react";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { OrderForm } from "./order-form";

// 订单数据类型
interface Order {
  id: string;
  orderNumber: string;
  orderDate: Date;
  customer: string;
  amount: number;
  salesperson: string;
  status: "completed" | "processing" | "cancelled";
}

// 模拟订单数据
const mockOrders: Order[] = [
  {
    id: "1",
    orderNumber: "SO20260208-0001",
    orderDate: new Date(2026, 1, 8),
    customer: "上海华兴置业有限公司",
    amount: 12456.0,
    salesperson: "张德财",
    status: "completed",
  },
  {
    id: "2",
    orderNumber: "SO20260208-0002",
    orderDate: new Date(2026, 1, 8),
    customer: "北京国融投资集团有限公司",
    amount: 5888.0,
    salesperson: "李洁",
    status: "processing",
  },
  {
    id: "3",
    orderNumber: "SO20260207-0098",
    orderDate: new Date(2026, 1, 7),
    customer: "深圳融盛金华集团",
    amount: 82108.0,
    salesperson: "陈承远",
    status: "completed",
  },
  {
    id: "4",
    orderNumber: "SO20260207-0095",
    orderDate: new Date(2026, 1, 7),
    customer: "成都泰诚投资集团",
    amount: 3400.0,
    salesperson: "李洁",
    status: "cancelled",
  },
  {
    id: "5",
    orderNumber: "SO20260206-0042",
    orderDate: new Date(2026, 1, 6),
    customer: "广州赛富电子商务",
    amount: 15900.0,
    salesperson: "张德财",
    status: "processing",
  },
];

export function OrdersContent() {
  const router = useRouter();
  const [orders] = useState<Order[]>(mockOrders);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>(mockOrders);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);

  // 筛选条件
  const [orderNumber, setOrderNumber] = useState("");
  const [customerFilter, setCustomerFilter] = useState("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [statusFilters, setStatusFilters] = useState({
    processing: false,
    completed: false,
    cancelled: false,
  });
  const [isNewOrderOpen, setIsNewOrderOpen] = useState(false);

  // 处理查询
  const handleSearch = () => {
    let filtered = [...orders];

    // 订单编号筛选
    if (orderNumber) {
      filtered = filtered.filter((order) =>
        order.orderNumber.toLowerCase().includes(orderNumber.toLowerCase())
      );
    }

    // 客户名称筛选
    if (customerFilter !== "all") {
      filtered = filtered.filter((order) => order.customer === customerFilter);
    }

    // 日期筛选
    if (dateRange?.from) {
      filtered = filtered.filter((order) => order.orderDate >= dateRange.from!);
    }
    if (dateRange?.to) {
      filtered = filtered.filter((order) => order.orderDate <= dateRange.to!);
    }

    // 状态筛选
    const activeStatuses = Object.entries(statusFilters)
      .filter(([, checked]) => checked)
      .map(([status]) => status);

    if (activeStatuses.length > 0) {
      filtered = filtered.filter((order) =>
        activeStatuses.includes(order.status)
      );
    }

    setFilteredOrders(filtered);
  };

  // 重置筛选
  const handleReset = () => {
    setOrderNumber("");
    setCustomerFilter("all");
    setDateRange(undefined);
    setStatusFilters({
      processing: false,
      completed: false,
      cancelled: false,
    });
    setFilteredOrders(orders);
  };

  // 全选/取消全选
  const toggleSelectAll = () => {
    if (selectedOrders.length === filteredOrders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(filteredOrders.map((order) => order.id));
    }
  };

  // 单个选择
  const toggleSelectOrder = (orderId: string) => {
    if (selectedOrders.includes(orderId)) {
      setSelectedOrders(selectedOrders.filter((id) => id !== orderId));
    } else {
      setSelectedOrders([...selectedOrders, orderId]);
    }
  };

  // 获取状态文本和颜色
  const getStatusDisplay = (status: Order["status"]) => {
    const statusMap = {
      completed: { text: "已完成", color: "text-green-600" },
      processing: { text: "进行中", color: "text-yellow-600" },
      cancelled: { text: "已取消", color: "text-gray-500" },
    };
    return statusMap[status];
  };

  return (
    <div className="h-full flex flex-col space-y-4">
      {/* 筛选区域 - 紧凑型 */}
      <div className="bg-background border rounded-lg p-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          {/* 订单编号 */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium whitespace-nowrap">单号</span>
            <Input
              placeholder="订单编号"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              className="w-[180px] h-8"
            />
          </div>

          {/* 客户名称 */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium whitespace-nowrap">客户</span>
            <Select value={customerFilter} onValueChange={setCustomerFilter}>
              <SelectTrigger className="w-[180px] h-8">
                <SelectValue placeholder="全部客户" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部客户</SelectItem>
                {Array.from(new Set(orders.map((o) => o.customer))).map(
                  (customer) => (
                    <SelectItem key={customer} value={customer}>
                      {customer}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
          </div>

          {/* 日期范围 */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium whitespace-nowrap">日期</span>
            <DateRangePicker
              value={dateRange}
              onChange={setDateRange}
              className="w-[240px] h-8"
            />
          </div>

          {/* 状态筛选 */}
          <div className="flex items-center gap-3 ml-2 pl-3 h-8">
            <div className="flex items-center gap-1.5">
              <Checkbox
                id="processing"
                checked={statusFilters.processing}
                onCheckedChange={(checked) =>
                  setStatusFilters({ ...statusFilters, processing: !!checked })
                }
              />
              <label htmlFor="processing" className="text-sm cursor-pointer whitespace-nowrap">
                进行中
              </label>
            </div>

            <div className="flex items-center gap-1.5">
              <Checkbox
                id="completed"
                checked={statusFilters.completed}
                onCheckedChange={(checked) =>
                  setStatusFilters({ ...statusFilters, completed: !!checked })
                }
              />
              <label htmlFor="completed" className="text-sm cursor-pointer whitespace-nowrap">
                已完成
              </label>
            </div>

            <div className="flex items-center gap-1.5">
              <Checkbox
                id="cancelled"
                checked={statusFilters.cancelled}
                onCheckedChange={(checked) =>
                  setStatusFilters({ ...statusFilters, cancelled: !!checked })
                }
              />
              <label htmlFor="cancelled" className="text-sm cursor-pointer whitespace-nowrap">
                已取消
              </label>
            </div>
          </div>

          {/* 按钮行 */}
          <div className="flex items-center gap-2 ml-auto">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="h-8 px-2 lg:px-3 text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
              重置
            </Button>
            <Button onClick={handleSearch} size="sm" className="h-8 px-3">
              <Search className="w-3.5 h-3.5 mr-1.5" />
              查询
            </Button>
          </div>
        </div>
      </div>

      {/* 列表标题和操作 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">订单列表</h2>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            {filteredOrders.length}
          </span>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2 h-8">
            <Printer className="w-4 h-4" />
            打印
          </Button>
          <Button variant="outline" size="sm" className="gap-2 h-8">
            <Download className="w-4 h-4" />
            导出
          </Button>

          <Dialog open={isNewOrderOpen} onOpenChange={setIsNewOrderOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2 h-8">
                <Plus className="w-4 h-4" />
                新增订单
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-6">
              <DialogHeader>
                <DialogTitle>新建订单</DialogTitle>
              </DialogHeader>
              <OrderForm
                onSuccess={() => {
                  setIsNewOrderOpen(false);
                  // Optionally refresh list here
                }}
                onCancel={() => setIsNewOrderOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* 订单表格 */}
      <Card className="flex-1 min-h-0 flex flex-col">
        <CardContent className="p-0 flex-1 overflow-auto relative">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={
                      selectedOrders.length === filteredOrders.length &&
                      filteredOrders.length > 0
                    }
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead>单据编号</TableHead>
                <TableHead>单据日期</TableHead>
                <TableHead>客户名称</TableHead>
                <TableHead className="text-right">总金额 (¥)</TableHead>
                <TableHead>销售人员</TableHead>
                <TableHead>状态</TableHead>
                <TableHead className="text-center">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                    暂无数据
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders.map((order) => {
                  const statusDisplay = getStatusDisplay(order.status);
                  return (
                    <TableRow
                      key={order.id}
                      className={
                        selectedOrders.includes(order.id) ? "bg-muted/50" : ""
                      }
                    >
                      <TableCell>
                        <Checkbox
                          checked={selectedOrders.includes(order.id)}
                          onCheckedChange={() => toggleSelectOrder(order.id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium text-primary">
                        {order.orderNumber}
                      </TableCell>
                      <TableCell>
                        {format(order.orderDate, "yyyy-MM-dd", { locale: zhCN })}
                      </TableCell>
                      <TableCell>{order.customer}</TableCell>
                      <TableCell className="text-right font-semibold">
                        {order.amount.toLocaleString("zh-CN", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </TableCell>
                      <TableCell>{order.salesperson}</TableCell>
                      <TableCell>
                        <span className={statusDisplay.color}>
                          {statusDisplay.text}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>查看详情</DropdownMenuItem>
                            <DropdownMenuItem>编辑</DropdownMenuItem>
                            <DropdownMenuItem>打印</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">
                              删除
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 分页 */}
      <div className="flex items-center justify-between mt-auto pt-2">
        <div className="text-sm text-muted-foreground">
          显示第 1-{Math.min(10, filteredOrders.length)} 条，共 {filteredOrders.length} 条
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled>
            ‹
          </Button>
          <Button variant="default" size="sm">
            1
          </Button>
          <Button variant="outline" size="sm">
            2
          </Button>
          <Button variant="outline" size="sm">
            3
          </Button>
          <Button variant="outline" size="sm">
            4
          </Button>
          <Button variant="outline" size="sm">
            5
          </Button>
          <Button variant="outline" size="sm">
            ›
          </Button>
        </div>
      </div>
    </div>
  );
}
