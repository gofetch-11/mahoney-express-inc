import { useState, useEffect, useRef } from "react";
import { Job, Customer, Driver } from "@/api/entities";
import { Save, Printer, ArrowLeft, Upload, FileText, Loader, X, CheckCircle } from "lucide-react";

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

export default function NewJob() {
  const [customers, setCustomers] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(null);
  const [showBOL, setShowBOL] = useState(false);

  // PDF upload state
  const [pdfState, setPdfState] = useState("idle"); // idle | uploading | success | error
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfMsg, setPdfMsg] = useState("");
  const [filledFields, setFilledFields] = useState([]);
  const pdfRef = useRef();

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

  // ── PDF Upload & Extract ──────────────────────────────────────────────────
  const handlePdfUpload = async (file) => {
    if (!file || !file.name.toLowerCase().endsWith(".pdf")) {
      setPdfMsg("Please upload a PDF file"); setPdfState("error"); return;
    }
    setPdfFile(file);
    setPdfState("uploading");
    setPdfMsg(`Reading ${file.name}…`);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("https://backend.base44.app/api/apps/69cb07fb94b4627f0bd76151/functions/uploadJobPdf", {
        method: "POST", body: fd,
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Extraction failed");

      const p = data.parsed || {};
      const filled = [];

      // Map extracted fields into form — only overwrite if we got something
      const patch = {};
      const trySet = (key, val, label) => {
        if (val !== null && val !== undefined && String(val).trim() !== "") {
          patch[key] = String(val).trim();
          filled.push(label || key);
        }
      };

      trySet("customer_name",    p.customer_name,    "Customer");
      trySet("reference_number", p.reference_number, "Reference #");
      trySet("description",      p.description,      "Description");
      trySet("pickup_address",   p.pickup_address,   "Pickup Address");
      trySet("pickup_city",      p.pickup_city,      "Pickup City");
      trySet("pickup_state",     p.pickup_state,     "Pickup State");
      trySet("pickup_zip",       p.pickup_zip,       "Pickup ZIP");
      trySet("pickup_contact",   p.pickup_contact,   "Pickup Contact");
      trySet("delivery_address", p.delivery_address, "Delivery Address");
      trySet("delivery_city",    p.delivery_city,    "Delivery City");
      trySet("delivery_state",   p.delivery_state,   "Delivery State");
      trySet("delivery_zip",     p.delivery_zip,     "Delivery ZIP");
      trySet("delivery_contact", p.delivery_contact, "Delivery Contact");
      trySet("service_type",     p.service_type,     "Service Type");
      trySet("status",           p.status,           "Status");
      if (p.miles)      { patch.miles      = String(p.miles);      filled.push("Miles"); }
      if (p.pieces)     { patch.pieces     = String(p.pieces);     filled.push("Pieces"); }
      if (p.weight_lbs) { patch.weight_lbs = String(p.weight_lbs); filled.push("Weight"); }
      if (p.ready_time) { patch.ready_time = p.ready_time;         filled.push("Ready Time"); }
      if (p.deadline)   { patch.deadline   = p.deadline;           filled.push("Deadline"); }

      setForm(f => ({ ...f, ...patch }));
      setFilledFields(filled);
      setPdfState("success");
      setPdfMsg(`✓ Extracted ${filled.length} fields from ${file.name}`);
    } catch (e) {
      setPdfState("error");
      setPdfMsg("Could not extract data: " + e.message + " — you can still fill in fields manually.");
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
    <div style={{ minHeight: "100vh", background: BG, fontFamily: "Source Sans 3, sans-serif", padding: 24 }}>
      {/* ── Styles ── */}
      <style>{`
        .me-input { width:100%; padding:8px 10px; border-radius:8px; border:1px solid rgba(0,0,0,0.12); background:#fff; font-size:13px; font-family:"Source Sans 3",sans-serif; outline:none; box-sizing:border-box; color:#111; }
        .me-input:focus { border-color:${GREEN}; box-shadow:0 0 0 3px rgba(15,161,74,0.1); }
        .pdf-drop-zone { border:2px dashed rgba(15,161,74,0.4); border-radius:12px; padding:18px 20px; cursor:pointer; background:rgba(15,161,74,0.03); transition:all 0.2s; display:flex; align-items:center; gap:14px; }
        .pdf-drop-zone:hover { background:rgba(15,161,74,0.08); border-color:${GREEN}; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
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
      </div>

      {/* ── PDF Upload Banner ── */}
      <div style={{ marginBottom: 20 }}>
        <div
          className="pdf-drop-zone"
          onClick={() => pdfState !== "uploading" && pdfRef.current.click()}
          onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handlePdfUpload(f); }}
          onDragOver={e => e.preventDefault()}
        >
          <input ref={pdfRef} type="file" accept=".pdf,application/pdf" style={{ display:"none" }} onChange={e => handlePdfUpload(e.target.files[0])} />

          {pdfState === "idle" && (
            <>
              <div style={{ width:40, height:40, borderRadius:10, background:"rgba(15,161,74,0.12)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                <Upload size={18} style={{ color:GREEN }} />
              </div>
              <div>
                <p style={{ fontFamily:"Barlow, sans-serif", fontWeight:700, color:BLACK, fontSize:14, margin:0 }}>Upload a DHL ticket or shipping PDF</p>
                <p style={{ fontSize:12, color:"#888", margin:"2px 0 0" }}>Drop a PDF here or click to browse — fields will be auto-filled from the document using OCR</p>
              </div>
            </>
          )}

          {pdfState === "uploading" && (
            <>
              <div style={{ width:40, height:40, borderRadius:10, background:"rgba(15,161,74,0.12)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                <Loader size={18} style={{ color:GREEN, animation:"spin 1s linear infinite" }} />
              </div>
              <div>
                <p style={{ fontFamily:"Barlow, sans-serif", fontWeight:700, color:BLACK, fontSize:14, margin:0 }}>Extracting data…</p>
                <p style={{ fontSize:12, color:"#888", margin:"2px 0 0" }}>{pdfMsg}</p>
              </div>
            </>
          )}

          {pdfState === "success" && (
            <>
              <CheckCircle size={36} style={{ color:GREEN, flexShrink:0 }} />
              <div style={{ flex:1 }}>
                <p style={{ fontFamily:"Barlow, sans-serif", fontWeight:700, color:"#166534", fontSize:14, margin:"0 0 4px" }}>{pdfMsg}</p>
                <div style={{ display:"flex", flexWrap:"wrap", gap:"4px 8px" }}>
                  {filledFields.map(f => (
                    <span key={f} style={{ fontSize:11, fontWeight:600, background:"rgba(15,161,74,0.12)", color:GREEN, padding:"2px 8px", borderRadius:6 }}>{f}</span>
                  ))}
                </div>
              </div>
              <button onClick={e => { e.stopPropagation(); setPdfState("idle"); setPdfFile(null); setFilledFields([]); }}
                style={{ flexShrink:0, background:"none", border:"none", cursor:"pointer", color:"#999", padding:4 }}>
                <X size={16} />
              </button>
            </>
          )}

          {pdfState === "error" && (
            <>
              <div style={{ width:40, height:40, borderRadius:10, background:"rgba(239,68,68,0.1)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                <FileText size={18} style={{ color:"#ef4444" }} />
              </div>
              <div style={{ flex:1 }}>
                <p style={{ fontFamily:"Barlow, sans-serif", fontWeight:700, color:"#ef4444", fontSize:14, margin:"0 0 2px" }}>Extraction issue</p>
                <p style={{ fontSize:12, color:"#888", margin:0 }}>{pdfMsg}</p>
              </div>
              <button onClick={e => { e.stopPropagation(); setPdfState("idle"); }}
                style={{ flexShrink:0, background:"none", border:"none", cursor:"pointer", color:"#999", padding:4 }}>
                <X size={16} />
              </button>
            </>
          )}
        </div>
      </div>

      {saved && (
        <div style={{ marginBottom: 20, padding: "14px 18px", borderRadius: 12, background: "#e6f9ee", border: "1px solid rgba(15,161,74,0.25)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontWeight: 600, color: "#166534", fontSize: 14 }}>✓ Job saved successfully!</span>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => { setSaved(null); setPdfState("idle"); setFilledFields([]); setForm({ job_number: genJobNumber(), bol_number: genBOL(), customer_id:"", customer_name:"", service_type:"Rush / Hot Shot", pickup_address:"", pickup_city:"", pickup_state:"IL", pickup_zip:"", pickup_contact:"", pickup_phone:"", delivery_address:"", delivery_city:"", delivery_state:"IL", delivery_zip:"", delivery_contact:"", delivery_phone:"", pieces:"", weight_lbs:"", description:"", special_instructions:"", miles:"", ready_time:"", deadline:"", status:"Pending", driver_id:"", driver_name:"", bill_rate:"", driver_pay:"", reference_number:"", notes:"" }); }}
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
                {!form.customer_id && form.customer_name && (
                  <p style={{ fontSize:11, color:"#f59e0b", marginTop:4 }}>⚠ PDF found "{form.customer_name}" — <a href="/customers" style={{ color:GREEN }}>add them as a customer</a> first, or type below</p>
                )}
                {!form.customer_id && !form.customer_name && (
                  <p style={{ fontSize: 11, color: "#b0b2b7", marginTop: 4 }}>Don't see them? <a href="/customers" style={{ color: GREEN }}>Add a customer first</a></p>
                )}
                {!form.customer_id && (
                  <input className="me-input" placeholder="Or type customer name manually…" value={form.customer_name} onChange={e => set("customer_name", e.target.value)} style={{ marginTop: 6 }} />
                )}
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
            <Grid2>
              <Field label="Description" span={2}><input className="me-input" placeholder="Commodity / contents" value={form.description} onChange={e => set("description", e.target.value)} /></Field>
              <Field label="Pieces"><input className="me-input" type="number" placeholder="0" value={form.pieces} onChange={e => set("pieces", e.target.value)} /></Field>
              <Field label="Weight (lbs)"><input className="me-input" type="number" placeholder="0.0" value={form.weight_lbs} onChange={e => set("weight_lbs", e.target.value)} /></Field>
              <Field label="Miles"><input className="me-input" type="number" placeholder="0" value={form.miles} onChange={e => set("miles", e.target.value)} /></Field>
              <Field label="Special Instructions"><input className="me-input" value={form.special_instructions} onChange={e => set("special_instructions", e.target.value)} /></Field>
            </Grid2>
          </Card>
        </div>

        {/* Right col (1/3) */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <Card title="Driver Assignment">
            <Field label="Assign Driver">
              <select className="me-input" value={form.driver_id} onChange={e => handleDriver(e.target.value)}>
                <option value="">Unassigned</option>
                {drivers.map(d => <option key={d.id} value={d.id}>{d.first_name} {d.last_name}</option>)}
              </select>
            </Field>
          </Card>

          <Card title="Billing">
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <Field label="Bill Rate ($)"><input className="me-input" type="number" placeholder="0.00" value={form.bill_rate} onChange={e => set("bill_rate", e.target.value)} /></Field>
              <Field label="Driver Pay ($)"><input className="me-input" type="number" placeholder="0.00" value={form.driver_pay} onChange={e => set("driver_pay", e.target.value)} /></Field>
              {(form.bill_rate || form.driver_pay) && (
                <div style={{ background: "#f8f8f6", borderRadius: 10, padding: "10px 14px" }}>
                  {[["Bill Rate", `$${parseFloat(form.bill_rate||0).toFixed(2)}`], ["Driver Pay", `$${parseFloat(form.driver_pay||0).toFixed(2)}`]].map(([l,v]) => (
                    <div key={l} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                      <span style={{ color: "#6b6b67" }}>{l}</span><span style={{ fontWeight: 600 }}>{v}</span>
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
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 24 }}>
        <button onClick={onBack} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: "#6b6b67", cursor: "pointer", fontSize: 14, fontWeight: 600 }}>
          <ArrowLeft size={16} />Back
        </button>
        <button onClick={() => window.print()} style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 18px", background: GREEN, color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "Barlow, sans-serif" }}>
          <Printer size={15} />Print BOL
        </button>
      </div>

      <div style={{ border: "2px solid #e0e0e0", borderRadius: 12, overflow: "hidden" }}>
        <div style={{ height: 5, background: `linear-gradient(90deg,${GREEN},#009549)` }} />
        <div style={{ background: BLACK, padding: "20px 28px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <img src={LOGO_HEADER} alt="Mahoney Express" style={{ height: 52, width: "auto" }} />
          <div style={{ textAlign: "right" }}>
            <p style={{ fontSize: 10, color: "#888", margin: 0, textTransform: "uppercase", letterSpacing: "0.12em", fontFamily: "Barlow, sans-serif" }}>Bill of Lading</p>
            <p style={{ fontSize: 22, fontWeight: 800, color: GREEN, margin: "3px 0 0", fontFamily: "Barlow, sans-serif" }}>{job.bol_number}</p>
            <p style={{ fontSize: 11, color: "#888", margin: "3px 0 0" }}>+1 708.955.9082 · accounting@mahoneyexpress.com</p>
          </div>
        </div>
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
        <div style={{ padding: "18px 28px", borderBottom: "1px solid #e0e0e0" }}>
          <p style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.09em", color: GREEN, margin: "0 0 12px", fontFamily: "Barlow, sans-serif" }}>Freight Details</p>
          <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
            <thead><tr style={{ borderBottom: "1px solid #e0e0e0" }}>{["Pieces","Weight (lbs)","Miles","Description"].map(h => (<th key={h} style={{ textAlign: "left", paddingBottom: 6, color: "#888", fontWeight: 700, fontFamily: "Barlow, sans-serif", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.07em" }}>{h}</th>))}</tr></thead>
            <tbody><tr>
              <td style={{ padding: "8px 0", fontWeight: 700, color: BLACK }}>{job.pieces||"—"}</td>
              <td style={{ padding: "8px 0", fontWeight: 700, color: BLACK }}>{job.weight_lbs||"—"} lbs</td>
              <td style={{ padding: "8px 0", fontWeight: 700, color: BLACK }}>{job.miles||"—"}</td>
              <td style={{ padding: "8px 0", color: "#555" }}>{job.description||"—"}</td>
            </tr></tbody>
          </table>
          {job.special_instructions && (
            <div style={{ marginTop: 12, padding: "10px 14px", background: "#fffbeb", borderRadius: 8, border: "1px solid rgba(245,158,11,0.3)" }}>
              <p style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#b45309", margin: "0 0 4px", fontFamily: "Barlow, sans-serif" }}>Special Instructions</p>
              <p style={{ fontSize: 13, color: BLACK, margin: 0 }}>{job.special_instructions}</p>
            </div>
          )}
        </div>
        <div style={{ padding: "20px 28px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px 48px" }}>
          {["Shipper Signature","Driver Signature","Delivered By","Received By"].map(label => (
            <div key={label}>
              <p style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#888", margin: "0 0 28px", fontFamily: "Barlow, sans-serif" }}>{label}</p>
              <div style={{ borderBottom: "1.5px solid #060204", marginBottom: 5 }} />
              <p style={{ fontSize: 10, color: "#b0b2b7" }}>Signature / Date / Print Name</p>
            </div>
          ))}
        </div>
        <div style={{ background: BLACK, padding: "10px 28px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <p style={{ fontSize: 10, color: "#555", margin: 0 }}>1615 N Newland Ave · Chicago, IL 60707</p>
          <p style={{ fontSize: 10, color: GREEN, margin: 0, fontStyle: "italic", fontFamily: "Barlow, sans-serif" }}>When tomorrow's too late!</p>
        </div>
      </div>
      <style>{`@media print { button { display: none !important; } }`}</style>
    </div>
  );
}
