import { useState, useEffect, useRef } from "react";
import { Driver, Job, DriverPayment } from "@/api/entities";
import { Printer, Send, Save, Plus, Trash2, RefreshCw, ChevronDown } from "lucide-react";

const GREEN = "#0fa14a";
const BLACK = "#060204";
const BG = "#0e1012";
const SURFACE = "#161a1d";
const SURFACE2 = "#1e2328";
const BORDER = "rgba(255,255,255,0.07)";
const TEXT = "#f0f0ee";
const MUTED = "#8a8a85";

const LOGO = "https://media.base44.com/images/public/69cb07fb94b4627f0bd76151/a863be72e_MahoneyExpressInc-Header.png";
const SHAMROCK = "https://media.base44.com/images/public/69cb07fb94b4627f0bd76151/828dbca4e_Shamrock.png";

const fmt = (n) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n || 0);
const fmtDate = (d) => { if (!d) return ""; const p = d.split("-"); return `${p[1]}/${p[2]}/${p[0]}`; };

function getSundayOfWeek(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  const day = d.getDay();
  d.setDate(d.getDate() + (7 - day) % 7);
  return d.toISOString().split("T")[0];
}

function getWeekStart(sundayStr) {
  const d = new Date(sundayStr + "T00:00:00");
  d.setDate(d.getDate() - 6);
  return d.toISOString().split("T")[0];
}

const emptyRow = () => ({
  id: Math.random().toString(36).slice(2),
  date: "", truck: "", cust: "", job: "", job_id: "",
  puc: "", pus: "", dc: "", ds: "",
  put: "", dt: "", pkg: "", wt: "", amt: "", notes: "",
});

