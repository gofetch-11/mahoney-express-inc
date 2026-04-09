import { useState, useEffect } from "react";
import { Customer, Job, Invoice } from "@/api/entities";
import { Plus, Building2, Phone, Mail, MapPin, Search } from "lucide-react";

const GREEN="#0fa14a"; const BG="#0e1012"; const SURFACE="#161a1d"; const SURFACE2="#1e2328";
const BORDER="rgba(255,255,255,0.07)"; const TEXT="#f0f0ee"; const MUTED="#8a8a85";
const TERMS=["Net 15","Net 30","Net 45","Due on Receipt","COD"];
const fmt=(n)=>new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format(n||0);
const card={background:SURFACE,border:`1px solid ${BORDER}`,borderRadius:16,boxShadow:"0 2px 12px rgba(0,0,0,0.3)"};
const inp={width:"100%",padding:"8px 12px",borderRadius:10,border:`1px solid ${BORDER}`,background:SURFACE2,color:TEXT,fontSize:13,outline:"none",boxSizing:"border-box"};
const lbl={display:"block",fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.07em",color:MUTED,marginBottom:5,fontFamily:"Barlow, sans-serif"};

export default function Customers(){
  const[customers,setCustomers]=useState([]);
  const[custStats,setCustStats]=useState({});
  const[loading,setLoading]=useState(true);
  const[showForm,setShowForm]=useState(false);
  const[editCustomer,setEditCustomer]=useState(null);
  const[search,setSearch]=useState("");
  useEffect(()=>{loadData();},[]);

  async function loadData(){
    const[custs,jobs,invs]=await Promise.all([Customer.list(),Job.list(),Invoice.list()]);
    const stats={};
    custs.forEach(c=>{
      const myJobs=jobs.filter(j=>j.customer_id===c.id);
      const myInvs=invs.filter(i=>i.customer_id===c.id);
      stats[c.id]={totalJobs:myJobs.length,totalBilled:myJobs.reduce((s,j)=>s+(j.bill_rate||0),0),openBalance:myInvs.filter(i=>["Sent","Partial","Overdue"].includes(i.status)).reduce((s,i)=>s+(i.balance_due||0),0)};
    });
    setCustomers(custs.sort((a,b)=>(a.company_name||"").localeCompare(b.company_name||"")));
    setCustStats(stats); setLoading(false);
  }

  const filtered=customers.filter(c=>(c.company_name||"").toLowerCase().includes(search.toLowerCase())||(c.contact_name||"").toLowerCase().includes(search.toLowerCase()));

  if(loading)return<div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:BG}}><div style={{width:36,height:36,borderRadius:"50%",border:`3px solid ${GREEN}`,borderTopColor:"transparent",animation:"spin 1s linear infinite"}}/><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></div>;

  return(
    <div style={{minHeight:"100vh",background:BG,fontFamily:"Source Sans 3, sans-serif",padding:24}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:24}}>
        <div>
          <p style={{fontSize:11,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:GREEN,fontFamily:"Barlow, sans-serif",margin:"0 0 2px"}}>Accounts</p>
          <h1 style={{fontSize:20,fontWeight:800,color:TEXT,margin:0,fontFamily:"Barlow, sans-serif"}}>Customers</h1>
          <p style={{fontSize:13,color:MUTED,margin:"2px 0 0"}}>{customers.filter(c=>c.status==="Active").length} active accounts</p>
        </div>
        <button onClick={()=>{setEditCustomer(null);setShowForm(true);}} style={{display:"flex",alignItems:"center",gap:8,padding:"10px 18px",background:GREEN,color:"#fff",border:"none",borderRadius:12,fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:"Barlow, sans-serif"}}>
          <Plus size={16}/>Add Customer
        </button>
      </div>

      <div style={{position:"relative",marginBottom:16}}>
        <Search size={15} style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",color:MUTED}}/>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search customers…"
          style={{width:"100%",padding:"10px 12px 10px 36px",background:SURFACE,border:`1px solid ${BORDER}`,borderRadius:12,color:TEXT,fontSize:13,outline:"none",boxSizing:"border-box"}}/>
      </div>

      {filtered.length===0?(
        <div style={{textAlign:"center",padding:64,color:MUTED}}>
          <Building2 size={36} style={{marginBottom:10,opacity:0.2}}/>
          <p>No customers found.</p>
          <button onClick={()=>setShowForm(true)} style={{marginTop:8,color:GREEN,fontWeight:600,background:"none",border:"none",cursor:"pointer",fontSize:14}}>Add your first customer →</button>
        </div>
      ):(
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:16}}>
          {filtered.map(c=>{
            const s=custStats[c.id]||{};
            const active=c.status==="Active";
            return(
              <div key={c.id} style={{...card,padding:20}}>
                <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:14}}>
                  <div>
                    <p style={{fontWeight:800,color:TEXT,fontFamily:"Barlow, sans-serif",margin:"0 0 4px",fontSize:15}}>{c.company_name}</p>
                    {c.contact_name&&<p style={{fontSize:13,color:MUTED,margin:"0 0 6px"}}>{c.contact_name}</p>}
                    <span style={{fontSize:11,fontWeight:700,padding:"2px 8px",borderRadius:20,background:active?"rgba(15,161,74,0.15)":"rgba(255,255,255,0.07)",color:active?"#4ade80":MUTED}}>{c.status}</span>
                  </div>
                  <button onClick={()=>{setEditCustomer(c);setShowForm(true);}} style={{fontSize:12,fontWeight:700,color:"#60a5fa",background:"none",border:"none",cursor:"pointer",flexShrink:0}}>Edit</button>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:14}}>
                  {c.phone&&<div style={{display:"flex",alignItems:"center",gap:8,fontSize:13,color:MUTED}}><Phone size={13} style={{color:MUTED,flexShrink:0}}/>{c.phone}</div>}
                  {c.email&&<div style={{display:"flex",alignItems:"center",gap:8,fontSize:13,color:MUTED}}><Mail size={13} style={{color:MUTED,flexShrink:0}}/>{c.email}</div>}
                  {c.billing_address&&<div style={{display:"flex",alignItems:"center",gap:8,fontSize:13,color:MUTED}}><MapPin size={13} style={{color:MUTED,flexShrink:0}}/>{c.billing_address}, {c.city} {c.state}</div>}
                  <p style={{fontSize:12,color:MUTED,margin:0}}>Terms: {c.payment_terms||"Net 30"} · Acct: {c.account_number||"—"}</p>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,paddingTop:14,borderTop:`1px solid ${BORDER}`}}>
                  <div style={{textAlign:"center"}}><p style={{fontSize:24,fontWeight:800,color:TEXT,margin:0,fontFamily:"Barlow, sans-serif"}}>{s.totalJobs||0}</p><p style={{fontSize:11,color:MUTED,margin:"2px 0 0"}}>Jobs</p></div>
                  <div style={{textAlign:"center"}}><p style={{fontSize:13,fontWeight:700,color:TEXT,margin:0,fontFamily:"Barlow, sans-serif"}}>{fmt(s.totalBilled)}</p><p style={{fontSize:11,color:MUTED,margin:"2px 0 0"}}>Lifetime</p></div>
                  <div style={{textAlign:"center"}}><p style={{fontSize:13,fontWeight:700,color:(s.openBalance||0)>0?"#f87171":GREEN,margin:0,fontFamily:"Barlow, sans-serif"}}>{fmt(s.openBalance)}</p><p style={{fontSize:11,color:MUTED,margin:"2px 0 0"}}>Open A/R</p></div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {showForm&&<CustomerForm customer={editCustomer} onClose={()=>{setShowForm(false);loadData();}}/>}
    </div>
  );
}

