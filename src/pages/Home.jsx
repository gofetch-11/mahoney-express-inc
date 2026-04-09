import { useState, useEffect } from "react";
import { Job, Invoice, Driver, Customer, Expense } from "@/api/entities";
import { Truck, Clock, CheckCircle, Users, TrendingUp, TrendingDown, AlertCircle, DollarSign, ArrowUpRight, ArrowDownRight, Package } from "lucide-react";

const fmt = (n) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n || 0);

const STATUS_COLORS = {
  Pending: { bg: "#fff8e1", text: "#b45309", dot: "#f59e0b" },
  Assigned: { bg: "#e8f4ff", text: "#1d4ed8", dot: "#3b82f6" },
  "In Transit": { bg: "#f3e8ff", text: "#7c3aed", dot: "#8b5cf6" },
  Delivered: { bg: "#e6f9ee", text: "#166534", dot: "#0fa14a" },
  Cancelled: { bg: "#fee2e2", text: "#991b1b", dot: "#ef4444" },
};

export default function Home() {
  const [stats, setStats] = useState({ pendingJobs: 0, inTransitJobs: 0, deliveredToday: 0, activeDrivers: 0, openInvoiceAmount: 0, overdueAmount: 0, revenueThisMonth: 0, expensesThisMonth: 0 });
  const [recentJobs, setRecentJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadDashboard(); }, []);

  async function loadDashboard() {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const [jobs, drivers, invoices, expenses] = await Promise.all([Job.list(), Driver.list(), Invoice.list(), Expense.list()]);

    setStats({
      pendingJobs: jobs.filter(j => j.status === "Pending").length,
      inTransitJobs: jobs.filter(j => j.status === "In Transit").length,
      deliveredToday: jobs.filter(j => j.status === "Delivered" && j.updated_date >= todayStart).length,
      activeDrivers: drivers.filter(d => d.status === "Active").length,
      openInvoiceAmount: invoices.filter(i => ["Sent","Partial","Overdue"].includes(i.status)).reduce((s,i) => s+(i.balance_due||0), 0),
      overdueAmount: invoices.filter(i => i.status === "Overdue").reduce((s,i) => s+(i.balance_due||0), 0),
      revenueThisMonth: invoices.filter(i => i.status === "Paid" && i.issue_date >= monthStart).reduce((s,i) => s+(i.total_amount||0), 0),
      expensesThisMonth: expenses.filter(e => e.date >= monthStart).reduce((s,e) => s+(e.amount||0), 0),
    });
    setRecentJobs(jobs.sort((a,b) => new Date(b.created_date)-new Date(a.created_date)).slice(0, 8));
    setLoading(false);
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#f4f4f2" }}>
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: "#0fa14a", borderTopColor: "transparent" }} />
        <p className="text-sm" style={{ color: "#6b6b67", fontFamily: "Source Sans 3, sans-serif" }}>Loading dashboard…</p>
      </div>
    </div>
  );

  const net = stats.revenueThisMonth - stats.expensesThisMonth;

  return (
    <div className="min-h-screen p-6" style={{ background: "#f4f4f2", fontFamily: "Source Sans 3, sans-serif" }}>
      {/* Page Header */}
      <div className="mb-7">
        <div className="flex items-center gap-2 mb-0.5">
          <div className="h-0.5 w-6 rounded-full" style={{ background: "linear-gradient(90deg,#0fa14a,#009549)" }} />
          <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: "#0fa14a", fontFamily: "Barlow, sans-serif" }}>Operations Center</p>
        </div>
        <h1 className="text-2xl font-bold" style={{ color: "#060204", fontFamily: "Barlow, sans-serif", fontWeight: 700 }}>Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"} 👋</h1>
        <p className="text-sm mt-0.5" style={{ color: "#6b6b67" }}>Here's what's happening at Mahoney Express today.</p>
      </div>

      {/* Ops Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Pending Jobs", value: stats.pendingJobs, icon: Clock, color: "#f59e0b", bg: "#fff8e1" },
          { label: "In Transit", value: stats.inTransitJobs, icon: Truck, color: "#8b5cf6", bg: "#f3e8ff" },
          { label: "Delivered Today", value: stats.deliveredToday, icon: CheckCircle, color: "#0fa14a", bg: "#e6f9ee" },
          { label: "Active Drivers", value: stats.activeDrivers, icon: Users, color: "#3b82f6", bg: "#e8f4ff" },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="rounded-2xl p-5 border" style={{ background: "#fff", borderColor: "rgba(0,0,0,0.08)", boxShadow: "0 1px 8px rgba(0,0,0,0.04)" }}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#6b6b67", fontFamily: "Barlow, sans-serif" }}>{s.label}</span>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: s.bg }}>
                  <Icon className="w-4 h-4" style={{ color: s.color }} />
                </div>
              </div>
              <p className="text-3xl font-bold" style={{ color: "#060204", fontFamily: "Barlow, sans-serif" }}>{s.value}</p>
            </div>
          );
        })}
      </div>

      {/* Finance Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <FinCard label="Revenue This Month" value={fmt(stats.revenueThisMonth)} icon={<TrendingUp className="w-4 h-4" style={{ color: "#0fa14a" }} />} accent="#0fa14a" />
        <FinCard label="Expenses This Month" value={fmt(stats.expensesThisMonth)} icon={<TrendingDown className="w-4 h-4" style={{ color: "#ef4444" }} />} accent="#ef4444" />
        <div className="rounded-2xl p-5 border" style={{ background: net >= 0 ? "#e6f9ee" : "#fee2e2", borderColor: net >= 0 ? "rgba(15,161,74,0.25)" : "rgba(239,68,68,0.25)", boxShadow: "0 1px 8px rgba(0,0,0,0.04)" }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#6b6b67", fontFamily: "Barlow, sans-serif" }}>Net Margin</span>
            {net >= 0 ? <ArrowUpRight className="w-4 h-4" style={{ color: "#0fa14a" }} /> : <ArrowDownRight className="w-4 h-4" style={{ color: "#ef4444" }} />}
          </div>
          <p className="text-2xl font-bold" style={{ color: net >= 0 ? "#0fa14a" : "#ef4444", fontFamily: "Barlow, sans-serif" }}>{fmt(net)}</p>
        </div>
      </div>

      {/* AR Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="rounded-2xl p-5 border" style={{ background: "#fff", borderColor: "rgba(0,0,0,0.08)", boxShadow: "0 1px 8px rgba(0,0,0,0.04)" }}>
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="w-4 h-4" style={{ color: "#0fa14a" }} />
            <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#6b6b67", fontFamily: "Barlow, sans-serif" }}>Open Invoices</span>
          </div>
          <p className="text-2xl font-bold mt-2" style={{ color: "#060204", fontFamily: "Barlow, sans-serif" }}>{fmt(stats.openInvoiceAmount)}</p>
        </div>
        <div className="rounded-2xl p-5 border" style={{ background: "#fff", borderColor: "rgba(239,68,68,0.2)", boxShadow: "0 1px 8px rgba(0,0,0,0.04)" }}>
          <div className="flex items-center gap-2 mb-1">
            <AlertCircle className="w-4 h-4" style={{ color: "#ef4444" }} />
            <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#6b6b67", fontFamily: "Barlow, sans-serif" }}>Overdue A/R</span>
          </div>
          <p className="text-2xl font-bold mt-2" style={{ color: "#ef4444", fontFamily: "Barlow, sans-serif" }}>{fmt(stats.overdueAmount)}</p>
        </div>
      </div>

      {/* Recent Jobs */}
      <div className="rounded-2xl border overflow-hidden" style={{ background: "#fff", borderColor: "rgba(0,0,0,0.08)", boxShadow: "0 1px 8px rgba(0,0,0,0.04)" }}>
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
          <h2 className="font-bold text-base" style={{ color: "#060204", fontFamily: "Barlow, sans-serif" }}>Recent Jobs</h2>
          <a href="/jobs" className="text-xs font-semibold" style={{ color: "#0fa14a", fontFamily: "Barlow, sans-serif" }}>View all →</a>
        </div>

        {recentJobs.length === 0 ? (
          <div className="py-12 text-center">
            <Package className="w-8 h-8 mx-auto mb-2" style={{ color: "#b0b2b7" }} />
            <p className="text-sm" style={{ color: "#6b6b67" }}>No jobs yet. <a href="/new-job" style={{ color: "#0fa14a" }} className="font-semibold">Create your first →</a></p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: "rgba(0,0,0,0.05)" }}>
            {recentJobs.map(job => {
              const sc = STATUS_COLORS[job.status] || STATUS_COLORS.Pending;
              return (
                <div key={job.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm" style={{ color: "#060204", fontFamily: "Barlow, sans-serif" }}>{job.job_number || job.id.slice(0,8)}</span>
                      <span style={{ color: "#b0b2b7" }}>·</span>
                      <span className="text-sm truncate" style={{ color: "#6b6b67" }}>{job.customer_name || "—"}</span>
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: "#b0b2b7" }}>{job.pickup_city || "?"} → {job.delivery_city || "?"}</p>
                  </div>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: sc.bg, color: sc.text }}>
                    {job.status}
                  </span>
                  <div className="text-right flex-shrink-0 w-20">
                    <p className="text-sm font-bold" style={{ color: "#060204", fontFamily: "Barlow, sans-serif" }}>{fmt(job.bill_rate)}</p>
                    <p className="text-xs" style={{ color: "#b0b2b7" }}>{job.driver_name || "Unassigned"}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function FinCard({ label, value, icon, accent }) {
  return (
    <div className="rounded-2xl p-5 border" style={{ background: "#fff", borderColor: "rgba(0,0,0,0.08)", boxShadow: "0 1px 8px rgba(0,0,0,0.04)" }}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#6b6b67", fontFamily: "Barlow, sans-serif" }}>{label}</span>
        {icon}
      </div>
      <p className="text-2xl font-bold" style={{ color: "#060204", fontFamily: "Barlow, sans-serif" }}>{value}</p>
    </div>
  );
}
