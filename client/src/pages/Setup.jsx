import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, setToken, setStoredUser } from "../api";

export default function Setup({ onLogin }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function submit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { token, user } = await api.registerFirstAdmin(name, email, password);
      setToken(token);
      setStoredUser(user);
      onLogin(user);
      navigate("/");
    } catch (err) {
      setError(err.message || "Setup failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-screen">
      <form className="auth-card" onSubmit={submit}>
        <h1>Create admin account</h1>
        <p className="muted">
          This only works once, before any account exists (or while ALLOW_FIRST_ADMIN_SETUP=true on the server).
        </p>
        {error && <div className="error-box">{error}</div>}
        <label>Your name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
        <label>Email</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <label>Password</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
        <button type="submit" disabled={loading}>{loading ? "Creating..." : "Create account"}</button>
        <p className="muted small"><Link to="/login">Back to login</Link></p>
      </form>
    </div>
  );
}
