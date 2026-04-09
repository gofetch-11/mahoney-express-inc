import { useState, useEffect } from "react";
import { Job, Driver } from "@/api/entities";
import { Plus, Search, Package } from "lucide-react";

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
    if (search) { const q=search.toLowerCase(); f=f.filter(j=>["job_number","customer_name","driver_name","pickup_city","delivery_city"].some(k=>(j[k]||"").toLowerCase().includes(q))); }
    setFiltered(f);
  }, [jobs, search, statusFilter]);

  async function loadJobs() {
    const data = await Job.list();
    setJobs(data.sort((a,b)=>new Date(b.created_date)-new Date(a.created_date)));
    setLoading(false);
  }

  const counts = Object.keys(STATUS_CFG).reduce((acc,s) => { acc[s]=s==="All"?jobs.length:jobs.filter(j=>j.status===s).length; return acc; }, {});

  return (
    <div style={{ minHeight:"100vh", background:BG, fontFamily:"Source Sans 3, sans-serif", padding:24 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:24 }}>
        <div>
          <p style={{ fontSize:11, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", color:GREEN, fontFamily:"Barlow, sans-serif", margin:"0 0 2px" }}>Order Management</p>
          <h1 style={{ fontSize:20, fontWeight:800, color:TEXT, margin:0, fontFamily:"Barlow, sans-serif" }}>Jobs</h1>
          <p style={{ fontSize:13, color:MUTED, margin:"2px 0 0" }}>{jobs.length} total orders</p>
        </div>
        <a href="/new-job" style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 18px", background:GREEN, color:"#fff", border:"none", borderRadius:12, fontWeight:700, fontSize:14, textDecoration:"none", fontFamily:"Barlow, sans-serif" }}>
          <Plus size={16}/>New Job
        </a>
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
                      <td style={{ padding:"12px 16px" }}><span style={{ fontSize:11, fontWeight:700, padding:"3px 10px", borderRadius:20, background:sc.bg, color:sc.text }}>{job.status}</span></td>
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
    </div>
  );
}

function EditJobModal({ job, onClose }) {
  const [form, setForm] = useState({...job});
  const [drivers, setDrivers] = useState([]);
  const [saving, setSaving] = useState(false);
  useEffect(()=>{ Driver.filter({status:"Active"}).then(setDrivers); },[]);
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  const save=async()=>{ setSaving(true); await Job.update(job.id,{...form,bill_rate:parseFloat(form.bill_rate)||0,driver_pay:parseFloat(form.driver_pay)||0}); setSaving(false); onClose(); };
  const inp={width:"100%",padding:"8px 12px",borderRadius:10,border:`1px solid ${BORDER}`,background:SURFACE2,color:TEXT,fontSize:13,outline:"none",boxSizing:"border-box"};
  const lbl={display:"block",fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.07em",color:MUTED,marginBottom:5,fontFamily:"Barlow, sans-serif"};
  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:50,padding:16 }}>
      <div style={{ background:SURFACE,border:`1px solid ${BORDER}`,borderRadius:20,boxShadow:"0 8px 40px rgba(0,0,0,0.5)",width:"100%",maxWidth:480 }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"18px 22px",borderBottom:`1px solid ${BORDER}` }}>
          <h2 style={{ fontFamily:"Barlow, sans-serif",fontWeight:800,color:TEXT,margin:0 }}>Edit Job {job.job_number}</h2>
          <button onClick={onClose} style={{ color:MUTED,background:"none",border:"none",cursor:"pointer",fontSize:18 }}>✕</button>
        </div>
        <div style={{ padding:"20px 22px",display:"grid",gridTemplateColumns:"1fr 1fr",gap:16 }}>
          <div><label style={lbl}>Status</label><select style={inp} value={form.status} onChange={e=>set("status",e.target.value)}>{["Pending","Assigned","In Transit","Delivered","Cancelled"].map(s=><option key={s}>{s}</option>)}</select></div>
          <div><label style={lbl}>Driver</label>
            <select style={inp} value={form.driver_id||""} onChange={e=>{const d=drivers.find(x=>x.id===e.target.value);set("driver_id",e.target.value);if(d)set("driver_name",`${d.first_name} ${d.last_name}`);}}>
              <option value="">Unassigned</option>{drivers.map(d=><option key={d.id} value={d.id}>{d.first_name} {d.last_name}</option>)}
            </select>
          </div>
          <div><label style={lbl}>Bill Rate ($)</label><input style={inp} type="number" value={form.bill_rate||""} onChange={e=>set("bill_rate",e.target.value)}/></div>
          <div><label style={lbl}>Driver Pay ($)</label><input style={inp} type="number" value={form.driver_pay||""} onChange={e=>set("driver_pay",e.target.value)}/></div>
          <div style={{gridColumn:"span 2"}}><label style={lbl}>Notes</label><textarea style={{...inp,resize:"vertical"}} rows={3} value={form.notes||""} onChange={e=>set("notes",e.target.value)}/></div>
        </div>
        <div style={{ display:"flex",gap:10,padding:"16px 22px",borderTop:`1px solid ${BORDER}` }}>
          <button onClick={onClose} style={{ flex:1,padding:10,borderRadius:10,border:`1px solid ${BORDER}`,background:"transparent",color:MUTED,fontWeight:600,cursor:"pointer" }}>Cancel</button>
          <button onClick={save} disabled={saving} style={{ flex:1,padding:10,borderRadius:10,background:GREEN,color:"#fff",border:"none",fontWeight:800,cursor:"pointer",fontFamily:"Barlow, sans-serif",opacity:saving?0.6:1 }}>{saving?"Saving…":"Save Changes"}</button>
        </div>
      </div>
    </div>
  );
}
