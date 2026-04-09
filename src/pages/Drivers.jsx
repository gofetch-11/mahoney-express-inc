import { useState, useEffect } from "react";
import { Driver, Job } from "@/api/entities";
import { Plus, User, Truck, DollarSign, Phone, Mail } from "lucide-react";

const GREEN = "#0fa14a"; const BLACK = "#060204"; const SILVER = "#b0b2b7"; const BG = "#f4f4f2";
const PAY_TYPES = ["Per Mile", "Per Job", "Hourly", "Percentage"];
const VEHICLES = ["Car", "Van", "Box Truck", "Sprinter", "Semi", "Motorcycle", "Other"];
const fmt = (n) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n || 0);

export default function Drivers() {
  const [drivers, setDrivers] = useState([]);
  const [driverStats, setDriverStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editDriver, setEditDriver] = useState(null);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const [drvs, jobs] = await Promise.all([Driver.list(), Job.list()]);
    const stats = {};
    drvs.forEach(d => {
      const delivered = jobs.filter(j => j.driver_id === d.id && j.status === "Delivered");
      stats[d.id] = {
        delivered: delivered.length,
        totalBilled: delivered.reduce((s,j) => s+(j.bill_rate||0), 0),
        totalPay: delivered.reduce((s,j) => s+(j.driver_pay||0), 0),
      };
    });
    setDrivers(drvs.sort((a,b) => (a.first_name||"").localeCompare(b.first_name||"")));
    setDriverStats(stats);
    setLoading(false);
  }

  const statusDot = { Active: GREEN, Inactive: SILVER, "On Leave": "#f59e0b" };
  const statusBg = { Active: "#e6f9ee", Inactive: "#f4f4f2", "On Leave": "#fff8e1" };
  const statusText = { Active: "#166534", Inactive: "#6b6b67", "On Leave": "#b45309" };

  if (loading) return <div className="min-h-screen flex items-center justify-center" style={{ background: BG }}><div className="w-8 h-8 rounded-full border-4 animate-spin" style={{ borderColor: GREEN, borderTopColor: "transparent" }} /></div>;

  return (
    <div className="min-h-screen p-6" style={{ background: BG, fontFamily: "Source Sans 3, sans-serif" }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <div className="h-0.5 w-5 rounded-full" style={{ background: `linear-gradient(90deg,${GREEN},#009549)` }} />
            <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: GREEN, fontFamily: "Barlow, sans-serif" }}>Fleet</p>
          </div>
          <h1 className="text-xl font-bold" style={{ color: BLACK, fontFamily: "Barlow, sans-serif" }}>Drivers</h1>
          <p className="text-sm" style={{ color: "#6b6b67" }}>{drivers.filter(d => d.status === "Active").length} active drivers</p>
        </div>
        <button onClick={() => { setEditDriver(null); setShowForm(true); }} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white" style={{ background: GREEN, fontFamily: "Barlow, sans-serif" }}>
          <Plus className="w-4 h-4" />Add Driver
        </button>
      </div>

      {drivers.length === 0 ? (
        <div className="text-center py-16" style={{ color: SILVER }}>
          <User className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>No drivers yet.</p>
          <button onClick={() => setShowForm(true)} className="mt-3 text-sm font-semibold" style={{ color: GREEN }}>Add your first driver →</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {drivers.map(d => {
            const s = driverStats[d.id] || {};
            const margin = (s.totalBilled||0) - (s.totalPay||0);
            return (
              <div key={d.id} className="rounded-2xl p-5" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)", boxShadow: "0 1px 8px rgba(0,0,0,0.04)" }}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-base flex-shrink-0" style={{ background: BLACK, fontFamily: "Barlow, sans-serif" }}>
                      {(d.first_name||"?")[0]}{(d.last_name||"?")[0]}
                    </div>
                    <div>
                      <p className="font-bold" style={{ color: BLACK, fontFamily: "Barlow, sans-serif" }}>{d.first_name} {d.last_name}</p>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: statusBg[d.status]||"#f4f4f2", color: statusText[d.status]||"#6b6b67" }}>{d.status}</span>
                    </div>
                  </div>
                  <button onClick={() => { setEditDriver(d); setShowForm(true); }} className="text-xs font-semibold" style={{ color: "#3b82f6" }}>Edit</button>
                </div>

                <div className="space-y-1.5 mb-4">
                  {d.phone && <div className="flex items-center gap-2 text-sm" style={{ color: "#6b6b67" }}><Phone className="w-3.5 h-3.5" style={{ color: SILVER }} />{d.phone}</div>}
                  {d.email && <div className="flex items-center gap-2 text-sm" style={{ color: "#6b6b67" }}><Mail className="w-3.5 h-3.5" style={{ color: SILVER }} />{d.email}</div>}
                  {d.vehicle_type && <div className="flex items-center gap-2 text-sm" style={{ color: "#6b6b67" }}><Truck className="w-3.5 h-3.5" style={{ color: SILVER }} />{d.vehicle_type}{d.vehicle_make ? ` · ${d.vehicle_make} ${d.vehicle_model||""}` : ""}</div>}
                  <div className="flex items-center gap-2 text-sm" style={{ color: "#6b6b67" }}><DollarSign className="w-3.5 h-3.5" style={{ color: SILVER }} />{d.pay_type} @ {d.pay_type === "Percentage" ? `${d.pay_rate}%` : fmt(d.pay_rate)}</div>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-3" style={{ borderTop: "1px solid rgba(0,0,0,0.07)" }}>
                  <div className="text-center">
                    <p className="text-xl font-bold" style={{ color: BLACK, fontFamily: "Barlow, sans-serif" }}>{s.delivered||0}</p>
                    <p className="text-xs" style={{ color: SILVER }}>Deliveries</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold" style={{ color: BLACK, fontFamily: "Barlow, sans-serif" }}>{fmt(s.totalBilled)}</p>
                    <p className="text-xs" style={{ color: SILVER }}>Billed</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold" style={{ color: margin >= 0 ? GREEN : "#ef4444", fontFamily: "Barlow, sans-serif" }}>{fmt(margin)}</p>
                    <p className="text-xs" style={{ color: SILVER }}>Margin</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && <DriverForm driver={editDriver} onClose={() => { setShowForm(false); loadData(); }} />}
    </div>
  );
}

