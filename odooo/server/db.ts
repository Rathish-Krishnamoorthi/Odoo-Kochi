import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';

const DB_DIR = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const DB_PATH = path.join(DB_DIR, 'brightloop.db');
export const db = new Database(DB_PATH);

// Enable WAL mode and foreign keys for high performance and integrity
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initDatabase() {
  db.exec(`
    -- 1. Users table
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('ADMIN', 'STAFF', 'CUSTOMER')),
      status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED')),
      phone TEXT,
      reset_token TEXT,
      reset_token_expires_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- 2. Staff Profiles
    CREATE TABLE IF NOT EXISTS staff_profiles (
      user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      department TEXT,
      designation TEXT,
      assigned_territory TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- 3. Customer Profiles
    CREATE TABLE IF NOT EXISTS customer_profiles (
      user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      company_name TEXT,
      tax_id_gstin TEXT,
      billing_address TEXT,
      city TEXT,
      state TEXT,
      postal_code TEXT,
      country TEXT DEFAULT 'India',
      assigned_staff_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- 4. Application Settings
    CREATE TABLE IF NOT EXISTS application_settings (
      id TEXT PRIMARY KEY DEFAULT 'default',
      company_name TEXT NOT NULL DEFAULT 'Brightloop Software Solutions Pvt Ltd',
      company_email TEXT NOT NULL DEFAULT 'billing@brightloop.io',
      company_phone TEXT NOT NULL DEFAULT '+91 80 4123 4567',
      company_address TEXT NOT NULL DEFAULT 'Tower B, Tech Park, Indiranagar, Bengaluru, Karnataka, 560038',
      gstin TEXT NOT NULL DEFAULT '29AABCB1234F1Z5',
      currency TEXT NOT NULL DEFAULT 'INR',
      currency_symbol TEXT NOT NULL DEFAULT '₹',
      timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
      invoice_prefix TEXT NOT NULL DEFAULT 'INV-',
      quotation_prefix TEXT NOT NULL DEFAULT 'QTN-',
      subscription_prefix TEXT NOT NULL DEFAULT 'SUB-',
      payment_terms_days INTEGER NOT NULL DEFAULT 15,
      tax_mode TEXT NOT NULL DEFAULT 'GST_INDIA' CHECK(tax_mode IN ('GST_INDIA', 'STANDARD_VAT', 'FLAT_SALES_TAX')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- 5. Products
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      product_code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('SOFTWARE', 'SERVICE', 'ADD_ON', 'OTHER')),
      description TEXT,
      internal_notes TEXT,
      sales_price REAL NOT NULL DEFAULT 0,
      cost_price REAL NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE', 'INACTIVE', 'ARCHIVED')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- 6. Product Variants
    CREATE TABLE IF NOT EXISTS product_variants (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      variant_code TEXT NOT NULL,
      additional_price REAL NOT NULL DEFAULT 0,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE', 'INACTIVE')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(product_id, variant_code)
    );

    -- 7. Subscription Plans
    CREATE TABLE IF NOT EXISTS plans (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      billing_frequency TEXT NOT NULL CHECK(billing_frequency IN ('DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY')),
      base_price REAL NOT NULL,
      minimum_quantity INTEGER NOT NULL DEFAULT 1,
      allow_pause INTEGER NOT NULL DEFAULT 1,
      allow_early_closure INTEGER NOT NULL DEFAULT 1,
      allow_renewal INTEGER NOT NULL DEFAULT 1,
      auto_close_on_expiry INTEGER NOT NULL DEFAULT 1,
      availability_start_date TEXT,
      availability_end_date TEXT,
      status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE', 'INACTIVE', 'ARCHIVED')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- 8. Plan Products (Association & Included Products)
    CREATE TABLE IF NOT EXISTS plan_products (
      id TEXT PRIMARY KEY,
      plan_id TEXT NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
      product_id TEXT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
      variant_id TEXT REFERENCES product_variants(id) ON DELETE SET NULL,
      is_primary INTEGER NOT NULL DEFAULT 1,
      default_quantity INTEGER NOT NULL DEFAULT 1,
      UNIQUE(plan_id, product_id, variant_id)
    );

    -- 9. Taxes
    CREATE TABLE IF NOT EXISTS taxes (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      percentage REAL NOT NULL,
      tax_type TEXT NOT NULL DEFAULT 'GST' CHECK(tax_type IN ('GST', 'VAT', 'SALES_TAX', 'CUSTOM')),
      cgst_rate REAL NOT NULL DEFAULT 0,
      sgst_rate REAL NOT NULL DEFAULT 0,
      igst_rate REAL NOT NULL DEFAULT 0,
      effective_start_date TEXT,
      effective_end_date TEXT,
      status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE', 'INACTIVE')),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- 10. Discounts
    CREATE TABLE IF NOT EXISTS discounts (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      discount_type TEXT NOT NULL CHECK(discount_type IN ('PERCENTAGE', 'FIXED_AMOUNT')),
      value REAL NOT NULL,
      minimum_purchase_amount REAL NOT NULL DEFAULT 0,
      minimum_quantity INTEGER NOT NULL DEFAULT 1,
      start_date TEXT,
      end_date TEXT,
      max_usage_count INTEGER,
      current_usage_count INTEGER NOT NULL DEFAULT 0,
      per_customer_limit INTEGER NOT NULL DEFAULT 1,
      status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE', 'INACTIVE')),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- 11. Discount Usages
    CREATE TABLE IF NOT EXISTS discount_usages (
      id TEXT PRIMARY KEY,
      discount_id TEXT NOT NULL REFERENCES discounts(id) ON DELETE RESTRICT,
      customer_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      invoice_id TEXT,
      used_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- 12. Quotation Templates
    CREATE TABLE IF NOT EXISTS quotation_templates (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      plan_id TEXT REFERENCES plans(id) ON DELETE SET NULL,
      default_payment_terms_days INTEGER NOT NULL DEFAULT 15,
      validity_days INTEGER NOT NULL DEFAULT 30,
      created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- 13. Quotation Template Lines
    CREATE TABLE IF NOT EXISTS quotation_template_lines (
      id TEXT PRIMARY KEY,
      template_id TEXT NOT NULL REFERENCES quotation_templates(id) ON DELETE CASCADE,
      product_id TEXT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
      variant_id TEXT REFERENCES product_variants(id) ON DELETE SET NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      unit_price REAL NOT NULL DEFAULT 0
    );

    -- 14. Quotations
    CREATE TABLE IF NOT EXISTS quotations (
      id TEXT PRIMARY KEY,
      quotation_number TEXT UNIQUE NOT NULL,
      customer_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      plan_id TEXT REFERENCES plans(id) ON DELETE SET NULL,
      created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
      quotation_date TEXT NOT NULL,
      expiry_date TEXT NOT NULL,
      subtotal REAL NOT NULL DEFAULT 0,
      tax_amount REAL NOT NULL DEFAULT 0,
      discount_amount REAL NOT NULL DEFAULT 0,
      grand_total REAL NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'DRAFT' CHECK(status IN ('DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED')),
      notes TEXT,
      converted_subscription_id TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- 15. Quotation Lines
    CREATE TABLE IF NOT EXISTS quotation_lines (
      id TEXT PRIMARY KEY,
      quotation_id TEXT NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
      product_id TEXT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
      variant_id TEXT REFERENCES product_variants(id) ON DELETE SET NULL,
      product_name TEXT NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      unit_price REAL NOT NULL DEFAULT 0,
      tax_rate REAL NOT NULL DEFAULT 0,
      tax_amount REAL NOT NULL DEFAULT 0,
      total_amount REAL NOT NULL DEFAULT 0
    );

    -- 16. Subscriptions
    CREATE TABLE IF NOT EXISTS subscriptions (
      id TEXT PRIMARY KEY,
      subscription_number TEXT UNIQUE NOT NULL,
      customer_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      plan_id TEXT NOT NULL REFERENCES plans(id) ON DELETE RESTRICT,
      start_date TEXT NOT NULL,
      expiry_date TEXT,
      next_billing_date TEXT NOT NULL,
      billing_frequency TEXT NOT NULL CHECK(billing_frequency IN ('DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY')),
      subtotal REAL NOT NULL DEFAULT 0,
      tax_amount REAL NOT NULL DEFAULT 0,
      discount_amount REAL NOT NULL DEFAULT 0,
      total_amount REAL NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'DRAFT' CHECK(status IN ('DRAFT', 'CONFIRMED', 'ACTIVE', 'PAUSED', 'CANCELLED', 'CLOSED', 'EXPIRED')),
      auto_renew INTEGER NOT NULL DEFAULT 1,
      payment_terms_days INTEGER NOT NULL DEFAULT 15,
      notes TEXT,
      created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- 17. Subscription Lines
    CREATE TABLE IF NOT EXISTS subscription_lines (
      id TEXT PRIMARY KEY,
      subscription_id TEXT NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
      product_id TEXT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
      variant_id TEXT REFERENCES product_variants(id) ON DELETE SET NULL,
      product_name TEXT NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      unit_price REAL NOT NULL DEFAULT 0,
      tax_rate REAL NOT NULL DEFAULT 0,
      tax_amount REAL NOT NULL DEFAULT 0,
      total_amount REAL NOT NULL DEFAULT 0
    );

    -- 18. Subscription History (Lifecycle Audit)
    CREATE TABLE IF NOT EXISTS subscription_history (
      id TEXT PRIMARY KEY,
      subscription_id TEXT NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
      from_status TEXT,
      to_status TEXT NOT NULL,
      action TEXT NOT NULL,
      actor_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- 19. Invoices
    CREATE TABLE IF NOT EXISTS invoices (
      id TEXT PRIMARY KEY,
      invoice_number TEXT UNIQUE NOT NULL,
      customer_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      subscription_id TEXT REFERENCES subscriptions(id) ON DELETE SET NULL,
      invoice_date TEXT NOT NULL,
      due_date TEXT NOT NULL,
      billing_period_start TEXT NOT NULL,
      billing_period_end TEXT NOT NULL,
      subtotal REAL NOT NULL DEFAULT 0,
      tax_amount REAL NOT NULL DEFAULT 0,
      cgst_amount REAL NOT NULL DEFAULT 0,
      sgst_amount REAL NOT NULL DEFAULT 0,
      igst_amount REAL NOT NULL DEFAULT 0,
      discount_amount REAL NOT NULL DEFAULT 0,
      total_amount REAL NOT NULL DEFAULT 0,
      paid_amount REAL NOT NULL DEFAULT 0,
      outstanding_amount REAL NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'DRAFT' CHECK(status IN ('DRAFT', 'CONFIRMED', 'SENT', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED')),
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      -- Idempotency constraint: avoid duplicate billing for same subscription and period start
      UNIQUE(subscription_id, billing_period_start)
    );

    -- 20. Invoice Lines
    CREATE TABLE IF NOT EXISTS invoice_lines (
      id TEXT PRIMARY KEY,
      invoice_id TEXT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
      product_id TEXT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
      variant_id TEXT REFERENCES product_variants(id) ON DELETE SET NULL,
      description TEXT NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      unit_price REAL NOT NULL DEFAULT 0,
      tax_rate REAL NOT NULL DEFAULT 0,
      tax_amount REAL NOT NULL DEFAULT 0,
      discount_amount REAL NOT NULL DEFAULT 0,
      total_amount REAL NOT NULL DEFAULT 0
    );

    -- 21. Payments
    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      payment_reference TEXT UNIQUE NOT NULL,
      customer_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      invoice_id TEXT NOT NULL REFERENCES invoices(id) ON DELETE RESTRICT,
      amount REAL NOT NULL,
      payment_method TEXT NOT NULL CHECK(payment_method IN ('BANK_TRANSFER', 'CASH', 'UPI', 'CARD', 'ONLINE_GATEWAY', 'OTHER')),
      payment_date TEXT NOT NULL,
      transaction_reference TEXT,
      status TEXT NOT NULL DEFAULT 'SUCCESS' CHECK(status IN ('SUCCESS', 'PENDING', 'FAILED')),
      notes TEXT,
      created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- 22. Payment Allocations (Audit of how payment applies to invoice)
    CREATE TABLE IF NOT EXISTS payment_allocations (
      id TEXT PRIMARY KEY,
      payment_id TEXT NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
      invoice_id TEXT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
      amount_allocated REAL NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- 23. Billing Execution Logs
    CREATE TABLE IF NOT EXISTS billing_execution_logs (
      id TEXT PRIMARY KEY,
      execution_date TEXT NOT NULL DEFAULT (datetime('now')),
      triggered_by TEXT NOT NULL DEFAULT 'SYSTEM_CRON',
      subscriptions_processed INTEGER NOT NULL DEFAULT 0,
      invoices_generated INTEGER NOT NULL DEFAULT 0,
      total_invoiced_amount REAL NOT NULL DEFAULT 0,
      failures_count INTEGER NOT NULL DEFAULT 0,
      details TEXT,
      status TEXT NOT NULL CHECK(status IN ('SUCCESS', 'PARTIAL', 'FAILED'))
    );

    -- 24. Notifications (In-App)
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('QUOTATION', 'INVOICE', 'PAYMENT', 'SUBSCRIPTION', 'RENEWAL', 'OVERDUE', 'SYSTEM')),
      link TEXT,
      is_read INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- 25. Email Logs (Real simulation and delivery tracking)
    CREATE TABLE IF NOT EXISTS email_logs (
      id TEXT PRIMARY KEY,
      recipient_email TEXT NOT NULL,
      recipient_name TEXT,
      subject TEXT NOT NULL,
      template_name TEXT NOT NULL,
      body_preview TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'SENT' CHECK(status IN ('SENT', 'FAILED', 'DEV_LOGGED')),
      error_message TEXT,
      sent_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- 26. Audit Logs
    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      user_email TEXT,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT,
      old_values TEXT,
      new_values TEXT,
      ip_address TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Create Indexes for performance
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
    CREATE INDEX IF NOT EXISTS idx_subscriptions_customer ON subscriptions(customer_id);
    CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
    CREATE INDEX IF NOT EXISTS idx_subscriptions_next_billing ON subscriptions(next_billing_date);
    CREATE INDEX IF NOT EXISTS idx_invoices_customer ON invoices(customer_id);
    CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
    CREATE INDEX IF NOT EXISTS idx_invoices_subscription ON invoices(subscription_id);
    CREATE INDEX IF NOT EXISTS idx_payments_invoice ON payments(invoice_id);
    CREATE INDEX IF NOT EXISTS idx_payments_customer ON payments(customer_id);
    CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);
  `);

  seedInitialData();
}

