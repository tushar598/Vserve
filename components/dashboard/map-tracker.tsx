"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import dynamic from "next/dynamic"

import { OFFICE_CENTER, OFFICE_RADIUS_METERS, haversineMeters, todayKey } from "@/lib/constants"

// ✅ Dynamically import all of react-leaflet as one module
const MapWithNoSSR = dynamic(
  async () => {
    const RL = await import("react-leaflet")
    return function MapInner({
      pos,
      path,
      markerIcon,
    }: {
      pos: { lat: number; lng: number } | null
      path: Array<[number, number]>
      markerIcon: any
    }) {
      const { MapContainer, TileLayer, Marker, Circle, Polyline } = RL

      const center = pos || OFFICE_CENTER

      return (
        <div></div>
        // <MapContainer center={[center.lat, center.lng]} zoom={16} style={{ height: "100%", width: "100%" }}>
        //   <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        //   <Circle center={[OFFICE_CENTER.lat, OFFICE_CENTER.lng]} radius={OFFICE_RADIUS_METERS} pathOptions={{ color: "#3b82f6" }} />
        //   {pos && <Marker position={[pos.lat, pos.lng]} icon={markerIcon || undefined} />}
        //   {path.length > 1 && <Polyline positions={path} pathOptions={{ color: "#16a34a", weight: 4 }} />}
        // </MapContainer>
      )
    }
  },
  { ssr: false }
)

type Props = {
  enabled: boolean
  phone: string
  onInsideRadius?: (inside: boolean) => void
  onCoords?: (c: { lat: number; lng: number }) => void
}

export default function MapTracker({ enabled, phone, onInsideRadius, onCoords }: Props) {
  const [pos, setPos] = useState<{ lat: number; lng: number } | null>(null)
  const [path, setPath] = useState<Array<[number, number]>>([])
  const [markerIcon, setMarkerIcon] = useState<any>(null)
  const watchId = useRef<number | null>(null)

  // Load Leaflet icon
  // useEffect(() => {
  //   ;(async () => {
  //     const L = (await import("leaflet")).default
  //     setMarkerIcon(
  //       L.icon({
  //         iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  //         iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  //         shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  //         iconSize: [25, 41],
  //         iconAnchor: [12, 41],
  //       })
  //     )
  //   })()
  // }, [])

  // Load previous track
  useEffect(() => {
    if (!phone) return
    const recs = JSON.parse(localStorage.getItem(`attendance:${phone}`) || "{}")
    const today = recs[todayKey()]
    if (today?.track?.length) {
      setPath(today.track.map((p: any) => [p.lat, p.lng]))
    }
  }, [phone])

  // GPS watcher
  useEffect(() => {
    if (!enabled) {
      if (watchId.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchId.current)
        watchId.current = null
      }
      return
    }
    if (!navigator.geolocation) return

    watchId.current = navigator.geolocation.watchPosition(
      (p) => {
        const c = { lat: p.coords.latitude, lng: p.coords.longitude }
        setPos(c)
        onCoords?.(c)
        const inside = haversineMeters(c, OFFICE_CENTER) <= OFFICE_RADIUS_METERS
        onInsideRadius?.(inside)

        const storeKey = `attendance:${phone}`
        const all = JSON.parse(localStorage.getItem(storeKey) || "{}")
        const rec = all[todayKey()]
        if (rec) {
          const newPt = { lat: c.lat, lng: c.lng, ts: Date.now() }
          rec.track = [...(rec.track || []), newPt]
          all[todayKey()] = rec
          localStorage.setItem(storeKey, JSON.stringify(all))
          setPath((prev) => [...prev, [c.lat, c.lng]])
        }
      },
      () => onInsideRadius?.(false),
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 15000 }
    )

    return () => {
      if (watchId.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchId.current)
        watchId.current = null
      }
    }
  }, [enabled, phone, onCoords, onInsideRadius])

  return (
    <div className="h-[320px] rounded-md overflow-hidden border">
      <MapWithNoSSR pos={pos} path={path} markerIcon={markerIcon} />
    </div>
  )
}
