import { useEffect, useMemo, useState } from "react";
import axios from "axios";

const api = axios.create({ baseURL: "https://guruvidya-backend.onrender.com/api" });

const tabs = [
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

function Kpi({ title, value }) {
  return <div className="card stats-card"><div className="small">{title}</div><div className="big">{value}</div></div>;
}

function AlertsTable({ rows }) {
  if (!rows.length) return <div className="card">No alerts found</div>;
  return (
    <div className="card" style={{ overflowX: "auto" }}>
      <table className="table">
        <thead><tr><th>ID</th><th>Type</th><th>Title</th><th>Payload</th><th>Created</th></tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td>{r.id}</td><td>{r.type}</td><td>{r.title}</td>
              <td>{JSON.stringify(r.payload)}</td><td>{r.created_at}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ActionPanel({ tab, row, onSaved }) {
  const [action, setAction] = useState(row?.status || "");
  const [owner, setOwner] = useState(row?.owner || "");
  const [note, setNote] = useState(row?.note || row?.admin_note || "");
  const [sendNotification, setSendNotification] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    setAction(row?.status || "");
    setOwner(row?.owner || "");
    setNote(row?.note || row?.admin_note || "");
    setSendNotification(false);
    setMsg("");
  }, [row?.id, tab]);

  if (!row) return <div className="card">Select a row to update status, owner, notes, or send notification.</div>;

  const save = async () => {
    if (tab === "alerts") return;
    setSaving(true);
    setMsg("");
    try {
      const res = await api.post(`/admin/${tab}/${row.id}/action`, {
        action,
        owner,
        note,
        sendNotification
      });
      setMsg(res.data.message || "Updated");
      onSaved?.();
    } catch (e) {
      setMsg(e?.response?.data?.message || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card">
      <div className="row">
        <h3 style={{ marginTop: 0, marginBottom: 0 }}>Action Panel</h3>
        <span className="tag">ID: {row.id}</span>
      </div>
      <div className="actions" style={{ marginTop: 12 }}>
        <div>
          <label className="small">Status</label>
          <select value={action} onChange={(e) => setAction(e.target.value)}>
            {(statusOptions[tab] || [row.status || "new"]).map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="small">Owner</label>
          <input value={owner} onChange={(e) => setOwner(e.target.value)} placeholder="Reception / HR / Tech / Admin" />
        </div>
        <div>
          <label className="small">Note</label>
          <textarea rows="6" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Follow-up note / remarks" />
        </div>
        <label className="small" style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input type="checkbox" checked={sendNotification} onChange={(e) => setSendNotification(e.target.checked)} style={{ width: "auto" }} />
          Send notification to user
        </label>
        <button className="success" onClick={save} disabled={saving}>{saving ? "Saving..." : "Save Action"}</button>
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
    faculty: ["id","name","mobile","course","mode","status","owner","admin_note","created_at"]
  };
  const headers = headersMap[tab] || Object.keys(rows[0]);
  return (
    <div className="card" style={{ overflowX: "auto" }}>
      <table className="table">
        <thead><tr>{headers.map((h) => <th key={h}>{h}</th>)}</tr></thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} onClick={() => onSelect(row)} style={{ background: selectedId === row.id ? "#eef2ff" : "transparent", cursor: "pointer" }}>
              {headers.map((h) => <td key={h}>{String(row[h] ?? "")}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState("leads");
  const [data, setData] = useState({ leads: [], admissions: [], appointments: [], support: [], faculty: [], alerts: [] });
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

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
    } catch (e) {
      setError("Could not load backend data. Check Render backend and wait if it is waking up.");
    }
  };

  useEffect(() => { loadAll(); }, []);
  useEffect(() => { setSelected(null); setQuery(""); }, [activeTab]);

  const filteredRows = useMemo(() => {
    const rows = data[activeTab] || [];
    if (!query.trim()) return rows;
    const q = query.toLowerCase();
    return rows.filter((row) => JSON.stringify(row).toLowerCase().includes(q));
  }, [data, activeTab, query]);

  return (
    <div>
      <div className="top">
        <div className="row">
          <div>
            <h2 style={{ margin: 0 }}>Guruvidya Full CRM Admin</h2>
            <div className="notice">Leads, admissions, appointments, support, faculty, alerts, action panel</div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="orange" onClick={loadAll}>Refresh All</button>
          </div>
        </div>
      </div>

      <div className="wrap">
        <div className="kpis">
          <Kpi title="Leads" value={data.leads.length} />
          <Kpi title="Admissions" value={data.admissions.length} />
          <Kpi title="Appointments" value={data.appointments.length} />
          <Kpi title="Support" value={data.support.length} />
          <Kpi title="Faculty" value={data.faculty.length} />
          <Kpi title="Alerts" value={data.alerts.length} />
        </div>

        {error && <div className="card" style={{ color: "#991b1b", marginBottom: 16 }}>{error}</div>}

        <div className="tabs">
          {tabs.map((t) => (
            <button key={t.key} onClick={() => setActiveTab(t.key)} className={activeTab === t.key ? "" : "secondary"}>
              {t.label}
            </button>
          ))}
        </div>

        {activeTab !== "alerts" && (
          <div className="searchBar">
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={`Search ${activeTab} by any field`} />
            <div className="card small" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
              Rows: {filteredRows.length}
            </div>
          </div>
        )}

        {activeTab === "alerts" ? (
          <AlertsTable rows={data.alerts} />
        ) : (
          <div className="grid2">
            <DataTable tab={activeTab} rows={filteredRows} selectedId={selected?.id} onSelect={setSelected} />
            <ActionPanel tab={activeTab} row={selected} onSaved={loadAll} />
          </div>
        )}
      </div>
    </div>
  );
}\n