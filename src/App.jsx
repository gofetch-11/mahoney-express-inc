import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { AuthProvider, useAuth } from '@/lib/AuthContext'
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
import SharePointItems from './pages/SharePointItems';
import DriverPortal from './pages/DriverPortal';
import Maintenance from './pages/Maintenance';
import PageNotFound from './lib/PageNotFound';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/Home" replace />} />
      <Route path="/Customers" element={<Customers />} />
      <Route path="/Dashboard" element={<Dashboard />} />
      <Route path="/DriverReport" element={<DriverReport />} />
      <Route path="/Drivers" element={<Drivers />} />
      <Route path="/Finances" element={<Finances />} />
      <Route path="/Home" element={<Home />} />
      <Route path="/Invoices" element={<Invoices />} />
      <Route path="/Jobs" element={<Jobs />} />
      <Route path="/Layout" element={<Layout />} />
      <Route path="/NewJob" element={<NewJob />} />
      <Route path="/Payroll" element={<Payroll />} />
      <Route path="/SharePointItems" element={<SharePointItems />} />
      <Route path="/DriverPortal" element={<DriverPortal />} />
      <Route path="/Maintenance" element={<Maintenance />} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App