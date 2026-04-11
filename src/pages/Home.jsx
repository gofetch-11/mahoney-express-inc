import { useState, useEffect } from "react";
import { Job, Invoice, Driver, Customer, Expense } from "@/api/entities";
import { Clock, Truck, CheckCircle, Users, TrendingUp, TrendingDown, AlertCircle, DollarSign, ArrowUpRight, ArrowDownRight, Package, MapPin } from "lucide-react";
import MapView from "../components/MapView";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, CartesianGrid } from "recharts";

const GREEN = "#0fa14a";
const BG = "#0e1012";
const SURFACE = "#161a1d";
const SURFACE2 = "#1e2328";
const BORDER = "rgba(255,255,255,0.07)";
const TEXT = "#f0f0ee";
const MUTED = "#8a8a85";
const HEADER_IMG = "https://media.base44.com/images/public/69cb07fb94b4627f0bd76151/453e67330_MahoneyExpressInc-ImageAsset1.jpg";
const LOGO_HEADER = "https://media.base44.com/images/public/69cb07fb94b4627f0bd76151/a863be72e_MahoneyExpressInc-Header.png";
const SHAMROCK = "https://media.base44.com/images/public/69cb07fb94b4627f0bd76151/828dbca4e_Shamrock.png";

const fmt = (n) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n || 0);

const STATUS_COLORS = {
  Pending:      { bg: "rgba(245,158,11,0.15)",  text: "#fbbf24" },
  Assigned:     { bg: "rgba(59,130,246,0.15)",   text: "#60a5fa" },
  "In Transit": { bg: "rgba(139,92,246,0.15)",   text: "#a78bfa" },
  Delivered:    { bg: "rgba(15,161,74,0.15)",    text: "#4ade80" },
  Cancelled:    { bg: "rgba(239,68,68,0.15)",    text: "#f87171" },
};

