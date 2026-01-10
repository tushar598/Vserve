"use client";

import React, { useEffect, useState } from "react";
import {
  User,
  Phone,
  Briefcase,
  CreditCard,
  Building2,
  Calendar,
  FileText,
  Loader2,
} from "lucide-react";
import Navbar from "@/components/Navbar";

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/me");
        const data = await res.json();
        if (res.ok) setUser(data.user || data);
      } catch (err) {
        console.error("Failed to fetch user:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Loader2 className="animate-spin w-10 h-10 text-gray-700" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <p
          className="text-xl font-semibold
          bg-gradient-to-r from-[#BA4C83] to-[#ba4c83cf] bg-clip-text text-transparent"
        >
          No profile data found
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 bg-gray-100">
      <Navbar />

      <div className="flex justify-center px-4 py-6 md:py-10">
        <div
          className="w-full max-w-xl text-xl font-bold
          bg-white rounded-3xl shadow-sm p-5 md:p-8 space-y-6"
        >
          {/* Header */}
          <div className="flex flex-col items-center text-center space-y-2">
            <div className="w-16 h-16 rounded-full bg-slate-200 flex items-center justify-center text-xl font-bold border-1 border-black text-slate-700">
              {user.name?.charAt(0).toUpperCase()}
            </div>

            <h1 className="text-4xl font-bold  text-gray-900 ">{user.name}</h1>

            <p className="flex items-center gap-1 text-slate-600 text-sm">
              <Briefcase className="w-4 h-4" />
              {user.role || "Employee"}
            </p>
          </div>

          {/* Details */}
          <div className="space-y-4">
            <ProfileItem
              icon={<Phone className="w-4 h-4" />}
              label="Phone"
              value={user.phone}
            />

            <ProfileItem
              icon={<User className="w-4 h-4" />}
              label="Father’s Name"
              value={user.fatherName}
            />

            <ProfileItem
              icon={<CreditCard className="w-4 h-4" />}
              label="PAN Card"
              value={user.panCard}
            />

            <ProfileItem
              icon={<Building2 className="w-4 h-4" />}
              label="Bank Account"
              value={user.bankAccountNumber}
              mono
            />

            <ProfileItem
              icon={<Calendar className="w-4 h-4" />}
              label="Date of Joining"
              value={
                user.dateOfJoining
                  ? new Date(user.dateOfJoining).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })
                  : "N/A"
              }
            />
          </div>

          {/* Address Proof */}
          {user.addressProof && user.role === "executive" && (
            <a
              href={user.addressProof}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 bg-blue-500 text-white py-3 rounded-xl text-sm font-medium border-2 border-black shadow-[3px_5px_0px_0px_rgba(0,0,0,1)] hover:bg-blue-600
             hover:translate-y-1 hover:shadow-none
              hover:opacity-90 transition-all"
            >
              <FileText className="w-4 h-4" />
              View Address Proof
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function ProfileItem({
  icon,
  label,
  value,
  mono = false,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
      <div className="bg-white p-2 rounded-full shadow-sm text-slate-700">
        {icon}
      </div>
      <div className="flex flex-col">
        <span className="text-xs text-gray-400 uppercase">{label}</span>
        <span
          className={`text-sm font-medium text-gray-900 ${
            mono ? "font-mono" : ""
          }`}
        >
          {value || "N/A"}
        </span>
      </div>
    </div>
  );
}
