import { useState, useEffect } from "react";
import { Customer, Job, Invoice } from "@/api/entities";
import { Plus, Building2, Phone, Mail, MapPin } from "lucide-react";

const PAYMENT_TERMS = ["Net 15", "Net 30", "Net 45", "Due on Receipt", "COD"];

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [custStats, setCustStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editCustomer, setEditCustomer] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const [custs, jobs, invs] = await Promise.all([Customer.list(), Job.list(), Invoice.list()]);
    const stats = {};
    custs.forEach(c => {
      const myJobs = jobs.filter(j => j.customer_id === c.id);
      const myInvs = invs.filter(i => i.customer_id === c.id);
      stats[c.id] = {
        totalJobs: myJobs.length,
        totalBilled: myJobs.reduce((s, j) => s + (j.bill_rate || 0), 0),
        openBalance: myInvs.filter(i => ["Sent", "Partial", "Overdue"].includes(i.status)).reduce((s, i) => s + (i.balance_due || 0), 0),
      };
    });
    setCustomers(custs.sort((a, b) => a.company_name?.localeCompare(b.company_name)));
    setCustStats(stats);
    setLoading(false);
  }

  const fmt = (n) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n || 0);
  const filtered = customers.filter(c => c.company_name?.toLowerCase().includes(search.toLowerCase()) || c.contact_name?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Customers</h1>
          <p className="text-sm text-gray-500">{customers.filter(c => c.status === "Active").length} active accounts</p>
        </div>
        <button onClick={() => { setEditCustomer(null); setShowForm(true); }} className="bg-red-600 text-white px-4 py-2 rounded-xl font-semibold hover:bg-red-700 transition-colors flex items-center gap-2 text-sm">
          <Plus className="w-4 h-4" />Add Customer
        </button>
      </div>

      <div className="relative mb-4">
        <input className="w-full pl-4 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500" placeholder="Search customers..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Building2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>No customers yet.</p>
          <button onClick={() => setShowForm(true)} className="mt-3 text-red-600 font-medium hover:underline">Add your first customer →</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(c => {
            const s = custStats[c.id] || {};
            return (
              <div key={c.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-bold text-gray-900">{c.company_name}</p>
                    {c.contact_name && <p className="text-sm text-gray-500">{c.contact_name}</p>}
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full mt-1 inline-block ${c.status === "Active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>{c.status}</span>
                  </div>
                  <button onClick={() => { setEditCustomer(c); setShowForm(true); }} className="text-xs text-blue-600 hover:underline">Edit</button>
                </div>

                <div className="space-y-1.5 mb-4">
                  {c.phone && <div className="flex items-center gap-2 text-sm text-gray-500"><Phone className="w-3.5 h-3.5" />{c.phone}</div>}
                  {c.email && <div className="flex items-center gap-2 text-sm text-gray-500"><Mail className="w-3.5 h-3.5" />{c.email}</div>}
                  {c.billing_address && <div className="flex items-center gap-2 text-sm text-gray-500"><MapPin className="w-3.5 h-3.5" />{c.billing_address}, {c.city} {c.state}</div>}
                  <p className="text-xs text-gray-400">Terms: {c.payment_terms || "Net 30"} · Acct: {c.account_number || "—"}</p>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-3 border-t border-gray-100">
                  <div className="text-center">
                    <p className="text-lg font-bold text-gray-800">{s.totalJobs || 0}</p>
                    <p className="text-xs text-gray-400">Jobs</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-gray-800">{fmt(s.totalBilled)}</p>
                    <p className="text-xs text-gray-400">Lifetime</p>
                  </div>
                  <div className="text-center">
                    <p className={`text-sm font-bold ${(s.openBalance || 0) > 0 ? "text-red-600" : "text-green-600"}`}>{fmt(s.openBalance)}</p>
                    <p className="text-xs text-gray-400">Open A/R</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && <CustomerForm customer={editCustomer} onClose={() => { setShowForm(false); loadData(); }} />}
    </div>
  );
}

function CustomerForm({ customer, onClose }) {
  const blank = { company_name: "", contact_name: "", email: "", phone: "", billing_address: "", city: "", state: "IL", zip: "", account_number: "", payment_terms: "Net 30", status: "Active", notes: "" };
  const [form, setForm] = useState(customer ? { ...customer } : blank);
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const save = async () => {
    setSaving(true);
    if (customer) await Customer.update(customer.id, form);
    else await Customer.create(form);
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white">
          <h2 className="font-bold text-gray-900">{customer ? "Edit Customer" : "Add Customer"}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Company Name *</label>
              <input className="input" value={form.company_name} onChange={e => set("company_name", e.target.value)} />
            </div>
            <div>
              <label className="label">Contact Name</label>
              <input className="input" value={form.contact_name} onChange={e => set("contact_name", e.target.value)} />
            </div>
            <div>
              <label className="label">Account #</label>
              <input className="input" value={form.account_number} onChange={e => set("account_number", e.target.value)} />
            </div>
            <div>
              <label className="label">Phone</label>
              <input className="input" value={form.phone} onChange={e => set("phone", e.target.value)} />
            </div>
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" value={form.email} onChange={e => set("email", e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className="label">Billing Address</label>
              <input className="input" value={form.billing_address} onChange={e => set("billing_address", e.target.value)} />
            </div>
            <div>
              <label className="label">City</label>
              <input className="input" value={form.city} onChange={e => set("city", e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="label">State</label>
                <input className="input" maxLength={2} value={form.state} onChange={e => set("state", e.target.value.toUpperCase())} />
              </div>
              <div>
                <label className="label">ZIP</label>
                <input className="input" value={form.zip} onChange={e => set("zip", e.target.value)} />
              </div>
            </div>
            <div>
              <label className="label">Payment Terms</label>
              <select className="input" value={form.payment_terms} onChange={e => set("payment_terms", e.target.value)}>
                {PAYMENT_TERMS.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Status</label>
              <select className="input" value={form.status} onChange={e => set("status", e.target.value)}>
                <option>Active</option><option>Inactive</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="label">Notes</label>
              <textarea className="input" rows={2} value={form.notes} onChange={e => set("notes", e.target.value)} />
            </div>
          </div>
        </div>
        <div className="flex gap-2 p-5 border-t border-gray-100">
          <button onClick={onClose} className="flex-1 border border-gray-200 py-2 rounded-xl text-gray-600 hover:bg-gray-50">Cancel</button>
          <button onClick={save} disabled={saving || !form.company_name} className="flex-1 bg-red-600 text-white py-2 rounded-xl font-semibold hover:bg-red-700 disabled:opacity-50">
            {saving ? "Saving..." : customer ? "Save Changes" : "Add Customer"}
          </button>
        </div>
      </div>
    </div>
  );
}
