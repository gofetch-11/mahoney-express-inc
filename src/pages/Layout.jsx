import { useState } from "react";
import {
  LayoutDashboard, Package, Truck, Users, Building2,
  FileText, DollarSign, BarChart2, Menu, Plus, X
} from "lucide-react";

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/new-job", label: "New Job", icon: Plus, highlight: true },
  { href: "/jobs", label: "Jobs", icon: Package },
  { href: "/drivers", label: "Drivers", icon: Truck },
  { href: "/customers", label: "Customers", icon: Building2 },
  { href: "/invoices", label: "Invoices", icon: FileText },
  { href: "/payroll", label: "Payroll", icon: DollarSign },
  { href: "/finances", label: "Finances", icon: BarChart2 },
];

export default function Layout({ children, currentPath }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link href="https://fonts.googleapis.com/css2?family=Barlow:wght@400;600;700;800&family=Source+Sans+3:wght@400;600&display=swap" rel="stylesheet" />
      <style>{`
        * { font-family: 'Source Sans 3', sans-serif; }
        h1,h2,h3,h4,h5,h6,.font-barlow { font-family: 'Barlow', sans-serif; }
        .me-sidebar { background: #060204; }
        .me-green { background: #0fa14a; }
        .me-green-text { color: #0fa14a; }
        .me-accent { background: linear-gradient(90deg,#0fa14a,#009549); }
        .me-nav-active { background: rgba(15,161,74,0.18); color: #0fa14a; }
        .me-nav-highlight { background: #0fa14a; color: #fff; }
        .me-nav-highlight:hover { background: #009549; }
        .me-nav-item { color: #b0b2b7; }
        .me-nav-item:hover { background: rgba(255,255,255,0.06); color: #fff; }
        body { background: #f4f4f2 !important; }
      `}</style>

      <div className="flex min-h-screen" style={{ background: "#f4f4f2" }}>
        {/* Sidebar */}
        <aside className={`fixed inset-y-0 left-0 z-40 w-56 me-sidebar flex flex-col transition-transform duration-200 ${open ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 lg:static lg:flex`}>
          {/* Green accent strip */}
          <div className="h-1 me-accent flex-shrink-0" />

          {/* Logo */}
          <div className="px-5 py-5 border-b flex-shrink-0" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 me-green rounded-lg flex items-center justify-center flex-shrink-0">
                <Truck className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-barlow font-bold text-white text-sm leading-tight tracking-wide" style={{ fontFamily: "Barlow, sans-serif" }}>MAHONEY EXPRESS</p>
                <p className="text-xs leading-tight" style={{ color: "#b0b2b7" }}>INC.</p>
              </div>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
            {NAV.map(item => {
              const Icon = item.icon;
              const active = currentPath === item.href;
              return (
                <a
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                    item.highlight
                      ? "me-nav-highlight"
                      : active
                        ? "me-nav-active"
                        : "me-nav-item"
                  }`}
                  style={{ fontFamily: "Barlow, sans-serif", fontWeight: 600 }}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {item.label}
                </a>
              );
            })}
          </nav>

          <div className="px-5 py-4 flex-shrink-0" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
            <p className="text-xs" style={{ color: "#b0b2b7" }}>© 2026 Mahoney Express, Inc.</p>
          </div>
        </aside>

        {/* Mobile overlay */}
        {open && <div className="fixed inset-0 z-30 bg-black/60 lg:hidden" onClick={() => setOpen(false)} />}

        {/* Main */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Mobile header */}
          <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-white border-b sticky top-0 z-20" style={{ borderColor: "rgba(0,0,0,0.1)" }}>
            <button onClick={() => setOpen(true)} className="p-1.5 hover:bg-gray-100 rounded-lg">
              <Menu className="w-5 h-5 text-gray-600" />
            </button>
            <div className="h-1 w-5 me-accent rounded-full" />
            <span className="font-bold text-gray-900 text-sm" style={{ fontFamily: "Barlow, sans-serif" }}>Mahoney Express</span>
          </header>
          <main className="flex-1">{children}</main>
        </div>
      </div>
    </>
  );
}
