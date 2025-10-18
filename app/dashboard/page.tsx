"use client";

import { useEffect, useMemo, useState } from "react";
import { useJsApiLoader, GoogleMap, Marker, Circle, Polyline } from "@react-google-maps/api";
import Navbar from "@/components/Navbar";
import { Card, CardContent,CardHeader,CardTitle } from "@/components/ui/card";
import AttendanceList from "@/components/dashboard/attendance-list"
const OFFICE_CENTER = { lat: 23.1575299, lng: 75.79963555 };
const OFFICE_RADIUS_METERS = 200; // 200 meters
const haversineMeters = (coords1: { lat: number; lng: number }, coords2: { lat: number; lng: number }) => {
  const R = 6371000;
  const dLat = ((coords2.lat - coords1.lat) * Math.PI) / 180;
  const dLng = ((coords2.lng - coords1.lng) * Math.PI) / 180;
  const lat1 = (coords1.lat * Math.PI) / 180;
  const lat2 = (coords2.lat * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

type AttendanceRecord = {
  date: string
  checkInTime?: number
  checkInLocation?: { lat: number; lng: number }
  checkOutTime?: number
  checkOutLocation?: { lat: number; lng: number }
  status?: "on-time" | "late"
  lateApproved?: boolean
}


export default function DashboardPage() {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [inside, setInside] = useState(false);
  const [checkedIn, setCheckedIn] = useState(false);
  const [path, setPath] = useState<Array<[number, number]>>([]);
  const [userData, setUserData] = useState<any>(null);
   const [auth, setAuth] = useState<any>(null) // Store logged-in user info
  const [authPhone, setAuthPhone] = useState<string | null>(null)
  const [attRec, setAttRec] = useState<AttendanceRecord | null>(null)
  const [employees, setEmployees] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  
useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res = await fetch("/api/employees")
        const data = await res.json()
        if (!data.success) throw new Error(data.error)
        setEmployees(data.employees)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchEmployees()
  }, [])
  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: "AIzaSyDJIW2o84fQf8hMV9Qu2-zxb2nFM_v0db0", // Add your key here
  });

  const canCheckIn = useMemo(() => inside && !checkedIn, [inside, checkedIn]);

  // Load user data from backend or localStorage
  useEffect(() => {
    const auth = JSON.parse(localStorage.getItem("auth") || "null");
    if (!auth) return;
    setUserData(auth); // assuming auth has { name, phone, email, role }
  }, []);

  // Track user location
  useEffect(() => {
    if (!navigator.geolocation) return;
    const watchId = navigator.geolocation.watchPosition(
      (p) => {
        const c = { lat: p.coords.latitude, lng: p.coords.longitude };
        setCoords(c);
        const insideRadius = haversineMeters(c, OFFICE_CENTER) <= OFFICE_RADIUS_METERS;
        setInside(insideRadius);
        if (checkedIn) setPath((prev) => [...prev, [c.lat, c.lng]]);
        console.log("Coords:", c, "Inside:", insideRadius);
      },
      (err) => console.error(err),
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 15000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [checkedIn]);

  // Check-In
  const handleCheckIn = async () => {
    if (!coords || !userData?.phone) return;
    try {
      const res = await fetch("/api/attendance/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: userData.phone, coords }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setCheckedIn(true);
      setPath([]);
      console.log("Checked in:", data.record);
      alert("Checked in successfully!");
    } catch (err: any) {
      alert("Check-in failed: " + err.message);
    }
  };

  // Check-Out
  const handleCheckOut = async () => {
    if (!coords || !userData?.phone) return;
    try {
      const res = await fetch("/api/attendance/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: userData.phone, coords }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setCheckedIn(false);
      setPath([]);
      console.log("Checked out:", data.record);
      alert("Checked out successfully!");
    } catch (err: any) {
      alert("Check-out failed: " + err.message);
    }
  };

  if (!isLoaded) return <div className="h-[70vh] flex justify-center items-center">Loading map...</div>;

  return (
    <main>
      <Navbar />
      <div className="p-4 max-w-3xl mx-auto space-y-4">
        <h1 className="text-2xl font-bold text-center">Office Check-In</h1>

        {/* User Info */}
         <Card>
          <CardHeader>
            <CardTitle>Employee List</CardTitle>
          </CardHeader>
          <CardContent>
            {employees.length > 0 ? (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="py-2">Name</th>
                    <th className="py-2">Phone</th>
                    <th className="py-2">Email</th>
                    <th className="py-2">Role</th>
                    <th className="py-2">Department</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((emp) => (
                    <tr key={emp._id} className="border-b hover:bg-gray-50">
                      <td className="py-2">{emp.name}</td>
                      <td className="py-2">{emp.phone}</td>
                      <td className="py-2">{emp.email}</td>
                      <td className="py-2">{emp.role}</td>
                      <td className="py-2">{emp.department}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>No employees found.</p>
            )}
          </CardContent>
        </Card>

        {/* Google Map */}
        <div style={{ width: "100%", height: "400px" }}>
          <GoogleMap mapContainerStyle={{ width: "100%", height: "100%" }} center={coords || OFFICE_CENTER} zoom={17}>
            <Circle
              center={OFFICE_CENTER}
              radius={OFFICE_RADIUS_METERS}
              options={{ strokeColor: "#3b82f6", fillColor: "#93c5fd", fillOpacity: 0.2 }}
            />
            {coords && <Marker position={coords} label="You" />}
            <Marker position={OFFICE_CENTER} label="Office" />
            {path.length > 1 && (
              <Polyline
                path={path.map(([lat, lng]) => ({ lat, lng }))}
                options={{ strokeColor: "#16a34a", strokeWeight: 4 }}
              />
            )}
          </GoogleMap>
        </div>

        {/* Check-In / Check-Out Buttons */}
        <div className="text-center space-x-4">
          <button
            onClick={handleCheckIn}
            disabled={!canCheckIn}
            className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
          >
            Check In
          </button>
          <button
            onClick={handleCheckOut}
            disabled={!checkedIn}
            className="px-4 py-2 bg-red-600 text-white rounded disabled:opacity-50"
          >
            Check Out
          </button>
        </div>

        {/* Status */}
        {!inside && <p className="text-red-500 mt-2 text-center">You are outside office radius.</p>}
        {inside && !checkedIn && <p className="text-green-600 mt-2 text-center">You are inside office radius. You can check in.</p>}
        {checkedIn && <p className="text-blue-600 mt-2 text-center">Checked in successfully.</p>}
      </div>
    </main>
  );
}
