"use client";

import React, { useEffect, useState, useMemo, useRef, useCallback } from "react";
import Link from "next/link";
import NavBar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Search,
  Calendar,
  MapPin,
  Navigation,
  User,
  Phone,
  Briefcase,
  FileText,
  Camera,
  Clock,
  AlertCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
  Eye,
  X,
  Hash,
  CheckCircle2,
  XCircle,
  Filter,
  Building2,
  ClipboardList,
} from "lucide-react";

/* ──────────────────── Types ──────────────────── */
type Employee = {
  _id: string;
  name: string;
  phone: string;
  role: string;
  department?: string;
  location?: string;
};

type FormDataRecord = {
  _id: string;
  sentLocationId: string;
  employeeId: string;
  phone: string;
  date: string;
  coords: { lat: number; lng: number };
  gpsAccuracy: number | null;
  actionType: "send_location" | "halt_location";
  formSkipped: boolean;
  photoSkipped: boolean;
  visitDate: string;
  accountNo: string;
  customerName: string;
  addressVisited: string;
  cmAvailableAtAdd: string;
  personMetAtAddress: string;
  visitedAddressStatus: string;
  keyword: string;
  occupation: string;
  fieldVisitContactable: string;
  feedbackInDetail: string;
  ptpNextVisitDate: string;
  ptpAmount: string;
  projection: string;
  caseToRetain: string;
  caseWorkable: string;
  settlementCase: string;
  retentionPriority: string;
  rrcToFile: string;
  geotaggedPhotoUrl: string;
  createdAt: string;
};

type EmployeeDetail = {
  name: string;
  fatherName: string;
  phone: string;
  role: string;
  department: string;
  dateOfJoining: string;
  location: string;
};

/* ──────────────────── Form Field Labels ──────────────────── */
const FORM_FIELDS: { key: keyof FormDataRecord; label: string }[] = [
  { key: "visitDate", label: "Visit Date" },
  { key: "accountNo", label: "Account No." },
  { key: "customerName", label: "Customer Name" },
  { key: "addressVisited", label: "Address Visited" },
  { key: "cmAvailableAtAdd", label: "CM Available at Address" },
  { key: "personMetAtAddress", label: "Person Met at Address" },
  { key: "visitedAddressStatus", label: "Visited Address Status" },
  { key: "keyword", label: "Keyword" },
  { key: "occupation", label: "Occupation" },
  { key: "fieldVisitContactable", label: "Field Visit Contactable" },
  { key: "feedbackInDetail", label: "Feedback in Detail" },
  { key: "ptpNextVisitDate", label: "PTP Next Visit Date" },
  { key: "ptpAmount", label: "PTP Amount" },
  { key: "projection", label: "Projection" },
  { key: "caseToRetain", label: "Case to Retain" },
  { key: "caseWorkable", label: "Case Workable" },
  { key: "settlementCase", label: "Settlement Case" },
  { key: "retentionPriority", label: "Retention Priority" },
  { key: "rrcToFile", label: "RRC to File" },
];

