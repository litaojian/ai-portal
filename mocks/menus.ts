export const mockMenus = {
  navMain: [
    { title: "仪表盘 (Mock)", url: "/dashboard", icon: "IconDashboard", isActive: true },
  ],
  navSecondary: [
    { title: "设置", url: "#", icon: "IconSettings" },
    { title: "搜索", url: "#", icon: "IconSearch" },
  ],
  navApps: [
    { title: "应用", url: "/apps", icon: "IconApps" , items:[
      { title: "用户管理", url: "/users", icon: "IconUsers" },
      { title: "角色管理", url: "/roles", icon: "IconUsers" },
      { title: "订单管理", url: "/portal/orders", icon: "IconUsers" },
      { title: "OIDC 客户端", url: "/oidc/clients", icon: "IconSettings" },
    ]},
    { title: "订单", url: "/portal", icon: "IconApps" , items:[
      { title: "订单管理", url: "/orders", icon: "IconUsers" },
    ]},
  ],
  
  navClouds: []
};
