import { useEffect, useState } from "react";

export default function Pipeline() {
  const [data, setData] = useState({});
  const [selectedStage, setSelectedStage] = useState(null);
  const [selectedLeads, setSelectedLeads] = useState([]);

  const loadPipeline = () => {
    fetch("/api/admin/pipeline")
      .then((res) => res.json())
      .then((res) => setData(res.data || {}))
      .catch((err) => console.error("Pipeline load error:", err));
  };

  useEffect(() => {
    loadPipeline();
  }, []);

  const openStage = (title, list) => {
    setSelectedStage(title);
    setSelectedLeads(list || []);
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
    if (Number.isNaN(d.getTime())) return value;

    return d.toLocaleString("en-IN");
  };

  return (
    <div>
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
                  minWidth: 1100,
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
                      <td style={td}>{lead.enquiry_count ?? 0}</td>
                      <td style={td}>
                        {formatDate(lead.last_enquiry_at)}
                      </td>
                      <td style={td}>
                        {formatDate(lead.next_followup)}
                      </td>
                      <td style={td}>
                        {formatDate(lead.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
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
