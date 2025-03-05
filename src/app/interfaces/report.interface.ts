export interface SalesReport {
  today: number;
  thisWeek: number;
  thisMonth: number;
  todayOrders: number;
  weekOrders: number;
  monthOrders: number;
}

export interface TopProduct {
  name: string;
  image: string;
  totalQuantity: number;
  totalAmount: number;
}

export interface ReportData {
  sales: SalesReport;
  topProducts: TopProduct[];
} 