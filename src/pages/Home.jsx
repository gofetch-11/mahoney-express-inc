import { useState, useEffect } from "react";
import { Job, Invoice, Driver, Customer, Expense } from "@/api/entities";
import { Clock, Truck, CheckCircle, Users, TrendingUp, TrendingDown, AlertCircle, DollarSign, ArrowUpRight, ArrowDownRight, Package } from "lucide-react";

const GREEN = "#0fa14a";
const BLACK = "#060204";
const BG = "#f4f4f2";
const HEADER_IMG = "https://media.base44.com/images/public/69cb07fb94b4627f0bd76151/453e67330_MahoneyExpressInc-ImageAsset1.jpg";
const SHAMROCK = "https://media.base44.com/images/public/69cb07fb94b4627f0bd76151/828dbca4e_Shamrock.png";

const fmt = (n) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n || 0);

const STATUS_COLORS = {
  Pending:     { bg: "#fff8e1", text: "#b45309" },
  Assigned:    { bg: "#e8f4ff", text: "#1d4ed8" },
  "In Transit":{ bg: "#f3e8ff", text: "#7c3aed" },
  Delivered:   { bg: "#e6f9ee", text: "#166534" },
  Cancelled:   { bg: "#fee2e2", text: "#991b1b" },
};

export default function Home() {
  const [stats, setStats] = useState({
    pendingJobs: 0, inTransitJobs: 0, deliveredToday: 0, activeDrivers: 0,
    openInvoiceAmount: 0, overdueAmount: 0, revenueThisMonth: 0, expensesThisMonth: 0,
    totalJobs: 0,
  });
  const [recentJobs, setRecentJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadDashboard(); }, []);

  async function loadDashboard() {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const [jobs, drivers, invoices, expenses] = await Promise.all([
      Job.list(), Driver.list(), Invoice.list(), Expense.list()
    ]);
    setStats({
      pendingJobs: jobs.filter(j => j.status === "Pending").length,
      inTransitJobs: jobs.filter(j => j.status === "In Transit").length,
      deliveredToday: jobs.filter(j => j.status === "Delivered" && j.updated_date >= todayStart).length,
      activeDrivers: drivers.filter(d => d.status === "Active").length,
      openInvoiceAmount: invoices.filter(i => ["Sent","Partial","Overdue"].includes(i.status)).reduce((s,i) => s+(i.balance_due||0), 0),
      overdueAmount: invoices.filter(i => i.status === "Overdue").reduce((s,i) => s+(i.balance_due||0), 0),
      revenueThisMonth: invoices.filter(i => i.status === "Paid" && i.issue_date >= monthStart).reduce((s,i) => s+(i.total_amount||0), 0),
      expensesThisMonth: expenses.filter(e => e.date >= monthStart).reduce((s,e) => s+(e.amount||0), 0),
      totalJobs: jobs.length,
    });
    setRecentJobs(jobs.sort((a,b) => new Date(b.created_date)-new Date(a.created_date)).slice(0, 8));
    setLoading(false);
  }

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: BG }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
        <img src={SHAMROCK} alt="" style={{ width: 48, height: 48, animation: "spin 1.5s linear infinite" }} />
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        <p style={{ color: "#6b6b67", fontSize: 13, fontFamily: "Source Sans 3, sans-serif" }}>Loading dashboard…</p>
      </div>
    </div>
  );

  const net = stats.revenueThisMonth - stats.expensesThisMonth;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div style={{ minHeight: "100vh", background: BG, fontFamily: "Source Sans 3, sans-serif" }}>

      {/* Hero Banner */}
      <div style={{
        position: "relative",
        background: BLACK,
        overflow: "hidden",
        padding: "28px 32px",
        marginBottom: 0,
      }}>
        {/* Background city image */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: `url(${HEADER_IMG})`,
          backgroundSize: "cover",
          backgroundPosition: "center 40%",
          opacity: 0.18,
        }} />
        {/* Green strip at bottom */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg,#0fa14a,#009549)" }} />

        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <img src={SHAMROCK} alt="" style={{ width: 28, height: 28 }} />
            <p style={{ color: "#0fa14a", fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: "Barlow, sans-serif", margin: 0 }}>Operations Center</p>
          </div>
          <h1 style={{ color: "#fff", fontFamily: "Barlow, sans-serif", fontSize: 26, fontWeight: 800, margin: 0, letterSpacing: "0.01em" }}>{greeting} 👋</h1>
          <p style={{ color: "#b0b2b7", fontSize: 13, margin: "4px 0 0", fontStyle: "italic" }}>When tomorrow's too late — here's today at a glance.</p>
        </div>
      </div>

      <div style={{ padding: "24px 28px" }}>
        {/* Ops Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 20 }}>
          {[
            { label: "Pending Jobs",   value: stats.pendingJobs,    icon: Clock,        color: "#f59e0b", bg: "#fff8e1" },
            { label: "In Transit",     value: stats.inTransitJobs,  icon: Truck,        color: "#8b5cf6", bg: "#f3e8ff" },
            { label: "Delivered Today",value: stats.deliveredToday, icon: CheckCircle,  color: GREEN,     bg: "#e6f9ee" },
            { label: "Active Drivers", value: stats.activeDrivers,  icon: Users,        color: "#3b82f6", bg: "#e8f4ff" },
          ].map(s => {
            const Icon = s.icon;
            return (
              <div key={s.label} style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 16, padding: "18px 20px", boxShadow: "0 1px 6px rgba(0,0,0,0.04)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "#6b6b67", fontFamily: "Barlow, sans-serif" }}>{s.label}</span>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon size={16} style={{ color: s.color }} />
                  </div>
                </div>
                <p style={{ fontSize: 34, fontWeight: 800, color: BLACK, margin: 0, fontFamily: "Barlow, sans-serif", lineHeight: 1 }}>{s.value}</p>
              </div>
            );
          })}
        </div>

        {/* Finance Row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 20 }}>
          {[
            { label: "Revenue This Month",   value: fmt(stats.revenueThisMonth),   color: GREEN,      icon: <TrendingUp size={16} style={{ color: GREEN }} /> },
            { label: "Expenses This Month",  value: fmt(stats.expensesThisMonth),  color: "#ef4444",  icon: <TrendingDown size={16} style={{ color: "#ef4444" }} /> },
          ].map(c => (
            <div key={c.label} style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 16, padding: "18px 20px", boxShadow: "0 1px 6px rgba(0,0,0,0.04)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "#6b6b67", fontFamily: "Barlow, sans-serif" }}>{c.label}</span>
                {c.icon}
              </div>
              <p style={{ fontSize: 24, fontWeight: 800, color: BLACK, margin: 0, fontFamily: "Barlow, sans-serif" }}>{c.value}</p>
            </div>
          ))}
          <div style={{
            borderRadius: 16, padding: "18px 20px",
            background: net >= 0 ? "#e6f9ee" : "#fee2e2",
            border: `1px solid ${net >= 0 ? "rgba(15,161,74,0.25)" : "rgba(239,68,68,0.25)"}`,
            boxShadow: "0 1px 6px rgba(0,0,0,0.04)",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "#6b6b67", fontFamily: "Barlow, sans-serif" }}>Net Margin</span>
              {net >= 0 ? <ArrowUpRight size={16} style={{ color: GREEN }} /> : <ArrowDownRight size={16} style={{ color: "#ef4444" }} />}
            </div>
            <p style={{ fontSize: 24, fontWeight: 800, margin: 0, fontFamily: "Barlow, sans-serif", color: net >= 0 ? GREEN : "#ef4444" }}>{fmt(net)}</p>
          </div>
        </div>

        {/* AR Row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
          <div style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 16, padding: "18px 20px", boxShadow: "0 1px 6px rgba(0,0,0,0.04)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <DollarSign size={16} style={{ color: GREEN }} />
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "#6b6b67", fontFamily: "Barlow, sans-serif" }}>Open Invoices</span>
            </div>
            <p style={{ fontSize: 26, fontWeight: 800, color: BLACK, margin: 0, fontFamily: "Barlow, sans-serif" }}>{fmt(stats.openInvoiceAmount)}</p>
          </div>
          <div style={{ background: "#fff", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 16, padding: "18px 20px", boxShadow: "0 1px 6px rgba(0,0,0,0.04)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <AlertCircle size={16} style={{ color: "#ef4444" }} />
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "#6b6b67", fontFamily: "Barlow, sans-serif" }}>Overdue A/R</span>
            </div>
            <p style={{ fontSize: 26, fontWeight: 800, color: "#ef4444", margin: 0, fontFamily: "Barlow, sans-serif" }}>{fmt(stats.overdueAmount)}</p>
          </div>
        </div>

        {/* Recent Jobs */}
        <div style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 16, boxShadow: "0 1px 6px rgba(0,0,0,0.04)", overflow: "hidden" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Package size={16} style={{ color: GREEN }} />
              <h2 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: BLACK, fontFamily: "Barlow, sans-serif" }}>Recent Jobs</h2>
            </div>
            <a href="/jobs" style={{ fontSize: 12, fontWeight: 700, color: GREEN, textDecoration: "none", fontFamily: "Barlow, sans-serif" }}>View all {stats.totalJobs} →</a>
          </div>

          {recentJobs.length === 0 ? (
            <div style={{ padding: 48, textAlign: "center" }}>
              <img src={SHAMROCK} alt="" style={{ width: 40, height: 40, opacity: 0.2, marginBottom: 10 }} />
              <p style={{ color: "#b0b2b7", margin: 0 }}>No jobs yet. <a href="/new-job" style={{ color: GREEN, fontWeight: 600 }}>Create your first →</a></p>
            </div>
          ) : recentJobs.map((job, i) => {
            const sc = STATUS_COLORS[job.status] || STATUS_COLORS.Pending;
            return (
              <div key={job.id} style={{
                display: "flex", alignItems: "center", gap: 16,
                padding: "12px 20px",
                borderBottom: i < recentJobs.length - 1 ? "1px solid rgba(0,0,0,0.04)" : "none",
                background: i % 2 === 0 ? "#fff" : "#fafafa",
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: GREEN, fontFamily: "Barlow, sans-serif" }}>{job.job_number || job.id.slice(0,8)}</span>
                    <span style={{ color: "#d1d5db" }}>·</span>
                    <span style={{ fontSize: 13, color: BLACK, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{job.customer_name || "—"}</span>
                  </div>
                  <p style={{ fontSize: 11, color: "#b0b2b7", margin: "2px 0 0" }}>{job.pickup_city || "?"} → {job.delivery_city || "?"}</p>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 10px", borderRadius: 20, background: sc.bg, color: sc.text, whiteSpace: "nowrap", flexShrink: 0 }}>{job.status}</span>
                <div style={{ textAlign: "right", flexShrink: 0, minWidth: 80 }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: BLACK, margin: 0, fontFamily: "Barlow, sans-serif" }}>{fmt(job.bill_rate)}</p>
                  <p style={{ fontSize: 11, color: "#b0b2b7", margin: "1px 0 0" }}>{job.driver_name || "Unassigned"}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
