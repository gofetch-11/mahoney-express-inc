import { useState, useEffect } from "react";
import { Invoice, Expense, Job } from "@/api/entities";
import { Plus, TrendingUp, TrendingDown, DollarSign, BarChart2 } from "lucide-react";

const EXPENSE_CATEGORIES = ["Fuel", "Vehicle Maintenance", "Insurance", "Office Supplies", "Payroll", "Software", "Tolls", "Parking", "Equipment", "Other"];

export default function Finances() {
  const [invoices, setInvoices] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("overview");
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const [invs, exps, js] = await Promise.all([Invoice.list(), Expense.list(), Job.list()]);
    setInvoices(invs);
    setExpenses(exps);
    setJobs(js);
    setLoading(false);
  }

  const fmt = (n) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n || 0);

  // Monthly breakdown
  const months = Array.from({ length: 12 }, (_, i) => {
    const mo = String(i + 1).padStart(2, "0");
    const prefix = `${selectedYear}-${mo}`;
    const revenue = invoices.filter(inv => inv.status === "Paid" && inv.issue_date?.startsWith(prefix)).reduce((s, i) => s + (i.total_amount || 0), 0);
    const expTotal = expenses.filter(e => e.date?.startsWith(prefix)).reduce((s, e) => s + (e.amount || 0), 0);
    const jobRevenue = jobs.filter(j => j.status === "Delivered" && j.updated_date?.startsWith(prefix)).reduce((s, j) => s + (j.bill_rate || 0), 0);
    return { month: new Date(selectedYear, i, 1).toLocaleString("default", { month: "short" }), revenue: revenue || jobRevenue, expenses: expTotal, profit: (revenue || jobRevenue) - expTotal };
  });

  const ytdRevenue = months.reduce((s, m) => s + m.revenue, 0);
  const ytdExpenses = months.reduce((s, m) => s + m.expenses, 0);
  const ytdProfit = ytdRevenue - ytdExpenses;

  // Expense breakdown by category
  const expByCategory = EXPENSE_CATEGORIES.map(cat => ({
    cat,
    total: expenses.filter(e => e.category === cat).reduce((s, e) => s + (e.amount || 0), 0),
  })).filter(x => x.total > 0).sort((a, b) => b.total - a.total);

  const totalExpenses = expenses.reduce((s, e) => s + (e.amount || 0), 0);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Finances</h1>
          <p className="text-sm text-gray-500">P&L, expenses, and financial overview</p>
        </div>
        <div className="flex gap-2">
          <select className="input w-28 text-sm" value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))}>
            {[2024, 2025, 2026].map(y => <option key={y}>{y}</option>)}
          </select>
          <button onClick={() => setShowExpenseForm(true)} className="bg-red-600 text-white px-4 py-2 rounded-xl font-semibold hover:bg-red-700 flex items-center gap-2 text-sm">
            <Plus className="w-4 h-4" />Add Expense
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {["overview", "expenses"].map(t => (
          <button key={t} onClick={() => setView(t)} className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-colors ${view === t ? "bg-red-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}>{t}</button>
        ))}
      </div>

      {view === "overview" && (
        <>
          {/* YTD Summary */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-2"><TrendingUp className="w-4 h-4 text-green-500" /><span className="text-sm text-gray-500">YTD Revenue</span></div>
              <p className="text-2xl font-bold text-gray-900">{fmt(ytdRevenue)}</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-2"><TrendingDown className="w-4 h-4 text-red-500" /><span className="text-sm text-gray-500">YTD Expenses</span></div>
              <p className="text-2xl font-bold text-gray-900">{fmt(ytdExpenses)}</p>
            </div>
            <div className={`rounded-2xl border p-5 shadow-sm ${ytdProfit >= 0 ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
              <div className="flex items-center gap-2 mb-2"><DollarSign className="w-4 h-4 text-gray-500" /><span className="text-sm text-gray-500">YTD Net Profit</span></div>
              <p className={`text-2xl font-bold ${ytdProfit >= 0 ? "text-green-700" : "text-red-700"}`}>{fmt(ytdProfit)}</p>
            </div>
          </div>

          {/* Monthly Chart (bar-style) */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 mb-6">
            <h2 className="font-semibold text-gray-700 mb-4">Monthly P&L — {selectedYear}</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-2 font-semibold text-gray-500">Month</th>
                    <th className="text-right py-2 font-semibold text-gray-500">Revenue</th>
                    <th className="text-right py-2 font-semibold text-gray-500">Expenses</th>
                    <th className="text-right py-2 font-semibold text-gray-500">Net</th>
                    <th className="py-2 w-32"></th>
                  </tr>
                </thead>
                <tbody>
                  {months.map((m, i) => {
                    const maxVal = Math.max(...months.map(x => Math.max(x.revenue, x.expenses)), 1);
                    return (
                      <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="py-2 font-medium text-gray-700">{m.month}</td>
                        <td className="py-2 text-right text-green-600">{m.revenue > 0 ? fmt(m.revenue) : "—"}</td>
                        <td className="py-2 text-right text-red-500">{m.expenses > 0 ? fmt(m.expenses) : "—"}</td>
                        <td className={`py-2 text-right font-semibold ${m.profit >= 0 ? "text-green-600" : "text-red-600"}`}>
                          {m.revenue > 0 || m.expenses > 0 ? fmt(m.profit) : "—"}
                        </td>
                        <td className="py-2 pl-3">
                          {m.revenue > 0 && (
                            <div className="flex gap-0.5 items-end h-5">
                              <div className="bg-green-400 rounded-sm w-3" style={{ height: `${(m.revenue / maxVal * 100)}%`, minHeight: 2 }} />
                              <div className="bg-red-400 rounded-sm w-3" style={{ height: `${(m.expenses / maxVal * 100)}%`, minHeight: m.expenses > 0 ? 2 : 0 }} />
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {view === "expenses" && (
        <>
          {/* Expense Category Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="md:col-span-1 bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
              <h2 className="font-semibold text-gray-700 mb-4">By Category</h2>
              {expByCategory.length === 0 ? <p className="text-sm text-gray-400">No expenses recorded.</p> : (
                <div className="space-y-3">
                  {expByCategory.map(ec => (
                    <div key={ec.cat}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">{ec.cat}</span>
                        <span className="font-semibold">{fmt(ec.total)}</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-red-500 rounded-full" style={{ width: `${totalExpenses > 0 ? (ec.total / totalExpenses * 100) : 0}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="md:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                <h2 className="font-semibold text-gray-700">Recent Expenses</h2>
                <span className="text-sm text-gray-400">{fmt(totalExpenses)} total</span>
              </div>
              {expenses.length === 0 ? (
                <div className="p-8 text-center text-gray-400 text-sm">
                  No expenses yet.<br />
                  <button onClick={() => setShowExpenseForm(true)} className="mt-2 text-red-600 hover:underline">Add your first expense →</button>
                </div>
              ) : (
                <div className="max-h-96 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="text-left px-4 py-2 font-semibold text-gray-500">Date</th>
                        <th className="text-left px-4 py-2 font-semibold text-gray-500">Category</th>
                        <th className="text-left px-4 py-2 font-semibold text-gray-500">Description</th>
                        <th className="text-right px-4 py-2 font-semibold text-gray-500">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {expenses.sort((a, b) => new Date(b.date) - new Date(a.date)).map(e => (
                        <tr key={e.id} className="hover:bg-gray-50">
                          <td className="px-4 py-2 text-gray-500">{e.date}</td>
                          <td className="px-4 py-2">
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{e.category}</span>
                          </td>
                          <td className="px-4 py-2 text-gray-700">{e.description}</td>
                          <td className="px-4 py-2 text-right font-semibold text-red-600">{fmt(e.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {showExpenseForm && <ExpenseForm onClose={() => { setShowExpenseForm(false); loadData(); }} />}
    </div>
  );
}

function ExpenseForm({ onClose }) {
  const [form, setForm] = useState({
    date: new Date().toISOString().split("T")[0],
    category: "Fuel",
    description: "",
    amount: "",
    vendor: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const save = async () => {
    setSaving(true);
    await Expense.create({ ...form, amount: parseFloat(form.amount) || 0 });
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">Add Expense</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Date</label>
              <input className="input" type="date" value={form.date} onChange={e => set("date", e.target.value)} />
            </div>
            <div>
              <label className="label">Amount ($)</label>
              <input className="input" type="number" placeholder="0.00" value={form.amount} onChange={e => set("amount", e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className="label">Category</label>
              <select className="input" value={form.category} onChange={e => set("category", e.target.value)}>
                {EXPENSE_CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="label">Description</label>
              <input className="input" value={form.description} onChange={e => set("description", e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className="label">Vendor</label>
              <input className="input" value={form.vendor} onChange={e => set("vendor", e.target.value)} />
            </div>
          </div>
        </div>
        <div className="flex gap-2 p-5 border-t border-gray-100">
          <button onClick={onClose} className="flex-1 border border-gray-200 py-2 rounded-xl text-gray-600 hover:bg-gray-50">Cancel</button>
          <button onClick={save} disabled={saving || !form.amount} className="flex-1 bg-red-600 text-white py-2 rounded-xl font-semibold hover:bg-red-700 disabled:opacity-50">
            {saving ? "Saving..." : "Add Expense"}
          </button>
        </div>
      </div>
    </div>
  );
}