/* ──────────────────── Component ──────────────────── */
export default function FormDataPage() {
  // Search & selection state
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    null,
  );
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0],
  );

  // Data state
  const [employeeDetail, setEmployeeDetail] = useState<EmployeeDetail | null>(
    null,
  );
  const [formRecords, setFormRecords] = useState<FormDataRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasFetched, setHasFetched] = useState(false);

  // UI state
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  /* ──── Close dropdown on click-outside or Escape ──── */
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowDropdown(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  /* ──── Fetch employee list ──── */
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setLoadingEmployees(true);
        const res = await fetch("/api/employees");
        const data = await res.json();
        if (data.success) {
          setEmployees(data.employees || []);
        }
      } catch (err) {
        console.error("Error fetching employees:", err);
      } finally {
        setLoadingEmployees(false);
      }
    };
    fetchEmployees();
  }, []);

  /* ──── Filter employees for search ──── */
  const filteredEmployees = useMemo(() => {
    if (!searchQuery.trim()) return employees;
    const q = searchQuery.toLowerCase();
    return employees.filter(
      (e) =>
        e.name?.toLowerCase().includes(q) ||
        e.phone?.includes(q) ||
        e.department?.toLowerCase().includes(q),
    );
  }, [employees, searchQuery]);

  /* ──── Fetch form data ──── */
  const fetchFormData = async () => {
    if (!selectedEmployee) return;

    try {
      setLoading(true);
      setError(null);
      setHasFetched(true);

      const res = await fetch(
        `/api/admin/form-data?phone=${selectedEmployee.phone}&date=${selectedDate}`,
      );

      if (!res.ok) throw new Error("Failed to fetch form data");

      const result = await res.json();

      if (result.success) {
        setFormRecords(result.data || []);
        setEmployeeDetail(result.employee || null);
      } else {
        setError(result.error || "No data found");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /* ──── Toggle card expansion ──── */
  const toggleCard = (id: string) => {
    setExpandedCards((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  /* ──── Expand / collapse all ──── */
  const expandAll = () => {
    setExpandedCards(new Set(formRecords.map((r) => r._id)));
  };
  const collapseAll = () => {
    setExpandedCards(new Set());
  };

  /* ──── Stats ──── */
  const filledForms = formRecords.filter((r) => !r.formSkipped).length;
  const withPhotos = formRecords.filter(
    (r) => !r.photoSkipped && r.geotaggedPhotoUrl,
  ).length;
  const haltLocations = formRecords.filter(
    (r) => r.actionType === "halt_location",
  ).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100">
      <NavBar />
      <main className="max-w-screen-2xl mx-auto px-3 sm:px-6 pt-20 pb-10">
        {/* ──── Back Button ──── */}
        <div className="mb-6">
          <Link href="/admin">
            <Button
              variant="outline"
              className="flex items-center gap-2 shadow-sm bg-white hover:bg-gray-50 border-gray-200"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Admin Panel
            </Button>
          </Link>
        </div>

        {/* ──── Page Title ──── */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg mb-4">
            <ClipboardList className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
            Employee Form & Location Data
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            View form submissions, geotagged photos, and location data by
            employee
          </p>
        </div>

        {/* ──── Search & Filter Card ──── */}
        <div className="mb-8 rounded-2xl shadow-xl border border-gray-200 bg-white/90 backdrop-blur-sm relative z-20">
          <div className="border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-white px-6 py-4 rounded-t-2xl">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 shadow-sm flex-shrink-0">
                <Filter className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Search Employee
                </h2>
                <p className="text-xs text-slate-500">
                  Select an employee and date to view their submissions
                </p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
              {/* Employee Search */}
              <div className="md:col-span-5 relative" ref={searchRef}>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Employee
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder={
                      loadingEmployees
                        ? "Loading employees..."
                        : "Search by name, phone, or department..."
                    }
                    value={
                      selectedEmployee
                        ? `${selectedEmployee.name} (${selectedEmployee.phone})`
                        : searchQuery
                    }
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setSelectedEmployee(null);
                      setShowDropdown(true);
                    }}
                    onFocus={() => {
                      if (!selectedEmployee) setShowDropdown(true);
                    }}
                    className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all bg-gray-50/50"
                    disabled={loadingEmployees}
                  />
                  {selectedEmployee && (
                    <button
                      onClick={() => {
                        setSelectedEmployee(null);
                        setSearchQuery("");
                        setFormRecords([]);
                        setEmployeeDetail(null);
                        setHasFetched(false);
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* Dropdown */}
                {showDropdown && !selectedEmployee && (
                  <div className="absolute z-50 mt-1 w-full max-h-60 overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-2xl">
                    {filteredEmployees.length === 0 ? (
                      <div className="p-4 text-center text-sm text-gray-400">
                        No employees found
                      </div>
                    ) : (
                      filteredEmployees.map((emp) => (
                        <button
                          key={emp._id}
                          onClick={() => {
                            setSelectedEmployee(emp);
                            setSearchQuery("");
                            setShowDropdown(false);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-indigo-50 transition-colors border-b border-gray-50 last:border-0"
                        >
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 text-xs font-bold flex-shrink-0">
                            {emp.name?.charAt(0)?.toUpperCase() || "?"}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-800 truncate">
                              {emp.name}
                            </p>
                            <p className="text-xs text-gray-400 flex items-center gap-2">
                              <Phone className="h-3 w-3" /> {emp.phone}
                              {emp.department && (
                                <>
                                  <span className="text-gray-300">•</span>
                                  {emp.department}
                                </>
                              )}
                            </p>
                          </div>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium capitalize flex-shrink-0">
                            {emp.role}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Date Picker */}
              <div className="md:col-span-4">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Date
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all bg-gray-50/50"
                  />
                </div>
              </div>

              {/* Search Button */}
              <div className="md:col-span-3">
                <button
                  onClick={fetchFormData}
                  disabled={!selectedEmployee || loading}
                  className="w-full flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-sm font-semibold shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Fetching...
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4" />
                      View Data
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ──── Loading ──── */}
        {loading && (
          <div className="flex min-h-[30vh] flex-col items-center justify-center space-y-4 p-8">
            <div className="relative">
              <div className="h-16 w-16 rounded-full border-4 border-slate-100"></div>
              <div className="absolute top-0 left-0 h-16 w-16 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
            </div>
            <div className="text-center">
              <p className="text-lg font-medium text-slate-900">
                Retrieving Data
              </p>
              <p className="text-sm text-slate-500">
                Fetching form submissions and location data...
              </p>
            </div>
          </div>
        )}

        {/* ──── Error ──── */}
        {error && !loading && (
          <div className="flex min-h-[20vh] items-center justify-center p-6">
            <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-xl ring-1 ring-red-100">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
                <AlertCircle className="h-8 w-8 text-red-500" />
              </div>
              <h3 className="mb-2 text-xl font-bold text-slate-900">
                Unable to Load Data
              </h3>
              <p className="mb-6 text-slate-500">{error}</p>
              <button
                onClick={fetchFormData}
                className="rounded-lg bg-slate-900 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-slate-800"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* ──── Results Section ──── */}
        {!loading && !error && hasFetched && (
          <>
            {/* Employee Profile Card */}
            {employeeDetail && (
              <div className="mb-8 overflow-hidden rounded-2xl shadow-xl border border-gray-200 bg-white/90 backdrop-blur-sm">
                <div className="border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-white px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 shadow-sm flex-shrink-0">
                      <User className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">
                        {employeeDetail.name}
                      </h2>
                      <p className="text-xs font-medium uppercase tracking-wider text-indigo-600">
                        {employeeDetail.role}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-6 p-6 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                      <Phone className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-400">
                        Phone
                      </p>
                      <p className="text-sm font-semibold text-slate-700">
                        {employeeDetail.phone}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                      <Building2 className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-400">
                        Department
                      </p>
                      <p className="text-sm font-semibold text-slate-700 capitalize">
                        {employeeDetail.department || "—"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                      <Briefcase className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-400">
                        Location
                      </p>
                      <p className="text-sm font-semibold text-slate-700">
                        {employeeDetail.location || "—"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                      <Calendar className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-400">
                        Date of Joining
                      </p>
                      <p className="text-sm font-semibold text-slate-700">
                        {new Date(
                          employeeDetail.dateOfJoining,
                        ).toLocaleDateString("en-IN", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Stats Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
              <div className="bg-white/80 backdrop-blur-sm px-4 py-3 rounded-xl border border-indigo-100 shadow-sm">
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">
                  Total Submissions
                </p>
                <p className="text-2xl font-bold text-indigo-600 mt-1.5 flex items-center gap-2">
                  {formRecords.length}
                  {formRecords.length > 0 && (
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                    </span>
                  )}
                </p>
              </div>
              <div className="bg-white/80 backdrop-blur-sm px-4 py-3 rounded-xl border border-green-100 shadow-sm">
                <p className="text-xs text-green-600 font-semibold uppercase tracking-wider">
                  Filled Forms
                </p>
                <p className="text-2xl font-bold text-green-600 mt-1.5">
                  {filledForms}
                </p>
              </div>
              <div className="bg-white/80 backdrop-blur-sm px-4 py-3 rounded-xl border border-purple-100 shadow-sm">
                <p className="text-xs text-purple-600 font-semibold uppercase tracking-wider">
                  With Photos
                </p>
                <p className="text-2xl font-bold text-purple-600 mt-1.5">
                  {withPhotos}
                </p>
              </div>
              <div className="bg-white/80 backdrop-blur-sm px-4 py-3 rounded-xl border border-amber-100 shadow-sm">
                <p className="text-xs text-amber-600 font-semibold uppercase tracking-wider">
                  Halt Locations
                </p>
                <p className="text-2xl font-bold text-amber-600 mt-1.5">
                  {haltLocations}
                </p>
              </div>
            </div>

            {/* Expand/Collapse All */}
            {formRecords.length > 0 && (
              <div className="flex justify-end gap-2 mb-4">
                <button
                  onClick={expandAll}
                  className="text-xs font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 transition-colors"
                >
                  <ChevronDown className="h-3 w-3" /> Expand All
                </button>
                <button
                  onClick={collapseAll}
                  className="text-xs font-medium text-gray-500 hover:text-gray-700 flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  <ChevronUp className="h-3 w-3" /> Collapse All
                </button>
              </div>
            )}

            {/* Records List */}
            {formRecords.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white/60 backdrop-blur-sm py-16 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm border border-gray-200">
                  <FileText className="h-8 w-8 text-slate-300" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">
                  No Form Data Found
                </h3>
                <p className="text-slate-500 mt-1">
                  No form submissions for this employee on{" "}
                  {new Date(selectedDate).toLocaleDateString("en-GB")}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {formRecords.map((record, index) => {
                  const isExpanded = expandedCards.has(record._id);
                  const hasFormData = !record.formSkipped;
                  const hasPhoto =
                    !record.photoSkipped && record.geotaggedPhotoUrl;
                  const isHalt = record.actionType === "halt_location";

                  return (
                    <div
                      key={record._id}
                      className={`group relative overflow-hidden rounded-2xl shadow-md transition-all duration-300 hover:shadow-lg border ${
                        isHalt
                          ? "bg-amber-50/90 border-amber-200"
                          : "bg-white/90 border-gray-200 backdrop-blur-sm"
                      }`}
                    >
                      {/* Top gradient on hover */}
                      <div
                        className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r opacity-0 transition-opacity group-hover:opacity-100 ${
                          isHalt
                            ? "from-amber-400 to-orange-400"
                            : "from-indigo-500 to-purple-500"
                        }`}
                      />

                      {/* Card Header - Always Visible */}
                      <button
                        onClick={() => toggleCard(record._id)}
                        className="w-full text-left"
                      >
                        <div className="flex items-center justify-between gap-4 p-5">
                          {/* Left: Time & Type */}
                          <div className="flex items-center gap-3">
                            <div
                              className={`inline-flex h-10 w-10 items-center justify-center rounded-full transition-colors duration-300 flex-shrink-0 ${
                                isHalt
                                  ? "bg-amber-100 text-amber-600 group-hover:bg-amber-500 group-hover:text-white"
                                  : "bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white"
                              }`}
                            >
                              <span className="text-sm font-bold">
                                #{formRecords.length - index}
                              </span>
                            </div>
                            <div>
                              <p className="text-lg font-bold text-slate-900 flex items-center gap-2 flex-wrap">
                                {new Date(record.date).toLocaleTimeString(
                                  "en-IN",
                                  {
                                    timeZone: "Asia/Kolkata",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  },
                                )}
                                {isHalt && (
                                  <span className="inline-flex items-center rounded-md bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800 ring-1 ring-inset ring-amber-600/20">
                                    Halt
                                  </span>
                                )}
                                {hasFormData ? (
                                  <span className="inline-flex items-center rounded-md bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-800 ring-1 ring-inset ring-green-600/20">
                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                    Form Filled
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center rounded-md bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700 ring-1 ring-inset ring-red-600/20">
                                    <XCircle className="h-3 w-3 mr-1" />
                                    Skipped
                                  </span>
                                )}
                                {hasPhoto ? (
                                  <span className="inline-flex items-center rounded-md bg-purple-100 px-2 py-0.5 text-xs font-semibold text-purple-800 ring-1 ring-inset ring-purple-600/20">
                                    <Camera className="h-3 w-3 mr-1" />
                                    Photo
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-500 ring-1 ring-inset ring-gray-300/40">
                                    <Camera className="h-3 w-3 mr-1" />
                                    No Photo
                                  </span>
                                )}
                              </p>
                              <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                <MapPin className="h-3 w-3" />
                                {record.coords.lat.toFixed(6)},{" "}
                                {record.coords.lng.toFixed(6)}
                                {record.gpsAccuracy && (
                                  <span className="ml-2 text-gray-400">
                                    ±{record.gpsAccuracy.toFixed(0)}m
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>

                          {/* Right: Actions */}
                          <div className="flex items-center gap-3 flex-shrink-0">
                            <a
                              href={`https://www.google.com/maps?q=${record.coords.lat},${record.coords.lng}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="hidden sm:flex items-center gap-1.5 rounded-lg bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm border border-gray-200 transition-all hover:bg-slate-800 hover:text-white active:scale-95"
                            >
                              <Navigation className="h-3.5 w-3.5" />
                              Map
                            </a>
                            <div className="text-gray-400">
                              {isExpanded ? (
                                <ChevronUp className="h-5 w-5" />
                              ) : (
                                <ChevronDown className="h-5 w-5" />
                              )}
                            </div>
                          </div>
                        </div>
                      </button>

                      {/* Expanded Content */}
                      {isExpanded && (
                        <div className="border-t border-gray-100 animate-in fade-in slide-in-from-top-2 duration-200">
                          {/* Mobile Map Button */}
                          <div className="sm:hidden px-5 pt-4">
                            <a
                              href={`https://www.google.com/maps?q=${record.coords.lat},${record.coords.lng}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-center gap-2 rounded-lg bg-slate-800 px-4 py-2.5 text-sm font-semibold text-white w-full shadow-sm"
                            >
                              <Navigation className="h-4 w-4" />
                              View on Google Maps
                            </a>
                          </div>

                          {/* Geotagged Photo */}
                          {hasPhoto && (
                            <div className="px-5 pt-5">
                              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                <Camera className="h-3.5 w-3.5" /> Geotagged
                                Photo
                              </p>
                              <div className="relative group/photo inline-block">
                                <img
                                  src={record.geotaggedPhotoUrl}
                                  alt="Geotagged photo"
                                  className="rounded-xl border border-gray-200 shadow-sm max-h-64 object-cover cursor-pointer transition-transform hover:scale-[1.02]"
                                  onClick={() =>
                                    setLightboxUrl(record.geotaggedPhotoUrl)
                                  }
                                />
                                <button
                                  onClick={() =>
                                    setLightboxUrl(record.geotaggedPhotoUrl)
                                  }
                                  className="absolute top-2 right-2 bg-black/50 backdrop-blur-sm text-white p-1.5 rounded-lg opacity-0 group-hover/photo:opacity-100 transition-opacity"
                                >
                                  <Eye className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Coordinates Block */}
                          <div className="px-5 pt-5">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                              <MapPin className="h-3.5 w-3.5" /> Location
                              Coordinates
                            </p>
                            <div className="flex items-center gap-6 rounded-xl bg-slate-50 px-4 py-3 border border-slate-100 inline-flex">
                              <div className="flex flex-col">
                                <span className="text-xs font-medium text-slate-500 mb-1">
                                  Latitude
                                </span>
                                <span className="font-mono text-sm font-semibold text-slate-700">
                                  {record.coords.lat.toFixed(6)}
                                </span>
                              </div>
                              <div className="h-8 w-px bg-slate-200"></div>
                              <div className="flex flex-col">
                                <span className="text-xs font-medium text-slate-500 mb-1">
                                  Longitude
                                </span>
                                <span className="font-mono text-sm font-semibold text-slate-700">
                                  {record.coords.lng.toFixed(6)}
                                </span>
                              </div>
                              {record.gpsAccuracy && (
                                <>
                                  <div className="h-8 w-px bg-slate-200"></div>
                                  <div className="flex flex-col">
                                    <span className="text-xs font-medium text-slate-500 mb-1">
                                      Accuracy
                                    </span>
                                    <span className="font-mono text-sm font-semibold text-slate-700">
                                      ±{record.gpsAccuracy.toFixed(0)}m
                                    </span>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Form Fields */}
                          {hasFormData ? (
                            <div className="px-5 pt-5 pb-6">
                              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                <FileText className="h-3.5 w-3.5" /> Form Data
                              </p>
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {FORM_FIELDS.map((field) => {
                                  const value =
                                    record[field.key] as string;
                                  if (!value) return null;
                                  return (
                                    <div
                                      key={field.key}
                                      className="rounded-lg bg-gray-50 px-3 py-2.5 border border-gray-100"
                                    >
                                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                                        {field.label}
                                      </p>
                                      <p className="text-sm font-medium text-gray-800 mt-0.5 break-words">
                                        {value}
                                      </p>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ) : (
                            <div className="px-5 pt-5 pb-6">
                              <div className="flex items-center gap-3 rounded-xl bg-red-50 px-4 py-3 border border-red-100">
                                <XCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
                                <p className="text-sm text-red-600">
                                  Form was skipped for this location submission
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ──── Initial State (No search yet) ──── */}
        {!hasFetched && !loading && (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white/60 backdrop-blur-sm py-20 text-center">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 shadow-sm">
              <Search className="h-10 w-10 text-indigo-400" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900">
              Select an Employee
            </h3>
            <p className="text-slate-500 mt-1 max-w-sm">
              Search for an employee and pick a date to view their form
              submissions and geotagged location data
            </p>
          </div>
        )}
      </main>

      {/* ──── Photo Lightbox ──── */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setLightboxUrl(null)}
        >
          <button
            onClick={() => setLightboxUrl(null)}
            className="absolute top-4 right-4 text-white/80 hover:text-white p-2 rounded-full bg-white/10 backdrop-blur-sm transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
          <img
            src={lightboxUrl}
            alt="Geotagged photo"
            className="max-w-full max-h-[90vh] rounded-xl shadow-2xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
