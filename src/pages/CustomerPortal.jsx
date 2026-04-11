import { useState, useEffect } from "react";
import { Customer, Job } from "@/api/entities";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { Package, MapPin, CheckCircle, Clock, Truck, Download, Image, FileText, ChevronDown, Building2 } from "lucide-react";

// Fix leaflet default icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

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

const driverIcon = L.divIcon({
  className: "",
  html: `<div style="width:36px;height:36px;border-radius:50%;background:#7c3aed;border:3px solid #a78bfa;display:flex;align-items:center;justify-content:center;color:#fff;font-size:16px;box-shadow:0 2px 8px rgba(0,0,0,0.5)">🚚</div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

export default function CustomerPortal() {
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [expandedJob, setExpandedJob] = useState(null);
  const [activeTab, setActiveTab] = useState("active");

  useEffect(() => {
    Customer.filter({ status: "Active" }).then(c => { setCustomers(c); setLoading(false); });
    const saved = localStorage.getItem("me_customer_portal_id");
    if (saved) loadCustomer(saved);
  }, []);

  async function loadCustomer(customerId) {
    const all = await Customer.filter({ status: "Active" });
    const c = all.find(x => x.id === customerId);
    if (!c) return;
    setSelectedCustomer(c);
    localStorage.setItem("me_customer_portal_id", c.id);
    setLoadingJobs(true);
    const allJobs = await Job.filter({ customer_id: c.id });
    setJobs(allJobs.sort((a, b) => new Date(b.created_date) - new Date(a.created_date)));
    setLoadingJobs(false);
  }

  const logout = () => {
    localStorage.removeItem("me_customer_portal_id");
    setSelectedCustomer(null);
    setJobs([]);
  };

  const activeJobs = jobs.filter(j => !["Delivered", "Cancelled"].includes(j.status));
  const deliveredJobs = jobs.filter(j => j.status === "Delivered");
  const inTransitJobs = jobs.filter(j => j.status === "In Transit");

  if (loading) return (
    <div style={{ minHeight: "100vh", background: BG, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <img src={SHAMROCK} alt="" style={{ width: 40, animation: "spin 1.5s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  // ── Customer Select ──
  if (!selectedCustomer) return (
    <div style={{ minHeight: "100vh", background: BG, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "Source Sans 3, sans-serif" }}>
      <img src={LOGO} alt="Mahoney Express" style={{ width: 220, marginBottom: 32 }} />
      <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 20, padding: 32, width: "100%", maxWidth: 420, boxShadow: "0 8px 40px rgba(0,0,0,0.4)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <Building2 size={22} style={{ color: GREEN }} />
          <h1 style={{ fontFamily: "Barlow, sans-serif", fontSize: 20, fontWeight: 800, color: TEXT, margin: 0 }}>Customer Portal</h1>
        </div>
        <p style={{ color: MUTED, fontSize: 13, marginBottom: 24 }}>Select your company to track shipments and access delivery documents.</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {customers.map(c => (
            <button key={c.id} onClick={() => loadCustomer(c.id)}
              style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 18px", borderRadius: 12, background: SURFACE2, border: `1px solid ${BORDER}`, cursor: "pointer", textAlign: "left", transition: "all 0.15s", width: "100%" }}
              onMouseEnter={e => e.currentTarget.style.borderColor = GREEN}
              onMouseLeave={e => e.currentTarget.style.borderColor = BORDER}>
              <div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(15,161,74,0.15)", border: `2px solid ${GREEN}`, display: "flex", alignItems: "center", justifyContent: "center", color: GREEN, fontWeight: 800, fontSize: 14, flexShrink: 0 }}>
                {(c.company_name || "?")[0]}
              </div>
              <div>
                <p style={{ fontWeight: 700, color: TEXT, margin: 0, fontFamily: "Barlow, sans-serif" }}>{c.company_name}</p>
                {c.contact_name && <p style={{ fontSize: 12, color: MUTED, margin: "2px 0 0" }}>{c.contact_name}</p>}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const displayJobs = activeTab === "active" ? activeJobs : deliveredJobs;

  return (
    <div style={{ minHeight: "100vh", background: BG, fontFamily: "Source Sans 3, sans-serif", paddingBottom: 40 }}>
      {/* Header */}
      <div style={{ background: "#060204", padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `3px solid ${GREEN}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img src={SHAMROCK} alt="" style={{ width: 22, height: 22 }} />
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, color: GREEN, textTransform: "uppercase", letterSpacing: "0.1em", margin: 0, fontFamily: "Barlow, sans-serif" }}>Customer Portal</p>
            <p style={{ fontSize: 16, fontWeight: 800, color: TEXT, margin: 0, fontFamily: "Barlow, sans-serif" }}>{selectedCustomer.company_name}</p>
          </div>
        </div>
        <button onClick={logout} style={{ fontSize: 12, fontWeight: 700, color: MUTED, background: "none", border: `1px solid ${BORDER}`, borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontFamily: "Barlow, sans-serif" }}>
          Switch Account
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, padding: "16px 16px 0" }}>
        {[
          { label: "Active Jobs", value: activeJobs.length, color: "#60a5fa" },
          { label: "In Transit", value: inTransitJobs.length, color: "#a78bfa" },
          { label: "Delivered", value: deliveredJobs.length, color: GREEN },
        ].map(s => (
          <div key={s.label} style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 12, padding: "14px 16px", textAlign: "center" }}>
            <p style={{ fontSize: 28, fontWeight: 800, color: s.color, margin: 0, fontFamily: "Barlow, sans-serif", lineHeight: 1 }}>{s.value}</p>
            <p style={{ fontSize: 11, color: MUTED, margin: "4px 0 0", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Live Map for In-Transit jobs */}
      {inTransitJobs.length > 0 && (
        <div style={{ margin: "16px 16px 0", background: SURFACE, border: `1px solid rgba(139,92,246,0.3)`, borderRadius: 16, overflow: "hidden" }}>
          <div style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: 8, borderBottom: `1px solid ${BORDER}` }}>
            <MapPin size={15} style={{ color: "#a78bfa" }} />
            <span style={{ fontFamily: "Barlow, sans-serif", fontWeight: 700, color: TEXT, fontSize: 14 }}>Live Delivery Tracking</span>
            <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 10px", borderRadius: 20, background: "rgba(139,92,246,0.15)", color: "#a78bfa", marginLeft: "auto" }}>{inTransitJobs.length} In Transit</span>
          </div>
          <LiveTrackingMap jobs={inTransitJobs} driverIcon={driverIcon} />
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, padding: "16px 16px 0" }}>
        {[{ id: "active", label: "Active Orders", count: activeJobs.length }, { id: "delivered", label: "Completed", count: deliveredJobs.length }].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{ padding: "8px 16px", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer", background: activeTab === t.id ? GREEN : "transparent", color: activeTab === t.id ? "#fff" : MUTED, border: `1px solid ${activeTab === t.id ? GREEN : BORDER}`, fontFamily: "Barlow, sans-serif", transition: "all 0.15s" }}>
            {t.label} <span style={{ opacity: 0.7 }}>{t.count}</span>
          </button>
        ))}
      </div>

      {/* Jobs List */}
      <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
        {loadingJobs ? (
          <div style={{ textAlign: "center", padding: 48, color: MUTED }}>Loading orders…</div>
        ) : displayJobs.length === 0 ? (
          <div style={{ textAlign: "center", padding: 48, color: MUTED }}>
            <Package size={36} style={{ marginBottom: 12, opacity: 0.2 }} />
            <p style={{ fontSize: 14 }}>No {activeTab === "active" ? "active" : "completed"} orders.</p>
          </div>
        ) : displayJobs.map(job => (
          <JobCard
            key={job.id}
            job={job}
            expanded={expandedJob === job.id}
            onToggle={() => setExpandedJob(expandedJob === job.id ? null : job.id)}
          />
        ))}
      </div>
    </div>
  );
}

