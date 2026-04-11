import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Wrench, Fuel, Truck, AlertCircle, CheckCircle, Calendar, TrendingDown } from "lucide-react";

const Vehicle = base44.entities.Vehicle;
const MaintenanceRecord = base44.entities.MaintenanceRecord;
const FuelLog = base44.entities.FuelLog;
const Driver = base44.entities.Driver;

const GREEN = "#0fa14a";
const BG = "#0e1012";
const SURFACE = "#161a1d";
const SURFACE2 = "#1e2328";
const BORDER = "rgba(255,255,255,0.07)";
const TEXT = "#f0f0ee";
const MUTED = "#8a8a85";
const fmt = (n) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n || 0);
const card = { background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.3)" };
const inp = { width: "100%", padding: "8px 12px", borderRadius: 10, border: `1px solid ${BORDER}`, background: SURFACE2, color: TEXT, fontSize: 13, outline: "none", boxSizing: "border-box" };
const lbl = { display: "block", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: MUTED, marginBottom: 5, fontFamily: "Barlow, sans-serif" };

const VEHICLE_TYPES = ["Car", "Van", "Sprinter", "Box Truck", "Semi", "Motorcycle", "Other"];
const SERVICE_TYPES = ["Oil Change", "Tire Rotation", "Brake Service", "Transmission", "Engine Repair", "Inspection", "Scheduled Service", "Tire Replacement", "Other"];
const STATUS_CFG = {
  Active:           { bg: "rgba(15,161,74,0.15)",   text: "#4ade80" },
  "In Service":     { bg: "rgba(245,158,11,0.15)",  text: "#fbbf24" },
  "Out of Service": { bg: "rgba(239,68,68,0.15)",   text: "#f87171" },
  Scheduled:        { bg: "rgba(59,130,246,0.15)",  text: "#60a5fa" },
  Completed:        { bg: "rgba(15,161,74,0.15)",   text: "#4ade80" },
  "In Progress":    { bg: "rgba(245,158,11,0.15)",  text: "#fbbf24" },
};

