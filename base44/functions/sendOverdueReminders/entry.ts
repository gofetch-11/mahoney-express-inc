import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Admin-only guard for manual calls
    const isWebhook = req.headers.get("x-automation-source") === "scheduled";
    if (!isWebhook) {
      const user = await base44.auth.me();
      if (user?.role !== "admin") {
        return Response.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const today = new Date();
    const allInvoices = await base44.asServiceRole.entities.Invoice.list();

    // Find invoices where due_date was 15+ days ago and status is still open
    const overdueInvoices = allInvoices.filter(inv => {
      if (!["Sent", "Partial", "Overdue"].includes(inv.status)) return false;
      if (!inv.due_date) return false;
      const due = new Date(inv.due_date);
      const daysPast = Math.floor((today - due) / (1000 * 60 * 60 * 24));
      return daysPast >= 15;
    });

    if (overdueInvoices.length === 0) {
      console.log("No overdue invoices found.");
      return Response.json({ success: true, sent: 0 });
    }

    // Find customer emails by fetching customers once
    const customers = await base44.asServiceRole.entities.Customer.list();
    const customerMap = {};
    customers.forEach(c => { customerMap[c.id] = c; });

    let sent = 0;
    let skipped = 0;

    for (const inv of overdueInvoices) {
      const customer = customerMap[inv.customer_id];
      const email = customer?.email || null;

      if (!email) {
        console.log(`No email for customer on invoice ${inv.invoice_number}, skipping.`);
        skipped++;
        continue;
      }

      const due = new Date(inv.due_date);
      const daysPast = Math.floor((today - due) / (1000 * 60 * 60 * 24));
      const balanceDue = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(inv.balance_due || 0);
      const totalAmount = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(inv.total_amount || 0);

      // Mark invoice as Overdue if not already
      if (inv.status !== "Overdue") {
        await base44.asServiceRole.entities.Invoice.update(inv.id, { status: "Overdue" });
      }

      await base44.asServiceRole.integrations.Core.SendEmail({
        to: email,
        subject: `⚠️ Payment Reminder — Invoice ${inv.invoice_number} (${daysPast} Days Past Due)`,
        body: `
Dear ${inv.customer_name || "Valued Customer"},

This is a friendly reminder that the following invoice is now ${daysPast} days past due. Prompt payment is appreciated.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Invoice #:    ${inv.invoice_number}
  Invoice Date: ${inv.issue_date || "—"}
  Due Date:     ${inv.due_date}
  Days Past:    ${daysPast} days
  Total:        ${totalAmount}
  Balance Due:  ${balanceDue}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Please remit payment at your earliest convenience to avoid any service interruptions.

REMIT PAYMENT TO:
  Mahoney Express, Inc.
  1615 N Newland Ave · Chicago, IL 60707
  📞 +1 708.955.9082
  ✉  accounting@mahoneyexpress.com

If payment has already been sent, please disregard this notice or contact us to confirm receipt.

Thank you for your business.

— Mahoney Express Accounting
When tomorrow's too late!
        `.trim(),
      });

      console.log(`Overdue reminder sent to ${email} for invoice ${inv.invoice_number} (${daysPast} days past due)`);
      sent++;
    }

    return Response.json({ success: true, sent, skipped, total: overdueInvoices.length });
  } catch (error) {
    console.error("sendOverdueReminders error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});