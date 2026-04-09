import { useState, useEffect } from "react";
import { Job, Invoice, Driver, Customer, Expense } from "@/api/entities";
import { 
  Truck, Package, Users, DollarSign, TrendingUp, Clock, 
  AlertCircle, CheckCircle, BarChart2, ArrowUpRight, ArrowDownRight
} from "lucide-react";

export default function Home() {
  const [stats, setStats] = useState({
    totalJobs: 0,
    pendingJobs: 0,
    inTransitJobs: 0,
    deliveredToday: 0,
    activeDrivers: 0,
    openInvoices: 0,
    openInvoiceAmount: 0,
    overdueAmount: 0,
    revenueThisMonth: 0,
    expensesThisMonth: 0,
  });
  const [recentJobs, setRecentJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    setLoading(true);
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

    const [jobs, drivers, invoices, expenses] = await Promise.all([
      Job.list(),
      Driver.list(),
      Invoice.list(),
      Expense.list(),
    ]);

    const pending = jobs.filter(j => j.status === "Pending").length;
    const inTransit = jobs.filter(j => j.status === "In Transit").length;
    const deliveredToday = jobs.filter(j => j.status === "Delivered" && j.updated_date >= todayStart).length;
    const activeDrivers = drivers.filter(d => d.status === "Active").length;

    const openInvoices = invoices.filter(i => ["Sent", "Partial", "Overdue"].includes(i.status));
    const openAmount = openInvoices.reduce((s, i) => s + (i.balance_due || 0), 0);
    const overdueAmount = invoices.filter(i => i.status === "Overdue").reduce((s, i) => s + (i.balance_due || 0), 0);
    const revenueMonth = invoices.filter(i => i.status === "Paid" && i.issue_date >= monthStart).reduce((s, i) => s + (i.total_amount || 0), 0);
    const expensesMonth = expenses.filter(e => e.date >= monthStart).reduce((s, e) => s + (e.amount || 0), 0);

    setStats({
      totalJobs: jobs.length,
      pendingJobs: pending,
      inTransitJobs: inTransit,
      deliveredToday,
      activeDrivers,
      openInvoices: openInvoices.length,
      openInvoiceAmount: openAmount,
      overdueAmount,
      revenueThisMonth: revenueMonth,
      expensesThisMonth: expensesMonth,
    });

    setRecentJobs(jobs.sort((a, b) => new Date(b.created_date) - new Date(a.created_date)).slice(0, 8));
    setLoading(false);
  }

  const statusColor = (s) => {
    const map = { Pending: "bg-yellow-100 text-yellow-800", Assigned: "bg-blue-100 text-blue-800", "In Transit": "bg-purple-100 text-purple-800", Delivered: "bg-green-100 text-green-800", Cancelled: "bg-red-100 text-red-800" };
    return map[s] || "bg-gray-100 text-gray-700";
  };

  const fmt = (n) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n || 0);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500 font-medium">Loading dashboard...</p>
      </div>
    </div>
  );

  const netMargin = stats.revenueThisMonth - stats.expensesThisMonth;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center">
            <Truck className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Mahoney Express, Inc.</h1>
            <p className="text-sm text-gray-500">Time-Critical Messenger & Delivery Services</p>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard icon={<Clock className="w-5 h-5 text-yellow-600" />} label="Pending Jobs" value={stats.pendingJobs} bg="bg-yellow-50" border="border-yellow-200" />
        <StatCard icon={<Truck className="w-5 h-5 text-purple-600" />} label="In Transit" value={stats.inTransitJobs} bg="bg-purple-50" border="border-purple-200" />
        <StatCard icon={<CheckCircle className="w-5 h-5 text-green-600" />} label="Delivered Today" value={stats.deliveredToday} bg="bg-green-50" border="border-green-200" />
        <StatCard icon={<Users className="w-5 h-5 text-blue-600" />} label="Active Drivers" value={stats.activeDrivers} bg="bg-blue-50" border="border-blue-200" />
      </div>

      {/* Finance Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-500">Revenue This Month</span>
            <TrendingUp className="w-4 h-4 text-green-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{fmt(stats.revenueThisMonth)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-500">Expenses This Month</span>
            <ArrowDownRight className="w-4 h-4 text-red-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{fmt(stats.expensesThisMonth)}</p>
        </div>
        <div className={`rounded-2xl border p-5 shadow-sm ${netMargin >= 0 ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-500">Net Margin</span>
            {netMargin >= 0 ? <ArrowUpRight className="w-4 h-4 text-green-600" /> : <ArrowDownRight className="w-4 h-4 text-red-600" />}
          </div>
          <p className={`text-2xl font-bold ${netMargin >= 0 ? "text-green-700" : "text-red-700"}`}>{fmt(netMargin)}</p>
        </div>
      </div>

      {/* AR Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="w-5 h-5 text-blue-500" />
            <span className="font-semibold text-gray-700">Open Invoices</span>
          </div>
          <p className="text-3xl font-bold text-gray-900 mt-2">{fmt(stats.openInvoiceAmount)}</p>
          <p className="text-sm text-gray-500 mt-1">{stats.openInvoices} invoice{stats.openInvoices !== 1 ? "s" : ""} outstanding</p>
        </div>
        <div className="bg-white rounded-2xl border border-red-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <span className="font-semibold text-gray-700">Overdue A/R</span>
          </div>
          <p className="text-3xl font-bold text-red-600 mt-2">{fmt(stats.overdueAmount)}</p>
          <p className="text-sm text-gray-500 mt-1">Requires immediate follow-up</p>
        </div>
      </div>

      {/* Recent Jobs */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">Recent Jobs</h2>
          <span className="text-sm text-gray-400">{stats.totalJobs} total</span>
        </div>
        {recentJobs.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No jobs yet. <a href="/new-job" className="text-red-600 font-medium hover:underline">Create your first job →</a></div>
        ) : (
          <div className="divide-y divide-gray-50">
            {recentJobs.map(job => (
              <div key={job.id} className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-800 text-sm">{job.job_number || job.id.slice(0, 8)}</span>
                    <span className="text-gray-400">·</span>
                    <span className="text-sm text-gray-600 truncate">{job.customer_name || "—"}</span>
                  </div>
                  <p className="text-xs text-gray-400 truncate mt-0.5">{job.pickup_city} → {job.delivery_city}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColor(job.status)}`}>{job.status}</span>
                  <p className="text-xs text-gray-400 mt-1">{job.driver_name || "Unassigned"}</p>
                </div>
                <div className="text-right flex-shrink-0 w-20">
                  <p className="text-sm font-semibold text-gray-800">{fmt(job.bill_rate)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, bg, border }) {
  return (
    <div className={`rounded-2xl border ${bg} ${border} p-5`}>
      <div className="flex items-center gap-2 mb-2">{icon}<span className="text-sm font-medium text-gray-600">{label}</span></div>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
    </div>
  );
}
