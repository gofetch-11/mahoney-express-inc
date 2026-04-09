import { useState, useEffect, useCallback } from "react";
import { DHLTicket } from "@/api/entities";

const SHAREPOINT_BASE =
  "https://mahoneyexpress-my.sharepoint.com/personal/matt_mahoneyexpress_com/Documents/DHL%20Processed/";

function getPdfUrl(ticketNumber) {
  return `${SHAREPOINT_BASE}${ticketNumber}.pdf`;
}

function Badge({ children, color = "gray" }) {
  const colors = {
    gray: "bg-gray-700 text-gray-300",
    yellow: "bg-yellow-900/50 text-yellow-400 border border-yellow-700/40",
    red: "bg-red-900/40 text-red-400 border border-red-700/40",
    green: "bg-green-900/40 text-green-400 border border-green-700/40",
  };
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${colors[color]}`}>
      {children}
    </span>
  );
}

function StatCard({ icon, label, value, sub }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-start gap-3">
      <div className="text-2xl mt-0.5">{icon}</div>
      <div>
        <div className="text-xl font-bold text-white leading-tight">{value}</div>
        <div className="text-gray-400 text-sm">{label}</div>
        {sub && <div className="text-gray-600 text-xs mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}

function DetailPanel({ ticket, onClose }) {
  if (!ticket) return null;
  const pdfUrl = getPdfUrl(ticket.ticket_number);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-md bg-gray-950 border-l border-gray-800 h-full overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-gray-950 border-b border-gray-800 px-5 py-4 flex items-center justify-between z-10">
          <div>
            <div className="text-xs text-gray-500 uppercase tracking-wider mb-0.5">Ticket</div>
            <div className="text-yellow-400 font-mono font-bold text-xl">#{ticket.ticket_number}</div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-2xl leading-none">×</button>
        </div>

        <div className="px-5 py-4 space-y-5 flex-1">
          {/* Customer */}
          <div>
            <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Customer</div>
            <div className="text-white font-semibold">{ticket.customer || "—"}</div>
            {ticket.description && <div className="text-gray-400 text-sm mt-0.5">{ticket.description}</div>}
          </div>

          {/* Shipment Details */}
          <div>
            <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Shipment Details</div>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-gray-900 rounded-lg p-3 text-center">
                <div className="text-white font-bold text-lg">{ticket.miles ?? "—"}</div>
                <div className="text-gray-500 text-xs">Miles</div>
              </div>
              <div className="bg-gray-900 rounded-lg p-3 text-center">
                <div className="text-white font-bold text-lg">{ticket.pieces ?? "—"}</div>
                <div className="text-gray-500 text-xs">Pieces</div>
              </div>
              <div className="bg-gray-900 rounded-lg p-3 text-center">
                <div className="text-white font-bold text-lg">{ticket.weight_lbs ?? "—"}</div>
                <div className="text-gray-500 text-xs">Lbs</div>
              </div>
            </div>
          </div>

          {/* Schedule */}
          <div>
            <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Schedule</div>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <span className="text-green-400 text-lg">⬆</span>
                <div>
                  <div className="text-xs text-gray-500">Ready</div>
                  <div className="text-white text-sm">{ticket.ready || "—"}</div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-red-400 text-lg">⬇</span>
                <div>
                  <div className="text-xs text-gray-500">Deadline</div>
                  <div className="text-red-300 text-sm font-medium">{ticket.deadline || "—"}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Addresses */}
          <div>
            <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Addresses</div>
            <div className="space-y-3">
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-green-400 text-xs">●</span>
                  <span className="text-xs text-gray-400 font-medium uppercase">Pickup</span>
                </div>
                <div className="text-white text-sm leading-relaxed">
                  {ticket.pickup_address || <span className="text-gray-600 italic">No address on file</span>}
                </div>
                {ticket.pickup_address && (
                  <a
                    href={`https://maps.google.com/?q=${encodeURIComponent(ticket.pickup_address)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-yellow-400 hover:text-yellow-300 mt-1 inline-block"
                  >
                    View on Maps →
                  </a>
                )}
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-red-400 text-xs">●</span>
                  <span className="text-xs text-gray-400 font-medium uppercase">Delivery</span>
                </div>
                <div className="text-white text-sm leading-relaxed">
                  {ticket.delivery_address || <span className="text-gray-600 italic">No address on file</span>}
                </div>
                {ticket.delivery_address && (
                  <a
                    href={`https://maps.google.com/?q=${encodeURIComponent(ticket.delivery_address)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-yellow-400 hover:text-yellow-300 mt-1 inline-block"
                  >
                    View on Maps →
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* PDF Link */}
        <div className="sticky bottom-0 bg-gray-950 border-t border-gray-800 px-5 py-4">
          <a
            href={pdfUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-2 w-full bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-bold py-3 rounded-xl transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            Open PDF
          </a>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState("ticket_number");
  const [sortDir, setSortDir] = useState("desc");
  const [selected, setSelected] = useState(null);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 50;

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
      if (sortDir === "asc") return av > bv ? 1 : -1;
      return av < bv ? 1 : -1;
    });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleSort = (field) => {
    if (sortField === field) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("asc"); }
    setPage(1);
  };

  useEffect(() => { setPage(1); }, [search]);

  const hasAddr = tickets.filter((t) => t.pickup_address?.trim()).length;
  const totalMiles = tickets.reduce((s, t) => s + (t.miles || 0), 0);
  const totalWeight = tickets.reduce((s, t) => s + (t.weight_lbs || 0), 0);

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <span className="text-gray-600 ml-1 text-xs">↕</span>;
    return <span className="text-yellow-400 ml-1 text-xs">{sortDir === "asc" ? "↑" : "↓"}</span>;
  };

  const cols = [
    { label: "Ticket #", field: "ticket_number", w: "w-28" },
    { label: "Customer", field: "customer", w: "w-44" },
    { label: "Miles", field: "miles", w: "w-16" },
    { label: "Pcs", field: "pieces", w: "w-12" },
    { label: "Weight", field: "weight_lbs", w: "w-20" },
    { label: "Ready", field: "ready", w: "w-48" },
    { label: "Deadline", field: "deadline", w: "w-48" },
    { label: "Pickup", field: "pickup_address", w: "" },
    { label: "Delivery", field: "delivery_address", w: "" },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white font-sans">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-yellow-400 rounded-lg p-2">
            <svg className="w-5 h-5 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-bold text-white leading-tight">DHL Ticket Dashboard</h1>
            <p className="text-gray-500 text-xs">Mahoney Express — SameDay Shipments</p>
          </div>
        </div>
        <Badge color="yellow">{tickets.length.toLocaleString()} tickets</Badge>
      </div>

      <div className="px-6 py-5 max-w-screen-2xl mx-auto">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          <StatCard icon="🎫" label="Total Tickets" value={tickets.length.toLocaleString()} />
          <StatCard icon="🛣️" label="Total Miles" value={totalMiles.toLocaleString()} />
          <StatCard icon="⚖️" label="Total Weight" value={`${totalWeight.toLocaleString()} lbs`} />
          <StatCard
            icon="📍"
            label="Addresses Found"
            value={`${hasAddr.toLocaleString()} / ${tickets.length.toLocaleString()}`}
            sub={tickets.length > 0 ? `${Math.round((hasAddr / tickets.length) * 100)}% complete` : ""}
          />
        </div>

        {/* Search + count */}
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search ticket #, customer, address..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-9 pr-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-yellow-400 text-sm"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white text-lg leading-none">×</button>
            )}
          </div>
          <span className="text-gray-500 text-sm whitespace-nowrap">
            {filtered.length.toLocaleString()} result{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Table */}
        {loading ? (
          <div className="text-center text-gray-500 py-24">
            <div className="text-4xl mb-3">⏳</div>
            Loading tickets...
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center text-gray-500 py-24">
            <div className="text-4xl mb-3">🔍</div>
            No tickets match your search.
          </div>
        ) : (
          <>
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-800/80 text-gray-400 text-xs uppercase tracking-wider">
                      {cols.map(({ label, field, w }) => (
                        <th
                          key={field}
                          className={`px-4 py-3 text-left cursor-pointer hover:text-white select-none ${w}`}
                          onClick={() => handleSort(field)}
                        >
                          {label}<SortIcon field={field} />
                        </th>
                      ))}
                      <th className="px-4 py-3 text-left w-16">PDF</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.map((t, i) => (
                      <tr
                        key={t.id}
                        onClick={() => setSelected(t)}
                        className={`border-t border-gray-800 hover:bg-gray-800/70 cursor-pointer transition-colors ${i % 2 === 0 ? "bg-transparent" : "bg-gray-900/40"}`}
                      >
                        <td className="px-4 py-2.5 font-mono text-yellow-400 font-semibold whitespace-nowrap">
                          {t.ticket_number}
                        </td>
                        <td className="px-4 py-2.5 text-white max-w-[160px] truncate" title={t.customer}>
                          {t.customer || <span className="text-gray-600">—</span>}
                        </td>
                        <td className="px-4 py-2.5 text-gray-300 text-right pr-6">{t.miles ?? "—"}</td>
                        <td className="px-4 py-2.5 text-gray-300 text-right pr-6">{t.pieces ?? "—"}</td>
                        <td className="px-4 py-2.5 text-gray-300 whitespace-nowrap">
                          {t.weight_lbs ? `${t.weight_lbs} lbs` : "—"}
                        </td>
                        <td className="px-4 py-2.5 text-gray-400 text-xs whitespace-nowrap">{t.ready || "—"}</td>
                        <td className="px-4 py-2.5 text-red-400 text-xs whitespace-nowrap font-medium">{t.deadline || "—"}</td>
                        <td className="px-4 py-2.5 text-gray-400 text-xs max-w-[180px] truncate" title={t.pickup_address}>
                          {t.pickup_address || <span className="text-gray-700 italic">—</span>}
                        </td>
                        <td className="px-4 py-2.5 text-gray-400 text-xs max-w-[180px] truncate" title={t.delivery_address}>
                          {t.delivery_address || <span className="text-gray-700 italic">—</span>}
                        </td>
                        <td className="px-4 py-2.5" onClick={(e) => e.stopPropagation()}>
                          <a
                            href={getPdfUrl(t.ticket_number)}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center justify-center w-7 h-7 rounded bg-gray-800 hover:bg-yellow-400 hover:text-gray-900 text-gray-400 transition-colors"
                            title="Open PDF"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-4 py-3 border-t border-gray-800 flex items-center justify-between text-sm">
                  <span className="text-gray-500 text-xs">
                    Page {page} of {totalPages} · {filtered.length.toLocaleString()} tickets
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setPage(1)}
                      disabled={page === 1}
                      className="px-2 py-1 rounded text-xs text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                    >«</button>
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-3 py-1 rounded text-xs bg-gray-800 text-gray-300 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
                    >Prev</button>
                    <span className="px-3 py-1 text-xs text-yellow-400 font-bold">{page}</span>
                    <button
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="px-3 py-1 rounded text-xs bg-gray-800 text-gray-300 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
                    >Next</button>
                    <button
                      onClick={() => setPage(totalPages)}
                      disabled={page === totalPages}
                      className="px-2 py-1 rounded text-xs text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                    >»</button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Detail Panel */}
      <DetailPanel ticket={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
