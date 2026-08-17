"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";

// ─────────────────────────────────────────────
// FORM OPTIONS — Exact 19 fields from the PDF
// ─────────────────────────────────────────────

const ADDRESS_VISITED_OPTIONS = [
  "Residance",
  "Office",
  "CIBIL",
  "New Address Traced",
];

const CM_AVAILABLE_OPTIONS = ["Yes", "No"];

const PERSON_MET_OPTIONS = [
  "None",
  "Customer",
  "Spouse ( Husband/Wife)",
  "Father",
  "Mother",
  "Brother",
  "Sister",
  "son / doughter",
  "Relative",
  "Neighbour/ Locality person",
  "Boss/Supervisor/Colleague",
  "Friend",
  "Gaurd",
];

const VISITED_ADDRESS_STATUS_OPTIONS = [
  "Owned / Parantel",
  "Rented",
  "ANF ( Add not Found)",
];

const KEYWORD_OPTIONS = [
  "ANF- INCOMPLETE ADDRESS",
  "ANF- WRONG ADD / NO SUCH ADD",
  "CB - MORE SEARCHING REQUIRED",
  "CB_RESP_PERSON_NOT AVAILABLE",
  "CLAIMS_PAID",
  "CLAIMS_SETTLED",
  "DEATH__NOT_CONFIRMED",
  "DEATH_CONFIRMED WITH DEATH CETRIFICATE",
  "DISPUTE / ISSUE",
  "FC - WANTS FORECLOSURE",
  "FC_NEXT MONTH",
  "NCTP - NO CAPICITY TO PAY",
  "CUSTOMER NEVER LIVED /WORKED",
  "NITP - NO INTENTION TO PAY",
  "PAID",
  "PTP",
  "PTP_NM",
  "PTP_RB",
  "OL-OUT LOCATION CASE",
  "REPO ALREADY DONE",
  "SHIFTED- MORE THAN 6 MONTHS",
  "SHIFTED- WITHIN 6 MONTHS",
  "SKIP -NOT TRACABLE",
  "UNDER_SETTLEMENT",
  "WANTS SETTLEMENT",
  "WANTS SETTLEMENT _NEXT_MONTH",
];

const OCCUPATION_OPTIONS = [
  "Government Employee",
  "Not available/ known",
  "Business Owner",
  "Shop Owner",
  "Small Pvt. Job",
  "MNC /Bank/ Corporate",
];

const CONTACTABLE_OPTIONS = ["Contactactable", "Non Contactacttable"];

const PROJECTION_OPTIONS = ["100%", "50-50%", "No Payment Yet"];

const CASE_RETAIN_OPTIONS = ["Yes", "No"];

const CASE_WORKABLE_OPTIONS = ["Workable", "Non workable"];

const SETTLEMENT_CASE_OPTIONS = [
  "RUNNING SETTLEMENT",
  "NORMAL PAYMENT",
  "New Settlement",
  "NA",
];

const RETENTION_PRIORITY_OPTIONS = [
  "P1- ( First Priority- PTP/ Future PTP, Paying etc)",
  "P2- ( Second Priority- Customer can pay in future -under followup)",
  "P3- ( Third Priority - Very less chance of payment)",
  "P4- ( Fourth priority- No chance of payment)",
  "P5- (Do not retain- Death/ Skip/ NCTP/other)",
];

const RRC_OPTIONS = ["Yes", "No", "NA- not applicable"];

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

type FormData = {
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
};

type FlowStep = "FORM" | "PHOTO" | "CONFIRM";

type LocationFlowModalsProps = {
  isOpen: boolean;
  onComplete: (data: {
    formData: FormData;
    formSkipped: boolean;
    photoSkipped: boolean;
    geotaggedPhotoBlob: Blob | null;
  }) => void;
  onCancel: () => void;
  currentCoords: { lat: number; lng: number } | null;
  gpsAccuracy: number | null;
  employeeName: string;
  employeePhone: string;
};

// ─────────────────────────────────────────────
// HELPER: Geotag watermark burn on canvas
// ─────────────────────────────────────────────

