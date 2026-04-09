import { useState, useEffect } from "react";
import { Driver, Job, DriverPayment } from "@/api/entities";

const GREEN="#0fa14a"; const BG="#0e1012"; const SURFACE="#161a1d"; const SURFACE2="#1e2328";
const BORDER="rgba(255,255,255,0.07)"; const TEXT="#f0f0ee"; const MUTED="#8a8a85";
const fmt=(n)=>new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format(n||0);
const card={background:SURFACE,border:`1px solid ${BORDER}`,borderRadius:16,boxShadow:"0 2px 12px rgba(0,0,0,0.3)"};
const inp={padding:"8px 12px",borderRadius:10,border:`1px solid ${BORDER}`,background:SURFACE2,color:TEXT,fontSize:13,outline:"none"};
const lbl={display:"block",fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.07em",color:MUTED,marginBottom:5,fontFamily:"Barlow, sans-serif"};

export default function Payroll(){
  const[drivers,setDrivers]=useState([]);
  const[jobs,setJobs]=useState([]);
  const[payments,setPayments]=useState([]);
  const[loading,setLoading]=useState(true);
  const[driverData,setDriverData]=useState([]);
  const[generatingId,setGeneratingId]=useState(null);
  const now=new Date();
  const[period,setPeriod]=useState({
    start:new Date(now.getFullYear(),now.getMonth(),now.getDate()-6).toISOString().split("T")[0],
    end:now.toISOString().split("T")[0],
  });

  useEffect(()=>{loadData();},[]);
  useEffect(()=>{computeDriverData();},[drivers,jobs,period]);

  async function loadData(){
    const[drvs,js,pmts]=await Promise.all([Driver.list(),Job.list(),DriverPayment.list()]);
    setDrivers(drvs.filter(d=>d.status==="Active")); setJobs(js); setPayments(pmts); setLoading(false);
  }

  function computeDriverData(){
    const data=drivers.map(d=>{
      const myJobs=jobs.filter(j=>j.driver_id===d.id&&j.status==="Delivered"&&j.updated_date>=period.start+"T00:00:00.000Z"&&j.updated_date<=period.end+"T23:59:59.999Z");
      const totalBilled=myJobs.reduce((s,j)=>s+(j.bill_rate||0),0);
      const totalPay=myJobs.reduce((s,j)=>s+(j.driver_pay||0),0);
      const totalMiles=myJobs.reduce((s,j)=>s+(j.miles||0),0);
      const margin=totalBilled-totalPay;
      const marginPct=totalBilled>0?(margin/totalBilled*100):0;
      return{driver:d,jobs:myJobs,totalBilled,totalPay,totalMiles,margin,marginPct};
    });
    setDriverData(data);
  }

  const totals=driverData.reduce((acc,d)=>({billed:acc.billed+d.totalBilled,pay:acc.pay+d.totalPay,jobs:acc.jobs+d.jobs.length,miles:acc.miles+d.totalMiles}),{billed:0,pay:0,jobs:0,miles:0});

  const generatePayroll=async(item)=>{
    setGeneratingId(item.driver.id);
    await DriverPayment.create({driver_id:item.driver.id,driver_name:`${item.driver.first_name} ${item.driver.last_name}`,period_start:period.start,period_end:period.end,job_ids:item.jobs.map(j=>j.id).join(","),total_jobs:item.jobs.length,total_miles:item.totalMiles,gross_pay:item.totalPay,deductions:0,net_pay:item.totalPay,total_billed:item.totalBilled,margin:item.margin,status:"Draft"});
    await loadData(); setGeneratingId(null);
  };

  const quickPeriod=(label)=>{
    const n=new Date();
    if(label==="This Week"){const mon=new Date(n);mon.setDate(n.getDate()-n.getDay()+1);setPeriod({start:mon.toISOString().split("T")[0],end:n.toISOString().split("T")[0]});}
    if(label==="Last Week"){const mon=new Date(n);mon.setDate(n.getDate()-n.getDay()-6);const sun=new Date(mon);sun.setDate(mon.getDate()+6);setPeriod({start:mon.toISOString().split("T")[0],end:sun.toISOString().split("T")[0]});}
    if(label==="This Month"){setPeriod({start:new Date(n.getFullYear(),n.getMonth(),1).toISOString().split("T")[0],end:n.toISOString().split("T")[0]});}
  };

  if(loading)return<div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:BG}}><div style={{width:36,height:36,borderRadius:"50%",border:`3px solid ${GREEN}`,borderTopColor:"transparent",animation:"spin 1s linear infinite"}}/><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></div>;

  return(
    <div style={{minHeight:"100vh",background:BG,fontFamily:"Source Sans 3, sans-serif",padding:24}}>
      <div style={{marginBottom:24}}>
        <p style={{fontSize:11,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:GREEN,fontFamily:"Barlow, sans-serif",margin:"0 0 2px"}}>Compensation</p>
        <h1 style={{fontSize:20,fontWeight:800,color:TEXT,margin:0,fontFamily:"Barlow, sans-serif"}}>Driver Payroll</h1>
        <p style={{fontSize:13,color:MUTED,margin:"2px 0 0"}}>Pay vs. billing comparison by driver</p>
      </div>

      {/* Period Selector */}
      <div style={{...card,padding:20,marginBottom:20}}>
        <div style={{display:"flex",alignItems:"flex-end",gap:16,flexWrap:"wrap"}}>
          <div><label style={lbl}>Period Start</label><input style={inp} type="date" value={period.start} onChange={e=>setPeriod(p=>({...p,start:e.target.value}))}/></div>
          <div><label style={lbl}>Period End</label><input style={inp} type="date" value={period.end} onChange={e=>setPeriod(p=>({...p,end:e.target.value}))}/></div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            {["This Week","Last Week","This Month"].map(l=>(
              <button key={l} onClick={()=>quickPeriod(l)} style={{padding:"8px 14px",borderRadius:8,border:`1px solid ${BORDER}`,background:SURFACE2,color:MUTED,fontWeight:600,cursor:"pointer",fontSize:13,fontFamily:"Barlow, sans-serif"}}>{l}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Summary */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:16,marginBottom:20}}>
        {[["Total Billed",fmt(totals.billed),TEXT],["Driver Pay",fmt(totals.pay),"#f87171"],["Total Margin",fmt(totals.billed-totals.pay),GREEN],["Total Jobs",totals.jobs,TEXT]].map(([l,v,c])=>(
          <div key={l} style={{...card,padding:"16px 20px"}}>
            <p style={{fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.07em",color:MUTED,fontFamily:"Barlow, sans-serif",margin:"0 0 8px"}}>{l}</p>
            <p style={{fontSize:24,fontWeight:800,color:c,margin:0,fontFamily:"Barlow, sans-serif"}}>{v}</p>
          </div>
        ))}
      </div>

      {/* Driver Table */}
      <div style={{...card,overflow:"hidden",marginBottom:20}}>
        <div style={{padding:"14px 20px",borderBottom:`1px solid ${BORDER}`}}>
          <h2 style={{fontSize:15,fontWeight:700,color:TEXT,fontFamily:"Barlow, sans-serif",margin:0}}>Driver Performance — {period.start} to {period.end}</h2>
        </div>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
            <thead>
              <tr style={{background:"#060204",borderBottom:`2px solid ${GREEN}`}}>
                {["Driver","Jobs","Miles","Billed","Driver Pay","Margin","Margin %",""].map(h=>(
                  <th key={h} style={{textAlign:"left",padding:"10px 16px",fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.07em",color:h===""?GREEN:"#888",fontFamily:"Barlow, sans-serif",whiteSpace:"nowrap"}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {driverData.map((item,i)=>{
                const mp=item.marginPct;
                const mpColor=mp>=30?"#4ade80":mp>=10?"#fbbf24":"#f87171";
                return(
                  <tr key={item.driver.id} style={{background:i%2===0?SURFACE:SURFACE2,borderBottom:`1px solid ${BORDER}`}}>
                    <td style={{padding:"12px 16px"}}>
                      <div style={{display:"flex",alignItems:"center",gap:10}}>
                        <div style={{width:32,height:32,borderRadius:"50%",background:"rgba(15,161,74,0.15)",border:`1px solid ${GREEN}`,display:"flex",alignItems:"center",justifyContent:"center",color:GREEN,fontWeight:800,fontSize:12,flexShrink:0}}>
                          {(item.driver.first_name||"?")[0]}{(item.driver.last_name||"?")[0]}
                        </div>
                        <span style={{fontWeight:700,color:TEXT,fontFamily:"Barlow, sans-serif"}}>{item.driver.first_name} {item.driver.last_name}</span>
                      </div>
                    </td>
                    <td style={{padding:"12px 16px",color:TEXT}}>{item.jobs.length}</td>
                    <td style={{padding:"12px 16px",color:MUTED}}>{item.totalMiles.toFixed(0)}</td>
                    <td style={{padding:"12px 16px",fontWeight:700,color:TEXT,fontFamily:"Barlow, sans-serif"}}>{fmt(item.totalBilled)}</td>
                    <td style={{padding:"12px 16px",color:"#f87171"}}>{fmt(item.totalPay)}</td>
                    <td style={{padding:"12px 16px",fontWeight:700,color:item.margin>=0?GREEN:"#f87171",fontFamily:"Barlow, sans-serif"}}>{fmt(item.margin)}</td>
                    <td style={{padding:"12px 16px"}}><span style={{fontSize:11,fontWeight:700,padding:"3px 10px",borderRadius:20,background:mp>=30?"rgba(15,161,74,0.15)":mp>=10?"rgba(245,158,11,0.15)":"rgba(239,68,68,0.15)",color:mpColor}}>{mp.toFixed(1)}%</span></td>
                    <td style={{padding:"12px 16px"}}>
                      {item.jobs.length>0&&<button onClick={()=>generatePayroll(item)} disabled={generatingId===item.driver.id} style={{padding:"6px 12px",borderRadius:8,background:SURFACE2,border:`1px solid ${BORDER}`,color:GREEN,fontWeight:700,cursor:"pointer",fontSize:12,opacity:generatingId===item.driver.id?0.5:1}}>{generatingId===item.driver.id?"…":"Gen Payroll"}</button>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payroll History */}
      <div style={{...card,overflow:"hidden"}}>
        <div style={{padding:"14px 20px",borderBottom:`1px solid ${BORDER}`}}>
          <h2 style={{fontSize:15,fontWeight:700,color:TEXT,fontFamily:"Barlow, sans-serif",margin:0}}>Payroll History</h2>
        </div>
        {payments.length===0?(
          <div style={{padding:48,textAlign:"center",color:MUTED,fontSize:13}}>No payroll records yet. Generate payroll from the driver table above.</div>
        ):(
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
              <thead>
                <tr style={{background:"#060204",borderBottom:`1px solid ${BORDER}`}}>
                  {["Driver","Period","Jobs","Billed","Net Pay","Status",""].map(h=>(
                    <th key={h} style={{textAlign:"left",padding:"10px 16px",fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.07em",color:"#888",fontFamily:"Barlow, sans-serif"}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {payments.sort((a,b)=>new Date(b.created_date)-new Date(a.created_date)).map((p,i)=>{
                  const sc=p.status==="Paid"?{bg:"rgba(15,161,74,0.15)",text:"#4ade80"}:p.status==="Approved"?{bg:"rgba(59,130,246,0.15)",text:"#60a5fa"}:{bg:"rgba(255,255,255,0.07)",text:MUTED};
                  return(
                    <tr key={p.id} style={{background:i%2===0?SURFACE:SURFACE2,borderBottom:`1px solid ${BORDER}`}}>
                      <td style={{padding:"12px 16px",fontWeight:700,color:TEXT}}>{p.driver_name}</td>
                      <td style={{padding:"12px 16px",color:MUTED,fontSize:12}}>{p.period_start} → {p.period_end}</td>
                      <td style={{padding:"12px 16px",color:TEXT}}>{p.total_jobs}</td>
                      <td style={{padding:"12px 16px",color:TEXT}}>{fmt(p.total_billed)}</td>
                      <td style={{padding:"12px 16px",fontWeight:700,color:GREEN,fontFamily:"Barlow, sans-serif"}}>{fmt(p.net_pay)}</td>
                      <td style={{padding:"12px 16px"}}><span style={{fontSize:11,fontWeight:700,padding:"3px 10px",borderRadius:20,background:sc.bg,color:sc.text}}>{p.status}</span></td>
                      <td style={{padding:"12px 16px"}}>
                        {p.status==="Draft"&&<button onClick={async()=>{await DriverPayment.update(p.id,{status:"Approved"});loadData();}} style={{fontSize:12,fontWeight:700,color:"#60a5fa",background:"none",border:"none",cursor:"pointer"}}>Approve</button>}
                        {p.status==="Approved"&&<button onClick={async()=>{await DriverPayment.update(p.id,{status:"Paid"});loadData();}} style={{fontSize:12,fontWeight:700,color:GREEN,background:"none",border:"none",cursor:"pointer"}}>Mark Paid</button>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
