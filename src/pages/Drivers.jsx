import { useState, useEffect } from "react";
import { Driver, Job } from "@/api/entities";
import { Plus, User, Truck, DollarSign, Phone, Mail } from "lucide-react";

const GREEN="#0fa14a"; const BG="#0e1012"; const SURFACE="#161a1d"; const SURFACE2="#1e2328";
const BORDER="rgba(255,255,255,0.07)"; const TEXT="#f0f0ee"; const MUTED="#8a8a85";
const PAY_TYPES=["Per Mile","Per Job","Hourly","Percentage"];
const VEHICLES=["Car","Van","Box Truck","Sprinter","Semi","Motorcycle","Other"];
const fmt=(n)=>new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format(n||0);
const card={background:SURFACE,border:`1px solid ${BORDER}`,borderRadius:16,boxShadow:"0 2px 12px rgba(0,0,0,0.3)"};
const inp={width:"100%",padding:"8px 12px",borderRadius:10,border:`1px solid ${BORDER}`,background:SURFACE2,color:TEXT,fontSize:13,outline:"none",boxSizing:"border-box"};
const lbl={display:"block",fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.07em",color:MUTED,marginBottom:5,fontFamily:"Barlow, sans-serif"};

const STATUS_STYLE={Active:{bg:"rgba(15,161,74,0.15)",text:"#4ade80"},Inactive:{bg:"rgba(255,255,255,0.07)",text:MUTED},"On Leave":{bg:"rgba(245,158,11,0.15)",text:"#fbbf24"}};

export default function Drivers() {
  const [drivers, setDrivers]=useState([]);
  const [driverStats, setDriverStats]=useState({});
  const [loading, setLoading]=useState(true);
  const [showForm, setShowForm]=useState(false);
  const [editDriver, setEditDriver]=useState(null);

  useEffect(()=>{loadData();},[]);

  async function loadData() {
    const [drvs,jobs]=await Promise.all([Driver.list(),Job.list()]);
    const stats={};
    drvs.forEach(d=>{
      const delivered=jobs.filter(j=>j.driver_id===d.id&&j.status==="Delivered");
      stats[d.id]={delivered:delivered.length,totalBilled:delivered.reduce((s,j)=>s+(j.bill_rate||0),0),totalPay:delivered.reduce((s,j)=>s+(j.driver_pay||0),0)};
    });
    setDrivers(drvs.sort((a,b)=>(a.first_name||"").localeCompare(b.first_name||"")));
    setDriverStats(stats); setLoading(false);
  }

  if(loading) return <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:BG}}><div style={{width:36,height:36,borderRadius:"50%",border:`3px solid ${GREEN}`,borderTopColor:"transparent",animation:"spin 1s linear infinite"}}/><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></div>;

  return (
    <div style={{minHeight:"100vh",background:BG,fontFamily:"Source Sans 3, sans-serif",padding:24}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:24}}>
        <div>
          <p style={{fontSize:11,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:GREEN,fontFamily:"Barlow, sans-serif",margin:"0 0 2px"}}>Fleet</p>
          <h1 style={{fontSize:20,fontWeight:800,color:TEXT,margin:0,fontFamily:"Barlow, sans-serif"}}>Drivers</h1>
          <p style={{fontSize:13,color:MUTED,margin:"2px 0 0"}}>{drivers.filter(d=>d.status==="Active").length} active drivers</p>
        </div>
        <button onClick={()=>{setEditDriver(null);setShowForm(true);}} style={{display:"flex",alignItems:"center",gap:8,padding:"10px 18px",background:GREEN,color:"#fff",border:"none",borderRadius:12,fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:"Barlow, sans-serif"}}>
          <Plus size={16}/>Add Driver
        </button>
      </div>

      {drivers.length===0?(
        <div style={{textAlign:"center",padding:64,color:MUTED}}>
          <User size={36} style={{marginBottom:10,opacity:0.2}}/>
          <p>No drivers yet.</p>
          <button onClick={()=>setShowForm(true)} style={{marginTop:8,color:GREEN,fontWeight:600,background:"none",border:"none",cursor:"pointer",fontSize:14}}>Add your first driver →</button>
        </div>
      ):(
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:16}}>
          {drivers.map(d=>{
            const s=driverStats[d.id]||{};
            const margin=(s.totalBilled||0)-(s.totalPay||0);
            const ss=STATUS_STYLE[d.status]||STATUS_STYLE.Inactive;
            return (
              <div key={d.id} style={{...card,padding:20}}>
                <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:16}}>
                  <div style={{display:"flex",alignItems:"center",gap:12}}>
                    <div style={{width:44,height:44,borderRadius:"50%",background:"rgba(15,161,74,0.15)",border:`2px solid ${GREEN}`,display:"flex",alignItems:"center",justifyContent:"center",color:GREEN,fontWeight:800,fontSize:16,fontFamily:"Barlow, sans-serif",flexShrink:0}}>
                      {(d.first_name||"?")[0]}{(d.last_name||"?")[0]}
                    </div>
                    <div>
                      <p style={{fontWeight:800,color:TEXT,fontFamily:"Barlow, sans-serif",margin:"0 0 4px"}}>{d.first_name} {d.last_name}</p>
                      <span style={{fontSize:11,fontWeight:700,padding:"2px 8px",borderRadius:20,background:ss.bg,color:ss.text}}>{d.status}</span>
                    </div>
                  </div>
                  <button onClick={()=>{setEditDriver(d);setShowForm(true);}} style={{fontSize:12,fontWeight:700,color:"#60a5fa",background:"none",border:"none",cursor:"pointer"}}>Edit</button>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:16}}>
                  {d.phone&&<div style={{display:"flex",alignItems:"center",gap:8,fontSize:13,color:MUTED}}><Phone size={13} style={{color:MUTED,flexShrink:0}}/>{d.phone}</div>}
                  {d.email&&<div style={{display:"flex",alignItems:"center",gap:8,fontSize:13,color:MUTED}}><Mail size={13} style={{color:MUTED,flexShrink:0}}/>{d.email}</div>}
                  {d.vehicle_type&&<div style={{display:"flex",alignItems:"center",gap:8,fontSize:13,color:MUTED}}><Truck size={13} style={{color:MUTED,flexShrink:0}}/>{d.vehicle_type}{d.vehicle_make?` · ${d.vehicle_make} ${d.vehicle_model||""}`:""}</div>}
                  <div style={{display:"flex",alignItems:"center",gap:8,fontSize:13,color:MUTED}}><DollarSign size={13} style={{color:MUTED,flexShrink:0}}/>{d.pay_type} @ {d.pay_type==="Percentage"?`${d.pay_rate}%`:fmt(d.pay_rate)}</div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,paddingTop:14,borderTop:`1px solid ${BORDER}`}}>
                  <div style={{textAlign:"center"}}>
                    <p style={{fontSize:24,fontWeight:800,color:TEXT,margin:0,fontFamily:"Barlow, sans-serif"}}>{s.delivered||0}</p>
                    <p style={{fontSize:11,color:MUTED,margin:"2px 0 0"}}>Deliveries</p>
                  </div>
                  <div style={{textAlign:"center"}}>
                    <p style={{fontSize:14,fontWeight:700,color:TEXT,margin:0,fontFamily:"Barlow, sans-serif"}}>{fmt(s.totalBilled)}</p>
                    <p style={{fontSize:11,color:MUTED,margin:"2px 0 0"}}>Billed</p>
                  </div>
                  <div style={{textAlign:"center"}}>
                    <p style={{fontSize:14,fontWeight:700,color:margin>=0?GREEN:"#f87171",margin:0,fontFamily:"Barlow, sans-serif"}}>{fmt(margin)}</p>
                    <p style={{fontSize:11,color:MUTED,margin:"2px 0 0"}}>Margin</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {showForm&&<DriverForm driver={editDriver} onClose={()=>{setShowForm(false);loadData();}}/>}
    </div>
  );
}

