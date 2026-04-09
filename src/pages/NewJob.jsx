import { useState, useEffect } from "react";
import { Job, Customer, Driver } from "@/api/entities";
import { Save, Printer, ArrowLeft, Truck } from "lucide-react";

const GREEN = "#0fa14a";
const BLACK = "#060204";
const BG = "#f4f4f2";
const SERVICES = ["Rush / Hot Shot", "Standard Delivery", "Scheduled", "Airport Run", "Medical / Stat", "Overnight", "Other"];
const STATES = ["AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"];

function genJobNumber() {
  const d = new Date();
  return `ME${d.getFullYear().toString().slice(2)}${String(d.getMonth()+1).padStart(2,"0")}${String(d.getDate()).padStart(2,"0")}-${Math.floor(Math.random()*9000+1000)}`;
}
function genBOL() { return `BOL-${Date.now().toString().slice(-8)}`; }

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
    pickup_address: "", pickup_city: "", pickup_state: "IL", pickup_zip: "", pickup_contact: "", pickup_phone: "",
    delivery_address: "", delivery_city: "", delivery_state: "IL", delivery_zip: "", delivery_contact: "", delivery_phone: "",
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
    if (d) {
      set("driver_id", id);
      set("driver_name", `${d.first_name} ${d.last_name}`);
      if (d.pay_type === "Per Mile" && form.miles) set("driver_pay", (d.pay_rate * parseFloat(form.miles)).toFixed(2));
      if (d.pay_type === "Per Job") set("driver_pay", d.pay_rate);
      if (d.pay_type === "Percentage" && form.bill_rate) set("driver_pay", (d.pay_rate/100 * parseFloat(form.bill_rate)).toFixed(2));
    }
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
    <div className="min-h-screen p-6 max-w-5xl mx-auto" style={{ background: BG, fontFamily: "Source Sans 3, sans-serif" }}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <a href="/jobs" className="p-2 rounded-lg hover:bg-white transition-colors" style={{ border: "1px solid rgba(0,0,0,0.1)" }}>
          <ArrowLeft className="w-4 h-4" style={{ color: "#6b6b67" }} />
        </a>
        <div>
          <div className="flex items-center gap-2">
            <div className="h-0.5 w-5 rounded-full" style={{ background: `linear-gradient(90deg,${GREEN},#009549)` }} />
            <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: GREEN, fontFamily: "Barlow, sans-serif" }}>New Order</p>
          </div>
          <h1 className="text-xl font-bold" style={{ color: BLACK, fontFamily: "Barlow, sans-serif" }}>Job Entry</h1>
          <p className="text-xs" style={{ color: "#6b6b67" }}>Job #{form.job_number} · BOL: {form.bol_number}</p>
        </div>
      </div>

      {saved && (
        <div className="mb-5 p-4 rounded-xl flex items-center justify-between" style={{ background: "#e6f9ee", border: "1px solid rgba(15,161,74,0.25)" }}>
          <span className="font-semibold text-sm" style={{ color: "#166534" }}>✓ Job saved successfully!</span>
          <div className="flex gap-2">
            <button onClick={() => { setSaved(null); setForm({...form, job_number: genJobNumber(), bol_number: genBOL()}); }}
              className="text-sm px-3 py-1.5 rounded-lg font-semibold" style={{ background: "#fff", border: "1px solid rgba(15,161,74,0.3)", color: GREEN }}>
              New Job
            </button>
            <button onClick={() => setShowBOL(true)}
              className="text-sm px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5" style={{ background: GREEN, color: "#fff" }}>
              <Printer className="w-3.5 h-3.5" />Print BOL
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left */}
        <div className="lg:col-span-2 space-y-5">
          <Section title="Order Details">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="me-label">Customer</label>
                <select className="me-input" value={form.customer_id} onChange={e => handleCustomer(e.target.value)}>
                  <option value="">Select customer…</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.company_name}</option>)}
                </select>
                <p className="text-xs mt-1" style={{ color: "#b0b2b7" }}>Don't see them? <a href="/customers" style={{ color: GREEN }}>Add a customer first</a></p>
              </div>
              <div>
                <label className="me-label">Service Type</label>
                <select className="me-input" value={form.service_type} onChange={e => set("service_type", e.target.value)}>
                  {SERVICES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="me-label">Reference #</label>
                <input className="me-input" placeholder="Customer PO / ref" value={form.reference_number} onChange={e => set("reference_number", e.target.value)} />
              </div>
              <div>
                <label className="me-label">Ready Time</label>
                <input className="me-input" type="datetime-local" value={form.ready_time} onChange={e => set("ready_time", e.target.value)} />
              </div>
              <div>
                <label className="me-label">Deadline</label>
                <input className="me-input" type="datetime-local" value={form.deadline} onChange={e => set("deadline", e.target.value)} />
              </div>
            </div>
          </Section>

          <Section title="📍 Pickup">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2"><label className="me-label">Address</label><input className="me-input" placeholder="Street address" value={form.pickup_address} onChange={e => set("pickup_address", e.target.value)} /></div>
              <div><label className="me-label">City</label><input className="me-input" placeholder="City" value={form.pickup_city} onChange={e => set("pickup_city", e.target.value)} /></div>
              <div className="grid grid-cols-2 gap-2">
                <div><label className="me-label">State</label><select className="me-input" value={form.pickup_state} onChange={e => set("pickup_state", e.target.value)}>{STATES.map(s => <option key={s}>{s}</option>)}</select></div>
                <div><label className="me-label">ZIP</label><input className="me-input" placeholder="ZIP" value={form.pickup_zip} onChange={e => set("pickup_zip", e.target.value)} /></div>
              </div>
              <div><label className="me-label">Contact</label><input className="me-input" value={form.pickup_contact} onChange={e => set("pickup_contact", e.target.value)} /></div>
              <div><label className="me-label">Phone</label><input className="me-input" value={form.pickup_phone} onChange={e => set("pickup_phone", e.target.value)} /></div>
            </div>
          </Section>

          <Section title="🎯 Delivery">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2"><label className="me-label">Address</label><input className="me-input" placeholder="Street address" value={form.delivery_address} onChange={e => set("delivery_address", e.target.value)} /></div>
              <div><label className="me-label">City</label><input className="me-input" placeholder="City" value={form.delivery_city} onChange={e => set("delivery_city", e.target.value)} /></div>
              <div className="grid grid-cols-2 gap-2">
                <div><label className="me-label">State</label><select className="me-input" value={form.delivery_state} onChange={e => set("delivery_state", e.target.value)}>{STATES.map(s => <option key={s}>{s}</option>)}</select></div>
                <div><label className="me-label">ZIP</label><input className="me-input" placeholder="ZIP" value={form.delivery_zip} onChange={e => set("delivery_zip", e.target.value)} /></div>
              </div>
              <div><label className="me-label">Contact</label><input className="me-input" value={form.delivery_contact} onChange={e => set("delivery_contact", e.target.value)} /></div>
              <div><label className="me-label">Phone</label><input className="me-input" value={form.delivery_phone} onChange={e => set("delivery_phone", e.target.value)} /></div>
            </div>
          </Section>

          <Section title="📦 Freight">
            <div className="grid grid-cols-3 gap-4">
              <div><label className="me-label">Pieces</label><input className="me-input" type="number" placeholder="0" value={form.pieces} onChange={e => set("pieces", e.target.value)} /></div>
              <div><label className="me-label">Weight (lbs)</label><input className="me-input" type="number" placeholder="0" value={form.weight_lbs} onChange={e => set("weight_lbs", e.target.value)} /></div>
              <div><label className="me-label">Miles</label><input className="me-input" type="number" placeholder="0" value={form.miles} onChange={e => set("miles", e.target.value)} /></div>
              <div className="col-span-3"><label className="me-label">Description / Commodity</label><input className="me-input" placeholder="What's being shipped?" value={form.description} onChange={e => set("description", e.target.value)} /></div>
              <div className="col-span-3"><label className="me-label">Special Instructions</label><textarea className="me-input" rows={2} placeholder="Gate codes, handling notes…" value={form.special_instructions} onChange={e => set("special_instructions", e.target.value)} /></div>
            </div>
          </Section>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-5">
          <Section title="🚛 Dispatch">
            <label className="me-label">Assign Driver</label>
            <select className="me-input" value={form.driver_id} onChange={e => handleDriver(e.target.value)}>
              <option value="">Unassigned</option>
              {drivers.map(d => <option key={d.id} value={d.id}>{d.first_name} {d.last_name}</option>)}
            </select>
          </Section>

          <Section title="💰 Rates">
            <div className="space-y-3">
              <div><label className="me-label">Bill Rate ($)</label><input className="me-input" type="number" placeholder="0.00" value={form.bill_rate} onChange={e => set("bill_rate", e.target.value)} /></div>
              <div><label className="me-label">Driver Pay ($)</label><input className="me-input" type="number" placeholder="0.00" value={form.driver_pay} onChange={e => set("driver_pay", e.target.value)} /></div>
              {(form.bill_rate || form.driver_pay) && (
                <div className="rounded-xl p-3" style={{ background: BG }}>
                  <div className="flex justify-between text-sm mb-1"><span style={{ color: "#6b6b67" }}>Bill Rate</span><span className="font-semibold" style={{ color: BLACK }}>${parseFloat(form.bill_rate||0).toFixed(2)}</span></div>
                  <div className="flex justify-between text-sm mb-1"><span style={{ color: "#6b6b67" }}>Driver Pay</span><span className="font-semibold" style={{ color: "#ef4444" }}>-${parseFloat(form.driver_pay||0).toFixed(2)}</span></div>
                  <div className="flex justify-between text-sm font-bold pt-2" style={{ borderTop: "1px solid rgba(0,0,0,0.08)" }}>
                    <span style={{ color: BLACK }}>Margin</span>
                    <span style={{ color: margin >= 0 ? GREEN : "#ef4444" }}>${margin.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>
          </Section>

          <Section title="Notes">
            <textarea className="me-input" rows={4} placeholder="Internal notes…" value={form.notes} onChange={e => set("notes", e.target.value)} />
          </Section>

          <div className="space-y-2">
            <button onClick={() => save(false)} disabled={saving} className="w-full py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-colors" style={{ background: GREEN, fontFamily: "Barlow, sans-serif", opacity: saving ? 0.6 : 1 }}>
              <Save className="w-4 h-4" />{saving ? "Saving…" : "Save Job"}
            </button>
            <button onClick={() => save(true)} disabled={saving} className="w-full py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-colors" style={{ background: BLACK, fontFamily: "Barlow, sans-serif", opacity: saving ? 0.6 : 1 }}>
              <Printer className="w-4 h-4" />Save & Print BOL
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="rounded-2xl p-5" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)", boxShadow: "0 1px 8px rgba(0,0,0,0.04)" }}>
      <h3 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "#6b6b67", fontFamily: "Barlow, sans-serif" }}>{title}</h3>
      {children}
    </div>
  );
}