function CustomerForm({customer,onClose}){
  const[form,setForm]=useState(customer?{...customer}:{company_name:"",contact_name:"",email:"",phone:"",billing_address:"",city:"",state:"IL",zip:"",account_number:"",payment_terms:"Net 30",status:"Active",notes:""});
  const[saving,setSaving]=useState(false);
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  const save=async()=>{setSaving(true);if(customer)await Customer.update(customer.id,form);else await Customer.create(form);setSaving(false);onClose();};
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:50,padding:16}}>
      <div style={{background:SURFACE,border:`1px solid ${BORDER}`,borderRadius:20,boxShadow:"0 8px 40px rgba(0,0,0,0.5)",width:"100%",maxWidth:520,maxHeight:"90vh",overflow:"hidden",display:"flex",flexDirection:"column"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"18px 22px",borderBottom:`1px solid ${BORDER}`,flexShrink:0}}>
          <h2 style={{fontFamily:"Barlow, sans-serif",fontWeight:800,color:TEXT,margin:0}}>{customer?"Edit Customer":"Add Customer"}</h2>
          <button onClick={onClose} style={{color:MUTED,background:"none",border:"none",cursor:"pointer",fontSize:18}}>✕</button>
        </div>
        <div style={{padding:"20px 22px",overflowY:"auto",flex:1,display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
          <div style={{gridColumn:"span 2"}}><label style={lbl}>Company Name *</label><input style={inp} value={form.company_name} onChange={e=>set("company_name",e.target.value)}/></div>
          <div><label style={lbl}>Contact Name</label><input style={inp} value={form.contact_name||""} onChange={e=>set("contact_name",e.target.value)}/></div>
          <div><label style={lbl}>Account #</label><input style={inp} value={form.account_number||""} onChange={e=>set("account_number",e.target.value)}/></div>
          <div><label style={lbl}>Phone</label><input style={inp} value={form.phone||""} onChange={e=>set("phone",e.target.value)}/></div>
          <div><label style={lbl}>Email</label><input style={inp} type="email" value={form.email||""} onChange={e=>set("email",e.target.value)}/></div>
          <div style={{gridColumn:"span 2"}}><label style={lbl}>Billing Address</label><input style={inp} value={form.billing_address||""} onChange={e=>set("billing_address",e.target.value)}/></div>
          <div><label style={lbl}>City</label><input style={inp} value={form.city||""} onChange={e=>set("city",e.target.value)}/></div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            <div><label style={lbl}>State</label><input style={inp} maxLength={2} value={form.state||""} onChange={e=>set("state",e.target.value.toUpperCase())}/></div>
            <div><label style={lbl}>ZIP</label><input style={inp} value={form.zip||""} onChange={e=>set("zip",e.target.value)}/></div>
          </div>
          <div><label style={lbl}>Payment Terms</label><select style={inp} value={form.payment_terms||"Net 30"} onChange={e=>set("payment_terms",e.target.value)}>{TERMS.map(t=><option key={t}>{t}</option>)}</select></div>
          <div><label style={lbl}>Status</label><select style={inp} value={form.status} onChange={e=>set("status",e.target.value)}><option>Active</option><option>Inactive</option></select></div>
          <div style={{gridColumn:"span 2"}}><label style={lbl}>Notes</label><textarea style={{...inp,resize:"vertical"}} rows={2} value={form.notes||""} onChange={e=>set("notes",e.target.value)}/></div>
        </div>
        <div style={{display:"flex",gap:10,padding:"16px 22px",borderTop:`1px solid ${BORDER}`,flexShrink:0}}>
          <button onClick={onClose} style={{flex:1,padding:10,borderRadius:10,border:`1px solid ${BORDER}`,background:"transparent",color:MUTED,fontWeight:600,cursor:"pointer"}}>Cancel</button>
          <button onClick={save} disabled={saving||!form.company_name} style={{flex:1,padding:10,borderRadius:10,background:GREEN,color:"#fff",border:"none",fontWeight:800,cursor:"pointer",fontFamily:"Barlow, sans-serif",opacity:(saving||!form.company_name)?0.5:1}}>{saving?"Saving…":customer?"Save Changes":"Add Customer"}</button>
        </div>
      </div>
    </div>
  );
}
