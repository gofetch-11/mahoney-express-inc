import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Driver } from "@/api/entities";
import { Plus, Truck, Wrench, Fuel, AlertTriangle, CheckCircle, Clock, TrendingUp } from "lucide-react";

const Vehicle = base44.entities.Vehicle;
const ServiceAppointment = base44.entities.ServiceAppointment;
const FuelLog = base44.entities.FuelLog;

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

const STATUS_CFG = {
  Active:           { bg: "rgba(15,161,74,0.15)",   text: "#4ade80" },
  "In Service":     { bg: "rgba(245,158,11,0.15)",  text: "#fbbf24" },
  "Out of Service": { bg: "rgba(239,68,68,0.15)",   text: "#f87171" },
  Retired:          { bg: "rgba(255,255,255,0.07)", text: MUTED },
  Scheduled:        { bg: "rgba(59,130,246,0.15)",  text: "#60a5fa" },
  "In Progress":    { bg: "rgba(245,158,11,0.15)",  text: "#fbbf24" },
  Completed:        { bg: "rgba(15,161,74,0.15)",   text: "#4ade80" },
  Cancelled:        { bg: "rgba(239,68,68,0.15)",   text: "#f87171" },
};

const SERVICE_TYPES = ["Oil Change", "Tire Rotation", "Brake Service", "Inspection", "Transmission", "Engine Repair", "AC / Heat", "Alignment", "Other"];
const VEHICLE_TYPES = ["Car", "Van", "Sprinter", "Box Truck", "Semi", "Motorcycle", "Other"];

