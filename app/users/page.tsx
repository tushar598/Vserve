import { connectDB } from "@/lib/db";
import User from "@/models/employee";

export default async function UsersPage() {
  await connectDB();
  const users = await User.find().lean();

  return (
    <div style={{ padding: "20px" }}>
      <h1>Users from MongoDB</h1>

      <pre
        style={{
          background: "#111",
          color: "#0f0",
          padding: "16px",
          borderRadius: "8px",
          overflowX: "auto",
        }}
      >
        {JSON.stringify(users, null, 2)}
      </pre>
    </div>
  );
}
