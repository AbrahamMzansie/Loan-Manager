import { useEffect, useState } from "react";
import { api } from "../api";

export default function Settings({ user }) {
  const [settings, setSettings] = useState(null);
  const [users, setUsers] = useState([]);
  const [newUser, setNewUser] = useState({ name: "", email: "", password: "", role: "staff" });
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  function load() {
    api.getSettings().then(setSettings);
    if (user.role === "admin") api.listUsers().then(setUsers).catch(() => {});
  }

  useEffect(() => { load(); }, []);

  async function saveSettings(e) {
    e.preventDefault();
    setError("");
    setSaved(false);
    try {
      await api.updateSettings({
        businessName: settings.businessName,
        defaultRate: Number(settings.defaultRate),
        defaultPeriodDays: Number(settings.defaultPeriodDays),
      });
      setSaved(true);
    } catch (err) {
      setError(err.message);
    }
  }

  async function addUser(e) {
    e.preventDefault();
    setError("");
    try {
      await api.createUser(newUser);
      setNewUser({ name: "", email: "", password: "", role: "staff" });
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  if (!settings) return <p>Loading...</p>;

  return (
    <div>
      <h1>Settings</h1>
      {error && <div className="error-box">{error}</div>}
      {saved && <div className="info-box">Settings saved.</div>}

      <h2>Default loan terms</h2>
      <p className="muted">These apply to new loans unless you override them per loan.</p>
      <form className="card form-grid" onSubmit={saveSettings}>
        <div className="span-2">
          <label>Business name</label>
          <input value={settings.businessName} onChange={(e) => setSettings({ ...settings, businessName: e.target.value })} />
        </div>
        <div>
          <label>Default interest rate (%)</label>
          <input type="number" step="0.1" value={settings.defaultRate * 100} onChange={(e) => setSettings({ ...settings, defaultRate: Number(e.target.value) / 100 })} />
        </div>
        <div>
          <label>Default period (days)</label>
          <input type="number" value={settings.defaultPeriodDays} onChange={(e) => setSettings({ ...settings, defaultPeriodDays: Number(e.target.value) })} />
        </div>
        <div className="span-2"><button type="submit">Save settings</button></div>
      </form>

      <h2>Staff accounts</h2>
      <table className="table">
        <thead><tr><th>Name</th><th>Email</th><th>Role</th></tr></thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}><td>{u.name}</td><td>{u.email}</td><td>{u.role}</td></tr>
          ))}
        </tbody>
      </table>

      <form className="card form-grid" onSubmit={addUser}>
        <div><label>Name</label><input required value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} /></div>
        <div><label>Email</label><input required type="email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} /></div>
        <div><label>Temporary password</label><input required type="text" minLength={6} value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} /></div>
        <div>
          <label>Role</label>
          <select value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}>
            <option value="staff">Staff</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <div className="span-2"><button type="submit">Add staff member</button></div>
      </form>
    </div>
  );
}
