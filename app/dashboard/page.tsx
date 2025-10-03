"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import AttendanceList from "@/components/dashboard/attendance-list"
import MapTracker from "@/components/dashboard/map-tracker"
import { OFFICE_CENTER, OFFICE_RADIUS_METERS, isWithinCheckinWindow, haversineMeters, todayKey } from "@/lib/constants"

type TrackPoint = { lat: number; lng: number; ts: number }
type AttendanceRecord = {
  date: string
  checkInTime?: number
  checkInLocation?: { lat: number; lng: number }
  track?: TrackPoint[]
  checkOutTime?: number
  checkOutLocation?: { lat: number; lng: number }
  status?: "on-time" | "late"
  lateApproved?: boolean
}

export default function DashboardPage() {
  const router = useRouter()
  const [authPhone, setAuthPhone] = useState<string | null>(null)
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [inside, setInside] = useState(false)
  const [checkedIn, setCheckedIn] = useState(false)
  const [attRec, setAttRec] = useState<AttendanceRecord | null>(null)

  // Load auth and current record
  useEffect(() => {
    const a = JSON.parse(localStorage.getItem("auth") || "null")
    if (!a || a.role !== "executive") {
      router.replace("/login")
      return
    }
    setAuthPhone(a.phone)
    const k = `attendance:${a.phone}`
    const all = JSON.parse(localStorage.getItem(k) || "{}")
    const rec: AttendanceRecord = all[todayKey()] || null
    setAttRec(rec || null)
    setCheckedIn(!!rec?.checkInTime && !rec?.checkOutTime)

    // geolocate once
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (p) => {
          const c = { lat: p.coords.latitude, lng: p.coords.longitude }
          setCoords(c)
          const d = haversineMeters(c, OFFICE_CENTER)
          setInside(d <= OFFICE_RADIUS_METERS)
        },
        () => {},
        { enableHighAccuracy: true, timeout: 10000 },
      )
    }
  }, [router])

  const canCheckIn = useMemo(() => {
    return isWithinCheckinWindow(new Date()) && inside && !checkedIn
  }, [inside, checkedIn])

  const markAttendance = () => {
    if (!authPhone || !coords) return
    const k = `attendance:${authPhone}`
    const all = JSON.parse(localStorage.getItem(k) || "{}")
    const now = Date.now()
    const status: AttendanceRecord["status"] = isWithinCheckinWindow(new Date(now)) ? "on-time" : "late"
    const rec: AttendanceRecord = {
      date: todayKey(),
      checkInTime: now,
      checkInLocation: coords,
      track: [],
      status,
    }
    all[todayKey()] = rec
    localStorage.setItem(k, JSON.stringify(all))
    setAttRec(rec)
    setCheckedIn(true)
  }

  const dayOut = () => {
    if (!authPhone) return
    const k = `attendance:${authPhone}`
    const all = JSON.parse(localStorage.getItem(k) || "{}")
    const rec: AttendanceRecord = all[todayKey()]
    if (!rec) return
    const now = Date.now()
    const outLoc = coords || rec.checkInLocation
    all[todayKey()] = { ...rec, checkOutTime: now, checkOutLocation: outLoc }
    localStorage.setItem(k, JSON.stringify(all))
    setAttRec(all[todayKey()])
    setCheckedIn(false)
  }

  const requestLateApproval = () => {
    if (!authPhone || !attRec) return
    const pool = JSON.parse(localStorage.getItem("lateRequests") || "[]")
    const exists = pool.find((r: any) => r.phone === authPhone && r.date === attRec.date)
    if (exists) return
    pool.push({
      id: `LR${Math.floor(Math.random() * 100000)}`,
      phone: authPhone,
      date: attRec.date,
      reason: "Traffic/Unavoidable circumstances",
      status: "pending",
      remarks: "",
      createdAt: Date.now(),
    })
    localStorage.setItem("lateRequests", JSON.stringify(pool))
    alert("Late request submitted for manager approval.")
  }

  const logout = () => {
    localStorage.removeItem("auth")
    router.replace("/login")
  }

  return (
    <main className="p-4 max-w-5xl mx-auto space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-balance">Executive Dashboard</h1>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => router.push("/profile")}>
            Profile
          </Button>
          <Button variant="ghost" onClick={logout}>
            Log out
          </Button>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Attendance Controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <ul className="text-sm text-muted-foreground list-disc pl-5">
              <li>Check-in window: 9:30–10:00 AM</li>
              <li>Office radius: {OFFICE_RADIUS_METERS}m</li>
              <li>Within office: {inside ? "Yes" : "No"}</li>
            </ul>
            <div className="flex flex-wrap gap-3">
              <Button disabled={!canCheckIn} onClick={markAttendance}>
                Mark Attendance
              </Button>
              <Button variant="secondary" disabled={!checkedIn} onClick={dayOut}>
                Day Out
              </Button>
              <Button
                variant="outline"
                disabled={!(attRec && attRec.status === "late")}
                onClick={requestLateApproval}
                title="Submit late request to manager"
              >
                Request Late Approval
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Today</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>
              Status:{" "}
              <span className="font-medium">
                {checkedIn ? "Checked-in" : attRec?.checkOutTime ? "Checked-out" : "Not checked-in"}
              </span>
            </div>
            <div>
              Check-in: {attRec?.checkInTime ? new Date(attRec.checkInTime).toLocaleTimeString() : "—"}
              {attRec?.status === "late" && (
                <span className="ml-2 px-2 py-0.5 rounded bg-destructive text-destructive-foreground text-xs">
                  Late
                </span>
              )}
              {attRec?.lateApproved && (
                <span className="ml-2 px-2 py-0.5 rounded bg-green-600 text-white text-xs">Approved</span>
              )}
            </div>
            <div>Check-out: {attRec?.checkOutTime ? new Date(attRec.checkOutTime).toLocaleTimeString() : "—"}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Live GPS Tracking</CardTitle>
        </CardHeader>
        <CardContent>
          <MapTracker
            enabled={checkedIn}
            phone={authPhone || ""}
            onInsideRadius={(val) => setInside(val)}
            onCoords={(c) => setCoords(c)}
          />
        </CardContent>
      </Card>

      <AttendanceList phone={authPhone || ""} />
    </main>
  )
}
