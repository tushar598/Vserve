import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Attendance from "@/models/attendance";
import Employee from "@/models/employee";

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    // ✅ Fetch all attendance records and populate employee details
    const records = await Attendance.find()
      .populate("employee", "name phone email role department")
      .sort({ date: -1 });

    if (!records || records.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No attendance records found",
        data: [],
      });
    }

    return NextResponse.json({
      success: true,
      count: records.length,
      data: records.map((r) => ({
        phone: r.phone,          // ✅ include phone here
    date: r.date,
    status: r.status,
    checkInTime: r.checkInTime,
    checkOutTime: r.checkOutTime,
    lateApproved: r.lateApproved,
      })),
    });
  } catch (err: any) {
    console.error("❌ Error fetching all attendance:", err);
    return NextResponse.json(
      { success: false, error: "Server error while fetching attendance" },
      { status: 500 }
    );
  }
}
