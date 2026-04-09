import { useState, useEffect } from "react";
import { Job, Customer, Driver } from "@/api/entities";
import { Save, Printer, ArrowLeft } from "lucide-react";

const GREEN = "#0fa14a";
const BLACK = "#060204";
const BG = "#f4f4f2";
const LOGO_HEADER = "https://media.base44.com/images/public/69cb07fb94b4627f0bd76151/a863be72e_MahoneyExpressInc-Header.png";
const SHAMROCK = "https://media.base44.com/images/public/69cb07fb94b4627f0bd76151/828dbca4e_Shamrock.png";

const SERVICES = ["Rush / Hot Shot","Standard Delivery","Scheduled","Airport Run","Medical / Stat","Overnight","Other"];
const STATES = ["AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"];

function genJobNumber() {
  const d = new Date();
  return `ME${d.getFullYear().toString().slice(2)}${String(d.getMonth()+1).padStart(2,"0")}${String(d.getDate()).padStart(2,"0")}-${Math.floor(Math.random()*9000+1000)}`;
}
function genBOL() { return `BOL-${Date.now().toString().slice(-8)}`; }

const s = (styles) => ({ ...styles });

export default function NewJob() {
  const [customers, setCustomers] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(null);
  const [showBOL, setShowBOL] = useState(false);
  const [form, setForm] = useState({
    job_number: genJobNumber(), bol_number: genBOL(),
    customer_id: "", customer_name: "",
    service_type: "Rush / Hot Shot",
    pickup_address: "", pickup_city: "", pickup_state: "IL", pickup_zip: "",
    pickup_contact: "", pickup_phone: "",
    delivery_address: "", delivery_city: "", delivery_state: "IL", delivery_zip: "",
    delivery_contact: "", delivery_phone: "",
    pieces: "", weight_lbs: "", description: "", special_instructions: "",
    miles: "", ready_time: "", deadline: "",
    status: "Pending", driver_id: "", driver_name: "",
    bill_rate: "", driver_pay: "", reference_number: "", notes: "",
  });

  useEffect(() => {
    Customer.filter({ status: "Active" }).then(setCustomers);
    Driver.filter({ status: "Active" }).then(setDrivers);
  }, []);

  const set = (k,v) => setForm(f => ({ ...f, [k]: v }));

  const handleCustomer = (id) => {
    const c = customers.find(x => x.id === id);
    if (c) { set("customer_id", id); set("customer_name", c.company_name); }
  };

  const handleDriver = (id) => {
    const d = drivers.find(x => x.id === id);
    if (!d) { set("driver_id",""); set("driver_name",""); return; }
    set("driver_id", id);
    set("driver_name", `${d.first_name} ${d.last_name}`);
    if (d.pay_type === "Per Mile" && form.miles) set("driver_pay", (d.pay_rate * parseFloat(form.miles)).toFixed(2));
    if (d.pay_type === "Per Job") set("driver_pay", d.pay_rate);
    if (d.pay_type === "Percentage" && form.bill_rate) set("driver_pay", (d.pay_rate/100 * parseFloat(form.bill_rate)).toFixed(2));
  };

  const save = async (andBOL=false) => {
    setSaving(true);
    const data = { ...form };
    ["pieces","weight_lbs","miles","bill_rate","driver_pay"].forEach(k => { if (data[k]) data[k] = parseFloat(data[k]); });
    if (data.driver_id) data.status = "Assigned";
    const job = await Job.create(data);
    setSaved(job); setSaving(false);
    if (andBOL) setShowBOL(true);
  };

  if (showBOL && saved) return <BOLView job={saved} onBack={() => setShowBOL(false)} />;

  const margin = (parseFloat(form.bill_rate)||0) - (parseFloat(form.driver_pay)||0);

  return (
    <div style={{ minHeight: "100vh", background: BG, fontFamily: "Source Sans 3, sans-serif", padding: 24 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <a href="/jobs" style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 36, height: 36, borderRadius: 10, border: "1px solid rgba(0,0,0,0.1)", background: "#fff", textDecoration: "none" }}>
          <ArrowLeft size={16} style={{ color: "#6b6b67" }} />
        </a>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
            <img src={SHAMROCK} alt="" style={{ width: 16, height: 16 }} />
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: GREEN, fontFamily: "Barlow, sans-serif" }}>New Order</span>
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: BLACK, margin: 0, fontFamily: "Barlow, sans-serif" }}>Job Entry</h1>
          <p style={{ fontSize: 12, color: "#6b6b67", margin: "2px 0 0" }}>#{form.job_number} · BOL: {form.bol_number}</p>
        </div>
      </div>

      {saved && (
        <div style={{ marginBottom: 20, padding: "14px 18px", borderRadius: 12, background: "#e6f9ee", border: "1px solid rgba(15,161,74,0.25)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontWeight: 600, color: "#166534", fontSize: 14 }}>✓ Job saved successfully!</span>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => { setSaved(null); setForm({...form, job_number: genJobNumber(), bol_number: genBOL()}); }}
              style={{ fontSize: 13, padding: "6px 14px", borderRadius: 8, background: "#fff", border: "1px solid rgba(15,161,74,0.35)", color: GREEN, cursor: "pointer", fontWeight: 600 }}>
              New Job
            </button>
            <button onClick={() => setShowBOL(true)}
              style={{ fontSize: 13, padding: "6px 14px", borderRadius: 8, background: GREEN, color: "#fff", border: "none", cursor: "pointer", fontWeight: 700, display: "flex", alignItems: "center", gap: 6, fontFamily: "Barlow, sans-serif" }}>
              <Printer size={14} />Print BOL
            </button>
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20, maxWidth: 1100 }}>
        {/* Left col (2/3) */}
        <div style={{ gridColumn: "span 2", display: "flex", flexDirection: "column", gap: 20 }}>
          <Card title="Order Details">
            <Grid2>
              <Field label="Customer" span={2}>
                <select className="me-input" value={form.customer_id} onChange={e => handleCustomer(e.target.value)}>
                  <option value="">Select customer…</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.company_name}</option>)}
                </select>
                <p style={{ fontSize: 11, color: "#b0b2b7", marginTop: 4 }}>Don't see them? <a href="/customers" style={{ color: GREEN }}>Add a customer first</a></p>
              </Field>
              <Field label="Service Type">
                <select className="me-input" value={form.service_type} onChange={e => set("service_type", e.target.value)}>
                  {SERVICES.map(s => <option key={s}>{s}</option>)}
                </select>
              </Field>
              <Field label="Reference #">
                <input className="me-input" placeholder="Customer PO / ref" value={form.reference_number} onChange={e => set("reference_number", e.target.value)} />
              </Field>
              <Field label="Ready Time">
                <input className="me-input" type="datetime-local" value={form.ready_time} onChange={e => set("ready_time", e.target.value)} />
              </Field>
              <Field label="Deadline">
                <input className="me-input" type="datetime-local" value={form.deadline} onChange={e => set("deadline", e.target.value)} />
              </Field>
            </Grid2>
          </Card>

          <Card title="📍 Pickup">
            <Grid2>
              <Field label="Street Address" span={2}><input className="me-input" placeholder="Street address" value={form.pickup_address} onChange={e => set("pickup_address", e.target.value)} /></Field>
              <Field label="City"><input className="me-input" placeholder="City" value={form.pickup_city} onChange={e => set("pickup_city", e.target.value)} /></Field>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <Field label="State"><select className="me-input" value={form.pickup_state} onChange={e => set("pickup_state", e.target.value)}>{STATES.map(s => <option key={s}>{s}</option>)}</select></Field>
                <Field label="ZIP"><input className="me-input" placeholder="ZIP" value={form.pickup_zip} onChange={e => set("pickup_zip", e.target.value)} /></Field>
              </div>
              <Field label="Contact"><input className="me-input" value={form.pickup_contact} onChange={e => set("pickup_contact", e.target.value)} /></Field>
              <Field label="Phone"><input className="me-input" value={form.pickup_phone} onChange={e => set("pickup_phone", e.target.value)} /></Field>
            </Grid2>
          </Card>

          <Card title="🎯 Delivery">
            <Grid2>
              <Field label="Street Address" span={2}><input className="me-input" placeholder="Street address" value={form.delivery_address} onChange={e => set("delivery_address", e.target.value)} /></Field>
              <Field label="City"><input className="me-input" placeholder="City" value={form.delivery_city} onChange={e => set("delivery_city", e.target.value)} /></Field>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <Field label="State"><select className="me-input" value={form.delivery_state} onChange={e => set("delivery_state", e.target.value)}>{STATES.map(s => <option key={s}>{s}</option>)}</select></Field>
                <Field label="ZIP"><input className="me-input" placeholder="ZIP" value={form.delivery_zip} onChange={e => set("delivery_zip", e.target.value)} /></Field>
              </div>
              <Field label="Contact"><input className="me-input" value={form.delivery_contact} onChange={e => set("delivery_contact", e.target.value)} /></Field>
              <Field label="Phone"><input className="me-input" value={form.delivery_phone} onChange={e => set("delivery_phone", e.target.value)} /></Field>
            </Grid2>
          </Card>

          <Card title="📦 Freight Details">
            <Grid3>
              <Field label="Pieces"><input className="me-input" type="number" placeholder="0" value={form.pieces} onChange={e => set("pieces", e.target.value)} /></Field>
              <Field label="Weight (lbs)"><input className="me-input" type="number" placeholder="0" value={form.weight_lbs} onChange={e => set("weight_lbs", e.target.value)} /></Field>
              <Field label="Miles"><input className="me-input" type="number" placeholder="0" value={form.miles} onChange={e => set("miles", e.target.value)} /></Field>
            </Grid3>
            <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 12 }}>
              <Field label="Description / Commodity"><input className="me-input" placeholder="What's being shipped?" value={form.description} onChange={e => set("description", e.target.value)} /></Field>
              <Field label="Special Instructions"><textarea className="me-input" rows={2} placeholder="Gate codes, handling notes…" value={form.special_instructions} onChange={e => set("special_instructions", e.target.value)} /></Field>
            </div>
          </Card>
        </div>

        {/* Right sidebar */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <Card title="🚛 Dispatch">
            <Field label="Assign Driver">
              <select className="me-input" value={form.driver_id} onChange={e => handleDriver(e.target.value)}>
                <option value="">Unassigned</option>
                {drivers.map(d => <option key={d.id} value={d.id}>{d.first_name} {d.last_name}</option>)}
              </select>
            </Field>
          </Card>

          <Card title="💰 Rates">
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <Field label="Bill Rate ($)"><input className="me-input" type="number" placeholder="0.00" value={form.bill_rate} onChange={e => set("bill_rate", e.target.value)} /></Field>
              <Field label="Driver Pay ($)"><input className="me-input" type="number" placeholder="0.00" value={form.driver_pay} onChange={e => set("driver_pay", e.target.value)} /></Field>
              {(form.bill_rate || form.driver_pay) && (
                <div style={{ background: BG, borderRadius: 10, padding: "12px 14px" }}>
                  {[["Bill Rate", `$${parseFloat(form.bill_rate||0).toFixed(2)}`, BLACK],
                    ["Driver Pay", `-$${parseFloat(form.driver_pay||0).toFixed(2)}`, "#ef4444"]].map(([l,v,c]) => (
                    <div key={l} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                      <span style={{ color: "#6b6b67" }}>{l}</span><span style={{ fontWeight: 600, color: c }}>{v}</span>
                    </div>
                  ))}
                  <div style={{ borderTop: "1px solid rgba(0,0,0,0.08)", marginTop: 6, paddingTop: 6, display: "flex", justifyContent: "space-between", fontSize: 14, fontWeight: 700 }}>
                    <span style={{ color: BLACK }}>Margin</span>
                    <span style={{ color: margin >= 0 ? GREEN : "#ef4444" }}>${margin.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>
          </Card>

          <Card title="Notes">
            <textarea className="me-input" rows={4} placeholder="Internal notes…" value={form.notes} onChange={e => set("notes", e.target.value)} />
          </Card>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <button onClick={() => save(false)} disabled={saving} style={{ width: "100%", padding: "13px", borderRadius: 12, background: GREEN, color: "#fff", border: "none", fontWeight: 700, fontSize: 15, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontFamily: "Barlow, sans-serif", opacity: saving ? 0.6 : 1 }}>
              <Save size={16} />{saving ? "Saving…" : "Save Job"}
            </button>
            <button onClick={() => save(true)} disabled={saving} style={{ width: "100%", padding: "13px", borderRadius: 12, background: BLACK, color: "#fff", border: "none", fontWeight: 700, fontSize: 15, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontFamily: "Barlow, sans-serif", opacity: saving ? 0.6 : 1 }}>
              <Printer size={16} />Save & Print BOL
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Card({ title, children }) {
  return (
    <div style={{ background: "#fff", borderRadius: 16, border: "1px solid rgba(0,0,0,0.08)", padding: 20, boxShadow: "0 1px 6px rgba(0,0,0,0.04)" }}>
      <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#6b6b67", fontFamily: "Barlow, sans-serif", marginTop: 0, marginBottom: 14 }}>{title}</p>
      {children}
    </div>
  );
}

function Field({ label, children, span }) {
  return (
    <div style={span === 2 ? { gridColumn: "span 2" } : {}}>
      <label style={{ display: "block", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "#6b6b67", marginBottom: 5, fontFamily: "Barlow, sans-serif" }}>{label}</label>
      {children}
    </div>
  );
}

function Grid2({ children }) {
  return <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>{children}</div>;
}
function Grid3({ children }) {
  return <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>{children}</div>;
}

function BOLView({ job, onBack }) {
  return (
    <div style={{ minHeight: "100vh", background: "#fff", padding: "32px", maxWidth: 760, margin: "0 auto", fontFamily: "Source Sans 3, sans-serif" }}>
      <div className="print:hidden" style={{ display: "flex", justifyContent: "space-between", marginBottom: 24 }}>
        <button onClick={onBack} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: "#6b6b67", cursor: "pointer", fontSize: 14, fontWeight: 600 }}>
          <ArrowLeft size={16} />Back
        </button>
        <button onClick={() => window.print()} style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 18px", background: GREEN, color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "Barlow, sans-serif" }}>
          <Printer size={15} />Print BOL
        </button>
      </div>

      <div style={{ border: "2px solid #e0e0e0", borderRadius: 12, overflow: "hidden" }}>
        {/* Green accent */}
        <div style={{ height: 5, background: `linear-gradient(90deg,${GREEN},#009549)` }} />

        {/* Header with real logo */}
        <div style={{ background: BLACK, padding: "20px 28px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <img src={LOGO_HEADER} alt="Mahoney Express" style={{ height: 52, width: "auto" }} />
          <div style={{ textAlign: "right" }}>
            <p style={{ fontSize: 10, color: "#888", margin: 0, textTransform: "uppercase", letterSpacing: "0.12em", fontFamily: "Barlow, sans-serif" }}>Bill of Lading</p>
            <p style={{ fontSize: 22, fontWeight: 800, color: GREEN, margin: "3px 0 0", fontFamily: "Barlow, sans-serif" }}>{job.bol_number}</p>
            <p style={{ fontSize: 11, color: "#888", margin: "3px 0 0" }}>+1 708.955.9082 · accounting@mahoneyexpress.com</p>
          </div>
        </div>

        {/* Job meta */}
        <div style={{ padding: "14px 28px", background: "#f4f4f2", display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, borderBottom: "1px solid #e0e0e0" }}>
          {[["Job Number", job.job_number], ["Service Type", job.service_type], ["Reference #", job.reference_number||"—"],
            ["Ready Time", job.ready_time ? new Date(job.ready_time).toLocaleString() : "—"],
            ["Deadline", job.deadline ? new Date(job.deadline).toLocaleString() : "—"],
            ["Driver", job.driver_name||"Unassigned"]].map(([l,v]) => (
            <div key={l}>
              <p style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.09em", color: "#888", margin: "0 0 3px", fontFamily: "Barlow, sans-serif" }}>{l}</p>
              <p style={{ fontSize: 13, fontWeight: 600, color: BLACK, margin: 0 }}>{v}</p>
            </div>
          ))}
        </div>

        {/* Addresses */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", borderBottom: "1px solid #e0e0e0" }}>
          {[["SHIPPER / PICKUP", job.customer_name, job.pickup_address, job.pickup_city, job.pickup_state, job.pickup_zip, job.pickup_contact, job.pickup_phone],
            ["CONSIGNEE / DELIVERY", null, job.delivery_address, job.delivery_city, job.delivery_state, job.delivery_zip, job.delivery_contact, job.delivery_phone]].map(([title,co,addr,city,state,zip,contact,phone],i) => (
            <div key={i} style={{ padding: "18px 28px", borderRight: i===0 ? "1px solid #e0e0e0" : "none" }}>
              <p style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.09em", color: GREEN, margin: "0 0 8px", fontFamily: "Barlow, sans-serif" }}>{title}</p>
              {co && <p style={{ fontWeight: 700, color: BLACK, margin: "0 0 3px", fontSize: 14 }}>{co}</p>}
              <p style={{ color: "#555", margin: 0, fontSize: 13 }}>{addr}</p>
              <p style={{ color: "#555", margin: 0, fontSize: 13 }}>{city}, {state} {zip}</p>
              {contact && <p style={{ color: "#888", margin: "6px 0 0", fontSize: 12 }}>Attn: {contact}</p>}
              {phone && <p style={{ color: "#888", margin: "2px 0 0", fontSize: 12 }}>📞 {phone}</p>}
            </div>
          ))}
        </div>

        {/* Freight */}
        <div style={{ padding: "18px 28px", borderBottom: "1px solid #e0e0e0" }}>
          <p style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.09em", color: GREEN, margin: "0 0 12px", fontFamily: "Barlow, sans-serif" }}>Freight Details</p>
          <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #e0e0e0" }}>
                {["Pieces","Weight (lbs)","Miles","Description"].map(h => (
                  <th key={h} style={{ textAlign: "left", paddingBottom: 6, color: "#888", fontWeight: 700, fontFamily: "Barlow, sans-serif", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.07em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: "8px 0", fontWeight: 700, color: BLACK }}>{job.pieces||"—"}</td>
                <td style={{ padding: "8px 0", fontWeight: 700, color: BLACK }}>{job.weight_lbs||"—"} lbs</td>
                <td style={{ padding: "8px 0", fontWeight: 700, color: BLACK }}>{job.miles||"—"}</td>
                <td style={{ padding: "8px 0", color: "#555" }}>{job.description||"—"}</td>
              </tr>
            </tbody>
          </table>
          {job.special_instructions && (
            <div style={{ marginTop: 12, padding: "10px 14px", background: "#fffbeb", borderRadius: 8, border: "1px solid rgba(245,158,11,0.3)" }}>
              <p style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#b45309", margin: "0 0 4px", fontFamily: "Barlow, sans-serif" }}>Special Instructions</p>
              <p style={{ fontSize: 13, color: BLACK, margin: 0 }}>{job.special_instructions}</p>
            </div>
          )}
        </div>

        {/* Signatures */}
        <div style={{ padding: "20px 28px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px 48px" }}>
          {["Shipper Signature","Driver Signature","Delivered By","Received By"].map(label => (
            <div key={label}>
              <p style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#888", margin: "0 0 28px", fontFamily: "Barlow, sans-serif" }}>{label}</p>
              <div style={{ borderBottom: "1.5px solid #060204", marginBottom: 5 }} />
              <p style={{ fontSize: 10, color: "#b0b2b7" }}>Signature / Date / Print Name</p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ background: BLACK, padding: "10px 28px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <p style={{ fontSize: 10, color: "#555", margin: 0 }}>1615 N Newland Ave · Chicago, IL 60707</p>
          <p style={{ fontSize: 10, color: GREEN, margin: 0, fontStyle: "italic", fontFamily: "Barlow, sans-serif" }}>When tomorrow's too late!</p>
        </div>
      </div>
    </div>
  );
}