function BOLView({ job, onBack }) {
  return (
    <div className="min-h-screen bg-white p-8 max-w-3xl mx-auto" style={{ fontFamily: "Source Sans 3, sans-serif" }}>
      <div className="flex justify-between mb-6 print:hidden">
        <button onClick={onBack} className="flex items-center gap-2 text-sm font-semibold" style={{ color: "#6b6b67" }}><ArrowLeft className="w-4 h-4" />Back</button>
        <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-bold" style={{ background: GREEN, fontFamily: "Barlow, sans-serif" }}><Printer className="w-4 h-4" />Print BOL</button>
      </div>

      <div style={{ border: "2px solid #060204", borderRadius: 12, overflow: "hidden" }}>
        {/* Green accent strip */}
        <div style={{ height: 4, background: `linear-gradient(90deg,${GREEN},#009549)` }} />
        {/* Header */}
        <div style={{ background: BLACK, padding: "20px 28px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h1 style={{ fontFamily: "Barlow, sans-serif", fontSize: 22, fontWeight: 800, color: "#fff", margin: 0, letterSpacing: "0.01em" }}>MAHONEY EXPRESS, INC.</h1>
            <p style={{ fontSize: 12, color: "#b0b2b7", margin: "4px 0 0" }}>Time-Critical Messenger & Delivery Services</p>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ fontSize: 10, color: "#b0b2b7", margin: 0, textTransform: "uppercase", letterSpacing: "0.1em" }}>Bill of Lading</p>
            <p style={{ fontFamily: "Barlow, sans-serif", fontSize: 20, fontWeight: 800, color: GREEN, margin: "2px 0 0" }}>{job.bol_number}</p>
          </div>
        </div>

        {/* Job Info */}
        <div style={{ padding: "16px 28px", background: "#f4f4f2", display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, borderBottom: "1px solid rgba(0,0,0,0.1)" }}>
          {[["Job Number", job.job_number], ["Service Type", job.service_type], ["Reference #", job.reference_number||"—"], ["Ready Time", job.ready_time ? new Date(job.ready_time).toLocaleString() : "—"], ["Deadline", job.deadline ? new Date(job.deadline).toLocaleString() : "—"], ["Driver", job.driver_name||"Unassigned"]].map(([l,v]) => (
            <div key={l}><p style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", color: "#6b6b67", fontFamily: "Barlow, sans-serif", margin: "0 0 2px" }}>{l}</p><p style={{ fontSize: 13, fontWeight: 600, color: BLACK, margin: 0 }}>{v}</p></div>
          ))}
        </div>

        {/* Addresses */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", borderBottom: "1px solid rgba(0,0,0,0.1)" }}>
          {[["SHIPPER / PICKUP", job.customer_name, job.pickup_address, job.pickup_city, job.pickup_state, job.pickup_zip, job.pickup_contact, job.pickup_phone],
            ["CONSIGNEE / DELIVERY", null, job.delivery_address, job.delivery_city, job.delivery_state, job.delivery_zip, job.delivery_contact, job.delivery_phone]].map(([title, company, addr, city, state, zip, contact, phone], idx) => (
            <div key={idx} style={{ padding: "20px 28px", borderRight: idx===0 ? "1px solid rgba(0,0,0,0.1)" : "none" }}>
              <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: GREEN, fontFamily: "Barlow, sans-serif", margin: "0 0 8px" }}>{title}</p>
              {company && <p style={{ fontSize: 14, fontWeight: 700, color: BLACK, margin: "0 0 4px" }}>{company}</p>}
              <p style={{ fontSize: 13, color: "#6b6b67", margin: 0 }}>{addr}</p>
              <p style={{ fontSize: 13, color: "#6b6b67", margin: 0 }}>{city}, {state} {zip}</p>
              {contact && <p style={{ fontSize: 12, color: "#b0b2b7", margin: "6px 0 0" }}>Attn: {contact}</p>}
              {phone && <p style={{ fontSize: 12, color: "#b0b2b7", margin: "2px 0 0" }}>📞 {phone}</p>}
            </div>
          ))}
        </div>

        {/* Freight */}
        <div style={{ padding: "20px 28px", borderBottom: "1px solid rgba(0,0,0,0.1)" }}>
          <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: GREEN, fontFamily: "Barlow, sans-serif", margin: "0 0 12px" }}>Freight Details</p>
          <table style={{ width: "100%", fontSize: 13 }}>
            <thead><tr style={{ borderBottom: "1px solid rgba(0,0,0,0.1)" }}>
              {["Pieces","Weight (lbs)","Miles","Description"].map(h => <th key={h} style={{ textAlign:"left", paddingBottom: 6, color:"#6b6b67", fontWeight:600, fontFamily:"Barlow,sans-serif", fontSize:11, textTransform:"uppercase", letterSpacing:"0.06em" }}>{h}</th>)}
            </tr></thead>
            <tbody><tr>
              <td style={{ padding:"8px 0", fontWeight:700, color:BLACK }}>{job.pieces||"—"}</td>
              <td style={{ padding:"8px 0", fontWeight:700, color:BLACK }}>{job.weight_lbs||"—"}</td>
              <td style={{ padding:"8px 0", fontWeight:700, color:BLACK }}>{job.miles||"—"}</td>
              <td style={{ padding:"8px 0", color:"#6b6b67" }}>{job.description||"—"}</td>
            </tr></tbody>
          </table>
          {job.special_instructions && (
            <div style={{ marginTop:12, padding:"10px 14px", background:"#fff8e1", borderRadius:8, border:"1px solid rgba(245,158,11,0.3)" }}>
              <p style={{ fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.07em", color:"#b45309", margin:"0 0 4px" }}>Special Instructions</p>
              <p style={{ fontSize:13, color:BLACK, margin:0 }}>{job.special_instructions}</p>
            </div>
          )}
        </div>

        {/* Signatures */}
        <div style={{ padding:"20px 28px", display:"grid", gridTemplateColumns:"1fr 1fr", gap:32 }}>
          {["Shipper Signature","Driver Signature","Delivered By","Received By"].map(label => (
            <div key={label}>
              <p style={{ fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.07em", color:"#6b6b67", fontFamily:"Barlow,sans-serif", marginBottom:28 }}>{label}</p>
              <div style={{ borderBottom:"1px solid #060204", marginBottom:4 }} />
              <p style={{ fontSize:10, color:"#b0b2b7" }}>Signature / Date</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
