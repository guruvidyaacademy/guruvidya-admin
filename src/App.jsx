import { useEffect, useMemo, useState } from "react";
import axios from "axios";

const api = axios.create({
  baseURL: "https://guruvidya-backend.onrender.com/api",
});

const USERS = [
  {
    email: "admin@guruvidya.in",
    password: "Guru@12345",
    role: "Super Admin",
    access: [
      "leads",
      "admissions",
      "appointments",
      "support",
      "faculty",
      "alerts",
      "reminders",
      "whatsapp_logs",
      "counselors",
      "automation",
      "integration",
    ],
  },
  {
    email: "counselor@guruvidya.in",
    password: "Counselor@123",
    role: "Counselor",
    access: ["leads", "admissions", "appointments", "reminders", "counselors"],
  },
  {
    email: "reception@guruvidya.in",
    password: "Reception@123",
    role: "Reception",
    access: ["appointments", "support", "leads", "reminders"],
  },
];

const allTabs = [
  ["leads", "Leads"],
  ["admissions", "Admissions"],
  ["appointments", "Appointments"],
  ["support", "Support"],
  ["faculty", "Faculty"],
  ["alerts", "Alerts"],
  ["reminders", "Reminders"],
  ["whatsapp_logs", "WhatsApp Logs"],
  ["counselors", "Counselors"],
  ["automation", "Automation"],
  ["integration", "Integration Panel"],
].map(([key, label]) => ({ key, label }));

const statusOptions = {
  leads: ["new", "contacted", "interested", "not_interested", "follow_up", "converted", "closed"],
  admissions: ["new", "contacted", "documents_pending", "fee_pending", "converted", "closed"],
  appointments: ["requested", "confirmed", "on_the_way", "arrived", "completed", "cancelled"],
  support: ["new", "in_progress", "tech_review", "resolved", "closed"],
  faculty: ["new", "demo_pending", "interview_scheduled", "selected", "rejected", "hold"],
};

const owners = ["Unassigned", "Reception", "Counselor 1", "Counselor 2", "Accounts", "Admin", "Technical", "HR"];
const priorities = ["hot", "warm", "cold"];

function Login({ onLogin }) {
  const [email, setEmail] = useState("admin@guruvidya.in");
  const [password, setPassword] = useState("Guru@12345");
  const [error, setError] = useState("");

  const submit = (e) => {
    e.preventDefault();
    const u = USERS.find((x) => x.email === email.trim() && x.password === password);
    if (!u) return setError("Wrong email or password");
    localStorage.setItem("guruvidya_user", JSON.stringify(u));
    onLogin(u);
  };

  return (
    <div className="loginPage">
      <form className="loginCard" onSubmit={submit}>
        <div className="logoText">Guruvidya CRM Phase 3</div>
        <div className="notice">Integration Panel + WhatsApp + Automation</div>

        <label className="small">Email</label>
        <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} />

        <label className="small">Password</label>
        <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />

        {error && <div style={{ color: "#b91c1c", marginBottom: 12 }}>{error}</div>}

        <button className="btn" style={{ width: "100%" }}>
          Login
        </button>
      </form>
    </div>
  );
}

const Kpi = ({ title, value }) => (
  <div className="card stats-card">
    <div className="small">{title}</div>
    <div className="big">{value}</div>
  </div>
);

const StatusBadge = ({ status }) => <span className={`badge ${String(status || "new")}`}>{status || "new"}</span>;

const PriorityBadge = ({ priority }) => (
  <span className={`badge priority ${String(priority || "cold")}`}>{priority || "cold"}</span>
);

