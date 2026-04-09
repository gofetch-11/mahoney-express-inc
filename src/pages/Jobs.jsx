import { useState, useEffect } from "react";
import { Job, Driver } from "@/api/entities";
import { Plus, Search, Clock, Truck, CheckCircle, XCircle, Package } from "lucide-react";

const GREEN = "#0fa14a";
const BLACK = "#060204";
const SILVER = "#b0b2b7";
const BG = "#f4f4f2";

const STATUS_CFG = {
  All:        { bg: "#f4f4f2",  text: "#6b6b67",  dot: "#b0b2b7" },
  Pending:    { bg: "#fff8e1",  text: "#b45309",  dot: "#f59e0b" },
  Assigned:   { bg: "#e8f4ff",  text: "#1d4ed8",  dot: "#3b82f6" },
  "In Transit":{ bg:"#f3e8ff", text: "#7c3aed",  dot: "#8b5cf6" },
  Delivered:  { bg: "#e6f9ee",  text: "#166534",  dot: "#0fa14a" },
  Cancelled:  { bg: "#fee2e2",  text: "#991b1b",  dot: "#ef4444" },
};

const fmt = (n) => n != null ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n) : "—";

export default function Jobs() {
  const [jobs, setJobs] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [editJob, setEditJob] = useState(null);

  useEffect(() => { loadJobs(); }, []);
  useEffect(() => {
    let f = jobs;
    if (statusFilter !== "All") f = f.filter(j => j.status === statusFilter);
    if (search) {
      const q = search.toLowerCase();
      f = f.filter(j => ["job_number","customer_name","driver_name","pickup_city","delivery_city"].some(k => (j[k]||"").toLowerCase().includes(q)));
    }
    setFiltered(f);
  }, [jobs, search, statusFilter]);

  async function loadJobs() {
    const data = await Job.list();
    setJobs(data.sort((a,b) => new Date(b.created_date)-new Date(a.created_date)));
    setLoading(false);
  }

  const counts = Object.keys(STATUS_CFG).reduce((acc,s) => {
    acc[s] = s === "All" ? jobs.length : jobs.filter(j => j.status === s).length;
    return acc;
  }, {});

  return (
    <div className="min-h-screen p-6" style={{ background: BG, fontFamily: "Source Sans 3, sans-serif" }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <div className="h-0.5 w-5 rounded-full" style={{ background: `linear-gradient(90deg,${GREEN},#009549)` }} />
            <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: GREEN, fontFamily: "Barlow, sans-serif" }}>Order Management</p>
          </div>
          <h1 className="text-xl font-bold" style={{ color: BLACK, fontFamily: "Barlow, sans-serif" }}>Jobs</h1>
          <p className="text-sm" style={{ color: "#6b6b67" }}>{jobs.length} total orders</p>
        </div>
        <a href="/new-job" className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors" style={{ background: GREEN, color: "#fff", fontFamily: "Barlow, sans-serif" }}>
          <Plus className="w-4 h-4" />New Job
        </a>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {Object.keys(STATUS_CFG).map(s => {
          const active = statusFilter === s;
          return (
            <button key={s} onClick={() => setStatusFilter(s)}
              className="px-3 py-1.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors flex-shrink-0"
              style={{
                background: active ? GREEN : "#fff",
                color: active ? "#fff" : "#6b6b67",
                border: `1px solid ${active ? GREEN : "rgba(0,0,0,0.1)"}`,
                fontFamily: "Barlow, sans-serif",
              }}>
              {s} <span className="ml-1 opacity-70">{counts[s]}</span>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: SILVER }} />
        <input
          className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm focus:outline-none"
          style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.1)", color: BLACK }}
          placeholder="Search job #, customer, driver, city…"
          value={search} onChange={e => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="text-center py-12" style={{ color: SILVER }}>Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Package className="w-10 h-10 mx-auto mb-3" style={{ color: SILVER }} />
          <p style={{ color: "#6b6b67" }}>No jobs found.</p>
          <a href="/new-job" className="text-sm font-semibold mt-2 inline-block" style={{ color: GREEN }}>Create a new job →</a>
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)", boxShadow: "0 1px 8px rgba(0,0,0,0.04)" }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: "#f4f4f2", borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
                  {["Job #","Customer","Route","Driver","Status","Bill","Pay","Margin",""].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: "#6b6b67", fontFamily: "Barlow, sans-serif" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((job, i) => {
                  const sc = STATUS_CFG[job.status] || STATUS_CFG.Pending;
                  const margin = (job.bill_rate||0) - (job.driver_pay||0);
                  return (
                    <tr key={job.id} className="hover:bg-gray-50 transition-colors" style={{ borderBottom: "1px solid rgba(0,0,0,0.04)" }}>
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs font-bold" style={{ color: GREEN }}>{job.job_number || job.id.slice(0,8)}</span>
                      </td>
                      <td className="px-4 py-3 font-semibold" style={{ color: BLACK }}>{job.customer_name || "—"}</td>
                      <td className="px-4 py-3 text-xs" style={{ color: "#6b6b67" }}>{job.pickup_city||"?"} → {job.delivery_city||"?"}</td>
                      <td className="px-4 py-3 text-sm" style={{ color: job.driver_name ? "#6b6b67" : "#f59e0b" }}>{job.driver_name || "Unassigned"}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: sc.bg, color: sc.text }}>{job.status}</span>
                      </td>
                      <td className="px-4 py-3 font-bold" style={{ color: BLACK }}>{fmt(job.bill_rate)}</td>
                      <td className="px-4 py-3" style={{ color: "#ef4444" }}>{fmt(job.driver_pay)}</td>
                      <td className="px-4 py-3 font-bold" style={{ color: margin >= 0 ? GREEN : "#ef4444" }}>{fmt(margin)}</td>
                      <td className="px-4 py-3">
                        <button onClick={() => setEditJob(job)} className="text-xs font-semibold hover:underline" style={{ color: "#3b82f6" }}>Edit</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 text-xs" style={{ color: SILVER, borderTop: "1px solid rgba(0,0,0,0.05)" }}>
            Showing {filtered.length} of {jobs.length} jobs
          </div>
        </div>
      )}

      {editJob && <EditJobModal job={editJob} onClose={() => { setEditJob(null); loadJobs(); }} />}
    </div>
  );
}