function LiveTrackingMap({ jobs, driverIcon }) {
  // Try to get driver GPS from job context — show delivery city markers as fallback
  const markers = jobs.filter(j => j.delivery_city);

  return (
    <div style={{ height: 260 }}>
      <MapContainer
        center={[41.8827, -87.6233]}
        zoom={7}
        style={{ height: "100%", width: "100%", background: "#1a1a2e" }}
        zoomControl={true}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        />
        {jobs.map(job => (
          <DriverMarker key={job.id} job={job} driverIcon={driverIcon} />
        ))}
      </MapContainer>
    </div>
  );
}

function DriverMarker({ job, driverIcon }) {
  const [coords, setCoords] = useState(null);

  useEffect(() => {
    // Use delivery address for map marker
    const addr = job.delivery_address ? `${job.delivery_address}, ${job.delivery_city}, ${job.delivery_state}` : `${job.delivery_city}, ${job.delivery_state}`;
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addr)}&limit=1`)
      .then(r => r.json())
      .then(data => { if (data[0]) setCoords([parseFloat(data[0].lat), parseFloat(data[0].lon)]); })
      .catch(() => {});
  }, [job.id]);

  if (!coords) return null;
  return (
    <Marker position={coords} icon={driverIcon}>
      <Popup>
        <div style={{ minWidth: 160 }}>
          <strong style={{ color: "#7c3aed" }}>{job.job_number}</strong><br />
          <span style={{ fontSize: 12 }}>Delivering to: {job.delivery_city}, {job.delivery_state}</span><br />
          {job.driver_name && <span style={{ fontSize: 12, color: "#888" }}>Driver: {job.driver_name}</span>}
        </div>
      </Popup>
    </Marker>
  );
}

function JobCard({ job, expanded, onToggle }) {
  const sc = STATUS_CFG[job.status] || STATUS_CFG.Pending;
  const podPhotos = job.pod_photos ? JSON.parse(job.pod_photos) : [];
  const hasPOD = podPhotos.length > 0 || job.pod_signature;

  return (
    <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 16, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.3)" }}>
      {/* Job Header */}
      <div onClick={onToggle} style={{ padding: "16px 18px", cursor: "pointer", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span style={{ fontFamily: "Barlow, sans-serif", fontWeight: 800, color: GREEN, fontSize: 15 }}>{job.job_number}</span>
            <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 10px", borderRadius: 20, background: sc.bg, color: sc.text }}>{sc.label}</span>
            {hasPOD && <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: "rgba(15,161,74,0.15)", color: GREEN }}>📄 POD</span>}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: MUTED }}>
            <MapPin size={11} />
            <span>{job.pickup_city || "?"} → {job.delivery_city || "?"}</span>
          </div>
          {job.deadline && (
            <p style={{ fontSize: 11, color: MUTED, margin: "3px 0 0" }}>
              <Clock size={10} style={{ display: "inline", marginRight: 4 }} />
              Due: {new Date(job.deadline).toLocaleString()}
            </p>
          )}
        </div>
        <ChevronDown size={18} style={{ color: MUTED, flexShrink: 0, transform: expanded ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div style={{ borderTop: `1px solid ${BORDER}`, padding: "16px 18px", background: SURFACE2 }}>
          {/* Addresses */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
            <div style={{ background: "rgba(15,161,74,0.06)", borderRadius: 10, padding: 12, border: "1px solid rgba(15,161,74,0.15)" }}>
              <p style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: GREEN, margin: "0 0 6px", fontFamily: "Barlow, sans-serif" }}>Pickup</p>
              <p style={{ fontSize: 12, color: TEXT, margin: 0, lineHeight: 1.4 }}>{job.pickup_address || "—"}</p>
              <p style={{ fontSize: 12, color: MUTED, margin: "2px 0 0" }}>{job.pickup_city}, {job.pickup_state}</p>
            </div>
            <div style={{ background: "rgba(239,68,68,0.05)", borderRadius: 10, padding: 12, border: "1px solid rgba(239,68,68,0.12)" }}>
              <p style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#f87171", margin: "0 0 6px", fontFamily: "Barlow, sans-serif" }}>Delivery</p>
              <p style={{ fontSize: 12, color: TEXT, margin: 0, lineHeight: 1.4 }}>{job.delivery_address || "—"}</p>
              <p style={{ fontSize: 12, color: MUTED, margin: "2px 0 0" }}>{job.delivery_city}, {job.delivery_state}</p>
            </div>
          </div>

          {/* Freight */}
          {(job.pieces || job.weight_lbs || job.description) && (
            <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: 12, marginBottom: 16, border: `1px solid ${BORDER}` }}>
              <p style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: MUTED, margin: "0 0 8px", fontFamily: "Barlow, sans-serif" }}>Freight</p>
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                {job.pieces && <span style={{ fontSize: 12, color: TEXT }}><strong>{job.pieces}</strong> pcs</span>}
                {job.weight_lbs && <span style={{ fontSize: 12, color: TEXT }}><strong>{job.weight_lbs}</strong> lbs</span>}
                {job.description && <span style={{ fontSize: 12, color: MUTED }}>{job.description}</span>}
              </div>
            </div>
          )}

          {/* Status Timeline */}
          <div style={{ marginBottom: hasPOD ? 16 : 0 }}>
            <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: MUTED, margin: "0 0 10px", fontFamily: "Barlow, sans-serif" }}>Delivery Progress</p>
            <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
              {["Pending", "Assigned", "In Transit", "Delivered"].map((s, i) => {
                const statuses = ["Pending", "Assigned", "In Transit", "Delivered"];
                const currentIdx = statuses.indexOf(job.status);
                const done = i <= currentIdx;
                const active = i === currentIdx;
                return (
                  <div key={s} style={{ display: "flex", alignItems: "center", flex: i < 3 ? 1 : "none" }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                      <div style={{ width: 28, height: 28, borderRadius: "50%", background: done ? GREEN : "rgba(255,255,255,0.07)", border: `2px solid ${done ? GREEN : BORDER}`, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }}>
                        {done ? <CheckCircle size={14} style={{ color: "#fff" }} /> : <div style={{ width: 8, height: 8, borderRadius: "50%", background: BORDER }} />}
                      </div>
                      <span style={{ fontSize: 9, fontWeight: 700, color: active ? GREEN : done ? "#4ade80" : MUTED, textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>{s}</span>
                    </div>
                    {i < 3 && <div style={{ flex: 1, height: 2, background: done && i < currentIdx ? GREEN : BORDER, margin: "0 4px", marginBottom: 20 }} />}
                  </div>
                );
              })}
            </div>
          </div>

          {/* POD Section */}
          {hasPOD && (
            <div style={{ background: "rgba(15,161,74,0.06)", borderRadius: 12, padding: 14, border: "1px solid rgba(15,161,74,0.2)" }}>
              <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: GREEN, margin: "0 0 12px", fontFamily: "Barlow, sans-serif" }}>
                ✓ Proof of Delivery Documents
              </p>
              {job.pod_captured_at && (
                <p style={{ fontSize: 11, color: MUTED, margin: "0 0 12px" }}>Captured: {new Date(job.pod_captured_at).toLocaleString()}</p>
              )}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                {podPhotos.map((url, i) => (
                  <div key={i} style={{ position: "relative" }}>
                    <a href={url} target="_blank" rel="noreferrer">
                      <img src={url} alt={`POD ${i + 1}`} style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 8, border: `2px solid rgba(15,161,74,0.3)`, display: "block" }} />
                    </a>
                    <a href={url} download={`POD-${job.job_number}-photo-${i + 1}.jpg`} target="_blank" rel="noreferrer"
                      style={{ position: "absolute", bottom: 4, right: 4, width: 20, height: 20, borderRadius: "50%", background: GREEN, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Download size={10} style={{ color: "#fff" }} />
                    </a>
                  </div>
                ))}
                {job.pod_signature && (
                  <div style={{ position: "relative" }}>
                    <a href={job.pod_signature} target="_blank" rel="noreferrer">
                      <div style={{ width: 80, height: 80, borderRadius: 8, border: `2px solid rgba(15,161,74,0.3)`, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 4 }}>
                        <FileText size={24} style={{ color: "#333" }} />
                        <span style={{ fontSize: 9, fontWeight: 700, color: "#333" }}>SIGNATURE</span>
                      </div>
                    </a>
                    <a href={job.pod_signature} download={`POD-${job.job_number}-signature.png`} target="_blank" rel="noreferrer"
                      style={{ position: "absolute", bottom: 4, right: 4, width: 20, height: 20, borderRadius: "50%", background: GREEN, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Download size={10} style={{ color: "#fff" }} />
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}