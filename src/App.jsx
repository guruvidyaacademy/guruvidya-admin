import { useEffect, useMemo, useState } from "react";
import axios from "axios";

const api = axios.create({ baseURL: "https://guruvidya-backend.onrender.com/api" });

const USERS = [
  { email: "admin@guruvidya.in", password: "Guru@12345", role: "Super Admin", access: ["leads","admissions","appointments","support","faculty","alerts"] },
  { email: "counselor@guruvidya.in", password: "Counselor@123", role: "Counselor", access: ["leads","admissions","appointments"] },
  { email: "reception@guruvidya.in", password: "Reception@123", role: "Reception", access: ["appointments","support","leads"] }
];

const allTabs = [
  { key: "leads", label: "Leads" },
  { key: "admissions", label: "Admissions" },
  { key: "appointments", label: "Appointments" },
  { key: "support", label: "Support" },
  { key: "faculty", label: "Faculty" },
  { key: "alerts", label: "Alerts" }
];

const statusOptions = {
  leads: ["new", "contacted", "follow_up", "converted", "closed"],
  admissions: ["new", "documents_pending", "fee_pending", "converted", "closed"],
  appointments: ["requested", "confirmed", "on_the_way", "arrived", "completed", "cancelled"],
  support: ["new", "in_progress", "tech_review", "resolved", "closed"],
  faculty: ["new", "demo_pending", "interview_scheduled", "selected", "rejected", "hold"]
};

function Login({ onLogin }) {
  const [email, setEmail] = useState("admin@guruvidya.in");
  const [password, setPassword] = useState("Guru@12345");
  const [error, setError] = useState("");

  const submit = (e) => {
    e.preventDefault();
    const user = USERS.find(u => u.email === email.trim() && u.password === password);
    if (!user) return setError("Wrong email or password");
    localStorage.setItem("guruvidya_user", JSON.stringify(user));
    onLogin(user);
  };

  return (
    <div className="loginPage">
      <form className="loginCard" onSubmit={submit}>
        <div className="logoText">Guruvidya CRM</div>
        <div className="notice">Secure admin login</div>
        <label className="small">Email</label>
        <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
        <label className="small">Password</label>
        <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        {error && <div style={{color:"#b91c1c",marginBottom:12}}>{error}</div>}
        <button className="btn" style={{width:"100%"}}>Login</button>
        <div className="small" style={{marginTop:14}}>Demo: admin@guruvidya.in / Guru@12345</div>
      </form>
    </div>
  );
}

function Kpi({ title, value }) {
  return <div className="card stats-card"><div className="small">{title}</div><div className="big">{value}</div></div>;
}

function ActionPanel({ tab, row, onSaved }) {
  const [action, setAction] = useState("");
  const [owner, setOwner] = useState("");
  const [note, setNote] = useState("");
  const [sendNotification, setSendNotification] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    setAction(row?.status || "");
    setOwner(row?.owner || "");
    setNote(row?.note || row?.admin_note || "");
    setSendNotification(false);
    setMsg("");
  }, [row, tab]);

  if (!row) return <div className="card">Select a row to update status, owner, notes, or send notification.</div>;

  const save = async () => {
    try {
      const res = await api.post(`/admin/${tab}/${row.id}/action`, { action, owner, note, sendNotification });
      setMsg(res.data.message || "Updated");
      onSaved?.();
    } catch {
      setMsg("Backend action endpoint not active yet. Data view is working.");
    }
  };

  return (
    <div className="card">
      <div className="row"><h3 style={{ margin: 0 }}>Action Panel</h3><span className="tag">ID: {row.id}</span></div>
      <div className="actions" style={{ marginTop: 12 }}>
        <div>
          <label className="small">Status</label>
          <select value={action} onChange={(e) => setAction(e.target.value)}>
            {(statusOptions[tab] || [row.status || "new"]).map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div><label className="small">Owner</label><input value={owner} onChange={(e) => setOwner(e.target.value)} placeholder="Reception / Counselor / Admin" /></div>
        <div><label className="small">Note</label><textarea rows="6" value={note} onChange={(e) => setNote(e.target.value)} /></div>
        <label className="small" style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input type="checkbox" checked={sendNotification} onChange={(e) => setSendNotification(e.target.checked)} style={{ width: "auto" }} />
          Send notification
        </label>
        <button className="btn btn3" onClick={save}>Save Action</button>
        {msg && <div className="notice">{msg}</div>}
      </div>
    </div>
  );
}

