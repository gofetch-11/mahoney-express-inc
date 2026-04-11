import { useState } from "react";
import {
  LayoutDashboard, Package, Truck, Users, Building2,
  FileText, DollarSign, BarChart2, Menu, Plus, ClipboardList, Smartphone, Wrench, Radio, Activity
} from "lucide-react";

const LOGO = "https://media.base44.com/images/public/69cb07fb94b4627f0bd76151/a863be72e_MahoneyExpressInc-Header.png";
const CITY_LOGO = "https://media.base44.com/images/public/69cb07fb94b4627f0bd76151/b87197ae9_MahoneyExpressInc-CityLogo4.png";

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/new-job", label: "New Job", icon: Plus, highlight: true },
  { href: "/jobs", label: "Jobs", icon: Package },
  { href: "/drivers", label: "Drivers", icon: Truck },
  { href: "/customers", label: "Customers", icon: Building2 },
  { href: "/invoices", label: "Invoices", icon: FileText },
  { href: "/payroll", label: "Payroll", icon: DollarSign },
  { href: "/finances", label: "Finances", icon: BarChart2 },
  { href: "/driver-report", label: "Driver Report", icon: ClipboardList },
  { href: "/DriverPortal", label: "Driver Portal", icon: Smartphone },
  { href: "/VehicleMaintenance", label: "Maintenance", icon: Wrench },
  { href: "/LiveDispatch", label: "Live Map", icon: Radio },
  { href: "/DriverAnalytics", label: "Efficiency", icon: Activity },
];

export default function Layout({ children, currentPath }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link href="https://fonts.googleapis.com/css2?family=Barlow:wght@400;600;700;800&family=Source+Sans+3:wght@400;600&display=swap" rel="stylesheet" />
      <style>{`
        * { font-family: 'Source Sans 3', sans-serif; box-sizing: border-box; }
        h1,h2,h3,h4,h5,.font-barlow { font-family: 'Barlow', sans-serif; }
        body { background: #0e1012 !important; margin: 0; }
        .me-sidebar { background: #060204; }
        .nav-active { background: rgba(15,161,74,0.15); color: #0fa14a !important; border-left: 3px solid #0fa14a; }
        .nav-highlight { background: #0fa14a; color: #fff !important; border-radius: 10px; border-left: none !important; }
        .nav-highlight:hover { background: #009549; }
        .nav-item { color: #8a8a85; border-left: 3px solid transparent; }
        .nav-item:hover { background: rgba(255,255,255,0.05); color: #fff !important; }
        a { text-decoration: none; }
        select option { background: #1e2328; color: #f0f0ee; }
      `}</style>

      <div style={{ display: "flex", minHeight: "100vh", background: "#0e1012" }}>

        {/* Sidebar */}
        <aside className="me-sidebar" style={{
          width: 224, display: "flex", flexDirection: "column", flexShrink: 0,
          position: "fixed", top: 0, left: 0, bottom: 0, zIndex: 40,
          overflowY: "auto", transition: "transform 0.2s",
        }}>
          {/* Green top strip */}
          <div style={{ height: 4, background: "linear-gradient(90deg,#0fa14a,#009549)", flexShrink: 0 }} />

          {/* Logo */}
          <div style={{ padding: "16px 16px 14px", borderBottom: "1px solid rgba(255,255,255,0.07)", flexShrink: 0 }}>
            <img src={LOGO} alt="Mahoney Express" style={{ width: "100%", maxWidth: 188, height: "auto", display: "block" }} />
          </div>

          {/* Nav */}
          <nav style={{ flex: 1, padding: "12px 10px", display: "flex", flexDirection: "column", gap: 2 }}>
            {NAV.map(item => {
              const Icon = item.icon;
              const active = currentPath === item.href;
              return (
                <a key={item.href} href={item.href}
                  className={item.highlight ? "nav-highlight" : active ? "nav-active" : "nav-item"}
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "9px 12px",
                    borderRadius: item.highlight ? 10 : 0,
                    fontSize: 13, fontWeight: 600,
                    transition: "all 0.15s",
                    fontFamily: "Barlow, sans-serif",
                    marginBottom: item.highlight ? 4 : 0,
                  }}>
                  <Icon size={15} style={{ flexShrink: 0 }} />
                  {item.label}
                </a>
              );
            })}
          </nav>

          {/* Bottom */}
          <div style={{ padding: "10px 14px 16px", borderTop: "1px solid rgba(255,255,255,0.07)", flexShrink: 0 }}>
            <img src={CITY_LOGO} alt="" style={{ width: "100%", opacity: 0.35, display: "block", marginBottom: 6 }} />
            <p style={{ color: "#3a3a3a", fontSize: 10, margin: 0, fontFamily: "Barlow, sans-serif", letterSpacing: "0.04em" }}>
              1615 N Newland Ave · Chicago IL
            </p>
          </div>
        </aside>

        {/* Mobile overlay */}
        {open && <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 30 }} />}

        {/* Main */}
        <div style={{ flex: 1, marginLeft: 224, display: "flex", flexDirection: "column", minWidth: 0 }}>
          {/* Mobile header */}
          <header style={{ display: "none", alignItems: "center", gap: 12, padding: "10px 16px", background: "#060204", position: "sticky", top: 0, zIndex: 20, borderBottom: "1px solid rgba(255,255,255,0.07)" }} className="mobile-header">
            <button onClick={() => setOpen(true)} style={{ color: "#fff", background: "none", border: "none", cursor: "pointer", padding: 4 }}>
              <Menu size={22} />
            </button>
            <img src={LOGO} alt="Mahoney Express" style={{ height: 28, width: "auto" }} />
          </header>

          <style>{`
            @media (max-width: 768px) {
              .mobile-header { display: flex !important; }
              aside { transform: ${open ? "translateX(0)" : "translateX(-100%)"}; }
              div[style*="marginLeft: 224"] { margin-left: 0 !important; }
            }
          `}</style>

          <main style={{ flex: 1 }}>{children}</main>
        </div>
      </div>
    </>
  );
}