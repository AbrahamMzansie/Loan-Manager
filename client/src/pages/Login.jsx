import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, setToken, setStoredUser } from "../api";
import { useToast } from "../components/Toast";

export default function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  async function submit(e) {
    e.preventDefault();
    if (loading) return;
    setError("");
    setLoading(true);
    try {
      const { token, user } = await api.login(email, password);
      setToken(token);
      setStoredUser(user);
      onLogin(user);
      toast(`Welcome back, ${user.name}.`);
      navigate("/");
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-screen">
      <form className="auth-card" onSubmit={submit}>
        <h1>Loan Manager</h1>
        <p className="muted">Sign in to manage customers and loans</p>
        {error && <div className="error-box">{error}</div>}
        <label>Email</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
        <label>Password</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <button type="submit" disabled={loading}>{loading && <span className="btn-spinner" />}{loading ? "Signing in..." : "Sign in"}</button>
        <p className="muted small">
          First time setting this up? <Link to="/setup">Create the admin account</Link>
        </p>
      </form>
    </div>
  );
}
