import { useEffect, useMemo, useRef, useState } from "react";

const stages = [
  ["new_leads", "New Leads", "#2563eb"],
  ["hot_leads", "Hot Leads", "#ea580c"],
  ["very_hot_leads", "Very Hot 🔥", "#be123c"],
  ["re_enquiry", "Re-Enquiry", "#7c3aed"],
  ["followup_today", "Follow-up Today", "#0891b2"],
  ["no_response", "No Response", "#64748b"],
  ["converted", "Converted", "#15803d"],
];

export default function Pipeline({ RecordList, onSaved, snapshot }) {
  const [data, setData] = useState({});
  const [selectedStage, setSelectedStage] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [priority, setPriority] = useState("all");
  const [status, setStatus] = useState("all");
  const requestVersion = useRef(0);

  const loadPipeline = async () => {
    const version = ++requestVersion.current;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/pipeline");
      if (!res.ok) throw new Error(`Pipeline could not load (${res.status}). Please retry.`);
      const json = await res.json();
      if (version === requestVersion.current) setData(json.data || {});
    } catch (err) {
      if (version === requestVersion.current) setError(err.message || "Pipeline could not load. Please retry.");
    } finally {
      if (version === requestVersion.current) setLoading(false);
    }
  };

  useEffect(() => { loadPipeline(); return () => { requestVersion.current += 1; }; }, []);
  useEffect(() => {
    if (snapshot) { requestVersion.current += 1; setData(snapshot.data || {}); setLoading(false); setError(""); }
  }, [snapshot]);
  const selectedLeads = data[selectedStage] || [];
  const title = stages.find(([key]) => key === selectedStage)?.[1];
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const phone = /^[+\d\s()-]+$/.test(q) ? q.replace(/\D/g, "") : "";
    return selectedLeads.filter(lead =>
      (priority === "all" || String(lead.priority || "cold").toLowerCase().replace(/_/g, " ") === priority) &&
      (status === "all" || String(lead.status || "new") === status) &&
      (JSON.stringify(lead).toLowerCase().includes(q) || (phone && String(lead.mobile || "").replace(/\D/g, "").includes(phone)))
    );
  }, [selectedLeads, query, priority, status]);

  const openStage = key => {
    setSelectedStage(key);
    setEditingId(null);
    setQuery(""); setPriority("all"); setStatus("all");
  };
  const handleSaved = async () => {
    await loadPipeline();
    await onSaved?.();
    setEditingId(null);
  };

  return <div className="pipeline-workspace">
    <style>{`
      .pipeline-workspace { color:#1e293b; }
      .pipeline-workspace .pipeline-toolbar { display:flex; justify-content:space-between; align-items:center; gap:12px; flex-wrap:wrap; margin-bottom:18px; }
      .pipeline-workspace .pipeline-stages { display:grid; grid-template-columns:repeat(auto-fit,minmax(210px,1fr)); gap:16px; }
      .pipeline-workspace .pipeline-stage { text-align:left; padding:20px; border:1px solid #e2e8f0; border-radius:14px; background:#fff; cursor:pointer; box-shadow:0 4px 18px #0f172a06; font:inherit; color:inherit; }
      .pipeline-workspace .pipeline-stage:hover { background:#f8fafc; }
      .pipeline-workspace .pipeline-stage:focus-visible { outline:3px solid #93c5fd; }
      .pipeline-workspace .pipeline-count { font-size:30px; font-weight:750; margin:12px 0 6px; }
      .pipeline-workspace .pipeline-subtitle { font-size:12px; color:#64748b; }
      .pipeline-workspace .pipeline-filters { display:grid; grid-template-columns:2fr 1fr 1fr; gap:12px; margin-bottom:16px; }
      .pipeline-workspace .pipeline-filters input,.pipeline-workspace .pipeline-filters select { width:100%; box-sizing:border-box; border:1px solid #cbd5e1; border-radius:9px; padding:11px; background:white; }
      @media(max-width:620px) { .pipeline-workspace .pipeline-filters { grid-template-columns:1fr; } }
    `}</style>
    <div className="pipeline-toolbar">
      <div><h2 style={{ margin:0 }}>Pipeline</h2><span className="pipeline-subtitle">Select a stage to review and follow up with leads</span></div>
      <button type="button" className="btn btn2" disabled={loading} onClick={loadPipeline}>{loading ? "Refreshing…" : "Refresh Pipeline"}</button>
    </div>
    {error && <div role="alert" style={{ padding:14, marginBottom:16, background:"#fef2f2", color:"#991b1b", borderRadius:10 }}>{error}</div>}
    <div className="pipeline-stages">
      {stages.map(([key, label, color]) => <button type="button" key={key} className="pipeline-stage" aria-pressed={selectedStage === key} onClick={() => openStage(key)} style={{ borderTop:`3px solid ${color}`, background:selectedStage === key ? "#eff6ff" : undefined }}>
        <strong>{label}</strong><div className="pipeline-count" style={{ color }}>{data[key]?.length || 0}</div><span className="pipeline-subtitle">View leads →</span>
      </button>)}
    </div>
    {selectedStage && <section style={{ marginTop:24 }}>
      <div className="pipeline-toolbar"><h3 style={{ margin:0 }}>{title} ({selectedLeads.length})</h3><button type="button" className="btn btn2" onClick={() => { setSelectedStage(null); setEditingId(null); }}>Close Stage</button></div>
      <div className="pipeline-filters">
        <input aria-label="Search pipeline leads" placeholder="Search by name, mobile number or course" value={query} onChange={e => setQuery(e.target.value)} />
        <select aria-label="Filter pipeline priority" value={priority} onChange={e => setPriority(e.target.value)}><option value="all">All Priority</option>{["very hot", "hot", "warm", "cold"].map(value => <option key={value} value={value}>{value.replace(/\b\w/g, char => char.toUpperCase())}</option>)}</select>
        <select aria-label="Filter pipeline status" value={status} onChange={e => setStatus(e.target.value)}><option value="all">All Status</option>{[...new Set(selectedLeads.map(lead => lead.status || "new"))].map(value => <option key={value} value={value}>{value.replace(/[_-]/g, " ").replace(/\b\w/g, char => char.toUpperCase())}</option>)}</select>
      </div>
      <RecordList rows={filtered} selectedId={editingId} onSelect={lead => setEditingId(lead?.id ?? null)} onSaved={handleSaved} tab="leads" title={title} />
    </section>}
  </div>;
}