async function burnGeotagOnImage(
  base64Data: string,
  coords: { lat: number; lng: number },
  accuracy: number | null,
  employeeName: string,
  employeePhone: string,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      // Scale down to max 1080px width
      const MAX_WIDTH = 1080;
      let width = img.width;
      let height = img.height;
      if (width > MAX_WIDTH) {
        height = Math.round((height * MAX_WIDTH) / width);
        width = MAX_WIDTH;
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas context unavailable"));

      // Draw the photo
      ctx.drawImage(img, 0, 0, width, height);

      // ── Geotag Watermark Banner ──
      const bannerHeight = Math.max(70, height * 0.1);
      const bannerY = height - bannerHeight;

      // Semi-transparent dark banner
      ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
      ctx.fillRect(0, bannerY, width, bannerHeight);

      // Text styling
      const fontSize = Math.max(12, Math.round(bannerHeight / 5));
      ctx.fillStyle = "#FFFFFF";
      ctx.font = `bold ${fontSize}px Arial, sans-serif`;
      ctx.textBaseline = "top";

      const padding = 10;
      const lineHeight = fontSize + 4;
      let textY = bannerY + padding;

      // Line 1: GPS coordinates
      const coordsText = `📍 ${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}${accuracy ? ` (±${accuracy.toFixed(1)}m)` : ""}`;
      ctx.fillText(coordsText, padding, textY);
      textY += lineHeight;

      // Line 2: Timestamp (IST)
      const now = new Date();
      const istOptions: Intl.DateTimeFormatOptions = {
        timeZone: "Asia/Kolkata",
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      };
      const timeText = `⏰ ${now.toLocaleString("en-IN", istOptions)} IST`;
      ctx.fillText(timeText, padding, textY);
      textY += lineHeight;

      // Line 3: Employee info
      const empText = `👤 ${employeeName} (${employeePhone})`;
      ctx.font = `${fontSize - 2}px Arial, sans-serif`;
      ctx.fillText(empText, padding, textY);

      // Export as JPEG blob at 0.75 quality (~200-300KB)
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Canvas toBlob failed"));
        },
        "image/jpeg",
        0.75,
      );
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = base64Data.startsWith("data:")
      ? base64Data
      : `data:image/jpeg;base64,${base64Data}`;
  });
}

// ─────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────

