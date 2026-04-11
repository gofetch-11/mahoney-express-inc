import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Driver, Job } from "@/api/entities";
import { Truck, RefreshCw, Users, Package, Clock } from "lucide-react";

// Fix Leaflet default icon
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

function makeDriverIcon(initials, isActive) {
  return L.divIcon({
    html: `
      <div style="
        width:40px;height:40px;border-radius:50%;
        background:${isActive ? GREEN : "#374151"};
        border:3px solid ${isActive ? "#fff" : "#6b7280"};
        display:flex;align-items:center;justify-content:center;
        font-family:Barlow,sans-serif;font-weight:800;font-size:13px;color:#fff;
        box-shadow:0 2px 8px rgba(0,0,0,0.5);
        position:relative;
      ">
        ${initials}
        ${isActive ? `<div style="position:absolute;bottom:-2px;right:-2px;width:12px;height:12px;border-radius:50%;background:#4ade80;border:2px solid #fff;"></div>` : ""}
      </div>`,
    className: "",
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20],
  });
}

function timeAgo(isoStr) {
  if (!isoStr) return "unknown";
  const diff = Math.floor((Date.now() - new Date(isoStr)) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

export default function LiveMapDashboard() {
  const [drivers, setDrivers] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [selectedDriver, setSelectedDriver] = useState(null);
  const intervalRef = useRef(null);

  const loadData = async () => {
    const [drvs, jbs] = await Promise.all([Driver.list(), Job.filter({ status: "In Transit" })]);
    setDrivers(drvs);
    setJobs(jbs);
    setLastRefresh(new Date());
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    intervalRef.current = setInterval(loadData, 30000); // auto-refresh every 30s
    return () => clearInterval(intervalRef.current);
  }, []);

  const activeDrivers = drivers.filter(d => d.is_on_route && d.current_lat && d.current_lng);
  const inTransitCount = jobs.length;

  const getDriverJob = (driver) => jobs.find(j => j.driver_id === driver.id || j.id === driver.current_job_id);

  if (loading) return (
    <div style={{ minHeight: "100vh", background: BG, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 36, height: 36, borderRadius: "50%", border: `3px solid ${GREEN}`, borderTopColor: "transparent", animation: "spin 1s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: BG, fontFamily: "Source Sans 3, sans-serif", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ background: "#060204", padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `3px solid ${GREEN}`, flexShrink: 0 }}>
        <div>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: GREEN, fontFamily: "Barlow, sans-serif", margin: "0 0 2px" }}>Operations Center</p>
          <h1 style={{ fontSize: 18, fontWeight: 800, color: TEXT, margin: 0, fontFamily: "Barlow, sans-serif" }}>Live Driver Map</h1>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ fontSize: 12, color: MUTED }}>Updated {timeAgo(lastRefresh.toISOString())}</span>
          <button onClick={loadData} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8, background: "rgba(15,161,74,0.12)", color: GREEN, border: `1px solid rgba(15,161,74,0.3)`, fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "Barlow, sans-serif" }}>
            <RefreshCw size={13} />Refresh
          </button>
        </div>
      </div>

      {/* Stats strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 0, borderBottom: `1px solid ${BORDER}`, flexShrink: 0 }}>
        {[
          { label: "Active on Map", value: activeDrivers.length, icon: Users, color: GREEN },
          { label: "In Transit", value: inTransitCount, icon: Truck, color: "#a78bfa" },
          { label: "Total Drivers", value: drivers.filter(d => d.status === "Active").length, icon: Package, color: "#60a5fa" },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={s.label} style={{ padding: "14px 24px", background: SURFACE, borderRight: i < 2 ? `1px solid ${BORDER}` : "none", display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: `${s.color}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon size={16} style={{ color: s.color }} />
              </div>
              <div>
                <p style={{ fontSize: 22, fontWeight: 800, color: TEXT, margin: 0, fontFamily: "Barlow, sans-serif", lineHeight: 1 }}>{s.value}</p>
                <p style={{ fontSize: 11, color: MUTED, margin: "3px 0 0", fontWeight: 600 }}>{s.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main layout: map + sidebar */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden", minHeight: 0 }}>
        {/* Map */}
        <div style={{ flex: 1, position: "relative" }}>
          <MapContainer
            center={[41.8827, -87.6233]}
            zoom={10}
            style={{ height: "100%", width: "100%", minHeight: 500 }}
          >
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            />

            {/* HQ marker */}
            <Marker position={[41.9099, -87.8077]} icon={L.divIcon({ html: `<div style="width:14px;height:14px;border-radius:50%;background:${GREEN};border:2px solid #fff;box-shadow:0 0 0 4px rgba(15,161,74,0.3)"></div>`, className: "", iconSize: [14, 14], iconAnchor: [7, 7] })}>
              <Popup>
                <strong>Mahoney Express HQ</strong><br />1615 N Newland Ave, Chicago IL
              </Popup>
            </Marker>

            {/* Active driver markers */}
            {activeDrivers.map(driver => {
              const initials = `${(driver.first_name || "?")[0]}${(driver.last_name || "?")[0]}`;
              const job = getDriverJob(driver);
              const updatedRecently = driver.location_updated_at && (Date.now() - new Date(driver.location_updated_at)) < 5 * 60 * 1000;
              return (
                <Marker
                  key={driver.id}
                  position={[driver.current_lat, driver.current_lng]}
                  icon={makeDriverIcon(initials, updatedRecently)}
                  eventHandlers={{ click: () => setSelectedDriver(driver.id === selectedDriver ? null : driver.id) }}
                >
                  <Popup>
                    <div style={{ minWidth: 180 }}>
                      <strong style={{ fontSize: 14 }}>{driver.first_name} {driver.last_name}</strong>
                      <p style={{ margin: "4px 0 2px", fontSize: 12, color: "#6b7280" }}>{driver.vehicle_type}</p>
                      {job && (
                        <>
                          <p style={{ margin: "4px 0 0", fontSize: 12 }}><strong>Job:</strong> {job.job_number}</p>
                          <p style={{ margin: "2px 0 0", fontSize: 12 }}><strong>Route:</strong> {job.pickup_city} → {job.delivery_city}</p>
                          <p style={{ margin: "2px 0 0", fontSize: 12 }}><strong>Customer:</strong> {job.customer_name}</p>
                        </>
                      )}
                      <p style={{ margin: "6px 0 0", fontSize: 11, color: "#9ca3af" }}>Updated {timeAgo(driver.location_updated_at)}</p>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>

          {/* No GPS hint overlay */}
          {activeDrivers.length === 0 && (
            <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", background: "rgba(6,2,4,0.85)", border: `1px solid ${BORDER}`, borderRadius: 16, padding: "20px 28px", textAlign: "center", zIndex: 1000, pointerEvents: "none" }}>
              <Truck size={32} style={{ color: MUTED, marginBottom: 10, opacity: 0.4 }} />
              <p style={{ color: TEXT, fontWeight: 700, margin: "0 0 6px", fontFamily: "Barlow, sans-serif" }}>No drivers on map yet</p>
              <p style={{ color: MUTED, fontSize: 13, margin: 0 }}>Drivers sharing GPS location will appear here.<br />Location updates when a driver is In Transit.</p>
            </div>
          )}
        </div>

        {/* Sidebar: driver list */}
        <div style={{ width: 280, background: SURFACE, borderLeft: `1px solid ${BORDER}`, overflowY: "auto", flexShrink: 0 }}>
          <div style={{ padding: "14px 16px", borderBottom: `1px solid ${BORDER}` }}>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: MUTED, margin: 0, fontFamily: "Barlow, sans-serif" }}>Active Drivers</p>
          </div>

          {activeDrivers.length === 0 ? (
            <div style={{ padding: "32px 16px", textAlign: "center", color: MUTED, fontSize: 13 }}>
              <p>No drivers currently sharing location.</p>
            </div>
          ) : (
            activeDrivers.map(driver => {
              const job = getDriverJob(driver);
              const isSelected = selectedDriver === driver.id;
              const updatedRecently = driver.location_updated_at && (Date.now() - new Date(driver.location_updated_at)) < 5 * 60 * 1000;
              return (
                <div key={driver.id} onClick={() => setSelectedDriver(isSelected ? null : driver.id)}
                  style={{ padding: "14px 16px", borderBottom: `1px solid ${BORDER}`, cursor: "pointer", background: isSelected ? "rgba(15,161,74,0.08)" : "transparent", borderLeft: isSelected ? `3px solid ${GREEN}` : "3px solid transparent", transition: "all 0.15s" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                    <div style={{ width: 36, height: 36, borderRadius: "50%", background: updatedRecently ? "rgba(15,161,74,0.2)" : SURFACE2, border: `2px solid ${updatedRecently ? GREEN : BORDER}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: updatedRecently ? GREEN : MUTED, fontFamily: "Barlow, sans-serif", flexShrink: 0 }}>
                      {(driver.first_name || "?")[0]}{(driver.last_name || "?")[0]}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontWeight: 700, color: TEXT, margin: 0, fontSize: 14, fontFamily: "Barlow, sans-serif" }}>{driver.first_name} {driver.last_name}</p>
                      <p style={{ fontSize: 11, color: updatedRecently ? GREEN : MUTED, margin: "1px 0 0", display: "flex", alignItems: "center", gap: 4 }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: updatedRecently ? "#4ade80" : "#6b7280", display: "inline-block", flexShrink: 0 }} />
                        {timeAgo(driver.location_updated_at)}
                      </p>
                    </div>
                  </div>
                  {job && (
                    <div style={{ background: SURFACE2, borderRadius: 8, padding: "8px 10px" }}>
                      <p style={{ fontSize: 11, fontWeight: 700, color: GREEN, margin: "0 0 3px", fontFamily: "Barlow, sans-serif" }}>Job {job.job_number}</p>
                      <p style={{ fontSize: 11, color: TEXT, margin: "0 0 1px" }}>{job.customer_name}</p>
                      <p style={{ fontSize: 11, color: MUTED, margin: 0 }}>{job.pickup_city} → {job.delivery_city}</p>
                    </div>
                  )}
                </div>
              );
            })
          )}

          {/* Drivers with no GPS */}
          {(() => {
            const noGps = drivers.filter(d => d.status === "Active" && d.is_on_route && (!d.current_lat || !d.current_lng));
            if (!noGps.length) return null;
            return (
              <>
                <div style={{ padding: "10px 16px", borderBottom: `1px solid ${BORDER}`, borderTop: `1px solid ${BORDER}` }}>
                  <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: MUTED, margin: 0, fontFamily: "Barlow, sans-serif" }}>No GPS Signal</p>
                </div>
                {noGps.map(d => (
                  <div key={d.id} style={{ padding: "12px 16px", borderBottom: `1px solid ${BORDER}`, display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: SURFACE2, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: MUTED, fontFamily: "Barlow, sans-serif", flexShrink: 0 }}>
                      {(d.first_name || "?")[0]}{(d.last_name || "?")[0]}
                    </div>
                    <div>
                      <p style={{ fontWeight: 600, color: TEXT, margin: 0, fontSize: 13 }}>{d.first_name} {d.last_name}</p>
                      <p style={{ fontSize: 11, color: MUTED, margin: "1px 0 0" }}>Awaiting location</p>
                    </div>
                  </div>
                ))}
              </>
            );
          })()}
        </div>
      </div>
    </div>
  );
}