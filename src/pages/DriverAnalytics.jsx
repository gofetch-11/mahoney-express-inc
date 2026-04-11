import { useState, useEffect } from "react";
import { Driver, Job } from "@/api/entities";
import { base44 } from "@/api/base44Client";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { TrendingUp, Clock, CheckCircle, Fuel, Users } from "lucide-react";

const FuelLog = base44.entities.FuelLog;

const GREEN = "#0fa14a";
const BG = "#0e1012";
const SURFACE = "#161a1d";
const SURFACE2 = "#1e2328";
const BORDER = "rgba(255,255,255,0.07)";
const TEXT = "#f0f0ee";
const MUTED = "#8a8a85";

const card = { background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.3)" };

function getBarColor(val, max) {
  const ratio = max > 0 ? val / max : 0;
  if (ratio > 0.75) return GREEN;
  if (ratio > 0.4) return "#fbbf24";
  return "#f87171";
}

export default function DriverAnalytics() {
  const [loading, setLoading] = useState(true);
  const [driverStats, setDriverStats] = useState([]);
  const [totals, setTotals] = useState({ drivers: 0, avgOnTime: 0, avgJobTime: 0, avgFuelPerMile: 0 });

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const [drivers, jobs, fuelLogs] = await Promise.all([
      Driver.list(),
      Job.filter({ status: "Delivered" }),
      FuelLog.list(),
    ]);

    const stats = drivers
      .filter(d => d.status === "Active")
      .map(driver => {
        const myJobs = jobs.filter(j => j.driver_id === driver.id);
        const myFuel = fuelLogs.filter(f => f.driver_id === driver.id || f.driver_name === `${driver.first_name} ${driver.last_name}`);

        // Avg time per job (hours): created_date → updated_date
        const jobTimes = myJobs
          .filter(j => j.created_date && j.updated_date)
          .map(j => (new Date(j.updated_date) - new Date(j.created_date)) / 3600000);
        const avgJobHours = jobTimes.length > 0
          ? jobTimes.reduce((s, t) => s + t, 0) / jobTimes.length
          : null;

        // On-time delivery %: deadline vs updated_date (when delivered)
        const withDeadline = myJobs.filter(j => j.deadline && j.updated_date);
        const onTime = withDeadline.filter(j => new Date(j.updated_date) <= new Date(j.deadline));
        const onTimePct = withDeadline.length > 0
          ? Math.round((onTime.length / withDeadline.length) * 100)
          : null;

        // Total miles driven (from jobs)
        const totalMiles = myJobs.reduce((s, j) => s + (j.miles || 0), 0);

        // Fuel cost per mile
        const totalFuelCost = myFuel.reduce((s, f) => s + (f.total_cost || 0), 0);
        const fuelPerMile = totalMiles > 0 ? totalFuelCost / totalMiles : null;

        return {
          id: driver.id,
          name: `${driver.first_name} ${driver.last_name}`,
          initials: `${(driver.first_name || "?")[0]}${(driver.last_name || "?")[0]}`,
          jobCount: myJobs.length,
          avgJobHours,
          onTimePct,
          totalMiles,
          fuelPerMile,
          totalFuelCost,
        };
      })
      .filter(d => d.jobCount > 0)
      .sort((a, b) => b.jobCount - a.jobCount);

    const withOnTime = stats.filter(d => d.onTimePct !== null);
    const withJobTime = stats.filter(d => d.avgJobHours !== null);
    const withFuel = stats.filter(d => d.fuelPerMile !== null);

    setDriverStats(stats);
    setTotals({
      drivers: stats.length,
      avgOnTime: withOnTime.length > 0 ? Math.round(withOnTime.reduce((s, d) => s + d.onTimePct, 0) / withOnTime.length) : 0,
      avgJobTime: withJobTime.length > 0 ? (withJobTime.reduce((s, d) => s + d.avgJobHours, 0) / withJobTime.length).toFixed(1) : "—",
      avgFuelPerMile: withFuel.length > 0 ? (withFuel.reduce((s, d) => s + d.fuelPerMile, 0) / withFuel.length).toFixed(2) : "—",
    });

    setLoading(false);
  }

  const maxOnTime = Math.max(...driverStats.map(d => d.onTimePct ?? 0), 1);

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
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: GREEN, fontFamily: "Barlow, sans-serif", margin: "0 0 2px" }}>Admin Analytics</p>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: TEXT, margin: 0, fontFamily: "Barlow, sans-serif" }}>Driver Efficiency</h1>
        <p style={{ fontSize: 13, color: MUTED, margin: "2px 0 0" }}>Job performance, on-time delivery, and fuel costs per driver</p>
      </div>

      {/* Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 24 }}>
        {[
          { label: "Active Drivers w/ Data", value: totals.drivers, icon: Users, color: "#60a5fa", bg: "rgba(59,130,246,0.12)" },
          { label: "Fleet On-Time Avg", value: totals.avgOnTime + "%", icon: CheckCircle, color: GREEN, bg: "rgba(15,161,74,0.12)" },
          { label: "Avg Time Per Job", value: totals.avgJobTime === "—" ? "—" : totals.avgJobTime + "h", icon: Clock, color: "#a78bfa", bg: "rgba(139,92,246,0.12)" },
          { label: "Avg Fuel Cost / Mile", value: totals.avgFuelPerMile === "—" ? "—" : "$" + totals.avgFuelPerMile, icon: Fuel, color: "#fbbf24", bg: "rgba(245,158,11,0.12)" },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} style={{ ...card, padding: "18px 20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: MUTED, fontFamily: "Barlow, sans-serif" }}>{s.label}</span>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon size={16} style={{ color: s.color }} />
                </div>
              </div>
              <p style={{ fontSize: 28, fontWeight: 800, color: TEXT, margin: 0, fontFamily: "Barlow, sans-serif", lineHeight: 1 }}>{s.value}</p>
            </div>
          );
        })}
      </div>

      {/* On-Time Delivery Chart */}
      {driverStats.some(d => d.onTimePct !== null) && (
        <div style={{ ...card, padding: 20, marginBottom: 20 }}>
          <h2 style={{ fontFamily: "Barlow, sans-serif", fontWeight: 800, fontSize: 15, color: TEXT, margin: "0 0 16px", display: "flex", alignItems: "center", gap: 8 }}>
            <CheckCircle size={15} style={{ color: GREEN }} /> On-Time Delivery %
          </h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={driverStats.filter(d => d.onTimePct !== null)} barSize={32}>
              <XAxis dataKey="name" tick={{ fill: MUTED, fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fill: MUTED, fontSize: 11 }} axisLine={false} tickLine={false} unit="%" />
              <Tooltip
                contentStyle={{ background: SURFACE2, border: `1px solid ${BORDER}`, borderRadius: 10, color: TEXT }}
                formatter={(val) => [`${val}%`, "On-Time"]}
              />
              <Bar dataKey="onTimePct" radius={[6, 6, 0, 0]}>
                {driverStats.filter(d => d.onTimePct !== null).map((d) => (
                  <Cell key={d.id} fill={getBarColor(d.onTimePct, maxOnTime)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Driver Detail Table */}
      {driverStats.length === 0 ? (
        <div style={{ ...card, padding: 48, textAlign: "center", color: MUTED }}>
          <TrendingUp size={36} style={{ marginBottom: 12, opacity: 0.2 }} />
          <p>No delivered jobs found. Efficiency data will appear once drivers start completing jobs.</p>
        </div>
      ) : (
        <div style={{ ...card, overflow: "hidden" }}>
          <div style={{ padding: "14px 20px", borderBottom: `1px solid ${BORDER}` }}>
            <h2 style={{ fontFamily: "Barlow, sans-serif", fontWeight: 800, fontSize: 15, color: TEXT, margin: 0 }}>Per-Driver Breakdown</h2>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#060204", borderBottom: `2px solid ${GREEN}` }}>
                  {["Driver", "Jobs", "Avg Time / Job", "On-Time %", "Total Miles", "Fuel Cost", "Fuel / Mile"].map(h => (
                    <th key={h} style={{ textAlign: "left", padding: "10px 16px", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "#888", fontFamily: "Barlow, sans-serif", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {driverStats.map((d, i) => {
                  const otColor = d.onTimePct === null ? MUTED : d.onTimePct >= 80 ? GREEN : d.onTimePct >= 50 ? "#fbbf24" : "#f87171";
                  return (
                    <tr key={d.id} style={{ background: i % 2 === 0 ? SURFACE : SURFACE2, borderBottom: `1px solid ${BORDER}` }}>
                      <td style={{ padding: "13px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(15,161,74,0.15)", border: `1px solid ${GREEN}`, display: "flex", alignItems: "center", justifyContent: "center", color: GREEN, fontWeight: 800, fontSize: 11, fontFamily: "Barlow, sans-serif", flexShrink: 0 }}>
                            {d.initials}
                          </div>
                          <span style={{ fontWeight: 700, color: TEXT, fontFamily: "Barlow, sans-serif" }}>{d.name}</span>
                        </div>
                      </td>
                      <td style={{ padding: "13px 16px", color: TEXT, fontWeight: 600 }}>{d.jobCount}</td>
                      <td style={{ padding: "13px 16px", color: d.avgJobHours !== null ? TEXT : MUTED }}>
                        {d.avgJobHours !== null ? `${d.avgJobHours.toFixed(1)}h` : "—"}
                      </td>
                      <td style={{ padding: "13px 16px" }}>
                        {d.onTimePct !== null ? (
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{ flex: 1, height: 6, background: SURFACE2, borderRadius: 999, overflow: "hidden", minWidth: 60 }}>
                              <div style={{ height: "100%", width: `${d.onTimePct}%`, background: otColor, borderRadius: 999 }} />
                            </div>
                            <span style={{ fontWeight: 700, color: otColor, fontFamily: "Barlow, sans-serif", minWidth: 36 }}>{d.onTimePct}%</span>
                          </div>
                        ) : <span style={{ color: MUTED }}>—</span>}
                      </td>
                      <td style={{ padding: "13px 16px", color: MUTED }}>{d.totalMiles > 0 ? d.totalMiles.toLocaleString() + " mi" : "—"}</td>
                      <td style={{ padding: "13px 16px", color: d.totalFuelCost > 0 ? "#fbbf24" : MUTED, fontWeight: d.totalFuelCost > 0 ? 700 : 400 }}>
                        {d.totalFuelCost > 0 ? `$${d.totalFuelCost.toFixed(2)}` : "—"}
                      </td>
                      <td style={{ padding: "13px 16px", color: d.fuelPerMile !== null ? TEXT : MUTED, fontWeight: d.fuelPerMile !== null ? 700 : 400 }}>
                        {d.fuelPerMile !== null ? `$${d.fuelPerMile.toFixed(3)}/mi` : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{ padding: "10px 16px", fontSize: 11, color: MUTED, borderTop: `1px solid ${BORDER}` }}>
            On-time = delivered before or on deadline · Job time = job created → delivered · Fuel matched by driver name/ID in fuel logs
          </div>
        </div>
      )}
    </div>
  );
}