export default function VehicleMaintenance() {
  const [tab, setTab] = useState("fleet");
  const [vehicles, setVehicles] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [fuelLogs, setFuelLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showVehicleForm, setShowVehicleForm] = useState(false);
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [showFuelForm, setShowFuelForm] = useState(false);
  const [editVehicle, setEditVehicle] = useState(null);
  const [editAppt, setEditAppt] = useState(null);

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    const [v, s, f] = await Promise.all([Vehicle.list(), ServiceAppointment.list(), FuelLog.list()]);
    setVehicles(v);
    setAppointments(s.sort((a, b) => new Date(b.scheduled_date) - new Date(a.scheduled_date)));
    setFuelLogs(f.sort((a, b) => new Date(b.date) - new Date(a.date)));
    setLoading(false);
  }

  // Stats
  const totalFuelCost = fuelLogs.reduce((s, f) => s + (f.total_cost || 0), 0);
  const totalServiceCost = appointments.filter(a => a.status === "Completed").reduce((s, a) => s + (a.cost || 0), 0);
  const upcomingServices = appointments.filter(a => a.status === "Scheduled").length;
  const activeVehicles = vehicles.filter(v => v.status === "Active").length;

  // Vehicles needing service soon (within 1000 miles)
  const needService = vehicles.filter(v => v.next_service_mileage && v.current_mileage && (v.next_service_mileage - v.current_mileage) <= 1000);

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
          <p style={{ fontSize: 13, color: MUTED, margin: "2px 0 0" }}>{vehicles.length} vehicles tracked</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          {tab === "fleet" && (
            <button onClick={() => { setEditVehicle(null); setShowVehicleForm(true); }} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 18px", background: GREEN, color: "#fff", border: "none", borderRadius: 12, fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "Barlow, sans-serif" }}>
              <Plus size={14} />Add Vehicle
            </button>
          )}
          {tab === "service" && (
            <button onClick={() => { setEditAppt(null); setShowServiceForm(true); }} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 18px", background: GREEN, color: "#fff", border: "none", borderRadius: 12, fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "Barlow, sans-serif" }}>
              <Plus size={14} />Schedule Service
            </button>
          )}
          {tab === "fuel" && (
            <button onClick={() => setShowFuelForm(true)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 18px", background: GREEN, color: "#fff", border: "none", borderRadius: 12, fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "Barlow, sans-serif" }}>
              <Plus size={14} />Log Fuel
            </button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 24 }}>
        {[
          { label: "Active Vehicles", value: activeVehicles, icon: Truck, color: GREEN, bg: "rgba(15,161,74,0.12)" },
          { label: "Upcoming Services", value: upcomingServices, icon: Clock, color: "#60a5fa", bg: "rgba(59,130,246,0.12)" },
          { label: "Total Fuel Cost", value: fmt(totalFuelCost), icon: Fuel, color: "#fbbf24", bg: "rgba(245,158,11,0.12)" },
          { label: "Service Cost (YTD)", value: fmt(totalServiceCost), icon: Wrench, color: "#a78bfa", bg: "rgba(139,92,246,0.12)" },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} style={{ ...card, padding: "18px 20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: MUTED, fontFamily: "Barlow, sans-serif" }}>{s.label}</span>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon size={16} style={{ color: s.color }} />
                </div>
              </div>
              <p style={{ fontSize: typeof s.value === "string" ? 20 : 36, fontWeight: 800, color: TEXT, margin: 0, fontFamily: "Barlow, sans-serif", lineHeight: 1 }}>{s.value}</p>
            </div>
          );
        })}
      </div>

      {/* Service Due Alert */}
      {needService.length > 0 && (
        <div style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)", borderRadius: 12, padding: "12px 16px", marginBottom: 20, display: "flex", alignItems: "center", gap: 10 }}>
          <AlertTriangle size={16} style={{ color: "#fbbf24", flexShrink: 0 }} />
          <p style={{ color: "#fbbf24", fontSize: 13, fontWeight: 600, margin: 0 }}>
            <strong>{needService.length} vehicle{needService.length > 1 ? "s" : ""}</strong> approaching service interval: {needService.map(v => v.unit_number).join(", ")}
          </p>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {[
          { id: "fleet", label: "Fleet", icon: Truck },
          { id: "service", label: "Service", icon: Wrench },
          { id: "fuel", label: "Fuel Log", icon: Fuel },
        ].map(t => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setTab(t.id)} style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 18px", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer", background: tab === t.id ? GREEN : "transparent", color: tab === t.id ? "#fff" : MUTED, border: `1px solid ${tab === t.id ? GREEN : BORDER}`, fontFamily: "Barlow, sans-serif", transition: "all 0.15s" }}>
              <Icon size={14} />{t.label}
            </button>
          );
        })}
      </div>

      {/* ── FLEET TAB ── */}
      {tab === "fleet" && (
        vehicles.length === 0 ? (
          <EmptyState icon={<Truck size={36} />} message="No vehicles yet." action="Add your first vehicle →" onClick={() => setShowVehicleForm(true)} />
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 16 }}>
            {vehicles.map(v => {
              const sc = STATUS_CFG[v.status] || STATUS_CFG.Active;
              const milesLeft = v.next_service_mileage && v.current_mileage ? v.next_service_mileage - v.current_mileage : null;
              const isAlertMiles = milesLeft !== null && milesLeft <= 1000;
              return (
                <div key={v.id} style={{ ...card, padding: 20 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                    <div>
                      <p style={{ fontWeight: 800, fontSize: 17, color: GREEN, fontFamily: "Barlow, sans-serif", margin: "0 0 3px" }}>Unit #{v.unit_number}</p>
                      <p style={{ fontSize: 13, color: TEXT, margin: "0 0 6px" }}>{[v.year, v.make, v.model].filter(Boolean).join(" ") || "—"}</p>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 10px", borderRadius: 20, background: sc.bg, color: sc.text }}>{v.status}</span>
                    </div>
                    <button onClick={() => { setEditVehicle(v); setShowVehicleForm(true); }} style={{ fontSize: 12, fontWeight: 700, color: "#60a5fa", background: "none", border: "none", cursor: "pointer" }}>Edit</button>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
                    <div style={{ background: SURFACE2, borderRadius: 10, padding: "10px 12px" }}>
                      <p style={{ fontSize: 10, color: MUTED, margin: "0 0 3px", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700 }}>Odometer</p>
                      <p style={{ fontSize: 16, fontWeight: 800, color: TEXT, margin: 0, fontFamily: "Barlow, sans-serif" }}>{v.current_mileage ? v.current_mileage.toLocaleString() : "—"}</p>
                    </div>
                    <div style={{ background: isAlertMiles ? "rgba(245,158,11,0.1)" : SURFACE2, borderRadius: 10, padding: "10px 12px", border: isAlertMiles ? "1px solid rgba(245,158,11,0.3)" : "none" }}>
                      <p style={{ fontSize: 10, color: isAlertMiles ? "#fbbf24" : MUTED, margin: "0 0 3px", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700 }}>Next Service</p>
                      <p style={{ fontSize: 16, fontWeight: 800, color: isAlertMiles ? "#fbbf24" : TEXT, margin: 0, fontFamily: "Barlow, sans-serif" }}>
                        {milesLeft !== null ? `${milesLeft.toLocaleString()} mi` : (v.next_service_mileage ? v.next_service_mileage.toLocaleString() : "—")}
                      </p>
                    </div>
                  </div>
                  {v.assigned_driver_name && (
                    <p style={{ fontSize: 12, color: MUTED, margin: 0 }}>Driver: <span style={{ color: TEXT, fontWeight: 600 }}>{v.assigned_driver_name}</span></p>
                  )}
                  {v.license_plate && (
                    <p style={{ fontSize: 12, color: MUTED, margin: "4px 0 0" }}>Plate: <span style={{ color: TEXT, fontFamily: "monospace" }}>{v.license_plate}</span></p>
                  )}
                </div>
              );
            })}
          </div>
        )
      )}

      {/* ── SERVICE TAB ── */}
      {tab === "service" && (
        appointments.length === 0 ? (
          <EmptyState icon={<Wrench size={36} />} message="No service appointments yet." action="Schedule your first service →" onClick={() => setShowServiceForm(true)} />
        ) : (
          <div style={{ ...card, overflow: "hidden" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "#060204", borderBottom: `2px solid ${GREEN}` }}>
                    {["Unit", "Service Type", "Scheduled", "Status", "Mileage", "Cost", "Shop", ""].map(h => (
                      <th key={h} style={{ textAlign: "left", padding: "10px 16px", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "#888", fontFamily: "Barlow, sans-serif", whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {appointments.map((a, i) => {
                    const sc = STATUS_CFG[a.status] || STATUS_CFG.Scheduled;
                    return (
                      <tr key={a.id} style={{ background: i % 2 === 0 ? SURFACE : SURFACE2, borderBottom: `1px solid ${BORDER}` }}>
                        <td style={{ padding: "12px 16px", fontWeight: 700, color: GREEN, fontFamily: "Barlow, sans-serif" }}>#{a.unit_number || "—"}</td>
                        <td style={{ padding: "12px 16px", color: TEXT, fontWeight: 600 }}>{a.service_type}</td>
                        <td style={{ padding: "12px 16px", color: MUTED }}>{a.scheduled_date || "—"}</td>
                        <td style={{ padding: "12px 16px" }}><span style={{ fontSize: 11, fontWeight: 700, padding: "2px 10px", borderRadius: 20, background: sc.bg, color: sc.text }}>{a.status}</span></td>
                        <td style={{ padding: "12px 16px", color: MUTED }}>{a.mileage_at_service ? a.mileage_at_service.toLocaleString() : "—"}</td>
                        <td style={{ padding: "12px 16px", fontWeight: 700, color: a.cost ? TEXT : MUTED, fontFamily: "Barlow, sans-serif" }}>{a.cost ? fmt(a.cost) : "—"}</td>
                        <td style={{ padding: "12px 16px", color: MUTED, fontSize: 12 }}>{a.shop_name || "—"}</td>
                        <td style={{ padding: "12px 16px" }}><button onClick={() => { setEditAppt(a); setShowServiceForm(true); }} style={{ fontSize: 12, fontWeight: 700, color: "#60a5fa", background: "none", border: "none", cursor: "pointer" }}>Edit</button></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

      {/* ── FUEL TAB ── */}
      {tab === "fuel" && (
        <>
          {/* Fuel summary by vehicle */}
          {fuelLogs.length > 0 && (() => {
            const byVehicle = {};
            fuelLogs.forEach(f => {
              if (!byVehicle[f.unit_number]) byVehicle[f.unit_number] = { cost: 0, gallons: 0, logs: 0 };
              byVehicle[f.unit_number].cost += f.total_cost || 0;
              byVehicle[f.unit_number].gallons += f.gallons || 0;
              byVehicle[f.unit_number].logs += 1;
            });
            return (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 12, marginBottom: 20 }}>
                {Object.entries(byVehicle).map(([unit, data]) => (
                  <div key={unit} style={{ ...card, padding: "14px 18px" }}>
                    <p style={{ fontFamily: "Barlow, sans-serif", fontWeight: 800, color: GREEN, fontSize: 15, margin: "0 0 8px" }}>Unit #{unit}</p>
                    <p style={{ fontSize: 13, color: TEXT, margin: "0 0 3px" }}>Cost: <strong style={{ fontFamily: "Barlow, sans-serif" }}>{fmt(data.cost)}</strong></p>
                    <p style={{ fontSize: 12, color: MUTED, margin: 0 }}>{data.gallons.toFixed(1)} gal · {data.logs} fill-ups</p>
                  </div>
                ))}
              </div>
            );
          })()}
          {fuelLogs.length === 0 ? (
            <EmptyState icon={<Fuel size={36} />} message="No fuel logs yet." action="Log your first fill-up →" onClick={() => setShowFuelForm(true)} />
          ) : (
            <div style={{ ...card, overflow: "hidden" }}>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: "#060204", borderBottom: `2px solid ${GREEN}` }}>
                      {["Date", "Unit", "Driver", "Odometer", "Gallons", "$/Gal", "Total", "Station"].map(h => (
                        <th key={h} style={{ textAlign: "left", padding: "10px 16px", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "#888", fontFamily: "Barlow, sans-serif", whiteSpace: "nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {fuelLogs.map((f, i) => (
                      <tr key={f.id} style={{ background: i % 2 === 0 ? SURFACE : SURFACE2, borderBottom: `1px solid ${BORDER}` }}>
                        <td style={{ padding: "11px 16px", color: MUTED }}>{f.date}</td>
                        <td style={{ padding: "11px 16px", fontWeight: 700, color: GREEN, fontFamily: "Barlow, sans-serif" }}>#{f.unit_number || "—"}</td>
                        <td style={{ padding: "11px 16px", color: TEXT }}>{f.driver_name || "—"}</td>
                        <td style={{ padding: "11px 16px", color: MUTED }}>{f.mileage ? f.mileage.toLocaleString() : "—"}</td>
                        <td style={{ padding: "11px 16px", color: TEXT }}>{f.gallons ? f.gallons.toFixed(2) : "—"}</td>
                        <td style={{ padding: "11px 16px", color: MUTED }}>{f.price_per_gallon ? `$${f.price_per_gallon.toFixed(3)}` : "—"}</td>
                        <td style={{ padding: "11px 16px", fontWeight: 700, color: "#fbbf24", fontFamily: "Barlow, sans-serif" }}>{fmt(f.total_cost)}</td>
                        <td style={{ padding: "11px 16px", color: MUTED, fontSize: 12 }}>{f.station || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modals */}
      {showVehicleForm && <VehicleForm vehicle={editVehicle} onClose={() => { setShowVehicleForm(false); loadAll(); }} />}
      {showServiceForm && <ServiceForm appt={editAppt} vehicles={vehicles} onClose={() => { setShowServiceForm(false); loadAll(); }} />}
      {showFuelForm && <FuelForm vehicles={vehicles} onClose={() => { setShowFuelForm(false); loadAll(); }} />}
    </div>
  );
}

function EmptyState({ icon, message, action, onClick }) {
  return (
    <div style={{ textAlign: "center", padding: 64, color: MUTED }}>
      <div style={{ opacity: 0.2, marginBottom: 12 }}>{icon}</div>
      <p style={{ marginBottom: 8 }}>{message}</p>
      <button onClick={onClick} style={{ color: GREEN, fontWeight: 600, background: "none", border: "none", cursor: "pointer", fontSize: 14 }}>{action}</button>
    </div>
  );
}

// ── Vehicle Form ─────────────────────────────────────────────────────────────
function VehicleForm({ vehicle, onClose }) {
  const [form, setForm] = useState(vehicle ? { ...vehicle } : { unit_number: "", make: "", model: "", year: new Date().getFullYear(), vin: "", license_plate: "", vehicle_type: "Van", status: "Active", current_mileage: "", last_service_mileage: "", next_service_mileage: "", notes: "" });
  const [saving, setSaving] = useState(false);
  const [drivers, setDrivers] = useState([]);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => { Driver.filter({ status: "Active" }).then(setDrivers); }, []);

  const save = async () => {
    setSaving(true);
    const data = { ...form, year: parseInt(form.year) || null, current_mileage: parseFloat(form.current_mileage) || null, last_service_mileage: parseFloat(form.last_service_mileage) || null, next_service_mileage: parseFloat(form.next_service_mileage) || null };
    if (vehicle) await Vehicle.update(vehicle.id, data);
    else await Vehicle.create(data);
    setSaving(false);
    onClose();
  };

  return (
    <Modal title={vehicle ? `Edit Unit #${vehicle.unit_number}` : "Add Vehicle"} onClose={onClose}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div><label style={lbl}>Unit Number *</label><input style={inp} value={form.unit_number} onChange={e => set("unit_number", e.target.value)} /></div>
        <div><label style={lbl}>Vehicle Type</label><select style={inp} value={form.vehicle_type} onChange={e => set("vehicle_type", e.target.value)}>{VEHICLE_TYPES.map(t => <option key={t}>{t}</option>)}</select></div>
        <div><label style={lbl}>Year</label><input style={inp} type="number" value={form.year} onChange={e => set("year", e.target.value)} /></div>
        <div><label style={lbl}>Make</label><input style={inp} placeholder="e.g. Ford" value={form.make || ""} onChange={e => set("make", e.target.value)} /></div>
        <div><label style={lbl}>Model</label><input style={inp} placeholder="e.g. Transit" value={form.model || ""} onChange={e => set("model", e.target.value)} /></div>
        <div><label style={lbl}>License Plate</label><input style={inp} value={form.license_plate || ""} onChange={e => set("license_plate", e.target.value)} /></div>
        <div style={{ gridColumn: "span 2" }}><label style={lbl}>VIN</label><input style={inp} value={form.vin || ""} onChange={e => set("vin", e.target.value)} /></div>
        <div><label style={lbl}>Current Mileage</label><input style={inp} type="number" value={form.current_mileage || ""} onChange={e => set("current_mileage", e.target.value)} /></div>
        <div><label style={lbl}>Last Service Mileage</label><input style={inp} type="number" value={form.last_service_mileage || ""} onChange={e => set("last_service_mileage", e.target.value)} /></div>
        <div><label style={lbl}>Next Service Mileage</label><input style={inp} type="number" value={form.next_service_mileage || ""} onChange={e => set("next_service_mileage", e.target.value)} /></div>
        <div><label style={lbl}>Status</label><select style={inp} value={form.status} onChange={e => set("status", e.target.value)}>{["Active", "In Service", "Out of Service", "Retired"].map(s => <option key={s}>{s}</option>)}</select></div>
        <div style={{ gridColumn: "span 2" }}>
          <label style={lbl}>Assigned Driver</label>
          <select style={inp} value={form.assigned_driver_id || ""} onChange={e => { const d = drivers.find(x => x.id === e.target.value); set("assigned_driver_id", e.target.value); if (d) set("assigned_driver_name", `${d.first_name} ${d.last_name}`); else set("assigned_driver_name", ""); }}>
            <option value="">Unassigned</option>
            {drivers.map(d => <option key={d.id} value={d.id}>{d.first_name} {d.last_name}</option>)}
          </select>
        </div>
        <div style={{ gridColumn: "span 2" }}><label style={lbl}>Notes</label><textarea style={{ ...inp, resize: "vertical" }} rows={2} value={form.notes || ""} onChange={e => set("notes", e.target.value)} /></div>
      </div>
      <ModalFooter onClose={onClose} onSave={save} saving={saving} disabled={!form.unit_number} label={vehicle ? "Save Changes" : "Add Vehicle"} />
    </Modal>
  );
}

// ── Service Form ─────────────────────────────────────────────────────────────
function ServiceForm({ appt, vehicles, onClose }) {
  const [form, setForm] = useState(appt ? { ...appt } : { vehicle_id: "", unit_number: "", service_type: "Oil Change", description: "", scheduled_date: new Date().toISOString().split("T")[0], completed_date: "", status: "Scheduled", mileage_at_service: "", shop_name: "", cost: "", notes: "" });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const save = async () => {
    setSaving(true);
    const data = { ...form, cost: parseFloat(form.cost) || null, mileage_at_service: parseFloat(form.mileage_at_service) || null };
    if (appt) await ServiceAppointment.update(appt.id, data);
    else await ServiceAppointment.create(data);
    setSaving(false);
    onClose();
  };

  return (
    <Modal title={appt ? "Edit Service Appointment" : "Schedule Service"} onClose={onClose}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div style={{ gridColumn: "span 2" }}>
          <label style={lbl}>Vehicle *</label>
          <select style={inp} value={form.vehicle_id} onChange={e => { const v = vehicles.find(x => x.id === e.target.value); set("vehicle_id", e.target.value); if (v) set("unit_number", v.unit_number); }}>
            <option value="">Select vehicle…</option>
            {vehicles.map(v => <option key={v.id} value={v.id}>Unit #{v.unit_number} — {[v.year, v.make, v.model].filter(Boolean).join(" ")}</option>)}
          </select>
        </div>
        <div><label style={lbl}>Service Type</label><select style={inp} value={form.service_type} onChange={e => set("service_type", e.target.value)}>{SERVICE_TYPES.map(t => <option key={t}>{t}</option>)}</select></div>
        <div><label style={lbl}>Status</label><select style={inp} value={form.status} onChange={e => set("status", e.target.value)}>{["Scheduled", "In Progress", "Completed", "Cancelled"].map(s => <option key={s}>{s}</option>)}</select></div>
        <div><label style={lbl}>Scheduled Date</label><input style={inp} type="date" value={form.scheduled_date} onChange={e => set("scheduled_date", e.target.value)} /></div>
        <div><label style={lbl}>Completed Date</label><input style={inp} type="date" value={form.completed_date || ""} onChange={e => set("completed_date", e.target.value)} /></div>
        <div><label style={lbl}>Mileage at Service</label><input style={inp} type="number" value={form.mileage_at_service || ""} onChange={e => set("mileage_at_service", e.target.value)} /></div>
        <div><label style={lbl}>Cost ($)</label><input style={inp} type="number" placeholder="0.00" value={form.cost || ""} onChange={e => set("cost", e.target.value)} /></div>
        <div style={{ gridColumn: "span 2" }}><label style={lbl}>Shop / Vendor</label><input style={inp} value={form.shop_name || ""} onChange={e => set("shop_name", e.target.value)} /></div>
        <div style={{ gridColumn: "span 2" }}><label style={lbl}>Description / Notes</label><textarea style={{ ...inp, resize: "vertical" }} rows={2} value={form.notes || ""} onChange={e => set("notes", e.target.value)} /></div>
      </div>
      <ModalFooter onClose={onClose} onSave={save} saving={saving} disabled={!form.vehicle_id} label={appt ? "Save Changes" : "Schedule Service"} />
    </Modal>
  );
}

// ── Fuel Form ────────────────────────────────────────────────────────────────
function FuelForm({ vehicles, onClose }) {
  const [form, setForm] = useState({ vehicle_id: "", unit_number: "", date: new Date().toISOString().split("T")[0], mileage: "", gallons: "", price_per_gallon: "", total_cost: "", station: "", driver_name: "", notes: "" });
  const [saving, setSaving] = useState(false);
  const [drivers, setDrivers] = useState([]);
  const set = (k, v) => setForm(f => {
    const updated = { ...f, [k]: v };
    if (k === "gallons" || k === "price_per_gallon") {
      const g = parseFloat(k === "gallons" ? v : f.gallons) || 0;
      const p = parseFloat(k === "price_per_gallon" ? v : f.price_per_gallon) || 0;
      if (g && p) updated.total_cost = (g * p).toFixed(2);
    }
    return updated;
  });

  useEffect(() => { Driver.filter({ status: "Active" }).then(setDrivers); }, []);

  const save = async () => {
    setSaving(true);
    const data = { ...form, mileage: parseFloat(form.mileage) || null, gallons: parseFloat(form.gallons) || null, price_per_gallon: parseFloat(form.price_per_gallon) || null, total_cost: parseFloat(form.total_cost) || null };
    await FuelLog.create(data);
    setSaving(false);
    onClose();
  };

  return (
    <Modal title="Log Fuel Fill-Up" onClose={onClose}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div style={{ gridColumn: "span 2" }}>
          <label style={lbl}>Vehicle *</label>
          <select style={inp} value={form.vehicle_id} onChange={e => { const v = vehicles.find(x => x.id === e.target.value); set("vehicle_id", e.target.value); if (v) setForm(f => ({ ...f, vehicle_id: e.target.value, unit_number: v.unit_number })); }}>
            <option value="">Select vehicle…</option>
            {vehicles.map(v => <option key={v.id} value={v.id}>Unit #{v.unit_number} — {[v.year, v.make, v.model].filter(Boolean).join(" ")}</option>)}
          </select>
        </div>
        <div><label style={lbl}>Date</label><input style={inp} type="date" value={form.date} onChange={e => set("date", e.target.value)} /></div>
        <div><label style={lbl}>Odometer (mi)</label><input style={inp} type="number" value={form.mileage || ""} onChange={e => set("mileage", e.target.value)} /></div>
        <div><label style={lbl}>Gallons</label><input style={inp} type="number" step="0.01" value={form.gallons || ""} onChange={e => set("gallons", e.target.value)} /></div>
        <div><label style={lbl}>Price / Gallon ($)</label><input style={inp} type="number" step="0.001" value={form.price_per_gallon || ""} onChange={e => set("price_per_gallon", e.target.value)} /></div>
        <div style={{ gridColumn: "span 2" }}><label style={lbl}>Total Cost ($)</label><input style={{ ...inp, fontWeight: 700, color: GREEN }} type="number" step="0.01" value={form.total_cost || ""} onChange={e => set("total_cost", e.target.value)} /></div>
        <div style={{ gridColumn: "span 2" }}><label style={lbl}>Station / Location</label><input style={inp} value={form.station || ""} onChange={e => set("station", e.target.value)} /></div>
        <div style={{ gridColumn: "span 2" }}>
          <label style={lbl}>Driver</label>
          <select style={inp} value={form.driver_name} onChange={e => setForm(f => ({ ...f, driver_name: e.target.value }))}>
            <option value="">Select driver…</option>
            {drivers.map(d => <option key={d.id} value={`${d.first_name} ${d.last_name}`}>{d.first_name} {d.last_name}</option>)}
          </select>
        </div>
      </div>
      <ModalFooter onClose={onClose} onSave={save} saving={saving} disabled={!form.vehicle_id} label="Log Fill-Up" />
    </Modal>
  );
}

// ── Shared Modal Shell ───────────────────────────────────────────────────────
function Modal({ title, onClose, children }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 16 }}>
      <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 20, boxShadow: "0 8px 40px rgba(0,0,0,0.5)", width: "100%", maxWidth: 540, maxHeight: "90vh", overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 22px", borderBottom: `1px solid ${BORDER}`, flexShrink: 0 }}>
          <h2 style={{ fontFamily: "Barlow, sans-serif", fontWeight: 800, color: TEXT, margin: 0 }}>{title}</h2>
          <button onClick={onClose} style={{ color: MUTED, background: "none", border: "none", cursor: "pointer", fontSize: 18 }}>✕</button>
        </div>
        <div style={{ padding: "20px 22px", overflowY: "auto", flex: 1 }}>{children}</div>
      </div>
    </div>
  );
}

function ModalFooter({ onClose, onSave, saving, disabled, label }) {
  return (
    <div style={{ display: "flex", gap: 10, marginTop: 20, paddingTop: 16, borderTop: `1px solid ${BORDER}` }}>
      <button onClick={onClose} style={{ flex: 1, padding: 10, borderRadius: 10, border: `1px solid ${BORDER}`, background: "transparent", color: MUTED, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
      <button onClick={onSave} disabled={saving || disabled} style={{ flex: 1, padding: 10, borderRadius: 10, background: GREEN, color: "#fff", border: "none", fontWeight: 800, cursor: "pointer", fontFamily: "Barlow, sans-serif", opacity: (saving || disabled) ? 0.5 : 1 }}>{saving ? "Saving…" : label}</button>
    </div>
  );
}