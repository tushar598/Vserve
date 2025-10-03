"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

type User = { id: string; phone: string; role: string; name?: string; profileCompleted?: boolean }
type Attendance = {
  date: string
  checkInTime?: number
  checkOutTime?: number
  status?: "on-time" | "late"
  lateApproved?: boolean
}
type LateReq = {
  id: string
  phone: string
  date: string
  reason: string
  status: "pending" | "approved" | "rejected"
  remarks?: string
  createdAt: number
}

export default function AdminPanel() {
  const [users, setUsers] = useState<User[]>([])
  const [attRows, setAttRows] = useState<
    Array<{ phone: string; date: string; status: string; checkIn?: string; checkOut?: string }>
  >([])
  const [lateReqs, setLateReqs] = useState<LateReq[]>([])
  const [search, setSearch] = useState("")

  useEffect(() => {
    setUsers(JSON.parse(localStorage.getItem("users") || "[]"))
    setLateReqs(JSON.parse(localStorage.getItem("lateRequests") || "[]"))
    // Build attendance table
    const table: Array<{ phone: string; date: string; status: string; checkIn?: string; checkOut?: string }> = []
    const usersList: User[] = JSON.parse(localStorage.getItem("users") || "[]")
    usersList.forEach((u) => {
      const all = JSON.parse(localStorage.getItem(`attendance:${u.phone}`) || "{}")
      Object.values(all).forEach((r: any) => {
        table.push({
          phone: u.phone,
          date: r.date,
          status:
            r.status === "on-time"
              ? "On-time"
              : r.lateApproved
                ? "Late (Approved)"
                : r.status === "late"
                  ? "Late"
                  : "—",
          checkIn: r.checkInTime ? new Date(r.checkInTime).toLocaleTimeString() : undefined,
          checkOut: r.checkOutTime ? new Date(r.checkOutTime).toLocaleTimeString() : undefined,
        })
      })
    })
    setAttRows(table.sort((a, b) => (a.date < b.date ? 1 : -1)))
  }, [])

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return users
    return users.filter((u) => u.phone.includes(q) || (u.name || "").toLowerCase().includes(q))
  }, [users, search])

  const updateLate = (id: string, status: "approved" | "rejected", remarks: string) => {
    const pool: LateReq[] = JSON.parse(localStorage.getItem("lateRequests") || "[]")
    const idx = pool.findIndex((r) => r.id === id)
    if (idx < 0) return
    const req = pool[idx]
    req.status = status
    req.remarks = remarks
    pool[idx] = req
    localStorage.setItem("lateRequests", JSON.stringify(pool))
    setLateReqs(pool)

    // Update attendance record flag
    const all = JSON.parse(localStorage.getItem(`attendance:${req.phone}`) || "{}")
    const rec = all[req.date]
    if (rec) {
      rec.lateApproved = status === "approved"
      all[req.date] = rec
      localStorage.setItem(`attendance:${req.phone}`, JSON.stringify(all))
      // refresh table
      setAttRows((rows) =>
        rows.map((r) =>
          r.phone === req.phone && r.date === req.date
            ? { ...r, status: rec.lateApproved ? "Late (Approved)" : rec.status === "late" ? "Late" : r.status }
            : r,
        ),
      )
    }
  }

  const downloadCSV = () => {
    const header = ["Phone", "Date", "Status", "Check-in", "Check-out"]
    const lines = [header.join(",")]
    attRows.forEach((r) => {
      lines.push([r.phone, r.date, r.status, r.checkIn || "", r.checkOut || ""].map((v) => `"${v}"`).join(","))
    })
    const blob = new Blob([lines.join("\n")], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `attendance-report-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <CardTitle>Employees</CardTitle>
          <div className="w-full md:w-64">
            <Input placeholder="Search name or phone..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground">
                  <th className="py-2 pr-4">ID</th>
                  <th className="py-2 pr-4">Name</th>
                  <th className="py-2 pr-4">Phone</th>
                  <th className="py-2 pr-4">Role</th>
                  <th className="py-2 pr-4">Profile</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 && (
                  <tr>
                    <td className="py-3" colSpan={5}>
                      No employees found.
                    </td>
                  </tr>
                )}
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="border-t">
                    <td className="py-2 pr-4">{u.id}</td>
                    <td className="py-2 pr-4">{u.name || "—"}</td>
                    <td className="py-2 pr-4">{u.phone}</td>
                    <td className="py-2 pr-4 capitalize">{u.role}</td>
                    <td className="py-2 pr-4">{u.profileCompleted ? "Completed" : "Pending"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle>Attendance Logs</CardTitle>
          <Button onClick={downloadCSV}>Generate & Download CSV</Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground">
                  <th className="py-2 pr-4">Phone</th>
                  <th className="py-2 pr-4">Date</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Check-in</th>
                  <th className="py-2 pr-4">Check-out</th>
                </tr>
              </thead>
              <tbody>
                {attRows.length === 0 && (
                  <tr>
                    <td className="py-3" colSpan={5}>
                      No attendance logs.
                    </td>
                  </tr>
                )}
                {attRows.map((r, i) => (
                  <tr key={r.phone + r.date + i} className="border-t">
                    <td className="py-2 pr-4">{r.phone}</td>
                    <td className="py-2 pr-4">{r.date}</td>
                    <td className="py-2 pr-4">{r.status}</td>
                    <td className="py-2 pr-4">{r.checkIn || "—"}</td>
                    <td className="py-2 pr-4">{r.checkOut || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Late Requests</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {lateReqs.length === 0 && <p className="text-sm text-muted-foreground">No late requests.</p>}
          {lateReqs.map((r) => (
            <LateRequestRow key={r.id} req={r} onResolve={updateLate} />
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

function LateRequestRow({
  req,
  onResolve,
}: { req: LateReq; onResolve: (id: string, status: "approved" | "rejected", remarks: string) => void }) {
  const [remarks, setRemarks] = useState(req.remarks || "")
  return (
    <div className="grid md:grid-cols-5 gap-3 items-start border rounded-md p-3">
      <div>
        <div className="text-sm font-medium">Phone</div>
        <div className="text-sm">{req.phone}</div>
      </div>
      <div>
        <div className="text-sm font-medium">Date</div>
        <div className="text-sm">{req.date}</div>
      </div>
      <div>
        <div className="text-sm font-medium">Reason</div>
        <div className="text-sm">{req.reason}</div>
      </div>
      <div className="col-span-2 grid gap-2">
        <Label htmlFor={`remarks-${req.id}`} className="text-sm">
          Remarks
        </Label>
        <Textarea
          id={`remarks-${req.id}`}
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          placeholder="Optional remarks..."
        />
        <div className="flex gap-2">
          <Button size="sm" onClick={() => onResolve(req.id, "approved", remarks)} disabled={req.status !== "pending"}>
            Approve
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => onResolve(req.id, "rejected", remarks)}
            disabled={req.status !== "pending"}
          >
            Reject
          </Button>
          <span className="ml-auto text-xs px-2 py-0.5 rounded bg-secondary text-secondary-foreground">
            {req.status.toUpperCase()}
          </span>
        </div>
      </div>
    </div>
  )
}