function DriverForm({ driver, onClose }) {
  const [form, setForm] = useState(driver ? { ...driver } : { first_name:"",last_name:"",phone:"",email:"",vehicle_type:"Van",vehicle_make:"",vehicle_model:"",license_plate:"",pay_type:"Per Mile",pay_rate:"",status:"Active",notes:"" });
  const [saving, setSaving] = useState(false);
  const set = (k,v) => setForm(f => ({ ...f, [k]: v }));
  const save = async () => {
    setSaving(true);
    const data = { ...form, pay_rate: parseFloat(form.pay_rate)||0 };
    if (driver) await Driver.update(driver.id, data); else await Driver.create(data);
    setSaving(false); onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" style={{ fontFamily: "Source Sans 3, sans-serif" }}>
        <div className="flex items-center justify-between p-5 sticky top-0 bg-white" style={{ borderBottom: "1px solid rgba(0,0,0,0.08)" }}>
          <h2 className="font-bold" style={{ color: BLACK, fontFamily: "Barlow, sans-serif" }}>{driver ? "Edit Driver" : "Add Driver"}</h2>
          <button onClick={onClose} style={{ color: SILVER }}>✕</button>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-2 gap-4">
            {[["First Name","first_name"],["Last Name","last_name"],["Phone","phone"],["Email","email"],["License Plate","license_plate"]].map(([l,k]) => (
              <div key={k}><label className="me-label">{l}</label><input className="me-input" value={form[k]||""} onChange={e => set(k,e.target.value)} /></div>
            ))}
            <div>
              <label className="me-label">Vehicle Type</label>
              <select className="me-input" value={form.vehicle_type} onChange={e => set("vehicle_type", e.target.value)}>
                {VEHICLES.map(v => <option key={v}>{v}</option>)}
              </select>
            </div>
            <div><label className="me-label">Make</label><input className="me-input" placeholder="e.g. Ford" value={form.vehicle_make||""} onChange={e => set("vehicle_make",e.target.value)} /></div>
            <div><label className="me-label">Model</label><input className="me-input" placeholder="e.g. Transit" value={form.vehicle_model||""} onChange={e => set("vehicle_model",e.target.value)} /></div>
            <div>
              <label className="me-label">Pay Type</label>
              <select className="me-input" value={form.pay_type} onChange={e => set("pay_type",e.target.value)}>
                {PAY_TYPES.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div><label className="me-label">Pay Rate {form.pay_type==="Percentage"?"(%)":"($)"}</label><input className="me-input" type="number" placeholder="0.00" value={form.pay_rate||""} onChange={e => set("pay_rate",e.target.value)} /></div>
            <div>
              <label className="me-label">Status</label>
              <select className="me-input" value={form.status} onChange={e => set("status",e.target.value)}>
                <option>Active</option><option>Inactive</option><option>On Leave</option>
              </select>
            </div>
            <div className="col-span-2"><label className="me-label">Notes</label><textarea className="me-input" rows={2} value={form.notes||""} onChange={e => set("notes",e.target.value)} /></div>
          </div>
        </div>
        <div className="flex gap-2 p-5" style={{ borderTop: "1px solid rgba(0,0,0,0.08)" }}>
          <button onClick={onClose} className="flex-1 py-2 rounded-xl font-semibold" style={{ border: "1px solid rgba(0,0,0,0.1)", color: "#6b6b67" }}>Cancel</button>
          <button onClick={save} disabled={saving} className="flex-1 py-2 rounded-xl font-bold text-white" style={{ background: GREEN, fontFamily: "Barlow, sans-serif", opacity: saving ? 0.6 : 1 }}>
            {saving ? "Saving…" : driver ? "Save Changes" : "Add Driver"}
          </button>
        </div>
      </div>
    </div>
  );
}
