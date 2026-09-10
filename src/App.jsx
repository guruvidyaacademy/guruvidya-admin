import Pipeline from "./pages/Pipeline";
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
      "pipeline",
    ],
  },
  {
    email: "counselor@guruvidya.in",
    password: "Counselor@123",
    role: "Counselor",
    owner: "Counselor 1",
    access: ["leads", "admissions", "appointments", "reminders", "pipeline"],
  },
  {
    email: "reception@guruvidya.in",
    password: "Reception@123",
    role: "Reception",
    access: ["appointments", "support", "leads", "reminders", "pipeline"],
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
  ["pipeline", "Pipeline"],
].map(([key, label]) => ({ key, label }));

const statusOptions = {
  leads: [
    "new",
    "contacted",
    "interested",
    "not_interested",
    "follow_up",
    "no_response",
    "re-enquiry",
    "very_hot",
    "converted",
    "closed",
  ],
  admissions: ["new", "contacted", "documents_pending", "fee_pending", "converted", "closed"],
  appointments: ["requested", "confirmed", "on_the_way", "arrived", "completed", "cancelled"],
  support: ["new", "in_progress", "tech_review", "resolved", "closed"],
  faculty: ["new", "demo_pending", "interview_scheduled", "selected", "rejected", "hold"],
};

const owners = ["Unassigned", "Reception", "Counselor 1", "Counselor 2", "Accounts", "Admin", "Technical", "HR"];
const priorities = ["very hot", "hot", "warm", "cold"];

const boxStyle = {
  border: "1px solid #dbe3ef",
  borderRadius: 10,
  padding: 12,
  marginTop: 12,
};

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
    leads: ["id", "name", "mobile", "course", "priority", "status", "owner", "source", "note", "created_at"],
    admissions: ["id", "name", "mobile", "email", "course", "priority", "status", "owner", "admin_note", "created_at"],
    appointments: ["id", "name", "mobile", "course", "datetime", "priority", "status", "owner", "note", "created_at"],
    support: ["id", "name", "mobile", "issue", "description", "priority", "status", "owner", "note", "created_at"],
    faculty: ["id", "name", "mobile", "course", "mode", "priority", "status", "owner", "admin_note", "created_at"],
    alerts: ["id", "type", "title", "payload", "created_at"],
    reminders: ["id", "table_name", "record_id", "name", "mobile", "owner", "reason", "due_date", "status", "created_at"],
    whatsapp_logs: ["id", "table_name", "record_id", "mobile", "template", "status", "message", "created_at"],
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

