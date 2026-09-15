import { useEffect, useState } from "react";
import { api } from "../api";
import { useToast } from "../components/Toast";
import PageLoader from "../components/PageLoader";

const MAX_LOGO_BYTES = 300 * 1024;

export default function Settings({ user, onUpdateUser }) {
  const [settings, setSettings] = useState(null);
  const [mine, setMine] = useState({ defaultRate: "", defaultPeriodDays: "" });
  const [myInvoice, setMyInvoice] = useState({
    companyName: "",
    logo: "",
    bankAccountHolder: "",
    bankAccountNumber: "",
    bankName: "",
    branchCode: "",
  });
  const [myWorkspace, setMyWorkspace] = useState({ loansEnabled: true, invoicesEnabled: true });
  const [users, setUsers] = useState([]);
  const [newUser, setNewUser] = useState({ name: "", email: "", password: "", role: "staff" });
  const [error, setError] = useState("");
  const [savingSettings, setSavingSettings] = useState(false);
  const [savingMine, setSavingMine] = useState(false);
  const [savingInvoice, setSavingInvoice] = useState(false);
  const [savingWorkspace, setSavingWorkspace] = useState(false);
  const [addingUser, setAddingUser] = useState(false);
  const toast = useToast();

  function load() {
    api.getSettings().then((s) => {
      setSettings(s);
      setMine({
        defaultRate: s.myDefaultRate != null ? s.myDefaultRate * 100 : "",
        defaultPeriodDays: s.myDefaultPeriodDays != null ? s.myDefaultPeriodDays : "",
      });
      setMyInvoice({
        companyName: s.myInvoiceCompanyName || "",
        logo: s.myInvoiceLogo || "",
        bankAccountHolder: s.myInvoiceBankAccountHolder || "",
        bankAccountNumber: s.myInvoiceBankAccountNumber || "",
        bankName: s.myInvoiceBankName || "",
        branchCode: s.myInvoiceBranchCode || "",
      });
      setMyWorkspace({
        loansEnabled: s.myLoansEnabled !== false,
        invoicesEnabled: s.myInvoicesEnabled !== false,
      });
    });
    if (user.role === "admin") api.listUsers().then(setUsers).catch(() => {});
  }

  useEffect(() => { load(); }, []);

  async function saveSettings(e) {
    e.preventDefault();
    if (savingSettings) return;
    setError("");
    setSavingSettings(true);
    try {
      await api.updateSettings({
        businessName: settings.businessName,
        defaultRate: Number(settings.defaultRate),
        defaultPeriodDays: Number(settings.defaultPeriodDays),
      });
      toast("Business settings saved.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingSettings(false);
    }
  }

  async function saveMySettings(e) {
    e.preventDefault();
    if (savingMine) return;
    setError("");
    setSavingMine(true);
    try {
      await api.updateMySettings({
        defaultRate: mine.defaultRate === "" ? null : Number(mine.defaultRate) / 100,
        defaultPeriodDays: mine.defaultPeriodDays === "" ? null : Number(mine.defaultPeriodDays),
      });
      toast("Your defaults were saved.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingMine(false);
    }
  }

  function onLogoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_LOGO_BYTES) {
      setError(`Logo image is too large (max ${Math.round(MAX_LOGO_BYTES / 1024)}KB). Try a smaller/compressed image.`);
      return;
    }
    setError("");
    const reader = new FileReader();
    reader.onload = () => setMyInvoice({ ...myInvoice, logo: reader.result });
    reader.readAsDataURL(file);
  }

  async function saveMyInvoiceProfile(e) {
    e.preventDefault();
    if (savingInvoice) return;
    setError("");
    setSavingInvoice(true);
    try {
      await api.updateMySettings({
        invoiceCompanyName: myInvoice.companyName || null,
        invoiceLogo: myInvoice.logo || null,
        invoiceBankAccountHolder: myInvoice.bankAccountHolder || null,
        invoiceBankAccountNumber: myInvoice.bankAccountNumber || null,
        invoiceBankName: myInvoice.bankName || null,
        invoiceBranchCode: myInvoice.branchCode || null,
      });
      toast("Your invoice profile was saved.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingInvoice(false);
    }
  }

  async function saveMyWorkspace(e) {
    e.preventDefault();
    if (savingWorkspace) return;
    setError("");
    setSavingWorkspace(true);
    try {
      await api.updateMySettings({
        loansEnabled: myWorkspace.loansEnabled,
        invoicesEnabled: myWorkspace.invoicesEnabled,
      });
      onUpdateUser?.({ loansEnabled: myWorkspace.loansEnabled, invoicesEnabled: myWorkspace.invoicesEnabled });
      toast("Your workspace was updated.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingWorkspace(false);
    }
  }

  async function toggleStaffFeature(staffId, field, value) {
    setError("");
    setUsers((list) => list.map((u) => (u.id === staffId ? { ...u, [field]: value } : u)));
    try {
      await api.updateUser(staffId, { [field]: value });
    } catch (err) {
      setError(err.message);
      load(); // revert the optimistic update
    }
  }

  async function addUser(e) {
    e.preventDefault();
    if (addingUser) return;
    setError("");
    setAddingUser(true);
    try {
      await api.createUser(newUser);
      setNewUser({ name: "", email: "", password: "", role: "staff" });
      toast("Staff member added.");
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setAddingUser(false);
    }
  }

  if (!settings) return <PageLoader />;

  return (
    <div>
      <h1>Settings</h1>
      {error && <div className="error-box">{error}</div>}

      <h2>My workspace</h2>
      <p className="muted">Choose which sections you see in the sidebar. Doesn't affect anyone else.</p>
      <form className="card" onSubmit={saveMyWorkspace}>
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 400 }}>
          <input
            type="checkbox"
            checked={myWorkspace.loansEnabled}
            onChange={(e) => setMyWorkspace({ ...myWorkspace, loansEnabled: e.target.checked })}
          />
          Show Loans
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 400, marginTop: 8 }}>
          <input
            type="checkbox"
            checked={myWorkspace.invoicesEnabled}
            onChange={(e) => setMyWorkspace({ ...myWorkspace, invoicesEnabled: e.target.checked })}
          />
          Show Invoices
        </label>
        <div style={{ marginTop: 14 }}>
          <button type="submit" disabled={savingWorkspace}>{savingWorkspace && <span className="btn-spinner" />}{savingWorkspace ? "Saving..." : "Save workspace"}</button>
        </div>
      </form>

      <h2>My default loan terms</h2>
      <p className="muted">
        Used for new loans you create. Leave blank to use the business default
        ({(settings.defaultRate * 100).toFixed(0)}% / {settings.defaultPeriodDays} days).
      </p>
      <form className="card form-grid" onSubmit={saveMySettings}>
        <div>
          <label>My default interest rate (%)</label>
          <input
            type="number"
            step="0.1"
            placeholder={(settings.defaultRate * 100).toFixed(0)}
            value={mine.defaultRate}
            onChange={(e) => setMine({ ...mine, defaultRate: e.target.value })}
          />
        </div>
        <div>
          <label>My default period (days)</label>
          <input
            type="number"
            placeholder={settings.defaultPeriodDays}
            value={mine.defaultPeriodDays}
            onChange={(e) => setMine({ ...mine, defaultPeriodDays: e.target.value })}
          />
        </div>
        <div className="span-2">
          <button type="submit" disabled={savingMine}>{savingMine && <span className="btn-spinner" />}{savingMine ? "Saving..." : "Save my defaults"}</button>
        </div>
      </form>

      <h2>My invoice profile</h2>
      <p className="muted">
        Shown on invoices you create (Invoices section) — a separate business identity from the lending business above.
      </p>
      <form className="card form-grid" onSubmit={saveMyInvoiceProfile}>
        <div className="span-2">
          <label>Company name</label>
          <input
            value={myInvoice.companyName}
            onChange={(e) => setMyInvoice({ ...myInvoice, companyName: e.target.value })}
            placeholder="e.g. Owen Transport Services (OTS)"
          />
        </div>
        <div className="span-2">
          <label>Logo</label>
          <input type="file" accept="image/png,image/jpeg" onChange={onLogoChange} />
          {myInvoice.logo && (
            <div style={{ marginTop: 8 }}>
              <img src={myInvoice.logo} alt="Logo preview" style={{ maxHeight: 60, maxWidth: 200 }} />{" "}
              <button type="button" className="btn-secondary" onClick={() => setMyInvoice({ ...myInvoice, logo: "" })}>Remove</button>
            </div>
          )}
        </div>
        <div>
          <label>Account holder</label>
          <input value={myInvoice.bankAccountHolder} onChange={(e) => setMyInvoice({ ...myInvoice, bankAccountHolder: e.target.value })} />
        </div>
        <div>
          <label>Account number</label>
          <input value={myInvoice.bankAccountNumber} onChange={(e) => setMyInvoice({ ...myInvoice, bankAccountNumber: e.target.value })} />
        </div>
        <div>
          <label>Bank name</label>
          <input value={myInvoice.bankName} onChange={(e) => setMyInvoice({ ...myInvoice, bankName: e.target.value })} />
        </div>
        <div>
          <label>Branch code</label>
          <input value={myInvoice.branchCode} onChange={(e) => setMyInvoice({ ...myInvoice, branchCode: e.target.value })} />
        </div>
        <div className="span-2">
          <button type="submit" disabled={savingInvoice}>{savingInvoice && <span className="btn-spinner" />}{savingInvoice ? "Saving..." : "Save invoice profile"}</button>
        </div>
      </form>

      {user.role === "admin" && (
        <>
          <h2>Business default loan terms</h2>
          <p className="muted">Used for any staff member who hasn't set their own defaults above.</p>
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
            <div className="span-2">
              <button type="submit" disabled={savingSettings}>{savingSettings && <span className="btn-spinner" />}{savingSettings ? "Saving..." : "Save settings"}</button>
            </div>
          </form>

          <h2>Staff accounts</h2>
          <p className="muted">Toggle which sections each staff member sees. They'll need to log back in for it to take effect if they're already signed in.</p>
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Loans</th><th>Invoices</th></tr></thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>{u.name}</td>
                    <td>{u.email}</td>
                    <td>{u.role}</td>
                    <td>
                      <input
                        type="checkbox"
                        checked={u.loansEnabled !== false}
                        onChange={(e) => toggleStaffFeature(u.id, "loansEnabled", e.target.checked)}
                      />
                    </td>
                    <td>
                      <input
                        type="checkbox"
                        checked={u.invoicesEnabled !== false}
                        onChange={(e) => toggleStaffFeature(u.id, "invoicesEnabled", e.target.checked)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

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
            <div className="span-2">
              <button type="submit" disabled={addingUser}>{addingUser && <span className="btn-spinner" />}{addingUser ? "Adding..." : "Add staff member"}</button>
            </div>
          </form>
        </>
      )}
    </div>
  );
}
