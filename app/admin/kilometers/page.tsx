"use client";

import { useEffect, useState } from "react";

type EmployeeKM = {
  employeeId: string;
  name: string;
  phone: string;
  totalKm: string;
};

export default function AdminKilometersPage() {
  const [data, setData] = useState<EmployeeKM[]>([]);
  const [date, setDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [loading, setLoading] = useState(true);

  const fetchKM = async (selectedDate: string) => {
    setLoading(true);

    try {
      const res = await fetch(`/api/admin/getKms?date=${selectedDate}`, {
        cache: "no-store",
      });

      const response = await res.json();

      if (response.success && response.data) {
        setData(response.data);
      }
    } catch (error) {
      console.error("Fetching KM failed:", error);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchKM(date);
  }, [date]);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">
        Employee Kilometers (Per Day)
      </h1>

      {/* Date Selector */}
      <div className="mb-6 flex items-center gap-4">
        <label className="font-semibold">Select Date:</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="border px-3 py-2 rounded"
        />
      </div>

      {/* Loading */}
      {loading && <p className="text-gray-600">Loading...</p>}

      {/* Table */}
      {!loading && (
        <table className="w-full border-collapse border border-gray-400">
          <thead>
            <tr className="bg-gray-200">
              <th className="border border-gray-400 px-4 py-2">Employee</th>
              <th className="border border-gray-400 px-4 py-2">Phone</th>
              <th className="border border-gray-400 px-4 py-2">Employee ID</th>
              <th className="border border-gray-400 px-4 py-2">Total KM</th>
            </tr>
          </thead>

          <tbody>
            {data.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="text-center py-4 text-gray-500"
                >
                  No data found for this date
                </td>
              </tr>
            )}

            {data.map((emp) => (
              <tr key={emp.employeeId}>
                <td className="border border-gray-400 px-4 py-2">
                  {emp.name}
                </td>
                <td className="border border-gray-400 px-4 py-2">
                  {emp.phone}
                </td>
                <td className="border border-gray-400 px-4 py-2">
                  {emp.employeeId}
                </td>
                <td className="border border-gray-400 px-4 py-2 font-semibold">
                  {emp.totalKm} KM
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
