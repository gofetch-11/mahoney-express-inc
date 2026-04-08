import { useState, useEffect } from "react";
import { DHLTicket } from "@/api/entities";

export default function Dashboard() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState("created_date");
  const [sortDir, setSortDir] = useState("desc");

  useEffect(() => {
    DHLTicket.list().then((data) => {
      setTickets(data);
      setLoading(false);
    });
  }, []);

  const filtered = tickets
    .filter((t) => {
      const q = search.toLowerCase();
      return (
        !q ||
        t.ticket_number?.toLowerCase().includes(q) ||
        t.customer?.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q) ||
        t.pickup_address?.toLowerCase().includes(q) ||
        t.delivery_address?.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      const av = a[sortField] ?? "";
      const bv = b[sortField] ?? "";
      return sortDir === "asc"
        ? av > bv ? 1 : -1
        : av < bv ? 1 : -1;
    });

  const handleSort = (field) => {
    if (sortField === field) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("asc"); }
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <span className="text-gray-300 ml-1">↕</span>;
    return <span className="text-yellow-400 ml-1">{sortDir === "asc" ? "↑" : "↓"}</span>;
  };

  const totalMiles = tickets.reduce((s, t) => s + (t.miles || 0), 0);
  const totalWeight = tickets.reduce((s, t) => s + (t.weight_lbs || 0), 0);
  const totalPieces = tickets.reduce((s, t) => s + (t.pieces || 0), 0);

  return (
    <div className="min-h-screen bg-gray-950 text-white font-sans">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center gap-4">
        <div className="bg-yellow-400 rounded-lg p-2">
          <svg className="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">DHL Ticket Dashboard</h1>
          <p className="text-gray-400 text-sm">Mahoney Express — SameDay Shipments</p>
        </div>
      </div>

      <div className="px-6 py-6 max-w-7xl mx-auto">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total Tickets", value: tickets.length, icon: "🎫" },
            { label: "Total Miles", value: totalMiles.toLocaleString(), icon: "🛣️" },
            { label: "Total Weight", value: `${totalWeight.toLocaleString()} lbs`, icon: "⚖️" },
            { label: "Total Pieces", value: totalPieces, icon: "📦" },
          ].map((stat) => (
            <div key={stat.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <div className="text-2xl mb-1">{stat.icon}</div>
              <div className="text-2xl font-bold text-white">{stat.value}</div>
              <div className="text-gray-400 text-sm">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search by ticket #, customer, description, address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-yellow-400"
          />
        </div>

        {/* Table */}
        {loading ? (
          <div className="text-center text-gray-400 py-20">Loading tickets...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center text-gray-400 py-20">No tickets found.</div>
        ) : (
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-800 text-gray-400 text-xs uppercase tracking-wider">
                    {[
                      { label: "Ticket #", field: "ticket_number" },
                      { label: "Customer", field: "customer" },
                      { label: "Description", field: "description" },
                      { label: "Miles", field: "miles" },
                      { label: "Pcs", field: "pieces" },
                      { label: "Weight", field: "weight_lbs" },
                      { label: "Ready", field: "ready" },
                      { label: "Deadline", field: "deadline" },
                    ].map(({ label, field }) => (
                      <th
                        key={field}
                        className="px-4 py-3 text-left cursor-pointer hover:text-white"
                        onClick={() => handleSort(field)}
                      >
                        {label}<SortIcon field={field} />
                      </th>
                    ))}
                    <th className="px-4 py-3 text-left">Pickup</th>
                    <th className="px-4 py-3 text-left">Delivery</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((t, i) => (
                    <tr
                      key={t.id}
                      className={`border-t border-gray-800 hover:bg-gray-800 transition-colors ${i % 2 === 0 ? "" : "bg-gray-900/50"}`}
                    >
                      <td className="px-4 py-3 font-mono text-yellow-400 font-bold">{t.ticket_number}</td>
                      <td className="px-4 py-3 text-white max-w-[150px] truncate" title={t.customer}>{t.customer}</td>
                      <td className="px-4 py-3 text-gray-300 max-w-[150px] truncate" title={t.description}>{t.description}</td>
                      <td className="px-4 py-3 text-gray-300">{t.miles ?? "—"}</td>
                      <td className="px-4 py-3 text-gray-300">{t.pieces ?? "—"}</td>
                      <td className="px-4 py-3 text-gray-300">{t.weight_lbs ? `${t.weight_lbs} lbs` : "—"}</td>
                      <td className="px-4 py-3 text-gray-300 whitespace-nowrap">{t.ready}</td>
                      <td className="px-4 py-3 text-red-400 whitespace-nowrap">{t.deadline}</td>
                      <td className="px-4 py-3 text-gray-400 max-w-[180px] truncate text-xs" title={t.pickup_address}>{t.pickup_address}</td>
                      <td className="px-4 py-3 text-gray-400 max-w-[180px] truncate text-xs" title={t.delivery_address}>{t.delivery_address}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 border-t border-gray-800 text-gray-500 text-xs">
              Showing {filtered.length} of {tickets.length} tickets
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
