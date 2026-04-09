import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Dashboard from './pages/Dashboard';
import Home from './pages/Home';
import NewJob from './pages/NewJob';
import Jobs from './pages/Jobs';
import Drivers from './pages/Drivers';
import Customers from './pages/Customers';
import Invoices from './pages/Invoices';
import Payroll from './pages/Payroll';
import Finances from './pages/Finances';
import Layout from './pages/Layout';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/Home" replace />} />
        <Route path="/Dashboard" element={<Dashboard />} />
        <Route path="/Home" element={<Home />} />
        <Route path="/NewJob" element={<NewJob />} />
        <Route path="/Jobs" element={<Jobs />} />
        <Route path="/Drivers" element={<Drivers />} />
        <Route path="/Customers" element={<Customers />} />
        <Route path="/Invoices" element={<Invoices />} />
        <Route path="/Payroll" element={<Payroll />} />
        <Route path="/Finances" element={<Finances />} />
        <Route path="/Layout" element={<Layout />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
