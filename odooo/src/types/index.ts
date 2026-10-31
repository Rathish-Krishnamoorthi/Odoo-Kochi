export type UserRole = 'ADMIN' | 'STAFF' | 'CUSTOMER';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  phone?: string;
}

export interface CustomerProfile {
  user_id: string;
  company_name?: string;
  tax_id_gstin?: string;
  billing_address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  assigned_staff_id?: string;
  active_subscriptions_count?: number;
  total_outstanding?: number;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  name: string;
  variant_code: string;
  additional_price: number;
  description?: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface Product {
  id: string;
  product_code: string;
  name: string;
  type: 'SOFTWARE' | 'SERVICE' | 'ADD_ON' | 'OTHER';
  description?: string;
  internal_notes?: string;
  sales_price: number;
  cost_price: number;
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
  variants?: ProductVariant[];
  created_at?: string;
}

export interface PlanProduct {
  id: string;
  plan_id: string;
  product_id: string;
  variant_id?: string;
  product_name?: string;
  variant_name?: string;
  is_primary: number;
  default_quantity: number;
  sales_price?: number;
  additional_price?: number;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description?: string;
  billing_frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  base_price: number;
  minimum_quantity: number;
  allow_pause: number;
  allow_early_closure: number;
  allow_renewal: number;
  auto_close_on_expiry: number;
  availability_start_date?: string;
  availability_end_date?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
  products?: PlanProduct[];
  created_at?: string;
}

export interface QuotationLine {
  id?: string;
  product_id: string;
  variant_id?: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  tax_amount?: number;
  total_amount?: number;
}

export interface Quotation {
  id: string;
  quotation_number: string;
  customer_id: string;
  customer_name?: string;
  customer_email?: string;
  company_name?: string;
  plan_id?: string;
  plan_name?: string;
  billing_frequency?: string;
  quotation_date: string;
  expiry_date: string;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  grand_total: number;
  status: 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';
  notes?: string;
  converted_subscription_id?: string;
  lines?: QuotationLine[];
  created_at?: string;
}

export interface SubscriptionLine {
  id?: string;
  product_id: string;
  variant_id?: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  tax_amount?: number;
  total_amount: number;
}

export interface SubscriptionHistoryItem {
  id: string;
  subscription_id: string;
  from_status?: string;
  to_status: string;
  action: string;
  actor_id?: string;
  actor_name?: string;
  notes?: string;
  created_at: string;
}

export interface Subscription {
  id: string;
  subscription_number: string;
  customer_id: string;
  customer_name?: string;
  customer_email?: string;
  company_name?: string;
  plan_id: string;
  plan_name?: string;
  start_date: string;
  expiry_date?: string;
  next_billing_date: string;
  billing_frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  status: 'DRAFT' | 'CONFIRMED' | 'ACTIVE' | 'PAUSED' | 'CANCELLED' | 'CLOSED' | 'EXPIRED';
  auto_renew: number;
  payment_terms_days: number;
  notes?: string;
  lines?: SubscriptionLine[];
  invoices?: Invoice[];
  history?: SubscriptionHistoryItem[];
  allow_pause?: number;
  allow_early_closure?: number;
  allow_renewal?: number;
  created_at?: string;
}

export interface InvoiceLine {
  id?: string;
  product_id: string;
  variant_id?: string;
  description: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  customer_id: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  company_name?: string;
  tax_id_gstin?: string;
  billing_address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  subscription_id?: string;
  subscription_number?: string;
  invoice_date: string;
  due_date: string;
  billing_period_start: string;
  billing_period_end: string;
  subtotal: number;
  tax_amount: number;
  cgst_amount: number;
  sgst_amount: number;
  igst_amount: number;
  discount_amount: number;
  total_amount: number;
  paid_amount: number;
  outstanding_amount: number;
  status: 'DRAFT' | 'CONFIRMED' | 'SENT' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  notes?: string;
  lines?: InvoiceLine[];
  payments?: any[];
  created_at?: string;
}

export interface Payment {
  id: string;
  payment_reference: string;
  customer_id: string;
  customer_name?: string;
  invoice_id: string;
  invoice_number?: string;
  invoice_total?: number;
  amount: number;
  payment_method: 'BANK_TRANSFER' | 'CASH' | 'UPI' | 'CARD' | 'ONLINE_GATEWAY' | 'OTHER';
  payment_date: string;
  transaction_reference?: string;
  status: 'SUCCESS' | 'PENDING' | 'FAILED';
  notes?: string;
}

export interface Tax {
  id: string;
  name: string;
  percentage: number;
  tax_type: 'GST' | 'VAT' | 'SALES_TAX' | 'CUSTOM';
  cgst_rate: number;
  sgst_rate: number;
  igst_rate: number;
  effective_start_date?: string;
  effective_end_date?: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface Discount {
  id: string;
  code: string;
  name: string;
  description?: string;
  discount_type: 'PERCENTAGE' | 'FIXED_AMOUNT';
  value: number;
  minimum_purchase_amount: number;
  minimum_quantity: number;
  start_date?: string;
  end_date?: string;
  max_usage_count?: number;
  current_usage_count: number;
  per_customer_limit: number;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface AppSettings {
  id: string;
  company_name: string;
  company_email: string;
  company_phone: string;
  company_address: string;
  gstin: string;
  currency: string;
  currency_symbol: string;
  timezone: string;
  invoice_prefix: string;
  quotation_prefix: string;
  subscription_prefix: string;
  payment_terms_days: number;
  tax_mode: string;
}

export interface InAppNotification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'QUOTATION' | 'INVOICE' | 'PAYMENT' | 'SUBSCRIPTION' | 'RENEWAL' | 'OVERDUE' | 'SYSTEM';
  link?: string;
  is_read: number;
  created_at: string;
}