export function seedInitialData() {
  const existingSettings = db.prepare('SELECT id FROM application_settings WHERE id = ?').get('default');
  if (!existingSettings) {
    db.prepare(`
      INSERT INTO application_settings (id, company_name, company_email, company_phone, company_address, gstin, currency, currency_symbol, timezone, invoice_prefix, quotation_prefix, subscription_prefix, payment_terms_days, tax_mode)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'default',
      'Brightloop Software Solutions Pvt Ltd',
      'billing@brightloop.io',
      '+91 80 4123 4567',
      'Tower B, Tech Park, Indiranagar, Bengaluru, Karnataka, 560038',
      '29AABCB1234F1Z5',
      'INR',
      '₹',
      'Asia/Kolkata',
      'INV-',
      'QTN-',
      'SUB-',
      15,
      'GST_INDIA'
    );
  }

  // Check if users already exist
  const existingAdmin = db.prepare('SELECT id FROM users WHERE email = ?').get('admin@brightloop.io');
  if (!existingAdmin) {
    const saltRounds = 10;
    // Password meets policy: > 8 chars, uppercase, lowercase, special character: Brightloop@2026!
    const defaultPasswordHash = bcrypt.hashSync('Brightloop@2026!', saltRounds);

    const insertUser = db.prepare(`
      INSERT INTO users (id, email, password_hash, full_name, role, status, phone)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    // 1. Admin
    const adminId = 'usr_admin_001';
    insertUser.run(adminId, 'admin@brightloop.io', defaultPasswordHash, 'Vikram Malhotra', 'ADMIN', 'ACTIVE', '+91 98801 12233');

    // 2. Staff
    const staffId1 = 'usr_staff_001';
    insertUser.run(staffId1, 'staff@brightloop.io', defaultPasswordHash, 'Ananya Sharma', 'STAFF', 'ACTIVE', '+91 98802 23344');
    db.prepare(`
      INSERT INTO staff_profiles (user_id, department, designation, assigned_territory)
      VALUES (?, ?, ?, ?)
    `).run(staffId1, 'Enterprise Accounts', 'Senior Account Executive', 'South India');

    // 3. Customer 1 (Acme Tech)
    const custId1 = 'usr_cust_001';
    insertUser.run(custId1, 'customer@acme.com', defaultPasswordHash, 'Rajesh Varma', 'CUSTOMER', 'ACTIVE', '+91 98803 34455');
    db.prepare(`
      INSERT INTO customer_profiles (user_id, company_name, tax_id_gstin, billing_address, city, state, postal_code, country, assigned_staff_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(custId1, 'Acme Technologies Pvt Ltd', '29AAACA1111A1Z1', '402 Prestige Cyber Towers', 'Bengaluru', 'Karnataka', '560001', 'India', staffId1);

    // 4. Customer 2 (Zenith Digital)
    const custId2 = 'usr_cust_002';
    insertUser.run(custId2, 'finance@zenithdigital.com', defaultPasswordHash, 'Pooja Hegde', 'CUSTOMER', 'ACTIVE', '+91 98804 45566');
    db.prepare(`
      INSERT INTO customer_profiles (user_id, company_name, tax_id_gstin, billing_address, city, state, postal_code, country, assigned_staff_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(custId2, 'Zenith Digital Innovations LLP', '27AABCZ9999K1Z4', '120 Nariman Point Commercial Hub', 'Mumbai', 'Maharashtra', '400021', 'India', staffId1);

    // Taxes (GST 18% with 9% CGST + 9% SGST intra-state, or 18% IGST inter-state)
    const insertTax = db.prepare(`
      INSERT INTO taxes (id, name, percentage, tax_type, cgst_rate, sgst_rate, igst_rate, effective_start_date, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertTax.run('tax_gst_18', 'GST 18% (Standard Software)', 18.0, 'GST', 9.0, 9.0, 18.0, '2025-01-01', 'ACTIVE');
    insertTax.run('tax_gst_12', 'GST 12% (IT Support & Services)', 12.0, 'GST', 6.0, 6.0, 12.0, '2025-01-01', 'ACTIVE');
    insertTax.run('tax_gst_0', 'Zero Rated / SEZ Export', 0.0, 'GST', 0.0, 0.0, 0.0, '2025-01-01', 'ACTIVE');

    // Discounts
    const insertDiscount = db.prepare(`
      INSERT INTO discounts (id, code, name, description, discount_type, value, minimum_purchase_amount, minimum_quantity, max_usage_count, current_usage_count, per_customer_limit, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertDiscount.run('dsc_early_bird', 'EARLY20', 'Early Bird 20% Off', '20% promotional discount on annual subscriptions', 'PERCENTAGE', 20.0, 5000, 1, 100, 1, 1, 'ACTIVE');
    insertDiscount.run('dsc_flat_1000', 'SAVE1000', 'Flat ₹1,000 Off Launch', 'Flat discount of ₹1,000 for new client signups', 'FIXED_AMOUNT', 1000.0, 3000, 1, 50, 0, 1, 'ACTIVE');

    // Products & Variants (Following user prompt specification: Business Software + Odoo + Enterprise variants)
    const insertProduct = db.prepare(`
      INSERT INTO products (id, product_code, name, type, description, internal_notes, sales_price, cost_price, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const insertVariant = db.prepare(`
      INSERT INTO product_variants (id, product_id, name, variant_code, additional_price, description, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    // Product 1: Business Software
    const prod1Id = 'prod_biz_soft';
    insertProduct.run(prod1Id, 'PRD-BSW', 'Business Software', 'SOFTWARE', 'Comprehensive core business operations and ERP suite.', 'Primary SaaS subscription product', 2499.0, 500.0, 'ACTIVE');
    insertVariant.run('var_bsw_std', prod1Id, 'Standard', 'VAR-STD', 0.0, 'Base standard package with single user license', 'ACTIVE');
    insertVariant.run('var_bsw_odoo', prod1Id, 'Odoo Connector', 'VAR-ODOO', 560.0, 'Odoo ERP sync bridge and automated inventory link', 'ACTIVE');
    insertVariant.run('var_bsw_ent', prod1Id, 'Enterprise Multi-Branch', 'VAR-ENT', 1800.0, 'Multi-company accounting and dedicated priority SLA', 'ACTIVE');

    // Product 2: Cloud Storage Add-on
    const prod2Id = 'prod_addon_storage';
    insertProduct.run(prod2Id, 'PRD-STO', '100GB Dedicated Cloud Storage', 'ADD_ON', 'Encrypted continuous backup and high-speed data archive', 'Add-on storage unit', 499.0, 100.0, 'ACTIVE');

    // Product 3: Priority Implementation Service
    const prod3Id = 'prod_srv_impl';
    insertProduct.run(prod3Id, 'PRD-IMP', 'Dedicated Onboarding & Implementation', 'SERVICE', 'One-on-one data migration, custom workflows, and team training', 'Professional Services', 7999.0, 2000.0, 'ACTIVE');

    // Plans (Monthly, Yearly, etc.)
    const insertPlan = db.prepare(`
      INSERT INTO plans (id, name, description, billing_frequency, base_price, minimum_quantity, allow_pause, allow_early_closure, allow_renewal, auto_close_on_expiry, availability_start_date, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const insertPlanProduct = db.prepare(`
      INSERT INTO plan_products (id, plan_id, product_id, variant_id, is_primary, default_quantity)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const planMonthlyId = 'plan_monthly_pro';
    insertPlan.run(planMonthlyId, 'Business Software - Monthly Pro', 'Monthly recurring plan with flexible cancellation and standard support', 'MONTHLY', 2499.0, 1, 1, 1, 1, 1, '2025-01-01', 'ACTIVE');
    insertPlanProduct.run('pp_m_1', planMonthlyId, prod1Id, 'var_bsw_std', 1, 1);

    const planYearlyId = 'plan_yearly_ent';
    insertPlan.run(planYearlyId, 'Business Software - Annual Enterprise', 'Annual recurring plan with 2 months free equivalent pricing, Odoo connector included, and priority SLA', 'YEARLY', 24990.0, 1, 1, 1, 1, 1, '2025-01-01', 'ACTIVE');
    insertPlanProduct.run('pp_y_1', planYearlyId, prod1Id, 'var_bsw_odoo', 1, 1);
    insertPlanProduct.run('pp_y_2', planYearlyId, prod2Id, null, 0, 1);

    // Quotation Template
    const templateId = 'qtmpl_standard_biz';
    db.prepare(`
      INSERT INTO quotation_templates (id, name, description, plan_id, default_payment_terms_days, validity_days, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(templateId, 'Standard Growth Business Proposal', 'Pre-configured proposal bundle with Business Software Odoo Edition + 100GB Storage', planMonthlyId, 15, 30, adminId);
    
    db.prepare(`
      INSERT INTO quotation_template_lines (id, template_id, product_id, variant_id, quantity, unit_price)
      VALUES (?, ?, ?, ?, ?, ?), (?, ?, ?, ?, ?, ?)
    `).run(
      'qtl_1', templateId, prod1Id, 'var_bsw_odoo', 1, 3059.0,
      'qtl_2', templateId, prod2Id, null, 1, 499.0
    );

    // Seed Active Subscriptions & Invoices for realistic initial dashboard data
    const sub1Id = 'sub_001_acme';
    db.prepare(`
      INSERT INTO subscriptions (id, subscription_number, customer_id, plan_id, start_date, expiry_date, next_billing_date, billing_frequency, subtotal, tax_amount, discount_amount, total_amount, status, auto_renew, payment_terms_days, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      sub1Id, 'SUB-2026-0001', custId1, planMonthlyId, '2026-09-01', '2027-09-01', '2026-11-01', 'MONTHLY',
      3059.0, 550.62, 0.0, 3609.62, 'ACTIVE', 1, 15, staffId1
    );

    db.prepare(`
      INSERT INTO subscription_lines (id, subscription_id, product_id, variant_id, product_name, quantity, unit_price, tax_rate, tax_amount, total_amount)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'sl_1', sub1Id, prod1Id, 'var_bsw_odoo', 'Business Software (Odoo Connector)', 1, 3059.0, 18.0, 550.62, 3609.62
    );

    db.prepare(`
      INSERT INTO subscription_history (id, subscription_id, from_status, to_status, action, actor_id, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run('sh_1', sub1Id, 'CONFIRMED', 'ACTIVE', 'ACTIVATED', staffId1, 'Subscription initiated after initial payment confirmation');

    // Invoices for Customer 1
    const inv1Id = 'inv_001_acme';
    db.prepare(`
      INSERT INTO invoices (id, invoice_number, customer_id, subscription_id, invoice_date, due_date, billing_period_start, billing_period_end, subtotal, tax_amount, cgst_amount, sgst_amount, igst_amount, discount_amount, total_amount, paid_amount, outstanding_amount, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      inv1Id, 'INV-2026-0001', custId1, sub1Id, '2026-10-01', '2026-10-16', '2026-10-01', '2026-10-31',
      3059.0, 550.62, 275.31, 275.31, 0.0, 0.0, 3609.62, 3609.62, 0.0, 'PAID'
    );

    db.prepare(`
      INSERT INTO invoice_lines (id, invoice_id, product_id, variant_id, description, quantity, unit_price, tax_rate, tax_amount, discount_amount, total_amount)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'inl_1', inv1Id, prod1Id, 'var_bsw_odoo', 'Business Software (Odoo Connector) - Oct 2026', 1, 3059.0, 18.0, 550.62, 0.0, 3609.62
    );

    // Payment for Invoice 1
    const pay1Id = 'pay_001_acme';
    db.prepare(`
      INSERT INTO payments (id, payment_reference, customer_id, invoice_id, amount, payment_method, payment_date, transaction_reference, status, notes, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      pay1Id, 'PAY-2026-0001', custId1, inv1Id, 3609.62, 'BANK_TRANSFER', '2026-10-03', 'HDFC-NEFT-99882211', 'SUCCESS', 'Full invoice settlement received via NEFT', staffId1
    );

    db.prepare(`
      INSERT INTO payment_allocations (id, payment_id, invoice_id, amount_allocated)
      VALUES (?, ?, ?, ?)
    `).run('pa_1', pay1Id, inv1Id, 3609.62);

    // Customer 2 Subscription & Overdue Invoice
    const sub2Id = 'sub_002_zenith';
    db.prepare(`
      INSERT INTO subscriptions (id, subscription_number, customer_id, plan_id, start_date, expiry_date, next_billing_date, billing_frequency, subtotal, tax_amount, discount_amount, total_amount, status, auto_renew, payment_terms_days, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      sub2Id, 'SUB-2026-0002', custId2, planMonthlyId, '2026-08-15', '2027-08-15', '2026-11-15', 'MONTHLY',
      2499.0, 449.82, 0.0, 2948.82, 'ACTIVE', 1, 15, staffId1
    );

    db.prepare(`
      INSERT INTO subscription_lines (id, subscription_id, product_id, variant_id, product_name, quantity, unit_price, tax_rate, tax_amount, total_amount)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'sl_2', sub2Id, prod1Id, 'var_bsw_std', 'Business Software (Standard)', 1, 2499.0, 18.0, 449.82, 2948.82
    );

    const inv2Id = 'inv_002_zenith';
    db.prepare(`
      INSERT INTO invoices (id, invoice_number, customer_id, subscription_id, invoice_date, due_date, billing_period_start, billing_period_end, subtotal, tax_amount, cgst_amount, sgst_amount, igst_amount, discount_amount, total_amount, paid_amount, outstanding_amount, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      inv2Id, 'INV-2026-0002', custId2, sub2Id, '2026-10-15', '2026-10-30', '2026-10-15', '2026-11-14',
      2499.0, 449.82, 0.0, 0.0, 449.82, 0.0, 2948.82, 1000.0, 1948.82, 'PARTIALLY_PAID'
    );

    db.prepare(`
      INSERT INTO invoice_lines (id, invoice_id, product_id, variant_id, description, quantity, unit_price, tax_rate, tax_amount, discount_amount, total_amount)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'inl_2', inv2Id, prod1Id, 'var_bsw_std', 'Business Software (Standard) - Oct 2026', 1, 2499.0, 18.0, 449.82, 0.0, 2948.82
    );

    const pay2Id = 'pay_002_zenith';
    db.prepare(`
      INSERT INTO payments (id, payment_reference, customer_id, invoice_id, amount, payment_method, payment_date, transaction_reference, status, notes, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      pay2Id, 'PAY-2026-0002', custId2, inv2Id, 1000.0, 'UPI', '2026-10-20', 'UPI-REF-8877665544', 'SUCCESS', 'Partial advance payment via UPI', custId2
    );
    db.prepare(`
      INSERT INTO payment_allocations (id, payment_id, invoice_id, amount_allocated)
      VALUES (?, ?, ?, ?)
    `).run('pa_2', pay2Id, inv2Id, 1000.0);

    // Seed Sample Quotation
    const qtnId = 'qtn_001_lead';
    db.prepare(`
      INSERT INTO quotations (id, quotation_number, customer_id, plan_id, created_by, quotation_date, expiry_date, subtotal, tax_amount, discount_amount, grand_total, status, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      qtnId, 'QTN-2026-0001', custId1, planYearlyId, staffId1, '2026-10-25', '2026-11-25',
      24990.0, 4498.2, 0.0, 29488.2, 'SENT', 'Special proposal for Enterprise Annual renewal'
    );
    db.prepare(`
      INSERT INTO quotation_lines (id, quotation_id, product_id, variant_id, product_name, quantity, unit_price, tax_rate, tax_amount, total_amount)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'ql_1', qtnId, prod1Id, 'var_bsw_odoo', 'Business Software - Annual Enterprise', 1, 24990.0, 18.0, 4498.2, 29488.2
    );

    // Initial Notifications
    db.prepare(`
      INSERT INTO notifications (id, user_id, title, message, type, link)
      VALUES (?, ?, ?, ?, ?, ?), (?, ?, ?, ?, ?, ?)
    `).run(
      'notif_1', custId1, 'Invoice #INV-2026-0001 Paid', 'Thank you! Payment of ₹3,609.62 has been received and credited to your account.', 'PAYMENT', '/invoices',
      'notif_2', adminId, 'Billing Engine Scheduled', 'Daily recurring billing engine active and monitoring 2 subscriptions.', 'SYSTEM', '/subscriptions'
    );

    // Initial Email Log
    db.prepare(`
      INSERT INTO email_logs (id, recipient_email, recipient_name, subject, template_name, body_preview, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      'eml_1', 'customer@acme.com', 'Rajesh Varma', 'Welcome to Brightloop Software', 'WELCOME_EMAIL',
      'Your account at Acme Technologies has been created. Start exploring your subscriptions.', 'SENT'
    );
  }
}
