import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Employee from "@/models/employee";
import Attendance from "@/models/attendance";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

// Define the shape of your document
interface IAttendance {
  _id: string;
  employee: string;
  date: Date;
  checkInTime?: number;
  checkOutTime?: number;
  // ... add other fields if you need them
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { phone } = await req.json();

    if (!phone) return NextResponse.json({ success: false, error: "Phone required" }, { status: 400 });

    const employee = await Employee.findOne({ phone });
    if (!employee) return NextResponse.json({ success: false, error: "Employee not found" }, { status: 404 });

    const now = dayjs().tz("Asia/Kolkata");
    const todayStart = now.startOf("day").toDate();

    // ✅ Pass the interface to lean<IAttendance>()
    // This tells TypeScript exactly what fields to expect
    const attendance = await Attendance.findOne({
      employee: employee._id,
      date: { $gte: todayStart },
      checkOutTime: { $exists: true, $ne: null },
    }).lean<IAttendance | null>(); 

    return NextResponse.json({
      success: true,
      // Now TypeScript knows checkOutTime exists here
      checkedOut: Boolean(attendance && attendance.checkOutTime),
      checkOutTime: attendance?.checkOutTime ?? null,
    });
  } catch (err) {
    // ... error handling
  }
}