"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Navbar from "@/components/Navbar"
import AttendanceList from "@/components/dashboard/attendance-list"
import { OFFICE_CENTER, OFFICE_RADIUS_METERS, isWithinCheckinWindow, haversineMeters, todayKey } from "@/lib/constants"
import { GoogleMap, Marker, Circle, Polyline, useJsApiLoader } from "@react-google-maps/api"

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

const mapContainerStyle = { width: "100%", height: "320px" }

export default function DashboardPage() {
  const router = useRouter()
  const [authPhone, setAuthPhone] = useState<string | null>(null)
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [inside, setInside] = useState(false)
  const [checkedIn, setCheckedIn] = useState(false)
  const [attRec, setAttRec] = useState<AttendanceRecord | null>(null)
  const [path, setPath] = useState<Array<[number, number]>>([])

  // Load Google Maps
  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
  })

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

    // Load today's path
    const recs = JSON.parse(localStorage.getItem(`attendance:${a.phone}`) || "{}")
    const today = recs[todayKey()]
    if (today?.track?.length) {
      setPath(today.track.map((p: any) => [p.lat, p.lng]))
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

  // Update GPS path in real-time
  useEffect(() => {
    if (!checkedIn || !navigator.geolocation || !authPhone) return
    const watchId = navigator.geolocation.watchPosition(
      (p) => {
        const c = { lat: p.coords.latitude, lng: p.coords.longitude }
        setCoords(c)
        const inside = haversineMeters(c, OFFICE_CENTER) <= OFFICE_RADIUS_METERS
        setInside(inside)
        onCoords?.(c)
        onInsideRadius?.(inside)

        // Save to localStorage
        const storeKey = `attendance:${authPhone}`
        const all = JSON.parse(localStorage.getItem(storeKey) || "{}")
        const rec = all[todayKey()] || { track: [] }
        rec.track = [...rec.track, { lat: c.lat, lng: c.lng, ts: Date.now() }]
        all[todayKey()] = rec
        localStorage.setItem(storeKey, JSON.stringify(all))
        setPath((prev) => [...prev, [c.lat, c.lng]])
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 15000 }
    )
    return () => navigator.geolocation.clearWatch(watchId)
  }, [checkedIn, authPhone])

  return (
    <div> 
      <Navbar />
    <main className="p-4 max-w-5xl mx-auto space-y-6 mt-[20vw]">
      {/* ... existing header, cards, attendance controls, AttendanceList ... */}

      <AttendanceList phone={authPhone || ""} />

      {/* Google Map at the end */}
      <Card>
        <CardHeader>
          <CardTitle>Live GPS Map</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoaded && (
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              center={coords || OFFICE_CENTER}
              zoom={17}
            >
              <Circle
                center={OFFICE_CENTER}
                radius={OFFICE_RADIUS_METERS}
                options={{ strokeColor: "#3b82f6", fillColor: "#93c5fd", fillOpacity: 0.2 }}
              />
              {coords && <Marker position={coords} />}
              {path.length > 1 && (
                <Polyline
                  path={path.map(([lat, lng]) => ({ lat, lng }))}
                  options={{ strokeColor: "#16a34a", strokeWeight: 4 }}
                />
              )}
            </GoogleMap>
          )}
        </CardContent>
      </Card>
    </main>
    </div>
  )
}
