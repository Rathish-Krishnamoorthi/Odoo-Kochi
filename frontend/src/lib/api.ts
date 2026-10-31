import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';

const ACCESS_KEY = 'brightloop_access_token';
const REFRESH_KEY = 'brightloop_refresh_token';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api/v1',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

export interface TokenPair {
  access_token: string;
  refresh_token: string;
  token_type?: string;
}

export interface DashboardSummary {
  active_subscriptions?: number;
  customers?: number;
  products?: number;
  overdue_invoices?: number;
  total_revenue?: number;
  [key: string]: unknown;
}

export function saveTokens(tokens: TokenPair) {
  localStorage.setItem(ACCESS_KEY, tokens.access_token);
  localStorage.setItem(REFRESH_KEY, tokens.refresh_token);
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

export function hasAccessToken() {
  return Boolean(localStorage.getItem(ACCESS_KEY));
}

let refreshRequest: Promise<string | null> | null = null;
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem(ACCESS_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const request = error.config as (InternalAxiosRequestConfig & { _retried?: boolean }) | undefined;
    if (error.response?.status !== 401 || !request || request._retried || request.url?.includes('/auth/')) {
      return Promise.reject(error);
    }

    const refreshToken = localStorage.getItem(REFRESH_KEY);
    if (!refreshToken) {
      clearTokens();
      window.dispatchEvent(new Event('auth:expired'));
      return Promise.reject(error);
    }
    request._retried = true;
    try {
      if (!refreshRequest) {
        refreshRequest = api
          .post<TokenPair>('/auth/refresh', { refresh_token: refreshToken })
          .then(({ data }) => {
            saveTokens(data);
            return data.access_token;
          })
          .catch(() => {
            clearTokens();
            window.dispatchEvent(new Event('auth:expired'));
            return null;
          })
          .finally(() => {
            refreshRequest = null;
          });
      }
      const newToken = await refreshRequest;
      if (!newToken) return Promise.reject(error);
      request.headers.Authorization = `Bearer ${newToken}`;
      return api(request);
    } catch (refreshError) {
      return Promise.reject(refreshError);
    }
  },
);

export function errorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { detail?: unknown; message?: unknown } | undefined;
    if (typeof data?.detail === 'string') return data.detail;
    if (Array.isArray(data?.detail)) return data.detail.map((item) => item.msg).join(', ');
    if (typeof data?.message === 'string') return data.message;
    if (error.code === 'ECONNABORTED') return 'The request timed out. Please try again.';
    if (!error.response) return 'Cannot reach the API. Check the server and try again.';
    return `Request failed (${error.response.status}).`;
  }
  return error instanceof Error ? error.message : 'Something went wrong.';
}

export function formatMinorCurrency(value: unknown) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return '—';
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'INR' }).format(amount / 100);
}
