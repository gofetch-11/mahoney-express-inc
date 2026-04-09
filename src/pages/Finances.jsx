import { useState, useEffect } from "react";
import { Invoice, Expense, Job } from "@/api/entities";
import { Plus, TrendingUp, TrendingDown, DollarSign } from "lucide-react";

const GREEN="#0fa14a"; const BG="#0e1012"; const SURFACE="#161a1d"; const SURFACE2="#1e2328";
const BORDER="rgba(255,255,255,0.07)"; const TEXT="#f0f0ee"; const MUTED="#8a8a85";
const CATS=["Fuel","Vehicle Maintenance","Insurance","Office Supplies","Payroll","Software","Tolls","Parking","Equipment","Other"];
const fmt=(n)=>new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format(n||0);
const card={background:SURFACE,border:`1px solid ${BORDER}`,borderRadius:16,boxShadow:"0 2px 12px rgba(0,0,0,0.3)"};
const inp={width:"100%",padding:"8px 12px",borderRadius:10,border:`1px solid ${BORDER}`,background:SURFACE2,color:TEXT,fontSize:13,outline:"none",boxSizing:"border-box"};
const lbl={display:"block",fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.07em",color:MUTED,marginBottom:5,fontFamily:"Barlow, sans-serif"};

export default function Finances(){
  const[invoices,setInvoices]=useState([]);
  const[expenses,setExpenses]=useState([]);
  const[jobs,setJobs]=useState([]);
  const[loading,setLoading]=useState(true);
  const[view,setView]=useState("overview");
  const[showExpenseForm,setShowExpenseForm]=useState(false);
  const[selectedYear,setSelectedYear]=useState(new Date().getFullYear());

  useEffect(()=>{loadData();},[]);
  async function loadData(){
    const[invs,exps,js]=await Promise.all([Invoice.list(),Expense.list(),Job.list()]);
    setInvoices(invs); setExpenses(exps); setJobs(js); setLoading(false);
  }

  const months=Array.from({length:12},(_,i)=>{
    const mo=String(i+1).padStart(2,"0"); const prefix=`${selectedYear}-${mo}`;
    const revenue=invoices.filter(inv=>inv.status==="Paid"&&inv.issue_date?.startsWith(prefix)).reduce((s,i)=>s+(i.total_amount||0),0);
    const expTotal=expenses.filter(e=>e.date?.startsWith(prefix)).reduce((s,e)=>s+(e.amount||0),0);
    const jobRevenue=jobs.filter(j=>j.status==="Delivered"&&j.updated_date?.startsWith(prefix)).reduce((s,j)=>s+(j.bill_rate||0),0);
    return{month:new Date(selectedYear,i,1).toLocaleString("default",{month:"short"}),revenue:revenue||jobRevenue,expenses:expTotal,profit:(revenue||jobRevenue)-expTotal};
  });

  const ytdRevenue=months.reduce((s,m)=>s+m.revenue,0);
  const ytdExpenses=months.reduce((s,m)=>s+m.expenses,0);
  const ytdProfit=ytdRevenue-ytdExpenses;
  const expByCategory=CATS.map(cat=>({cat,total:expenses.filter(e=>e.category===cat).reduce((s,e)=>s+(e.amount||0),0)})).filter(x=>x.total>0).sort((a,b)=>b.total-a.total);
  const totalExpenses=expenses.reduce((s,e)=>s+(e.amount||0),0);

  if(loading)return<div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:BG}}><div style={{width:36,height:36,borderRadius:"50%",border:`3px solid ${GREEN}`,borderTopColor:"transparent",animation:"spin 1s linear infinite"}}/><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></div>;

  return(
    <div style={{minHeight:"100vh",background:BG,fontFamily:"Source Sans 3, sans-serif",padding:24}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:24,flexWrap:"wrap",gap:12}}>
        <div>
          <p style={{fontSize:11,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:GREEN,fontFamily:"Barlow, sans-serif",margin:"0 0 2px"}}>Financial Overview</p>
          <h1 style={{fontSize:20,fontWeight:800,color:TEXT,margin:0,fontFamily:"Barlow, sans-serif"}}>Finances</h1>
          <p style={{fontSize:13,color:MUTED,margin:"2px 0 0"}}>P&L, expenses, and revenue tracking</p>
        </div>
        <div style={{display:"flex",gap:10,alignItems:"center"}}>
          <select value={selectedYear} onChange={e=>setSelectedYear(Number(e.target.value))} style={{...inp,width:"auto",padding:"8px 12px"}}>
            {[2024,2025,2026].map(y=><option key={y}>{y}</option>)}
          </select>
          <button onClick={()=>setShowExpenseForm(true)} style={{display:"flex",alignItems:"center",gap:8,padding:"10px 18px",background:GREEN,color:"#fff",border:"none",borderRadius:12,fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:"Barlow, sans-serif"}}>
            <Plus size={16}/>Add Expense
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{display:"flex",gap:8,marginBottom:20}}>
        {["overview","expenses"].map(t=>(
          <button key={t} onClick={()=>setView(t)} style={{padding:"8px 18px",borderRadius:10,fontSize:13,fontWeight:700,cursor:"pointer",background:view===t?GREEN:"transparent",color:view===t?"#fff":MUTED,border:`1px solid ${view===t?GREEN:BORDER}`,textTransform:"capitalize",fontFamily:"Barlow, sans-serif",transition:"all 0.15s"}}>{t}</button>
        ))}
      </div>

      {view==="overview"&&(
        <>
          {/* YTD */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:16,marginBottom:20}}>
            <div style={{...card,padding:"18px 20px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}><span style={{fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.07em",color:MUTED,fontFamily:"Barlow, sans-serif"}}>YTD Revenue</span><TrendingUp size={16} style={{color:GREEN}}/></div>
              <p style={{fontSize:24,fontWeight:800,color:TEXT,margin:0,fontFamily:"Barlow, sans-serif"}}>{fmt(ytdRevenue)}</p>
            </div>
            <div style={{...card,padding:"18px 20px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}><span style={{fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.07em",color:MUTED,fontFamily:"Barlow, sans-serif"}}>YTD Expenses</span><TrendingDown size={16} style={{color:"#f87171"}}/></div>
              <p style={{fontSize:24,fontWeight:800,color:TEXT,margin:0,fontFamily:"Barlow, sans-serif"}}>{fmt(ytdExpenses)}</p>
            </div>
            <div style={{...card,padding:"18px 20px",borderColor:ytdProfit>=0?"rgba(15,161,74,0.3)":"rgba(239,68,68,0.3)",background:ytdProfit>=0?"rgba(15,161,74,0.06)":"rgba(239,68,68,0.06)"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}><span style={{fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.07em",color:MUTED,fontFamily:"Barlow, sans-serif"}}>YTD Net Profit</span><DollarSign size={16} style={{color:ytdProfit>=0?GREEN:"#f87171"}}/></div>
              <p style={{fontSize:24,fontWeight:800,color:ytdProfit>=0?GREEN:"#f87171",margin:0,fontFamily:"Barlow, sans-serif"}}>{fmt(ytdProfit)}</p>
            </div>
          </div>

          {/* Monthly Table */}
          <div style={{...card,overflow:"hidden"}}>
            <div style={{padding:"14px 20px",borderBottom:`1px solid ${BORDER}`}}>
              <h2 style={{fontSize:15,fontWeight:700,color:TEXT,fontFamily:"Barlow, sans-serif",margin:0}}>Monthly P&L — {selectedYear}</h2>
            </div>
            <div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
                <thead>
                  <tr style={{background:"#060204",borderBottom:`2px solid ${GREEN}`}}>
                    {["Month","Revenue","Expenses","Net",""].map(h=>(
                      <th key={h} style={{textAlign:"left",padding:"10px 16px",fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.07em",color:h===""?GREEN:"#888",fontFamily:"Barlow, sans-serif"}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {months.map((m,i)=>{
                    const maxVal=Math.max(...months.map(x=>Math.max(x.revenue,x.expenses)),1);
                    const hasData=m.revenue>0||m.expenses>0;
                    return(
                      <tr key={i} style={{background:i%2===0?SURFACE:SURFACE2,borderBottom:`1px solid ${BORDER}`}}>
                        <td style={{padding:"12px 16px",fontWeight:700,color:TEXT,fontFamily:"Barlow, sans-serif"}}>{m.month}</td>
                        <td style={{padding:"12px 16px",color:GREEN,fontWeight:600}}>{m.revenue>0?fmt(m.revenue):"—"}</td>
                        <td style={{padding:"12px 16px",color:"#f87171"}}>{m.expenses>0?fmt(m.expenses):"—"}</td>
                        <td style={{padding:"12px 16px",fontWeight:700,fontFamily:"Barlow, sans-serif",color:m.profit>=0?GREEN:"#f87171"}}>{hasData?fmt(m.profit):"—"}</td>
                        <td style={{padding:"12px 16px"}}>
                          {hasData&&(
                            <div style={{display:"flex",gap:2,alignItems:"flex-end",height:20}}>
                              <div style={{width:8,borderRadius:2,background:GREEN,height:`${m.revenue/maxVal*100}%`,minHeight:2}}/>
                              <div style={{width:8,borderRadius:2,background:"#f87171",height:`${m.expenses/maxVal*100}%`,minHeight:m.expenses>0?2:0}}/>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {view==="expenses"&&(
        <div style={{display:"grid",gridTemplateColumns:"1fr 2fr",gap:16}}>
          <div style={{...card,padding:20}}>
            <h2 style={{fontSize:15,fontWeight:700,color:TEXT,fontFamily:"Barlow, sans-serif",margin:"0 0 16px"}}>By Category</h2>
            {expByCategory.length===0?<p style={{color:MUTED,fontSize:13}}>No expenses recorded.</p>:(
              <div style={{display:"flex",flexDirection:"column",gap:12}}>
                {expByCategory.map(ec=>(
                  <div key={ec.cat}>
                    <div style={{display:"flex",justifyContent:"space-between",fontSize:13,marginBottom:5}}>
                      <span style={{color:TEXT}}>{ec.cat}</span>
                      <span style={{fontWeight:700,color:GREEN,fontFamily:"Barlow, sans-serif"}}>{fmt(ec.total)}</span>
                    </div>
                    <div style={{height:5,background:SURFACE2,borderRadius:999,overflow:"hidden"}}>
                      <div style={{height:"100%",background:`linear-gradient(90deg,${GREEN},#009549)`,borderRadius:999,width:`${totalExpenses>0?(ec.total/totalExpenses*100):0}%`}}/>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{...card,overflow:"hidden"}}>
            <div style={{padding:"14px 20px",borderBottom:`1px solid ${BORDER}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <h2 style={{fontSize:15,fontWeight:700,color:TEXT,fontFamily:"Barlow, sans-serif",margin:0}}>All Expenses</h2>
              <span style={{fontSize:12,color:MUTED}}>{fmt(totalExpenses)} total</span>
            </div>
            {expenses.length===0?(
              <div style={{padding:48,textAlign:"center",color:MUTED,fontSize:13}}>No expenses yet.<br/><button onClick={()=>setShowExpenseForm(true)} style={{marginTop:8,color:GREEN,fontWeight:600,background:"none",border:"none",cursor:"pointer",fontSize:13}}>Add your first →</button></div>
            ):(
              <div style={{maxHeight:420,overflowY:"auto"}}>
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
                  <thead style={{position:"sticky",top:0}}>
                    <tr style={{background:"#060204"}}>
                      {["Date","Category","Description","Amount"].map(h=>(
                        <th key={h} style={{textAlign:"left",padding:"10px 16px",fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.07em",color:"#888",fontFamily:"Barlow, sans-serif"}}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.sort((a,b)=>new Date(b.date)-new Date(a.date)).map((e,i)=>(
                      <tr key={e.id} style={{background:i%2===0?SURFACE:SURFACE2,borderBottom:`1px solid ${BORDER}`}}>
                        <td style={{padding:"10px 16px",color:MUTED}}>{e.date}</td>
                        <td style={{padding:"10px 16px"}}><span style={{fontSize:11,fontWeight:700,padding:"2px 8px",borderRadius:20,background:SURFACE2,color:MUTED}}>{e.category}</span></td>
                        <td style={{padding:"10px 16px",color:TEXT}}>{e.description}</td>
                        <td style={{padding:"10px 16px",fontWeight:700,color:"#f87171",fontFamily:"Barlow, sans-serif"}}>{fmt(e.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {showExpenseForm&&<ExpenseForm onClose={()=>{setShowExpenseForm(false);loadData();}}/>}
    </div>
  );
}

function ExpenseForm({onClose}){
  const[form,setForm]=useState({date:new Date().toISOString().split("T")[0],category:"Fuel",description:"",amount:"",vendor:"",notes:""});
  const[saving,setSaving]=useState(false);
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  const save=async()=>{setSaving(true);await Expense.create({...form,amount:parseFloat(form.amount)||0});setSaving(false);onClose();};
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:50,padding:16}}>
      <div style={{background:SURFACE,border:`1px solid ${BORDER}`,borderRadius:20,boxShadow:"0 8px 40px rgba(0,0,0,0.5)",width:"100%",maxWidth:440}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"18px 22px",borderBottom:`1px solid ${BORDER}`}}>
          <h2 style={{fontFamily:"Barlow, sans-serif",fontWeight:800,color:TEXT,margin:0}}>Add Expense</h2>
          <button onClick={onClose} style={{color:MUTED,background:"none",border:"none",cursor:"pointer",fontSize:18}}>✕</button>
        </div>
        <div style={{padding:"20px 22px",display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
          <div><label style={lbl}>Date</label><input style={inp} type="date" value={form.date} onChange={e=>set("date",e.target.value)}/></div>
          <div><label style={lbl}>Amount ($)</label><input style={inp} type="number" placeholder="0.00" value={form.amount} onChange={e=>set("amount",e.target.value)}/></div>
          <div style={{gridColumn:"span 2"}}><label style={lbl}>Category</label><select style={inp} value={form.category} onChange={e=>set("category",e.target.value)}>{CATS.map(c=><option key={c}>{c}</option>)}</select></div>
          <div style={{gridColumn:"span 2"}}><label style={lbl}>Description</label><input style={inp} value={form.description} onChange={e=>set("description",e.target.value)}/></div>
          <div style={{gridColumn:"span 2"}}><label style={lbl}>Vendor</label><input style={inp} value={form.vendor} onChange={e=>set("vendor",e.target.value)}/></div>
        </div>
        <div style={{display:"flex",gap:10,padding:"16px 22px",borderTop:`1px solid ${BORDER}`}}>
          <button onClick={onClose} style={{flex:1,padding:10,borderRadius:10,border:`1px solid ${BORDER}`,background:"transparent",color:MUTED,fontWeight:600,cursor:"pointer"}}>Cancel</button>
          <button onClick={save} disabled={saving||!form.amount} style={{flex:1,padding:10,borderRadius:10,background:GREEN,color:"#fff",border:"none",fontWeight:800,cursor:"pointer",fontFamily:"Barlow, sans-serif",opacity:(saving||!form.amount)?0.5:1}}>{saving?"Saving…":"Add Expense"}</button>
        </div>
      </div>
    </div>
  );
}
