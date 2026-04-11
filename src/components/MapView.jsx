import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default marker icons for Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const pickupIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
});

const deliveryIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
});

async function geocode(query) {
  if (!query) return null;
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`,
      { headers: { "Accept-Language": "en" } }
    );
    const data = await res.json();
    if (data?.[0]) return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
  } catch {}
  return null;
}

const COLORS = ["#0fa14a", "#3b82f6", "#a78bfa", "#f59e0b", "#f87171", "#34d399"];

export default function MapView({ jobs }) {
  const [jobCoords, setJobCoords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!jobs?.length) { setLoading(false); return; }

    async function loadCoords() {
      const results = await Promise.all(
        jobs.map(async (job, idx) => {
          const pickupQuery = [job.pickup_address, job.pickup_city, job.pickup_state].filter(Boolean).join(", ");
          const deliveryQuery = [job.delivery_address, job.delivery_city, job.delivery_state].filter(Boolean).join(", ");
          const [pickup, delivery] = await Promise.all([geocode(pickupQuery), geocode(deliveryQuery)]);
          return { job, pickup, delivery, color: COLORS[idx % COLORS.length] };
        })
      );
      setJobCoords(results.filter(r => r.pickup || r.delivery));
      setLoading(false);
    }

    loadCoords();
  }, [jobs]);

  // Compute center from first valid coord
  const allCoords = jobCoords.flatMap(r => [r.pickup, r.delivery].filter(Boolean));
  const center = allCoords.length > 0
    ? [allCoords.reduce((s, c) => s + c[0], 0) / allCoords.length, allCoords.reduce((s, c) => s + c[1], 0) / allCoords.length]
    : [41.8827, -87.6233]; // Chicago default

  if (loading) {
    return (
      <div style={{ height: 380, display: "flex", alignItems: "center", justifyContent: "center", background: "#1e2328", borderRadius: 12 }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", border: "3px solid #0fa14a", borderTopColor: "transparent", animation: "spin 1s linear infinite", margin: "0 auto 10px" }} />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          <p style={{ color: "#8a8a85", fontSize: 13 }}>Geocoding job locations…</p>
        </div>
      </div>
    );
  }

  if (!jobCoords.length) {
    return (
      <div style={{ height: 380, display: "flex", alignItems: "center", justifyContent: "center", background: "#1e2328", borderRadius: 12 }}>
        <p style={{ color: "#8a8a85", fontSize: 13 }}>No location data available for In Transit jobs.</p>
      </div>
    );
  }

  return (
    <div style={{ height: 380, borderRadius: 12, overflow: "hidden", border: "1px solid rgba(255,255,255,0.07)" }}>
      <MapContainer center={center} zoom={6} style={{ height: "100%", width: "100%" }} zoomControl={true}>
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        />
        {jobCoords.map(({ job, pickup, delivery, color }) => (
          <div key={job.id}>
            {pickup && delivery && (
              <Polyline positions={[pickup, delivery]} pathOptions={{ color, weight: 2, dashArray: "6 4", opacity: 0.8 }} />
            )}
            {pickup && (
              <Marker position={pickup} icon={pickupIcon}>
                <Popup>
                  <strong style={{ color: "#0fa14a" }}>{job.job_number}</strong><br />
                  <strong>Pickup:</strong> {job.pickup_city}, {job.pickup_state}<br />
                  <strong>Customer:</strong> {job.customer_name || "—"}<br />
                  <strong>Driver:</strong> {job.driver_name || "Unassigned"}
                </Popup>
              </Marker>
            )}
            {delivery && (
              <Marker position={delivery} icon={deliveryIcon}>
                <Popup>
                  <strong style={{ color: "#0fa14a" }}>{job.job_number}</strong><br />
                  <strong>Delivery:</strong> {job.delivery_city}, {job.delivery_state}<br />
                  <strong>Customer:</strong> {job.customer_name || "—"}<br />
                  <strong>Driver:</strong> {job.driver_name || "Unassigned"}
                </Popup>
              </Marker>
            )}
          </div>
        ))}
      </MapContainer>
    </div>
  );
}