import { db } from './db';

export interface BillingExecutionResult {
  logId: string;
  executionDate: string;
  triggeredBy: string;
  subscriptionsProcessed: number;
  invoicesGenerated: number;
  totalInvoicedAmount: number;
  failuresCount: number;
  details: string[];
  status: 'SUCCESS' | 'PARTIAL' | 'FAILED';
}

function addTimeByFrequency(dateStr: string, frequency: string): string {
  const d = new Date(dateStr);
  switch (frequency) {
    case 'DAILY':
      d.setDate(d.getDate() + 1);
      break;
    case 'WEEKLY':
      d.setDate(d.getDate() + 7);
      break;
    case 'YEARLY':
      d.setFullYear(d.getFullYear() + 1);
      break;
    case 'MONTHLY':
    default:
      d.setMonth(d.getMonth() + 1);
      break;
  }
  return d.toISOString().split('T')[0];
}

function calculatePeriodEnd(startStr: string, frequency: string): string {
  const d = new Date(startStr);
  switch (frequency) {
    case 'DAILY':
      return startStr;
    case 'WEEKLY':
      d.setDate(d.getDate() + 6);
      return d.toISOString().split('T')[0];
    case 'YEARLY':
      d.setFullYear(d.getFullYear() + 1);
      d.setDate(d.getDate() - 1);
      return d.toISOString().split('T')[0];
    case 'MONTHLY':
    default:
      d.setMonth(d.getMonth() + 1);
      d.setDate(d.getDate() - 1);
      return d.toISOString().split('T')[0];
  }
}

