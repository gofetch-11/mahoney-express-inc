import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Job } from "@/api/entities";
import DriverTrackingMap from "../components/DriverTrackingMap";
import { Truck, MapPin, Radio, RefreshCw, Clock } from "lucide-react";

const Driver = base44.entities.Driver;

const GREEN = "#0fa14a";
const BG = "#0e1012";
const SURFACE = "#161a1d";
const SURFACE2 = "#1e2328";
const BORDER = "rgba(255,255,255,0.07)";
const TEXT = "#f0f0ee";
const MUTED = "#8a8a85";

const fmt12 = (iso) => iso
  ? new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
  : "—";

const minsAgo = (iso) => {
  if (!iso) return null;
  const diff = Math.floor((Date.now() - new Date(iso)) / 60000);
  if (diff < 1) return "just now";
  if (diff === 1) return "1 min ago";
  return `${diff} mins ago`;
};

export default function LiveDispatch() {
  const [drivers, setDrivers] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [selectedDriver, setSelectedDriver] = useState(null);
  const intervalRef = useRef(null);

  async function loadData() {
    const [drvs, js] = await Promise.all([Driver.list(), Job.filter({ status: "In Transit" })]);
    setDrivers(drvs);
    setJobs(js);
    setLastRefresh(new Date());
    setLoading(false);
  }

  useEffect(() => {
    loadData();
    intervalRef.current = setInterval(loadData, 20000); // auto-refresh every 20s
    return () => clearInterval(intervalRef.current);
  }, []);

  const trackingDrivers = drivers.filter(d => d.lat && d.lng && d.is_tracking);
  const inTransitJobs = jobs;

  const jobsByDriver = {};
  inTransitJobs.forEach(j => {
    if (!jobsByDriver[j.driver_id]) jobsByDriver[j.driver_id] = [];
    jobsByDriver[j.driver_id].push(j);
  });

  const card = { background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 16 };

  return (
    <div style={{ minHeight: "100vh", background: BG, fontFamily: "Source Sans 3, sans-serif", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ background: "#060204", padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `3px solid ${GREEN}`, flexShrink: 0 }}>
        <div>
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: GREEN, fontFamily: "Barlow, sans-serif", margin: "0 0 2px" }}>Admin · Real-Time</p>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: TEXT, margin: 0, fontFamily: "Barlow, sans-serif", display: "flex", alignItems: "center", gap: 8 }}>
            <Radio size={18} style={{ color: GREEN }} /> Live Dispatch Map
          </h1>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: MUTED }}>
            <Clock size={13} />
            Auto-refreshes · Last: {fmt12(lastRefresh)}
          </div>
          <button onClick={loadData} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 10, background: "rgba(15,161,74,0.15)", color: GREEN, border: "1px solid rgba(15,161,74,0.3)", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "Barlow, sans-serif" }}>
            <RefreshCw size={13} /> Refresh
          </button>
        </div>
      </div>

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Sidebar */}
        <div style={{ width: 300, flexShrink: 0, background: "#060204", borderRight: `1px solid ${BORDER}`, display: "flex", flexDirection: "column", overflowY: "auto" }}>
          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, borderBottom: `1px solid ${BORDER}` }}>
            {[
              { label: "Tracking", value: trackingDrivers.length, color: GREEN },
              { label: "In Transit", value: inTransitJobs.length, color: "#a78bfa" },
            ].map(s => (
              <div key={s.label} style={{ padding: "16px 18px", background: SURFACE2 }}>
                <p style={{ fontSize: 28, fontWeight: 800, color: s.color, margin: 0, fontFamily: "Barlow, sans-serif", lineHeight: 1 }}>{s.value}</p>
                <p style={{ fontSize: 11, color: MUTED, margin: "4px 0 0", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>{s.label}</p>
              </div>
            ))}
          </div>

          {/* Driver list */}
          <div style={{ padding: "12px 0", flex: 1 }}>
            <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: MUTED, padding: "0 16px 8px", fontFamily: "Barlow, sans-serif" }}>Active Drivers</p>
            {loading ? (
              <p style={{ color: MUTED, fontSize: 13, padding: "0 16px" }}>Loading…</p>
            ) : drivers.filter(d => d.status === "Active").length === 0 ? (
              <p style={{ color: MUTED, fontSize: 13, padding: "0 16px" }}>No active drivers.</p>
            ) : drivers.filter(d => d.status === "Active").map(driver => {
              const driverJobs = jobsByDriver[driver.id] || [];
              const isTracking = !!driver.is_tracking && !!driver.lat;
              const isSelected = selectedDriver === driver.id;

              return (
                <div
                  key={driver.id}
                  onClick={() => setSelectedDriver(isSelected ? null : driver.id)}
                  style={{
                    padding: "12px 16px",
                    cursor: "pointer",
                    borderLeft: `3px solid ${isTracking ? GREEN : "transparent"}`,
                    background: isSelected ? "rgba(15,161,74,0.08)" : "transparent",
                    borderBottom: `1px solid ${BORDER}`,
                    transition: "all 0.15s",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                    <div style={{ width: 34, height: 34, borderRadius: "50%", background: isTracking ? "rgba(15,161,74,0.2)" : SURFACE2, border: `2px solid ${isTracking ? GREEN : BORDER}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: isTracking ? GREEN : MUTED, fontFamily: "Barlow, sans-serif", flexShrink: 0 }}>
                      {(driver.first_name || "?")[0]}{(driver.last_name || "?")[0]}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 700, color: TEXT, margin: 0, fontSize: 13, fontFamily: "Barlow, sans-serif" }}>{driver.first_name} {driver.last_name}</p>
                      <p style={{ fontSize: 11, color: MUTED, margin: 0 }}>{driver.vehicle_type || "Driver"}</p>
                    </div>
                    {isTracking ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: GREEN, animation: "pulse 2s infinite" }} />
                        <span style={{ fontSize: 10, color: GREEN, fontWeight: 700 }}>LIVE</span>
                      </div>
                    ) : (
                      <span style={{ fontSize: 10, color: MUTED, fontWeight: 700 }}>OFFLINE</span>
                    )}
                  </div>

                  {isTracking && driver.last_location_update && (
                    <p style={{ fontSize: 10, color: MUTED, margin: "0 0 6px" }}>📍 {minsAgo(driver.last_location_update)}</p>
                  )}

                  {driverJobs.map(j => (
                    <div key={j.id} style={{ background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.2)", borderRadius: 8, padding: "6px 10px", marginTop: 4 }}>
                      <p style={{ fontSize: 11, fontWeight: 700, color: "#a78bfa", margin: "0 0 2px", fontFamily: "Barlow, sans-serif" }}>{j.job_number}</p>
                      <p style={{ fontSize: 11, color: MUTED, margin: 0 }}>{j.pickup_city} → {j.delivery_city}</p>
                    </div>
                  ))}

                  {driverJobs.length === 0 && (
                    <p style={{ fontSize: 11, color: MUTED, margin: "4px 0 0" }}>No active jobs</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Map */}
        <div style={{ flex: 1, position: "relative" }}>
          {loading ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", background: BG }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", border: `3px solid ${GREEN}`, borderTopColor: "transparent", animation: "spin 1s linear infinite" }} />
            </div>
          ) : trackingDrivers.length === 0 ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", background: BG, color: MUTED, gap: 12 }}>
              <MapPin size={48} style={{ opacity: 0.15 }} />
              <p style={{ fontSize: 16, fontWeight: 600 }}>No drivers sharing location</p>
              <p style={{ fontSize: 13, color: MUTED, maxWidth: 320, textAlign: "center" }}>
                Drivers will appear here automatically when they mark a job "In Transit" from the Driver Portal — GPS tracking activates on their device.
              </p>
            </div>
          ) : (
            <DriverTrackingMap drivers={trackingDrivers} jobs={inTransitJobs} />
          )}

          {/* Legend */}
          <div style={{ position: "absolute", bottom: 16, right: 16, background: "rgba(6,2,4,0.85)", border: `1px solid ${BORDER}`, borderRadius: 10, padding: "10px 14px", backdropFilter: "blur(8px)", zIndex: 1000 }}>
            <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: MUTED, margin: "0 0 8px", fontFamily: "Barlow, sans-serif" }}>Legend</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: GREEN }} />
                <span style={{ fontSize: 11, color: TEXT }}>In Transit (active job)</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#3b82f6" }} />
                <span style={{ fontSize: 11, color: TEXT }}>Online (no active job)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
      `}</style>
    </div>
  );
}