import { useState, useEffect, useRef } from "react";
import { Job, Driver, Customer, Invoice } from "@/api/entities";
import { ChevronDown } from "lucide-react";
import { Plus, Search, Package, Upload, X, CheckCircle, AlertCircle, FileText, Download } from "lucide-react";

const GREEN="#0fa14a"; const BG="#0e1012"; const SURFACE="#161a1d"; const SURFACE2="#1e2328";
const BORDER="rgba(255,255,255,0.07)"; const TEXT="#f0f0ee"; const MUTED="#8a8a85";

const STATUS_CFG = {
  All:          { bg:"rgba(255,255,255,0.07)", text:"#8a8a85" },
  Pending:      { bg:"rgba(245,158,11,0.15)",  text:"#fbbf24" },
  Assigned:     { bg:"rgba(59,130,246,0.15)",  text:"#60a5fa" },
  "In Transit": { bg:"rgba(139,92,246,0.15)",  text:"#a78bfa" },
  Delivered:    { bg:"rgba(15,161,74,0.15)",   text:"#4ade80" },
  Cancelled:    { bg:"rgba(239,68,68,0.15)",   text:"#f87171" },
};

const fmt = (n) => n!=null ? new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format(n) : "—";
const card = { background:SURFACE, border:`1px solid ${BORDER}`, borderRadius:16, boxShadow:"0 2px 12px rgba(0,0,0,0.3)" };

// CSV column map — flexible header matching
const COL_MAP = {
  job_number:       ["job #","job#","job number","order #","order number","job_number"],
  customer_name:    ["customer","customer name","client","customer_name","bill to"],
  service_type:     ["service","service type","type","service_type"],
  pickup_address:   ["pickup address","pickup addr","pick up address","from address","pickup_address"],
  pickup_city:      ["pickup city","pick up city","from city","pickup_city","origin city"],
  pickup_state:     ["pickup state","pick up state","from state","pickup_state","origin state"],
  pickup_zip:       ["pickup zip","pick up zip","pickup_zip","from zip"],
  pickup_contact:   ["pickup contact","pickup_contact","from contact"],
  pickup_phone:     ["pickup phone","pickup_phone","from phone"],
  delivery_address: ["delivery address","delivery addr","deliver to","delivery_address","to address"],
  delivery_city:    ["delivery city","deliver city","to city","delivery_city","dest city"],
  delivery_state:   ["delivery state","deliver state","to state","delivery_state","dest state"],
  delivery_zip:     ["delivery zip","delivery_zip","to zip"],
  delivery_contact: ["delivery contact","delivery_contact","to contact"],
  delivery_phone:   ["delivery phone","delivery_phone","to phone"],
  pieces:           ["pieces","pkgs","packages","pcs","qty"],
  weight_lbs:       ["weight","weight lbs","weight_lbs","lbs"],
  description:      ["description","commodity","contents","freight","desc"],
  miles:            ["miles","distance"],
  ready_time:       ["ready","ready time","pickup time","ready_time"],
  deadline:         ["deadline","due","deliver by","deadline"],
  bill_rate:        ["bill rate","bill","rate","charge","bill_rate","amount"],
  driver_pay:       ["driver pay","pay","driver_pay","cost"],
  reference_number: ["reference","ref #","ref number","reference_number","bol"],
  special_instructions: ["notes","special instructions","instructions","special_instructions"],
  status:           ["status"],
};

function matchHeader(h) {
  const lower = h.toLowerCase().trim();
  for (const [field, aliases] of Object.entries(COL_MAP)) {
    if (aliases.includes(lower)) return field;
  }
  return null;
}

function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) throw new Error("File must have a header row and at least one data row");
  const headers = lines[0].split(",").map(h => h.replace(/^"|"$/g, "").trim());
  const fieldMap = headers.map(matchHeader);
  return lines.slice(1).map(line => {
    const cols = line.match(/(".*?"|[^,]+|(?<=,)(?=,)|^(?=,)|(?<=,)$)/g) || line.split(",");
    const clean = cols.map(c => c.replace(/^"|"$/g, "").trim());
    const row = {};
    fieldMap.forEach((field, i) => {
      if (field && clean[i] !== undefined && clean[i] !== "") row[field] = clean[i];
    });
    return row;
  }).filter(r => Object.keys(r).length > 0);
}

