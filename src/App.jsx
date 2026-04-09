import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Customers from './pages/Customers';
import Dashboard from './pages/Dashboard';
import Drivers from './pages/Drivers';
import Finances from './pages/Finances';
import Home from './pages/Home';
import Invoices from './pages/Invoices';
import Jobs from './pages/Jobs';
import Layout from './pages/Layout';
import NewJob from './pages/NewJob';
import Payroll from './pages/Payroll';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/Home" replace />} />
        <Route path="/Customers" element={<Customers />} />
        <Route path="/Dashboard" element={<Dashboard />} />
        <Route path="/Drivers" element={<Drivers />} />
        <Route path="/Finances" element={<Finances />} />
        <Route path="/Home" element={<Home />} />
        <Route path="/Invoices" element={<Invoices />} />
        <Route path="/Jobs" element={<Jobs />} />
        <Route path="/Layout" element={<Layout />} />
        <Route path="/NewJob" element={<NewJob />} />
        <Route path="/Payroll" element={<Payroll />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
