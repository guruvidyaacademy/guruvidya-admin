import { useEffect, useState } from "react";

export default function Pipeline({ ActionPanel, onSaved }) {
  const [data, setData] = useState({});
  const [selectedStage, setSelectedStage] = useState(null);
  const [selectedLeads, setSelectedLeads] = useState([]);
  const [editingLead, setEditingLead] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadPipeline = async () => {
    setLoading(true);

    try {
      const res = await fetch("/api/admin/pipeline");
      const json = await res.json();

      setData(json.data || {});

      // Agar stage already open hai to uski list bhi refresh karo
      if (selectedStage) {
        const stageMap = {
          "New Leads": "new_leads",
          "Hot Leads": "hot_leads",
          "Very Hot 🔥": "very_hot_leads",
          "Re-Enquiry": "re_enquiry",
          "Follow-up Today": "followup_today",
          "No Response": "no_response",
          "Converted": "converted",
        };

        const key = stageMap[selectedStage];
        setSelectedLeads(json.data?.[key] || []);
      }
    } catch (err) {
      console.error("Pipeline load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPipeline();
  }, []);

  const openStage = (title, list) => {
    setSelectedStage(title);
    setSelectedLeads(list || []);
    setEditingLead(null);
  };

  const handleSaved = async () => {
    await loadPipeline();
    await onSaved?.();
    setEditingLead(null);
  };

  const Card = ({ title, list }) => (
    <div
      onClick={() => openStage(title, list)}
      style={{
        padding: 20,
        border: "1px solid #ddd",
        borderRadius: 10,
        cursor: "pointer",
        background: "#fff",
      }}
    >
      <h3 style={{ marginTop: 0 }}>{title}</h3>
      <h2>{list?.length || 0}</h2>
      <div style={{ fontSize: 12, color: "#666" }}>
        Click to view leads
      </div>
    </div>
  );

  const formatDate = (value) => {
    if (!value) return "-";

    const d = new Date(value);

    if (Number.isNaN(d.getTime())) {
      return String(value);
    }

    return d.toLocaleString("en-IN");
  };

  return (
    <div>
      {loading && (
        <div
          style={{
            marginBottom: 10,
            fontSize: 13,
            color: "#666",
          }}
        >
          Refreshing pipeline...
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 20,
        }}
      >
        <Card title="New Leads" list={data.new_leads} />
        <Card title="Hot Leads" list={data.hot_leads} />
        <Card title="Very Hot 🔥" list={data.very_hot_leads} />
        <Card title="Re-Enquiry" list={data.re_enquiry} />
        <Card title="Follow-up Today" list={data.followup_today} />
        <Card title="No Response" list={data.no_response} />
        <Card title="Converted" list={data.converted} />
      </div>

      {selectedStage && (
        <div
          style={{
            marginTop: 25,
            padding: 20,
            border: "1px solid #ddd",
            borderRadius: 10,
            background: "#fff",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 15,
            }}
          >
            <h2 style={{ margin: 0 }}>
              {selectedStage} ({selectedLeads.length})
            </h2>

            <button
              onClick={() => {
                setSelectedStage(null);
                setSelectedLeads([]);
                setEditingLead(null);
              }}
              style={{
                padding: "8px 14px",
                cursor: "pointer",
                borderRadius: 6,
              }}
            >
              Close
            </button>
          </div>

          {selectedLeads.length === 0 ? (
            <div>No leads available in this stage.</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  minWidth: 1200,
                }}
              >
                <thead>
                  <tr>
                    <th style={th}>ID</th>
                    <th style={th}>Name</th>
                    <th style={th}>Mobile</th>
                    <th style={th}>Course</th>
                    <th style={th}>Priority</th>
                    <th style={th}>Status</th>
                    <th style={th}>Counselor</th>
                    <th style={th}>Enquiry Count</th>
                    <th style={th}>Last Enquiry</th>
                    <th style={th}>Next Follow-up</th>
                    <th style={th}>Created</th>
                    <th style={th}>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {selectedLeads.map((lead) => (
                    <tr key={lead.id}>
                      <td style={td}>{lead.id}</td>
                      <td style={td}>{lead.name || "-"}</td>
                      <td style={td}>{lead.mobile || "-"}</td>
                      <td style={td}>{lead.course || "-"}</td>
                      <td style={td}>{lead.priority || "-"}</td>
                      <td style={td}>{lead.status || "-"}</td>
                      <td style={td}>{lead.owner || "-"}</td>
                      <td style={td}>
                        {lead.enquiry_count ?? 0}
                      </td>
                      <td style={td}>
                        {formatDate(lead.last_enquiry_at)}
                      </td>
                      <td style={td}>
                        {formatDate(lead.next_followup)}
                      </td>
                      <td style={td}>
                        {formatDate(lead.created_at)}
                      </td>

                      <td style={td}>
                        <button
                          onClick={() => setEditingLead(lead)}
                          style={{
                            padding: "7px 12px",
                            cursor: "pointer",
                            borderRadius: 6,
                            whiteSpace: "nowrap",
                          }}
                        >
                          View / Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {editingLead && ActionPanel && (
        <div
          style={{
            marginTop: 20,
          }}
        >
          <ActionPanel
            tab="leads"
            row={editingLead}
            onSaved={handleSaved}
          />

          <button
            onClick={() => setEditingLead(null)}
            style={{
              marginTop: 10,
              padding: "8px 14px",
              cursor: "pointer",
              borderRadius: 6,
            }}
          >
            Close Edit Panel
          </button>
        </div>
      )}
    </div>
  );
}

const th = {
  padding: 10,
  borderBottom: "2px solid #ddd",
  textAlign: "left",
  whiteSpace: "nowrap",
};

const td = {
  padding: 10,
  borderBottom: "1px solid #eee",
  verticalAlign: "top",
};