function generateJobNumber() {
  return "J" + Date.now().toString().slice(-7);
}

const TEMPLATE_CSV = `job_number,customer_name,service_type,pickup_address,pickup_city,pickup_state,pickup_zip,pickup_contact,pickup_phone,delivery_address,delivery_city,delivery_state,delivery_zip,delivery_contact,delivery_phone,pieces,weight_lbs,description,miles,ready_time,deadline,bill_rate,driver_pay,reference_number,status
J1001,Acme Corp,Rush / Hot Shot,123 Main St,Chicago,IL,60601,John Smith,312-555-0101,456 Oak Ave,Indianapolis,IN,46221,Jane Doe,317-555-0202,3,45.5,Medical Samples,180,09:00 AM,02:00 PM,285,175,REF-001,Pending
J1002,Pfizer Inc,Standard,789 Elm St,Naperville,IL,60563,Bob Jones,630-555-0303,321 Pine Rd,Madison,WI,53704,Alice Wu,608-555-0404,1,12.0,Lab Equipment,120,08:00 AM,12:00 PM,220,140,REF-002,Pending`;

export default function Jobs() {
  const [jobs, setJobs] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [editJob, setEditJob] = useState(null);
  const [showImport, setShowImport] = useState(false);

  useEffect(() => { loadJobs(); }, []);
  useEffect(() => {
    let f = jobs;
    if (statusFilter !== "All") f = f.filter(j => j.status === statusFilter);
    if (search) { const q=search.toLowerCase(); f=f.filter(j=>["job_number","customer_name","driver_name","pickup_city","delivery_city"].some(k=>(j[k]||"").toLowerCase().includes(q))); }
    setFiltered(f);
  }, [jobs, search, statusFilter]);

  async function loadJobs() {
    const data = await Job.list();
    setJobs(data.sort((a,b)=>new Date(b.created_date)-new Date(a.created_date)));
    setLoading(false);
  }

  async function updateJobStatus(jobId, newStatus) {
    await Job.update(jobId, { status: newStatus });
    setJobs(prev => prev.map(j => j.id === jobId ? { ...j, status: newStatus } : j));
  }

  const counts = Object.keys(STATUS_CFG).reduce((acc,s) => { acc[s]=s==="All"?jobs.length:jobs.filter(j=>j.status===s).length; return acc; }, {});

  const downloadTemplate = () => {
    const blob = new Blob([TEMPLATE_CSV], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "jobs_import_template.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ minHeight:"100vh", background:BG, fontFamily:"Source Sans 3, sans-serif", padding:24 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:24, flexWrap:"wrap", gap:12 }}>
        <div>
          <p style={{ fontSize:11, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", color:GREEN, fontFamily:"Barlow, sans-serif", margin:"0 0 2px" }}>Order Management</p>
          <h1 style={{ fontSize:20, fontWeight:800, color:TEXT, margin:0, fontFamily:"Barlow, sans-serif" }}>Jobs</h1>
          <p style={{ fontSize:13, color:MUTED, margin:"2px 0 0" }}>{jobs.length} total orders</p>
        </div>
        <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
          <button onClick={downloadTemplate} style={{ display:"flex", alignItems:"center", gap:7, padding:"10px 16px", background:"transparent", color:MUTED, border:`1px solid ${BORDER}`, borderRadius:12, fontWeight:700, fontSize:13, cursor:"pointer", fontFamily:"Barlow, sans-serif" }}>
            <Download size={14}/>Template
          </button>
          <button onClick={()=>setShowImport(true)} style={{ display:"flex", alignItems:"center", gap:7, padding:"10px 16px", background:"rgba(15,161,74,0.12)", color:GREEN, border:`1px solid rgba(15,161,74,0.3)`, borderRadius:12, fontWeight:700, fontSize:13, cursor:"pointer", fontFamily:"Barlow, sans-serif" }}>
            <Upload size={14}/>Import Orders
          </button>
          <a href="/new-job" style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 18px", background:GREEN, color:"#fff", border:"none", borderRadius:12, fontWeight:700, fontSize:13, textDecoration:"none", fontFamily:"Barlow, sans-serif" }}>
            <Plus size={14}/>New Job
          </a>
        </div>
      </div>

      {/* Status Tabs */}
      <div style={{ display:"flex", gap:8, marginBottom:16, flexWrap:"wrap" }}>
        {Object.keys(STATUS_CFG).map(s => {
          const active = statusFilter === s;
          const cfg = STATUS_CFG[s];
          return (
            <button key={s} onClick={() => setStatusFilter(s)} style={{ padding:"6px 14px", borderRadius:8, fontSize:13, fontWeight:700, cursor:"pointer", background:active?cfg.bg:"transparent", color:active?cfg.text:MUTED, border:`1px solid ${active?cfg.text:BORDER}`, fontFamily:"Barlow, sans-serif", transition:"all 0.15s" }}>
              {s} <span style={{ opacity:0.6 }}>{counts[s]}</span>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div style={{ position:"relative", marginBottom:16 }}>
        <Search size={15} style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", color:MUTED }} />
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search job #, customer, driver, city…"
          style={{ width:"100%", padding:"10px 12px 10px 36px", background:SURFACE, border:`1px solid ${BORDER}`, borderRadius:12, color:TEXT, fontSize:13, outline:"none", boxSizing:"border-box" }} />
      </div>

      {loading ? (
        <div style={{ textAlign:"center", padding:48, color:MUTED }}>Loading…</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign:"center", padding:64, color:MUTED }}>
          <Package size={32} style={{ marginBottom:10, opacity:0.3 }} />
          <p>No jobs found.</p>
          <a href="/new-job" style={{ color:GREEN, fontWeight:600, textDecoration:"none" }}>Create one →</a>
        </div>
      ) : (
        <div style={{ ...card, overflow:"hidden" }}>
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
              <thead>
                <tr style={{ background:"#060204", borderBottom:`2px solid ${GREEN}` }}>
                  {["Job #","Customer","Route","Driver","Status","Bill","Pay","Margin",""].map(h=>(
                    <th key={h} style={{ textAlign:"left", padding:"10px 16px", fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.07em", color:h===""?GREEN:"#888", fontFamily:"Barlow, sans-serif", whiteSpace:"nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((job,i) => {
                  const sc = STATUS_CFG[job.status]||STATUS_CFG.Pending;
                  const margin = (job.bill_rate||0)-(job.driver_pay||0);
                  return (
                    <tr key={job.id} style={{ background:i%2===0?SURFACE:SURFACE2, borderBottom:`1px solid ${BORDER}` }}>
                      <td style={{ padding:"12px 16px" }}><span style={{ fontFamily:"monospace", fontWeight:700, fontSize:12, color:GREEN }}>{job.job_number||job.id.slice(0,8)}</span></td>
                      <td style={{ padding:"12px 16px", fontWeight:600, color:TEXT }}>{job.customer_name||"—"}</td>
                      <td style={{ padding:"12px 16px", fontSize:12, color:MUTED }}>{job.pickup_city||"?"} → {job.delivery_city||"?"}</td>
                      <td style={{ padding:"12px 16px", color:job.driver_name?MUTED:"#fbbf24", fontSize:13 }}>{job.driver_name||"Unassigned"}</td>
                      <td style={{ padding:"12px 16px" }}>
                        <StatusPicker job={job} onUpdate={updateJobStatus} />
                      </td>
                      <td style={{ padding:"12px 16px", fontWeight:700, color:TEXT, fontFamily:"Barlow, sans-serif" }}>{fmt(job.bill_rate)}</td>
                      <td style={{ padding:"12px 16px", color:"#f87171" }}>{fmt(job.driver_pay)}</td>
                      <td style={{ padding:"12px 16px", fontWeight:700, fontFamily:"Barlow, sans-serif", color:margin>=0?GREEN:"#f87171" }}>{fmt(margin)}</td>
                      <td style={{ padding:"12px 16px" }}><button onClick={()=>setEditJob(job)} style={{ fontSize:12, fontWeight:700, color:"#60a5fa", background:"none", border:"none", cursor:"pointer" }}>Edit</button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{ padding:"10px 16px", fontSize:11, color:MUTED, borderTop:`1px solid ${BORDER}` }}>Showing {filtered.length} of {jobs.length} jobs</div>
        </div>
      )}

      {editJob && <EditJobModal job={editJob} onClose={()=>{setEditJob(null);loadJobs();}} />}
      {showImport && <ImportModal onClose={()=>{setShowImport(false);loadJobs();}} />}
    </div>
  );
}

// ── Import Modal ─────────────────────────────────────────────────────────────
function ImportModal({ onClose }) {
  const [step, setStep] = useState("upload"); // upload | preview | importing | done
  const [rows, setRows] = useState([]);
  const [errors, setErrors] = useState([]);
  const [fileName, setFileName] = useState("");
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [imported, setImported] = useState(0);
  const [failed, setFailed] = useState(0);
  const fileRef = useRef();

  const handleFile = async (file) => {
    if (!file) return;
    setFileName(file.name);
    const text = await file.text();
    try {
      const parsed = parseCSV(text);
      const errs = [];
      parsed.forEach((r, i) => {
        if (!r.customer_name && !r.job_number) errs.push(`Row ${i+2}: missing customer name or job number`);
      });
      setRows(parsed);
      setErrors(errs);
      setStep("preview");
    } catch (e) {
      setErrors([e.message]);
      setStep("preview");
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const runImport = async () => {
    setStep("importing");
    setImporting(true);
    let ok = 0, fail = 0;
    for (let i = 0; i < rows.length; i++) {
      try {
        const r = rows[i];
        await Job.create({
          job_number: r.job_number || generateJobNumber(),
          customer_name: r.customer_name || "",
          service_type: r.service_type || "Rush / Hot Shot",
          pickup_address: r.pickup_address || "",
          pickup_city: r.pickup_city || "",
          pickup_state: r.pickup_state || "",
          pickup_zip: r.pickup_zip || "",
          pickup_contact: r.pickup_contact || "",
          pickup_phone: r.pickup_phone || "",
          delivery_address: r.delivery_address || "",
          delivery_city: r.delivery_city || "",
          delivery_state: r.delivery_state || "",
          delivery_zip: r.delivery_zip || "",
          delivery_contact: r.delivery_contact || "",
          delivery_phone: r.delivery_phone || "",
          pieces: r.pieces ? parseInt(r.pieces) : null,
          weight_lbs: r.weight_lbs ? parseFloat(r.weight_lbs) : null,
          description: r.description || "",
          miles: r.miles ? parseFloat(r.miles) : null,
          ready_time: r.ready_time || "",
          deadline: r.deadline || "",
          bill_rate: r.bill_rate ? parseFloat(r.bill_rate) : null,
          driver_pay: r.driver_pay ? parseFloat(r.driver_pay) : null,
          reference_number: r.reference_number || "",
          special_instructions: r.special_instructions || "",
          status: r.status || "Pending",
        });
        ok++;
      } catch { fail++; }
      setProgress(Math.round(((i + 1) / rows.length) * 100));
      setImported(ok);
      setFailed(fail);
    }
    setImporting(false);
    setStep("done");
  };

  const overlayStyle = { position:"fixed", inset:0, background:"rgba(0,0,0,0.75)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:60, padding:16 };
  const modalStyle = { background:SURFACE, border:`1px solid ${BORDER}`, borderRadius:20, boxShadow:"0 8px 40px rgba(0,0,0,0.6)", width:"100%", maxWidth:680, maxHeight:"85vh", display:"flex", flexDirection:"column" };

  return (
    <div style={overlayStyle} onClick={e => e.target === e.currentTarget && step !== "importing" && onClose()}>
      <div style={modalStyle}>
        {/* Header */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"18px 24px", borderBottom:`1px solid ${BORDER}`, flexShrink:0 }}>
          <div>
            <h2 style={{ fontFamily:"Barlow, sans-serif", fontWeight:800, color:TEXT, margin:0, fontSize:18 }}>Import Orders</h2>
            <p style={{ color:MUTED, fontSize:12, margin:"2px 0 0" }}>Bulk import jobs from a CSV file</p>
          </div>
          {step !== "importing" && <button onClick={onClose} style={{ color:MUTED, background:"none", border:"none", cursor:"pointer", fontSize:20, lineHeight:1 }}>✕</button>}
        </div>

        <div style={{ overflowY:"auto", flex:1, padding:"20px 24px" }}>

          {/* STEP: Upload */}
          {step === "upload" && (
            <div>
              <div
                onDrop={handleDrop} onDragOver={e=>e.preventDefault()}
                onClick={() => fileRef.current.click()}
                style={{ border:`2px dashed rgba(15,161,74,0.35)`, borderRadius:16, padding:"48px 24px", textAlign:"center", cursor:"pointer", background:"rgba(15,161,74,0.04)", transition:"all 0.2s" }}
                onMouseEnter={e => e.currentTarget.style.background="rgba(15,161,74,0.08)"}
                onMouseLeave={e => e.currentTarget.style.background="rgba(15,161,74,0.04)"}
              >
                <Upload size={36} style={{ color:GREEN, marginBottom:12, opacity:0.7 }} />
                <p style={{ fontFamily:"Barlow, sans-serif", fontWeight:700, color:TEXT, fontSize:16, margin:"0 0 6px" }}>Drop your CSV file here</p>
                <p style={{ color:MUTED, fontSize:13, margin:"0 0 16px" }}>or click to browse · .csv files only</p>
                <input ref={fileRef} type="file" accept=".csv,text/csv" style={{ display:"none" }} onChange={e=>handleFile(e.target.files[0])} />
                <span style={{ fontSize:12, color:GREEN, fontWeight:600, background:"rgba(15,161,74,0.1)", padding:"6px 14px", borderRadius:8 }}>Choose File</span>
              </div>

              {/* Supported columns */}
              <div style={{ marginTop:20, background:SURFACE2, borderRadius:12, padding:16, border:`1px solid ${BORDER}` }}>
                <p style={{ fontFamily:"Barlow, sans-serif", fontWeight:700, fontSize:12, textTransform:"uppercase", letterSpacing:"0.07em", color:MUTED, margin:"0 0 10px" }}>Supported Columns</p>
                <div style={{ display:"flex", flexWrap:"wrap", gap:"6px 12px", fontSize:11 }}>
                  {Object.keys(COL_MAP).map(f => (
                    <span key={f} style={{ fontFamily:"monospace", color:GREEN, background:"rgba(15,161,74,0.08)", padding:"2px 7px", borderRadius:4 }}>{f}</span>
                  ))}
                </div>
                <p style={{ color:MUTED, fontSize:11, margin:"10px 0 0" }}>Column headers are flexible — common variations are automatically recognized. Download the template to get started quickly.</p>
              </div>
            </div>
          )}

          {/* STEP: Preview */}
          {step === "preview" && (
            <div>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
                <FileText size={18} style={{ color:GREEN }} />
                <span style={{ fontWeight:700, color:TEXT }}>{fileName}</span>
                <span style={{ fontSize:12, color:MUTED }}>· {rows.length} rows detected</span>
              </div>

              {errors.length > 0 && (
                <div style={{ background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.2)", borderRadius:10, padding:"12px 16px", marginBottom:16 }}>
                  <p style={{ fontWeight:700, color:"#f87171", fontSize:13, margin:"0 0 6px", display:"flex", alignItems:"center", gap:6 }}><AlertCircle size={14}/>Warnings ({errors.length})</p>
                  {errors.slice(0,5).map((e,i) => <p key={i} style={{ fontSize:12, color:"#f87171", margin:"2px 0", opacity:0.8 }}>{e}</p>)}
                  {errors.length > 5 && <p style={{ fontSize:11, color:MUTED, margin:"4px 0 0" }}>…and {errors.length-5} more</p>}
                </div>
              )}

              {rows.length > 0 && (
                <div style={{ overflowX:"auto", borderRadius:10, border:`1px solid ${BORDER}` }}>
                  <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
                    <thead>
                      <tr style={{ background:"#060204" }}>
                        {["#","Job #","Customer","Pickup City","Delivery City","Pieces","Bill Rate","Status"].map(h=>(
                          <th key={h} style={{ padding:"8px 12px", textAlign:"left", fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em", color:MUTED, whiteSpace:"nowrap", fontFamily:"Barlow, sans-serif" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.slice(0,20).map((r,i)=>(
                        <tr key={i} style={{ background:i%2===0?SURFACE:SURFACE2, borderBottom:`1px solid ${BORDER}` }}>
                          <td style={{ padding:"8px 12px", color:MUTED }}>{i+1}</td>
                          <td style={{ padding:"8px 12px", fontFamily:"monospace", color:GREEN, fontSize:11 }}>{r.job_number||<span style={{color:MUTED}}>auto</span>}</td>
                          <td style={{ padding:"8px 12px", color:TEXT, fontWeight:600 }}>{r.customer_name||"—"}</td>
                          <td style={{ padding:"8px 12px", color:MUTED }}>{r.pickup_city||"—"}</td>
                          <td style={{ padding:"8px 12px", color:MUTED }}>{r.delivery_city||"—"}</td>
                          <td style={{ padding:"8px 12px", color:TEXT }}>{r.pieces||"—"}</td>
                          <td style={{ padding:"8px 12px", color:GREEN, fontWeight:700 }}>{r.bill_rate?`$${r.bill_rate}`:"—"}</td>
                          <td style={{ padding:"8px 12px" }}><span style={{ fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:10, background:STATUS_CFG[r.status]?.bg||STATUS_CFG.Pending.bg, color:STATUS_CFG[r.status]?.text||STATUS_CFG.Pending.text }}>{r.status||"Pending"}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {rows.length > 20 && <div style={{ padding:"8px 14px", fontSize:11, color:MUTED, borderTop:`1px solid ${BORDER}` }}>…and {rows.length-20} more rows not shown</div>}
                </div>
              )}
            </div>
          )}

          {/* STEP: Importing */}
          {step === "importing" && (
            <div style={{ textAlign:"center", padding:"32px 0" }}>
              <div style={{ width:64, height:64, borderRadius:"50%", border:`4px solid rgba(15,161,74,0.2)`, borderTopColor:GREEN, animation:"spin 1s linear infinite", margin:"0 auto 20px" }} />
              <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
              <p style={{ fontFamily:"Barlow, sans-serif", fontWeight:800, color:TEXT, fontSize:18, margin:"0 0 6px" }}>Importing {rows.length} orders…</p>
              <p style={{ color:MUTED, fontSize:13, margin:"0 0 20px" }}>{imported} imported · {failed} failed</p>
              <div style={{ background:SURFACE2, borderRadius:99, height:8, overflow:"hidden", maxWidth:400, margin:"0 auto" }}>
                <div style={{ height:"100%", width:`${progress}%`, background:GREEN, transition:"width 0.3s", borderRadius:99 }} />
              </div>
              <p style={{ color:MUTED, fontSize:12, margin:"8px 0 0" }}>{progress}%</p>
            </div>
          )}

          {/* STEP: Done */}
          {step === "done" && (
            <div style={{ textAlign:"center", padding:"32px 0" }}>
              <CheckCircle size={56} style={{ color:GREEN, marginBottom:16 }} />
              <p style={{ fontFamily:"Barlow, sans-serif", fontWeight:800, color:TEXT, fontSize:22, margin:"0 0 8px" }}>Import Complete!</p>
              <p style={{ color:MUTED, fontSize:14, margin:"0 0 24px" }}>
                <span style={{ color:GREEN, fontWeight:700 }}>{imported} orders</span> imported successfully
                {failed > 0 && <span style={{ color:"#f87171" }}> · {failed} failed</span>}
              </p>
              <button onClick={onClose} style={{ padding:"12px 28px", borderRadius:12, background:GREEN, color:"#fff", border:"none", fontWeight:800, fontSize:15, cursor:"pointer", fontFamily:"Barlow, sans-serif" }}>
                View Jobs →
              </button>
            </div>
          )}
        </div>

        {/* Footer actions */}
        {(step === "preview" && rows.length > 0) && (
          <div style={{ padding:"16px 24px", borderTop:`1px solid ${BORDER}`, display:"flex", justifyContent:"space-between", alignItems:"center", flexShrink:0 }}>
            <button onClick={()=>setStep("upload")} style={{ padding:"10px 18px", borderRadius:10, background:"transparent", color:MUTED, border:`1px solid ${BORDER}`, fontWeight:700, fontSize:13, cursor:"pointer", fontFamily:"Barlow, sans-serif" }}>
              ← Back
            </button>
            <button onClick={runImport} style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 24px", borderRadius:10, background:GREEN, color:"#fff", border:"none", fontWeight:800, fontSize:14, cursor:"pointer", fontFamily:"Barlow, sans-serif" }}>
              <Upload size={15}/>Import {rows.length} Orders
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Status Picker ───────────────────────────────────────────────────────────
const STATUS_FLOW = ["Pending", "Assigned", "In Transit", "Delivered", "Cancelled"];

function StatusPicker({ job, onUpdate }) {
  const [open, setOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  const ref = useRef();

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const sc = STATUS_CFG[job.status] || STATUS_CFG.Pending;

  const handleSelect = async (status) => {
    if (status === job.status) { setOpen(false); return; }
    setUpdating(true);
    setOpen(false);
    await onUpdate(job.id, status);
    setUpdating(false);
  };

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
      <button
        onClick={() => setOpen(o => !o)}
        disabled={updating}
        style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 700, padding: "3px 8px 3px 10px", borderRadius: 20, background: sc.bg, color: sc.text, border: `1px solid ${sc.text}33`, cursor: "pointer", opacity: updating ? 0.5 : 1, transition: "opacity 0.15s" }}
      >
        {updating ? "…" : job.status}
        <ChevronDown size={11} style={{ opacity: 0.7 }} />
      </button>
      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, zIndex: 100, background: "#1a2128", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, overflow: "hidden", boxShadow: "0 6px 20px rgba(0,0,0,0.5)", minWidth: 130 }}>
          {STATUS_FLOW.map(s => {
            const cfg = STATUS_CFG[s] || STATUS_CFG.Pending;
            const isCurrent = s === job.status;
            return (
              <button key={s} onClick={() => handleSelect(s)}
                style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "8px 12px", background: isCurrent ? "rgba(255,255,255,0.05)" : "transparent", color: cfg.text, fontSize: 12, fontWeight: isCurrent ? 700 : 500, cursor: "pointer", border: "none", textAlign: "left" }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.07)"}
                onMouseLeave={e => e.currentTarget.style.background = isCurrent ? "rgba(255,255,255,0.05)" : "transparent"}
              >
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: cfg.text, flexShrink: 0 }} />
                {s}
                {isCurrent && <span style={{ marginLeft: "auto", fontSize: 10, opacity: 0.5 }}>current</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Edit Job Modal ────────────────────────────────────────────────────────────
function EditJobModal({ job, onClose }) {
  const [form, setForm] = useState({...job});
  const [drivers, setDrivers] = useState([]);
  const [saving, setSaving] = useState(false);
  const [invoicing, setInvoicing] = useState(false);
  const [invoiced, setInvoiced] = useState(false);
  useEffect(()=>{ Driver.filter({status:"Active"}).then(setDrivers); },[]);
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  const save=async()=>{ setSaving(true); await Job.update(job.id,{...form,bill_rate:parseFloat(form.bill_rate)||0,driver_pay:parseFloat(form.driver_pay)||0}); setSaving(false); onClose(); };

  const generateInvoice = async () => {
    setInvoicing(true);
    const d = new Date();
    const dueDate = new Date(d); dueDate.setDate(d.getDate() + 30);
    const invNumber = `INV-${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}-${Math.floor(Math.random()*900+100)}`;
    const billRate = parseFloat(form.bill_rate) || 0;
    const lineItems = JSON.stringify([{ job_number: form.job_number, description: `${form.service_type||'Delivery'}: ${form.pickup_city||'?'} → ${form.delivery_city||'?'}`, amount: billRate }]);
    await Invoice.create({
      invoice_number: invNumber,
      customer_id: form.customer_id || '',
      customer_name: form.customer_name || '',
      job_ids: job.id,
      line_items: lineItems,
      issue_date: d.toISOString().split('T')[0],
      due_date: dueDate.toISOString().split('T')[0],
      payment_terms: 'Net 30',
      subtotal: billRate,
      tax_amount: 0,
      tax_rate: 0,
      total_amount: billRate,
      amount_paid: 0,
      balance_due: billRate,
      status: 'Draft',
    });
    setInvoiced(true);
    setInvoicing(false);
  };
  const inp={width:"100%",padding:"8px 12px",borderRadius:10,border:`1px solid ${BORDER}`,background:SURFACE2,color:TEXT,fontSize:13,outline:"none",boxSizing:"border-box"};
  const lbl={display:"block",fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.07em",color:MUTED,marginBottom:5,fontFamily:"Barlow, sans-serif"};
  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:50,padding:16 }}>
      <div style={{ background:SURFACE,border:`1px solid ${BORDER}`,borderRadius:20,boxShadow:"0 8px 40px rgba(0,0,0,0.5)",width:"100%",maxWidth:480,maxHeight:"85vh",display:"flex",flexDirection:"column" }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"18px 22px",borderBottom:`1px solid ${BORDER}`,flexShrink:0 }}>
          <h2 style={{ fontFamily:"Barlow, sans-serif",fontWeight:800,color:TEXT,margin:0 }}>Edit Job {job.job_number}</h2>
          <button onClick={onClose} style={{ color:MUTED,background:"none",border:"none",cursor:"pointer",fontSize:18 }}>✕</button>
        </div>
        <div style={{ overflowY:"auto",flex:1,padding:"20px 22px",display:"grid",gridTemplateColumns:"1fr 1fr",gap:16 }}>
          <div><label style={lbl}>Status</label><select style={inp} value={form.status} onChange={e=>set("status",e.target.value)}>{["Pending","Assigned","In Transit","Delivered","Cancelled"].map(s=><option key={s}>{s}</option>)}</select></div>
          <div><label style={lbl}>Driver</label>
            <select style={inp} value={form.driver_id||""} onChange={e=>{const d=drivers.find(x=>x.id===e.target.value);set("driver_id",e.target.value);if(d)set("driver_name",`${d.first_name} ${d.last_name}`);}}>
              <option value="">Unassigned</option>{drivers.map(d=><option key={d.id} value={d.id}>{d.first_name} {d.last_name}</option>)}
            </select>
          </div>
          <div><label style={lbl}>Bill Rate ($)</label><input style={inp} type="number" value={form.bill_rate||""} onChange={e=>set("bill_rate",e.target.value)} /></div>
          <div><label style={lbl}>Driver Pay ($)</label><input style={inp} type="number" value={form.driver_pay||""} onChange={e=>set("driver_pay",e.target.value)} /></div>
          <div><label style={lbl}>Pickup City</label><input style={inp} value={form.pickup_city||""} onChange={e=>set("pickup_city",e.target.value)} /></div>
          <div><label style={lbl}>Delivery City</label><input style={inp} value={form.delivery_city||""} onChange={e=>set("delivery_city",e.target.value)} /></div>
          <div><label style={lbl}>Pieces</label><input style={inp} type="number" value={form.pieces||""} onChange={e=>set("pieces",e.target.value)} /></div>
          <div><label style={lbl}>Weight (lbs)</label><input style={inp} type="number" value={form.weight_lbs||""} onChange={e=>set("weight_lbs",e.target.value)} /></div>
          <div style={{ gridColumn:"1/-1" }}><label style={lbl}>Notes</label><textarea style={{...inp,height:60,resize:"vertical"}} value={form.notes||""} onChange={e=>set("notes",e.target.value)} /></div>
        </div>
        <div style={{ padding:"14px 22px",borderTop:`1px solid ${BORDER}`,display:"flex",justifyContent:"space-between",alignItems:"center",gap:10,flexShrink:0,flexWrap:"wrap" }}>
          <button onClick={generateInvoice} disabled={invoicing||invoiced||!form.bill_rate} style={{ display:"flex",alignItems:"center",gap:6,padding:"9px 16px",borderRadius:10,background:invoiced?"rgba(15,161,74,0.15)":"rgba(255,255,255,0.07)",color:invoiced?GREEN:MUTED,border:`1px solid ${invoiced?"rgba(15,161,74,0.4)":BORDER}`,fontWeight:700,fontSize:13,cursor:invoiced||!form.bill_rate?"not-allowed":"pointer",fontFamily:"Barlow, sans-serif",opacity:(!form.bill_rate&&!invoiced)?0.4:1 }}>
            {invoiced ? "✓ Invoice Created" : invoicing ? "Creating…" : "⚡ Generate Invoice"}
          </button>
          <div style={{ display:"flex",gap:10 }}>
            <button onClick={onClose} style={{ padding:"9px 18px",borderRadius:10,background:"transparent",color:MUTED,border:`1px solid ${BORDER}`,fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"Barlow, sans-serif" }}>Cancel</button>
            <button onClick={save} disabled={saving} style={{ padding:"9px 20px",borderRadius:10,background:GREEN,color:"#fff",border:"none",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"Barlow, sans-serif",opacity:saving?0.6:1 }}>{saving?"Saving…":"Save Changes"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}