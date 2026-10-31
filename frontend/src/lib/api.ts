import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api/v1',
  timeout: 10000,
});

export interface DashboardSummary {
  active_subscriptions: number;
  customers: number;
  products: number;
  overdue_invoices: number;
  total_revenue: number;
  mr: number;
}
