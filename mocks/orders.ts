// Generate helper function
const getRandom = (arr: any[]) => arr[Math.floor(Math.random() * arr.length)];

const baseOrders = [
  { 
    id: "1", 
    orderNo: "ORD-20231001", 
    customerName: "Acme Corp", 
    amount: 1200.50, 
    status: "paid", 
    orderDate: "2023-10-01T10:00:00Z" 
  },
  { 
    id: "2", 
    orderNo: "ORD-20231002", 
    customerName: "Globex", 
    amount: 850.00, 
    status: "pending", 
    orderDate: "2023-10-02T14:30:00Z" 
  },
  { 
    id: "3", 
    orderNo: "ORD-20231005", 
    customerName: "Soylent Corp", 
    amount: 2300.00, 
    status: "shipped", 
    orderDate: "2023-10-05T09:15:00Z" 
  },
  { id: "4", orderNo: "ORD-20231006", customerName: "Initech", amount: 1500.00, status: "pending", orderDate: "2023-10-06T09:00:00Z" },
  { id: "5", orderNo: "ORD-20231007", customerName: "Umbrella Corp", amount: 3200.50, status: "paid", orderDate: "2023-10-07T10:15:00Z" },
  { id: "6", orderNo: "ORD-20231008", customerName: "Stark Ind", amount: 9900.00, status: "shipped", orderDate: "2023-10-08T11:30:00Z" },
  { id: "7", orderNo: "ORD-20231009", customerName: "Wayne Ent", amount: 5400.25, status: "pending", orderDate: "2023-10-09T14:45:00Z" },
  { id: "8", orderNo: "ORD-20231010", customerName: "Cyberdyne", amount: 2100.00, status: "cancelled", orderDate: "2023-10-10T16:20:00Z" },
  { id: "9", orderNo: "ORD-20231011", customerName: "Massive Dynamic", amount: 1850.75, status: "paid", orderDate: "2023-10-11T09:10:00Z" },
  { id: "10", orderNo: "ORD-20231012", customerName: "Hooli", amount: 670.00, status: "shipped", orderDate: "2023-10-12T13:25:00Z" },
  { id: "11", orderNo: "ORD-20231013", customerName: "Pied Piper", amount: 120.50, status: "pending", orderDate: "2023-10-13T15:40:00Z" },
  { id: "12", orderNo: "ORD-20231014", customerName: "Aperture Science", amount: 3400.00, status: "paid", orderDate: "2023-10-14T11:05:00Z" },
  { id: "13", orderNo: "ORD-20231015", customerName: "Black Mesa", amount: 2900.25, status: "shipped", orderDate: "2023-10-15T10:55:00Z" },
  { id: "14", orderNo: "ORD-20231016", customerName: "Tyrell Corp", amount: 5600.00, status: "cancelled", orderDate: "2023-10-16T09:45:00Z" },
  { id: "15", orderNo: "ORD-20231017", customerName: "Weyland-Yutani", amount: 8200.50, status: "pending", orderDate: "2023-10-17T14:15:00Z" },
  { id: "16", orderNo: "ORD-20231018", customerName: "OCP", amount: 1350.00, status: "paid", orderDate: "2023-10-18T16:30:00Z" },
  { id: "17", orderNo: "ORD-20231019", customerName: "Genco Olive", amount: 450.75, status: "shipped", orderDate: "2023-10-19T12:00:00Z" },
  { id: "18", orderNo: "ORD-20231020", customerName: "Bubba Gump", amount: 320.00, status: "pending", orderDate: "2023-10-20T11:20:00Z" },
  { id: "19", orderNo: "ORD-20231021", customerName: "Stark Ind", amount: 7600.00, status: "paid", orderDate: "2023-10-21T09:35:00Z" },
  { id: "20", orderNo: "ORD-20231022", customerName: "Wayne Ent", amount: 4300.25, status: "shipped", orderDate: "2023-10-22T15:50:00Z" },
  { id: "21", orderNo: "ORD-20231023", customerName: "Cyberdyne", amount: 1900.00, status: "cancelled", orderDate: "2023-10-23T10:40:00Z" },
  { id: "22", orderNo: "ORD-20231024", customerName: "Initech", amount: 1600.50, status: "pending", orderDate: "2023-10-24T13:10:00Z" },
  { id: "23", orderNo: "ORD-20231025", customerName: "Umbrella Corp", amount: 3100.00, status: "paid", orderDate: "2023-10-25T14:55:00Z" },
  { id: "24", orderNo: "ORD-20231026", customerName: "Massive Dynamic", amount: 1750.75, status: "shipped", orderDate: "2023-10-26T11:45:00Z" },
  { id: "25", orderNo: "ORD-20231027", customerName: "Hooli", amount: 890.00, status: "pending", orderDate: "2023-10-27T09:25:00Z" },
  { id: "26", orderNo: "ORD-20231028", customerName: "Pied Piper", amount: 230.50, status: "paid", orderDate: "2023-10-28T16:05:00Z" },
  { id: "27", orderNo: "ORD-20231029", customerName: "Aperture Science", amount: 3600.00, status: "shipped", orderDate: "2023-10-29T10:30:00Z" },
  { id: "28", orderNo: "ORD-20231030", customerName: "Black Mesa", amount: 2700.25, status: "cancelled", orderDate: "2023-10-30T12:15:00Z" },
  { id: "29", orderNo: "ORD-20231031", customerName: "Tyrell Corp", amount: 5800.00, status: "pending", orderDate: "2023-10-31T15:25:00Z" },
  { id: "30", orderNo: "ORD-20231101", customerName: "Weyland-Yutani", amount: 7900.50, status: "paid", orderDate: "2023-11-01T09:50:00Z" },
  { id: "31", orderNo: "ORD-20231102", customerName: "OCP", amount: 1450.00, status: "shipped", orderDate: "2023-11-02T13:40:00Z" },
  { id: "32", orderNo: "ORD-20231103", customerName: "Genco Olive", amount: 550.75, status: "pending", orderDate: "2023-11-03T11:10:00Z" },
  { id: "33", orderNo: "ORD-20231104", customerName: "Bubba Gump", amount: 420.00, status: "paid", orderDate: "2023-11-04T14:35:00Z" },
  { id: "34", orderNo: "ORD-20231105", customerName: "Globex", amount: 950.00, status: "shipped", orderDate: "2023-11-05T10:05:00Z" },
  { id: "35", orderNo: "ORD-20231106", customerName: "Acme Corp", amount: 1100.50, status: "cancelled", orderDate: "2023-11-06T16:50:00Z" },
  { id: "36", orderNo: "ORD-20231107", customerName: "Soylent Corp", amount: 2400.00, status: "pending", orderDate: "2023-11-07T09:15:00Z" },
  { id: "37", orderNo: "ORD-20231108", customerName: "Initech", amount: 1700.50, status: "paid", orderDate: "2023-11-08T12:45:00Z" },
  { id: "38", orderNo: "ORD-20231109", customerName: "Umbrella Corp", amount: 3300.00, status: "shipped", orderDate: "2023-11-09T15:10:00Z" },
  { id: "39", orderNo: "ORD-20231110", customerName: "Stark Ind", amount: 8100.25, status: "pending", orderDate: "2023-11-10T11:55:00Z" }
];

export const MOCK_ORDERS = baseOrders.map(order => ({
  ...order,
  paymentMethod: getRandom(["wechat", "alipay", "bank", "credit"]),
  orderSource: getRandom(["web", "app", "store", "partner"]),
  deliveryDate: new Date(new Date(order.orderDate).getTime() + 86400000 * Math.floor(Math.random() * 5 + 1)).toISOString().split('T')[0],
  recipient: `Contact ${order.customerName.split(' ')[0]}`,
  shippingAddress: `${getRandom(['East', 'West', 'North', 'South'])} Street, No. ${Math.floor(Math.random() * 1000)}`,
  trackingNumber: `SF${Math.floor(Math.random() * 10000000000)}`
}));

export const getMockData = async (modelName: string) => {
  if (modelName === "orders") {
    return MOCK_ORDERS;
  }
  return [];
};
