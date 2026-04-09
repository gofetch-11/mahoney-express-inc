import { useState, useEffect } from "react";
import { Driver, Job } from "@/api/entities";
import { Plus, User, Truck, DollarSign, Phone, Mail } from "lucide-react";

const PAY_TYPES = ["Per Mile", "Per Job", "Hourly", "Percentage"];
const VEHICLES = ["Car", "Van", "Box Truck", "Sprinter", "Semi", "Motorcycle", "Other"];

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
      const myJobs = jobs.filter(j => j.driver_id === d.id);
      const delivered = myJobs.filter(j => j.status === "Delivered");
      stats[d.id] = {
        totalJobs: myJobs.length,
        delivered: delivered.length,
        totalBilled: delivered.reduce((s, j) => s + (j.bill_rate || 0), 0),
        totalPay: delivered.reduce((s, j) => s + (j.driver_pay || 0), 0),
        totalMiles: delivered.reduce((s, j) => s + (j.miles || 0), 0),
      };
    });
    setDrivers(drvs.sort((a, b) => a.first_name?.localeCompare(b.first_name)));
    setDriverStats(stats);
    setLoading(false);
  }

  const fmt = (n) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n || 0);
  const statusColor = (s) => ({ Active: "bg-green-100 text-green-700", Inactive: "bg-gray-100 text-gray-500", "On Leave": "bg-yellow-100 text-yellow-700" })[s] || "bg-gray-100 text-gray-500";

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Drivers</h1>
          <p className="text-sm text-gray-500">{drivers.filter(d => d.status === "Active").length} active drivers</p>
        </div>
        <button onClick={() => { setEditDriver(null); setShowForm(true); }} className="bg-red-600 text-white px-4 py-2 rounded-xl font-semibold hover:bg-red-700 transition-colors flex items-center gap-2 text-sm">
          <Plus className="w-4 h-4" />Add Driver
        </button>
      </div>

      {drivers.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <User className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>No drivers yet.</p>
          <button onClick={() => setShowForm(true)} className="mt-3 text-red-600 font-medium hover:underline">Add your first driver →</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {drivers.map(d => {
            const s = driverStats[d.id] || {};
            const margin = (s.totalBilled || 0) - (s.totalPay || 0);
            return (
              <div key={d.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center text-red-700 font-bold text-lg">
                      {d.first_name?.[0]}{d.last_name?.[0]}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{d.first_name} {d.last_name}</p>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColor(d.status)}`}>{d.status}</span>
                    </div>
                  </div>
                  <button onClick={() => { setEditDriver(d); setShowForm(true); }} className="text-xs text-blue-600 hover:underline">Edit</button>
                </div>

                <div className="space-y-1.5 mb-4">
                  {d.phone && <div className="flex items-center gap-2 text-sm text-gray-500"><Phone className="w-3.5 h-3.5" />{d.phone}</div>}
                  {d.email && <div className="flex items-center gap-2 text-sm text-gray-500"><Mail className="w-3.5 h-3.5" />{d.email}</div>}
                  {d.vehicle_type && <div className="flex items-center gap-2 text-sm text-gray-500"><Truck className="w-3.5 h-3.5" />{d.vehicle_type} {d.vehicle_make ? `· ${d.vehicle_make} ${d.vehicle_model || ""}` : ""}</div>}
                  <div className="flex items-center gap-2 text-sm text-gray-500"><DollarSign className="w-3.5 h-3.5" />{d.pay_type} @ {d.pay_type === "Percentage" ? `${d.pay_rate}%` : fmt(d.pay_rate)}</div>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-3 border-t border-gray-100">
                  <div className="text-center">
                    <p className="text-lg font-bold text-gray-800">{s.delivered || 0}</p>
                    <p className="text-xs text-gray-400">Deliveries</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-gray-800">{fmt(s.totalBilled)}</p>
                    <p className="text-xs text-gray-400">Billed</p>
                  </div>
                  <div className="text-center">
                    <p className={`text-sm font-bold ${margin >= 0 ? "text-green-600" : "text-red-600"}`}>{fmt(margin)}</p>
                    <p className="text-xs text-gray-400">Margin</p>
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
  const blank = { first_name: "", last_name: "", phone: "", email: "", vehicle_type: "Van", vehicle_make: "", vehicle_model: "", license_plate: "", pay_type: "Per Mile", pay_rate: "", status: "Active", notes: "" };
  const [form, setForm] = useState(driver ? { ...driver } : blank);
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const save = async () => {
    setSaving(true);
    const data = { ...form };
    if (data.pay_rate) data.pay_rate = parseFloat(data.pay_rate);
    if (driver) await Driver.update(driver.id, data);
    else await Driver.create(data);
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white">
          <h2 className="font-bold text-gray-900">{driver ? "Edit Driver" : "Add Driver"}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">First Name</label>
              <input className="input" value={form.first_name} onChange={e => set("first_name", e.target.value)} />
            </div>
            <div>
              <label className="label">Last Name</label>
              <input className="input" value={form.last_name} onChange={e => set("last_name", e.target.value)} />
            </div>
            <div>
              <label className="label">Phone</label>
              <input className="input" value={form.phone} onChange={e => set("phone", e.target.value)} />
            </div>
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" value={form.email} onChange={e => set("email", e.target.value)} />
            </div>
            <div>
              <label className="label">Vehicle Type</label>
              <select className="input" value={form.vehicle_type} onChange={e => set("vehicle_type", e.target.value)}>
                {VEHICLES.map(v => <option key={v}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="label">License Plate</label>
              <input className="input" value={form.license_plate} onChange={e => set("license_plate", e.target.value)} />
            </div>
            <div>
              <label className="label">Make</label>
              <input className="input" placeholder="e.g. Ford" value={form.vehicle_make} onChange={e => set("vehicle_make", e.target.value)} />
            </div>
            <div>
              <label className="label">Model</label>
              <input className="input" placeholder="e.g. Transit" value={form.vehicle_model} onChange={e => set("vehicle_model", e.target.value)} />
            </div>
            <div>
              <label className="label">Pay Type</label>
              <select className="input" value={form.pay_type} onChange={e => set("pay_type", e.target.value)}>
                {PAY_TYPES.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Pay Rate {form.pay_type === "Percentage" ? "(%)" : "($)"}</label>
              <input className="input" type="number" placeholder="0.00" value={form.pay_rate} onChange={e => set("pay_rate", e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className="label">Status</label>
              <select className="input" value={form.status} onChange={e => set("status", e.target.value)}>
                <option>Active</option><option>Inactive</option><option>On Leave</option>
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
          <button onClick={save} disabled={saving} className="flex-1 bg-red-600 text-white py-2 rounded-xl font-semibold hover:bg-red-700 disabled:opacity-50">
            {saving ? "Saving..." : driver ? "Save Changes" : "Add Driver"}
          </button>
        </div>
      </div>
    </div>
  );
}
