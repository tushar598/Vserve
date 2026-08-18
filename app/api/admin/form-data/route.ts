import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import LocationFormData from "@/models/LocationFormData";
import Employee from "@/models/employee";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

/**
 * GET — Admin endpoint: Retrieve LocationFormData records for a specific employee.
 *
 * Query params:
 *   - phone (required): Employee phone number
 *   - date (optional, YYYY-MM-DD): Filter by specific date. Defaults to today.
 */
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const phone = searchParams.get("phone");
    const date = searchParams.get("date");

    if (!phone) {
      return NextResponse.json(
        { success: false, error: "Phone number is required" },
        { status: 400 },
      );
    }

    // Find employee
    const employee = await Employee.findOne({ phone }).lean() as any;
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
      employee: {
        name: employee.name,
        fatherName: employee.fatherName,
        phone: employee.phone,
        role: employee.role,
        department: employee.department,
        dateOfJoining: employee.dateOfJoining,
        location: employee.location,
      },
      date: targetDateStr,
      count: records.length,
      data: records,
    });
  } catch (error: any) {
    console.error("GET /api/admin/form-data Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}
