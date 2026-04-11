import { useState, useEffect } from "react";
import { calculateRoute } from "@/functions/calculateRoute";
import { Driver, Job } from "@/api/entities";
import { base44 } from "@/api/base44Client";
import { Camera, Truck, CheckCircle, Clock, MapPin, Package, ChevronDown, Upload, X } from "lucide-react";
import { updateDriverLocation } from "@/functions/updateDriverLocation";

const GREEN = "#0fa14a";
const BG = "#0e1012";
const SURFACE = "#161a1d";
const SURFACE2 = "#1e2328";
const BORDER = "rgba(255,255,255,0.07)";
const TEXT = "#f0f0ee";
const MUTED = "#8a8a85";
const LOGO = "https://media.base44.com/images/public/69cb07fb94b4627f0bd76151/a863be72e_MahoneyExpressInc-Header.png";
const SHAMROCK = "https://media.base44.com/images/public/69cb07fb94b4627f0bd76151/828dbca4e_Shamrock.png";

const STATUS_CFG = {
  Pending:      { bg: "rgba(245,158,11,0.15)",  text: "#fbbf24", label: "Pending" },
  Assigned:     { bg: "rgba(59,130,246,0.15)",  text: "#60a5fa", label: "Assigned" },
  "In Transit": { bg: "rgba(139,92,246,0.15)",  text: "#a78bfa", label: "In Transit" },
  Delivered:    { bg: "rgba(15,161,74,0.15)",   text: "#4ade80", label: "Delivered" },
  Cancelled:    { bg: "rgba(239,68,68,0.15)",   text: "#f87171", label: "Cancelled" },
};

