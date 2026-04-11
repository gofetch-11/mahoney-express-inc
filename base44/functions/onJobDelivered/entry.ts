import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    // Only act on status changing TO "Delivered"
    const { data, old_data, changed_fields } = body;
    if (!changed_fields?.includes("status")) return Response.json({ skipped: true });
    if (data?.status !== "Delivered") return Response.json({ skipped: true });
    if (old_data?.status === "Delivered") return Response.json({ skipped: true });

    const job = data;

    // Try to find the customer's email
    let customerEmail = null;
    if (job.customer_id) {
      try {
        const customers = await base44.asServiceRole.entities.Customer.filter({ id: job.customer_id });
        customerEmail = customers[0]?.email || null;
      } catch {}
    }

    if (!customerEmail) {
      console.log(`No customer email found for job ${job.job_number}, skipping.`);
      return Response.json({ skipped: true, reason: "no customer email" });
    }

    const jobNumber = job.job_number || job.id?.slice(0, 8);
    const route = `${job.pickup_city || "??"} → ${job.delivery_city || "??"}`;
    const pieces = job.pieces ? `${job.pieces} piece(s)` : "";
    const weight = job.weight_lbs ? `, ${job.weight_lbs} lbs` : "";
    const freight = pieces ? `${pieces}${weight}` : "";

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: customerEmail,
      subject: `✅ Delivery Confirmed — Job ${jobNumber}`,
      body: `
Dear ${job.customer_name || "Valued Customer"},

Great news — your shipment has been successfully delivered!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Job Number:  ${jobNumber}
  Route:       ${route}
  ${freight ? `Freight:     ${freight}` : ""}
  ${job.reference_number ? `Reference:   ${job.reference_number}` : ""}
  Driver:      ${job.driver_name || "Mahoney Express Driver"}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Your shipment has been delivered. If you have any questions or concerns about this delivery, please contact us.

📞 +1 708.955.9082
✉  accounting@mahoneyexpress.com
📍 1615 N Newland Ave · Chicago, IL 60707

Thank you for choosing Mahoney Express — When tomorrow's too late!

— The Mahoney Express Team
      `.trim(),
    });

    console.log(`Delivery confirmation sent to ${customerEmail} for job ${jobNumber}`);
    return Response.json({ success: true, sentTo: customerEmail, job: jobNumber });
  } catch (error) {
    console.error("onJobDelivered error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});