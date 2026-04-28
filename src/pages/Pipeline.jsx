import { useEffect, useState } from "react";

export default function Pipeline() {
  const [data, setData] = useState({});

  useEffect(() => {
    fetch("/api/admin/pipeline")
      .then(res => res.json())
      .then(res => setData(res.data || {}));
  }, []);

  const Card = ({ title, list }) => (
    <div style={{ padding: 20, border: "1px solid #ddd", borderRadius: 10 }}>
      <h3>{title}</h3>
      <h2>{list?.length || 0}</h2>
    </div>
  );

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20 }}>
      <Card title="New Leads" list={data.new_leads} />
      <Card title="Hot Leads" list={data.hot_leads} />
      <Card title="Very Hot 🔥" list={data.very_hot_leads} />
      <Card title="Re-Enquiry" list={data.re_enquiry} />
      <Card title="Follow-up Today" list={data.followup_today} />
      <Card title="No Response" list={data.no_response} />
      <Card title="Converted" list={data.converted} />
    </div>
  );
}