function DriverForm({driver,onClose}){
  const[form,setForm]=useState(driver?{...driver}:{first_name:"",last_name:"",phone:"",email:"",vehicle_type:"Van",vehicle_make:"",vehicle_model:"",license_plate:"",pay_type:"Per Mile",pay_rate:"",status:"Active",notes:""});
  const[saving,setSaving]=useState(false);
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  const save=async()=>{setSaving(true);const data={...form,pay_rate:parseFloat(form.pay_rate)||0};if(driver)await Driver.update(driver.id,data);else await Driver.create(data);setSaving(false);onClose();};
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:50,padding:16}}>
      <div style={{background:SURFACE,border:`1px solid ${BORDER}`,borderRadius:20,boxShadow:"0 8px 40px rgba(0,0,0,0.5)",width:"100%",maxWidth:520,maxHeight:"90vh",overflow:"hidden",display:"flex",flexDirection:"column"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"18px 22px",borderBottom:`1px solid ${BORDER}`,flexShrink:0}}>
          <h2 style={{fontFamily:"Barlow, sans-serif",fontWeight:800,color:TEXT,margin:0}}>{driver?"Edit Driver":"Add Driver"}</h2>
          <button onClick={onClose} style={{color:MUTED,background:"none",border:"none",cursor:"pointer",fontSize:18}}>✕</button>
        </div>
        <div style={{padding:"20px 22px",overflowY:"auto",flex:1,display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
          {[["First Name","first_name"],["Last Name","last_name"],["Phone","phone"],["Email","email"],["License Plate","license_plate"]].map(([l,k])=>(
            <div key={k}><label style={lbl}>{l}</label><input style={inp} value={form[k]||""} onChange={e=>set(k,e.target.value)}/></div>
          ))}
          <div><label style={lbl}>Vehicle Type</label><select style={inp} value={form.vehicle_type} onChange={e=>set("vehicle_type",e.target.value)}>{VEHICLES.map(v=><option key={v}>{v}</option>)}</select></div>
          <div><label style={lbl}>Make</label><input style={inp} placeholder="e.g. Ford" value={form.vehicle_make||""} onChange={e=>set("vehicle_make",e.target.value)}/></div>
          <div><label style={lbl}>Model</label><input style={inp} placeholder="e.g. Transit" value={form.vehicle_model||""} onChange={e=>set("vehicle_model",e.target.value)}/></div>
          <div><label style={lbl}>Pay Type</label><select style={inp} value={form.pay_type} onChange={e=>set("pay_type",e.target.value)}>{PAY_TYPES.map(p=><option key={p}>{p}</option>)}</select></div>
          <div><label style={lbl}>Pay Rate {form.pay_type==="Percentage"?"(%)":"($)"}</label><input style={inp} type="number" placeholder="0.00" value={form.pay_rate||""} onChange={e=>set("pay_rate",e.target.value)}/></div>
          <div><label style={lbl}>Status</label><select style={inp} value={form.status} onChange={e=>set("status",e.target.value)}><option>Active</option><option>Inactive</option><option>On Leave</option></select></div>
          <div style={{gridColumn:"span 2"}}><label style={lbl}>Notes</label><textarea style={{...inp,resize:"vertical"}} rows={2} value={form.notes||""} onChange={e=>set("notes",e.target.value)}/></div>
        </div>
        <div style={{display:"flex",gap:10,padding:"16px 22px",borderTop:`1px solid ${BORDER}`,flexShrink:0}}>
          <button onClick={onClose} style={{flex:1,padding:10,borderRadius:10,border:`1px solid ${BORDER}`,background:"transparent",color:MUTED,fontWeight:600,cursor:"pointer"}}>Cancel</button>
          <button onClick={save} disabled={saving} style={{flex:1,padding:10,borderRadius:10,background:GREEN,color:"#fff",border:"none",fontWeight:800,cursor:"pointer",fontFamily:"Barlow, sans-serif",opacity:saving?0.6:1}}>{saving?"Saving…":driver?"Save Changes":"Add Driver"}</button>
        </div>
      </div>
    </div>
  );
}