export function runRecurringBillingEngine(triggeredBy: string = 'SYSTEM_CRON'): BillingExecutionResult {
  const today = new Date().toISOString().split('T')[0];
  const details: string[] = [];
  let processedCount = 0;
  let generatedCount = 0;
  let totalAmount = 0;
  let failuresCount = 0;

  const settings = db.prepare('SELECT * FROM application_settings WHERE id = ?').get('default') as any;
  const invPrefix = settings?.invoice_prefix || 'INV-';
  const paymentTermsDays = settings?.payment_terms_days || 15;

  // Retrieve eligible active subscriptions that are due on or before today
  // and have not reached expiry (if configured)
  const eligibleSubs = db.prepare(`
    SELECT s.*, u.email as customer_email, u.full_name as customer_name,
           cp.state as customer_state, cp.tax_id_gstin
    FROM subscriptions s
    JOIN users u ON s.customer_id = u.id
    LEFT JOIN customer_profiles cp ON s.customer_id = cp.user_id
    WHERE s.status = 'ACTIVE'
      AND s.next_billing_date <= ?
      AND (s.expiry_date IS NULL OR s.expiry_date >= ?)
    ORDER BY s.next_billing_date ASC
  `).all(today, today) as any[];

  details.push(`Found ${eligibleSubs.length} eligible active subscriptions due for billing on or before ${today}.`);

  for (const sub of eligibleSubs) {
    processedCount++;
    try {
      const billingPeriodStart = sub.next_billing_date;
      const billingPeriodEnd = calculatePeriodEnd(billingPeriodStart, sub.billing_frequency);

      // Idempotency check: see if invoice already exists for this subscription and period start
      const existingInv = db.prepare(`
        SELECT id, invoice_number FROM invoices
        WHERE subscription_id = ? AND billing_period_start = ?
      `).get(sub.id, billingPeriodStart) as any;

      if (existingInv) {
        details.push(`Subscription ${sub.subscription_number} already has invoice ${existingInv.invoice_number} for period starting ${billingPeriodStart}. Skipping.`);
        // Ensure next billing date moves forward if stuck
        const nextDate = addTimeByFrequency(billingPeriodStart, sub.billing_frequency);
        db.prepare('UPDATE subscriptions SET next_billing_date = ?, updated_at = datetime("now") WHERE id = ?')
          .run(nextDate, sub.id);
        continue;
      }

      // Fetch subscription lines
      const lines = db.prepare(`
        SELECT * FROM subscription_lines WHERE subscription_id = ?
      `).all(sub.id) as any[];

      if (lines.length === 0) {
        details.push(`Subscription ${sub.subscription_number} has no active product lines. Skipping.`);
        continue;
      }

      // Calculate invoice totals inside an atomic transaction
      const executeInvoiceCreation = db.transaction(() => {
        let subtotal = 0;
        let taxAmount = 0;
        let cgstAmount = 0;
        let sgstAmount = 0;
        let igstAmount = 0;
        const discountAmount = sub.discount_amount || 0;

        // Is intra-state or inter-state GST?
        // Default company state: Karnataka
        const isIntraState = !sub.customer_state || sub.customer_state.toLowerCase().includes('karnataka');

        for (const line of lines) {
          const lineSubtotal = line.quantity * line.unit_price;
          subtotal += lineSubtotal;
          const lineTax = (lineSubtotal * (line.tax_rate || 18.0)) / 100.0;
          taxAmount += lineTax;

          if (isIntraState) {
            cgstAmount += lineTax / 2.0;
            sgstAmount += lineTax / 2.0;
          } else {
            igstAmount += lineTax;
          }
        }

        const invoiceTotal = Math.max(0, subtotal - discountAmount + taxAmount);

        // Calculate due date
        const dueDateObj = new Date(today);
        dueDateObj.setDate(dueDateObj.getDate() + paymentTermsDays);
        const dueDate = dueDateObj.toISOString().split('T')[0];

        // Generate unique invoice number
        const randomCode = Math.floor(1000 + Math.random() * 9000);
        const year = new Date().getFullYear();
        const invoiceNumber = `${invPrefix}${year}-${randomCode}-${Math.floor(Math.random() * 899 + 100)}`;
        const invoiceId = `inv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

        // Insert invoice
        db.prepare(`
          INSERT INTO invoices (
            id, invoice_number, customer_id, subscription_id, invoice_date, due_date,
            billing_period_start, billing_period_end, subtotal, tax_amount,
            cgst_amount, sgst_amount, igst_amount, discount_amount, total_amount,
            paid_amount, outstanding_amount, status, notes
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          invoiceId, invoiceNumber, sub.customer_id, sub.id, today, dueDate,
          billingPeriodStart, billingPeriodEnd, subtotal, taxAmount,
          cgstAmount, sgstAmount, igstAmount, discountAmount, invoiceTotal,
          0.0, invoiceTotal, 'CONFIRMED', `Auto-generated recurring invoice for ${sub.billing_frequency} subscription`
        );

        // Insert invoice lines
        const insertLine = db.prepare(`
          INSERT INTO invoice_lines (
            id, invoice_id, product_id, variant_id, description, quantity,
            unit_price, tax_rate, tax_amount, discount_amount, total_amount
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        for (const line of lines) {
          const lineSub = line.quantity * line.unit_price;
          const lineTax = (lineSub * (line.tax_rate || 18.0)) / 100.0;
          const lineTotal = lineSub + lineTax;
          const lineId = `inl_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
          insertLine.run(
            lineId, invoiceId, line.product_id, line.variant_id,
            `${line.product_name} (${billingPeriodStart} to ${billingPeriodEnd})`,
            line.quantity, line.unit_price, line.tax_rate, lineTax, 0, lineTotal
          );
        }

        // Advance next billing date on subscription
        const nextBillingDate = addTimeByFrequency(billingPeriodStart, sub.billing_frequency);
        db.prepare(`
          UPDATE subscriptions
          SET next_billing_date = ?, updated_at = datetime('now')
          WHERE id = ?
        `).run(nextBillingDate, sub.id);

        // Record history
        db.prepare(`
          INSERT INTO subscription_history (id, subscription_id, from_status, to_status, action, actor_id, notes)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(
          `sh_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          sub.id, 'ACTIVE', 'ACTIVE', 'RECURRING_INVOICE_GENERATED', null,
          `Generated recurring invoice ${invoiceNumber} for ₹${invoiceTotal.toFixed(2)}. Next billing set to ${nextBillingDate}.`
        );

        // Create in-app notification for customer
        db.prepare(`
          INSERT INTO notifications (id, user_id, title, message, type, link)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(
          `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          sub.customer_id,
          `New Invoice #${invoiceNumber}`,
          `Your subscription invoice for ₹${invoiceTotal.toFixed(2)} has been generated and is due on ${dueDate}.`,
          'INVOICE',
          `/invoices/${invoiceId}`
        );

        // Create email dispatch log
        db.prepare(`
          INSERT INTO email_logs (id, recipient_email, recipient_name, subject, template_name, body_preview, status)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(
          `eml_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          sub.customer_email,
          sub.customer_name,
          `Invoice ${invoiceNumber} from Brightloop Software`,
          'INVOICE_GENERATED',
          `Dear ${sub.customer_name}, your recurring subscription invoice ${invoiceNumber} for ₹${invoiceTotal.toFixed(2)} is now available.`,
          'SENT'
        );

        return { invoiceId, invoiceNumber, invoiceTotal };
      });

      const invResult = executeInvoiceCreation();
      generatedCount++;
      totalAmount += invResult.invoiceTotal;
      details.push(`Generated invoice ${invResult.invoiceNumber} (₹${invResult.invoiceTotal.toFixed(2)}) for subscription ${sub.subscription_number}.`);
    } catch (err: any) {
      failuresCount++;
      details.push(`Error processing subscription ${sub.subscription_number}: ${err.message}`);
    }
  }

  const overallStatus = failuresCount === 0 ? 'SUCCESS' : (generatedCount > 0 ? 'PARTIAL' : 'FAILED');
  const logId = `blog_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

  db.prepare(`
    INSERT INTO billing_execution_logs (
      id, execution_date, triggered_by, subscriptions_processed,
      invoices_generated, total_invoiced_amount, failures_count, details, status
    ) VALUES (?, datetime('now'), ?, ?, ?, ?, ?, ?, ?)
  `).run(
    logId, triggeredBy, processedCount, generatedCount, totalAmount,
    failuresCount, JSON.stringify(details), overallStatus
  );

  return {
    logId,
    executionDate: new Date().toISOString(),
    triggeredBy,
    subscriptionsProcessed: processedCount,
    invoicesGenerated: generatedCount,
    totalInvoicedAmount: totalAmount,
    failuresCount,
    details,
    status: overallStatus
  };
}
