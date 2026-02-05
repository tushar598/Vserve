import { connectDB } from "@/lib/db";
import DailyDistance from "@/models/dailydistance";

export default async function DailyDistancePage() {
  await connectDB();

  const records = await DailyDistance.find()
    .populate("employeeId") // remove if you don’t want employee details
    .lean();

  return (
    <div style={{ padding: "20px" }}>
      <h1>Daily Distance Records</h1>

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          marginTop: "16px",
        }}
      >
        <thead>
          <tr>
            <th>Employee</th>
            <th>Date</th>
            <th>Total KM</th>
          </tr>
        </thead>
        <tbody>
          {records.map((item: any) => (
            <tr key={item._id}>
              <td>{item.employeeId?._id || item.employeeId}</td>
              <td>{item.date}</td>
              <td>{item.totalKm}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Raw JSON view (useful for debugging) */}
      <pre style={{ marginTop: 20 }}>
        {JSON.stringify(records, null, 2)}
      </pre>
    </div>
  );
}
