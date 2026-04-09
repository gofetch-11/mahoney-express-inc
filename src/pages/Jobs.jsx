import { useState, useEffect } from "react";
import { Job } from "@/api/entities";
import { Plus, Search, Filter, Truck, CheckCircle, Clock, AlertCircle, XCircle } from "lucide-react";

const STATUS_CONFIG = {
  All: { color: "bg-gray-100 text-gray-700", icon: null },
  Pending: { color: "bg-yellow-100 text-yellow-800", icon: <Clock className="w-3 h-3" /> },
  Assigned: { color: "bg-blue-100 text-blue-800", icon: <Truck className="w-3 h-3" /> },
  "In Transit": { color: "bg-purple-100 text-purple-800", icon: <Truck className="w-3 h-3" /> },
  Delivered: { color: "bg-green-100 text-green-800", icon: <CheckCircle className="w-3 h-3" /> },
  Cancelled: { color: "bg-red-100 text-red-800", icon: <XCircle className="w-3 h-3" /> },
};

export default function Jobs() {
  const [jobs, setJobs] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [editJob, setEditJob] = useState(null);

  useEffect(() => {
    loadJobs();
  }, []);

  useEffect(() => {
    let f = jobs;
    if (statusFilter !== "All") f = f.filter(j => j.status === statusFilter);
    if (search) f = f.filter(j =>
      (j.job_number || "").toLowerCase().includes(search.toLowerCase()) ||
      (j.customer_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (j.driver_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (j.pickup_city || "").toLowerCase().includes(search.toLowerCase()) ||
      (j.delivery_city || "").toLowerCase().includes(search.toLowerCase())
    );
    setFiltered(f);
  }, [jobs, search, statusFilter]);

  async function loadJobs() {
    const data = await Job.list();
    setJobs(data.sort((a, b) => new Date(b.created_date) - new Date(a.created_date)));
    setLoading(false);
  }

  const fmt = (n) => n ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n) : "—";

  const counts = Object.keys(STATUS_CONFIG).reduce((acc, s) => {
    acc[s] = s === "All" ? jobs.length : jobs.filter(j => j.status === s).length;
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Jobs</h1>
          <p className="text-sm text-gray-500">{jobs.length} total orders</p>
        </div>
        <a href="/new-job" className="bg-red-600 text-white px-4 py-2 rounded-xl font-semibold hover:bg-red-700 transition-colors flex items-center gap-2 text-sm">
          <Plus className="w-4 h-4" />New Job
        </a>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {Object.keys(STATUS_CONFIG).map(s => (
          <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${statusFilter === s ? "bg-red-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
            {s} <span className="ml-1 opacity-70">{counts[s]}</span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500" placeholder="Search job #, customer, driver, city..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          No jobs found.
          <a href="/new-job" className="block mt-2 text-red-600 font-medium hover:underline">Create a new job →</a>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Job #</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Customer</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden md:table-cell">Route</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden lg:table-cell">Driver</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">Bill</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600 hidden lg:table-cell">Pay</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600 hidden lg:table-cell">Margin</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(job => {
                const margin = (job.bill_rate || 0) - (job.driver_pay || 0);
                const cfg = STATUS_CONFIG[job.status] || STATUS_CONFIG.Pending;
                return (
                  <tr key={job.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs font-semibold text-gray-700">{job.job_number || job.id.slice(0,8)}</span>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-800">{job.customer_name || "—"}</td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-gray-500 text-xs">{job.pickup_city || "?"} → {job.delivery_city || "?"}</span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-gray-600">{job.driver_name || <span className="text-yellow-600">Unassigned</span>}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${cfg.color}`}>
                        {cfg.icon}{job.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-800">{fmt(job.bill_rate)}</td>
                    <td className="px-4 py-3 text-right text-red-600 hidden lg:table-cell">{fmt(job.driver_pay)}</td>
                    <td className={`px-4 py-3 text-right font-semibold hidden lg:table-cell ${margin >= 0 ? "text-green-600" : "text-red-600"}`}>{fmt(margin)}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => setEditJob(job)} className="text-xs text-blue-600 hover:underline">Edit</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
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

  useEffect(() => {
    const { Driver } = require("@/api/entities");
    Driver.filter({ status: "Active" }).then(setDrivers);
  }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const save = async () => {
    setSaving(true);
    const { Driver } = require("@/api/entities");
    await Job.update(job.id, form);
    setSaving(false);
    onClose();
  };

  const STATUS_LIST = ["Pending", "Assigned", "In Transit", "Delivered", "Cancelled"];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">Edit Job {job.job_number}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Status</label>
              <select className="input" value={form.status} onChange={e => set("status", e.target.value)}>
                {STATUS_LIST.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Driver</label>
              <select className="input" value={form.driver_id || ""} onChange={e => {
                const d = drivers.find(x => x.id === e.target.value);
                set("driver_id", e.target.value);
                if (d) set("driver_name", `${d.first_name} ${d.last_name}`);
              }}>
                <option value="">Unassigned</option>
                {drivers.map(d => <option key={d.id} value={d.id}>{d.first_name} {d.last_name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Bill Rate ($)</label>
              <input className="input" type="number" value={form.bill_rate || ""} onChange={e => set("bill_rate", e.target.value)} />
            </div>
            <div>
              <label className="label">Driver Pay ($)</label>
              <input className="input" type="number" value={form.driver_pay || ""} onChange={e => set("driver_pay", e.target.value)} />
            </div>
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea className="input" rows={3} value={form.notes || ""} onChange={e => set("notes", e.target.value)} />
          </div>
        </div>
        <div className="flex gap-2 p-5 border-t border-gray-100">
          <button onClick={onClose} className="flex-1 border border-gray-200 py-2 rounded-xl text-gray-600 hover:bg-gray-50">Cancel</button>
          <button onClick={save} disabled={saving} className="flex-1 bg-red-600 text-white py-2 rounded-xl font-semibold hover:bg-red-700 disabled:opacity-50">
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
