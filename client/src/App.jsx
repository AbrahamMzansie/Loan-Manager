import { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Setup from "./pages/Setup";
import Dashboard from "./pages/Dashboard";
import Customers from "./pages/Customers";
import CustomerDetail from "./pages/CustomerDetail";
import Loans from "./pages/Loans";
import LoanDetail from "./pages/LoanDetail";
import Invoice from "./pages/Invoice";
import Settings from "./pages/Settings";
import { getStoredUser } from "./api";

function PrivateRoute({ user, children }) {
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  const [user, setUser] = useState(getStoredUser());

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login onLogin={setUser} />} />
        <Route path="/setup" element={<Setup onLogin={setUser} />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <Layout user={user} onLogout={() => setUser(null)}>
      <Routes>
        <Route path="/" element={<PrivateRoute user={user}><Dashboard /></PrivateRoute>} />
        <Route path="/customers" element={<PrivateRoute user={user}><Customers /></PrivateRoute>} />
        <Route path="/customers/:id" element={<PrivateRoute user={user}><CustomerDetail /></PrivateRoute>} />
        <Route path="/loans" element={<PrivateRoute user={user}><Loans /></PrivateRoute>} />
        <Route path="/loans/:id" element={<PrivateRoute user={user}><LoanDetail /></PrivateRoute>} />
        <Route path="/loans/:id/invoice" element={<PrivateRoute user={user}><Invoice /></PrivateRoute>} />
        <Route path="/settings" element={<PrivateRoute user={user}><Settings user={user} /></PrivateRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}