export default function DriverReport() {
  const [drivers, setDrivers] = useState([]);
  const [allJobs, setAllJobs] = useState([]);
  const [selectedDriverId, setSelectedDriverId] = useState("");
  const [selectedDriverName, setSelectedDriverName] = useState("");
  const [weekEnd, setWeekEnd] = useState(() => {
    const today = new Date();
    const sunday = new Date(today);
    sunday.setDate(today.getDate() + (7 - today.getDay()) % 7);
    return sunday.toISOString().split("T")[0];
  });
  const [rows, setRows] = useState(() => Array.from({ length: 6 }, emptyRow));
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [toast, setToast] = useState("");
  const [jobDropdown, setJobDropdown] = useState(null); // rowId showing dropdown
  const [driverJobs, setDriverJobs] = useState([]);

  useEffect(() => {
    Promise.all([Driver.filter({ status: "Active" }), Job.list()]).then(([drvs, jobs]) => {
      setDrivers(drvs);
      setAllJobs(jobs);
      setLoading(false);
    });
  }, []);

  // When driver + week changes, load their jobs for that week
  useEffect(() => {
    if (!selectedDriverId || !weekEnd) { setDriverJobs([]); return; }
    const weekStart = getWeekStart(weekEnd);
    const relevant = allJobs.filter(j =>
      j.driver_id === selectedDriverId &&
      ["Delivered", "Assigned", "In Transit"].includes(j.status)
    );
    setDriverJobs(relevant);
  }, [selectedDriverId, weekEnd, allJobs]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const setRow = (id, field, value) => {
    setRows(rs => rs.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const fillFromJob = (rowId, job) => {
    setRows(rs => rs.map(r => r.id === rowId ? {
      ...r,
      job: job.job_number || "",
      job_id: job.id,
      cust: job.customer_name || "",
      puc: job.pickup_city || "",
      pus: job.pickup_state || "",
      dc: job.delivery_city || "",
      ds: job.delivery_state || "",
      pkg: job.pieces?.toString() || "",
      wt: job.weight_lbs?.toString() || "",
      amt: job.driver_pay?.toString() || "",
      date: job.updated_date ? job.updated_date.split("T")[0] : r.date,
    } : r));
    setJobDropdown(null);
    showToast(`✓ Filled from job ${job.job_number}`);
  };

  const autoFillAll = () => {
    if (!driverJobs.length) { showToast("No jobs found for this driver/week"); return; }
    const newRows = driverJobs.slice(0, 20).map(job => ({
      ...emptyRow(),
      job: job.job_number || "",
      job_id: job.id,
      cust: job.customer_name || "",
      puc: job.pickup_city || "",
      pus: job.pickup_state || "",
      dc: job.delivery_city || "",
      ds: job.delivery_state || "",
      pkg: job.pieces?.toString() || "",
      wt: job.weight_lbs?.toString() || "",
      amt: job.driver_pay?.toString() || "",
      date: job.updated_date ? job.updated_date.split("T")[0] : "",
      truck: "",
    }));
    // Pad to at least 6
    while (newRows.length < 6) newRows.push(emptyRow());
    setRows(newRows);
    showToast(`✓ Auto-filled ${driverJobs.length} job${driverJobs.length > 1 ? "s" : ""}`);
  };

  const addRow = () => setRows(rs => [...rs, emptyRow()]);
  const removeRow = (id) => setRows(rs => rs.filter(r => r.id !== id));

  const totals = rows.reduce((acc, r) => ({
    entries: acc.entries + (r.cust || r.job ? 1 : 0),
    pkg: acc.pkg + (parseFloat(r.pkg) || 0),
    wt: acc.wt + (parseFloat(r.wt) || 0),
    amt: acc.amt + (parseFloat(r.amt) || 0),
  }), { entries: 0, pkg: 0, wt: 0, amt: 0 });

  const handleSubmit = async () => {
    if (!selectedDriverId) { showToast("Please select a driver first"); return; }
    const filledRows = rows.filter(r => r.cust || r.job || r.puc);
    if (!filledRows.length) { showToast("Please fill in at least one job row"); return; }
    setSubmitting(true);
    try {
      const jobIds = filledRows.map(r => r.job_id).filter(Boolean);
      await DriverPayment.create({
        driver_id: selectedDriverId,
        driver_name: selectedDriverName,
        period_start: getWeekStart(weekEnd),
        period_end: weekEnd,
        job_ids: jobIds.join(","),
        total_jobs: filledRows.length,
        total_miles: 0,
        gross_pay: totals.amt,
        deductions: 0,
        net_pay: totals.amt,
        total_billed: filledRows.reduce((s, r) => {
          const job = allJobs.find(j => j.id === r.job_id);
          return s + (job?.bill_rate || 0);
        }, 0),
        margin: 0,
        status: "Draft",
        notes: JSON.stringify(filledRows.map(r => ({
          date: r.date, truck: r.truck, customer: r.cust, job: r.job,
          pickup: `${r.puc}, ${r.pus}`, delivery: `${r.dc}, ${r.ds}`,
          pickupTime: r.put, deliveryTime: r.dt,
          packages: r.pkg, weight: r.wt, total: r.amt, notes: r.notes,
        }))),
      });
      setSubmitted(true);
      showToast("✓ Report submitted to accounting!");
    } catch (e) {
      showToast("Error submitting: " + e.message);
    }
    setSubmitting(false);
  };

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: BG }}>
      <img src={SHAMROCK} alt="" style={{ width: 40, height: 40, animation: "spin 1.5s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (submitted) return (
    <div style={{ minHeight: "100vh", background: BG, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Source Sans 3, sans-serif" }}>
      <div style={{ background: SURFACE, border: `1px solid rgba(15,161,74,0.3)`, borderRadius: 20, padding: 40, maxWidth: 440, textAlign: "center", boxShadow: "0 8px 40px rgba(0,0,0,0.4)" }}>
        <img src={SHAMROCK} alt="" style={{ width: 56, height: 56, marginBottom: 16 }} />
        <h2 style={{ fontFamily: "Barlow, sans-serif", fontWeight: 800, color: TEXT, fontSize: 22, margin: "0 0 8px" }}>Report Submitted!</h2>
        <p style={{ color: MUTED, fontSize: 14, margin: "0 0 24px" }}>
          {selectedDriverName}'s weekly report for week ending <strong style={{ color: TEXT }}>{fmtDate(weekEnd)}</strong> has been sent to accounting.
        </p>
        <div style={{ background: "rgba(15,161,74,0.1)", border: "1px solid rgba(15,161,74,0.25)", borderRadius: 12, padding: "14px 20px", marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontSize: 13, color: MUTED }}>Entries</span><span style={{ fontWeight: 700, color: TEXT }}>{totals.entries}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontSize: 13, color: MUTED }}>Total Packages</span><span style={{ fontWeight: 700, color: TEXT }}>{totals.pkg}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 13, color: MUTED }}>Pay Total</span><span style={{ fontSize: 18, fontWeight: 800, color: GREEN, fontFamily: "Barlow, sans-serif" }}>{fmt(totals.amt)}</span>
          </div>
        </div>
        <button onClick={() => { setSubmitted(false); setRows(Array.from({ length: 6 }, emptyRow)); setSelectedDriverId(""); setSelectedDriverName(""); }}
          style={{ padding: "12px 28px", borderRadius: 12, background: GREEN, color: "#fff", border: "none", fontWeight: 800, fontSize: 15, cursor: "pointer", fontFamily: "Barlow, sans-serif" }}>
          Submit Another Report
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: BG, fontFamily: "Source Sans 3, sans-serif", paddingBottom: 60 }}>
      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", background: BLACK, color: GREEN, fontFamily: "Barlow, sans-serif", fontWeight: 700, fontSize: 13, padding: "10px 22px", borderRadius: 10, border: `1px solid ${GREEN}`, zIndex: 9999, letterSpacing: "0.04em", boxShadow: "0 4px 20px rgba(0,0,0,0.5)", whiteSpace: "nowrap" }}>
          {toast}
        </div>
      )}

      {/* ── Toolbar ── */}
      <div className="no-print" style={{ background: SURFACE, borderBottom: `1px solid ${BORDER}`, padding: "10px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10, position: "sticky", top: 0, zIndex: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <img src={SHAMROCK} alt="" style={{ width: 20, height: 20 }} />
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: MUTED, fontFamily: "Barlow, sans-serif" }}>Mahoney Express — Driver Weekly Report</span>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {driverJobs.length > 0 && (
            <button onClick={autoFillAll} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 8, background: "rgba(15,161,74,0.15)", color: GREEN, border: `1px solid rgba(15,161,74,0.3)`, fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "Barlow, sans-serif" }}>
              <RefreshCw size={13} />Auto-Fill {driverJobs.length} Jobs
            </button>
          )}
          <button onClick={() => window.print()} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 8, background: "transparent", color: MUTED, border: `1px solid ${BORDER}`, fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "Barlow, sans-serif" }}>
            <Printer size={13} />Print
          </button>
          <button onClick={handleSubmit} disabled={submitting} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, background: GREEN, color: "#fff", border: "none", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "Barlow, sans-serif", opacity: submitting ? 0.6 : 1 }}>
            <Send size={13} />{submitting ? "Submitting…" : "Submit to Accounting"}
          </button>
        </div>
      </div>

      {/* ── Main Card ── */}
      <div style={{ maxWidth: 980, margin: "20px auto", padding: "0 16px" }}>
        <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 12, overflow: "hidden", boxShadow: "0 4px 24px rgba(0,0,0,0.4)" }}>

          {/* Header */}
          <div style={{ background: BLACK, padding: "18px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <img src={LOGO} alt="Mahoney Express" style={{ height: 44, width: "auto" }} />
            <div style={{ textAlign: "right" }}>
              <p style={{ fontFamily: "Barlow, sans-serif", fontSize: 18, fontWeight: 800, color: "#fff", margin: 0, letterSpacing: "0.04em" }}>DRIVER WEEKLY REPORT</p>
              <p style={{ fontSize: 9, color: MUTED, margin: "3px 0 0", letterSpacing: "0.07em", textTransform: "uppercase" }}>Submit every Sunday · accounting@mahoneyexpress.com</p>
            </div>
          </div>
          <div style={{ height: 4, background: "linear-gradient(90deg,#0fa14a,#009549)" }} />

          {/* Info Row */}
          <div style={{ display: "flex", flexWrap: "wrap", background: SURFACE2, borderBottom: `1px solid ${BORDER}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 20px", flex: 1, minWidth: 220, borderRight: `1px solid ${BORDER}` }}>
              <span style={{ fontFamily: "Barlow, sans-serif", fontSize: 10, fontWeight: 700, color: GREEN, letterSpacing: "0.07em", textTransform: "uppercase", whiteSpace: "nowrap" }}>Driver</span>
              <select
                value={selectedDriverId}
                onChange={e => {
                  const d = drivers.find(x => x.id === e.target.value);
                  setSelectedDriverId(e.target.value);
                  setSelectedDriverName(d ? `${d.first_name} ${d.last_name}` : "");
                }}
                style={{ flex: 1, border: "none", borderBottom: `1.5px solid ${TEXT}`, background: "transparent", fontFamily: "Barlow, sans-serif", fontSize: 13, fontWeight: 600, color: TEXT, outline: "none", padding: "2px 0" }}
              >
                <option value="">Select driver…</option>
                {drivers.map(d => <option key={d.id} value={d.id}>{d.first_name} {d.last_name}</option>)}
              </select>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 20px", flex: 1, minWidth: 200, borderRight: `1px solid ${BORDER}` }}>
              <span style={{ fontFamily: "Barlow, sans-serif", fontSize: 10, fontWeight: 700, color: GREEN, letterSpacing: "0.07em", textTransform: "uppercase", whiteSpace: "nowrap" }}>Week Ending</span>
              <input type="date" value={weekEnd}
                onChange={e => setWeekEnd(getSundayOfWeek(e.target.value))}
                style={{ flex: 1, border: "none", borderBottom: `1.5px solid ${TEXT}`, background: "transparent", fontFamily: "Barlow, sans-serif", fontSize: 13, fontWeight: 600, color: TEXT, outline: "none", padding: "2px 0" }} />
            </div>

            {/* Running Total Box */}
            <div style={{ background: BLACK, padding: "12px 20px", display: "flex", alignItems: "center", gap: 16, borderLeft: `3px solid ${GREEN}`, minWidth: 180 }}>
              <div>
                <p style={{ fontFamily: "Barlow, sans-serif", fontSize: 9, fontWeight: 700, color: GREEN, letterSpacing: "0.07em", textTransform: "uppercase", margin: "0 0 2px" }}>Total Pay</p>
                <p style={{ fontFamily: "Barlow, sans-serif", fontSize: 20, fontWeight: 800, color: GREEN, margin: 0 }}>{fmt(totals.amt)}</p>
              </div>
              <div style={{ borderLeft: `1px solid rgba(255,255,255,0.08)`, paddingLeft: 14 }}>
                <p style={{ fontFamily: "Barlow, sans-serif", fontSize: 9, color: MUTED, margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "0.05em" }}>{totals.entries} entries</p>
                <p style={{ fontFamily: "Barlow, sans-serif", fontSize: 11, color: MUTED, margin: 0 }}>{totals.pkg} pkgs · {totals.wt.toFixed(0)} lbs</p>
              </div>
            </div>
          </div>

          {/* Column Headers */}
          <div style={{ display: "grid", gridTemplateColumns: "62px 70px 1fr 1fr 1fr 100px 100px 108px", background: BLACK, borderBottom: `2px solid ${GREEN}` }}>
            {["Date","Truck #","Customer & Job #","Pick-Up","Delivery","Times","Pkgs / Wt","Pay Total ($)"].map((h, i) => (
              <div key={h} style={{ padding: "8px 6px", fontFamily: "Barlow, sans-serif", fontSize: 8, fontWeight: 700, color: i === 7 ? GREEN : "#888", textAlign: "center", textTransform: "uppercase", letterSpacing: "0.05em", borderRight: i < 7 ? `1px solid rgba(255,255,255,0.06)` : "none", lineHeight: 1.3, display: "flex", alignItems: "center", justifyContent: "center" }}>{h}</div>
            ))}
          </div>

          {/* Rows */}
          <div>
            {rows.map((row, i) => (
              <ReportRow
                key={row.id} row={row} index={i}
                driverJobs={driverJobs}
                showDropdown={jobDropdown === row.id}
                onDropdown={() => setJobDropdown(jobDropdown === row.id ? null : row.id)}
                onCloseDropdown={() => setJobDropdown(null)}
                onFillJob={(job) => fillFromJob(row.id, job)}
                onChange={(field, val) => setRow(row.id, field, val)}
                onRemove={() => removeRow(row.id)}
              />
            ))}
          </div>

          {/* Add Row */}
          <div style={{ padding: "10px 16px", background: SURFACE2, borderTop: `1px solid ${BORDER}`, display: "flex", alignItems: "center", gap: 12 }}>
            <button onClick={addRow} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8, background: "transparent", color: GREEN, border: `1.5px solid ${GREEN}`, fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "Barlow, sans-serif" }}>
              <Plus size={13} />Add Row
            </button>
            <span style={{ fontSize: 12, color: MUTED }}>{rows.length} rows · {totals.entries} filled</span>
          </div>

          {/* Totals Bar */}
          <div style={{ background: BLACK, padding: "12px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
            <div style={{ display: "flex", gap: 24 }}>
              {[["Entries", totals.entries], ["Packages", totals.pkg], ["Weight", totals.wt.toFixed(1) + " lbs"]].map(([l, v]) => (
                <div key={l}>
                  <span style={{ fontFamily: "Barlow, sans-serif", fontSize: 10, fontWeight: 700, color: MUTED, letterSpacing: "0.05em", textTransform: "uppercase" }}>{l}: </span>
                  <span style={{ fontFamily: "Barlow, sans-serif", fontSize: 14, fontWeight: 800, color: GREEN }}>{v}</span>
                </div>
              ))}
            </div>
            <div style={{ fontFamily: "Barlow, sans-serif", fontSize: 16, fontWeight: 800, color: GREEN }}>
              TOTAL: {fmt(totals.amt)}
            </div>
          </div>

          {/* Signature row */}
          <div style={{ padding: "18px 24px", background: SURFACE2, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 32, borderTop: `1px solid ${BORDER}` }}>
            {["Driver Signature", "Supervisor Approval", "Date"].map(label => (
              <div key={label}>
                <div style={{ borderBottom: `1.5px solid rgba(255,255,255,0.2)`, marginBottom: 5, height: 28 }} />
                <p style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: MUTED, margin: 0, fontFamily: "Barlow, sans-serif" }}>{label}</p>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div style={{ background: BLACK, padding: "10px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: `3px solid ${GREEN}` }}>
            <p style={{ fontSize: 10, color: "#555", margin: 0 }}>1615 N Newland Ave · Chicago, IL 60707 · +1 708.955.9082</p>
            <p style={{ fontFamily: "Barlow, sans-serif", fontSize: 10, fontWeight: 700, color: GREEN, margin: 0, fontStyle: "italic" }}>When tomorrow's too late!</p>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          input, select { color: black !important; background: transparent !important; border-color: #ccc !important; }
        }
      `}</style>
    </div>
  );
}

// ── Individual Row ──────────────────────────────────────────────────────────
function ReportRow({ row, index, driverJobs, showDropdown, onDropdown, onCloseDropdown, onFillJob, onChange, onRemove }) {
  const even = index % 2 === 0;
  const rowBg = even ? SURFACE : SURFACE2;
  const cellStyle = { borderRight: `1px solid ${BORDER}`, display: "flex", flexDirection: "column", position: "relative", minHeight: 64 };
  const cinStyle = { width: "100%", flex: 1, border: "none", background: "transparent", fontFamily: "Source Sans 3, sans-serif", fontSize: 12, color: TEXT, outline: "none", padding: "6px 8px" };
  const subLbl = { fontSize: 7, fontWeight: 700, color: MUTED, letterSpacing: "0.05em", textTransform: "uppercase", padding: "3px 7px 0", lineHeight: 1 };

  return (
    <div style={{ borderBottom: `1px solid ${BORDER}`, background: rowBg, position: "relative" }}>
      <div style={{ display: "grid", gridTemplateColumns: "62px 70px 1fr 1fr 1fr 100px 100px 108px", minHeight: 64 }}>

        {/* Date */}
        <div style={cellStyle}>
          <input type="date" value={row.date} onChange={e => onChange("date", e.target.value)}
            style={{ ...cinStyle, fontSize: 11, padding: "8px 5px", textAlign: "center" }} />
          {row.date && <div style={{ textAlign: "center", fontSize: 10, color: GREEN, padding: "0 4px 4px", fontWeight: 700, fontFamily: "Barlow, sans-serif" }}>{fmtDate(row.date).slice(0, 5)}</div>}
        </div>

        {/* Truck */}
        <div style={cellStyle}>
          <input placeholder="Truck #" value={row.truck} onChange={e => onChange("truck", e.target.value)} style={{ ...cinStyle, textAlign: "center" }} />
        </div>

        {/* Customer & Job — with job picker dropdown */}
        <div style={{ ...cellStyle, borderRight: `1px solid ${BORDER}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 7px 0", flex: 1 }}>
            <input placeholder="Customer name" value={row.cust} onChange={e => onChange("cust", e.target.value)}
              style={{ flex: 1, border: "none", background: "transparent", fontFamily: "Source Sans 3, sans-serif", fontSize: 12, color: TEXT, outline: "none", padding: "2px 0" }} />
            {driverJobs.length > 0 && (
              <button onClick={onDropdown} title="Pick from jobs" style={{ flexShrink: 0, background: "rgba(15,161,74,0.15)", border: `1px solid rgba(15,161,74,0.3)`, borderRadius: 4, padding: "2px 5px", cursor: "pointer", color: GREEN, display: "flex", alignItems: "center", gap: 2, fontSize: 10, fontWeight: 700, fontFamily: "Barlow, sans-serif" }}>
                Jobs <ChevronDown size={10} />
              </button>
            )}
          </div>
          <input placeholder="Job # / BOL" value={row.job} onChange={e => onChange("job", e.target.value)}
            style={{ ...cinStyle, fontSize: 11, borderTop: `1px solid ${BORDER}`, color: GREEN, fontWeight: 700 }} />

          {/* Job Dropdown */}
          {showDropdown && (
            <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#1a2128", border: `1px solid ${GREEN}`, borderRadius: 8, zIndex: 50, maxHeight: 200, overflowY: "auto", boxShadow: "0 8px 24px rgba(0,0,0,0.5)" }}>
              <div style={{ padding: "8px 12px", borderBottom: `1px solid ${BORDER}`, fontSize: 10, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "Barlow, sans-serif" }}>Select a job to auto-fill</div>
              {driverJobs.map(job => (
                <div key={job.id} onClick={() => onFillJob(job)} style={{ padding: "10px 12px", cursor: "pointer", borderBottom: `1px solid ${BORDER}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(15,161,74,0.1)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: GREEN, fontFamily: "Barlow, sans-serif" }}>{job.job_number}</span>
                    <span style={{ fontSize: 11, color: MUTED, marginLeft: 8 }}>{job.customer_name}</span>
                  </div>
                  <span style={{ fontSize: 11, color: MUTED }}>{job.pickup_city} → {job.delivery_city}</span>
                </div>
              ))}
              <div onClick={onCloseDropdown} style={{ padding: "8px 12px", cursor: "pointer", textAlign: "center", fontSize: 11, color: MUTED }}>Cancel</div>
            </div>
          )}
        </div>

        {/* Pickup */}
        <div style={{ ...cellStyle, borderRight: `1px solid ${BORDER}` }}>
          <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <div style={{ flex: 1, borderBottom: `1px solid ${BORDER}`, display: "flex", flexDirection: "column" }}>
              <span style={subLbl}>City</span>
              <input value={row.puc} onChange={e => onChange("puc", e.target.value)} style={{ ...cinStyle, padding: "2px 7px 4px", fontSize: 11 }} />
            </div>
            <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
              <span style={subLbl}>State</span>
              <input value={row.pus} onChange={e => onChange("pus", e.target.value)} style={{ ...cinStyle, padding: "2px 7px 4px", fontSize: 11 }} maxLength={2} />
            </div>
          </div>
        </div>

        {/* Delivery */}
        <div style={{ ...cellStyle, borderRight: `1px solid ${BORDER}` }}>
          <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <div style={{ flex: 1, borderBottom: `1px solid ${BORDER}`, display: "flex", flexDirection: "column" }}>
              <span style={subLbl}>City</span>
              <input value={row.dc} onChange={e => onChange("dc", e.target.value)} style={{ ...cinStyle, padding: "2px 7px 4px", fontSize: 11 }} />
            </div>
            <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
              <span style={subLbl}>State</span>
              <input value={row.ds} onChange={e => onChange("ds", e.target.value)} style={{ ...cinStyle, padding: "2px 7px 4px", fontSize: 11 }} maxLength={2} />
            </div>
          </div>
        </div>

        {/* Times */}
        <div style={{ ...cellStyle, borderRight: `1px solid ${BORDER}` }}>
          <div style={{ flex: 1, borderBottom: `1px solid ${BORDER}`, display: "flex", flexDirection: "column" }}>
            <span style={subLbl}>P/U Time</span>
            <input placeholder="09:00 AM" value={row.put} onChange={e => onChange("put", e.target.value)} style={{ ...cinStyle, padding: "2px 7px 4px", fontSize: 11 }} />
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <span style={subLbl}>Del Time</span>
            <input placeholder="11:30 AM" value={row.dt} onChange={e => onChange("dt", e.target.value)} style={{ ...cinStyle, padding: "2px 7px 4px", fontSize: 11 }} />
          </div>
        </div>

        {/* Packages / Weight */}
        <div style={{ ...cellStyle, borderRight: `1px solid ${BORDER}` }}>
          <div style={{ flex: 1, borderBottom: `1px solid ${BORDER}`, display: "flex", flexDirection: "column" }}>
            <span style={subLbl}>Packages</span>
            <input type="number" placeholder="0" value={row.pkg} onChange={e => onChange("pkg", e.target.value)} style={{ ...cinStyle, padding: "2px 7px 4px", fontSize: 11 }} />
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <span style={subLbl}>Weight (lbs)</span>
            <input type="number" placeholder="0" value={row.wt} onChange={e => onChange("wt", e.target.value)} style={{ ...cinStyle, padding: "2px 7px 4px", fontSize: 11 }} />
          </div>
        </div>

        {/* Admin Total — green tinted */}
        <div style={{ background: "rgba(15,161,74,0.06)", borderLeft: `2px solid ${GREEN}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 8 }}>
          <span style={{ fontSize: 7, fontWeight: 700, color: GREEN, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Pay ($)</span>
          <input type="number" placeholder="0.00" value={row.amt} onChange={e => onChange("amt", e.target.value)}
            style={{ border: "none", borderBottom: `1px dashed ${GREEN}`, background: "transparent", fontSize: 14, fontWeight: 800, color: GREEN, textAlign: "center", outline: "none", width: 80, padding: "2px 0", fontFamily: "Barlow, sans-serif" }} />
        </div>
      </div>

      {/* Notes sub-row */}
      <div style={{ display: "flex", alignItems: "center", background: "rgba(255,255,255,0.02)", borderTop: `1px solid ${BORDER}`, minHeight: 22 }}>
        <span style={{ fontSize: 8, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap", padding: "0 10px" }}>Notes:</span>
        <input value={row.notes} onChange={e => onChange("notes", e.target.value)} placeholder="Special instructions, comments…"
          style={{ flex: 1, border: "none", background: "transparent", fontFamily: "Source Sans 3, sans-serif", fontSize: 11, color: MUTED, outline: "none", padding: "3px 8px" }} />
        <button onClick={onRemove} title="Remove row" style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", opacity: 0.4, padding: "0 8px", fontSize: 13, lineHeight: 1 }}
          onMouseEnter={e => e.currentTarget.style.opacity = "1"}
          onMouseLeave={e => e.currentTarget.style.opacity = "0.4"}>✕</button>
      </div>
    </div>
  );
}
