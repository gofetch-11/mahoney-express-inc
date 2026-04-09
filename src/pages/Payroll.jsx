import { useState, useEffect } from "react";
import { Driver, Job, DriverPayment } from "@/api/entities";
import { DollarSign, TrendingUp, Users, BarChart2, CheckCircle, Clock } from "lucide-react";

export default function Payroll() {
  const [drivers, setDrivers] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [driverData, setDriverData] = useState([]);
  const [period, setPeriod] = useState(() => {
    const now = new Date();
    return {
      start: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6).toISOString().split("T")[0],
      end: now.toISOString().split("T")[0],
    };
  });
  const [generatingId, setGeneratingId] = useState(null);

  useEffect(() => { loadData(); }, []);

  useEffect(() => { computeDriverData(); }, [drivers, jobs, period]);

  async function loadData() {
    const [drvs, js, pmts] = await Promise.all([Driver.list(), Job.list(), DriverPayment.list()]);
    setDrivers(drvs.filter(d => d.status === "Active"));
    setJobs(js);
    setPayments(pmts);
    setLoading(false);
  }

  function computeDriverData() {
    const data = drivers.map(d => {
      const myJobs = jobs.filter(j =>
        j.driver_id === d.id &&
        j.status === "Delivered" &&
        j.updated_date >= period.start + "T00:00:00.000Z" &&
        j.updated_date <= period.end + "T23:59:59.999Z"
      );
      const totalBilled = myJobs.reduce((s, j) => s + (j.bill_rate || 0), 0);
      const totalPay = myJobs.reduce((s, j) => s + (j.driver_pay || 0), 0);
      const totalMiles = myJobs.reduce((s, j) => s + (j.miles || 0), 0);
      const margin = totalBilled - totalPay;
      const marginPct = totalBilled > 0 ? (margin / totalBilled * 100) : 0;
      return { driver: d, jobs: myJobs, totalBilled, totalPay, totalMiles, margin, marginPct };
    });
    setDriverData(data);
  }

  const fmt = (n) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n || 0);

  const totals = driverData.reduce((acc, d) => ({
    billed: acc.billed + d.totalBilled,
    pay: acc.pay + d.totalPay,
    jobs: acc.jobs + d.jobs.length,
    miles: acc.miles + d.totalMiles,
  }), { billed: 0, pay: 0, jobs: 0, miles: 0 });

  const generatePayroll = async (item) => {
    setGeneratingId(item.driver.id);
    await DriverPayment.create({
      driver_id: item.driver.id,
      driver_name: `${item.driver.first_name} ${item.driver.last_name}`,
      period_start: period.start,
      period_end: period.end,
      job_ids: item.jobs.map(j => j.id).join(","),
      total_jobs: item.jobs.length,
      total_miles: item.totalMiles,
      gross_pay: item.totalPay,
      deductions: 0,
      net_pay: item.totalPay,
      total_billed: item.totalBilled,
      margin: item.margin,
      status: "Draft",
    });
    await loadData();
    setGeneratingId(null);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Driver Payroll</h1>
        <p className="text-sm text-gray-500">Pay vs. billing comparison by driver</p>
      </div>

      {/* Period Selector */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 mb-6">
        <div className="flex items-end gap-4">
          <div>
            <label className="label">Period Start</label>
            <input className="input w-40" type="date" value={period.start} onChange={e => setPeriod(p => ({ ...p, start: e.target.value }))} />
          </div>
          <div>
            <label className="label">Period End</label>
            <input className="input w-40" type="date" value={period.end} onChange={e => setPeriod(p => ({ ...p, end: e.target.value }))} />
          </div>
          <div className="flex gap-2">
            {[
              { label: "This Week", fn: () => { const now = new Date(); const mon = new Date(now); mon.setDate(now.getDate() - now.getDay() + 1); setPeriod({ start: mon.toISOString().split("T")[0], end: now.toISOString().split("T")[0] }); } },
              { label: "Last Week", fn: () => { const now = new Date(); const mon = new Date(now); mon.setDate(now.getDate() - now.getDay() - 6); const sun = new Date(mon); sun.setDate(mon.getDate() + 6); setPeriod({ start: mon.toISOString().split("T")[0], end: sun.toISOString().split("T")[0] }); } },
              { label: "This Month", fn: () => { const now = new Date(); setPeriod({ start: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0], end: now.toISOString().split("T")[0] }); } },
            ].map(b => (
              <button key={b.label} onClick={b.fn} className="text-sm border border-gray-200 px-3 py-2 rounded-lg hover:bg-gray-50 text-gray-600">{b.label}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
          <p className="text-xs text-gray-500 mb-1">Total Billed</p>
          <p className="text-xl font-bold text-gray-900">{fmt(totals.billed)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
          <p className="text-xs text-gray-500 mb-1">Total Driver Pay</p>
          <p className="text-xl font-bold text-red-600">{fmt(totals.pay)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-green-200 p-4 shadow-sm">
          <p className="text-xs text-gray-500 mb-1">Total Margin</p>
          <p className="text-xl font-bold text-green-600">{fmt(totals.billed - totals.pay)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
          <p className="text-xs text-gray-500 mb-1">Total Jobs</p>
          <p className="text-xl font-bold text-gray-900">{totals.jobs}</p>
        </div>
      </div>

      {/* Driver Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-8">
        <div className="p-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">Driver Performance — {period.start} to {period.end}</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Driver</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-600">Jobs</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-600">Miles</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-600">Billed</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-600">Driver Pay</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-600">Margin</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-600">Margin %</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {driverData.map(item => (
              <tr key={item.driver.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center text-red-700 font-bold text-xs">
                      {item.driver.first_name?.[0]}{item.driver.last_name?.[0]}
                    </div>
                    <span className="font-medium text-gray-800">{item.driver.first_name} {item.driver.last_name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-right">{item.jobs.length}</td>
                <td className="px-4 py-3 text-right text-gray-500">{item.totalMiles.toFixed(0)}</td>
                <td className="px-4 py-3 text-right font-semibold text-gray-800">{fmt(item.totalBilled)}</td>
                <td className="px-4 py-3 text-right text-red-600 font-medium">{fmt(item.totalPay)}</td>
                <td className={`px-4 py-3 text-right font-bold ${item.margin >= 0 ? "text-green-600" : "text-red-600"}`}>{fmt(item.margin)}</td>
                <td className="px-4 py-3 text-right">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${item.marginPct >= 30 ? "bg-green-100 text-green-700" : item.marginPct >= 10 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>
                    {item.marginPct.toFixed(1)}%
                  </span>
                </td>
                <td className="px-4 py-3">
                  {item.jobs.length > 0 && (
                    <button onClick={() => generatePayroll(item)} disabled={generatingId === item.driver.id} className="text-xs bg-gray-800 text-white px-2 py-1 rounded-lg hover:bg-gray-700 disabled:opacity-50">
                      {generatingId === item.driver.id ? "..." : "Gen Payroll"}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Payroll History */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">Payroll History</h2>
        </div>
        {payments.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">No payroll records yet. Generate payroll from the driver table above.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Driver</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Period</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">Jobs</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">Billed</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">Net Pay</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {payments.sort((a, b) => new Date(b.created_date) - new Date(a.created_date)).map(p => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{p.driver_name}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{p.period_start} → {p.period_end}</td>
                  <td className="px-4 py-3 text-right">{p.total_jobs}</td>
                  <td className="px-4 py-3 text-right">{fmt(p.total_billed)}</td>
                  <td className="px-4 py-3 text-right font-bold text-green-600">{fmt(p.net_pay)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.status === "Paid" ? "bg-green-100 text-green-700" : p.status === "Approved" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"}`}>{p.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    {p.status === "Draft" && (
                      <button onClick={async () => { await DriverPayment.update(p.id, { status: "Approved" }); loadData(); }} className="text-xs text-blue-600 hover:underline">Approve</button>
                    )}
                    {p.status === "Approved" && (
                      <button onClick={async () => { await DriverPayment.update(p.id, { status: "Paid" }); loadData(); }} className="text-xs text-green-600 hover:underline">Mark Paid</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
