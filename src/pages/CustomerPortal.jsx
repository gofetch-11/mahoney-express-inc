import { useState, useEffect } from "react";
import { Job, Customer } from "@/api/entities";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { Package, MapPin, CheckCircle, Clock, Truck, Download, Image, FileSignature, Search, ChevronDown, ChevronUp } from "lucide-react";

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

const PROGRESS_STEPS = ["Pending", "Assigned", "In Transit", "Delivered"];

function ProgressBar({ status }) {
  const stepIndex = PROGRESS_STEPS.indexOf(status);
  if (status === "Cancelled") return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#f87171" }}>
      <span>⚠</span> Order Cancelled
    </div>
  );
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0, width: "100%" }}>
      {PROGRESS_STEPS.map((step, i) => {
        const done = i <= stepIndex;
        const active = i === stepIndex;
        return (
          <div key={step} style={{ display: "flex", alignItems: "center", flex: i < PROGRESS_STEPS.length - 1 ? 1 : "none" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div style={{
                width: 28, height: 28, borderRadius: "50%",
                background: done ? GREEN : SURFACE2,
                border: `2px solid ${done ? GREEN : BORDER}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 12, color: done ? "#fff" : MUTED,
                fontWeight: 700, flexShrink: 0,
                boxShadow: active ? `0 0 0 4px rgba(15,161,74,0.2)` : "none",
              }}>
                {done && i < stepIndex ? "✓" : i + 1}
              </div>
              <span style={{ fontSize: 9, color: done ? GREEN : MUTED, fontWeight: done ? 700 : 400, fontFamily: "Barlow, sans-serif", textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>{step}</span>
            </div>
            {i < PROGRESS_STEPS.length - 1 && (
              <div style={{ flex: 1, height: 2, background: done && i < stepIndex ? GREEN : BORDER, margin: "0 4px", marginBottom: 16 }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function JobCard({ job }) {
  const [expanded, setExpanded] = useState(false);
  const sc = STATUS_CFG[job.status] || STATUS_CFG.Pending;
  const podPhotos = job.pod_photos ? (() => { try { return JSON.parse(job.pod_photos); } catch { return []; } })() : [];
  const hasPOD = job.status === "Delivered" && (podPhotos.length > 0 || job.pod_signature);

  return (
    <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 16, overflow: "hidden", marginBottom: 12 }}>
      {/* Header */}
      <div onClick={() => setExpanded(!expanded)} style={{ padding: "16px 20px", cursor: "pointer", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <span style={{ fontFamily: "Barlow, sans-serif", fontWeight: 800, color: GREEN, fontSize: 15 }}>{job.job_number}</span>
            <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 10px", borderRadius: 20, background: sc.bg, color: sc.text }}>{sc.label}</span>
            {hasPOD && <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 10px", borderRadius: 20, background: "rgba(15,161,74,0.15)", color: GREEN }}>✓ POD</span>}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: MUTED }}>
            <MapPin size={11} />
            <span>{job.pickup_city || "?"} → {job.delivery_city || "?"}</span>
            {job.service_type && <><span style={{ color: BORDER }}>·</span><span>{job.service_type}</span></>}
          </div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0, marginRight: 8 }}>
          {job.deadline && (
            <p style={{ fontSize: 11, color: MUTED, margin: 0 }}>Due: {new Date(job.deadline).toLocaleDateString()}</p>
          )}
          {job.pieces && <p style={{ fontSize: 11, color: MUTED, margin: "2px 0 0" }}>{job.pieces} pcs{job.weight_lbs ? ` · ${job.weight_lbs} lbs` : ""}</p>}
        </div>
        {expanded ? <ChevronUp size={16} style={{ color: MUTED, flexShrink: 0 }} /> : <ChevronDown size={16} style={{ color: MUTED, flexShrink: 0 }} />}
      </div>

      {/* Progress */}
      <div style={{ padding: "0 20px 16px" }}>
        <ProgressBar status={job.status} />
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div style={{ borderTop: `1px solid ${BORDER}`, padding: "16px 20px", background: SURFACE2 }}>
          {/* Addresses */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
            <div style={{ background: "rgba(15,161,74,0.06)", borderRadius: 10, padding: 12, border: "1px solid rgba(15,161,74,0.15)" }}>
              <p style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: GREEN, margin: "0 0 6px", fontFamily: "Barlow, sans-serif" }}>Pickup</p>
              <p style={{ fontSize: 12, color: TEXT, margin: 0 }}>{job.pickup_address || "—"}</p>
              <p style={{ fontSize: 12, color: MUTED, margin: "2px 0 0" }}>{[job.pickup_city, job.pickup_state].filter(Boolean).join(", ")}</p>
              {job.pickup_contact && <p style={{ fontSize: 11, color: MUTED, margin: "4px 0 0" }}>Attn: {job.pickup_contact}</p>}
            </div>
            <div style={{ background: "rgba(239,68,68,0.05)", borderRadius: 10, padding: 12, border: "1px solid rgba(239,68,68,0.12)" }}>
              <p style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#f87171", margin: "0 0 6px", fontFamily: "Barlow, sans-serif" }}>Delivery</p>
              <p style={{ fontSize: 12, color: TEXT, margin: 0 }}>{job.delivery_address || "—"}</p>
              <p style={{ fontSize: 12, color: MUTED, margin: "2px 0 0" }}>{[job.delivery_city, job.delivery_state].filter(Boolean).join(", ")}</p>
              {job.delivery_contact && <p style={{ fontSize: 11, color: MUTED, margin: "4px 0 0" }}>Attn: {job.delivery_contact}</p>}
            </div>
          </div>

          {/* Driver & Details */}
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: job.status === "Delivered" && hasPOD ? 16 : 0, fontSize: 12, color: MUTED }}>
            {job.driver_name && <span><strong style={{ color: TEXT }}>Driver:</strong> {job.driver_name}</span>}
            {job.reference_number && <span><strong style={{ color: TEXT }}>Ref #:</strong> {job.reference_number}</span>}
            {job.description && <span><strong style={{ color: TEXT }}>Contents:</strong> {job.description}</span>}
          </div>

          {/* POD Section */}
          {job.status === "Delivered" && hasPOD && (
            <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: 16 }}>
              <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: GREEN, margin: "0 0 12px", fontFamily: "Barlow, sans-serif" }}>Proof of Delivery</p>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-start" }}>
                {podPhotos.map((url, i) => (
                  <div key={i} style={{ position: "relative" }}>
                    <a href={url} target="_blank" rel="noreferrer" download>
                      <img src={url} alt={`POD ${i + 1}`} style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 8, border: `1px solid ${BORDER}`, display: "block" }} />
                    </a>
                    <a href={url} target="_blank" rel="noreferrer" download style={{ position: "absolute", bottom: 4, right: 4, background: "rgba(0,0,0,0.7)", borderRadius: 4, padding: 3, display: "flex" }}>
                      <Download size={10} style={{ color: "#fff" }} />
                    </a>
                  </div>
                ))}
                {job.pod_signature && (
                  <div style={{ position: "relative" }}>
                    <a href={job.pod_signature} target="_blank" rel="noreferrer" download>
                      <img src={job.pod_signature} alt="Signature" style={{ width: 120, height: 60, objectFit: "contain", borderRadius: 8, border: `1px solid ${BORDER}`, background: "#fff", display: "block", padding: 4 }} />
                    </a>
                    <p style={{ fontSize: 10, color: MUTED, margin: "4px 0 0", textAlign: "center" }}>Signature</p>
                    <a href={job.pod_signature} target="_blank" rel="noreferrer" download style={{ position: "absolute", top: 4, right: 4, background: "rgba(0,0,0,0.7)", borderRadius: 4, padding: 3, display: "flex" }}>
                      <Download size={10} style={{ color: "#fff" }} />
                    </a>
                  </div>
                )}
              </div>
              {job.pod_captured_at && (
                <p style={{ fontSize: 11, color: MUTED, margin: "10px 0 0" }}>
                  Delivered & signed: {new Date(job.pod_captured_at).toLocaleString()}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function LiveMap({ jobs }) {
  const inTransit = jobs.filter(j => j.status === "In Transit");
  if (inTransit.length === 0) return null;

  // Use pickup/delivery city coordinates as approximations via static fallback
  // Since we don't have geocoded coords stored, show a placeholder map centered on Chicago
  return (
    <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 16, overflow: "hidden", marginBottom: 24 }}>
      <div style={{ padding: "14px 20px", borderBottom: `1px solid ${BORDER}`, display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: GREEN, animation: "pulse 2s infinite" }} />
        <span style={{ fontSize: 14, fontWeight: 700, color: TEXT, fontFamily: "Barlow, sans-serif" }}>Live Tracking</span>
        <span style={{ fontSize: 12, color: MUTED }}>— {inTransit.length} shipment{inTransit.length > 1 ? "s" : ""} in transit</span>
      </div>
      <div style={{ height: 240 }}>
        <MapContainer center={[41.85, -87.65]} zoom={8} style={{ height: "100%", width: "100%" }} zoomControl={false}>
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          />
          {inTransit.map(job => (
            <Marker key={job.id} position={[41.85, -87.65]}>
              <Popup>
                <div style={{ fontFamily: "Barlow, sans-serif", fontWeight: 700, color: "#0fa14a" }}>{job.job_number}</div>
                <div style={{ fontSize: 12 }}>{job.pickup_city} → {job.delivery_city}</div>
                {job.driver_name && <div style={{ fontSize: 11, color: "#888" }}>Driver: {job.driver_name}</div>}
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }`}</style>
    </div>
  );
}

export default function CustomerPortal() {
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [trackingInput, setTrackingInput] = useState("");

  useEffect(() => {
    Customer.filter({ status: "Active" }).then(c => { setCustomers(c); setLoading(false); });
    // Check URL for customer ID
    const params = new URLSearchParams(window.location.search);
    const cid = params.get("customer");
    if (cid) loadCustomer(cid);
  }, []);

  async function loadCustomer(customerId) {
    const c = customers.find(x => x.id === customerId) ||
      (await Customer.filter({ status: "Active" })).find(x => x.id === customerId);
    if (!c) return;
    setSelectedCustomer(c);
    setLoadingJobs(true);
    const allJobs = await Job.filter({ customer_id: c.id });
    setJobs(allJobs.sort((a, b) => {
      const order = { "In Transit": 0, Assigned: 1, Pending: 2, Delivered: 3, Cancelled: 4 };
      return (order[a.status] ?? 9) - (order[b.status] ?? 9);
    }));
    setLoadingJobs(false);
  }

  async function handleTrackingSearch() {
    if (!trackingInput.trim()) return;
    setLoadingJobs(true);
    const allJobs = await Job.list();
    const found = allJobs.filter(j =>
      (j.job_number || "").toLowerCase().includes(trackingInput.toLowerCase()) ||
      (j.reference_number || "").toLowerCase().includes(trackingInput.toLowerCase())
    );
    setSelectedCustomer({ company_name: `Tracking: "${trackingInput}"`, id: null });
    setJobs(found);
    setLoadingJobs(false);
  }

  const filtered = jobs.filter(j => {
    if (statusFilter !== "All" && j.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (j.job_number || "").toLowerCase().includes(q) ||
        (j.pickup_city || "").toLowerCase().includes(q) ||
        (j.delivery_city || "").toLowerCase().includes(q) ||
        (j.reference_number || "").toLowerCase().includes(q);
    }
    return true;
  });

  const stats = {
    active: jobs.filter(j => ["Pending", "Assigned", "In Transit"].includes(j.status)).length,
    inTransit: jobs.filter(j => j.status === "In Transit").length,
    delivered: jobs.filter(j => j.status === "Delivered").length,
    withPOD: jobs.filter(j => j.status === "Delivered" && (j.pod_photos || j.pod_signature)).length,
  };

  if (loading) return (
    <div style={{ minHeight: "100vh", background: BG, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <img src={SHAMROCK} alt="" style={{ width: 40, animation: "spin 1.5s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  // ── Customer Select Screen ──
  if (!selectedCustomer) return (
    <div style={{ minHeight: "100vh", background: BG, fontFamily: "Source Sans 3, sans-serif", padding: 24 }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <img src={LOGO} alt="Mahoney Express" style={{ height: 52, width: "auto", marginBottom: 16 }} />
        <h1 style={{ fontFamily: "Barlow, sans-serif", fontWeight: 800, color: TEXT, fontSize: 26, margin: "0 0 6px" }}>Customer Tracking Portal</h1>
        <p style={{ color: MUTED, fontSize: 14, margin: 0 }}>Track your shipments, view live delivery progress, and download POD documents.</p>
      </div>

      <div style={{ maxWidth: 540, margin: "0 auto" }}>
        {/* Quick Track by Job # */}
        <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 20, marginBottom: 20 }}>
          <p style={{ fontFamily: "Barlow, sans-serif", fontWeight: 700, fontSize: 13, color: TEXT, margin: "0 0 12px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Track a Shipment</p>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              value={trackingInput}
              onChange={e => setTrackingInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleTrackingSearch()}
              placeholder="Enter Job # or Reference #…"
              style={{ flex: 1, padding: "10px 14px", background: SURFACE2, border: `1px solid ${BORDER}`, borderRadius: 10, color: TEXT, fontSize: 13, outline: "none" }}
            />
            <button onClick={handleTrackingSearch} style={{ padding: "10px 18px", background: GREEN, color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "Barlow, sans-serif", display: "flex", alignItems: "center", gap: 6 }}>
              <Search size={14} />Track
            </button>
          </div>
        </div>

        {/* Select by Company */}
        <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 20 }}>
          <p style={{ fontFamily: "Barlow, sans-serif", fontWeight: 700, fontSize: 13, color: TEXT, margin: "0 0 12px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Select Your Company</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 400, overflowY: "auto" }}>
            {customers.map(c => (
              <button key={c.id} onClick={() => loadCustomer(c.id)}
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderRadius: 12, background: SURFACE2, border: `1px solid ${BORDER}`, cursor: "pointer", textAlign: "left", transition: "all 0.15s" }}
                onMouseEnter={e => e.currentTarget.style.borderColor = GREEN}
                onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"}>
                <div>
                  <p style={{ fontWeight: 700, color: TEXT, margin: 0, fontFamily: "Barlow, sans-serif" }}>{c.company_name}</p>
                  {c.contact_name && <p style={{ fontSize: 12, color: MUTED, margin: "2px 0 0" }}>{c.contact_name}</p>}
                </div>
                <span style={{ fontSize: 12, color: MUTED }}>→</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // ── Customer Dashboard ──
  return (
    <div style={{ minHeight: "100vh", background: BG, fontFamily: "Source Sans 3, sans-serif", paddingBottom: 40 }}>
      {/* Header */}
      <div style={{ background: "#060204", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `3px solid ${GREEN}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img src={SHAMROCK} alt="" style={{ width: 22, height: 22 }} />
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, color: GREEN, textTransform: "uppercase", letterSpacing: "0.1em", margin: 0, fontFamily: "Barlow, sans-serif" }}>Customer Portal</p>
            <p style={{ fontSize: 16, fontWeight: 800, color: TEXT, margin: 0, fontFamily: "Barlow, sans-serif" }}>{selectedCustomer.company_name}</p>
          </div>
        </div>
        <button onClick={() => { setSelectedCustomer(null); setJobs([]); setTrackingInput(""); }}
          style={{ fontSize: 12, fontWeight: 700, color: MUTED, background: "none", border: `1px solid ${BORDER}`, borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontFamily: "Barlow, sans-serif" }}>
          ← Back
        </button>
      </div>

      <div style={{ padding: "24px", maxWidth: 900, margin: "0 auto" }}>
        {loadingJobs ? (
          <div style={{ textAlign: "center", padding: 48, color: MUTED }}>Loading shipments…</div>
        ) : (
          <>
            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 24 }}>
              {[
                { label: "Active", value: stats.active, color: "#60a5fa", bg: "rgba(59,130,246,0.12)" },
                { label: "In Transit", value: stats.inTransit, color: "#a78bfa", bg: "rgba(139,92,246,0.12)" },
                { label: "Delivered", value: stats.delivered, color: GREEN, bg: "rgba(15,161,74,0.12)" },
                { label: "With POD", value: stats.withPOD, color: GREEN, bg: "rgba(15,161,74,0.08)" },
              ].map(s => (
                <div key={s.label} style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 12, padding: "14px 16px" }}>
                  <p style={{ fontSize: 28, fontWeight: 800, color: s.color, margin: 0, fontFamily: "Barlow, sans-serif", lineHeight: 1 }}>{s.value}</p>
                  <p style={{ fontSize: 11, color: MUTED, margin: "4px 0 0", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>{s.label}</p>
                </div>
              ))}
            </div>

            {/* Live Map */}
            <LiveMap jobs={jobs} />

            {/* Filters */}
            <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
              {["All", "Pending", "Assigned", "In Transit", "Delivered", "Cancelled"].map(s => {
                const active = statusFilter === s;
                const sc = STATUS_CFG[s] || {};
                return (
                  <button key={s} onClick={() => setStatusFilter(s)} style={{
                    padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer",
                    background: active ? (sc.bg || "rgba(255,255,255,0.1)") : "transparent",
                    color: active ? (sc.text || TEXT) : MUTED,
                    border: `1px solid ${active ? (sc.text || TEXT) : BORDER}`,
                    fontFamily: "Barlow, sans-serif",
                  }}>
                    {s}
                  </button>
                );
              })}
              <div style={{ position: "relative", flex: 1, minWidth: 160 }}>
                <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: MUTED }} />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search job #, city, ref…"
                  style={{ width: "100%", padding: "7px 10px 7px 30px", background: SURFACE2, border: `1px solid ${BORDER}`, borderRadius: 8, color: TEXT, fontSize: 12, outline: "none", boxSizing: "border-box" }} />
              </div>
            </div>

            {/* Jobs */}
            {filtered.length === 0 ? (
              <div style={{ textAlign: "center", padding: 48, color: MUTED }}>
                <Package size={32} style={{ marginBottom: 10, opacity: 0.2 }} />
                <p>No shipments found.</p>
              </div>
            ) : (
              filtered.map(job => <JobCard key={job.id} job={job} />)
            )}
          </>
        )}
      </div>
    </div>
  );
}