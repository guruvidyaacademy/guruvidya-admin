import Pipeline from "./pages/Pipeline";
import { useEffect, useMemo, useState, useRef, Fragment } from "react";
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

const displayLabel = (value) => String(value || "").replace(/[_-]+/g, " ").replace(/\b\w/g, char => char.toUpperCase());
const badgeStyle = (background, color) => ({ display: "inline-block", padding: "5px 10px", borderRadius: 20, background, color, fontSize: 12, fontWeight: 700, lineHeight: 1.4 });
const StatusBadge = ({ status }) => {
  const value = String(status || "new").toLowerCase();
  const palette = /converted|completed|resolved|selected|confirmed/.test(value) ? ["#dcfce7", "#166534"]
    : /closed|cancelled|rejected|not_interested/.test(value) ? ["#fee2e2", "#991b1b"]
    : /pending|follow|hold|no_response/.test(value) ? ["#fef3c7", "#92400e"] : ["#dbeafe", "#1e40af"];
  return <span style={badgeStyle(...palette)}>{displayLabel(value)}</span>;
};
const PriorityBadge = ({ priority }) => {
  const value = String(priority || "cold").toLowerCase().replace(/_/g, " ");
  const palette = value === "very hot" ? ["#ffe4e6", "#9f1239"] : value === "hot" ? ["#ffedd5", "#9a3412"] : value === "warm" ? ["#fef3c7", "#92400e"] : ["#e0f2fe", "#075985"];
  return <span style={badgeStyle(...palette)}>{displayLabel(value)}</span>;
};

function formatLeadDate(value) {
  const date = new Date(value || "");
  if (!value) return "Not available";
  if (!Number.isFinite(date.getTime())) return String(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(String(value))) return new Date(String(value) + "T00:00:00+05:30").toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "long", year: "numeric" });
  return date.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "long", year: "numeric" }) + ", " + date.toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour: "numeric", minute: "2-digit", second: "2-digit", hour12: true }) + " IST";
}

