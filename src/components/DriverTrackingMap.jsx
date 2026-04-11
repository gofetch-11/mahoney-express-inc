import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default icon paths
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

function createDriverIcon(initials, isActive) {
  return L.divIcon({
    className: "",
    iconAnchor: [22, 44],
    popupAnchor: [0, -44],
    html: `
      <div style="position:relative;width:44px;height:44px;">
        <div style="
          width:44px;height:44px;border-radius:50%;
          background:${isActive ? "#0fa14a" : "#3b82f6"};
          border:3px solid #fff;
          box-shadow:0 2px 8px rgba(0,0,0,0.4);
          display:flex;align-items:center;justify-content:center;
          font-family:Barlow,sans-serif;font-weight:800;font-size:13px;color:#fff;
        ">${initials}</div>
        ${isActive ? `<div style="
          position:absolute;bottom:1px;right:1px;
          width:12px;height:12px;border-radius:50%;
          background:#4ade80;border:2px solid #fff;
        "></div>` : ""}
      </div>
    `,
  });
}

function AutoFitBounds({ drivers }) {
  const map = useMap();
  useEffect(() => {
    const valid = drivers.filter(d => d.lat && d.lng);
    if (valid.length === 0) return;
    if (valid.length === 1) {
      map.setView([valid[0].lat, valid[0].lng], 13);
    } else {
      const bounds = L.latLngBounds(valid.map(d => [d.lat, d.lng]));
      map.fitBounds(bounds, { padding: [60, 60] });
    }
  }, [drivers]);
  return null;
}

export default function DriverTrackingMap({ drivers, jobs }) {
  const jobsByDriver = {};
  jobs.forEach(j => {
    if (!jobsByDriver[j.driver_id]) jobsByDriver[j.driver_id] = [];
    jobsByDriver[j.driver_id].push(j);
  });

  const trackingDrivers = drivers.filter(d => d.lat && d.lng);

  return (
    <MapContainer
      center={[41.8827, -87.6233]}
      zoom={10}
      style={{ width: "100%", height: "100%", borderRadius: 12 }}
      zoomControl={true}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://carto.com/">CARTO</a>'
      />
      <AutoFitBounds drivers={trackingDrivers} />
      {trackingDrivers.map(driver => {
        const initials = `${(driver.first_name || "?")[0]}${(driver.last_name || "?")[0]}`;
        const driverJobs = jobsByDriver[driver.id] || [];
        const activeJob = driverJobs.find(j => j.status === "In Transit");
        const lastSeen = driver.last_location_update
          ? new Date(driver.last_location_update).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
          : "Unknown";

        return (
          <Marker
            key={driver.id}
            position={[driver.lat, driver.lng]}
            icon={createDriverIcon(initials, !!activeJob)}
          >
            <Popup>
              <div style={{ fontFamily: "Source Sans 3, sans-serif", minWidth: 180 }}>
                <p style={{ fontFamily: "Barlow, sans-serif", fontWeight: 800, fontSize: 15, margin: "0 0 4px", color: "#060204" }}>
                  {driver.first_name} {driver.last_name}
                </p>
                <p style={{ fontSize: 12, color: "#6b6b67", margin: "0 0 8px" }}>{driver.vehicle_type} · {driver.license_plate || "No plate"}</p>
                {activeJob ? (
                  <div style={{ background: "rgba(15,161,74,0.08)", border: "1px solid rgba(15,161,74,0.25)", borderRadius: 8, padding: "8px 10px", marginBottom: 6 }}>
                    <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: "#0fa14a", margin: "0 0 3px", letterSpacing: "0.06em" }}>In Transit</p>
                    <p style={{ fontSize: 12, fontWeight: 600, margin: "0 0 2px" }}>{activeJob.job_number} · {activeJob.customer_name}</p>
                    <p style={{ fontSize: 11, color: "#6b6b67", margin: 0 }}>{activeJob.pickup_city} → {activeJob.delivery_city}</p>
                  </div>
                ) : (
                  <p style={{ fontSize: 12, color: "#b0b2b7", marginBottom: 6 }}>No active job</p>
                )}
                <p style={{ fontSize: 10, color: "#b0b2b7", margin: 0 }}>Last ping: {lastSeen}</p>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}