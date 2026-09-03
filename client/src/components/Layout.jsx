import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { setToken, setStoredUser } from "../api";
import { onQueueChange, queueCount } from "../offline/sync";

export default function Layout({ user, children }) {
  const navigate = useNavigate();
  const [online, setOnline] = useState(navigator.onLine);
  const [pending, setPending] = useState(0);

  useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  useEffect(() => {
    queueCount().then(setPending);
    return onQueueChange(() => queueCount().then(setPending));
  }, []);

  function logout() {
    setToken(null);
    setStoredUser(null);
    navigate("/login");
  }

  return (
    <div className="layout">
      <header className="topbar">
        <div className="brand">Loan Manager</div>
        <div className="status-area">
          {!online && <span className="pill pill-offline">Offline</span>}
          {pending > 0 && <span className="pill pill-pending">{pending} pending sync</span>}
          <span className="user-name">{user?.name}</span>
          <button className="btn-link" onClick={logout}>Log out</button>
        </div>
      </header>
      <div className="body">
        <nav className="sidebar">
          <NavLink to="/" end className={({ isActive }) => (isActive ? "active" : "")}>Dashboard</NavLink>
          <NavLink to="/customers" className={({ isActive }) => (isActive ? "active" : "")}>Customers</NavLink>
          <NavLink to="/loans" className={({ isActive }) => (isActive ? "active" : "")}>Loans</NavLink>
          {user?.role === "admin" && (
            <NavLink to="/settings" className={({ isActive }) => (isActive ? "active" : "")}>Settings</NavLink>
          )}
        </nav>
        <main className="content">{children}</main>
      </div>
    </div>
  );
}