function DataTable({ tab, rows, selectedId, onSelect }) {
  if (!rows.length) return <div className="card">No data found</div>;

  const map = {
    leads: ["id", "name", "mobile", "course", "priority", "status", "owner", "note", "created_at"],
    admissions: ["id", "name", "mobile", "email", "course", "priority", "status", "owner", "admin_note", "created_at"],
    appointments: ["id", "name", "mobile", "course", "datetime", "priority", "status", "owner", "note", "created_at"],
    support: ["id", "name", "mobile", "issue", "description", "priority", "status", "owner", "note", "created_at"],
    faculty: ["id", "name", "mobile", "course", "mode", "priority", "status", "owner", "admin_note", "created_at"],
    alerts: ["id", "type", "title", "payload", "created_at"],
    reminders: ["id", "table", "record_id", "name", "mobile", "owner", "reason", "due_date", "status", "created_at"],
    whatsapp_logs: ["id", "table", "record_id", "mobile", "template", "status", "message", "created_at"],
  };

  const headers = map[tab] || Object.keys(rows[0]);

  return (
    <div className="card" style={{ overflowX: "auto" }}>
      <table className="table">
        <thead>
          <tr>{headers.map((h) => <th key={h}>{h}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.id}
              onClick={() => onSelect(row)}
              style={{
                background: selectedId === row.id ? "#eef2ff" : "transparent",
                cursor: "pointer",
              }}
            >
              {headers.map((h) => (
                <td key={h}>
                  {h === "status" ? (
                    <StatusBadge status={row[h]} />
                  ) : h === "priority" ? (
                    <PriorityBadge priority={row[h]} />
                  ) : h === "payload" ? (
                    JSON.stringify(row[h])
                  ) : (
                    String(row[h] ?? "")
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ActionPanel({ tab, row, onSaved }) {
  const [status, setStatus] = useState("new");
  const [owner, setOwner] = useState("Unassigned");
  const [priority, setPriority] = useState("cold");
  const [note, setNote] = useState("");
  const [sendNotification, setSendNotification] = useState(true);
  const [sendWhatsapp, setSendWhatsapp] = useState(false);
  const [createReminder, setCreateReminder] = useState(false);
  const [reminderDays, setReminderDays] = useState(2);
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setStatus(row?.status || "new");
    setOwner(row?.owner || "Unassigned");
    setPriority(row?.priority || "cold");
    setNote(row?.note || row?.admin_note || "");
    setSendNotification(true);
    setSendWhatsapp(false);
    setCreateReminder(false);
    setMsg("");
  }, [row, tab]);

  if (!row) {
    return <div className="card">Select a row to update status, owner, priority, reminders, or WhatsApp trigger.</div>;
  }

  const save = async (close = false) => {
    setSaving(true);
    setMsg("");

    try {
      const res = await api.post(`/admin/${tab}/${row.id}/action`, {
        status: close ? "closed" : status,
        owner,
        priority,
        note: close ? note || "Closed / Archived" : note,
        sendNotification,
        sendWhatsapp,
        createReminder,
        reminderDays,
      });

      setMsg(res.data.message || "Updated successfully");
      onSaved?.();
    } catch (e) {
      setMsg("Save failed.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card">
      <div className="row">
        <h3 style={{ margin: 0 }}>Action Panel</h3>
        <span className="tag">ID: {row.id}</span>
      </div>

      <div className="actions" style={{ marginTop: 12 }}>
        <b>{row.name || "Record"}</b>
        <div className="small">{row.mobile || ""}</div>

        <label>
          Priority
          <select value={priority} onChange={(e) => setPriority(e.target.value)}>
            {priorities.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>

        <label>
          Status
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            {(statusOptions[tab] || [row.status || "new"]).map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>

        <label>
          Assign Owner
          <select value={owner} onChange={(e) => setOwner(e.target.value)}>
            {owners.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>

        <label>
          Follow-up Note
          <textarea rows="5" value={note} onChange={(e) => setNote(e.target.value)} />
        </label>

        <label className="small" style={{ display: "flex", gap: 8 }}>
          <input
            type="checkbox"
            checked={sendNotification}
            onChange={(e) => setSendNotification(e.target.checked)}
            style={{ width: "auto" }}
          />
          Auto create alert
        </label>

        <label className="small" style={{ display: "flex", gap: 8 }}>
          <input
            type="checkbox"
            checked={createReminder}
            onChange={(e) => setCreateReminder(e.target.checked)}
            style={{ width: "auto" }}
          />
          Create follow-up reminder
        </label>

        {createReminder && <input type="number" value={reminderDays} onChange={(e) => setReminderDays(e.target.value)} />}

        <label className="small" style={{ display: "flex", gap: 8 }}>
          <input
            type="checkbox"
            checked={sendWhatsapp}
            onChange={(e) => setSendWhatsapp(e.target.checked)}
            style={{ width: "auto" }}
          />
          WhatsApp trigger
        </label>

        {sendWhatsapp && (
          <div className="whatsappBox">
            WhatsApp trigger ON hai. Integration Panel me BotSailor token + Instance ID save hone ke baad real API send hoga.
          </div>
        )}

        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn btn3" onClick={() => save(false)} disabled={saving}>
            Save Action
          </button>
          <button className="btn btnDanger" onClick={() => save(true)} disabled={saving}>
            Close
          </button>
        </div>

        {msg && <div className="notice">{msg}</div>}
      </div>
    </div>
  );
}

function CounselorDashboard({ stats }) {
  return (
    <div className="ownerGrid">
      {stats.map((s) => (
        <div className="card ownerCard" key={s.owner}>
          <div className="row">
            <b>{s.owner}</b>
            <span className="tag">{s.total}</span>
          </div>
          <div className="small">Hot: {s.hot} · Warm: {s.warm} · Cold: {s.cold}</div>
          <div className="small">Converted: {s.converted}</div>
          <div className="small">Follow-up: {s.follow_up}</div>
        </div>
      ))}
    </div>
  );
}

function Automation({ config, onSave }) {
  const [local, setLocal] = useState(config || {});

  useEffect(() => setLocal(config || {}), [config]);

  return (
    <div className="card">
      <h3>Automation Settings</h3>

      <div className="configGrid">
        <label>
          Auto Assign
          <select
            value={String(local.autoAssign)}
            onChange={(e) => setLocal({ ...local, autoAssign: e.target.value === "true" })}
          >
            <option value="true">ON</option>
            <option value="false">OFF</option>
          </select>
        </label>

        <label>
          WhatsApp
          <select
            value={String(local.whatsappEnabled)}
            onChange={(e) => setLocal({ ...local, whatsappEnabled: e.target.value === "true" })}
          >
            <option value="false">OFF</option>
            <option value="true">ON</option>
          </select>
        </label>

        <label>
          Counselors
          <input
            value={(local.counselors || []).join(",")}
            onChange={(e) =>
              setLocal({
                ...local,
                counselors: e.target.value
                  .split(",")
                  .map((x) => x.trim())
                  .filter(Boolean),
              })
            }
          />
        </label>

        <label>
          Follow-up days
          <input
            value={(local.followupDays || []).join(",")}
            onChange={(e) =>
              setLocal({
                ...local,
                followupDays: e.target.value
                  .split(",")
                  .map((x) => Number(x.trim()))
                  .filter(Boolean),
              })
            }
          />
        </label>
      </div>

      <button className="btn btn3" style={{ marginTop: 14 }} onClick={() => onSave(local)}>
        Save Automation Config
      </button>
    </div>
  );
}

function IntegrationPanel() {
  const [form, setForm] = useState({
    botsailorApiToken: "",
    botsailorInstanceId: "",
    whatsappEnabled: false,

    razorpayKeyId: "",
    razorpayKeySecret: "",
    razorpayEnabled: false,

    youtubeApiKey: "",
    youtubeEnabled: false,

    myoperatorApiKey: "",
    myoperatorEnabled: false,

    aiProvider: "OpenAI",
    aiApiKey: "",
    aiEnabled: false,
  });

  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const update = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const loadIntegration = async () => {
    try {
      const res = await api.get("/integrations");
      if (res.data?.data) {
        setForm((prev) => ({ ...prev, ...res.data.data }));
      }
    } catch {
      // ignore if backend route not ready
    }
  };

  useEffect(() => {
    loadIntegration();
  }, []);

  const save = async () => {
    setLoading(true);
    setMsg("");

    try {
      const res = await api.post("/integrations", form);
      setMsg(res.data?.message || "Integration settings saved successfully");
    } catch (e) {
      setMsg("Save failed. Backend integration route check karo.");
    } finally {
      setLoading(false);
    }
  };

  const testWhatsApp = async () => {
    setLoading(true);
    setMsg("");

    try {
      const res = await api.post("/integrations/test-whatsapp", form);
      setMsg(res.data?.message || "WhatsApp API test completed");
    } catch (e) {
      setMsg("WhatsApp test failed. Token / Instance ID / backend route check karo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <div className="row">
        <div>
          <h3 style={{ margin: 0 }}>Integration Panel</h3>
          <div className="notice">Central NO CODE settings for Guruvidya CRM Phase 3</div>
        </div>
        <span className="tag">Phase 3</span>
      </div>

      <div className="configGrid" style={{ marginTop: 18 }}>
        <label>
          BotSailor API Token
          <input
            value={form.botsailorApiToken}
            onChange={(e) => update("botsailorApiToken", e.target.value)}
            placeholder="Paste BotSailor API Token"
          />
        </label>

        <label>
          Instance ID / Phone Number ID
          <input
            value={form.botsailorInstanceId}
            onChange={(e) => update("botsailorInstanceId", e.target.value)}
            placeholder="Paste Instance ID"
          />
        </label>

        <label>
          WhatsApp Status
          <select
            value={String(form.whatsappEnabled)}
            onChange={(e) => update("whatsappEnabled", e.target.value === "true")}
          >
            <option value="false">Disabled</option>
            <option value="true">Enabled</option>
          </select>
        </label>

        <label>
          Razorpay Key ID
          <input
            value={form.razorpayKeyId}
            onChange={(e) => update("razorpayKeyId", e.target.value)}
            placeholder="Future ready"
          />
        </label>

        <label>
          Razorpay Key Secret
          <input
            value={form.razorpayKeySecret}
            onChange={(e) => update("razorpayKeySecret", e.target.value)}
            placeholder="Future ready"
          />
        </label>

        <label>
          Razorpay
          <select
            value={String(form.razorpayEnabled)}
            onChange={(e) => update("razorpayEnabled", e.target.value === "true")}
          >
            <option value="false">Disabled</option>
            <option value="true">Enabled</option>
          </select>
        </label>

        <label>
          YouTube API Key
          <input
            value={form.youtubeApiKey}
            onChange={(e) => update("youtubeApiKey", e.target.value)}
            placeholder="Future ready"
          />
        </label>

        <label>
          YouTube
          <select
            value={String(form.youtubeEnabled)}
            onChange={(e) => update("youtubeEnabled", e.target.value === "true")}
          >
            <option value="false">Disabled</option>
            <option value="true">Enabled</option>
          </select>
        </label>

        <label>
          MyOperator API Key
          <input
            value={form.myoperatorApiKey}
            onChange={(e) => update("myoperatorApiKey", e.target.value)}
            placeholder="Future ready"
          />
        </label>

        <label>
          MyOperator
          <select
            value={String(form.myoperatorEnabled)}
            onChange={(e) => update("myoperatorEnabled", e.target.value === "true")}
          >
            <option value="false">Disabled</option>
            <option value="true">Enabled</option>
          </select>
        </label>

        <label>
          AI Provider
          <select value={form.aiProvider} onChange={(e) => update("aiProvider", e.target.value)}>
            <option>OpenAI</option>
            <option>Gemini</option>
            <option>Claude</option>
            <option>Other</option>
          </select>
        </label>

        <label>
          AI API Key
          <input value={form.aiApiKey} onChange={(e) => update("aiApiKey", e.target.value)} placeholder="Future ready" />
        </label>

        <label>
          AI Status
          <select value={String(form.aiEnabled)} onChange={(e) => update("aiEnabled", e.target.value === "true")}>
            <option value="false">Disabled</option>
            <option value="true">Enabled</option>
          </select>
        </label>
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
        <button className="btn btn3" onClick={save} disabled={loading}>
          Save Integration Settings
        </button>
        <button className="btn btn4" onClick={testWhatsApp} disabled={loading}>
          Test WhatsApp API
        </button>
      </div>

      {msg && <div className="notice" style={{ marginTop: 12 }}>{msg}</div>}

      <div className="whatsappBox" style={{ marginTop: 16 }}>
        Future ready modules: WhatsApp + Instagram + Facebook + Razorpay + YouTube + MyOperator + AI API.
      </div>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("guruvidya_user"));
    } catch {
      return null;
    }
  });

  const [activeTab, setActiveTab] = useState("leads");
  const [data, setData] = useState({
    leads: [],
    admissions: [],
    appointments: [],
    support: [],
    faculty: [],
    alerts: [],
    reminders: [],
    whatsapp_logs: [],
  });
  const [stats, setStats] = useState([]);
  const [config, setConfig] = useState({});
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const tabs = user ? allTabs.filter((t) => user.access.includes(t.key)) : [];

  const logout = () => {
    localStorage.removeItem("guruvidya_user");
    setUser(null);
  };

  const loadAll = async () => {
    setError("");

    try {
      const keys = ["leads", "admissions", "appointments", "support", "faculty", "alerts", "reminders", "whatsapp_logs"];
      const res = await Promise.all(keys.map((k) => api.get(`/admin/${k}`)));

      let nd = {};
      keys.forEach((k, i) => (nd[k] = res[i].data.data || []));
      setData(nd);

      setStats((await api.get("/admin/counselor-stats")).data.data || []);
      setConfig((await api.get("/admin/config")).data.data || {});
    } catch {
      setError("Backend data load failed.");
    }
  };

  useEffect(() => {
    if (user) loadAll();
  }, [user]);

  useEffect(() => {
    setSelected(null);
    setQuery("");
    setFilterStatus("all");
  }, [activeTab]);

  const filteredRows = useMemo(() => {
    if (["counselors", "automation", "integration"].includes(activeTab)) return [];

    let rows = data[activeTab] || [];
    if (filterStatus !== "all") rows = rows.filter((r) => String(r.status || "new") === filterStatus);

    if (!query.trim()) return rows;

    const q = query.toLowerCase();
    return rows.filter((row) => JSON.stringify(row).toLowerCase().includes(q));
  }, [data, activeTab, query, filterStatus]);

  const saveConfig = async (c) => {
    await api.post("/admin/config", c);
    loadAll();
  };

  if (!user) return <Login onLogin={setUser} />;

  return (
    <div>
      <div className="top">
        <div className="row">
          <div>
            <h2 style={{ margin: 0 }}>Guruvidya CRM Phase 3</h2>
            <div className="notice">
              Logged in: {user.email} · Role: {user.role}
            </div>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn btn4" onClick={loadAll}>
              Refresh All
            </button>
            <button className="btn btn2" onClick={logout}>
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="wrap">
        <div className="kpis">
          {allTabs
            .filter((t) => !["counselors", "automation", "integration"].includes(t.key))
            .map((t) => (
              <Kpi key={t.key} title={t.label} value={(data[t.key] || []).length} />
            ))}
        </div>

        {error && (
          <div className="card" style={{ color: "#991b1b", marginBottom: 16 }}>
            {error}
          </div>
        )}

        <div className="tabs">
          {tabs.map((t) => (
            <button key={t.key} onClick={() => setActiveTab(t.key)} className={activeTab === t.key ? "btn" : "btn btn2"}>
              {t.label}
            </button>
          ))}
        </div>

        {activeTab === "counselors" ? (
          <CounselorDashboard stats={stats} />
        ) : activeTab === "automation" ? (
          <Automation config={config} onSave={saveConfig} />
        ) : activeTab === "integration" ? (
          <IntegrationPanel />
        ) : (
          <>
            <div className="searchBar">
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={`Search ${activeTab} by any field`} />

              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                <option value="all">All Status</option>
                {(statusOptions[activeTab] || []).map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>

              <div className="card small" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                Rows: {filteredRows.length}
              </div>
            </div>

            <div className="grid2">
              <DataTable tab={activeTab} rows={filteredRows} selectedId={selected?.id} onSelect={setSelected} />

              {["alerts", "reminders", "whatsapp_logs"].includes(activeTab) ? (
                <div className="card">{activeTab} are read only.</div>
              ) : (
                <ActionPanel tab={activeTab} row={selected} onSaved={loadAll} />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
