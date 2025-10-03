"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type AttendanceRecord = {
  date: string
  checkInTime?: number
  checkOutTime?: number
  status?: "on-time" | "late"
  lateApproved?: boolean
}

export default function AttendanceList({ phone }: { phone: string }) {
  const [rows, setRows] = useState<AttendanceRecord[]>([])

  useEffect(() => {
    if (!phone) return
    const all = JSON.parse(localStorage.getItem(`attendance:${phone}`) || "{}")
    const list: AttendanceRecord[] = Object.values(all)
      .sort((a: any, b: any) => (a.date < b.date ? 1 : -1))
      .slice(0, 30)
    setRows(list)
  }, [phone])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Past Attendance</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground">
                <th className="py-2 pr-4">Date</th>
                <th className="py-2 pr-4">Check-in</th>
                <th className="py-2 pr-4">Check-out</th>
                <th className="py-2 pr-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td className="py-3" colSpan={4}>
                    No records yet.
                  </td>
                </tr>
              )}
              {rows.map((r) => (
                <tr key={r.date} className="border-t">
                  <td className="py-2 pr-4">{r.date}</td>
                  <td className="py-2 pr-4">{r.checkInTime ? new Date(r.checkInTime).toLocaleTimeString() : "—"}</td>
                  <td className="py-2 pr-4">{r.checkOutTime ? new Date(r.checkOutTime).toLocaleTimeString() : "—"}</td>
                  <td className="py-2 pr-4">
                    {r.status === "on-time"
                      ? "On-time"
                      : r.status === "late"
                        ? r.lateApproved
                          ? "Late (Approved)"
                          : "Late"
                        : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