export default function Home() {
  const [stats, setStats] = useState({ pendingJobs:0, inTransitJobs:0, deliveredToday:0, activeDrivers:0, openInvoiceAmount:0, overdueAmount:0, revenueThisMonth:0, expensesThisMonth:0, totalJobs:0 });
  const [revenueData, setRevenueData] = useState([]);
  const [jobStatusData, setJobStatusData] = useState([]);
  const [driverData, setDriverData] = useState([]);
  const [recentJobs, setRecentJobs] = useState([]);
  const [inTransitJobs, setInTransitJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadDashboard(); }, []);

  async function loadDashboard() {
    try {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const [jobs, drivers, invoices, expenses] = await Promise.all([Job.list(), Driver.list(), Invoice.list(), Expense.list()]);
      setStats({
        pendingJobs: jobs.filter(j=>j.status==="Pending").length,
        inTransitJobs: jobs.filter(j=>j.status==="In Transit").length,
        deliveredToday: jobs.filter(j=>j.status==="Delivered"&&j.updated_date>=todayStart).length,
        activeDrivers: drivers.filter(d=>d.status==="Active").length,
        openInvoiceAmount: invoices.filter(i=>["Sent","Partial","Overdue"].includes(i.status)).reduce((s,i)=>s+(i.balance_due||0),0),
        overdueAmount: invoices.filter(i=>i.status==="Overdue").reduce((s,i)=>s+(i.balance_due||0),0),
        revenueThisMonth: invoices.filter(i=>i.status==="Paid"&&i.issue_date>=monthStart).reduce((s,i)=>s+(i.total_amount||0),0),
        expensesThisMonth: expenses.filter(e=>e.date>=monthStart).reduce((s,e)=>s+(e.amount||0),0),
        totalJobs: jobs.length,
      });
      setRecentJobs(jobs.sort((a,b)=>new Date(b.created_date)-new Date(a.created_date)).slice(0,8));
      setInTransitJobs(jobs.filter(j => j.status === "In Transit"));

      // Revenue per month (last 6 months)
      const monthLabels = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const prefix = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
        const label = d.toLocaleString('default', { month: 'short' });
        const rev = invoices.filter(inv => inv.status === 'Paid' && inv.issue_date?.startsWith(prefix)).reduce((s,i) => s+(i.total_amount||0), 0);
        const exp = expenses.filter(e => e.date?.startsWith(prefix)).reduce((s,e) => s+(e.amount||0), 0);
        monthLabels.push({ month: label, Revenue: Math.round(rev), Expenses: Math.round(exp) });
      }
      setRevenueData(monthLabels);

      // Job status breakdown
      const statusCounts = ['Pending','Assigned','In Transit','Delivered','Cancelled'].map(s => ({
        name: s, value: jobs.filter(j => j.status === s).length
      })).filter(s => s.value > 0);
      setJobStatusData(statusCounts);

      // Driver availability
      const drvStats = drivers.map(d => ({
        name: `${d.first_name} ${d.last_name}`.trim().split(' ').map((n,i) => i===0 ? n : n[0]+'.').join(' '),
        Jobs: jobs.filter(j => j.driver_id === d.id && ['Assigned','In Transit'].includes(j.status)).length,
        status: d.status,
      })).filter(d => d.status === 'Active').slice(0, 8);
      setDriverData(drvStats);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:BG }}>
      <div style={{ textAlign:"center" }}>
        <img src={SHAMROCK} alt="" style={{ width:48, height:48, animation:"spin 1.5s linear infinite" }} />
        <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
        <p style={{ color:MUTED, fontSize:13, marginTop:10 }}>Loading dashboard…</p>
      </div>
    </div>
  );

  const net = stats.revenueThisMonth - stats.expensesThisMonth;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const card = { background:SURFACE, border:`1px solid ${BORDER}`, borderRadius:16, boxShadow:"0 2px 12px rgba(0,0,0,0.3)" };

  return (
    <div style={{ minHeight:"100vh", background:BG, fontFamily:"Source Sans 3, sans-serif" }}>
      {/* Hero */}
      <div style={{ position:"relative", background:"#060204", overflow:"hidden", padding:"28px 32px" }}>
        <div style={{ position:"absolute", inset:0, backgroundImage:`url(${HEADER_IMG})`, backgroundSize:"cover", backgroundPosition:"center 40%", opacity:0.12 }} />
        <div style={{ position:"absolute", bottom:0, left:0, right:0, height:3, background:"linear-gradient(90deg,#0fa14a,#009549)" }} />
        <div style={{ position:"relative", zIndex:1 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
            <img src={SHAMROCK} alt="" style={{ width:22, height:22 }} />
            <span style={{ color:GREEN, fontSize:11, fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase", fontFamily:"Barlow, sans-serif" }}>Operations Center</span>
          </div>
          <h1 style={{ color:"#fff", fontFamily:"Barlow, sans-serif", fontSize:26, fontWeight:800, margin:0 }}>{greeting} 👋</h1>
          <p style={{ color:MUTED, fontSize:13, margin:"4px 0 0", fontStyle:"italic" }}>When tomorrow's too late — here's today at a glance.</p>
        </div>
      </div>

      <div style={{ padding:"24px 28px" }}>
        {/* Ops Stats */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16, marginBottom:20 }}>
          {[
            { label:"Pending Jobs",    value:stats.pendingJobs,    icon:Clock,        color:"#fbbf24", bg:"rgba(245,158,11,0.12)" },
            { label:"In Transit",      value:stats.inTransitJobs,  icon:Truck,        color:"#a78bfa", bg:"rgba(139,92,246,0.12)" },
            { label:"Delivered Today", value:stats.deliveredToday, icon:CheckCircle,  color:GREEN,     bg:"rgba(15,161,74,0.12)" },
            { label:"Active Drivers",  value:stats.activeDrivers,  icon:Users,        color:"#60a5fa", bg:"rgba(59,130,246,0.12)" },
          ].map(s => {
            const Icon = s.icon;
            return (
              <div key={s.label} style={{ ...card, padding:"18px 20px" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
                  <span style={{ fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.07em", color:MUTED, fontFamily:"Barlow, sans-serif" }}>{s.label}</span>
                  <div style={{ width:32, height:32, borderRadius:8, background:s.bg, display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <Icon size={16} style={{ color:s.color }} />
                  </div>
                </div>
                <p style={{ fontSize:36, fontWeight:800, color:TEXT, margin:0, fontFamily:"Barlow, sans-serif", lineHeight:1 }}>{s.value}</p>
              </div>
            );
          })}
        </div>

        {/* Finance Row */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:16, marginBottom:20 }}>
          <div style={{ ...card, padding:"18px 20px" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
              <span style={{ fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.07em", color:MUTED, fontFamily:"Barlow, sans-serif" }}>Revenue This Month</span>
              <TrendingUp size={16} style={{ color:GREEN }} />
            </div>
            <p style={{ fontSize:24, fontWeight:800, color:TEXT, margin:0, fontFamily:"Barlow, sans-serif" }}>{fmt(stats.revenueThisMonth)}</p>
          </div>
          <div style={{ ...card, padding:"18px 20px" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
              <span style={{ fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.07em", color:MUTED, fontFamily:"Barlow, sans-serif" }}>Expenses This Month</span>
              <TrendingDown size={16} style={{ color:"#f87171" }} />
            </div>
            <p style={{ fontSize:24, fontWeight:800, color:TEXT, margin:0, fontFamily:"Barlow, sans-serif" }}>{fmt(stats.expensesThisMonth)}</p>
          </div>
          <div style={{ ...card, padding:"18px 20px", borderColor: net>=0 ? "rgba(15,161,74,0.25)" : "rgba(239,68,68,0.25)", background: net>=0 ? "rgba(15,161,74,0.08)" : "rgba(239,68,68,0.08)" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
              <span style={{ fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.07em", color:MUTED, fontFamily:"Barlow, sans-serif" }}>Net Margin</span>
              {net>=0 ? <ArrowUpRight size={16} style={{ color:GREEN }}/> : <ArrowDownRight size={16} style={{ color:"#f87171" }}/>}
            </div>
            <p style={{ fontSize:24, fontWeight:800, margin:0, fontFamily:"Barlow, sans-serif", color:net>=0?GREEN:"#f87171" }}>{fmt(net)}</p>
          </div>
        </div>

        {/* AR Row */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:24 }}>
          <div style={{ ...card, padding:"18px 20px" }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
              <DollarSign size={16} style={{ color:GREEN }} />
              <span style={{ fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.07em", color:MUTED, fontFamily:"Barlow, sans-serif" }}>Open Invoices</span>
            </div>
            <p style={{ fontSize:26, fontWeight:800, color:TEXT, margin:0, fontFamily:"Barlow, sans-serif" }}>{fmt(stats.openInvoiceAmount)}</p>
          </div>
          <div style={{ ...card, padding:"18px 20px", borderColor:"rgba(239,68,68,0.2)" }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
              <AlertCircle size={16} style={{ color:"#f87171" }} />
              <span style={{ fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.07em", color:MUTED, fontFamily:"Barlow, sans-serif" }}>Overdue A/R</span>
            </div>
            <p style={{ fontSize:26, fontWeight:800, color:"#f87171", margin:0, fontFamily:"Barlow, sans-serif" }}>{fmt(stats.overdueAmount)}</p>
          </div>
        </div>

        {/* Charts Section */}
        <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr", gap:16, marginBottom:24 }}>
          {/* Revenue vs Expenses */}
          <div style={{ ...card, padding:20 }}>
            <h2 style={{ fontSize:14, fontWeight:700, color:TEXT, fontFamily:"Barlow, sans-serif", margin:"0 0 16px", display:"flex", alignItems:"center", gap:8 }}>
              <TrendingUp size={15} style={{ color:GREEN }}/> Revenue vs Expenses (6 Months)
            </h2>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={revenueData} margin={{ top:0, right:0, bottom:0, left:0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" tick={{ fill:MUTED, fontSize:11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill:MUTED, fontSize:10 }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={(v) => fmt(v)} contentStyle={{ background:SURFACE2, border:`1px solid rgba(255,255,255,0.1)`, borderRadius:8, color:TEXT, fontSize:12 }} />
                <Bar dataKey="Revenue" fill={GREEN} radius={[4,4,0,0]} />
                <Bar dataKey="Expenses" fill="#ef4444" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Job Status Pie */}
          <div style={{ ...card, padding:20 }}>
            <h2 style={{ fontSize:14, fontWeight:700, color:TEXT, fontFamily:"Barlow, sans-serif", margin:"0 0 16px", display:"flex", alignItems:"center", gap:8 }}>
              <Package size={15} style={{ color:GREEN }}/> Job Status
            </h2>
            {jobStatusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={jobStatusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                    {jobStatusData.map((entry, i) => {
                      const colors = { Pending:'#fbbf24', Assigned:'#60a5fa', 'In Transit':'#a78bfa', Delivered:GREEN, Cancelled:'#f87171' };
                      return <Cell key={i} fill={colors[entry.name] || '#888'} />;
                    })}
                  </Pie>
                  <Tooltip contentStyle={{ background:SURFACE2, border:`1px solid rgba(255,255,255,0.1)`, borderRadius:8, color:TEXT, fontSize:12 }} />
                  <Legend iconType="circle" iconSize={8} formatter={(v) => <span style={{ color:MUTED, fontSize:11 }}>{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height:200, display:'flex', alignItems:'center', justifyContent:'center', color:MUTED, fontSize:13 }}>No jobs yet</div>
            )}
          </div>
        </div>

        {/* Driver Active Jobs */}
        {driverData.length > 0 && (
          <div style={{ ...card, padding:20, marginBottom:24 }}>
            <h2 style={{ fontSize:14, fontWeight:700, color:TEXT, fontFamily:"Barlow, sans-serif", margin:"0 0 16px", display:"flex", alignItems:"center", gap:8 }}>
              <Truck size={15} style={{ color:GREEN }}/> Driver Active Jobs
            </h2>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={driverData} layout="vertical" margin={{ top:0, right:16, bottom:0, left:0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={{ fill:MUTED, fontSize:11 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fill:MUTED, fontSize:11 }} axisLine={false} tickLine={false} width={90} />
                <Tooltip contentStyle={{ background:SURFACE2, border:`1px solid rgba(255,255,255,0.1)`, borderRadius:8, color:TEXT, fontSize:12 }} />
                <Bar dataKey="Jobs" fill="#a78bfa" radius={[0,4,4,0]} label={{ position:'right', fill:MUTED, fontSize:11 }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Map View */}
        <div style={{ ...card, overflow:"hidden", marginBottom:24 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"16px 20px", borderBottom:`1px solid ${BORDER}` }}>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <MapPin size={16} style={{ color:GREEN }} />
              <h2 style={{ fontSize:15, fontWeight:700, margin:0, color:TEXT, fontFamily:"Barlow, sans-serif" }}>Live Dispatch Map</h2>
            </div>
            <span style={{ fontSize:12, fontWeight:700, padding:"3px 10px", borderRadius:20, background:"rgba(139,92,246,0.15)", color:"#a78bfa" }}>
              {inTransitJobs.length} In Transit
            </span>
          </div>
          <div style={{ padding:16 }}>
            <MapView jobs={inTransitJobs} />
          </div>
        </div>

        {/* Recent Jobs */}
        <div style={{ ...card, overflow:"hidden" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"16px 20px", borderBottom:`1px solid ${BORDER}` }}>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <Package size={16} style={{ color:GREEN }} />
              <h2 style={{ fontSize:15, fontWeight:700, margin:0, color:TEXT, fontFamily:"Barlow, sans-serif" }}>Recent Jobs</h2>
            </div>
            <a href="/jobs" style={{ fontSize:12, fontWeight:700, color:GREEN, textDecoration:"none", fontFamily:"Barlow, sans-serif" }}>View all {stats.totalJobs} →</a>
          </div>
          {recentJobs.length === 0 ? (
            <div style={{ padding:48, textAlign:"center" }}>
              <img src={SHAMROCK} alt="" style={{ width:36, opacity:0.15, marginBottom:10 }} />
              <p style={{ color:MUTED }}>No jobs yet. <a href="/new-job" style={{ color:GREEN, fontWeight:600 }}>Create your first →</a></p>
            </div>
          ) : recentJobs.map((job,i) => {
            const sc = STATUS_COLORS[job.status] || STATUS_COLORS.Pending;
            return (
              <div key={job.id} style={{ display:"flex", alignItems:"center", gap:16, padding:"12px 20px", borderBottom:i<recentJobs.length-1?`1px solid ${BORDER}`:"none", background:i%2===0?SURFACE:SURFACE2 }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <span style={{ fontSize:13, fontWeight:700, color:GREEN, fontFamily:"Barlow, sans-serif" }}>{job.job_number||job.id.slice(0,8)}</span>
                    <span style={{ color:BORDER }}>·</span>
                    <span style={{ fontSize:13, color:TEXT, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{job.customer_name||"—"}</span>
                  </div>
                  <p style={{ fontSize:11, color:MUTED, margin:"2px 0 0" }}>{job.pickup_city||"?"} → {job.delivery_city||"?"}</p>
                </div>
                <span style={{ fontSize:11, fontWeight:700, padding:"3px 10px", borderRadius:20, background:sc.bg, color:sc.text, whiteSpace:"nowrap", flexShrink:0 }}>{job.status}</span>
                <div style={{ textAlign:"right", flexShrink:0, minWidth:80 }}>
                  <p style={{ fontSize:14, fontWeight:700, color:TEXT, margin:0, fontFamily:"Barlow, sans-serif" }}>{fmt(job.bill_rate)}</p>
                  <p style={{ fontSize:11, color:MUTED, margin:"1px 0 0" }}>{job.driver_name||"Unassigned"}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}