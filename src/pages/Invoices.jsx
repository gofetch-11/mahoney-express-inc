import { useState, useEffect } from "react";
import { Invoice, Job, Customer } from "@/api/entities";
import { Plus, FileText, DollarSign, Printer, ArrowLeft } from "lucide-react";

const STATUS_COLORS = {
  Draft: "bg-gray-100 text-gray-600",
  Sent: "bg-blue-100 text-blue-700",
  Partial: "bg-yellow-100 text-yellow-700",
  Paid: "bg-green-100 text-green-700",
  Overdue: "bg-red-100 text-red-700",
  Voided: "bg-gray-100 text-gray-400 line-through",
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

  useEffect(() => { loadInvoices(); }, []);

  async function loadInvoices() {
    const data = await Invoice.list();
    setInvoices(data.sort((a, b) => new Date(b.created_date) - new Date(a.created_date)));
    setLoading(false);
  }

  const fmt = (n) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n || 0);

  const totals = {
    outstanding: invoices.filter(i => ["Sent","Partial","Overdue"].includes(i.status)).reduce((s,i) => s + (i.balance_due||0), 0),
    paid: invoices.filter(i => i.status === "Paid").reduce((s,i) => s + (i.total_amount||0), 0),
    overdue: invoices.filter(i => i.status === "Overdue").reduce((s,i) => s + (i.balance_due||0), 0),
  };

  if (viewInvoice) return <InvoiceView invoice={viewInvoice} onBack={() => { setViewInvoice(null); loadInvoices(); }} />;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Invoices</h1>
          <p className="text-sm text-gray-500">{invoices.length} invoices</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="bg-red-600 text-white px-4 py-2 rounded-xl font-semibold hover:bg-red-700 flex items-center gap-2 text-sm">
          <Plus className="w-4 h-4" />New Invoice
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
          <p className="text-xs text-gray-500 mb-1">Outstanding A/R</p>
          <p className="text-xl font-bold text-blue-600">{fmt(totals.outstanding)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-red-200 p-4 shadow-sm">
          <p className="text-xs text-gray-500 mb-1">Overdue</p>
          <p className="text-xl font-bold text-red-600">{fmt(totals.overdue)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-green-200 p-4 shadow-sm">
          <p className="text-xs text-gray-500 mb-1">Collected (All Time)</p>
          <p className="text-xl font-bold text-green-600">{fmt(totals.paid)}</p>
        </div>
      </div>

      {loading ? <div className="text-center py-12 text-gray-400">Loading...</div> : (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {invoices.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>No invoices yet.</p>
              <button onClick={() => setShowCreate(true)} className="mt-3 text-red-600 font-medium hover:underline">Create your first invoice →</button>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Invoice #</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Customer</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden md:table-cell">Issue Date</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden md:table-cell">Due Date</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">Total</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">Balance</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {invoices.map(inv => (
                  <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-gray-700">{inv.invoice_number}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{inv.customer_name}</td>
                    <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{inv.issue_date}</td>
                    <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{inv.due_date}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[inv.status]}`}>{inv.status}</span>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-800">{fmt(inv.total_amount)}</td>
                    <td className={`px-4 py-3 text-right font-semibold ${(inv.balance_due||0) > 0 ? "text-red-600" : "text-green-600"}`}>{fmt(inv.balance_due)}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => setViewInvoice(inv)} className="text-xs text-blue-600 hover:underline">View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {showCreate && <CreateInvoiceModal onClose={() => { setShowCreate(false); loadInvoices(); }} />}
    </div>
  );
}

function CreateInvoiceModal({ onClose }) {
  const [customers, setCustomers] = useState([]);
  const [availableJobs, setAvailableJobs] = useState([]);
  const [selectedJobs, setSelectedJobs] = useState([]);
  const [form, setForm] = useState({
    invoice_number: genInvNumber(),
    customer_id: "", customer_name: "",
    issue_date: new Date().toISOString().split("T")[0],
    due_date: "", payment_terms: "Net 30",
    tax_rate: 0, notes: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Customer.filter({ status: "Active" }).then(setCustomers);
  }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleCustomer = async (id) => {
    const c = customers.find(x => x.id === id);
    if (!c) return;
    set("customer_id", id);
    set("customer_name", c.company_name);
    set("payment_terms", c.payment_terms || "Net 30");
    // Set due date based on terms
    const days = { "Net 15": 15, "Net 30": 30, "Net 45": 45, "Due on Receipt": 0, "COD": 0 };
    const d = new Date();
    d.setDate(d.getDate() + (days[c.payment_terms] || 30));
    set("due_date", d.toISOString().split("T")[0]);
    // Load unbilled jobs for this customer
    const jobs = await Job.filter({ customer_id: id });
    setAvailableJobs(jobs.filter(j => j.status === "Delivered" && !j.invoice_id));
  };

  const toggleJob = (job) => {
    setSelectedJobs(prev =>
      prev.find(j => j.id === job.id) ? prev.filter(j => j.id !== job.id) : [...prev, job]
    );
  };

  const subtotal = selectedJobs.reduce((s, j) => s + (j.bill_rate || 0), 0);
  const taxAmount = subtotal * ((form.tax_rate || 0) / 100);
  const total = subtotal + taxAmount;
  const fmt = (n) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n || 0);

  const save = async () => {
    setSaving(true);
    const lineItems = JSON.stringify(selectedJobs.map(j => ({
      job_number: j.job_number, description: `${j.service_type || "Delivery"}: ${j.pickup_city} → ${j.delivery_city}`, amount: j.bill_rate || 0
    })));
    await Invoice.create({
      ...form,
      job_ids: selectedJobs.map(j => j.id).join(","),
      line_items: lineItems,
      subtotal,
      tax_amount: taxAmount,
      total_amount: total,
      amount_paid: 0,
      balance_due: total,
      status: "Draft",
    });
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white">
          <h2 className="font-bold text-gray-900">Create Invoice</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Invoice #</label>
              <input className="input" value={form.invoice_number} onChange={e => set("invoice_number", e.target.value)} />
            </div>
            <div>
              <label className="label">Issue Date</label>
              <input className="input" type="date" value={form.issue_date} onChange={e => set("issue_date", e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className="label">Customer</label>
              <select className="input" value={form.customer_id} onChange={e => handleCustomer(e.target.value)}>
                <option value="">Select customer...</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.company_name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Payment Terms</label>
              <select className="input" value={form.payment_terms} onChange={e => set("payment_terms", e.target.value)}>
                {["Net 15","Net 30","Net 45","Due on Receipt","COD"].map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Due Date</label>
              <input className="input" type="date" value={form.due_date} onChange={e => set("due_date", e.target.value)} />
            </div>
          </div>

          {form.customer_id && (
            <div>
              <label className="label">Select Delivered Jobs to Bill</label>
              {availableJobs.length === 0 ? (
                <p className="text-sm text-gray-400 bg-gray-50 rounded-xl p-3">No unbilled delivered jobs for this customer.</p>
              ) : (
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  {availableJobs.map(j => {
                    const checked = !!selectedJobs.find(x => x.id === j.id);
                    return (
                      <label key={j.id} className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50 border-b last:border-0 border-gray-100 ${checked ? "bg-red-50" : ""}`}>
                        <input type="checkbox" checked={checked} onChange={() => toggleJob(j)} className="w-4 h-4 accent-red-600" />
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium text-gray-800">{j.job_number}</span>
                          <span className="text-xs text-gray-500 ml-2">{j.pickup_city} → {j.delivery_city}</span>
                        </div>
                        <span className="text-sm font-semibold text-gray-800">{fmt(j.bill_rate)}</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Tax Rate (%)</label>
              <input className="input" type="number" placeholder="0" value={form.tax_rate} onChange={e => set("tax_rate", e.target.value)} />
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <div className="flex justify-between text-sm mb-1"><span className="text-gray-500">Subtotal</span><span className="font-medium">{fmt(subtotal)}</span></div>
              <div className="flex justify-between text-sm mb-1"><span className="text-gray-500">Tax</span><span className="font-medium">{fmt(taxAmount)}</span></div>
              <div className="flex justify-between text-sm font-bold pt-1 border-t border-gray-200"><span>Total</span><span className="text-red-600">{fmt(total)}</span></div>
            </div>
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea className="input" rows={2} value={form.notes} onChange={e => set("notes", e.target.value)} />
          </div>
        </div>
        <div className="flex gap-2 p-5 border-t border-gray-100">
          <button onClick={onClose} className="flex-1 border border-gray-200 py-2 rounded-xl text-gray-600 hover:bg-gray-50">Cancel</button>
          <button onClick={save} disabled={saving || !form.customer_id} className="flex-1 bg-red-600 text-white py-2 rounded-xl font-semibold hover:bg-red-700 disabled:opacity-50">
            {saving ? "Saving..." : "Create Invoice"}
          </button>
        </div>
      </div>
    </div>
  );
}

function InvoiceView({ invoice, onBack }) {
  const [inv, setInv] = useState({ ...invoice });
  const [saving, setSaving] = useState(false);
  const lineItems = (() => { try { return JSON.parse(inv.line_items || "[]"); } catch { return []; } })();
  const fmt = (n) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n || 0);

  const updateStatus = async (status) => {
    setSaving(true);
    let updates = { status };
    if (status === "Paid") updates = { ...updates, amount_paid: inv.total_amount, balance_due: 0 };
    await Invoice.update(inv.id, updates);
    setInv(i => ({ ...i, ...updates }));
    setSaving(false);
  };

  return (
    <div className="min-h-screen bg-white p-6 max-w-3xl mx-auto">
      <div className="flex justify-between mb-6 print:hidden">
        <button onClick={onBack} className="flex items-center gap-2 text-gray-600 hover:text-gray-900"><ArrowLeft className="w-4 h-4" />Back to Invoices</button>
        <div className="flex gap-2">
          {inv.status !== "Paid" && inv.status !== "Voided" && (
            <button onClick={() => updateStatus("Paid")} disabled={saving} className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-green-700">Mark Paid</button>
          )}
          {inv.status === "Draft" && (
            <button onClick={() => updateStatus("Sent")} disabled={saving} className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-blue-700">Mark Sent</button>
          )}
          <button onClick={() => window.print()} className="bg-red-600 text-white px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-red-700 flex items-center gap-1"><Printer className="w-3.5 h-3.5" />Print</button>
        </div>
      </div>

      <div className="border-2 border-gray-200 rounded-xl overflow-hidden">
        <div className="bg-red-600 text-white p-6 flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-black">MAHONEY EXPRESS, INC.</h1>
            <p className="text-red-200 text-sm">Time-Critical Messenger & Delivery Services</p>
          </div>
          <div className="text-right">
            <p className="text-red-200 text-xs uppercase">Invoice</p>
            <p className="text-2xl font-black">{inv.invoice_number}</p>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full mt-1 inline-block ${STATUS_COLORS[inv.status]}`}>{inv.status}</span>
          </div>
        </div>

        <div className="p-6 grid grid-cols-2 gap-6 border-b border-gray-100">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase mb-1">Bill To</p>
            <p className="font-bold text-gray-800">{inv.customer_name}</p>
          </div>
          <div className="text-right">
            <div className="space-y-1 text-sm">
              <div className="flex justify-between gap-4"><span className="text-gray-500">Issue Date</span><span>{inv.issue_date}</span></div>
              <div className="flex justify-between gap-4"><span className="text-gray-500">Due Date</span><span>{inv.due_date}</span></div>
              <div className="flex justify-between gap-4"><span className="text-gray-500">Terms</span><span>{inv.payment_terms}</span></div>
            </div>
          </div>
        </div>

        <div className="p-6">
          <table className="w-full text-sm mb-6">
            <thead><tr className="border-b-2 border-gray-200">
              <th className="text-left pb-2 font-semibold text-gray-600">Description</th>
              <th className="text-right pb-2 font-semibold text-gray-600">Amount</th>
            </tr></thead>
            <tbody>
              {lineItems.length > 0 ? lineItems.map((li, i) => (
                <tr key={i} className="border-b border-gray-50">
                  <td className="py-2 text-gray-700">{li.description}</td>
                  <td className="py-2 text-right font-medium">{fmt(li.amount)}</td>
                </tr>
              )) : (
                <tr><td colSpan={2} className="py-3 text-center text-gray-400 text-sm">No line items</td></tr>
              )}
            </tbody>
          </table>

          <div className="flex justify-end">
            <div className="w-56 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>{fmt(inv.subtotal)}</span></div>
              {(inv.tax_amount || 0) > 0 && <div className="flex justify-between"><span className="text-gray-500">Tax ({inv.tax_rate}%)</span><span>{fmt(inv.tax_amount)}</span></div>}
              <div className="flex justify-between font-bold text-base border-t pt-2"><span>Total</span><span>{fmt(inv.total_amount)}</span></div>
              {(inv.amount_paid || 0) > 0 && <div className="flex justify-between text-green-600"><span>Paid</span><span>-{fmt(inv.amount_paid)}</span></div>}
              <div className={`flex justify-between font-bold ${(inv.balance_due||0) > 0 ? "text-red-600" : "text-green-600"}`}><span>Balance Due</span><span>{fmt(inv.balance_due)}</span></div>
            </div>
          </div>

          {inv.notes && <div className="mt-6 bg-gray-50 rounded-lg p-4 text-sm text-gray-600">{inv.notes}</div>}
        </div>
      </div>
    </div>
  );
}
