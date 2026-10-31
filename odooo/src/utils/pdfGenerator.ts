import { jsPDF } from 'jspdf';

export function generateInvoicePDF(invoice: any, settings?: any) {
  const doc = new jsPDF();
  const companyName = settings?.company_name || 'Brightloop Software Solutions Pvt Ltd';
  const companyAddress = settings?.company_address || 'Tower B, Tech Park, Indiranagar, Bengaluru, 560038';
  const gstin = settings?.gstin || '29AABCB1234F1Z5';
  const currencySymbol = settings?.currency_symbol || 'INR ';

  // Header Bar
  doc.setFillColor(30, 41, 59); // Slate-800
  doc.rect(0, 0, 210, 24, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(companyName, 14, 15);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`TAX INVOICE`, 170, 15);

  // Company Details
  doc.setTextColor(51, 65, 85);
  doc.setFontSize(9);
  doc.text(`GSTIN: ${gstin}`, 14, 32);
  doc.text(companyAddress, 14, 38, { maxWidth: 100 });

  // Invoice Meta Box
  doc.setFillColor(248, 250, 252);
  doc.rect(130, 28, 66, 32, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.rect(130, 28, 66, 32, 'S');

  doc.setFont('helvetica', 'bold');
  doc.text(`Invoice No:`, 134, 35);
  doc.setFont('helvetica', 'normal');
  doc.text(invoice.invoice_number, 160, 35);

  doc.setFont('helvetica', 'bold');
  doc.text(`Date:`, 134, 41);
  doc.setFont('helvetica', 'normal');
  doc.text(invoice.invoice_date, 160, 41);

  doc.setFont('helvetica', 'bold');
  doc.text(`Due Date:`, 134, 47);
  doc.setFont('helvetica', 'normal');
  doc.text(invoice.due_date, 160, 47);

  doc.setFont('helvetica', 'bold');
  doc.text(`Status:`, 134, 53);
  doc.text(invoice.status, 160, 53);

  // Billed To
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('BILLED TO:', 14, 60);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(invoice.customer_name || 'Valued Customer', 14, 66);
  if (invoice.company_name) doc.text(invoice.company_name, 14, 71);
  if (invoice.tax_id_gstin) doc.text(`GSTIN: ${invoice.tax_id_gstin}`, 14, 76);
  if (invoice.billing_address) doc.text(`${invoice.billing_address}, ${invoice.city || ''} ${invoice.state || ''}`, 14, 81, { maxWidth: 110 });

  // Period
  doc.text(`Billing Period: ${invoice.billing_period_start} to ${invoice.billing_period_end}`, 130, 66);

  // Table Header
  let y = 92;
  doc.setFillColor(241, 245, 249);
  doc.rect(14, y, 182, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Description', 18, y + 5.5);
  doc.text('Qty', 115, y + 5.5);
  doc.text('Rate', 132, y + 5.5);
  doc.text('Tax', 155, y + 5.5);
  doc.text('Total', 178, y + 5.5);

  y += 12;
  doc.setFont('helvetica', 'normal');
  if (invoice.lines && invoice.lines.length > 0) {
    for (const line of invoice.lines) {
      doc.text(line.description || 'Service line', 18, y, { maxWidth: 90 });
      doc.text(String(line.quantity), 118, y);
      doc.text(`${currencySymbol}${Number(line.unit_price).toFixed(2)}`, 130, y);
      doc.text(`${currencySymbol}${Number(line.tax_amount || 0).toFixed(2)}`, 153, y);
      doc.text(`${currencySymbol}${Number(line.total_amount).toFixed(2)}`, 175, y);
      y += 8;
    }
  }

  // Summary box
  y = Math.max(y + 10, 150);
  doc.line(14, y, 196, y);
  y += 6;

  const rightLabelX = 130;
  const rightValX = 175;

  doc.text('Subtotal:', rightLabelX, y);
  doc.text(`${currencySymbol}${Number(invoice.subtotal).toFixed(2)}`, rightValX, y);
  y += 6;

  if (invoice.discount_amount > 0) {
    doc.text('Discount Applied:', rightLabelX, y);
    doc.text(`-${currencySymbol}${Number(invoice.discount_amount).toFixed(2)}`, rightValX, y);
    y += 6;
  }

  if (invoice.cgst_amount > 0 || invoice.sgst_amount > 0) {
    doc.text('CGST (9%):', rightLabelX, y);
    doc.text(`${currencySymbol}${Number(invoice.cgst_amount).toFixed(2)}`, rightValX, y);
    y += 5;
    doc.text('SGST (9%):', rightLabelX, y);
    doc.text(`${currencySymbol}${Number(invoice.sgst_amount).toFixed(2)}`, rightValX, y);
    y += 6;
  } else if (invoice.igst_amount > 0) {
    doc.text('IGST (18%):', rightLabelX, y);
    doc.text(`${currencySymbol}${Number(invoice.igst_amount).toFixed(2)}`, rightValX, y);
    y += 6;
  } else if (invoice.tax_amount > 0) {
    doc.text('Tax Amount:', rightLabelX, y);
    doc.text(`${currencySymbol}${Number(invoice.tax_amount).toFixed(2)}`, rightValX, y);
    y += 6;
  }

  doc.setFont('helvetica', 'bold');
  doc.text('Grand Total:', rightLabelX, y);
  doc.text(`${currencySymbol}${Number(invoice.total_amount).toFixed(2)}`, rightValX, y);
  y += 7;

  doc.setFont('helvetica', 'normal');
  doc.text('Paid Amount:', rightLabelX, y);
  doc.text(`${currencySymbol}${Number(invoice.paid_amount || 0).toFixed(2)}`, rightValX, y);
  y += 6;

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(invoice.outstanding_amount > 0 ? 185 : 22, invoice.outstanding_amount > 0 ? 28 : 101, invoice.outstanding_amount > 0 ? 28 : 52);
  doc.text('Balance Due:', rightLabelX, y);
  doc.text(`${currencySymbol}${Number(invoice.outstanding_amount || 0).toFixed(2)}`, rightValX, y);

  // Footer notes
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Thank you for choosing Brightloop Software! For billing inquiries, contact billing@brightloop.io', 14, 275);

  doc.save(`${invoice.invoice_number}.pdf`);
}

export function generateQuotationPDF(qtn: any, settings?: any) {
  const doc = new jsPDF();
  const companyName = settings?.company_name || 'Brightloop Software Solutions Pvt Ltd';
  const gstin = settings?.gstin || '29AABCB1234F1Z5';
  const currencySymbol = settings?.currency_symbol || 'INR ';

  // Header Bar
  doc.setFillColor(30, 41, 59);
  doc.rect(0, 0, 210, 24, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(companyName, 14, 15);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`COMMERCIAL PROPOSAL`, 150, 15);

  // Meta
  doc.setTextColor(51, 65, 85);
  doc.setFontSize(9);
  doc.text(`GSTIN: ${gstin}`, 14, 32);

  doc.setFillColor(248, 250, 252);
  doc.rect(130, 28, 66, 26, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.rect(130, 28, 66, 26, 'S');

  doc.setFont('helvetica', 'bold');
  doc.text(`Quotation No:`, 134, 35);
  doc.setFont('helvetica', 'normal');
  doc.text(qtn.quotation_number, 160, 35);

  doc.setFont('helvetica', 'bold');
  doc.text(`Valid Until:`, 134, 43);
  doc.setFont('helvetica', 'normal');
  doc.text(qtn.expiry_date, 160, 43);

  // Client
  doc.setFont('helvetica', 'bold');
  doc.text('PROPOSED CLIENT:', 14, 52);
  doc.setFont('helvetica', 'normal');
  doc.text(qtn.customer_name || 'Prospective Customer', 14, 58);
  if (qtn.company_name) doc.text(qtn.company_name, 14, 64);

  // Table
  let y = 78;
  doc.setFillColor(241, 245, 249);
  doc.rect(14, y, 182, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.text('Product / Service Plan', 18, y + 5.5);
  doc.text('Qty', 120, y + 5.5);
  doc.text('Unit Price', 140, y + 5.5);
  doc.text('Total', 178, y + 5.5);

  y += 12;
  doc.setFont('helvetica', 'normal');
  if (qtn.lines && qtn.lines.length > 0) {
    for (const line of qtn.lines) {
      doc.text(line.product_name, 18, y);
      doc.text(String(line.quantity), 122, y);
      doc.text(`${currencySymbol}${Number(line.unit_price).toFixed(2)}`, 140, y);
      doc.text(`${currencySymbol}${Number(line.total_amount).toFixed(2)}`, 175, y);
      y += 8;
    }
  }

  y += 10;
  doc.line(14, y, 196, y);
  y += 8;

  doc.text('Subtotal:', 140, y);
  doc.text(`${currencySymbol}${Number(qtn.subtotal).toFixed(2)}`, 175, y);
  y += 6;

  doc.text('Estimated Tax (GST 18%):', 120, y);
  doc.text(`${currencySymbol}${Number(qtn.tax_amount).toFixed(2)}`, 175, y);
  y += 7;

  doc.setFont('helvetica', 'bold');
  doc.text('Grand Total:', 140, y);
  doc.text(`${currencySymbol}${Number(qtn.grand_total).toFixed(2)}`, 175, y);

  doc.save(`${qtn.quotation_number}.pdf`);
}
