import { useState } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Setup from "./pages/Setup";
import Dashboard from "./pages/Dashboard";
import Customers from "./pages/Customers";
import CustomerDetail from "./pages/CustomerDetail";
import Loans from "./pages/Loans";
import LoanDetail from "./pages/LoanDetail";
import Invoice from "./pages/Invoice";
import Invoices from "./pages/Invoices";
import InvoiceDetail from "./pages/InvoiceDetail";
import PublicInvoice from "./pages/PublicInvoice";
import PublicLoanStatement from "./pages/PublicLoanStatement";
import Settings from "./pages/Settings";
import { getStoredUser, setStoredUser } from "./api";

function PrivateRoute({ user, children }) {
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

// A feature-gated route: if the user has this section hidden (see Settings
// > "My workspace"), send them home instead of showing it. `!== false`
// defaults to shown for older cached sessions that predate this field.
function FeatureRoute({ user, enabled, children }) {
  if (!user) return <Navigate to="/login" replace />;
  if (enabled === false) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  const [user, setUser] = useState(getStoredUser());
  const location = useLocation();

  function updateUser(patch) {
    setUser((u) => {
      const updated = { ...u, ...patch };
      setStoredUser(updated);
      return updated;
    });
  }

  // Reachable with or without being logged in - a customer opening one of
  // these links (e.g. from WhatsApp) is never a logged-in app user.
  if (location.pathname.startsWith("/invoice/public/") || location.pathname.startsWith("/statement/public/")) {
    return (
      <Routes>
        <Route path="/invoice/public/:token" element={<PublicInvoice />} />
        <Route path="/statement/public/:token" element={<PublicLoanStatement />} />
      </Routes>
    );
  }

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
        <Route path="/customers/:id" element={<PrivateRoute user={user}><CustomerDetail user={user} /></PrivateRoute>} />
        <Route path="/loans" element={<FeatureRoute user={user} enabled={user.loansEnabled}><Loans /></FeatureRoute>} />
        <Route path="/loans/:id" element={<FeatureRoute user={user} enabled={user.loansEnabled}><LoanDetail /></FeatureRoute>} />
        <Route path="/loans/:id/invoice" element={<FeatureRoute user={user} enabled={user.loansEnabled}><Invoice /></FeatureRoute>} />
        <Route path="/invoices" element={<FeatureRoute user={user} enabled={user.invoicesEnabled}><Invoices /></FeatureRoute>} />
        <Route path="/invoices/:id" element={<FeatureRoute user={user} enabled={user.invoicesEnabled}><InvoiceDetail /></FeatureRoute>} />
        <Route path="/settings" element={<PrivateRoute user={user}><Settings user={user} onUpdateUser={updateUser} /></PrivateRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}
