"use client";

import { useState, useEffect, useRef } from "react";
import {
  GoogleMap,
  Marker,
  Circle,
  Polyline,
  useJsApiLoader,
} from "@react-google-maps/api";

// Center of your office (change this to your coordinates)
const OFFICE_CENTER = { lat: 22.7196, lng: 75.8577 }; // Example: Indore
const OFFICE_RADIUS_METERS = 150; // 150m radius

const containerStyle = {
  width: "100%",
  height: "400px",
};

type Props = {
  enabled: boolean;
  phone: string;
  onInsideRadius?: (inside: boolean) => void;
  onCoords?: (coords: { lat: number; lng: number }) => void;
};

export default function MapTracker({
  enabled,
  phone,
  onInsideRadius,
  onCoords,
}: Props) {
  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: "YOUR_GOOGLE_MAPS_API_KEY", // ⚠️ Replace this
  });

  const [pos, setPos] = useState<{ lat: number; lng: number } | null>(null);
  // const [path, setPath] = useState<Array<[number, number]>>([]);
  const watchId = useRef<number | null>(null);

  // ✅ Load previous track from localStorage
  useEffect(() => {
    if (!phone) return;
    const records = JSON.parse(localStorage.getItem(`attendance:${phone}`) || "{}");
    const todayKey = new Date().toISOString().split("T")[0];
    const today = records[todayKey];
    if (today?.track?.length) {
      // setPath(today.track.map((p: any) => [p.lat, p.lng]));
    }
  }, [phone]);

  // ✅ Start GPS tracking
  useEffect(() => {
    if (!enabled) {
      if (watchId.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchId.current);
        watchId.current = null;
      }
      return;
    }

    if (!navigator.geolocation) return;

    watchId.current = navigator.geolocation.watchPosition(
      (p) => {
        const c = { lat: p.coords.latitude, lng: p.coords.longitude };
        setPos(c);
        onCoords?.(c);

        // Check if inside office radius
        const distance = haversineMeters(c, OFFICE_CENTER);
        const inside = distance <= OFFICE_RADIUS_METERS;
        onInsideRadius?.(inside);

        // Save track in localStorage
        const storeKey = `attendance:${phone}`;
        const all = JSON.parse(localStorage.getItem(storeKey) || "{}");
        const todayKey = new Date().toISOString().split("T")[0];
        const rec = all[todayKey] || { track: [] };

        const newPoint = { lat: c.lat, lng: c.lng, ts: Date.now() };
        rec.track = [...rec.track, newPoint];
        all[todayKey] = rec;
        localStorage.setItem(storeKey, JSON.stringify(all));
        // setPath((prev) => [...prev, [c.lat, c.lng]]);
      },
      () => onInsideRadius?.(false),
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 15000 }
    );

    return () => {
      if (watchId.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchId.current);
        watchId.current = null;
      }
    };
  }, [enabled, phone, onCoords, onInsideRadius]);

  if (!isLoaded) return <p>Loading Map...</p>;

  return (
    <div className="h-[400px] w-full rounded-md overflow-hidden border">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={pos || OFFICE_CENTER}
        zoom={17}
        options={{
          disableDefaultUI: false,
          zoomControl: true,
          streetViewControl: false,
        }}
      >
        {/* Office radius circle */}
        <Circle
          center={OFFICE_CENTER}
          radius={OFFICE_RADIUS_METERS}
          options={{ strokeColor: "#3b82f6", fillColor: "#93c5fd", fillOpacity: 0.2 }}
        />

        {/* Current position marker */}
        {pos && <Marker position={pos} />}

        {/* Path line */}
        {/* {path.length > 1 && (
          <Polyline
            path={path.map(([lat, lng]) => ({ lat, lng }))}
            options={{ strokeColor: "#16a34a", strokeWeight: 4 }}
          />
        )} */}
      </GoogleMap>
    </div>
  );
}

// ✅ Haversine formula for distance in meters
function haversineMeters(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;

  const h =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}