function WhatsappWindowBadge({ row, panel = false }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  const last = new Date(row.last_customer_message_at || "").getTime();
  const known = Number.isFinite(last) && last <= now;
  const remaining = known ? last + 24 * 60 * 60 * 1000 - now : 0;
  const open = known && remaining > 0;
  const seconds = Math.max(0, Math.ceil(remaining / 1000));
  const countdown = [Math.floor(seconds / 3600), Math.floor(seconds / 60) % 60, seconds % 60].map(value => String(value).padStart(2, "0")).join(":");
  return (
    <div style={{ minWidth: 185 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#166534", fontSize: 14, fontWeight: 700, whiteSpace: "nowrap" }}>
      <span style={{ display: "inline-block", padding: "4px 9px", borderRadius: 12,
        background: open ? "#dcfce7" : known ? "#fee2e2" : "#f3f4f6", color: open ? "#166534" : known ? "#b91c1c" : "#4b5563", fontWeight: 700 }}>
        {open ? "OPEN" : known ? "CLOSED" : "UNKNOWN"}
      </span>
      {open && <><span>Inside 24H</span><span style={{ fontVariantNumeric: "tabular-nums" }}>{countdown}</span></>}
      </div>
      <div className="small">{known ? `${panel ? "Last customer message" : "Last message"}: ${formatLeadDate(last)}` : "No customer message time recorded"}</div>
      {open && <div className="small">Check BotSailor inbox</div>}
    </div>
  );
}

function LeadList({ rows, selectedId, onSelect, onSaved, tab = "leads", title }) {
  const sectionTitle = title || ({ leads: "Leads", admissions: "Admissions", appointments: "Appointments", support: "Support", faculty: "Faculty" }[tab]);
  const isLead = tab === "leads";
  const extraTitle = isLead ? "WhatsApp Window" : tab === "appointments" ? "Appointment Time" : tab === "faculty" ? "Mode / Created" : "Created";
  const detailFields = isLead ? [["created_at", "Original enquiry"], ["last_enquiry_at", "Latest enquiry"], ["next_followup", "Next follow-up"], ["enquiry_count", "Enquiry count"], ["source", "Source"], ["note", "Follow-up note"], ["admin_note", "Admin note"]]
    : tab === "admissions" ? [["email", "Email"], ["created_at", "Created"], ["next_followup", "Next follow-up"], ["admin_note", "Admin note"], ["note", "Follow-up note"]]
    : tab === "appointments" ? [["datetime", "Appointment time"], ["created_at", "Created"], ["next_followup", "Next follow-up"], ["note", "Follow-up note"]]
    : tab === "support" ? [["issue", "Issue"], ["description", "Description"], ["created_at", "Created"], ["note", "Follow-up note"]]
    : [["course", "Course"], ["mode", "Mode"], ["created_at", "Created"], ["admin_note", "Admin note"], ["note", "Follow-up note"]];
  const dateKeys = ["created_at", "last_enquiry_at", "next_followup", "datetime"];
  return <div className="lead-workspace">
    <style>{`
      .lead-workspace { background:#fff; border:1px solid #e2e8f0; border-radius:16px; box-shadow:0 6px 24px #0f172a08; overflow:hidden; color:#1e293b; }
      .lead-workspace .lead-heading { padding:18px 20px; border-bottom:1px solid #e2e8f0; display:flex; justify-content:space-between; gap:12px; flex-wrap:wrap; }
      .lead-workspace .lead-grid { display:grid; grid-template-columns:minmax(110px,1fr) minmax(125px,1fr) minmax(100px,.9fr) minmax(110px,.9fr) minmax(90px,.7fr) minmax(255px,1.6fr) 40px; gap:16px; align-items:center; }
      .lead-workspace .lead-labels { padding:12px 20px; background:#f8fafc; font-size:12px; font-weight:700; color:#64748b; }
      .lead-workspace .lead-summary { padding:18px 20px; border-top:1px solid #edf2f7; cursor:pointer; }
      .lead-workspace .lead-summary:hover { background:#f8fafc; }
      .lead-workspace .lead-summary.is-open { background:#eff6ff; box-shadow:inset 3px 0 #2563eb; }
      .lead-workspace .mobile-field-label { display:none; }
      .lead-workspace .lead-cell { min-width:0; overflow-wrap:anywhere; }
      .lead-workspace .small { color:#64748b; font-size:12px; line-height:1.6; }
      .lead-workspace .lead-toggle { width:36px; height:36px; border:1px solid #cbd5e1; border-radius:10px; background:white; color:#1d4ed8; cursor:pointer; font-size:20px; }
      .lead-workspace .lead-expanded { padding:20px; background:#f8fafc; border-top:1px solid #dbeafe; }
      .lead-workspace .lead-details { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:16px; padding:18px; background:#fff; border:1px solid #e2e8f0; border-radius:12px; margin-bottom:16px; overflow-wrap:anywhere; }
      .lead-workspace .lead-details p { margin:4px 0 0; white-space:pre-wrap; }
      .lead-workspace .lead-expanded > .card { margin:0; border:1px solid #e2e8f0; border-radius:12px; box-shadow:none; padding:20px; }
      .lead-workspace .actions { display:flex; flex-direction:column; gap:12px; }
      .lead-workspace .actions > label { display:block; max-width:100%; font-weight:500; }
      .lead-workspace select,.lead-workspace textarea,.lead-workspace input:not([type=checkbox]) { box-sizing:border-box; width:100%; border:1px solid #cbd5e1; border-radius:9px; padding:10px 12px; background:#fff; }
      .lead-workspace textarea { min-height:100px; }
      .lead-workspace .btn { border-radius:9px; }
      @media(max-width:1100px) { .lead-workspace .lead-grid { grid-template-columns:minmax(0,1fr) minmax(0,1fr); gap:14px; } .lead-workspace .lead-labels { display:none; } .lead-workspace .mobile-field-label { display:block; margin-bottom:4px; font-size:11px; color:#64748b; } .lead-workspace .lead-details { grid-template-columns:1fr; } .lead-workspace .lead-expanded { padding:12px; } }
      @media(max-width:620px) { .lead-workspace .lead-grid { grid-template-columns:minmax(0,1fr); } .lead-workspace .lead-summary { position:relative; padding-right:58px; } .lead-workspace .lead-toggle { position:absolute; top:16px; right:12px; } }
    `}</style>
    <div className="lead-heading"><b>{sectionTitle} <span className="small">({rows.length})</span></b><span className="small">Expand a record to view details and take action</span></div>
    <div className="lead-grid lead-labels"><span>{tab === "faculty" ? "Faculty Name" : "Name"}</span><span>Mobile Number</span><span>{tab === "support" ? "Issue" : "Course"}</span><span>Priority / Status</span><span>Assigned Owner</span><span>{extraTitle}</span><span /></div>
    {!rows.length && <div style={{ padding: 24 }}>No records found</div>}
    {rows.map(row => {
      const expanded = selectedId === row.id;
      return <Fragment key={row.id}>
        <div className={`lead-grid lead-summary ${expanded ? "is-open" : ""}`} onClick={() => onSelect(expanded ? null : row)}>
          <div className="lead-cell"><strong>{row.name || "Unnamed lead"}</strong><div className="small">{isLead ? "Lead" : "Record"} #{row.id}</div></div>
          <div className="lead-cell" style={{ fontVariantNumeric: "tabular-nums" }}><span className="mobile-field-label">Mobile Number</span>{row.mobile || "—"}</div>
          <div className="lead-cell"><span className="mobile-field-label">{tab === "support" ? "Issue" : "Course"}</span>{(tab === "support" ? row.issue : row.course) || "—"}</div>
          <div className="lead-cell"><span className="mobile-field-label">Priority / Status</span><PriorityBadge priority={row.priority} /><div style={{ marginTop: 6 }}><StatusBadge status={row.status} /></div></div>
          <div className="lead-cell"><span className="mobile-field-label">Assigned Owner</span>{row.owner || "Unassigned"}</div>
          <div className="lead-cell"><span className="mobile-field-label">{extraTitle}</span>{isLead ? <WhatsappWindowBadge row={row} /> : <>{tab === "faculty" && <div>{row.mode || "—"}</div>}<div className="small">{formatLeadDate(tab === "appointments" ? row.datetime : row.created_at)}</div></>}</div>
          <button type="button" className="lead-toggle" aria-expanded={expanded} aria-controls={`lead-panel-${row.id}`} aria-label={`${expanded ? "Collapse" : "Expand"} ${row.name || "lead"}`} onClick={event => { event.stopPropagation(); onSelect(expanded ? null : row); }}>{expanded ? "⌃" : "⌄"}</button>
        </div>
        {expanded && <section id={`lead-panel-${row.id}`} className="lead-expanded" aria-label={`Details for ${row.name || "lead"}`}>
          <h3 style={{ marginTop: 0 }}>{isLead ? "Lead" : "Record"} Details</h3>
          <div className="lead-details">
            {detailFields.map(([key, label]) => <div key={key}><span className="small">{label}</span><p>{dateKeys.includes(key) ? formatLeadDate(row[key]) : String(row[key] ?? "—")}</p></div>)}
          </div>
          <ActionPanel tab={tab} row={row} onSaved={onSaved} />
        </section>}
      </Fragment>;
    })}
  </div>;
}

function activityPayload(row) {
  if (row.payload && typeof row.payload === "object") return row.payload;
  try { const value = JSON.parse(row.payload || "{}"); return value && typeof value === "object" ? value : {}; } catch { return {}; }
}
function activityStatus(row) { return row.status || activityPayload(row).status || ""; }
function ActivityList({ tab, rows, selectedId, onSelect, onRelated }) {
  const [copyNotice, setCopyNotice] = useState("");
  useEffect(() => setCopyNotice(""), [tab, selectedId]);
  const copy = async (value) => { try { await navigator.clipboard.writeText(String(value)); setCopyNotice("Copied to clipboard."); } catch { setCopyNotice("Could not copy. Please select and copy the text manually."); } };
  const labels = { alerts: "Alerts", reminders: "Reminders", whatsapp_logs: "WhatsApp Logs" };
  return <div className="activity-workspace">
    <style>{`
      .activity-workspace { border:1px solid #e2e8f0; border-radius:16px; background:white; overflow:hidden; color:#1e293b; box-shadow:0 6px 24px #0f172a08; }
      .activity-workspace .activity-heading { padding:18px 20px; background:#f8fafc; border-bottom:1px solid #e2e8f0; }
      .activity-workspace .activity-row { display:grid; grid-template-columns:minmax(0,1.4fr) minmax(0,1fr) minmax(0,.8fr) minmax(0,1.2fr) 40px; gap:16px; padding:18px 20px; align-items:center; border-bottom:1px solid #edf2f7; cursor:pointer; }
      .activity-workspace .activity-row:hover { background:#f8fafc; }
      .activity-workspace .activity-row.expanded { background:#eff6ff; box-shadow:inset 3px 0 #2563eb; }
      .activity-workspace .activity-cell { min-width:0; overflow-wrap:anywhere; }
      .activity-workspace .activity-label { font-size:11px; font-weight:600; color:#64748b; margin-bottom:5px; }
      .activity-workspace .activity-small { font-size:12px; color:#64748b; line-height:1.6; }
      .activity-workspace .activity-panel { background:#f8fafc; padding:20px; }
      .activity-workspace .activity-details { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:16px; padding:18px; background:white; border:1px solid #e2e8f0; border-radius:12px; }
      .activity-workspace .activity-text { white-space:pre-wrap; overflow-wrap:anywhere; margin:0; font:inherit; line-height:1.6; }
      .activity-workspace .activity-content { background:white; border:1px solid #e2e8f0; border-radius:12px; padding:16px; margin-top:14px; }
      .activity-workspace button { border:1px solid #cbd5e1; background:white; padding:9px 13px; border-radius:9px; cursor:pointer; color:#334155; }
      .activity-workspace button.activity-primary { background:#2563eb; border-color:#2563eb; color:white; }
      .activity-workspace .activity-actions { display:flex; gap:10px; flex-wrap:wrap; margin-top:16px; }
      @media(max-width:850px) { .activity-workspace .activity-row { grid-template-columns:minmax(0,1fr) minmax(0,1fr); position:relative; padding-right:58px; } .activity-workspace .activity-arrow { position:absolute; right:12px; top:16px; } .activity-workspace .activity-details { grid-template-columns:1fr; } }
      @media(max-width:480px) { .activity-workspace .activity-row { grid-template-columns:minmax(0,1fr); } }
    `}</style>
    <div className="activity-heading"><strong>{labels[tab]} ({rows.length})</strong><div className="activity-small">Expand a record to view full details</div></div>
    {!rows.length && <div style={{ padding:24 }}>No matching records found.</div>}
    {rows.map(row => {
      const payload = activityPayload(row);
      const mobile = row.mobile || payload.mobile || "";
      const message = row.message || payload.message || "";
      const status = activityStatus(row);
      const expanded = selectedId === row.id;
      const overdue = tab === "reminders" && String(status).toLowerCase() === "pending" && row.due_date && new Date(row.due_date).getTime() < Date.now();
      const heading = tab === "alerts" ? row.title || "Alert" : tab === "reminders" ? row.name || "Reminder" : row.template || "WhatsApp message";
      const detail = tab === "alerts" ? displayLabel(row.type) : displayLabel(row.table_name);
      const table = row.table_name || payload.table_name || (/^(leads|admissions|appointments|support|faculty)_action$/.test(row.type || "") ? row.type.replace(/_action$/, "") : null);
      const recordId = row.record_id || payload.record_id || (/_action$/.test(row.type || "") ? payload.id : null);
      return <Fragment key={row.id}>
        <div className={`activity-row ${expanded ? "expanded" : ""}`} onClick={() => onSelect(expanded ? null : row)}>
          <div className="activity-cell"><div className="activity-label">{tab === "alerts" ? "Alert" : tab === "reminders" ? "Name / Reminder" : "Message / Template"}</div><strong>{heading}</strong><div className="activity-small">#{row.id} · {detail}</div></div>
          <div className="activity-cell"><div className="activity-label">Mobile Number</div>{mobile || "—"}{tab === "reminders" && <div className="activity-small">{row.owner || "Unassigned"}</div>}</div>
          <div className="activity-cell"><div className="activity-label">Status</div>{status ? <span style={badgeStyle(...(/^(sent|success|delivered|read|completed|done)$/i.test(status) ? ["#dcfce7", "#166534"] : /fail|error/i.test(status) ? ["#fee2e2", "#991b1b"] : /pending|queued/i.test(status) ? ["#fef3c7", "#92400e"] : ["#e2e8f0", "#334155"]))}>{displayLabel(status)}</span> : "—"}{overdue && <div style={{ color:"#b91c1c", fontWeight:700, marginTop:6 }}>Overdue</div>}</div>
          <div className="activity-cell"><div className="activity-label">{tab === "reminders" ? "Due Date" : "Created"}</div><div className="activity-small">{formatLeadDate(tab === "reminders" ? row.due_date : row.created_at)}</div></div>
          <button type="button" className="activity-arrow" aria-expanded={expanded} aria-controls={`activity-${tab}-${row.id}`} aria-label={`${expanded ? "Collapse" : "Expand"} record ${row.id}`} onClick={e => { e.stopPropagation(); onSelect(expanded ? null : row); }}>{expanded ? "⌃" : "⌄"}</button>
        </div>
        {expanded && <section className="activity-panel" id={`activity-${tab}-${row.id}`}>
          <h3 style={{ marginTop:0 }}>Record Details</h3>
          <div className="activity-details">
            <div><div className="activity-label">Created</div>{formatLeadDate(row.created_at)}</div>
            <div><div className="activity-label">Related Record</div>{table && recordId ? `${displayLabel(table)} #${recordId}` : "Not available"}</div>
            <div><div className="activity-label">Assigned Owner</div>{row.owner || payload.owner || "—"}</div>
          </div>
          {row.reason && <div className="activity-content"><div className="activity-label">Follow-up Reason</div><p className="activity-text">{displayLabel(row.reason)}</p></div>}
          {message && <div className="activity-content"><div className="activity-label">Full Message</div><p className="activity-text">{message}</p></div>}
          {(row.error || payload.error) && <div className="activity-content" style={{ color:"#991b1b" }}><div className="activity-label">Error Details</div><p className="activity-text">{typeof (row.error || payload.error) === "object" ? JSON.stringify(row.error || payload.error, null, 2) : String(row.error || payload.error)}</p></div>}
          {tab === "alerts" && <div className="activity-content"><div className="activity-label">Alert Details</div>{Object.entries(payload).filter(([key,value]) => !["message","error"].includes(key) && value != null && typeof value !== "object").map(([key,value]) => <p key={key} className="activity-text"><strong>{displayLabel(key)}:</strong> {String(value)}</p>)}<details style={{ marginTop:12 }}><summary>Technical Payload</summary><pre className="activity-text">{typeof row.payload === "string" && !Object.keys(payload).length ? row.payload : JSON.stringify(payload,null,2)}</pre></details></div>}
          <div className="activity-actions">
            {table && recordId && <button className="activity-primary" type="button" onClick={() => onRelated(table, recordId)}>View Related Record</button>}
            {mobile && <button type="button" onClick={() => copy(mobile)}>Copy Number</button>}
            {message && <button type="button" onClick={() => copy(message)}>Copy Message</button>}
          </div>
          <div role="status" className="activity-small">{copyNotice}</div>
        </section>}
      </Fragment>;
    })}
  </div>;
}

function DataTable({ tab, rows, selectedId, onSelect }) {
  if (!rows.length) return <div className="card">No data found</div>;

  const map = {
    leads: ["id", "name", "mobile", "whatsapp_window", "course", "priority", "status", "owner", "source", "note", "created_at"],
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
          <tr>{headers.map((h) => <th key={h}>{h === "whatsapp_window" ? "WhatsApp Window" : h}</th>)}</tr>
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
                  {h === "whatsapp_window" ? (
                    <WhatsappWindowBadge row={row} />
                  ) : h === "status" ? (
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

  const [flows, setFlows] = useState([]);
  const [whatsappFlowId, setWhatsappFlowId] = useState("");
  const [sending, setSending] = useState(false);
  const [sendMsg, setSendMsg] = useState("");
  const [sendAttempted, setSendAttempted] = useState(false);
  const sendLock = useRef(false);
  const saveLock = useRef(false);
  const requestKey = useRef(null);
  const activeRecipient = useRef("");
  activeRecipient.current = `${tab}:${row?.id || ""}`;

  const [, updateWindowClock] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => updateWindowClock(value => value + 1), 30000);
    return () => clearInterval(timer);
  }, []);

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
    setWhatsappFlowId("");
    setSendMsg("");
    setSendAttempted(false);
    requestKey.current = null;
    setMsg("");
  }, [row, tab]);

  useEffect(() => {
    api.get("/admin/botsailor/templates")
      .then((res) => setTemplates(res.data?.data || []))
      .catch(() => setTemplates([]));
    api.get("/admin/botsailor/flows")
      .then((res) => setFlows(res.data?.data || []))
      .catch(() => setFlows([]));
  }, []);

  if (!row) {
    return <div className="card">Select a row to update status, owner, priority, reminders, or WhatsApp.</div>;
  }

  const save = async (close = false) => {
    if (saveLock.current || sendLock.current) return;
    saveLock.current = true;
    setSaving(true);
    setMsg("");

    try {
      const res = await api.post(`/admin/${tab}/${row.id}/action`, {
        status: close ? "closed" : status,
        owner,
        priority,
        note: close ? note || "Closed / Archived" : note,
        sendNotification,
        sendWhatsapp: false,
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
      saveLock.current = false;
      setSaving(false);
    }
  };

  const selectedFlow = flows.find((f) => String(f.unique_id) === whatsappFlowId);
  const selectedTemplate = templates.find((t) => String(t.id) === whatsappTemplateId);
  const flowMode = ["flow", "message_flow"].includes(whatsappMode);
  const templateApproved = selectedTemplate && String(selectedTemplate.status).trim().toLowerCase() === "approved";
  const sendBlocked = sending || saving || sendAttempted ||
    (whatsappMode !== "template" && tab === "leads" && !windowOpen) ||
    (flowMode && !selectedFlow) ||
    (whatsappMode === "template" && !templateApproved) ||
    (["message", "message_flow"].includes(whatsappMode) && !whatsappMessage.trim());

  const sendNow = async () => {
    if (sendLock.current || saveLock.current || sendBlocked) return;
    let variables = {};
    if (whatsappMode === "template") {
      try { variables = JSON.parse(templateVariables); }
      catch { setSendMsg("Template variables must be valid JSON."); return; }
      if (!variables || Array.isArray(variables) || typeof variables !== "object") {
        setSendMsg("Template variables must be a JSON object."); return;
      }
    }
    if (!window.confirm(`Send ${whatsappMode} to ${row.name || "Student"} (${row.mobile}) now? Lead details will not be saved.`)) return;
    const recipient = activeRecipient.current;
    sendLock.current = true;
    setSending(true);
    setSendMsg("");
    try {
      requestKey.current ||= globalThis.crypto.randomUUID();
      const res = await api.post(`/admin/${tab}/${row.id}/whatsapp`, {
        requestId: requestKey.current, whatsappMode, whatsappMessage,
        whatsappTemplateId, templateVariables: variables, whatsappFlowId,
      });
      if (activeRecipient.current === recipient) setSendMsg(res.data?.message || "Check WhatsApp logs for the result.");
    } catch (e) {
      if (activeRecipient.current === recipient) setSendMsg(e.response?.data?.message || "Send outcome unknown. Check WhatsApp logs before retrying.");
    } finally {
      setSending(false);
      if (activeRecipient.current === recipient) setSendAttempted(true);
      sendLock.current = false;
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
            <div style={{ marginBottom: 6 }}>WhatsApp 24h window</div>
            <WhatsappWindowBadge row={row} panel />
          </div>
        )}

        <label>
          Priority
          <select value={priority} onChange={(e) => setPriority(e.target.value)}>
            {priorities.map((s) => <option key={s} value={s}>{displayLabel(s)}</option>)}
          </select>
        </label>

        <label>
          Status
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            {(statusOptions[tab] || [row.status || "new"]).map((s) => <option key={s} value={s}>{displayLabel(s)}</option>)}
          </select>
        </label>

        <label>
          Assign Owner
          <select value={owner} onChange={(e) => setOwner(e.target.value)}>
            {owners.map((c) => <option key={c}>{c}</option>)}
          </select>
        </label>

        <h4 style={{ margin: "12px 0 0" }}>Follow-up</h4>
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
            <h4 style={{ marginTop: 0 }}>Send WhatsApp</h4>
            <label>
              WhatsApp Send Type
              <select value={whatsappMode} onChange={(e) => setWhatsappMode(e.target.value)}>
                <option value="message">Normal Message (24h window)</option>
                <option value="template">Approved BotSailor Template</option>
                <option value="flow">Send Flow Directly (24h window)</option>
                <option value="message_flow">Message + Flow Button (24h window)</option>
              </select>
            </label>

            {whatsappMode !== "template" ? (
              <>
                {tab === "leads" && !windowOpen && (
                  <div className="notice" style={{ marginTop: 8 }}>
                    The 24-hour WhatsApp window is closed. Normal messages cannot be sent. Please select an approved template.
                  </div>
                )}
                {whatsappMode !== "flow" && <label>
                  WhatsApp Message
                  <textarea rows="7" value={whatsappMessage} onChange={(e) => setWhatsappMessage(e.target.value)} />
                </label>}
                {flowMode && <label>
                  BotSailor Flow
                  <select value={whatsappFlowId} onChange={(e) => setWhatsappFlowId(e.target.value)}>
                    <option value="">Select imported flow</option>
                    {flows.map((f) => <option key={f.unique_id || f.id} value={f.unique_id}>{f.name || f.unique_id}</option>)}
                  </select>
                </label>}
                {tab !== "leads" && <div className="small">Server will verify the 24-hour window using the latest matching lead. Unknown/closed windows are blocked.</div>}
              </>
            ) : (
              <>
                <label>
                  BotSailor Template
                  <select value={whatsappTemplateId} onChange={(e) => setWhatsappTemplateId(e.target.value)}>
                    <option value="">Select imported template</option>
                    {templates.map((t) => (
                      <option key={t.id} value={t.id} disabled={String(t.status).trim().toLowerCase() !== "approved"}>
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
            <div className="notice" style={{ marginTop: 10, whiteSpace: "pre-wrap" }}>
              <b>Send preview · {row.name || "Student"} · {row.mobile}</b>
              {whatsappMode === "template" ? <div>
                Template: {selectedTemplate?.template_name || "Select template"}
                <div>{selectedTemplate?.body_content || "Template body preview unavailable"}</div>
                <div>Variables: {templateVariables}</div>
              </div> : <div>
                {whatsappMode !== "flow" && <div>{whatsappMessage.replaceAll("{{name}}", row.name || "Student").replaceAll("{{course}}", row.course || "").replaceAll("{{mobile}}", row.mobile || "").replaceAll("{{owner}}", row.owner || "")}</div>}
                {flowMode && <div>{whatsappMode === "flow" ? "Start flow immediately: " : "Button (starts flow on click): "}{whatsappMode === "flow" ? selectedFlow?.name : String(selectedFlow?.name || "").slice(0, 20)}</div>}
              </div>}
            </div>
            <button className="btn btn3" disabled={sendBlocked} onClick={sendNow}>
              {sending ? "Sending…" : "Send WhatsApp Now"}
            </button>
            {sendMsg && <div className="notice">{sendMsg}</div>}
            {sendAttempted && <button className="btn" disabled={sending} onClick={() => {
              if (window.confirm("Check WhatsApp logs first. A new send may duplicate the previous message. Start a new send?")) {
                requestKey.current = null; setSendAttempted(false); setSendMsg("");
              }
            }}>Prepare another send</button>}
            <div className="small">Sending does not save lead changes or change automation settings.</div>
          </div>
        )}

        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn btn3" onClick={() => save(false)} disabled={saving || sending}>
            Save Action
          </button>
          <button className="btn btnDanger" onClick={() => save(true)} disabled={saving || sending}>
            Mark Closed
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
  const [ctaTemplates, setCtaTemplates] = useState([]);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [testMobile, setTestMobile] = useState("");
  const [testName, setTestName] = useState("Test Student");
  const [testCourse, setTestCourse] = useState("ACCA Complete Course");
  const [testStage, setTestStage] = useState("3h");

  useEffect(() => setLocal(config || {}), [config]);

  const loadCtaOptions = async () => {
    try {
      const res = await api.get("/admin/call-for-admission-options");
      const d = res.data?.data || {};

      setFlows(d.flows || []);
      setCtaTemplates(d.templates || []);

      setLocal((prev) => ({
        ...prev,
        callForAdmissionActionMode:
          prev.callForAdmissionActionMode || d.mode || "template",
        callForAdmissionFlowUniqueId:
          prev.callForAdmissionFlowUniqueId || d.selectedFlowUniqueId || "",
        callForAdmissionTemplateId:
          prev.callForAdmissionTemplateId || d.selectedTemplateId || "",
        callForAdmissionTemplateCustomTitle:
          prev.callForAdmissionTemplateCustomTitle || d.templateCustomTitle || "Call for Admission",
      }));
    } catch {
      // Fallback to the existing import-list endpoints.
      try {
        const [f, t] = await Promise.all([
          api.get("/admin/botsailor/flows"),
          api.get("/admin/botsailor/templates"),
        ]);
        setFlows(f.data?.data || []);
        setCtaTemplates(t.data?.data || []);
      } catch {
        setFlows([]);
        setCtaTemplates([]);
      }
    }
  };

  useEffect(() => {
    loadCtaOptions();
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

  const sendTestOnly = async () => {
    const mobile = String(testMobile || "").replace(/\D/g, "");
    if (mobile.length < 10) {
      setMsg("Please enter a valid test mobile number.");
      return;
    }

    setLoading(true);
    setMsg("");
    try {
      const res = await api.post("/admin/automation/test-mobile", {
        mobile,
        name: testName,
        course: testCourse,
        stage: testStage,
        settings: local,
      });

      setMsg(
        `${res.data?.message || "Test sent"} — Only test mobile ${mobile} was targeted. Live Automation settings were not changed.`
      );
    } catch (e) {
      setMsg(e.response?.data?.message || "Test-only WhatsApp send failed.");
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
          Follow-up CTA — Direct Action Mode
          <select
            value={local.callForAdmissionActionMode || "template"}
            onChange={(e) =>
              setLocal({
                ...local,
                callForAdmissionActionMode: e.target.value,
              })
            }
          >
            <option value="off">OFF — Send normal CRM follow-up only</option>
            <option value="flow">Use Existing BotSailor Flow</option>
            <option value="template">Use Existing BotSailor Template</option>
          </select>
        </label>

        {(local.callForAdmissionActionMode || "template") === "flow" && (
          <label>
            Existing BotSailor Flow
            <select
              value={local.callForAdmissionFlowUniqueId || ""}
              onChange={(e) =>
                setLocal({
                  ...local,
                  callForAdmissionFlowUniqueId: e.target.value,
                })
              }
            >
              <option value="">Select BotSailor flow</option>
              {flows.map((f) => (
                <option
                  key={f.unique_id || f.id}
                  value={f.unique_id || ""}
                >
                  {f.name || f.unique_id}
                </option>
              ))}
            </select>
          </label>
        )}

        {(local.callForAdmissionActionMode || "template") === "template" && (
          <label>
            Existing BotSailor Template
            <select
              value={local.callForAdmissionTemplateId || ""}
              onChange={(e) =>
                setLocal({
                  ...local,
                  callForAdmissionTemplateId: e.target.value,
                })
              }
            >
              <option value="">Select imported template</option>
              {ctaTemplates.map((t) => (
                <option
                  key={t.id || t.botsailor_id}
                  value={t.id || t.botsailor_id || ""}
                >
                  {t.template_name || "Template"}
                  {t.status ? ` (${t.status})` : ""}
                </option>
              ))}
            </select>
          </label>
        )}

        {(local.callForAdmissionActionMode || "template") === "template" && (
          <label>
            Template Custom Title
            <input
              value={(local.callForAdmissionTemplateCustomTitle || "").slice(0, 20)}
              maxLength={20}
              onChange={(e) =>
                setLocal({
                  ...local,
                  callForAdmissionTemplateCustomTitle: e.target.value.slice(0, 20),
                })
              }
              placeholder="Example: Call for Admission"
            />
            <span className="small">{(local.callForAdmissionTemplateCustomTitle || "").slice(0, 20).length}/20 characters — WhatsApp reply button limit.</span>
          </label>
        )}

        <div className="notice">
          OFF: sirf normal CRM follow-up message jayega. Flow: CRM follow-up ke niche selected flow ka existing title dikhega, phir flow trigger hoga.
          Template: CRM follow-up ke niche editable custom title dikhega, phir selected approved template send hoga.
        </div>
      </div>

      <div style={boxStyle}>
        <h4 style={{ marginTop: 0 }}>3 Hour Follow-up</h4>
        <div className="configGrid">
          <label>Enabled {toggle("followup3Enabled")}</label>
          <label>
            Send after hours
            <input type="number" min="1" value={local.followup3Hours ?? 3} onChange={(e) => setLocal({ ...local, followup3Hours: Number(e.target.value) })} />
          </label>
          <label>Use Direct CTA Action {toggle("followup3UseCallButton")}</label>
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
          <label>Use Direct CTA Action {toggle("followup6UseCallButton")}</label>
          <label>
            Use Same CTA as 3 Hour
            <select
              value={String(local.followup6UseSameCtaAs3 ?? true)}
              onChange={(e) => setLocal({ ...local, followup6UseSameCtaAs3: e.target.value === "true" })}
            >
              <option value="true">ON — Same as 3 Hour</option>
              <option value="false">OFF — Use Custom 6 Hour CTA</option>
            </select>
          </label>
        </div>

        {(local.followup6UseSameCtaAs3 ?? true) ? (
          <div className="notice" style={{ marginTop: 8 }}>
            6 Hour CTA 3 Hour ka same Flow / Template / title use karega.
          </div>
        ) : (
          <div className="configGrid" style={{ marginTop: 10 }}>
            <label>
              6 Hour CTA Action Mode
              <select value={local.followup6CtaActionMode || "template"} onChange={(e) => setLocal({ ...local, followup6CtaActionMode: e.target.value })}>
                <option value="off">OFF — Normal follow-up only</option>
                <option value="flow">Use Existing BotSailor Flow</option>
                <option value="template">Use Existing BotSailor Template</option>
              </select>
            </label>

            {(local.followup6CtaActionMode || "template") === "flow" && (
              <label>
                6 Hour BotSailor Flow
                <select value={local.followup6CtaFlowUniqueId || ""} onChange={(e) => setLocal({ ...local, followup6CtaFlowUniqueId: e.target.value })}>
                  <option value="">Select BotSailor flow</option>
                  {flows.map((f) => <option key={f.unique_id || f.id} value={f.unique_id || ""}>{f.name || f.unique_id}</option>)}
                </select>
              </label>
            )}

            {(local.followup6CtaActionMode || "template") === "template" && (
              <>
                <label>
                  6 Hour BotSailor Template
                  <select value={local.followup6CtaTemplateId || ""} onChange={(e) => setLocal({ ...local, followup6CtaTemplateId: e.target.value })}>
                    <option value="">Select imported template</option>
                    {ctaTemplates.map((t) => <option key={t.id || t.botsailor_id} value={t.id || t.botsailor_id || ""}>{t.template_name || "Template"}{t.status ? ` (${t.status})` : ""}</option>)}
                  </select>
                </label>
                <label>
                  6 Hour Template Custom Title
                  <input value={(local.followup6CtaTemplateCustomTitle || "").slice(0, 20)} maxLength={20} onChange={(e) => setLocal({ ...local, followup6CtaTemplateCustomTitle: e.target.value.slice(0, 20) })} placeholder="Example: New Batch Info" />
                  <span className="small">{(local.followup6CtaTemplateCustomTitle || "").slice(0, 20).length}/20 characters — WhatsApp reply button limit.</span>
                </label>
              </>
            )}
          </div>
        )}

        <div className="notice" style={{ marginTop: 8 }}>
          Use Direct CTA Action OFF hone par bhi 6 Hour CTA configuration visible rahegi. OFF sirf WhatsApp me CTA button bhejna band karta hai.
        </div>
        <textarea rows="7" value={local.followup6Message || ""} onChange={(e) => setLocal({ ...local, followup6Message: e.target.value })} />
      </div>

      <div style={boxStyle}>
        <h4 style={{ marginTop: 0 }}>9 Hour Follow-up</h4>
        <div className="configGrid">
          <label>Enabled {toggle("followup9Enabled")}</label>
          <label>
            Send after hours
            <input type="number" min="1" value={local.followup9Hours ?? 6} onChange={(e) => setLocal({ ...local, followup9Hours: Number(e.target.value) })} />
          </label>
          <label>Use Direct CTA Action {toggle("followup9UseCallButton")}</label>
          <label>
            Use Same CTA as 3 Hour
            <select
              value={String(local.followup9UseSameCtaAs3 ?? true)}
              onChange={(e) => setLocal({ ...local, followup9UseSameCtaAs3: e.target.value === "true" })}
            >
              <option value="true">ON — Same as 3 Hour</option>
              <option value="false">OFF — Use Custom 9 Hour CTA</option>
            </select>
          </label>
        </div>

        {(local.followup9UseSameCtaAs3 ?? true) ? (
          <div className="notice" style={{ marginTop: 8 }}>
            9 Hour CTA 3 Hour ka same Flow / Template / title use karega.
          </div>
        ) : (
          <div className="configGrid" style={{ marginTop: 10 }}>
            <label>
              9 Hour CTA Action Mode
              <select value={local.followup9CtaActionMode || "template"} onChange={(e) => setLocal({ ...local, followup9CtaActionMode: e.target.value })}>
                <option value="off">OFF — Normal follow-up only</option>
                <option value="flow">Use Existing BotSailor Flow</option>
                <option value="template">Use Existing BotSailor Template</option>
              </select>
            </label>

            {(local.followup9CtaActionMode || "template") === "flow" && (
              <label>
                9 Hour BotSailor Flow
                <select value={local.followup9CtaFlowUniqueId || ""} onChange={(e) => setLocal({ ...local, followup9CtaFlowUniqueId: e.target.value })}>
                  <option value="">Select BotSailor flow</option>
                  {flows.map((f) => <option key={f.unique_id || f.id} value={f.unique_id || ""}>{f.name || f.unique_id}</option>)}
                </select>
              </label>
            )}

            {(local.followup9CtaActionMode || "template") === "template" && (
              <>
                <label>
                  9 Hour BotSailor Template
                  <select value={local.followup9CtaTemplateId || ""} onChange={(e) => setLocal({ ...local, followup9CtaTemplateId: e.target.value })}>
                    <option value="">Select imported template</option>
                    {ctaTemplates.map((t) => <option key={t.id || t.botsailor_id} value={t.id || t.botsailor_id || ""}>{t.template_name || "Template"}{t.status ? ` (${t.status})` : ""}</option>)}
                  </select>
                </label>
                <label>
                  9 Hour Template Custom Title
                  <input value={(local.followup9CtaTemplateCustomTitle || "").slice(0, 20)} maxLength={20} onChange={(e) => setLocal({ ...local, followup9CtaTemplateCustomTitle: e.target.value.slice(0, 20) })} placeholder="Example: Admission Update" />
                  <span className="small">{(local.followup9CtaTemplateCustomTitle || "").slice(0, 20).length}/20 characters — WhatsApp reply button limit.</span>
                </label>
              </>
            )}
          </div>
        )}

        <div className="notice" style={{ marginTop: 8 }}>
          Use Direct CTA Action OFF hone par bhi 9 Hour CTA configuration visible rahegi. OFF sirf WhatsApp me CTA button bhejna band karta hai.
        </div>
        <textarea rows="7" value={local.followup9Message || ""} onChange={(e) => setLocal({ ...local, followup9Message: e.target.value })} />
      </div>

      <div style={boxStyle}>
        <h4 style={{ marginTop: 0 }}>24-hour Window Closing Message</h4>
        <div className="configGrid">
          <label>Enabled {toggle("windowClosingEnabled")}</label>
          <label>Use Direct CTA Action {toggle("windowClosingUseCallButton")}</label>
          <label>Use Same CTA as 3 Hour {toggle("windowClosingUseSameCtaAs3")}</label>
          <label>
            Send before window closes (hours)
            <input type="number" min="1" max="12" value={local.windowClosingHoursBefore ?? 3} onChange={(e) => setLocal({ ...local, windowClosingHoursBefore: Number(e.target.value) })} />
          </label>
        </div>
        {local.windowClosingUseSameCtaAs3 ? <div className="notice">3 Hour ka selected Flow / Template / title use hoga.</div> : (
          <div className="configGrid">
            <label>Window Closing CTA Action Mode
              <select value={local.windowClosingCtaActionMode || "off"} onChange={(e) => setLocal({ ...local, windowClosingCtaActionMode: e.target.value })}>
                <option value="off">OFF — Normal message only</option>
                <option value="flow">Use Existing BotSailor Flow</option>
                <option value="template">Use Existing BotSailor Template</option>
              </select>
            </label>
            {local.windowClosingCtaActionMode === "flow" && <label>Window Closing BotSailor Flow
              <select value={local.windowClosingCtaFlowUniqueId || ""} onChange={(e) => setLocal({ ...local, windowClosingCtaFlowUniqueId: e.target.value })}>
                <option value="">Select BotSailor flow</option>
                {flows.map((f) => <option key={f.unique_id || f.id} value={f.unique_id || ""}>{f.name || f.unique_id}</option>)}
              </select>
            </label>}
            {local.windowClosingCtaActionMode === "template" && <>
              <label>Window Closing BotSailor Template
                <select value={local.windowClosingCtaTemplateId || ""} onChange={(e) => setLocal({ ...local, windowClosingCtaTemplateId: e.target.value })}>
                  <option value="">Select imported template</option>
                  {ctaTemplates.map((t) => <option key={t.id || t.botsailor_id} value={t.id || t.botsailor_id || ""}>{t.template_name || "Template"}{t.status ? ` (${t.status})` : ""}</option>)}
                </select>
              </label>
              <label>Window Closing Template Custom Title
                <input maxLength={20} value={(local.windowClosingCtaTemplateCustomTitle || "").slice(0, 20)} onChange={(e) => setLocal({ ...local, windowClosingCtaTemplateCustomTitle: e.target.value.slice(0, 20) })} />
                <span className="small">Maximum 20 characters</span>
              </label>
            </>}
          </div>
        )}
        <textarea rows="8" value={local.windowClosingMessage || ""} onChange={(e) => setLocal({ ...local, windowClosingMessage: e.target.value })} />
        <div className="notice" style={{ marginTop: 8 }}>
          Ye special message quiet hours (12 AM–9 AM) me bhi ja sakta hai, sirf jab current 24h window close hone wali ho.
        </div>
      </div>

      <div style={{ ...boxStyle, border: "2px solid #2563eb" }}>
        <h4 style={{ marginTop: 0 }}>Safe Test Only — Single Mobile</h4>
        <div className="notice" style={{ marginBottom: 10 }}>
          Send Test Only current screen ki settings se sirf niche diye mobile par test bhejega. Live settings save nahi hongi. Background automation ON hai to woh independently chalti rahegi; use rokne ke liye Auto Follow-up OFF karke Save karein.
        </div>
        <div className="configGrid">
          <label>
            Test Mobile (with country code)
            <input value={testMobile} onChange={(e) => setTestMobile(e.target.value)} placeholder="919599401607" />
          </label>
          <label>
            Test Stage
            <select value={testStage} onChange={(e) => setTestStage(e.target.value)}>
              <option value="3h">3 Hour Follow-up</option>
              <option value="6h">6 Hour Follow-up</option>
              <option value="9h">9 Hour Follow-up</option>
              <option value="window">24h Window Closing Message</option>
            </select>
          </label>
          <label>
            Test Name
            <input value={testName} onChange={(e) => setTestName(e.target.value)} />
          </label>
          <label>
            Test Course
            <input value={testCourse} onChange={(e) => setTestCourse(e.target.value)} />
          </label>
        </div>
        <button className="btn btn2" onClick={sendTestOnly} disabled={loading || !testMobile}>
          Send Test Only
        </button>
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
        <button className="btn btn3" onClick={save} disabled={loading}>Save Automation Settings</button>
        <button className="btn btn4" onClick={runNow} disabled={loading}>Run Automation Check Now</button>
        <button className="btn btn2" onClick={loadCtaOptions} disabled={loading}>Refresh CTA Flows / Templates</button>
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
  const [flowDataStatus, setFlowDataStatus] = useState({ total: 0, imported: 0, pending: 0, flows: [] });
  const [selectedFlowFiles, setSelectedFlowFiles] = useState([]);
  const [flowImportResults, setFlowImportResults] = useState([]);
  const [integrationLoaded, setIntegrationLoaded] = useState(false);
  const [integrationError, setIntegrationError] = useState("");
  const [importLoadError, setImportLoadError] = useState("");

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const loadIntegration = async () => {
    setIntegrationLoaded(false);
    try {
      const res = await api.get("/admin/integrations");
      if (!res.data?.data) throw new Error("Missing integration settings");
      setForm((prev) => ({ ...prev, ...res.data.data }));
      setIntegrationLoaded(true);
      setIntegrationError("");
    } catch {
      setIntegrationError("Settings load failed. Save is disabled to protect saved settings. Retry loading.");
    }
  };

  const loadImported = async () => {
    try {
      const [t, f, s] = await Promise.allSettled([
        api.get("/admin/botsailor/templates"),
        api.get("/admin/botsailor/flows"),
        api.get("/admin/botsailor-flow-data/status"),
      ]);
      if (t.status === "fulfilled") setTemplates(t.value.data?.data || []);
      if (f.status === "fulfilled") setFlows(f.value.data?.data || []);
      if (s.status === "fulfilled") setFlowDataStatus({
        total: s.value.data?.total || 0,
        imported: s.value.data?.imported || 0,
        pending: s.value.data?.pending || 0,
        flows: s.value.data?.flows || [],
      });
      const failed = [t, f, s].map((result, index) => result.status === "rejected" ? ["Templates", "Flows", "Flow data status"][index] : null).filter(Boolean);
      setImportLoadError(failed.length ? `${failed.join(", ")} could not load. Displayed counts may be incomplete. Retry loading.` : "");
    } catch {
      setImportLoadError("Import lists could not load. Retry loading.");
    }
  };

  useEffect(() => {
    loadIntegration();
    loadImported();
  }, []);

  const save = async () => {
    if (!integrationLoaded) return;
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

  const importFlowDataFiles = async () => {
    if (!selectedFlowFiles.length) {
      setMsg("Pehle BotSailor ke Export Flow Data TXT/JSON files select karein.");
      return;
    }

    setLoading(true);
    setMsg("");
    setFlowImportResults([]);
    try {
      const flowsToImport = await Promise.all(
        selectedFlowFiles.map(async (file) => ({
          fileName: file.name,
          flowData: await file.text(),
        }))
      );
      const res = await api.post("/admin/botsailor-flow-data/import-bulk", {
        flows: flowsToImport,
      });
      setFlowImportResults(res.data?.results || []);
      setMsg(res.data?.message || "Flow Data import completed");
      setSelectedFlowFiles([]);
      await loadImported();
    } catch (e) {
      const data = e.response?.data;
      setFlowImportResults(data?.results || []);
      setMsg(data?.message || "Flow Data import failed.");
      await loadImported();
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
        <button className="btn btn3" onClick={save} disabled={loading || !integrationLoaded}>Save Integration Settings</button>
        {(integrationError || importLoadError) && <div role="alert">
          {integrationError && <p>{integrationError}</p>}
          {importLoadError && <p>{importLoadError}</p>}
          <button className="btn" type="button" onClick={() => { loadIntegration(); loadImported(); }}>Retry loading</button>
        </div>}
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

      <div style={boxStyle}>
        <div className="row" style={{ alignItems: "flex-start", gap: 12 }}>
          <div>
            <b>BotSailor Full Flow Data (TXT/JSON)</b>
            <div className="small" style={{ marginTop: 6 }}>
              Export Flow Data files ek saath select karein. Same flow dobara upload karne par edited version overwrite ho jayega.
            </div>
          </div>
          <span className="tag">
            Imported {flowDataStatus.imported}/{flowDataStatus.total} · Pending {flowDataStatus.pending}
          </span>
        </div>

        <input
          type="file"
          multiple
          accept=".txt,.json,text/plain,application/json"
          onChange={(e) => setSelectedFlowFiles(Array.from(e.target.files || []))}
          style={{ marginTop: 14 }}
        />

        <div className="small" style={{ marginTop: 8 }}>
          {selectedFlowFiles.length
            ? `${selectedFlowFiles.length} file(s) selected: ${selectedFlowFiles.map((file) => file.name).join(" · ")}`
            : "No Flow Data file selected."}
        </div>

        <button
          className="btn btn3"
          onClick={importFlowDataFiles}
          disabled={loading || !selectedFlowFiles.length}
          style={{ marginTop: 12 }}
        >
          Import Selected Flow Data Files
        </button>

        {flowImportResults.length > 0 && (
          <div style={{ marginTop: 12 }}>
            {flowImportResults.map((item, index) => (
              <div key={`${item.fileName}-${index}`} className="small" style={{ marginTop: 5 }}>
                {item.success ? "✅" : "❌"} {item.fileName}
                {item.title ? ` → ${item.title}` : ""}
                {item.nodeCount ? ` (${item.nodeCount} nodes)` : ""}
                {!item.success && item.message ? ` — ${item.message}` : ""}
              </div>
            ))}
          </div>
        )}

        <div style={{ marginTop: 14, maxHeight: 260, overflowY: "auto" }}>
          {(flowDataStatus.flows || []).map((flow) => (
            <div key={flow.unique_id || flow.id} className="small" style={{ marginTop: 5 }}>
              {flow.flow_data_imported ? "✅" : "⚠️"} {flow.name}
              {flow.flow_data_imported
                ? ` — Data imported (${flow.flow_node_count || 0} nodes)${flow.flow_data_source_file ? ` · ${flow.flow_data_source_file}` : ""}`
                : " — TXT/JSON pending"}
            </div>
          ))}
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

  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(null);
  const [pipelineSnapshot, setPipelineSnapshot] = useState(null);
  const refreshPromise = useRef(null);
  const activeTabRef = useRef(activeTab);
  activeTabRef.current = activeTab;
  const pendingRelated = useRef(null);
  const [filterType, setFilterType] = useState("all");
  const activityTab = ["alerts", "reminders", "whatsapp_logs"].includes(activeTab);

  const tabs = user ? allTabs.filter((t) => user.access.includes(t.key)) : [];

  const logout = () => {
    localStorage.removeItem("guruvidya_user");
    setUser(null);
  };

  const loadAll = () => {
    if (refreshPromise.current) return refreshPromise.current;
    setRefreshing(true);
    setError("");
    const work = (async () => {
      const keys = ["leads", "admissions", "appointments", "support", "faculty", "alerts", "reminders", "whatsapp_logs"];
      const endpoints = [...keys.map(key => `/admin/${key}`), "/admin/counselor-stats", "/admin/config", "/admin/pipeline"];
      const results = await Promise.allSettled(endpoints.map(url => api.get(url, { params: { _refresh: Date.now() }, timeout: 90000 })));
      const updates = {};
      const failed = [];
      results.forEach((result, index) => {
        if (result.status !== "fulfilled" || result.value.data?.success === false || result.value.data?.data == null) { failed.push(endpoints[index].replace("/admin/", "")); return; }
        const value = result.value.data.data;
        if (index < keys.length) {
          if (Array.isArray(value)) updates[keys[index]] = value;
          else failed.push(keys[index]);
        } else if (index === keys.length) setStats(value);
        else if (index === keys.length + 1) setConfig(value);
        else setPipelineSnapshot({ data:value, refreshedAt:Date.now() });
      });
      setData(previous => ({ ...previous, ...updates }));
      setSelected(current => current && updates[activeTabRef.current] ? updates[activeTabRef.current].find(item => Number(item.id) === Number(current.id)) || null : current);
      if (failed.length) setError(`Could not refresh: ${failed.map(displayLabel).join(", ")}. Other sections updated; previous data kept for failed sections. Please retry.`);
      else setLastRefreshed(Date.now());
    })().catch(() => setError("Refresh failed. Previous data has been kept. Please retry."))
      .finally(() => { setRefreshing(false); refreshPromise.current = null; });
    refreshPromise.current = work;
    return work;
  };

  const openRelated = (table, id) => {
    if (!["leads", "admissions", "appointments", "support", "faculty"].includes(table) || !user.access.includes(table)) { setError("This related record is not available for your role."); return; }
    const record = (data[table] || []).find(item => Number(item.id) === Number(id) && (user.role !== "Counselor" || item.owner === user.owner));
    if (!record) { setError("Related record not found in loaded data. Refresh All and try again."); return; }
    pendingRelated.current = { table, record };
    setActiveTab(table);
  };

  useEffect(() => {
    if (user) loadAll();
  }, [user]);

  useEffect(() => {
    setSelected(pendingRelated.current?.table === activeTab ? pendingRelated.current.record : null);
    pendingRelated.current = null;
    setFilterType("all");
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

    if (filterStatus !== "all") rows = rows.filter((r) => String(activityTab ? activityStatus(r) : r.status || "new") === filterStatus);
    if (activityTab && filterType !== "all") rows = rows.filter(r => String(activeTab === "alerts" ? r.type || "" : r.table_name || "") === filterType);
    if (!activityTab && filterPriority !== "all") {
      rows = rows.filter((r) => String(r.priority || "cold").trim().toLowerCase() === filterPriority);
    }

    if (!query.trim()) return rows;
    const q = query.trim().toLowerCase();
    const phoneQuery = /^[+\d\s()-]+$/.test(q) ? q.replace(/\D/g, "") : "";
    return rows.filter((row) => JSON.stringify(row).toLowerCase().includes(q) ||
      (phoneQuery && String(row.mobile || "").replace(/\D/g, "").includes(phoneQuery)));
  }, [data, activeTab, query, filterStatus, filterPriority, filterType, activityTab, user]);

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
            <div style={{ textAlign:"right" }}><button className="btn btn4" onClick={loadAll} disabled={refreshing} aria-busy={refreshing}>{refreshing ? "Refreshing…" : "Refresh All"}</button><div role="status" className="small">{refreshing ? "Fetching latest data…" : lastRefreshed ? `Last refreshed: ${formatLeadDate(lastRefreshed)}` : ""}</div></div>
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
          <Pipeline RecordList={LeadList} onSaved={loadAll} snapshot={pipelineSnapshot} />
        ) : (
          <>
            <div className="searchBar">
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={activeTab === "leads" ? "Search leads by name, mobile number or course" : `Search ${activeTab} by any field`} />

              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                <option value="all">All Status</option>
                {(activityTab ? [...new Set((data[activeTab] || []).map(activityStatus).filter(Boolean))] : statusOptions[activeTab] || []).map((s) => <option key={s} value={s}>{displayLabel(s)}</option>)}
              </select>

              {activityTab ? <select aria-label="Filter record type" value={filterType} onChange={e => setFilterType(e.target.value)}><option value="all">All Types</option>{[...new Set((data[activeTab] || []).map(r => activeTab === "alerts" ? r.type : r.table_name).filter(Boolean))].map(value => <option key={value} value={value}>{displayLabel(value)}</option>)}</select> : <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}>
                <option value="all">All Priority</option>
                <option value="very hot">Very Hot 🔥</option>
                <option value="hot">Hot</option>
                <option value="warm">Warm</option>
                <option value="cold">Cold</option>
              </select>}

              <div className="card small" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                Rows: {filteredRows.length}
              </div>
            </div>

            {["leads", "admissions", "appointments", "support", "faculty"].includes(activeTab) ? (
              <LeadList tab={activeTab} rows={filteredRows} selectedId={selected?.id} onSelect={setSelected} onSaved={loadAll} />
            ) : <ActivityList tab={activeTab} rows={filteredRows} selectedId={selected?.id} onSelect={setSelected} onRelated={openRelated} />}
          </>
        )}
      </div>
    </div>
  );
}