export default function Maintenance() {
  const [tab, setTab] = useState("fleet");
  const [vehicles, setVehicles] = useState([]);
  const [records, setRecords] = useState([]);
  const [fuelLogs, setFuelLogs] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // "vehicle" | "service" | "fuel"
  const [editItem, setEditItem] = useState(null);

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    const [v, m, f, d] = await Promise.all([Vehicle.list(), MaintenanceRecord.list(), FuelLog.list(), Driver.filter({ status: "Active" })]);
    setVehicles(v); setRecords(m); setFuelLogs(f); setDrivers(d);
    setLoading(false);
  }

  // Stats
  const totalFuelCost = fuelLogs.reduce((s, f) => s + (f.total_cost || 0), 0);
  const totalServiceCost = records.filter(r => r.status === "Completed").reduce((s, r) => s + (r.cost || 0), 0);
  const upcomingService = records.filter(r => r.status === "Scheduled");
  const alertVehicles = vehicles.filter(v => {
    if (v.status === "Out of Service") return true;
    if (v.next_service_date) {
      const diff = (new Date(v.next_service_date) - new Date()) / (1000 * 60 * 60 * 24);
      if (diff <= 7) return true;
    }
    if (v.next_service_mileage && v.current_mileage && (v.next_service_mileage - v.current_mileage) <= 500) return true;
    return false;
  });

  if (loading) return (
    <div style={{ minHeight: "100vh", background: BG, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 36, height: 36, borderRadius: "50%", border: `3px solid ${GREEN}`, borderTopColor: "transparent", animation: "spin 1s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: BG, fontFamily: "Source Sans 3, sans-serif", padding: 24 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: GREEN, fontFamily: "Barlow, sans-serif", margin: "0 0 2px" }}>Fleet Operations</p>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: TEXT, margin: 0, fontFamily: "Barlow, sans-serif" }}>Vehicle Maintenance</h1>
          <p style={{ fontSize: 13, color: MUTED, margin: "2px 0 0" }}>{vehicles.length} vehicles · {alertVehicles.length} need attention</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          {tab === "fleet" && <button onClick={() => { setEditItem(null); setModal("vehicle"); }} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 18px", background: GREEN, color: "#fff", border: "none", borderRadius: 12, fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "Barlow, sans-serif" }}><Plus size={14} />Add Vehicle</button>}
          {tab === "service" && <button onClick={() => { setEditItem(null); setModal("service"); }} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 18px", background: GREEN, color: "#fff", border: "none", borderRadius: 12, fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "Barlow, sans-serif" }}><Plus size={14} />Log Service</button>}
          {tab === "fuel" && <button onClick={() => { setEditItem(null); setModal("fuel"); }} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 18px", background: GREEN, color: "#fff", border: "none", borderRadius: 12, fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "Barlow, sans-serif" }}><Plus size={14} />Log Fuel</button>}
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 20 }}>
        {[
          { label: "Active Vehicles", value: vehicles.filter(v => v.status === "Active").length, icon: Truck, color: GREEN, bg: "rgba(15,161,74,0.12)" },
          { label: "Needs Attention", value: alertVehicles.length, icon: AlertCircle, color: "#f87171", bg: "rgba(239,68,68,0.12)" },
          { label: "Fuel Costs (All)", value: fmt(totalFuelCost), icon: Fuel, color: "#fbbf24", bg: "rgba(245,158,11,0.12)" },
          { label: "Service Costs (All)", value: fmt(totalServiceCost), icon: Wrench, color: "#60a5fa", bg: "rgba(59,130,246,0.12)" },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} style={{ ...card, padding: "18px 20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: MUTED, fontFamily: "Barlow, sans-serif" }}>{s.label}</span>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon size={15} style={{ color: s.color }} />
                </div>
              </div>
              <p style={{ fontSize: typeof s.value === "string" ? 20 : 32, fontWeight: 800, color: TEXT, margin: 0, fontFamily: "Barlow, sans-serif", lineHeight: 1 }}>{s.value}</p>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {[["fleet", "Fleet"], ["service", "Service Log"], ["fuel", "Fuel Log"]].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} style={{ padding: "8px 18px", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer", background: tab === key ? GREEN : "transparent", color: tab === key ? "#fff" : MUTED, border: `1px solid ${tab === key ? GREEN : BORDER}`, fontFamily: "Barlow, sans-serif", transition: "all 0.15s" }}>{label}</button>
        ))}
      </div>

      {/* ── FLEET TAB ── */}
      {tab === "fleet" && (
        vehicles.length === 0 ? (
          <EmptyState icon={<Truck size={36} />} msg="No vehicles yet." action="Add your first vehicle →" onAction={() => setModal("vehicle")} />
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px,1fr))", gap: 16 }}>
            {vehicles.map(v => {
              const sc = STATUS_CFG[v.status] || STATUS_CFG.Active;
              const vRecords = records.filter(r => r.vehicle_id === v.id);
              const vFuel = fuelLogs.filter(f => f.vehicle_id === v.id);
              const fuelCost = vFuel.reduce((s, f) => s + (f.total_cost || 0), 0);
              const serviceCost = vRecords.filter(r => r.status === "Completed").reduce((s, r) => s + (r.cost || 0), 0);
              const isAlert = alertVehicles.find(a => a.id === v.id);

              // MPG calc from last 2 fuel logs
              const sorted = [...vFuel].sort((a, b) => new Date(b.date) - new Date(a.date));
              let mpg = null;
              if (sorted.length >= 2 && sorted[0].mileage && sorted[1].mileage) {
                const miles = sorted[0].mileage - sorted[1].mileage;
                const gallons = sorted[0].gallons;
                if (miles > 0 && gallons > 0) mpg = (miles / gallons).toFixed(1);
              }

              return (
                <div key={v.id} style={{ ...card, padding: 20, borderColor: isAlert ? "rgba(239,68,68,0.3)" : BORDER }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <span style={{ fontFamily: "Barlow, sans-serif", fontWeight: 800, color: TEXT, fontSize: 16 }}>Unit #{v.unit_number}</span>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: sc.bg, color: sc.text }}>{v.status}</span>
                      </div>
                      <p style={{ fontSize: 13, color: MUTED, margin: 0 }}>{v.year} {v.make} {v.model} · {v.vehicle_type}</p>
                      {v.license_plate && <p style={{ fontSize: 11, color: MUTED, margin: "2px 0 0" }}>🪪 {v.license_plate}</p>}
                    </div>
                    <button onClick={() => { setEditItem(v); setModal("vehicle"); }} style={{ fontSize: 12, fontWeight: 700, color: "#60a5fa", background: "none", border: "none", cursor: "pointer" }}>Edit</button>
                  </div>

                  {isAlert && (
                    <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, padding: "8px 12px", marginBottom: 12, fontSize: 12, color: "#f87171", display: "flex", alignItems: "center", gap: 6 }}>
                      <AlertCircle size={13} />
                      {v.status === "Out of Service" ? "Out of service" : "Service due soon"}
                    </div>
                  )}

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
                    <StatBox label="Current Miles" value={v.current_mileage ? v.current_mileage.toLocaleString() : "—"} />
                    <StatBox label="Next Service" value={v.next_service_mileage ? v.next_service_mileage.toLocaleString() + " mi" : v.next_service_date || "—"} />
                    <StatBox label="Fuel Cost" value={fmt(fuelCost)} />
                    <StatBox label="Service Cost" value={fmt(serviceCost)} />
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 12, borderTop: `1px solid ${BORDER}`, fontSize: 12 }}>
                    <span style={{ color: MUTED }}>{v.assigned_driver_name || "Unassigned"}</span>
                    {mpg && <span style={{ color: GREEN, fontWeight: 700 }}>{mpg} MPG</span>}
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* ── SERVICE LOG TAB ── */}
      {tab === "service" && (
        records.length === 0 ? (
          <EmptyState icon={<Wrench size={36} />} msg="No service records yet." action="Log first service →" onAction={() => setModal("service")} />
        ) : (
          <div style={{ ...card, overflow: "hidden" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "#060204", borderBottom: `2px solid ${GREEN}` }}>
                    {["Unit", "Service", "Date", "Mileage", "Cost", "Vendor", "Status", "Next Due", ""].map(h => (
                      <th key={h} style={{ textAlign: "left", padding: "10px 14px", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "#888", fontFamily: "Barlow, sans-serif", whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {records.sort((a, b) => new Date(b.service_date) - new Date(a.service_date)).map((r, i) => {
                    const sc = STATUS_CFG[r.status] || STATUS_CFG.Scheduled;
                    return (
                      <tr key={r.id} style={{ background: i % 2 === 0 ? SURFACE : SURFACE2, borderBottom: `1px solid ${BORDER}` }}>
                        <td style={{ padding: "11px 14px", fontWeight: 700, color: GREEN, fontFamily: "Barlow, sans-serif" }}>#{r.unit_number}</td>
                        <td style={{ padding: "11px 14px", color: TEXT }}>{r.service_type}</td>
                        <td style={{ padding: "11px 14px", color: MUTED }}>{r.service_date}</td>
                        <td style={{ padding: "11px 14px", color: MUTED }}>{r.mileage_at_service ? r.mileage_at_service.toLocaleString() : "—"}</td>
                        <td style={{ padding: "11px 14px", fontWeight: 700, color: TEXT, fontFamily: "Barlow, sans-serif" }}>{r.cost ? fmt(r.cost) : "—"}</td>
                        <td style={{ padding: "11px 14px", color: MUTED }}>{r.vendor || "—"}</td>
                        <td style={{ padding: "11px 14px" }}><span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: sc.bg, color: sc.text }}>{r.status}</span></td>
                        <td style={{ padding: "11px 14px", fontSize: 12, color: MUTED }}>
                          {r.next_service_date || (r.next_service_mileage ? `${r.next_service_mileage.toLocaleString()} mi` : "—")}
                        </td>
                        <td style={{ padding: "11px 14px" }}><button onClick={() => { setEditItem(r); setModal("service"); }} style={{ fontSize: 12, fontWeight: 700, color: "#60a5fa", background: "none", border: "none", cursor: "pointer" }}>Edit</button></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

      {/* ── FUEL LOG TAB ── */}
      {tab === "fuel" && (
        fuelLogs.length === 0 ? (
          <EmptyState icon={<Fuel size={36} />} msg="No fuel logs yet." action="Log first fill-up →" onAction={() => setModal("fuel")} />
        ) : (
          <div style={{ ...card, overflow: "hidden" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "#060204", borderBottom: `2px solid ${GREEN}` }}>
                    {["Unit", "Date", "Driver", "Gallons", "$/Gal", "Total", "Odometer", "Location"].map(h => (
                      <th key={h} style={{ textAlign: "left", padding: "10px 14px", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "#888", fontFamily: "Barlow, sans-serif", whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {fuelLogs.sort((a, b) => new Date(b.date) - new Date(a.date)).map((f, i) => (
                    <tr key={f.id} style={{ background: i % 2 === 0 ? SURFACE : SURFACE2, borderBottom: `1px solid ${BORDER}` }}>
                      <td style={{ padding: "11px 14px", fontWeight: 700, color: GREEN, fontFamily: "Barlow, sans-serif" }}>#{f.unit_number}</td>
                      <td style={{ padding: "11px 14px", color: MUTED }}>{f.date}</td>
                      <td style={{ padding: "11px 14px", color: TEXT }}>{f.driver_name || "—"}</td>
                      <td style={{ padding: "11px 14px", color: TEXT }}>{f.gallons}</td>
                      <td style={{ padding: "11px 14px", color: MUTED }}>{f.price_per_gallon ? `$${parseFloat(f.price_per_gallon).toFixed(3)}` : "—"}</td>
                      <td style={{ padding: "11px 14px", fontWeight: 700, color: TEXT, fontFamily: "Barlow, sans-serif" }}>{fmt(f.total_cost)}</td>
                      <td style={{ padding: "11px 14px", color: MUTED }}>{f.mileage ? f.mileage.toLocaleString() : "—"}</td>
                      <td style={{ padding: "11px 14px", color: MUTED }}>{f.location || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ padding: "10px 16px", fontSize: 11, color: MUTED, borderTop: `1px solid ${BORDER}`, display: "flex", justifyContent: "space-between" }}>
              <span>{fuelLogs.length} entries</span>
              <span style={{ fontWeight: 700, color: TEXT }}>Total: {fmt(totalFuelCost)}</span>
            </div>
          </div>
        )
      )}

      {/* Modals */}
      {modal === "vehicle" && <VehicleModal vehicle={editItem} drivers={drivers} onClose={() => { setModal(null); setEditItem(null); loadAll(); }} />}
      {modal === "service" && <ServiceModal record={editItem} vehicles={vehicles} onClose={() => { setModal(null); setEditItem(null); loadAll(); }} />}
      {modal === "fuel" && <FuelModal log={editItem} vehicles={vehicles} drivers={drivers} onClose={() => { setModal(null); setEditItem(null); loadAll(); }} />}
    </div>
  );
}

function StatBox({ label, value }) {
  return (
    <div style={{ background: SURFACE2, borderRadius: 8, padding: "10px 12px" }}>
      <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: MUTED, margin: "0 0 3px", fontFamily: "Barlow, sans-serif" }}>{label}</p>
      <p style={{ fontSize: 14, fontWeight: 700, color: TEXT, margin: 0, fontFamily: "Barlow, sans-serif" }}>{value}</p>
    </div>
  );
}

function EmptyState({ icon, msg, action, onAction }) {
  return (
    <div style={{ textAlign: "center", padding: 64, color: MUTED }}>
      <div style={{ opacity: 0.2, marginBottom: 12 }}>{icon}</div>
      <p>{msg}</p>
      <button onClick={onAction} style={{ marginTop: 8, color: GREEN, fontWeight: 600, background: "none", border: "none", cursor: "pointer", fontSize: 14 }}>{action}</button>
    </div>
  );
}

// ── Vehicle Modal ────────────────────────────────────────────────────────────
function VehicleModal({ vehicle, drivers, onClose }) {
  const [form, setForm] = useState(vehicle ? { ...vehicle } : {
    unit_number: "", make: "", model: "", year: new Date().getFullYear(), license_plate: "", vin: "",
    vehicle_type: "Van", status: "Active", current_mileage: "", next_service_mileage: "", next_service_date: "",
    assigned_driver_id: "", assigned_driver_name: "", notes: "",
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const save = async () => {
    setSaving(true);
    const data = { ...form, year: parseInt(form.year) || null, current_mileage: parseFloat(form.current_mileage) || null, next_service_mileage: parseFloat(form.next_service_mileage) || null };
    if (vehicle) await Vehicle.update(vehicle.id, data); else await Vehicle.create(data);
    setSaving(false); onClose();
  };

  return (
    <Modal title={vehicle ? `Edit Unit #${vehicle.unit_number}` : "Add Vehicle"} onClose={onClose}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div><label style={lbl}>Unit Number *</label><input style={inp} value={form.unit_number} onChange={e => set("unit_number", e.target.value)} /></div>
        <div><label style={lbl}>Status</label><select style={inp} value={form.status} onChange={e => set("status", e.target.value)}>{["Active", "In Service", "Out of Service"].map(s => <option key={s}>{s}</option>)}</select></div>
        <div><label style={lbl}>Year</label><input style={inp} type="number" value={form.year} onChange={e => set("year", e.target.value)} /></div>
        <div><label style={lbl}>Make</label><input style={inp} placeholder="e.g. Ford" value={form.make} onChange={e => set("make", e.target.value)} /></div>
        <div><label style={lbl}>Model</label><input style={inp} placeholder="e.g. Transit" value={form.model} onChange={e => set("model", e.target.value)} /></div>
        <div><label style={lbl}>Type</label><select style={inp} value={form.vehicle_type} onChange={e => set("vehicle_type", e.target.value)}>{VEHICLE_TYPES.map(t => <option key={t}>{t}</option>)}</select></div>
        <div><label style={lbl}>License Plate</label><input style={inp} value={form.license_plate} onChange={e => set("license_plate", e.target.value)} /></div>
        <div><label style={lbl}>VIN</label><input style={inp} value={form.vin} onChange={e => set("vin", e.target.value)} /></div>
        <div><label style={lbl}>Current Mileage</label><input style={inp} type="number" value={form.current_mileage} onChange={e => set("current_mileage", e.target.value)} /></div>
        <div><label style={lbl}>Next Service (miles)</label><input style={inp} type="number" value={form.next_service_mileage} onChange={e => set("next_service_mileage", e.target.value)} /></div>
        <div><label style={lbl}>Next Service Date</label><input style={inp} type="date" value={form.next_service_date} onChange={e => set("next_service_date", e.target.value)} /></div>
        <div><label style={lbl}>Assigned Driver</label>
          <select style={inp} value={form.assigned_driver_id} onChange={e => { const d = drivers.find(x => x.id === e.target.value); set("assigned_driver_id", e.target.value); if (d) set("assigned_driver_name", `${d.first_name} ${d.last_name}`); else set("assigned_driver_name", ""); }}>
            <option value="">Unassigned</option>
            {drivers.map(d => <option key={d.id} value={d.id}>{d.first_name} {d.last_name}</option>)}
          </select>
        </div>
        <div style={{ gridColumn: "span 2" }}><label style={lbl}>Notes</label><textarea style={{ ...inp, resize: "vertical" }} rows={2} value={form.notes} onChange={e => set("notes", e.target.value)} /></div>
      </div>
      <ModalFooter onClose={onClose} onSave={save} saving={saving} disabled={!form.unit_number} />
    </Modal>
  );
}

// ── Service Modal ────────────────────────────────────────────────────────────
function ServiceModal({ record, vehicles, onClose }) {
  const [form, setForm] = useState(record ? { ...record } : {
    vehicle_id: "", unit_number: "", service_type: "Oil Change", service_date: new Date().toISOString().split("T")[0],
    mileage_at_service: "", cost: "", vendor: "", description: "", next_service_mileage: "", next_service_date: "", status: "Scheduled",
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const save = async () => {
    setSaving(true);
    const data = { ...form, mileage_at_service: parseFloat(form.mileage_at_service) || null, cost: parseFloat(form.cost) || null, next_service_mileage: parseFloat(form.next_service_mileage) || null };
    if (record) await MaintenanceRecord.update(record.id, data);
    else {
      await MaintenanceRecord.create(data);
      // Update vehicle's next service info
      if (data.vehicle_id && (data.next_service_mileage || data.next_service_date)) {
        const patch = {};
        if (data.next_service_mileage) patch.next_service_mileage = data.next_service_mileage;
        if (data.next_service_date) patch.next_service_date = data.next_service_date;
        if (data.mileage_at_service) patch.current_mileage = data.mileage_at_service;
        await Vehicle.update(data.vehicle_id, patch);
      }
    }
    setSaving(false); onClose();
  };

  return (
    <Modal title={record ? "Edit Service Record" : "Log Service"} onClose={onClose}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div style={{ gridColumn: "span 2" }}><label style={lbl}>Vehicle *</label>
          <select style={inp} value={form.vehicle_id} onChange={e => { const v = vehicles.find(x => x.id === e.target.value); set("vehicle_id", e.target.value); if (v) { set("unit_number", v.unit_number); set("mileage_at_service", v.current_mileage || ""); } }}>
            <option value="">Select vehicle…</option>
            {vehicles.map(v => <option key={v.id} value={v.id}>Unit #{v.unit_number} — {v.year} {v.make} {v.model}</option>)}
          </select>
        </div>
        <div><label style={lbl}>Service Type</label><select style={inp} value={form.service_type} onChange={e => set("service_type", e.target.value)}>{SERVICE_TYPES.map(s => <option key={s}>{s}</option>)}</select></div>
        <div><label style={lbl}>Status</label><select style={inp} value={form.status} onChange={e => set("status", e.target.value)}>{["Scheduled", "In Progress", "Completed"].map(s => <option key={s}>{s}</option>)}</select></div>
        <div><label style={lbl}>Service Date</label><input style={inp} type="date" value={form.service_date} onChange={e => set("service_date", e.target.value)} /></div>
        <div><label style={lbl}>Mileage at Service</label><input style={inp} type="number" value={form.mileage_at_service} onChange={e => set("mileage_at_service", e.target.value)} /></div>
        <div><label style={lbl}>Cost ($)</label><input style={inp} type="number" placeholder="0.00" value={form.cost} onChange={e => set("cost", e.target.value)} /></div>
        <div><label style={lbl}>Vendor / Shop</label><input style={inp} value={form.vendor} onChange={e => set("vendor", e.target.value)} /></div>
        <div><label style={lbl}>Next Service (miles)</label><input style={inp} type="number" value={form.next_service_mileage} onChange={e => set("next_service_mileage", e.target.value)} /></div>
        <div><label style={lbl}>Next Service Date</label><input style={inp} type="date" value={form.next_service_date} onChange={e => set("next_service_date", e.target.value)} /></div>
        <div style={{ gridColumn: "span 2" }}><label style={lbl}>Notes</label><textarea style={{ ...inp, resize: "vertical" }} rows={2} value={form.description} onChange={e => set("description", e.target.value)} /></div>
      </div>
      <ModalFooter onClose={onClose} onSave={save} saving={saving} disabled={!form.vehicle_id} />
    </Modal>
  );
}

// ── Fuel Modal ───────────────────────────────────────────────────────────────
function FuelModal({ log, vehicles, drivers, onClose }) {
  const [form, setForm] = useState(log ? { ...log } : {
    vehicle_id: "", unit_number: "", date: new Date().toISOString().split("T")[0],
    gallons: "", price_per_gallon: "", total_cost: "", mileage: "", location: "", driver_name: "", notes: "",
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => {
    const next = { ...f, [k]: v };
    // Auto-calc total
    if ((k === "gallons" || k === "price_per_gallon") && next.gallons && next.price_per_gallon) {
      next.total_cost = (parseFloat(next.gallons) * parseFloat(next.price_per_gallon)).toFixed(2);
    }
    return next;
  });
  const save = async () => {
    setSaving(true);
    const data = { ...form, gallons: parseFloat(form.gallons) || null, price_per_gallon: parseFloat(form.price_per_gallon) || null, total_cost: parseFloat(form.total_cost) || null, mileage: parseFloat(form.mileage) || null };
    // Update vehicle mileage
    if (data.vehicle_id && data.mileage) await Vehicle.update(data.vehicle_id, { current_mileage: data.mileage });
    if (log) await FuelLog.update(log.id, data); else await FuelLog.create(data);
    setSaving(false); onClose();
  };

  return (
    <Modal title="Log Fuel Fill-Up" onClose={onClose}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div style={{ gridColumn: "span 2" }}><label style={lbl}>Vehicle *</label>
          <select style={inp} value={form.vehicle_id} onChange={e => { const v = vehicles.find(x => x.id === e.target.value); set("vehicle_id", e.target.value); if (v) set("unit_number", v.unit_number); }}>
            <option value="">Select vehicle…</option>
            {vehicles.map(v => <option key={v.id} value={v.id}>Unit #{v.unit_number} — {v.year} {v.make} {v.model}</option>)}
          </select>
        </div>
        <div><label style={lbl}>Date</label><input style={inp} type="date" value={form.date} onChange={e => set("date", e.target.value)} /></div>
        <div><label style={lbl}>Driver</label>
          <select style={inp} value={form.driver_name} onChange={e => set("driver_name", e.target.value)}>
            <option value="">Select driver…</option>
            {drivers.map(d => <option key={d.id}>{d.first_name} {d.last_name}</option>)}
          </select>
        </div>
        <div><label style={lbl}>Gallons</label><input style={inp} type="number" step="0.001" placeholder="0.000" value={form.gallons} onChange={e => set("gallons", e.target.value)} /></div>
        <div><label style={lbl}>Price / Gallon ($)</label><input style={inp} type="number" step="0.001" placeholder="0.000" value={form.price_per_gallon} onChange={e => set("price_per_gallon", e.target.value)} /></div>
        <div><label style={lbl}>Total Cost ($)</label><input style={inp} type="number" placeholder="0.00" value={form.total_cost} onChange={e => set("total_cost", e.target.value)} /></div>
        <div><label style={lbl}>Odometer Reading</label><input style={inp} type="number" value={form.mileage} onChange={e => set("mileage", e.target.value)} /></div>
        <div style={{ gridColumn: "span 2" }}><label style={lbl}>Station / Location</label><input style={inp} value={form.location} onChange={e => set("location", e.target.value)} /></div>
      </div>
      <ModalFooter onClose={onClose} onSave={save} saving={saving} disabled={!form.vehicle_id || !form.gallons} />
    </Modal>
  );
}

// ── Shared Modal Shell ───────────────────────────────────────────────────────
function Modal({ title, onClose, children }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 16 }}>
      <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 20, boxShadow: "0 8px 40px rgba(0,0,0,0.5)", width: "100%", maxWidth: 560, maxHeight: "90vh", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 22px", borderBottom: `1px solid ${BORDER}`, flexShrink: 0 }}>
          <h2 style={{ fontFamily: "Barlow, sans-serif", fontWeight: 800, color: TEXT, margin: 0, fontSize: 17 }}>{title}</h2>
          <button onClick={onClose} style={{ color: MUTED, background: "none", border: "none", cursor: "pointer", fontSize: 18 }}>✕</button>
        </div>
        <div style={{ overflowY: "auto", flex: 1, padding: "20px 22px" }}>{children}</div>
      </div>
    </div>
  );
}

function ModalFooter({ onClose, onSave, saving, disabled }) {
  return (
    <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
      <button onClick={onClose} style={{ flex: 1, padding: 10, borderRadius: 10, border: `1px solid ${BORDER}`, background: "transparent", color: MUTED, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
      <button onClick={onSave} disabled={saving || disabled} style={{ flex: 1, padding: 10, borderRadius: 10, background: GREEN, color: "#fff", border: "none", fontWeight: 800, cursor: "pointer", fontFamily: "Barlow, sans-serif", opacity: (saving || disabled) ? 0.5 : 1 }}>{saving ? "Saving…" : "Save"}</button>
    </div>
  );
}