export default function DriverPortal() {
  const [drivers, setDrivers] = useState([]);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [expandedJob, setExpandedJob] = useState(null);
  const [updating, setUpdating] = useState(null);
  const [uploadingJobId, setUploadingJobId] = useState(null);
  const [toast, setToast] = useState("");
  const [routeOptimized, setRouteOptimized] = useState(false);
  const [routeSummary, setRouteSummary] = useState("");
  const [routeMiles, setRouteMiles] = useState(null);
  const [optimizing, setOptimizing] = useState(false);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  useEffect(() => {
    Driver.filter({ status: "Active" }).then(d => { setDrivers(d); setLoading(false); });
    // Restore saved driver
    const saved = localStorage.getItem("me_driver_id");
    if (saved) loadDriver(saved);
  }, []);

  async function loadDriver(driverId) {
    const d = drivers.find(x => x.id === driverId) || (await Driver.filter({ status: "Active" })).find(x => x.id === driverId);
    if (!d) return;
    setSelectedDriver(d);
    localStorage.setItem("me_driver_id", d.id);
    setLoadingJobs(true);
    const today = new Date().toISOString().split("T")[0];
    const allJobs = await Job.filter({ driver_id: d.id });
    const todayJobs = allJobs.filter(j =>
      ["Assigned", "In Transit", "Delivered"].includes(j.status) &&
      (j.updated_date?.startsWith(today) || j.created_date?.startsWith(today) || j.status !== "Delivered")
    ).sort((a, b) => {
      const order = { "In Transit": 0, Assigned: 1, Delivered: 2 };
      return (order[a.status] ?? 9) - (order[b.status] ?? 9);
    });
    setJobs(todayJobs);
    setRouteOptimized(false);
    setRouteSummary("");
    setLoadingJobs(false);
  }

  async function optimizeRoute() {
    const activeJobs = jobs.filter(j => j.status !== "Delivered" && j.status !== "Cancelled");
    if (activeJobs.length < 2) { showToast("Need at least 2 active jobs to optimize."); return; }
    setOptimizing(true);
    try {
      const res = await calculateRoute({ jobs: activeJobs });
      const { orderedJobs, summary, estimated_total_miles } = res.data;
      // Rebuild full job list: optimized active jobs first, then delivered/cancelled
      const rest = jobs.filter(j => j.status === "Delivered" || j.status === "Cancelled");
      setJobs([...orderedJobs, ...rest]);
      setRouteOptimized(true);
      setRouteSummary(summary || "");
      setRouteMiles(estimated_total_miles || null);
      showToast("✓ Route optimized!");
    } catch (e) {
      showToast("Optimization failed: " + e.message);
    }
    setOptimizing(false);
  }

  async function updateStatus(job, newStatus) {
    setUpdating(job.id);
    await Job.update(job.id, { status: newStatus });
    setJobs(js => js.map(j => j.id === job.id ? { ...j, status: newStatus } : j));
    showToast(`✓ ${job.job_number} marked ${newStatus}`);
    setUpdating(null);
    // Push GPS location when going In Transit or Delivered
    if ((newStatus === "In Transit" || newStatus === "Delivered") && selectedDriver) {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            updateDriverLocation({
              driver_id: selectedDriver.id,
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
              job_id: job.id,
              job_number: job.job_number,
              is_on_route: newStatus === "In Transit",
            }).catch(() => {});
          },
          () => {} // silently fail if GPS denied
        );
      }
    }
  }

  async function uploadPOD(job, file) {
    if (!file) return;
    setUploadingJobId(job.id);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const existing = job.pod_photos ? JSON.parse(job.pod_photos) : [];
      const updated = [...existing, file_url];
      await Job.update(job.id, { pod_photos: JSON.stringify(updated) });
      setJobs(js => js.map(j => j.id === job.id ? { ...j, pod_photos: JSON.stringify(updated) } : j));
      showToast("✓ Photo uploaded!");
    } catch (e) {
      showToast("Upload failed: " + e.message);
    }
    setUploadingJobId(null);
  }

  const logout = () => {
    localStorage.removeItem("me_driver_id");
    setSelectedDriver(null);
    setJobs([]);
  };

  if (loading) return (
    <div style={{ minHeight: "100vh", background: BG, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <img src={SHAMROCK} alt="" style={{ width: 40, animation: "spin 1.5s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  // ── Driver Select Screen ──
  if (!selectedDriver) return (
    <div style={{ minHeight: "100vh", background: BG, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "Source Sans 3, sans-serif" }}>
      <img src={LOGO} alt="Mahoney Express" style={{ width: 200, marginBottom: 32 }} />
      <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 20, padding: 32, width: "100%", maxWidth: 380, boxShadow: "0 8px 40px rgba(0,0,0,0.4)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
          <Truck size={22} style={{ color: GREEN }} />
          <h1 style={{ fontFamily: "Barlow, sans-serif", fontSize: 20, fontWeight: 800, color: TEXT, margin: 0 }}>Driver Portal</h1>
        </div>
        <p style={{ color: MUTED, fontSize: 13, marginBottom: 20 }}>Select your name to view your assigned jobs.</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {drivers.map(d => (
            <button key={d.id} onClick={() => loadDriver(d.id)}
              style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 18px", borderRadius: 12, background: SURFACE2, border: `1px solid ${BORDER}`, cursor: "pointer", textAlign: "left", transition: "all 0.15s" }}
              onMouseEnter={e => e.currentTarget.style.borderColor = GREEN}
              onMouseLeave={e => e.currentTarget.style.borderColor = BORDER}>
              <div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(15,161,74,0.15)", border: `2px solid ${GREEN}`, display: "flex", alignItems: "center", justifyContent: "center", color: GREEN, fontWeight: 800, fontSize: 14, fontFamily: "Barlow, sans-serif", flexShrink: 0 }}>
                {(d.first_name||"?")[0]}{(d.last_name||"?")[0]}
              </div>
              <div>
                <p style={{ fontWeight: 700, color: TEXT, margin: 0, fontFamily: "Barlow, sans-serif" }}>{d.first_name} {d.last_name}</p>
                <p style={{ fontSize: 12, color: MUTED, margin: "2px 0 0" }}>{d.vehicle_type || "Driver"}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const activeCount = jobs.filter(j => j.status === "In Transit").length;
  const doneCount = jobs.filter(j => j.status === "Delivered").length;

  // ── Driver Dashboard ──
  return (
    <div style={{ minHeight: "100vh", background: BG, fontFamily: "Source Sans 3, sans-serif", paddingBottom: 40 }}>
      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", background: "#060204", color: GREEN, fontFamily: "Barlow, sans-serif", fontWeight: 700, fontSize: 13, padding: "10px 22px", borderRadius: 10, border: `1px solid ${GREEN}`, zIndex: 9999, boxShadow: "0 4px 20px rgba(0,0,0,0.5)", whiteSpace: "nowrap" }}>
          {toast}
        </div>
      )}

      {/* Header */}
      <div style={{ background: "#060204", padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `3px solid ${GREEN}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img src={SHAMROCK} alt="" style={{ width: 22, height: 22 }} />
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, color: GREEN, textTransform: "uppercase", letterSpacing: "0.1em", margin: 0, fontFamily: "Barlow, sans-serif" }}>Driver Portal</p>
            <p style={{ fontSize: 16, fontWeight: 800, color: TEXT, margin: 0, fontFamily: "Barlow, sans-serif" }}>{selectedDriver.first_name} {selectedDriver.last_name}</p>
          </div>
        </div>
        <button onClick={logout} style={{ fontSize: 12, fontWeight: 700, color: MUTED, background: "none", border: `1px solid ${BORDER}`, borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontFamily: "Barlow, sans-serif" }}>
          Switch Driver
        </button>
      </div>

      {/* Optimize Route Banner */}
      <div style={{ padding: "12px 16px 0" }}>
        {!routeOptimized ? (
          <button onClick={optimizeRoute} disabled={optimizing || jobs.filter(j=>j.status!=="Delivered"&&j.status!=="Cancelled").length < 2}
            style={{ width: "100%", padding: "12px 16px", borderRadius: 12, background: optimizing ? SURFACE2 : "rgba(15,161,74,0.15)", color: optimizing ? MUTED : GREEN, border: `1px solid ${optimizing ? BORDER : "rgba(15,161,74,0.4)"}`, fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "Barlow, sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            {optimizing ? (
              <><div style={{ width: 14, height: 14, borderRadius: "50%", border: `2px solid ${MUTED}`, borderTopColor: GREEN, animation: "spin 1s linear infinite" }} />Calculating optimal route…</>
            ) : (
              <>🗺 Optimize My Route ({jobs.filter(j=>j.status!=="Delivered"&&j.status!=="Cancelled").length} stops)</>
            )}
          </button>
        ) : (
          <div style={{ background: "rgba(15,161,74,0.08)", border: "1px solid rgba(15,161,74,0.25)", borderRadius: 12, padding: "12px 14px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: routeSummary ? 6 : 0 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: GREEN, fontFamily: "Barlow, sans-serif" }}>✓ Route Optimized{routeMiles ? ` · ~${routeMiles} mi` : ""}</span>
              <button onClick={optimizeRoute} style={{ fontSize: 11, color: MUTED, background: "none", border: "none", cursor: "pointer" }}>Re-optimize</button>
            </div>
            {routeSummary && <p style={{ fontSize: 12, color: MUTED, margin: 0, lineHeight: 1.4 }}>{routeSummary}</p>}
          </div>
        )}
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, padding: "16px 16px 0" }}>
        {[
          { label: "Total Jobs", value: jobs.length, color: TEXT },
          { label: "In Transit", value: activeCount, color: "#a78bfa" },
          { label: "Delivered", value: doneCount, color: GREEN },
        ].map(s => (
          <div key={s.label} style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 12, padding: "14px 16px", textAlign: "center" }}>
            <p style={{ fontSize: 28, fontWeight: 800, color: s.color, margin: 0, fontFamily: "Barlow, sans-serif", lineHeight: 1 }}>{s.value}</p>
            <p style={{ fontSize: 11, color: MUTED, margin: "4px 0 0", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Jobs */}
      <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
        {loadingJobs ? (
          <div style={{ textAlign: "center", padding: 48, color: MUTED }}>Loading your jobs…</div>
        ) : jobs.length === 0 ? (
          <div style={{ textAlign: "center", padding: 48, color: MUTED }}>
            <Package size={36} style={{ marginBottom: 12, opacity: 0.2 }} />
            <p style={{ fontSize: 14 }}>No jobs assigned for today.</p>
          </div>
        ) : jobs.map((job, index) => {
          const sc = STATUS_CFG[job.status] || STATUS_CFG.Assigned;
          const isExpanded = expandedJob === job.id;
          const podPhotos = job.pod_photos ? JSON.parse(job.pod_photos) : [];
          const isUpdating = updating === job.id;
          const isUploading = uploadingJobId === job.id;

          const stopNumber = index + 1;
          const isNextStop = routeOptimized && index === jobs.filter(j=>j.status!=="Delivered"&&j.status!=="Cancelled").findIndex(j=>j.id===job.id) && job.status !== "Delivered" && job.status !== "Cancelled" && index === 0;

          return (
            <div key={job.id} style={{ background: SURFACE, border: `1px solid ${isNextStop ? GREEN : BORDER}`, borderRadius: 16, overflow: "hidden", boxShadow: isNextStop ? `0 0 0 2px rgba(15,161,74,0.3), 0 2px 12px rgba(0,0,0,0.3)` : "0 2px 12px rgba(0,0,0,0.3)" }}>
              {/* Next Stop Badge */}
              {isNextStop && (
                <div style={{ background: GREEN, padding: "5px 16px", display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: "#fff", fontFamily: "Barlow, sans-serif", letterSpacing: "0.07em", textTransform: "uppercase" }}>▶ Next Stop</span>
                </div>
              )}
              {routeOptimized && !isNextStop && job.status !== "Delivered" && job.status !== "Cancelled" && (
                <div style={{ background: SURFACE2, padding: "3px 16px" }}>
                  <span style={{ fontSize: 10, color: MUTED, fontWeight: 700, fontFamily: "Barlow, sans-serif" }}>Stop #{stopNumber}</span>
                </div>
              )}

              {/* Job Header */}
              <div onClick={() => setExpandedJob(isExpanded ? null : job.id)}
                style={{ padding: "16px 18px", cursor: "pointer", display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{ fontFamily: "Barlow, sans-serif", fontWeight: 800, color: GREEN, fontSize: 15 }}>{job.job_number}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 10px", borderRadius: 20, background: sc.bg, color: sc.text }}>{sc.label}</span>
                  </div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: TEXT, margin: "0 0 2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{job.customer_name || "—"}</p>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: MUTED }}>
                    <MapPin size={11} />
                    <span>{job.pickup_city || "?"} → {job.delivery_city || "?"}</span>
                  </div>
                </div>
                <ChevronDown size={18} style={{ color: MUTED, flexShrink: 0, transform: isExpanded ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div style={{ borderTop: `1px solid ${BORDER}`, padding: "16px 18px", background: SURFACE2 }}>
                  {/* Addresses */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                    <div style={{ background: "rgba(15,161,74,0.06)", borderRadius: 10, padding: 12, border: "1px solid rgba(15,161,74,0.15)" }}>
                      <p style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: GREEN, margin: "0 0 6px", fontFamily: "Barlow, sans-serif" }}>Pickup</p>
                      <p style={{ fontSize: 12, color: TEXT, margin: 0, lineHeight: 1.4 }}>{job.pickup_address || "—"}</p>
                      <p style={{ fontSize: 12, color: MUTED, margin: "2px 0 0" }}>{job.pickup_city}, {job.pickup_state}</p>
                      {job.pickup_contact && <p style={{ fontSize: 11, color: MUTED, margin: "4px 0 0" }}>Attn: {job.pickup_contact}</p>}
                      {job.pickup_phone && <p style={{ fontSize: 11, color: MUTED, margin: "1px 0 0" }}>📞 {job.pickup_phone}</p>}
                    </div>
                    <div style={{ background: "rgba(239,68,68,0.05)", borderRadius: 10, padding: 12, border: "1px solid rgba(239,68,68,0.12)" }}>
                      <p style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#f87171", margin: "0 0 6px", fontFamily: "Barlow, sans-serif" }}>Delivery</p>
                      <p style={{ fontSize: 12, color: TEXT, margin: 0, lineHeight: 1.4 }}>{job.delivery_address || "—"}</p>
                      <p style={{ fontSize: 12, color: MUTED, margin: "2px 0 0" }}>{job.delivery_city}, {job.delivery_state}</p>
                      {job.delivery_contact && <p style={{ fontSize: 11, color: MUTED, margin: "4px 0 0" }}>Attn: {job.delivery_contact}</p>}
                      {job.delivery_phone && <p style={{ fontSize: 11, color: MUTED, margin: "1px 0 0" }}>📞 {job.delivery_phone}</p>}
                    </div>
                  </div>

                  {/* Freight Info */}
                  {(job.pieces || job.weight_lbs || job.description) && (
                    <div style={{ background: SURFACE, borderRadius: 10, padding: 12, marginBottom: 16, border: `1px solid ${BORDER}` }}>
                      <p style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: MUTED, margin: "0 0 8px", fontFamily: "Barlow, sans-serif" }}>Freight</p>
                      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                        {job.pieces && <span style={{ fontSize: 12, color: TEXT }}><strong>{job.pieces}</strong> pcs</span>}
                        {job.weight_lbs && <span style={{ fontSize: 12, color: TEXT }}><strong>{job.weight_lbs}</strong> lbs</span>}
                        {job.description && <span style={{ fontSize: 12, color: MUTED }}>{job.description}</span>}
                      </div>
                      {job.special_instructions && <p style={{ fontSize: 12, color: "#fbbf24", margin: "8px 0 0" }}>⚠ {job.special_instructions}</p>}
                    </div>
                  )}

                  {/* Status Actions */}
                  {job.status !== "Delivered" && job.status !== "Cancelled" && (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
                      {job.status !== "In Transit" && (
                        <button onClick={() => updateStatus(job, "In Transit")} disabled={isUpdating}
                          style={{ padding: "12px", borderRadius: 12, background: "rgba(139,92,246,0.15)", color: "#a78bfa", border: "1px solid rgba(139,92,246,0.3)", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "Barlow, sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, opacity: isUpdating ? 0.5 : 1 }}>
                          <Truck size={15} />{isUpdating ? "Updating…" : "Mark In Transit"}
                        </button>
                      )}
                      <button onClick={() => updateStatus(job, "Delivered")} disabled={isUpdating}
                        style={{ padding: "12px", borderRadius: 12, background: "rgba(15,161,74,0.15)", color: GREEN, border: `1px solid rgba(15,161,74,0.3)`, fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "Barlow, sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, opacity: isUpdating ? 0.5 : 1, gridColumn: job.status === "In Transit" ? "span 2" : "auto" }}>
                        <CheckCircle size={15} />{isUpdating ? "Updating…" : "Mark Delivered"}
                      </button>
                    </div>
                  )}

                  {/* POD Upload */}
                  <div>
                    <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: MUTED, margin: "0 0 10px", fontFamily: "Barlow, sans-serif" }}>Proof of Delivery Photos</p>
                    {podPhotos.length > 0 && (
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
                        {podPhotos.map((url, i) => (
                          <a key={i} href={url} target="_blank" rel="noreferrer">
                            <img src={url} alt={`POD ${i+1}`} style={{ width: 72, height: 72, objectFit: "cover", borderRadius: 8, border: `1px solid ${BORDER}` }} />
                          </a>
                        ))}
                      </div>
                    )}
                    <label style={{ display: "flex", alignItems: "center", gap: 8, padding: "11px 16px", borderRadius: 12, background: SURFACE, border: `1px dashed rgba(255,255,255,0.15)`, cursor: isUploading ? "not-allowed" : "pointer", color: MUTED, fontSize: 13, fontWeight: 600 }}>
                      <Camera size={15} style={{ color: isUploading ? MUTED : GREEN }} />
                      {isUploading ? "Uploading…" : "Upload Photo"}
                      <input type="file" accept="image/*" capture="environment" style={{ display: "none" }} disabled={isUploading}
                        onChange={e => uploadPOD(job, e.target.files[0])} />
                    </label>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}