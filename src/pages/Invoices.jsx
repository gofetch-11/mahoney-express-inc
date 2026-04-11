import { useState, useEffect } from "react";
import { Invoice, Job, Customer } from "@/api/entities";
import { Plus, FileText, DollarSign, Printer, ArrowLeft, CheckCircle, AlertCircle, Clock, X, Download } from "lucide-react";
import { jsPDF } from "jspdf";

const GREEN = "#0fa14a";
const BLACK = "#060204";
const BG = "#f4f4f2";
const LOGO_HEADER = "https://media.base44.com/images/public/69cb07fb94b4627f0bd76151/a863be72e_MahoneyExpressInc-Header.png";
const SHAMROCK = "https://media.base44.com/images/public/69cb07fb94b4627f0bd76151/828dbca4e_Shamrock.png";

const fmt = (n) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n || 0);

const STATUS_CFG = {
  Draft:   { bg: "#f4f4f2", text: "#6b6b67", dot: "#b0b2b7" },
  Sent:    { bg: "#e8f4ff", text: "#1d4ed8", dot: "#3b82f6" },
  Partial: { bg: "#fff8e1", text: "#b45309", dot: "#f59e0b" },
  Paid:    { bg: "#e6f9ee", text: "#166534", dot: GREEN },
  Overdue: { bg: "#fee2e2", text: "#991b1b", dot: "#ef4444" },
  Voided:  { bg: "#f4f4f2", text: "#b0b2b7", dot: "#d1d5db" },
};

function genInvNumber() {
  const d = new Date();
  return `INV-${d.getFullYear()}${String(d.getMonth()+1).padStart(2,"0")}${String(d.getDate()).padStart(2,"0")}-${Math.floor(Math.random()*900+100)}`;
}

