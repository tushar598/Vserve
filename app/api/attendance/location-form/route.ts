import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { connectDB } from "@/lib/db";
import LocationFormData from "@/models/LocationFormData";
import Employee from "@/models/employee";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

/**
 * POST — Save a LocationFormData record with optional geotagged photo upload to Vercel Blob.
 *
 * Accepts multipart/form-data with:
 *   - All form fields as text parts
 *   - Optional "photo" file part (geotagged JPEG from canvas)
 *
 * OR JSON body (when photo is skipped).
 */
export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const contentType = req.headers.get("content-type") || "";
    let body: Record<string, any> = {};
    let photoFile: File | null = null;

    // ──── Parse Request Body ────
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();

      // Extract the photo file if present
      const photoEntry = formData.get("photo");
      if (photoEntry && photoEntry instanceof File && photoEntry.size > 0) {
        photoFile = photoEntry;
      }

      // Extract all other fields
      for (const [key, value] of formData.entries()) {
        if (key !== "photo") {
          body[key] = value as string;
        }
      }
    } else {
      body = await req.json();
    }

    // ──── Validate Required Fields ────
    const {
      sentLocationId,
      phone,
      actionType = "send_location",
      formSkipped = "false",
      photoSkipped = "false",
      gpsAccuracy,
      // Coords passed as strings from FormData
      coordsLat,
      coordsLng,
      // Form fields
      visitDate,
      accountNo,
      customerName,
      addressVisited,
      cmAvailableAtAdd,
      personMetAtAddress,
      visitedAddressStatus,
      keyword,
      occupation,
      fieldVisitContactable,
      feedbackInDetail,
      ptpNextVisitDate,
      ptpAmount,
      projection,
      caseToRetain,
      caseWorkable,
      settlementCase,
      retentionPriority,
      rrcToFile,
    } = body;

    if (!sentLocationId || !phone) {
      return NextResponse.json(
        { success: false, error: "sentLocationId and phone are required" },
        { status: 400 },
      );
    }

    const lat = parseFloat(coordsLat);
    const lng = parseFloat(coordsLng);

    if (isNaN(lat) || isNaN(lng)) {
      return NextResponse.json(
        { success: false, error: "Valid coordinates are required" },
        { status: 400 },
      );
    }

    // ──── Find Employee ────
    const employee = await Employee.findOne({ phone });
    if (!employee) {
      return NextResponse.json(
        { success: false, error: "Employee not found" },
        { status: 404 },
      );
    }

    // ──── Upload Photo to Vercel Blob (if provided) ────
    let geotaggedPhotoUrl = "";

    if (photoFile) {
      const timestamp = dayjs().tz("Asia/Kolkata").format("YYYY-MM-DD_HH-mm-ss");
      const fileName = `vserve/geotagged/${phone}/${timestamp}.jpg`;

      const blob = await put(fileName, photoFile, {
        access: "public",
        token: process.env.vserve_READ_WRITE_TOKEN,
      });

      geotaggedPhotoUrl = blob.url;
    }

    // ──── Create LocationFormData Record ────
    const nowIST = dayjs().tz("Asia/Kolkata").toDate();

    const record = await LocationFormData.create({
      sentLocationId,
      employeeId: employee._id,
      phone,
      date: nowIST,
      coords: { lat, lng },
      gpsAccuracy: gpsAccuracy ? parseFloat(gpsAccuracy) : null,
      actionType,
      formSkipped: formSkipped === "true" || formSkipped === true,
      photoSkipped: photoSkipped === "true" || photoSkipped === true,

      // Form fields
      visitDate: visitDate || "",
      accountNo: accountNo || "",
      customerName: customerName || "",
      addressVisited: addressVisited || "",
      cmAvailableAtAdd: cmAvailableAtAdd || "",
      personMetAtAddress: personMetAtAddress || "",
      visitedAddressStatus: visitedAddressStatus || "",
      keyword: keyword || "",
      occupation: occupation || "",
      fieldVisitContactable: fieldVisitContactable || "",
      feedbackInDetail: feedbackInDetail || "",
      ptpNextVisitDate: ptpNextVisitDate || "",
      ptpAmount: ptpAmount || "",
      projection: projection || "",
      caseToRetain: caseToRetain || "",
      caseWorkable: caseWorkable || "",
      settlementCase: settlementCase || "",
      retentionPriority: retentionPriority || "",
      rrcToFile: rrcToFile || "",

      geotaggedPhotoUrl,
    });

    return NextResponse.json({
      success: true,
      data: {
        _id: record._id,
        sentLocationId: record.sentLocationId,
        geotaggedPhotoUrl: record.geotaggedPhotoUrl,
        formSkipped: record.formSkipped,
        photoSkipped: record.photoSkipped,
      },
    });
  } catch (error: any) {
    console.error("POST /api/attendance/location-form Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * GET — Retrieve LocationFormData records.
 *
 * Query params:
 *   - sentLocationId: Direct 1:1 lookup
 *   - phone + date (YYYY-MM-DD): All form submissions for an employee on a given date
 */
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const sentLocationId = searchParams.get("sentLocationId");
    const phone = searchParams.get("phone");
    const date = searchParams.get("date");

    if (sentLocationId) {
      // Direct 1:1 lookup
      const record = await LocationFormData.findOne({ sentLocationId }).lean();

      if (!record) {
        return NextResponse.json(
          { success: false, error: "Form data not found" },
          { status: 404 },
        );
      }

      return NextResponse.json({ success: true, data: record });
    }

    if (phone) {
      // Find employee
      const employee = await Employee.findOne({ phone });
      if (!employee) {
        return NextResponse.json(
          { success: false, error: "Employee not found" },
          { status: 404 },
        );
      }

      // Build date filter
      const targetDateStr = date
        ? dayjs.tz(date, "Asia/Kolkata").format("YYYY-MM-DD")
        : dayjs().tz("Asia/Kolkata").format("YYYY-MM-DD");

      const targetDate = dayjs.tz(targetDateStr, "Asia/Kolkata");
      const start = targetDate.startOf("day").toDate();
      const end = targetDate.endOf("day").toDate();

      const records = await LocationFormData.find({
        employeeId: employee._id,
        date: { $gte: start, $lte: end },
      })
        .sort({ date: -1 })
        .lean();

      return NextResponse.json({
        success: true,
        count: records.length,
        data: records,
      });
    }

    return NextResponse.json(
      { success: false, error: "Provide sentLocationId or phone" },
      { status: 400 },
    );
  } catch (error: any) {
    console.error("GET /api/attendance/location-form Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}