function DataTable({ tab, rows, selectedId, onSelect }) {
  if (!rows.length) return <div className="card">No data found</div>;
  const headersMap = {
    leads: ["id","name","mobile","course","status","owner","note","created_at"],
    admissions: ["id","name","mobile","email","course","status","owner","admin_note","created_at"],
    appointments: ["id","name","mobile","course","datetime","status","owner","note","created_at"],
    support: ["id","name","mobile","issue","description","status","owner","note","created_at"],
    faculty: ["id","name","mobile","course","mode","status","owner","admin_note","created_at"],
    alerts: ["id","type","title","payload","created_at"]
  };
  const headers = headersMap[tab] || Object.keys(rows[0]);
  return (
    <div className="card" style={{ overflowX: "auto" }}>
      <table className="table">
        <thead><tr>{headers.map((h) => <th key={h}>{h}</th>)}</tr></thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} onClick={() => onSelect(row)} style={{ background: selectedId === row.id ? "#eef2ff" : "transparent", cursor: "pointer" }}>
              {headers.map((h) => <td key={h}>{h === "payload" ? JSON.stringify(row[h]) : String(row[h] ?? "")}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("guruvidya_user")); } catch { return null; }
  });
  const [activeTab, setActiveTab] = useState("leads");
  const [data, setData] = useState({ leads: [], admissions: [], appointments: [], support: [], faculty: [], alerts: [] });
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  const tabs = user ? allTabs.filter(t => user.access.includes(t.key)) : [];

  const logout = () => {
    localStorage.removeItem("guruvidya_user");
    setUser(null);
  };

  const loadAll = async () => {
    setError("");
    try {
      const [leads, admissions, appointments, support, faculty, alerts] = await Promise.all([
        api.get("/admin/leads"),
        api.get("/admin/admissions"),
        api.get("/admin/appointments"),
        api.get("/admin/support"),
        api.get("/admin/faculty"),
        api.get("/admin/alerts")
      ]);
      setData({
        leads: leads.data.data || [],
        admissions: admissions.data.data || [],
        appointments: appointments.data.data || [],
        support: support.data.data || [],
        faculty: faculty.data.data || [],
        alerts: alerts.data.data || []
      });
    } catch {
      setError("Backend data load failed. Wait if Render is waking up, then refresh.");
    }
  };

  useEffect(() => { if (user) loadAll(); }, [user]);

  useEffect(() => {
    if (user && !user.access.includes(activeTab)) setActiveTab(user.access[0]);
    setSelected(null);
    setQuery("");
  }, [activeTab, user]);

  const filteredRows = useMemo(() => {
    const rows = data[activeTab] || [];
    if (!query.trim()) return rows;
    const q = query.toLowerCase();
    return rows.filter((row) => JSON.stringify(row).toLowerCase().includes(q));
  }, [data, activeTab, query]);

  if (!user) return <Login onLogin={setUser} />;

  return (
    <div>
      <div className="top">
        <div className="row">
          <div>
            <h2 style={{ margin: 0 }}>Guruvidya Full CRM Admin</h2>
            <div className="notice">Logged in: {user.email} · Role: {user.role}</div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn btn4" onClick={loadAll}>Refresh All</button>
            <button className="btn btn2" onClick={logout}>Logout</button>
          </div>
        </div>
      </div>

      <div className="wrap">
        <div className="kpis">
          {tabs.map(t => <Kpi key={t.key} title={t.label} value={(data[t.key] || []).length} />)}
        </div>

        {error && <div className="card" style={{ color: "#991b1b", marginBottom: 16 }}>{error}</div>}

        <div className="tabs">
          {tabs.map((t) => (
            <button key={t.key} onClick={() => setActiveTab(t.key)} className={activeTab === t.key ? "btn" : "btn btn2"}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="searchBar">
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={`Search ${activeTab} by any field`} />
          <div className="card small" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
            Rows: {filteredRows.length}
          </div>
        </div>

        <div className="grid2">
          <DataTable tab={activeTab} rows={filteredRows} selectedId={selected?.id} onSelect={setSelected} />
          {activeTab === "alerts" ? <div className="card">Alerts are read only.</div> : <ActionPanel tab={activeTab} row={selected} onSaved={loadAll} />}
        </div>
      </div>
    </div>
  );
}
