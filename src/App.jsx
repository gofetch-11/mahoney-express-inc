import { BrowserRouter as Router, Routes, Route, Outlet, useLocation } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { AuthProvider } from '@/lib/AuthContext'
import UserNotRegisteredError from '@/components/UserNotRegisteredError'

import Customers from './pages/Customers';
import Dashboard from './pages/Dashboard';
import DriverReport from './pages/DriverReport';
import Drivers from './pages/Drivers';
import Finances from './pages/Finances';
import Home from './pages/Home';
import Invoices from './pages/Invoices';
import Jobs from './pages/Jobs';
import Layout from './pages/Layout';
import NewJob from './pages/NewJob';
import Payroll from './pages/Payroll';
import DriverPortal from './pages/DriverPortal';
import VehicleMaintenance from './pages/VehicleMaintenance';
import LiveDispatch from './pages/LiveDispatch';
import DriverAnalytics from './pages/DriverAnalytics';
import CustomerPortal from './pages/CustomerPortal';
import PageNotFound from './lib/PageNotFound';

function AppLayout() {
  const location = useLocation();
  return (
    <Layout currentPath={location.pathname}>
      <Outlet />
    </Layout>
  );
}

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <Routes>
            {/* Public portals - no layout */}
            <Route path="/DriverPortal" element={<DriverPortal />} />
            <Route path="/CustomerPortal" element={<CustomerPortal />} />

            {/* Main app with sidebar layout */}
            <Route element={<AppLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/jobs" element={<Jobs />} />
              <Route path="/new-job" element={<NewJob />} />
              <Route path="/drivers" element={<Drivers />} />
              <Route path="/customers" element={<Customers />} />
              <Route path="/invoices" element={<Invoices />} />
              <Route path="/payroll" element={<Payroll />} />
              <Route path="/finances" element={<Finances />} />
              <Route path="/driver-report" element={<DriverReport />} />
              <Route path="/VehicleMaintenance" element={<VehicleMaintenance />} />
              <Route path="/LiveDispatch" element={<LiveDispatch />} />
              <Route path="/DriverAnalytics" element={<DriverAnalytics />} />
              <Route path="/Dashboard" element={<Dashboard />} />
              <Route path="*" element={<PageNotFound />} />
            </Route>
          </Routes>
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App