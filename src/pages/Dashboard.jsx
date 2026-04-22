import { useEffect, useState } from "react";
import axios from "axios";

const API = "https://guruvidya-backend.onrender.com/api";

export default function Dashboard() {
  const [leads, setLeads] = useState([]);

  useEffect(() => {
    axios.get(API + "/admin/leads")
      .then(res => setLeads(res.data.data))
      .catch(err => console.log(err));
  }, []);

  return (
    <div style={{padding:"20px"}}>
      <h3>Leads</h3>
      <table border="1" cellPadding="10" width="100%">
        <thead>
          <tr>
            <th>Name</th>
            <th>Mobile</th>
            <th>Course</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {leads.map((l,i)=>(
            <tr key={i}>
              <td>{l.name}</td>
              <td>{l.mobile}</td>
              <td>{l.course}</td>
              <td>{l.created_at}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
