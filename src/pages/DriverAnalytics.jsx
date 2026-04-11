import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Driver, Job } from "@/api/entities";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { TrendingUp, Clock, CheckCircle, Fuel } from "lucide-react";

const FuelLog = base44.entities.FuelLog;

const GREEN = "#0fa14a";
const BG = "#0e1012";
const SURFACE = "#161a1d";
const SURFACE2 = "#1e2328";
const BORDER = "rgba(255,255,255,0.07)";
const TEXT = "#f0f0ee";
const MUTED = "#8a8a85";

const card = { background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.3)" };

function pctColor(v) {
  if (v >= 90) return "#4ade80";
  if (v >= 70) return "#fbbf24";
  return "#f87171";
}

function avgColor(v) {
  if (v <= 60) return "#4ade80";
  if (v <= 120) return "#fbbf24";
  return "#f87171";
}

export default function DriverAnalytics() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState("onTimePct");
  const [sortDir, setSortDir] = useState(-1);

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    const [drivers, jobs, fuelLogs] = await Promise.all([
      Driver.list(),
      Job.filter({ status: "Delivered" }),
      FuelLog.list(),
    ]);

    const data = drivers
      .filter(d => d.status === "Active")
      .map(driver => {
        const driverJobs = jobs.filter(j => j.driver_id === driver.id);

        // ── Average time per job (minutes) ──
        const timedJobs = driverJobs.filter(j => j.ready_time && j.pod_captured_at || j.updated_date);
        const avgMinutes = timedJobs.length === 0 ? null : (() => {
          const totalMs = timedJobs.reduce((sum, j) => {
            const start = new Date(j.ready_time || j.created_date);
            const end = new Date(j.pod_captured_at || j.updated_date);
            return sum + Math.max(0, end - start);
          }, 0);
          return Math.round(totalMs / timedJobs.length / 60000);
        })();

        // ── On-time delivery % ──
        const jobsWithDeadline = driverJobs.filter(j => j.deadline);
        const onTimePct = jobsWithDeadline.length === 0 ? null : (() => {
          const onTime = jobsWithDeadline.filter(j => {
            const delivered = new Date(j.pod_captured_at || j.updated_date);
            return delivered <= new Date(j.deadline);
          }).length;
          return Math.round((onTime / jobsWithDeadline.length) * 100);
        })();

        // ── Fuel cost per mile ──
        const driverFuel = fuelLogs.filter(f => f.driver_id === driver.id || f.driver_name === `${driver.first_name} ${driver.last_name}`);
        const totalFuelCost = driverFuel.reduce((s, f) => s + (f.total_cost || 0), 0);
        const totalJobMiles = driverJobs.reduce((s, j) => s + (j.miles || 0), 0);
        const fuelPerMile = totalJobMiles > 0 ? (totalFuelCost / totalJobMiles) : null;

        return {
          id: driver.id,
          name: `${driver.first_name} ${driver.last_name}`,
          initials: `${(driver.first_name || "?")[0]}${(driver.last_name || "?")[0]}`,
          vehicle: driver.vehicle_type || "—",
          totalJobs: driverJobs.length,
          avgMinutes,
          onTimePct,
          fuelPerMile,
          totalMiles: totalJobMiles,
          totalFuelCost,
        };
      })
      .filter(d => d.totalJobs > 0);

    setRows(data);
    setLoading(false);
  }

  const sorted = [...rows].sort((a, b) => {
    const av = a[sortKey] ?? -1;
    const bv = b[sortKey] ?? -1;
    return sortDir * (bv - av);
  });

  const handleSort = (key) => {
    if (sortKey === key) setSortDir(d => -d);
    else { setSortKey(key); setSortDir(-1); }
  };

  // Fleet averages
  const withOnTime = rows.filter(r => r.onTimePct !== null);
  const withAvg = rows.filter(r => r.avgMinutes !== null);
  const withFuel = rows.filter(r => r.fuelPerMile !== null);
  const fleetOnTime = withOnTime.length ? Math.round(withOnTime.reduce((s, r) => s + r.onTimePct, 0) / withOnTime.length) : null;
  const fleetAvgMin = withAvg.length ? Math.round(withAvg.reduce((s, r) => s + r.avgMinutes, 0) / withAvg.length) : null;
  const fleetFuelPerMile = withFuel.length ? (withFuel.reduce((s, r) => s + r.fuelPerMile, 0) / withFuel.length) : null;

  const chartData = sorted.map(r => ({
    name: r.initials,
    "On-Time %": r.onTimePct ?? 0,
    "Avg Min/Job": r.avgMinutes ?? 0,
  }));

  if (loading) return (
    <div style={{ minHeight: "100vh", background: BG, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 36, height: 36, borderRadius: "50%", border: `3px solid ${GREEN}`, borderTopColor: "transparent", animation: "spin 1s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: BG, fontFamily: "Source Sans 3, sans-serif", padding: 24 }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: GREEN, fontFamily: "Barlow, sans-serif", margin: "0 0 2px" }}>Performance</p>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: TEXT, margin: 0, fontFamily: "Barlow, sans-serif" }}>Driver Analytics</h1>
        <p style={{ fontSize: 13, color: MUTED, margin: "2px 0 0" }}>Efficiency, on-time delivery, and fuel cost per mile</p>
      </div>

      {/* Fleet Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 24 }}>
        {[
          { label: "Fleet On-Time %", value: fleetOnTime !== null ? `${fleetOnTime}%` : "—", icon: CheckCircle, color: fleetOnTime !== null ? pctColor(fleetOnTime) : MUTED },
          { label: "Avg Time Per Job", value: fleetAvgMin !== null ? `${fleetAvgMin} min` : "—", icon: Clock, color: fleetAvgMin !== null ? avgColor(fleetAvgMin) : MUTED },
          { label: "Fleet Fuel / Mile", value: fleetFuelPerMile !== null ? `$${fleetFuelPerMile.toFixed(2)}` : "—", icon: Fuel, color: "#fbbf24" },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} style={{ ...card, padding: "18px 20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: MUTED, fontFamily: "Barlow, sans-serif" }}>{s.label}</span>
                <Icon size={16} style={{ color: s.color }} />
              </div>
              <p style={{ fontSize: 32, fontWeight: 800, color: s.color, margin: 0, fontFamily: "Barlow, sans-serif", lineHeight: 1 }}>{s.value}</p>
            </div>
          );
        })}
      </div>

      {rows.length === 0 ? (
        <div style={{ textAlign: "center", padding: 64, color: MUTED }}>
          <TrendingUp size={36} style={{ marginBottom: 12, opacity: 0.2 }} />
          <p>No delivered jobs found. Analytics will populate once drivers complete deliveries.</p>
        </div>
      ) : (
        <>
          {/* Chart */}
          <div style={{ ...card, padding: "20px 24px", marginBottom: 24 }}>
            <p style={{ fontFamily: "Barlow, sans-serif", fontWeight: 700, fontSize: 14, color: TEXT, margin: "0 0 16px" }}>On-Time % by Driver</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} barGap={6}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" tick={{ fill: MUTED, fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: MUTED, fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} unit="%" />
                <Tooltip
                  contentStyle={{ background: SURFACE2, border: `1px solid ${BORDER}`, borderRadius: 10, color: TEXT, fontSize: 12 }}
                  cursor={{ fill: "rgba(255,255,255,0.04)" }}
                />
                <Bar dataKey="On-Time %" fill={GREEN} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Table */}
          <div style={{ ...card, overflow: "hidden" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "#060204", borderBottom: `2px solid ${GREEN}` }}>
                    {[
                      { label: "Driver", key: null },
                      { label: "Jobs", key: "totalJobs" },
                      { label: "Avg Time/Job", key: "avgMinutes" },
                      { label: "On-Time %", key: "onTimePct" },
                      { label: "Total Miles", key: "totalMiles" },
                      { label: "Fuel Cost", key: "totalFuelCost" },
                      { label: "$/Mile", key: "fuelPerMile" },
                    ].map(col => (
                      <th key={col.label}
                        onClick={() => col.key && handleSort(col.key)}
                        style={{ textAlign: "left", padding: "10px 16px", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: sortKey === col.key ? GREEN : "#888", fontFamily: "Barlow, sans-serif", whiteSpace: "nowrap", cursor: col.key ? "pointer" : "default", userSelect: "none" }}>
                        {col.label}{sortKey === col.key ? (sortDir === -1 ? " ↓" : " ↑") : ""}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((r, i) => (
                    <tr key={r.id} style={{ background: i % 2 === 0 ? SURFACE : SURFACE2, borderBottom: `1px solid ${BORDER}` }}>
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ width: 34, height: 34, borderRadius: "50%", background: "rgba(15,161,74,0.15)", border: `2px solid ${GREEN}`, display: "flex", alignItems: "center", justifyContent: "center", color: GREEN, fontWeight: 800, fontSize: 12, fontFamily: "Barlow, sans-serif", flexShrink: 0 }}>
                            {r.initials}
                          </div>
                          <div>
                            <p style={{ fontWeight: 700, color: TEXT, margin: 0, fontFamily: "Barlow, sans-serif", fontSize: 14 }}>{r.name}</p>
                            <p style={{ fontSize: 11, color: MUTED, margin: 0 }}>{r.vehicle}</p>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "14px 16px", fontWeight: 700, color: TEXT, fontFamily: "Barlow, sans-serif" }}>{r.totalJobs}</td>
                      <td style={{ padding: "14px 16px" }}>
                        {r.avgMinutes !== null
                          ? <span style={{ fontWeight: 700, color: avgColor(r.avgMinutes), fontFamily: "Barlow, sans-serif" }}>{r.avgMinutes} min</span>
                          : <span style={{ color: MUTED }}>—</span>}
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        {r.onTimePct !== null ? (
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{ flex: 1, height: 6, background: SURFACE2, borderRadius: 999, overflow: "hidden", minWidth: 60 }}>
                              <div style={{ height: "100%", width: `${r.onTimePct}%`, background: pctColor(r.onTimePct), borderRadius: 999 }} />
                            </div>
                            <span style={{ fontWeight: 700, color: pctColor(r.onTimePct), fontFamily: "Barlow, sans-serif", minWidth: 36 }}>{r.onTimePct}%</span>
                          </div>
                        ) : <span style={{ color: MUTED }}>—</span>}
                      </td>
                      <td style={{ padding: "14px 16px", color: MUTED }}>{r.totalMiles > 0 ? r.totalMiles.toLocaleString() : "—"}</td>
                      <td style={{ padding: "14px 16px", color: "#fbbf24", fontFamily: "Barlow, sans-serif", fontWeight: 600 }}>
                        {r.totalFuelCost > 0 ? `$${r.totalFuelCost.toFixed(2)}` : "—"}
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        {r.fuelPerMile !== null
                          ? <span style={{ fontWeight: 700, color: TEXT, fontFamily: "Barlow, sans-serif" }}>${r.fuelPerMile.toFixed(2)}</span>
                          : <span style={{ color: MUTED }}>—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ padding: "10px 16px", fontSize: 11, color: MUTED, borderTop: `1px solid ${BORDER}` }}>
              {rows.length} drivers · Click column headers to sort · On-time calculated against job deadline
            </div>
          </div>
        </>
      )}
    </div>
  );
}