export default function LocationFlowModals({
  isOpen,
  onComplete,
  onCancel,
  currentCoords,
  gpsAccuracy,
  employeeName,
  employeePhone,
}: LocationFlowModalsProps) {
  // ── State Machine ──
  const [step, setStep] = useState<FlowStep>("FORM");

  // ── Form State ──
  const [formSkipped, setFormSkipped] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    visitDate: new Date().toISOString().split("T")[0],
    accountNo: "",
    customerName: "",
    addressVisited: "",
    cmAvailableAtAdd: "",
    personMetAtAddress: "",
    visitedAddressStatus: "",
    keyword: "",
    occupation: "",
    fieldVisitContactable: "",
    feedbackInDetail: "",
    ptpNextVisitDate: "",
    ptpAmount: "",
    projection: "",
    caseToRetain: "",
    caseWorkable: "",
    settlementCase: "",
    retentionPriority: "",
    rrcToFile: "",
  });
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [keywordSearch, setKeywordSearch] = useState("");

  // ── Accordion State ──
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(["visit"]));

  // ── Photo State ──
  const [photoSkipped, setPhotoSkipped] = useState(false);
  const [geotaggedPhotoBlob, setGeotaggedPhotoBlob] = useState<Blob | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  // ── Submission State ──
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setStep("FORM");
      setFormSkipped(false);
      setPhotoSkipped(false);
      setGeotaggedPhotoBlob(null);
      setPhotoPreviewUrl(null);
      setFormErrors({});
      setKeywordSearch("");
      setOpenSections(new Set(["visit"]));
      setIsSubmitting(false);
      setFormData({
        visitDate: new Date().toISOString().split("T")[0],
        accountNo: "",
        customerName: "",
        addressVisited: "",
        cmAvailableAtAdd: "",
        personMetAtAddress: "",
        visitedAddressStatus: "",
        keyword: "",
        occupation: "",
        fieldVisitContactable: "",
        feedbackInDetail: "",
        ptpNextVisitDate: "",
        ptpAmount: "",
        projection: "",
        caseToRetain: "",
        caseWorkable: "",
        settlementCase: "",
        retentionPriority: "",
        rrcToFile: "",
      });
    }
  }, [isOpen]);

  // Cleanup photo preview URL
  useEffect(() => {
    return () => {
      if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
    };
  }, [photoPreviewUrl]);

  // ── Form Handlers ──
  const updateField = useCallback(
    (field: keyof FormData, value: string) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      if (formErrors[field]) {
        setFormErrors((prev) => {
          const next = { ...prev };
          delete next[field];
          return next;
        });
      }
    },
    [formErrors],
  );

  const toggleSection = useCallback((section: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) next.delete(section);
      else next.add(section);
      return next;
    });
  }, []);

  const validateForm = useCallback((): boolean => {
    const errors: Partial<Record<keyof FormData, string>> = {};
    if (!formData.accountNo.trim()) errors.accountNo = "Account No is required";
    if (!formData.customerName.trim()) errors.customerName = "Customer name is required";
    if (!formData.addressVisited) errors.addressVisited = "Select address visited type";
    if (!formData.keyword) errors.keyword = "Select a keyword";

    setFormErrors(errors);

    // Auto-expand sections with errors
    if (errors.accountNo || errors.customerName || errors.addressVisited) {
      setOpenSections((prev) => new Set([...prev, "visit"]));
    }
    if (errors.keyword) {
      setOpenSections((prev) => new Set([...prev, "assessment"]));
    }

    return Object.keys(errors).length === 0;
  }, [formData]);

  const handleFillAndSubmit = useCallback(() => {
    if (validateForm()) {
      setFormSkipped(false);
      setStep("PHOTO");
    }
  }, [validateForm]);

  const handleSkipForm = useCallback(() => {
    setFormSkipped(true);
    setStep("PHOTO");
  }, []);

  // ── Photo Handlers ──
  const handleCapturePhoto = useCallback(async () => {
    if (!currentCoords) {
      alert("📍 GPS not available. Please wait for location lock.");
      return;
    }

    setIsCapturing(true);

    try {
      // Use @capacitor/camera with CameraSource.Camera (no gallery)
      const photo = await Camera.getPhoto({
        quality: 85,
        resultType: CameraResultType.Base64,
        source: CameraSource.Camera, // ← Anti-fraud: camera only, no gallery
        width: 1080,
        correctOrientation: true,
      });

      if (!photo.base64String) throw new Error("No photo data received");

      // Burn GPS watermark onto the photo using canvas
      const watermarkedBlob = await burnGeotagOnImage(
        photo.base64String,
        currentCoords,
        gpsAccuracy,
        employeeName,
        employeePhone,
      );

      // Clean up old preview
      if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);

      setGeotaggedPhotoBlob(watermarkedBlob);
      setPhotoPreviewUrl(URL.createObjectURL(watermarkedBlob));
      setPhotoSkipped(false);
    } catch (err: any) {
      // User cancelled or camera error
      if (err.message?.includes("cancelled") || err.message?.includes("canceled")) {
        console.log("Camera cancelled by user");
      } else {
        console.error("Camera capture error:", err);
        alert("📷 Camera error: " + (err.message || "Failed to capture photo"));
      }
    } finally {
      setIsCapturing(false);
    }
  }, [currentCoords, gpsAccuracy, employeeName, employeePhone, photoPreviewUrl]);

  const handleRetakePhoto = useCallback(() => {
    if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
    setGeotaggedPhotoBlob(null);
    setPhotoPreviewUrl(null);
    setPhotoSkipped(false);
  }, [photoPreviewUrl]);

  const handleSkipPhoto = useCallback(() => {
    setPhotoSkipped(true);
    setGeotaggedPhotoBlob(null);
    if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
    setPhotoPreviewUrl(null);
    setStep("CONFIRM");
  }, [photoPreviewUrl]);

  const handlePhotoSubmit = useCallback(() => {
    setStep("CONFIRM");
  }, []);

  // ── Confirmation Handler ──
  const handleConfirmAndSend = useCallback(async () => {
    setIsSubmitting(true);
    try {
      await onComplete({
        formData,
        formSkipped,
        photoSkipped,
        geotaggedPhotoBlob,
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, formSkipped, photoSkipped, geotaggedPhotoBlob, onComplete]);

  // ── Don't render if not open ──
  if (!isOpen) return null;

  // ── Filtered keywords for search ──
  const filteredKeywords = keywordSearch
    ? KEYWORD_OPTIONS.filter((k) =>
        k.toLowerCase().includes(keywordSearch.toLowerCase()),
      )
    : KEYWORD_OPTIONS;

  // ═══════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50 p-4">
      <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-200 w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-white flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-gray-800">
              {step === "FORM" && "📋 Field Visit Form"}
              {step === "PHOTO" && "📸 Geotagged Photo"}
              {step === "CONFIRM" && "✅ Confirm & Send"}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              {/* Step indicators */}
              {(["FORM", "PHOTO", "CONFIRM"] as FlowStep[]).map((s, i) => (
                <React.Fragment key={s}>
                  <span
                    className={`h-2.5 w-2.5 rounded-full transition-all ${
                      step === s
                        ? "bg-blue-500 scale-125"
                        : (["FORM", "PHOTO", "CONFIRM"].indexOf(step) > i
                          ? "bg-green-400"
                          : "bg-gray-300")
                    }`}
                  />
                  {i < 2 && (
                    <span className="h-0.5 w-4 bg-gray-200 rounded-full" />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 text-xl p-1 transition-colors"
            title="Close"
          >
            ✕
          </button>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {/* ════════════════════════════════════════ */}
          {/* STEP 1: FORM                            */}
          {/* ════════════════════════════════════════ */}
          {step === "FORM" && (
            <div className="space-y-3">
              {/* GPS Info Bar */}
              {currentCoords && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-50 border border-green-200 text-xs text-green-700">
                  <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  📍 {currentCoords.lat.toFixed(6)}, {currentCoords.lng.toFixed(6)}
                  {gpsAccuracy && ` (±${gpsAccuracy.toFixed(0)}m)`}
                </div>
              )}

              {/* ── Section 1: Visit Info ── */}
              <AccordionSection
                title="🏢 Visit Information"
                isOpen={openSections.has("visit")}
                onToggle={() => toggleSection("visit")}
              >
                <FormField label="Visit Date" required>
                  <input
                    type="date"
                    value={formData.visitDate}
                    onChange={(e) => updateField("visitDate", e.target.value)}
                    className="form-input"
                  />
                </FormField>
                <FormField label="ACCOUNT NO (FULL)" required error={formErrors.accountNo}>
                  <input
                    type="text"
                    value={formData.accountNo}
                    onChange={(e) => updateField("accountNo", e.target.value)}
                    placeholder="Enter full account number"
                    className="form-input"
                  />
                </FormField>
                <FormField label="Customer Name" required error={formErrors.customerName}>
                  <input
                    type="text"
                    value={formData.customerName}
                    onChange={(e) => updateField("customerName", e.target.value)}
                    placeholder="Enter customer name"
                    className="form-input"
                  />
                </FormField>
                <FormField label="Address Visited" required error={formErrors.addressVisited}>
                  <RadioGroup
                    options={ADDRESS_VISITED_OPTIONS}
                    value={formData.addressVisited}
                    onChange={(v) => updateField("addressVisited", v)}
                  />
                </FormField>
                <FormField label="CM Available At Address">
                  <RadioGroup
                    options={CM_AVAILABLE_OPTIONS}
                    value={formData.cmAvailableAtAdd}
                    onChange={(v) => updateField("cmAvailableAtAdd", v)}
                  />
                </FormField>
                <FormField label="Person Met at Address">
                  <RadioGroup
                    options={PERSON_MET_OPTIONS}
                    value={formData.personMetAtAddress}
                    onChange={(v) => updateField("personMetAtAddress", v)}
                    columns={2}
                  />
                </FormField>
                <FormField label="Visited Address Status">
                  <RadioGroup
                    options={VISITED_ADDRESS_STATUS_OPTIONS}
                    value={formData.visitedAddressStatus}
                    onChange={(v) => updateField("visitedAddressStatus", v)}
                  />
                </FormField>
              </AccordionSection>

              {/* ── Section 2: Field Assessment ── */}
              <AccordionSection
                title="📝 Field Assessment"
                isOpen={openSections.has("assessment")}
                onToggle={() => toggleSection("assessment")}
              >
                <FormField label="Keyword" required error={formErrors.keyword}>
                  <input
                    type="text"
                    value={keywordSearch}
                    onChange={(e) => setKeywordSearch(e.target.value)}
                    placeholder="🔍 Search keyword..."
                    className="form-input mb-2"
                  />
                  <div className="max-h-36 overflow-y-auto rounded-lg border border-gray-200 bg-white">
                    {filteredKeywords.map((kw) => (
                      <button
                        key={kw}
                        type="button"
                        onClick={() => {
                          updateField("keyword", kw);
                          setKeywordSearch("");
                        }}
                        className={`w-full text-left px-3 py-1.5 text-xs border-b border-gray-50 transition-colors ${
                          formData.keyword === kw
                            ? "bg-blue-50 text-blue-700 font-medium"
                            : "hover:bg-gray-50 text-gray-700"
                        }`}
                      >
                        {kw}
                      </button>
                    ))}
                  </div>
                  {formData.keyword && (
                    <div className="mt-1 text-xs text-blue-600 font-medium">
                      Selected: {formData.keyword}
                    </div>
                  )}
                </FormField>
                <FormField label="Occupation (Work Profile)">
                  <RadioGroup
                    options={OCCUPATION_OPTIONS}
                    value={formData.occupation}
                    onChange={(v) => updateField("occupation", v)}
                    columns={2}
                  />
                </FormField>
                <FormField label="Field Visit Contactable">
                  <RadioGroup
                    options={CONTACTABLE_OPTIONS}
                    value={formData.fieldVisitContactable}
                    onChange={(v) => updateField("fieldVisitContactable", v)}
                  />
                </FormField>
                <FormField label="FEEDBACK IN DETAIL">
                  <textarea
                    value={formData.feedbackInDetail}
                    onChange={(e) => updateField("feedbackInDetail", e.target.value)}
                    placeholder="Enter detailed feedback..."
                    rows={3}
                    className="form-input resize-none"
                  />
                </FormField>
              </AccordionSection>

              {/* ── Section 3: Recovery Details ── */}
              <AccordionSection
                title="💰 Recovery Details"
                isOpen={openSections.has("recovery")}
                onToggle={() => toggleSection("recovery")}
              >
                <FormField label="PTP / NEXT VISIT DATE">
                  <input
                    type="date"
                    value={formData.ptpNextVisitDate}
                    onChange={(e) => updateField("ptpNextVisitDate", e.target.value)}
                    className="form-input"
                  />
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    If no date — select 1st date of month
                  </p>
                </FormField>
                <FormField label="PTP Amount (in figures only)">
                  <input
                    type="number"
                    value={formData.ptpAmount}
                    onChange={(e) => updateField("ptpAmount", e.target.value)}
                    placeholder="Enter amount"
                    className="form-input"
                  />
                </FormField>
                <FormField label="Projection">
                  <RadioGroup
                    options={PROJECTION_OPTIONS}
                    value={formData.projection}
                    onChange={(v) => updateField("projection", v)}
                  />
                </FormField>
                <FormField label="Case to Retain (Keep)">
                  <RadioGroup
                    options={CASE_RETAIN_OPTIONS}
                    value={formData.caseToRetain}
                    onChange={(v) => updateField("caseToRetain", v)}
                  />
                </FormField>
                <FormField label="Case Workable / Non workable">
                  <RadioGroup
                    options={CASE_WORKABLE_OPTIONS}
                    value={formData.caseWorkable}
                    onChange={(v) => updateField("caseWorkable", v)}
                  />
                </FormField>
                <FormField label="Settlement Case">
                  <RadioGroup
                    options={SETTLEMENT_CASE_OPTIONS}
                    value={formData.settlementCase}
                    onChange={(v) => updateField("settlementCase", v)}
                    columns={2}
                  />
                </FormField>
                <FormField label="Retention Priority">
                  <RadioGroup
                    options={RETENTION_PRIORITY_OPTIONS}
                    value={formData.retentionPriority}
                    onChange={(v) => updateField("retentionPriority", v)}
                    columns={1}
                  />
                </FormField>
                <FormField label="RRC to file">
                  <RadioGroup
                    options={RRC_OPTIONS}
                    value={formData.rrcToFile}
                    onChange={(v) => updateField("rrcToFile", v)}
                  />
                </FormField>
              </AccordionSection>
            </div>
          )}

          {/* ════════════════════════════════════════ */}
          {/* STEP 2: PHOTO                           */}
          {/* ════════════════════════════════════════ */}
          {step === "PHOTO" && (
            <div className="space-y-4">
              {/* Live GPS Info */}
              {currentCoords && (
                <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-3 space-y-1">
                  <div className="flex items-center gap-2 text-xs font-semibold text-blue-700">
                    <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                    Live GPS Lock
                  </div>
                  <div className="text-xs text-blue-600 font-mono">
                    📍 {currentCoords.lat.toFixed(6)}, {currentCoords.lng.toFixed(6)}
                    {gpsAccuracy && ` (±${gpsAccuracy.toFixed(0)}m)`}
                  </div>
                  <div className="text-[10px] text-blue-500">
                    ⏰ {new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true })} IST
                    &nbsp;·&nbsp; 👤 {employeeName}
                  </div>
                </div>
              )}

              {/* Photo Preview or Capture Button */}
              {photoPreviewUrl ? (
                <div className="space-y-3">
                  <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm">
                    <img
                      src={photoPreviewUrl}
                      alt="Geotagged preview"
                      className="w-full object-contain max-h-[40vh]"
                    />
                  </div>
                  <p className="text-[10px] text-center text-gray-400">
                    GPS coordinates and timestamp are permanently watermarked into the photo
                  </p>
                  <button
                    onClick={handleRetakePhoto}
                    className="w-full py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium transition-all"
                  >
                    🔄 Retake Photo
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4 py-6">
                  <div className="w-24 h-24 rounded-full bg-blue-50 border-2 border-blue-200 flex items-center justify-center">
                    <span className="text-4xl">📸</span>
                  </div>
                  <p className="text-sm text-gray-500 text-center max-w-xs">
                    Take a live photo of the area. GPS coordinates and timestamp will be
                    permanently watermarked into the image.
                  </p>
                  <button
                    onClick={handleCapturePhoto}
                    disabled={isCapturing}
                    className={`w-full py-3 rounded-xl text-white font-semibold text-sm transition-all shadow-md ${
                      isCapturing
                        ? "bg-blue-400 cursor-wait"
                        : "bg-blue-600 hover:bg-blue-700 active:scale-[0.98]"
                    }`}
                  >
                    {isCapturing ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Opening Camera...
                      </span>
                    ) : (
                      "📷 Take Photo"
                    )}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ════════════════════════════════════════ */}
          {/* STEP 3: CONFIRMATION                    */}
          {/* ════════════════════════════════════════ */}
          {step === "CONFIRM" && (
            <div className="space-y-4">
              {/* Coordinates */}
              {currentCoords && (
                <div className="rounded-lg bg-gray-50 border border-gray-200 p-3">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                    Location
                  </p>
                  <p className="text-sm font-mono text-gray-700">
                    📍 {currentCoords.lat.toFixed(6)}, {currentCoords.lng.toFixed(6)}
                  </p>
                </div>
              )}

              {/* Form Summary */}
              <div className="rounded-lg bg-gray-50 border border-gray-200 p-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Form Data
                </p>
                {formSkipped ? (
                  <span className="inline-block px-2.5 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-700 border border-yellow-200">
                    ⏭️ Form Skipped
                  </span>
                ) : (
                  <div className="space-y-1.5 text-xs text-gray-700">
                    {Object.entries(formData).map(([key, value]) => {
                      if (!value) return null;
                      const label = key
                        .replace(/([A-Z])/g, " $1")
                        .replace(/^./, (s) => s.toUpperCase());
                      return (
                        <div key={key} className="flex gap-2">
                          <span className="font-medium text-gray-500 min-w-[120px]">
                            {label}:
                          </span>
                          <span className="text-gray-800 break-words">{value}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Photo Summary */}
              <div className="rounded-lg bg-gray-50 border border-gray-200 p-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Geotagged Photo
                </p>
                {photoSkipped ? (
                  <span className="inline-block px-2.5 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-700 border border-yellow-200">
                    ⏭️ Photo Skipped
                  </span>
                ) : photoPreviewUrl ? (
                  <div className="rounded-lg overflow-hidden border border-gray-200">
                    <img
                      src={photoPreviewUrl}
                      alt="Geotagged preview"
                      className="w-full object-contain max-h-[30vh]"
                    />
                  </div>
                ) : (
                  <p className="text-xs text-gray-400">No photo</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── Footer Actions ── */}
        <div className="px-5 py-4 border-t border-gray-100 bg-gray-50/50 flex-shrink-0">
          {step === "FORM" && (
            <div className="flex gap-3">
              <button
                onClick={handleSkipForm}
                className="flex-1 py-2.5 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm font-medium transition-all"
              >
                ⏭️ Skip & Submit
              </button>
              <button
                onClick={handleFillAndSubmit}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-all shadow-md active:scale-[0.98]"
              >
                ✅ Fill & Submit
              </button>
            </div>
          )}

          {step === "PHOTO" && (
            <div className="flex gap-3">
              <button
                onClick={handleSkipPhoto}
                className="flex-1 py-2.5 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm font-medium transition-all"
              >
                ⏭️ Skip Photo
              </button>
              {photoPreviewUrl && (
                <button
                  onClick={handlePhotoSubmit}
                  className="flex-1 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-semibold transition-all shadow-md active:scale-[0.98]"
                >
                  ✅ Submit Photo
                </button>
              )}
            </div>
          )}

          {step === "CONFIRM" && (
            <div className="flex gap-3">
              <button
                onClick={() => setStep("PHOTO")}
                disabled={isSubmitting}
                className="py-2.5 px-4 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm font-medium transition-all"
              >
                ← Back
              </button>
              <button
                onClick={handleConfirmAndSend}
                disabled={isSubmitting}
                className={`flex-1 py-2.5 rounded-xl text-white text-sm font-semibold transition-all shadow-md ${
                  isSubmitting
                    ? "bg-green-400 cursor-wait"
                    : "bg-green-600 hover:bg-green-700 active:scale-[0.98]"
                }`}
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Sending...
                  </span>
                ) : (
                  "✅ Confirm & Send Location"
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────

function AccordionSection({
  title,
  isOpen,
  onToggle,
  children,
}: {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden bg-white">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <span className="text-sm font-semibold text-gray-700">{title}</span>
        <span
          className={`text-gray-400 text-xs transition-transform ${isOpen ? "rotate-180" : ""}`}
        >
          ▼
        </span>
      </button>
      {isOpen && <div className="px-4 py-3 space-y-3">{children}</div>}
    </div>
  );
}

function FormField({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-red-500 text-[10px] mt-0.5">{error}</p>}
    </div>
  );
}

function RadioGroup({
  options,
  value,
  onChange,
  columns = 2,
}: {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  columns?: number;
}) {
  return (
    <div
      className="grid gap-1.5"
      style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
    >
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={`text-left px-2.5 py-1.5 rounded-lg text-xs border transition-all ${
            value === opt
              ? "bg-blue-50 border-blue-300 text-blue-700 font-medium"
              : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
          }`}
        >
          {value === opt && "✓ "}{opt}
        </button>
      ))}
    </div>
  );
}