function isWhatsappWindowOpen(row) {
  if (!row?.last_customer_message_at) return false;
  const d = new Date(row.last_customer_message_at);
  if (Number.isNaN(d.getTime())) return false;
  const diff = Date.now() - d.getTime();
  return diff >= 0 && diff < 24 * 60 * 60 * 1000;
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
  const [whatsappMode, setWhatsappMode] = useState("message");
  const [whatsappMessage, setWhatsappMessage] = useState("");
  const [templates, setTemplates] = useState([]);
  const [whatsappTemplateId, setWhatsappTemplateId] = useState("");
  const [templateVariables, setTemplateVariables] = useState("{}");
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);

  const windowOpen = tab === "leads" ? isWhatsappWindowOpen(row) : true;

  useEffect(() => {
    setStatus(row?.status || "new");
    setOwner(row?.owner || "Unassigned");
    setPriority(row?.priority || "cold");
    setNote(row?.note || row?.admin_note || "");
    setSendNotification(true);
    setSendWhatsapp(false);
    setCreateReminder(false);
    setWhatsappMode(tab === "leads" && !isWhatsappWindowOpen(row) ? "template" : "message");
    setWhatsappMessage(
      row
        ? `Hi ${row.name || "Student"},\n\nDo you need any assistance regarding your ${row.course || "course"} enquiry?\n\nGuruvidya Academy`
        : ""
    );
    setWhatsappTemplateId("");
    setTemplateVariables("{}");
    setMsg("");
  }, [row, tab]);

  useEffect(() => {
    api.get("/admin/botsailor/templates")
      .then((res) => setTemplates(res.data?.data || []))
      .catch(() => setTemplates([]));
  }, []);

  if (!row) {
    return <div className="card">Select a row to update status, owner, priority, reminders, or WhatsApp.</div>;
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
        whatsappMode,
        whatsappMessage,
        whatsappTemplateId: whatsappTemplateId || null,
        templateVariables,
      });

      setMsg(res.data.message || "Updated successfully");
      onSaved?.();
    } catch (e) {
      setMsg(e.response?.data?.message || "Save failed.");
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

        {tab === "leads" && (
          <div className="notice" style={{ marginTop: 8 }}>
            WhatsApp 24h window: <b>{windowOpen ? "OPEN" : "CLOSED / NOT KNOWN"}</b>
            {row.last_customer_message_at ? ` · Last customer message: ${String(row.last_customer_message_at)}` : ""}
          </div>
        )}

        <label>
          Priority
          <select value={priority} onChange={(e) => setPriority(e.target.value)}>
            {priorities.map((s) => <option key={s}>{s}</option>)}
          </select>
        </label>

        <label>
          Status
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            {(statusOptions[tab] || [row.status || "new"]).map((s) => <option key={s}>{s}</option>)}
          </select>
        </label>

        <label>
          Assign Owner
          <select value={owner} onChange={(e) => setOwner(e.target.value)}>
            {owners.map((c) => <option key={c}>{c}</option>)}
          </select>
        </label>

        <label>
          Follow-up Note
          <textarea rows="5" value={note} onChange={(e) => setNote(e.target.value)} />
        </label>

        <label className="small" style={{ display: "flex", gap: 8 }}>
          <input type="checkbox" checked={sendNotification} onChange={(e) => setSendNotification(e.target.checked)} style={{ width: "auto" }} />
          Auto create alert
        </label>

        <label className="small" style={{ display: "flex", gap: 8 }}>
          <input type="checkbox" checked={createReminder} onChange={(e) => setCreateReminder(e.target.checked)} style={{ width: "auto" }} />
          Create follow-up reminder
        </label>

        {createReminder && <input type="number" min="1" value={reminderDays} onChange={(e) => setReminderDays(e.target.value)} />}

        <label className="small" style={{ display: "flex", gap: 8 }}>
          <input type="checkbox" checked={sendWhatsapp} onChange={(e) => setSendWhatsapp(e.target.checked)} style={{ width: "auto" }} />
          Send WhatsApp manually now
        </label>

        {sendWhatsapp && (
          <div className="whatsappBox">
            <label>
              WhatsApp Send Type
              <select value={whatsappMode} onChange={(e) => setWhatsappMode(e.target.value)}>
                <option value="message">Normal Message (24h window)</option>
                <option value="template">Approved BotSailor Template</option>
              </select>
            </label>

            {whatsappMode === "message" ? (
              <>
                {tab === "leads" && !windowOpen && (
                  <div className="notice" style={{ marginTop: 8 }}>
                    24-hour window closed hai. Normal message send nahi hoga; approved template choose karo.
                  </div>
                )}
                <label>
                  WhatsApp Message
                  <textarea rows="7" value={whatsappMessage} onChange={(e) => setWhatsappMessage(e.target.value)} />
                </label>
              </>
            ) : (
              <>
                <label>
                  BotSailor Template
                  <select value={whatsappTemplateId} onChange={(e) => setWhatsappTemplateId(e.target.value)}>
                    <option value="">Select imported template</option>
                    {templates.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.template_name} {t.status ? `(${t.status})` : ""}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Template Variables JSON (only if template needs variables)
                  <textarea
                    rows="4"
                    value={templateVariables}
                    onChange={(e) => setTemplateVariables(e.target.value)}
                    placeholder='{"templateVariable-Name-1":"Raushan"}'
                  />
                </label>
                <div className="small">
                  Variable key exactly wahi use karein jo BotSailor generated template API endpoint me deta hai. No-variable template ke liye {"{}"} rehne dein.
                </div>
              </>
            )}
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
  const [flows, setFlows] = useState([]);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => setLocal(config || {}), [config]);

  const loadFlows = async () => {
    try {
      const res = await api.get("/admin/botsailor/flows");
      setFlows(res.data?.data || []);
    } catch {
      setFlows([]);
    }
  };

  useEffect(() => {
    loadFlows();
  }, []);

  const save = async () => {
    setLoading(true);
    setMsg("");
    try {
      await onSave(local);
      setMsg("Automation settings saved permanently.");
    } catch (e) {
      setMsg("Automation settings save failed.");
    } finally {
      setLoading(false);
    }
  };

  const runNow = async () => {
    setLoading(true);
    setMsg("");
    try {
      const res = await api.post("/admin/automation/run-now");
      const d = res.data?.data || {};
      setMsg(`Automation check complete. Checked: ${d.checked || 0}, Sent: ${d.sent || 0}, Failed: ${d.failed || 0}, Skipped: ${d.skipped || 0}`);
    } catch (e) {
      setMsg("Automation test run failed.");
    } finally {
      setLoading(false);
    }
  };

  const toggle = (key) => (
    <select value={String(Boolean(local[key]))} onChange={(e) => setLocal({ ...local, [key]: e.target.value === "true" })}>
      <option value="true">ON</option>
      <option value="false">OFF</option>
    </select>
  );

  return (
    <div className="card">
      <div className="row">
        <div>
          <h3 style={{ margin: 0 }}>WhatsApp Follow-up Automation</h3>
          <div className="notice">3h → 6h → 9h → window-closing message. Converted leads are automatically skipped.</div>
        </div>
        <span className="tag">Admin Only</span>
      </div>

      <div className="configGrid" style={{ marginTop: 16 }}>
        <label>
          Auto Assign
          <select value={String(Boolean(local.autoAssign))} onChange={(e) => setLocal({ ...local, autoAssign: e.target.value === "true" })}>
            <option value="true">ON</option>
            <option value="false">OFF</option>
          </select>
        </label>

        <label>
          CRM WhatsApp Auto Follow-up
          {toggle("whatsappAutoFollowupEnabled")}
        </label>

        <label>
          Quiet Hours Start (0-23)
          <input type="number" min="0" max="23" value={local.quietHoursStart ?? 0} onChange={(e) => setLocal({ ...local, quietHoursStart: Number(e.target.value) })} />
        </label>

        <label>
          Quiet Hours End (0-23)
          <input type="number" min="0" max="23" value={local.quietHoursEnd ?? 9} onChange={(e) => setLocal({ ...local, quietHoursEnd: Number(e.target.value) })} />
        </label>

        <label>
          Minimum Auto Message Gap (hours)
          <input type="number" min="1" value={local.minimumAutoMessageGapHours ?? 3} onChange={(e) => setLocal({ ...local, minimumAutoMessageGapHours: Number(e.target.value) })} />
        </label>

        <label>
          Counselors
          <input
            value={(local.counselors || []).join(",")}
            onChange={(e) => setLocal({
              ...local,
              counselors: e.target.value.split(",").map((x) => x.trim()).filter(Boolean),
            })}
          />
        </label>

        <label>
          Existing BotSailor “Call for Admission” Flow
          <select
            value={local.callForAdmissionFlowUniqueId || ""}
            onChange={(e) => setLocal({ ...local, callForAdmissionFlowUniqueId: e.target.value })}
          >
            <option value="">Select BotSailor flow</option>
            {flows.map((f) => (
              <option key={f.unique_id} value={f.unique_id}>{f.name}</option>
            ))}
          </select>
        </label>
      </div>

      <div style={boxStyle}>
        <h4 style={{ marginTop: 0 }}>3 Hour Follow-up</h4>
        <div className="configGrid">
          <label>Enabled {toggle("followup3Enabled")}</label>
          <label>
            Send after hours
            <input type="number" min="1" value={local.followup3Hours ?? 3} onChange={(e) => setLocal({ ...local, followup3Hours: Number(e.target.value) })} />
          </label>
          <label>Call for Admission button {toggle("followup3UseCallButton")}</label>
        </div>
        <textarea rows="7" value={local.followup3Message || ""} onChange={(e) => setLocal({ ...local, followup3Message: e.target.value })} />
        <div className="small">Variables: {"{{name}}"}, {"{{course}}"}, {"{{mobile}}"}, {"{{owner}}"}</div>
      </div>

      <div style={boxStyle}>
        <h4 style={{ marginTop: 0 }}>6 Hour Follow-up</h4>
        <div className="configGrid">
          <label>Enabled {toggle("followup6Enabled")}</label>
          <label>
            Send after hours
            <input type="number" min="1" value={local.followup6Hours ?? 6} onChange={(e) => setLocal({ ...local, followup6Hours: Number(e.target.value) })} />
          </label>
          <label>Call for Admission button {toggle("followup6UseCallButton")}</label>
        </div>
        <textarea rows="7" value={local.followup6Message || ""} onChange={(e) => setLocal({ ...local, followup6Message: e.target.value })} />
      </div>

      <div style={boxStyle}>
        <h4 style={{ marginTop: 0 }}>9 Hour Follow-up</h4>
        <div className="configGrid">
          <label>Enabled {toggle("followup9Enabled")}</label>
          <label>
            Send after hours
            <input type="number" min="1" value={local.followup9Hours ?? 9} onChange={(e) => setLocal({ ...local, followup9Hours: Number(e.target.value) })} />
          </label>
          <label>Call for Admission button {toggle("followup9UseCallButton")}</label>
        </div>
        <textarea rows="7" value={local.followup9Message || ""} onChange={(e) => setLocal({ ...local, followup9Message: e.target.value })} />
      </div>

      <div style={boxStyle}>
        <h4 style={{ marginTop: 0 }}>24-hour Window Closing Message</h4>
        <div className="configGrid">
          <label>Enabled {toggle("windowClosingEnabled")}</label>
          <label>
            Send before window closes (hours)
            <input type="number" min="1" max="12" value={local.windowClosingHoursBefore ?? 3} onChange={(e) => setLocal({ ...local, windowClosingHoursBefore: Number(e.target.value) })} />
          </label>
        </div>
        <textarea rows="8" value={local.windowClosingMessage || ""} onChange={(e) => setLocal({ ...local, windowClosingMessage: e.target.value })} />
        <div className="notice" style={{ marginTop: 8 }}>
          Ye special message quiet hours (12 AM–9 AM) me bhi ja sakta hai, sirf jab current 24h window close hone wali ho.
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
        <button className="btn btn3" onClick={save} disabled={loading}>Save Automation Settings</button>
        <button className="btn btn4" onClick={runNow} disabled={loading}>Run Automation Check Now</button>
        <button className="btn btn2" onClick={loadFlows} disabled={loading}>Refresh Imported Flows</button>
      </div>

      {msg && <div className="notice" style={{ marginTop: 12 }}>{msg}</div>}
    </div>
  );
}

function IntegrationPanel() {
  const [form, setForm] = useState({
    botsailorToken: "",
    botsailorInstanceId: "",
    botsailorApiUrl: "https://botsailor.com/api/v1/whatsapp/send",
    whatsappEnabled: false,
    testMobile: "",

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
  const [templates, setTemplates] = useState([]);
  const [flows, setFlows] = useState([]);

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const loadIntegration = async () => {
    try {
      const res = await api.get("/admin/integrations");
      if (res.data?.data) setForm((prev) => ({ ...prev, ...res.data.data }));
    } catch {
      // ignore
    }
  };

  const loadImported = async () => {
    try {
      const [t, f] = await Promise.all([
        api.get("/admin/botsailor/templates"),
        api.get("/admin/botsailor/flows"),
      ]);
      setTemplates(t.data?.data || []);
      setFlows(f.data?.data || []);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadIntegration();
    loadImported();
  }, []);

  const save = async () => {
    setLoading(true);
    setMsg("");
    try {
      const res = await api.post("/admin/integrations", form);
      setMsg(res.data?.message || "Integration settings saved successfully");
    } catch {
      setMsg("Save failed. Backend integration route check karo.");
    } finally {
      setLoading(false);
    }
  };

  const testWhatsApp = async () => {
    setLoading(true);
    setMsg("");
    try {
      const res = await api.post("/admin/integrations/botsailor/test", {
        mobile: form.testMobile,
        name: "Guruvidya Test",
        course: "Test",
      });
      const detail = res.data?.data?.response?.message || res.data?.data?.error || res.data?.data?.message || "";
      setMsg(`${res.data?.message || "WhatsApp API test completed"}${detail ? ` - ${detail}` : ""}`);
    } catch {
      setMsg("WhatsApp test failed. Token / Instance ID / backend route check karo.");
    } finally {
      setLoading(false);
    }
  };

  const importTemplates = async () => {
    setLoading(true);
    setMsg("");
    try {
      const res = await api.post("/admin/botsailor/templates/import");
      setMsg(res.data?.message || "Templates imported");
      await loadImported();
    } catch (e) {
      setMsg(e.response?.data?.message || "Template import failed.");
    } finally {
      setLoading(false);
    }
  };

  const importFlows = async () => {
    setLoading(true);
    setMsg("");
    try {
      const res = await api.post("/admin/botsailor/flows/import");
      setMsg(res.data?.message || "Bot flows imported");
      await loadImported();
    } catch (e) {
      setMsg(e.response?.data?.message || "Bot flow import failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <div className="row">
        <div>
          <h3 style={{ margin: 0 }}>Integration Panel</h3>
          <div className="notice">BotSailor API + Template Import + Bot Flow Import</div>
        </div>
        <span className="tag">Phase 3</span>
      </div>

      <div className="configGrid" style={{ marginTop: 18 }}>
        <label>
          BotSailor API Token
          <input value={form.botsailorToken} onChange={(e) => update("botsailorToken", e.target.value)} placeholder="Paste BotSailor API Token" />
        </label>

        <label>
          BotSailor API URL
          <input value={form.botsailorApiUrl} onChange={(e) => update("botsailorApiUrl", e.target.value)} placeholder="https://botsailor.com/api/v1/whatsapp/send" />
        </label>

        <label>
          Instance ID / Phone Number ID
          <input value={form.botsailorInstanceId} onChange={(e) => update("botsailorInstanceId", e.target.value)} placeholder="Paste Phone Number ID" />
        </label>

        <label>
          WhatsApp Status
          <select value={String(form.whatsappEnabled)} onChange={(e) => update("whatsappEnabled", e.target.value === "true")}>
            <option value="false">Disabled</option>
            <option value="true">Enabled</option>
          </select>
        </label>

        <label>
          Test WhatsApp Mobile
          <input value={form.testMobile || ""} onChange={(e) => update("testMobile", e.target.value)} placeholder="919599401607" />
        </label>

        <label>
          Razorpay Key ID
          <input value={form.razorpayKeyId || ""} onChange={(e) => update("razorpayKeyId", e.target.value)} placeholder="Future ready" />
        </label>

        <label>
          Razorpay Key Secret
          <input value={form.razorpayKeySecret || ""} onChange={(e) => update("razorpayKeySecret", e.target.value)} placeholder="Future ready" />
        </label>

        <label>
          Razorpay
          <select value={String(form.razorpayEnabled)} onChange={(e) => update("razorpayEnabled", e.target.value === "true")}>
            <option value="false">Disabled</option>
            <option value="true">Enabled</option>
          </select>
        </label>

        <label>
          YouTube API Key
          <input value={form.youtubeApiKey || ""} onChange={(e) => update("youtubeApiKey", e.target.value)} placeholder="Future ready" />
        </label>

        <label>
          YouTube
          <select value={String(form.youtubeEnabled)} onChange={(e) => update("youtubeEnabled", e.target.value === "true")}>
            <option value="false">Disabled</option>
            <option value="true">Enabled</option>
          </select>
        </label>

        <label>
          MyOperator API Key
          <input value={form.myoperatorApiKey || ""} onChange={(e) => update("myoperatorApiKey", e.target.value)} placeholder="Future ready" />
        </label>

        <label>
          MyOperator
          <select value={String(form.myoperatorEnabled)} onChange={(e) => update("myoperatorEnabled", e.target.value === "true")}>
            <option value="false">Disabled</option>
            <option value="true">Enabled</option>
          </select>
        </label>

        <label>
          AI Provider
          <select value={form.aiProvider || "OpenAI"} onChange={(e) => update("aiProvider", e.target.value)}>
            <option>OpenAI</option>
            <option>Gemini</option>
            <option>Claude</option>
            <option>Other</option>
          </select>
        </label>

        <label>
          AI API Key
          <input value={form.aiApiKey || ""} onChange={(e) => update("aiApiKey", e.target.value)} placeholder="Future ready" />
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
        <button className="btn btn3" onClick={save} disabled={loading}>Save Integration Settings</button>
        <button className="btn btn4" onClick={testWhatsApp} disabled={loading}>Test WhatsApp API</button>
        <button className="btn" onClick={importTemplates} disabled={loading}>Import BotSailor Templates</button>
        <button className="btn btn2" onClick={importFlows} disabled={loading}>Import BotSailor Flows</button>
      </div>

      {msg && <div className="notice" style={{ marginTop: 12 }}>{msg}</div>}

      <div style={boxStyle}>
        <b>Imported Templates: {templates.length}</b>
        <div className="small" style={{ marginTop: 6 }}>
          {templates.length
            ? templates.slice(0, 10).map((t) => `${t.template_name}${t.status ? ` (${t.status})` : ""}`).join(" · ")
            : "No template imported yet."}
        </div>
      </div>

      <div style={boxStyle}>
        <b>Imported Bot Flows: {flows.length}</b>
        <div className="small" style={{ marginTop: 6 }}>
          {flows.length ? flows.slice(0, 10).map((f) => f.name).join(" · ") : "No bot flow imported yet."}
        </div>
      </div>

      <div className="whatsappBox" style={{ marginTop: 16 }}>
        Integration settings are stored in PostgreSQL. After 24 hours, counselor can select an imported approved template from the Action Panel.
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
  const [filterPriority, setFilterPriority] = useState("all");

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
      const nd = {};
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
    setFilterPriority("all");
  }, [activeTab]);

  const filteredRows = useMemo(() => {
    if (["counselors", "automation", "integration", "pipeline"].includes(activeTab)) return [];

    let rows = data[activeTab] || [];
    if (user?.role === "Counselor") {
      rows = rows.filter((r) => String(r.owner || "").trim() === String(user.owner || "").trim());
    }

    if (filterStatus !== "all") rows = rows.filter((r) => String(r.status || "new") === filterStatus);
    if (filterPriority !== "all") {
      rows = rows.filter((r) => String(r.priority || "cold").trim().toLowerCase() === filterPriority);
    }

    if (!query.trim()) return rows;
    const q = query.toLowerCase();
    return rows.filter((row) => JSON.stringify(row).toLowerCase().includes(q));
  }, [data, activeTab, query, filterStatus, filterPriority, user]);

  const saveConfig = async (c) => {
    await api.post("/admin/config", c);
    await loadAll();
  };

  if (!user) return <Login onLogin={setUser} />;

  return (
    <div>
      <div className="top">
        <div className="row">
          <div>
            <h2 style={{ margin: 0 }}>Guruvidya CRM Phase 3</h2>
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
          {allTabs
            .filter((t) => !["counselors", "automation", "integration", "pipeline"].includes(t.key))
            .map((t) => {
              let rows = data[t.key] || [];
              if (user?.role === "Counselor") {
                rows = rows.filter((r) => String(r.owner || "").trim() === String(user.owner || "").trim());
              }
              return <Kpi key={t.key} title={t.label} value={rows.length} />;
            })}
        </div>

        {error && <div className="card" style={{ color: "#991b1b", marginBottom: 16 }}>{error}</div>}

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
        ) : activeTab === "pipeline" ? (
          <Pipeline ActionPanel={ActionPanel} onSaved={loadAll} />
        ) : (
          <>
            <div className="searchBar">
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={`Search ${activeTab} by any field`} />

              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                <option value="all">All Status</option>
                {(statusOptions[activeTab] || []).map((s) => <option key={s}>{s}</option>)}
              </select>

              <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}>
                <option value="all">All Priority</option>
                <option value="very hot">Very Hot 🔥</option>
                <option value="hot">Hot</option>
                <option value="warm">Warm</option>
                <option value="cold">Cold</option>
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
