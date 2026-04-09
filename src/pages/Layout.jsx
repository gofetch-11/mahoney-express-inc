import { useState } from "react";
import { 
  LayoutDashboard, Package, Truck, Users, Building2, 
  FileText, DollarSign, BarChart2, Menu, X, Plus
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
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-56 bg-gray-900 text-white flex flex-col transition-transform duration-200 ${open ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 lg:static lg:flex`}>
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
              <Truck className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="font-black text-sm leading-tight">MAHONEY</p>
              <p className="text-xs text-gray-400 leading-tight">EXPRESS, INC.</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {NAV.map(item => {
            const Icon = item.icon;
            const active = currentPath === item.href;
            return (
              <a key={item.href} href={item.href} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                item.highlight 
                  ? "bg-red-600 text-white hover:bg-red-500" 
                  : active 
                    ? "bg-gray-700 text-white" 
                    : "text-gray-400 hover:bg-gray-800 hover:text-white"
              }`}>
                <Icon className="w-4 h-4 flex-shrink-0" />
                {item.label}
              </a>
            );
          })}
        </nav>
        <div className="p-4 border-t border-gray-700">
          <p className="text-xs text-gray-500">© 2026 Mahoney Express</p>
        </div>
      </aside>

      {/* Mobile overlay */}
      {open && <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setOpen(false)} />}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="lg:hidden flex items-center gap-3 p-4 bg-white border-b border-gray-200 sticky top-0 z-20">
          <button onClick={() => setOpen(true)} className="p-1.5 hover:bg-gray-100 rounded-lg">
            <Menu className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-red-600 rounded flex items-center justify-center">
              <Truck className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-gray-900 text-sm">Mahoney Express</span>
          </div>
        </header>
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