function EditJobModal({ job, onClose }) {
  const [form, setForm] = useState({ ...job });
  const [drivers, setDrivers] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => { Driver.filter({ status: "Active" }).then(setDrivers); }, []);

  const set = (k,v) => setForm(f => ({ ...f, [k]: v }));
  const save = async () => {
    setSaving(true);
    await Job.update(job.id, { ...form, bill_rate: parseFloat(form.bill_rate)||0, driver_pay: parseFloat(form.driver_pay)||0 });
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg" style={{ fontFamily: "Source Sans 3, sans-serif" }}>
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
          <h2 className="font-bold" style={{ color: BLACK, fontFamily: "Barlow, sans-serif" }}>Edit Job {job.job_number}</h2>
          <button onClick={onClose} style={{ color: SILVER }}>✕</button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="me-label">Status</label>
              <select className="me-input" value={form.status} onChange={e => set("status", e.target.value)}>
                {["Pending","Assigned","In Transit","Delivered","Cancelled"].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="me-label">Driver</label>
              <select className="me-input" value={form.driver_id||""} onChange={e => {
                const d = drivers.find(x => x.id === e.target.value);
                set("driver_id", e.target.value);
                if (d) set("driver_name", `${d.first_name} ${d.last_name}`);
              }}>
                <option value="">Unassigned</option>
                {drivers.map(d => <option key={d.id} value={d.id}>{d.first_name} {d.last_name}</option>)}
              </select>
            </div>
            <div>
              <label className="me-label">Bill Rate ($)</label>
              <input className="me-input" type="number" value={form.bill_rate||""} onChange={e => set("bill_rate", e.target.value)} />
            </div>
            <div>
              <label className="me-label">Driver Pay ($)</label>
              <input className="me-input" type="number" value={form.driver_pay||""} onChange={e => set("driver_pay", e.target.value)} />
            </div>
          </div>
          <div>
            <label className="me-label">Notes</label>
            <textarea className="me-input" rows={3} value={form.notes||""} onChange={e => set("notes", e.target.value)} />
          </div>
        </div>
        <div className="flex gap-2 p-5 border-t" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
          <button onClick={onClose} className="flex-1 py-2 rounded-xl font-semibold" style={{ border: "1px solid rgba(0,0,0,0.1)", color: "#6b6b67" }}>Cancel</button>
          <button onClick={save} disabled={saving} className="flex-1 py-2 rounded-xl font-bold text-white" style={{ background: GREEN, fontFamily: "Barlow, sans-serif", opacity: saving ? 0.6 : 1 }}>
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