export default function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [viewInvoice, setViewInvoice] = useState(null);
  const [statusFilter, setStatusFilter] = useState("All");

  useEffect(() => { loadInvoices(); }, []);

  async function loadInvoices() {
    const data = await Invoice.list();
    setInvoices(data.sort((a, b) => new Date(b.created_date) - new Date(a.created_date)));
    setLoading(false);
  }

  const totals = {
    outstanding: invoices.filter(i => ["Sent","Partial","Overdue"].includes(i.status)).reduce((s,i) => s+(i.balance_due||0), 0),
    paid: invoices.filter(i => i.status === "Paid").reduce((s,i) => s+(i.total_amount||0), 0),
    overdue: invoices.filter(i => i.status === "Overdue").reduce((s,i) => s+(i.balance_due||0), 0),
  };

  const filtered = statusFilter === "All" ? invoices : invoices.filter(i => i.status === statusFilter);

  if (viewInvoice) return <InvoiceView invoice={viewInvoice} onBack={() => { setViewInvoice(null); loadInvoices(); }} onStatusChange={loadInvoices} />;

  return (
    <div style={{ minHeight: "100vh", background: BG, fontFamily: "Source Sans 3, sans-serif", padding: 24 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
            <img src={SHAMROCK} alt="" style={{ width: 16, height: 16 }} />
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: GREEN, fontFamily: "Barlow, sans-serif" }}>Billing</span>
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: BLACK, margin: 0, fontFamily: "Barlow, sans-serif" }}>Invoices</h1>
          <p style={{ fontSize: 13, color: "#6b6b67", margin: "2px 0 0" }}>{invoices.length} total invoices</p>
        </div>
        <button onClick={() => setShowCreate(true)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 18px", background: GREEN, color: "#fff", border: "none", borderRadius: 12, fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "Barlow, sans-serif" }}>
          <Plus size={16} />New Invoice
        </button>
      </div>

      {/* Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 20 }}>
        {[
          { label: "Outstanding A/R", value: fmt(totals.outstanding), color: "#1d4ed8", bg: "#e8f4ff", icon: <Clock size={16} style={{ color: "#1d4ed8" }} /> },
          { label: "Overdue",         value: fmt(totals.overdue),     color: "#ef4444", bg: "#fee2e2", icon: <AlertCircle size={16} style={{ color: "#ef4444" }} /> },
          { label: "Collected",       value: fmt(totals.paid),        color: GREEN,     bg: "#e6f9ee", icon: <CheckCircle size={16} style={{ color: GREEN }} /> },
        ].map(c => (
          <div key={c.label} style={{ background: "#fff", border: `1px solid ${c.bg}`, borderRadius: 16, padding: "18px 20px", boxShadow: "0 1px 6px rgba(0,0,0,0.04)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "#6b6b67", fontFamily: "Barlow, sans-serif" }}>{c.label}</span>
              {c.icon}
            </div>
            <p style={{ fontSize: 26, fontWeight: 800, color: c.color, margin: 0, fontFamily: "Barlow, sans-serif" }}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Status Filter Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {["All", "Draft", "Sent", "Partial", "Paid", "Overdue", "Voided"].map(s => {
          const active = statusFilter === s;
          const cfg = STATUS_CFG[s] || {};
          return (
            <button key={s} onClick={() => setStatusFilter(s)} style={{
              padding: "6px 14px", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer",
              background: active ? (s === "All" ? BLACK : cfg.bg) : "#fff",
              color: active ? (s === "All" ? "#fff" : cfg.text) : "#6b6b67",
              border: `1px solid ${active ? (s === "All" ? BLACK : cfg.dot) : "rgba(0,0,0,0.1)"}`,
              fontFamily: "Barlow, sans-serif",
            }}>
              {s} <span style={{ opacity: 0.6 }}>{s === "All" ? invoices.length : invoices.filter(i => i.status === s).length}</span>
            </button>
          );
        })}
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 48, color: "#b0b2b7" }}>Loading…</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: 64, color: "#b0b2b7" }}>
          <img src={SHAMROCK} alt="" style={{ width: 36, height: 36, opacity: 0.15, marginBottom: 10 }} />
          <p>No invoices found.</p>
          <button onClick={() => setShowCreate(true)} style={{ marginTop: 8, color: GREEN, fontWeight: 600, background: "none", border: "none", cursor: "pointer", fontSize: 14 }}>Create one →</button>
        </div>
      ) : (
        <div style={{ background: "#fff", borderRadius: 16, border: "1px solid rgba(0,0,0,0.08)", overflow: "hidden", boxShadow: "0 1px 6px rgba(0,0,0,0.04)" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: BLACK, borderBottom: `2px solid ${GREEN}` }}>
                  {["Invoice #","Customer","Issue Date","Due Date","Status","Total","Balance Due",""].map(h => (
                    <th key={h} style={{ textAlign: "left", padding: "10px 16px", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: h === "" ? GREEN : "#fff", fontFamily: "Barlow, sans-serif", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((inv, i) => {
                  const sc = STATUS_CFG[inv.status] || STATUS_CFG.Draft;
                  const isOverdue = inv.status === "Overdue";
                  return (
                    <tr key={inv.id} style={{ background: i % 2 === 0 ? "#fff" : "#fafafa", borderBottom: "1px solid rgba(0,0,0,0.04)" }}>
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{ fontFamily: "monospace", fontWeight: 700, fontSize: 12, color: GREEN }}>{inv.invoice_number}</span>
                      </td>
                      <td style={{ padding: "12px 16px", fontWeight: 600, color: BLACK }}>{inv.customer_name || "—"}</td>
                      <td style={{ padding: "12px 16px", color: "#6b6b67" }}>{inv.issue_date || "—"}</td>
                      <td style={{ padding: "12px 16px", color: isOverdue ? "#ef4444" : "#6b6b67", fontWeight: isOverdue ? 700 : 400 }}>{inv.due_date || "—"}</td>
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: sc.bg, color: sc.text }}>{inv.status}</span>
                      </td>
                      <td style={{ padding: "12px 16px", fontWeight: 700, color: BLACK, fontFamily: "Barlow, sans-serif" }}>{fmt(inv.total_amount)}</td>
                      <td style={{ padding: "12px 16px", fontWeight: 700, fontFamily: "Barlow, sans-serif", color: (inv.balance_due||0) > 0 ? "#ef4444" : GREEN }}>{fmt(inv.balance_due)}</td>
                      <td style={{ padding: "12px 16px" }}>
                        <button onClick={() => setViewInvoice(inv)} style={{ fontSize: 12, fontWeight: 700, color: "#3b82f6", background: "none", border: "none", cursor: "pointer" }}>View →</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{ padding: "10px 16px", fontSize: 11, color: "#b0b2b7", borderTop: "1px solid rgba(0,0,0,0.05)" }}>
            Showing {filtered.length} of {invoices.length} invoices
          </div>
        </div>
      )}

      {showCreate && <CreateInvoiceModal onClose={() => { setShowCreate(false); loadInvoices(); }} />}
    </div>
  );
}

// ─── CREATE MODAL ──────────────────────────────────────────────────────────────
function CreateInvoiceModal({ onClose }) {
  const [customers, setCustomers] = useState([]);
  const [availableJobs, setAvailableJobs] = useState([]);
  const [selectedJobs, setSelectedJobs] = useState([]);
  const [form, setForm] = useState({
    invoice_number: genInvNumber(),
    customer_id: "", customer_name: "",
    issue_date: new Date().toISOString().split("T")[0],
    due_date: "", payment_terms: "Net 30", tax_rate: 0, notes: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => { Customer.filter({ status: "Active" }).then(setCustomers); }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleCustomer = async (id) => {
    const c = customers.find(x => x.id === id);
    if (!c) return;
    set("customer_id", id); set("customer_name", c.company_name);
    set("payment_terms", c.payment_terms || "Net 30");
    const days = { "Net 15": 15, "Net 30": 30, "Net 45": 45, "Due on Receipt": 0, "COD": 0 };
    const d = new Date(); d.setDate(d.getDate() + (days[c.payment_terms] || 30));
    set("due_date", d.toISOString().split("T")[0]);
    const jobs = await Job.filter({ customer_id: id });
    setAvailableJobs(jobs.filter(j => j.status === "Delivered"));
  };

  const toggleJob = (job) => setSelectedJobs(prev =>
    prev.find(j => j.id === job.id) ? prev.filter(j => j.id !== job.id) : [...prev, job]
  );

  const subtotal = selectedJobs.reduce((s,j) => s+(j.bill_rate||0), 0);
  const taxAmount = subtotal * ((form.tax_rate||0)/100);
  const total = subtotal + taxAmount;

  const save = async () => {
    setSaving(true);
    const lineItems = JSON.stringify(selectedJobs.map(j => ({
      job_number: j.job_number,
      description: `${j.service_type||"Delivery"}: ${j.pickup_city||"?"} → ${j.delivery_city||"?"}`,
      amount: j.bill_rate||0,
    })));
    await Invoice.create({
      ...form,
      job_ids: selectedJobs.map(j => j.id).join(","),
      line_items: lineItems,
      subtotal, tax_amount: taxAmount, total_amount: total,
      amount_paid: 0, balance_due: total, status: "Draft",
    });
    setSaving(false); onClose();
  };

  const inputStyle = { width: "100%", padding: "8px 12px", borderRadius: 10, border: "1px solid rgba(0,0,0,0.12)", fontSize: 13, color: BLACK, background: "#fff", outline: "none", fontFamily: "Source Sans 3, sans-serif" };
  const labelStyle = { display: "block", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "#6b6b67", marginBottom: 5, fontFamily: "Barlow, sans-serif" };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 16 }}>
      <div style={{ background: "#fff", borderRadius: 20, boxShadow: "0 8px 40px rgba(0,0,0,0.2)", width: "100%", maxWidth: 640, maxHeight: "90vh", overflow: "hidden", display: "flex", flexDirection: "column" }}>
        {/* Modal header */}
        <div style={{ padding: "18px 22px", borderBottom: "1px solid rgba(0,0,0,0.08)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <img src={SHAMROCK} alt="" style={{ width: 20, height: 20 }} />
            <h2 style={{ fontSize: 16, fontWeight: 800, color: BLACK, margin: 0, fontFamily: "Barlow, sans-serif" }}>New Invoice</h2>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#b0b2b7" }}><X size={20} /></button>
        </div>

        <div style={{ padding: "20px 22px", overflowY: "auto", flex: 1 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
            <div><label style={labelStyle}>Invoice #</label><input style={inputStyle} value={form.invoice_number} onChange={e => set("invoice_number", e.target.value)} /></div>
            <div><label style={labelStyle}>Issue Date</label><input style={inputStyle} type="date" value={form.issue_date} onChange={e => set("issue_date", e.target.value)} /></div>
            <div style={{ gridColumn: "span 2" }}>
              <label style={labelStyle}>Customer</label>
              <select style={inputStyle} value={form.customer_id} onChange={e => handleCustomer(e.target.value)}>
                <option value="">Select customer…</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.company_name}</option>)}
              </select>
            </div>
            <div><label style={labelStyle}>Payment Terms</label>
              <select style={inputStyle} value={form.payment_terms} onChange={e => set("payment_terms", e.target.value)}>
                {["Net 15","Net 30","Net 45","Due on Receipt","COD"].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div><label style={labelStyle}>Due Date</label><input style={inputStyle} type="date" value={form.due_date} onChange={e => set("due_date", e.target.value)} /></div>
            <div><label style={labelStyle}>Tax Rate (%)</label><input style={inputStyle} type="number" placeholder="0" value={form.tax_rate} onChange={e => set("tax_rate", parseFloat(e.target.value)||0)} /></div>
          </div>

          {/* Jobs selector */}
          {form.customer_id && (
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Select Delivered Jobs to Invoice</label>
              {availableJobs.length === 0 ? (
                <div style={{ padding: "12px 14px", borderRadius: 10, background: BG, color: "#6b6b67", fontSize: 13 }}>No delivered jobs found for this customer.</div>
              ) : (
                <div style={{ border: "1px solid rgba(0,0,0,0.1)", borderRadius: 12, overflow: "hidden" }}>
                  {availableJobs.map((job, i) => {
                    const selected = selectedJobs.find(j => j.id === job.id);
                    return (
                      <div key={job.id} onClick={() => toggleJob(job)} style={{
                        display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", cursor: "pointer",
                        background: selected ? "#e6f9ee" : i % 2 === 0 ? "#fff" : "#fafafa",
                        borderBottom: i < availableJobs.length - 1 ? "1px solid rgba(0,0,0,0.05)" : "none",
                        transition: "background 0.1s",
                      }}>
                        <div style={{ width: 18, height: 18, borderRadius: 5, border: `2px solid ${selected ? GREEN : "#d1d5db"}`, background: selected ? GREEN : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          {selected && <span style={{ color: "#fff", fontSize: 11, fontWeight: 700 }}>✓</span>}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ fontSize: 12, fontWeight: 700, color: GREEN, fontFamily: "Barlow, sans-serif" }}>{job.job_number}</span>
                            <span style={{ fontSize: 12, color: "#6b6b67" }}>{job.pickup_city||"?"} → {job.delivery_city||"?"}</span>
                          </div>
                          <p style={{ fontSize: 11, color: "#b0b2b7", margin: "2px 0 0" }}>{job.service_type || "Delivery"}</p>
                        </div>
                        <span style={{ fontSize: 14, fontWeight: 700, color: BLACK, fontFamily: "Barlow, sans-serif", flexShrink: 0 }}>{fmt(job.bill_rate)}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Totals preview */}
          {selectedJobs.length > 0 && (
            <div style={{ background: BLACK, borderRadius: 12, padding: "14px 18px", marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6, color: "#b0b2b7" }}>
                <span>Subtotal ({selectedJobs.length} jobs)</span><span style={{ fontWeight: 600, color: "#fff" }}>{fmt(subtotal)}</span>
              </div>
              {taxAmount > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6, color: "#b0b2b7" }}>
                  <span>Tax ({form.tax_rate}%)</span><span style={{ fontWeight: 600, color: "#fff" }}>{fmt(taxAmount)}</span>
                </div>
              )}
              <div style={{ borderTop: "1px solid rgba(255,255,255,0.12)", marginTop: 8, paddingTop: 8, display: "flex", justifyContent: "space-between", fontSize: 16, fontWeight: 800, fontFamily: "Barlow, sans-serif" }}>
                <span style={{ color: "#fff" }}>Total</span><span style={{ color: GREEN }}>{fmt(total)}</span>
              </div>
            </div>
          )}

          <div>
            <label style={labelStyle}>Notes</label>
            <textarea style={{ ...inputStyle, resize: "vertical" }} rows={3} placeholder="Payment instructions, thank-you note…" value={form.notes} onChange={e => set("notes", e.target.value)} />
          </div>
        </div>

        <div style={{ padding: "16px 22px", borderTop: "1px solid rgba(0,0,0,0.08)", display: "flex", gap: 10, flexShrink: 0 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "11px", borderRadius: 12, border: "1px solid rgba(0,0,0,0.12)", background: "#fff", color: "#6b6b67", fontWeight: 600, cursor: "pointer" }}>Cancel</button>
          <button onClick={save} disabled={saving || !form.customer_id} style={{ flex: 2, padding: "11px", borderRadius: 12, background: GREEN, color: "#fff", border: "none", fontWeight: 800, fontSize: 15, cursor: "pointer", fontFamily: "Barlow, sans-serif", opacity: (saving || !form.customer_id) ? 0.5 : 1 }}>
            {saving ? "Creating…" : "Create Invoice"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── INVOICE VIEW / PRINT ─────────────────────────────────────────────────────
function generateInvoicePDF(inv) {
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const lineItems = (() => { try { return JSON.parse(inv.line_items || "[]"); } catch { return []; } })();
  const GREEN = [15, 161, 74];
  const BLACK = [6, 2, 4];
  const W = 612;

  // Green header strip
  doc.setFillColor(...GREEN);
  doc.rect(0, 0, W, 6, "F");

  // Dark header bar
  doc.setFillColor(...BLACK);
  doc.rect(0, 6, W, 80, "F");

  // Company name
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("MAHONEY EXPRESS, INC.", 40, 52);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(150, 150, 150);
  doc.text("+1 708.955.9082  |  accounting@mahoneyexpress.com", 40, 68);

  // Invoice label + number
  doc.setFontSize(9);
  doc.setTextColor(150, 150, 150);
  doc.text("INVOICE", W - 40, 34, { align: "right" });
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...GREEN);
  doc.text(inv.invoice_number || "", W - 40, 52, { align: "right" });

  // Status badge
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text(inv.status || "", W - 40, 68, { align: "right" });

  let y = 110;

  // Bill To + Invoice Details
  doc.setFillColor(248, 248, 246);
  doc.rect(0, y - 14, W, 80, "F");

  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...GREEN);
  doc.text("BILL TO", 40, y);
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...BLACK);
  doc.text(inv.customer_name || "—", 40, y + 16);

  // Right side: invoice details
  const details = [
    ["Invoice Number", inv.invoice_number],
    ["Issue Date", inv.issue_date || "—"],
    ["Due Date", inv.due_date || "—"],
    ["Payment Terms", inv.payment_terms || "—"],
  ];
  details.forEach(([label, val], i) => {
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text(label, W / 2 + 10, y + i * 14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...BLACK);
    doc.text(String(val || "—"), W - 40, y + i * 14, { align: "right" });
  });

  y += 90;

  // Line Items Header
  doc.setFillColor(...BLACK);
  doc.rect(40, y, W - 80, 24, "F");
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("JOB #", 52, y + 15);
  doc.text("DESCRIPTION", 120, y + 15);
  doc.setTextColor(...GREEN);
  doc.text("AMOUNT", W - 52, y + 15, { align: "right" });
  y += 24;

  // Line Items
  lineItems.forEach((item, i) => {
    doc.setFillColor(i % 2 === 0 ? 255 : 249, i % 2 === 0 ? 255 : 249, i % 2 === 0 ? 255 : 249);
    doc.rect(40, y, W - 80, 22, "F");
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...GREEN);
    doc.text(String(item.job_number || "—"), 52, y + 14);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 80, 80);
    doc.text(String(item.description || ""), 120, y + 14, { maxWidth: W - 220 });
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...BLACK);
    doc.text(new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(item.amount || 0), W - 52, y + 14, { align: "right" });
    y += 22;
  });

  if (lineItems.length === 0) {
    doc.setFontSize(9); doc.setTextColor(150, 150, 150);
    doc.text("No line items", W / 2, y + 14, { align: "center" });
    y += 22;
  }

  y += 16;

  // Totals block
  const fmt = (n) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n || 0);
  const totals = [
    ["Subtotal", fmt(inv.subtotal), false],
    inv.tax_amount > 0 ? [`Tax (${inv.tax_rate || 0}%)`, fmt(inv.tax_amount), false] : null,
    ["Total", fmt(inv.total_amount), true],
    (inv.amount_paid || 0) > 0 ? ["Amount Paid", `(${fmt(inv.amount_paid)})`, false] : null,
    ["Balance Due", fmt(inv.balance_due), true],
  ].filter(Boolean);

  totals.forEach(([label, val, bold]) => {
    if (bold) { doc.setDrawColor(200, 200, 200); doc.line(W - 200, y - 2, W - 40, y - 2); }
    doc.setFontSize(bold ? 11 : 9);
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setTextColor(bold ? 0 : 100, bold ? 0 : 100, bold ? 0 : 100);
    doc.text(label, W - 200, y + 10);
    if (label === "Balance Due" && (inv.balance_due || 0) > 0) doc.setTextColor(239, 68, 68);
    else if (label === "Amount Paid") doc.setTextColor(15, 161, 74);
    else doc.setTextColor(6, 2, 4);
    doc.text(val, W - 40, y + 10, { align: "right" });
    y += bold ? 20 : 16;
  });

  y += 20;

  // Notes
  if (inv.notes) {
    doc.setFontSize(8); doc.setFont("helvetica", "bold"); doc.setTextColor(...GREEN);
    doc.text("NOTES", 40, y);
    doc.setFontSize(9); doc.setFont("helvetica", "normal"); doc.setTextColor(80, 80, 80);
    doc.text(inv.notes, 40, y + 12, { maxWidth: W - 80 });
    y += 40;
  }

  // Remit To
  doc.setFillColor(249, 249, 249);
  doc.rect(40, y, W - 80, 44, "F");
  doc.setFontSize(8); doc.setFont("helvetica", "bold"); doc.setTextColor(...GREEN);
  doc.text("REMIT PAYMENT TO", 52, y + 14);
  doc.setFont("helvetica", "normal"); doc.setTextColor(80, 80, 80);
  doc.text("Mahoney Express, Inc.  |  1615 N Newland Ave, Chicago, IL 60707", 52, y + 26);
  doc.text("+1 708.955.9082  |  accounting@mahoneyexpress.com", 52, y + 38);

  // Footer strip
  doc.setFillColor(...BLACK);
  doc.rect(0, 740, W, 32, "F");
  doc.setFillColor(...GREEN);
  doc.rect(0, 772, W, 4, "F");
  doc.setFontSize(9); doc.setFont("helvetica", "italic"); doc.setTextColor(...GREEN);
  doc.text("When tomorrow's too late!", W / 2, 760, { align: "center" });

  doc.save(`${inv.invoice_number || "invoice"}.pdf`);
}

function InvoiceView({ invoice, onBack, onStatusChange }) {
  const [inv, setInv] = useState(invoice);
  const [payment, setPayment] = useState("");
  const [showPayment, setShowPayment] = useState(false);
  const [saving, setSaving] = useState(false);

  const lineItems = (() => { try { return JSON.parse(inv.line_items || "[]"); } catch { return []; } })();

  const markSent = async () => {
    setSaving(true);
    const updated = await Invoice.update(inv.id, { status: "Sent" });
    setInv(u => ({ ...u, status: "Sent" }));
    setSaving(false);
    onStatusChange?.();
  };

  const recordPayment = async () => {
    const amount = parseFloat(payment) || 0;
    if (!amount) return;
    setSaving(true);
    const newPaid = (inv.amount_paid||0) + amount;
    const newBalance = (inv.total_amount||0) - newPaid;
    const newStatus = newBalance <= 0 ? "Paid" : "Partial";
    await Invoice.update(inv.id, { amount_paid: newPaid, balance_due: Math.max(0, newBalance), status: newStatus });
    setInv(u => ({ ...u, amount_paid: newPaid, balance_due: Math.max(0, newBalance), status: newStatus }));
    setPayment(""); setShowPayment(false); setSaving(false);
    onStatusChange?.();
  };

  const sc = STATUS_CFG[inv.status] || STATUS_CFG.Draft;

  return (
    <div style={{ minHeight: "100vh", background: BG, fontFamily: "Source Sans 3, sans-serif" }}>
      {/* Toolbar */}
      <div className="no-print" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 24px", background: "#fff", borderBottom: "1px solid rgba(0,0,0,0.08)", position: "sticky", top: 0, zIndex: 10 }}>
        <button onClick={onBack} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", color: "#6b6b67", fontWeight: 600, fontSize: 14 }}>
          <ArrowLeft size={16} />All Invoices
        </button>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ fontSize: 12, fontWeight: 700, padding: "4px 12px", borderRadius: 20, background: sc.bg, color: sc.text }}>{inv.status}</span>
          {inv.status === "Draft" && (
            <button onClick={markSent} disabled={saving} style={{ padding: "8px 16px", borderRadius: 10, background: "#1d4ed8", color: "#fff", border: "none", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "Barlow, sans-serif" }}>
              Mark Sent
            </button>
          )}
          {["Sent","Partial","Overdue"].includes(inv.status) && (
            <button onClick={() => setShowPayment(true)} style={{ padding: "8px 16px", borderRadius: 10, background: GREEN, color: "#fff", border: "none", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "Barlow, sans-serif" }}>
              + Record Payment
            </button>
          )}
          <button onClick={() => generateInvoicePDF(inv)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 10, background: GREEN, color: "#fff", border: "none", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "Barlow, sans-serif" }}>
            <Download size={14} />Download PDF
          </button>
          <button onClick={() => window.print()} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 10, background: BLACK, color: "#fff", border: "none", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "Barlow, sans-serif" }}>
            <Printer size={14} />Print
          </button>
        </div>
      </div>

      {/* Payment modal */}
      {showPayment && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 28, width: 340, boxShadow: "0 8px 40px rgba(0,0,0,0.2)" }}>
            <h3 style={{ fontFamily: "Barlow, sans-serif", fontSize: 17, fontWeight: 800, color: BLACK, marginBottom: 4 }}>Record Payment</h3>
            <p style={{ fontSize: 13, color: "#6b6b67", marginBottom: 18 }}>Balance due: <strong style={{ color: "#ef4444" }}>{fmt(inv.balance_due)}</strong></p>
            <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "#6b6b67", display: "block", marginBottom: 6, fontFamily: "Barlow, sans-serif" }}>Amount Received ($)</label>
            <input autoFocus type="number" value={payment} onChange={e => setPayment(e.target.value)}
              style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid rgba(0,0,0,0.12)", fontSize: 18, fontWeight: 700, color: BLACK, outline: "none", marginBottom: 16 }}
              placeholder="0.00" onKeyDown={e => e.key === "Enter" && recordPayment()} />
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setShowPayment(false)} style={{ flex: 1, padding: 10, borderRadius: 10, border: "1px solid rgba(0,0,0,0.1)", background: "#fff", cursor: "pointer", fontWeight: 600 }}>Cancel</button>
              <button onClick={recordPayment} disabled={saving} style={{ flex: 1, padding: 10, borderRadius: 10, background: GREEN, color: "#fff", border: "none", fontWeight: 800, cursor: "pointer", fontFamily: "Barlow, sans-serif", fontSize: 14 }}>
                {saving ? "Saving…" : "Record"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── PRINTABLE INVOICE ────────────────────────────────── */}
      <div style={{ maxWidth: 760, margin: "28px auto", padding: "0 20px 60px" }}>
        <div style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.1)", borderRadius: 12, overflow: "hidden", boxShadow: "0 2px 20px rgba(0,0,0,0.08)" }}>

          {/* Green accent strip */}
          <div style={{ height: 5, background: "linear-gradient(90deg,#0fa14a,#009549)" }} />

          {/* Invoice Header */}
          <div style={{ background: BLACK, padding: "22px 30px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
            <img src={LOGO_HEADER} alt="Mahoney Express" style={{ height: 52, width: "auto" }} />
            <div style={{ textAlign: "right" }}>
              <p style={{ fontSize: 10, color: "#888", margin: 0, textTransform: "uppercase", letterSpacing: "0.12em", fontFamily: "Barlow, sans-serif" }}>Invoice</p>
              <p style={{ fontSize: 24, fontWeight: 800, color: GREEN, margin: "2px 0", fontFamily: "Barlow, sans-serif" }}>{inv.invoice_number}</p>
              <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 12px", borderRadius: 20, background: sc.bg, color: sc.text }}>{inv.status}</span>
            </div>
          </div>

          {/* Bill To / Invoice Info */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0, borderBottom: "1px solid #e8e8e8" }}>
            {/* Bill To */}
            <div style={{ padding: "22px 30px", borderRight: "1px solid #e8e8e8" }}>
              <p style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: GREEN, margin: "0 0 10px", fontFamily: "Barlow, sans-serif" }}>Bill To</p>
              <p style={{ fontSize: 17, fontWeight: 800, color: BLACK, margin: "0 0 4px", fontFamily: "Barlow, sans-serif" }}>{inv.customer_name || "—"}</p>
              <p style={{ fontSize: 13, color: "#6b6b67", margin: 0, lineHeight: 1.5 }}>
                {inv.notes ? "" : "accounting@mahoneyexpress.com"}
              </p>
            </div>
            {/* Invoice Details */}
            <div style={{ padding: "22px 30px" }}>
              <p style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: GREEN, margin: "0 0 10px", fontFamily: "Barlow, sans-serif" }}>Invoice Details</p>
              {[
                ["Invoice Number", inv.invoice_number],
                ["Issue Date", inv.issue_date],
                ["Due Date", inv.due_date],
                ["Payment Terms", inv.payment_terms],
              ].map(([l,v]) => (
                <div key={l} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 5 }}>
                  <span style={{ color: "#6b6b67" }}>{l}</span>
                  <span style={{ fontWeight: 600, color: BLACK }}>{v || "—"}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Line Items Table */}
          <div style={{ padding: "22px 30px", borderBottom: "1px solid #e8e8e8" }}>
            <p style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: GREEN, margin: "0 0 14px", fontFamily: "Barlow, sans-serif" }}>Services Rendered</p>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: BLACK }}>
                  <th style={{ textAlign: "left", padding: "8px 12px", fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "#fff", fontFamily: "Barlow, sans-serif" }}>Job #</th>
                  <th style={{ textAlign: "left", padding: "8px 12px", fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "#fff", fontFamily: "Barlow, sans-serif" }}>Description</th>
                  <th style={{ textAlign: "right", padding: "8px 12px", fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: GREEN, fontFamily: "Barlow, sans-serif" }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {lineItems.length > 0 ? lineItems.map((item, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : "#f9f9f9", borderBottom: "1px solid #f0f0f0" }}>
                    <td style={{ padding: "10px 12px", fontFamily: "monospace", fontWeight: 700, fontSize: 12, color: GREEN }}>{item.job_number || "—"}</td>
                    <td style={{ padding: "10px 12px", color: "#6b6b67" }}>{item.description}</td>
                    <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 700, color: BLACK, fontFamily: "Barlow, sans-serif" }}>{fmt(item.amount)}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={3} style={{ padding: "16px 12px", color: "#b0b2b7", textAlign: "center" }}>No line items</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div style={{ display: "flex", justifyContent: "flex-end", padding: "20px 30px", borderBottom: "1px solid #e8e8e8" }}>
            <div style={{ width: 280 }}>
              {[
                ["Subtotal", fmt(inv.subtotal), BLACK, false],
                inv.tax_amount > 0 ? [`Tax (${inv.tax_rate || 0}%)`, fmt(inv.tax_amount), BLACK, false] : null,
                ["Total", fmt(inv.total_amount), BLACK, true],
                (inv.amount_paid||0) > 0 ? ["Amount Paid", `(${fmt(inv.amount_paid)})`, GREEN, false] : null,
                ["Balance Due", fmt(inv.balance_due), (inv.balance_due||0) > 0 ? "#ef4444" : GREEN, true],
              ].filter(Boolean).map(([l,v,c,bold]) => (
                <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: bold ? "10px 0 0" : "5px 0", borderTop: bold ? "2px solid #e8e8e8" : "none", marginTop: bold ? 4 : 0 }}>
                  <span style={{ fontSize: bold ? 15 : 13, fontWeight: bold ? 800 : 500, color: bold ? BLACK : "#6b6b67", fontFamily: bold ? "Barlow, sans-serif" : "inherit" }}>{l}</span>
                  <span style={{ fontSize: bold ? 16 : 13, fontWeight: bold ? 800 : 600, color: c, fontFamily: "Barlow, sans-serif" }}>{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          {inv.notes && (
            <div style={{ padding: "18px 30px", borderBottom: "1px solid #e8e8e8", background: "#fafafa" }}>
              <p style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#6b6b67", margin: "0 0 6px", fontFamily: "Barlow, sans-serif" }}>Notes</p>
              <p style={{ fontSize: 13, color: BLACK, margin: 0, lineHeight: 1.6 }}>{inv.notes}</p>
            </div>
          )}

          {/* Payment Instructions */}
          <div style={{ padding: "16px 30px", background: "#f9f9f9", borderBottom: "1px solid #e8e8e8" }}>
            <p style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: GREEN, margin: "0 0 6px", fontFamily: "Barlow, sans-serif" }}>Remit Payment To</p>
            <p style={{ fontSize: 13, color: "#6b6b67", margin: 0, lineHeight: 1.6 }}>
              Mahoney Express, Inc. · 1615 N Newland Ave · Chicago, IL 60707<br />
              📞 +1 708.955.9082 · ✉ accounting@mahoneyexpress.com
            </p>
          </div>

          {/* Footer */}
          <div style={{ background: BLACK, padding: "12px 30px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <p style={{ fontSize: 11, color: "#555", margin: 0 }}>Thank you for your business!</p>
            <p style={{ fontSize: 11, color: GREEN, margin: 0, fontStyle: "italic", fontFamily: "Barlow, sans-serif", fontWeight: 700 }}>When tomorrow's too late!</p>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
        }
      `}</style>
    </div>
  );
}