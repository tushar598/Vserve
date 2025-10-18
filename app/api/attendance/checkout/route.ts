import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Attendance } from "@/models/attendance";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone, coords } = body;

    if (!phone || !coords) {
      return NextResponse.json({ success: false, error: "Missing phone or coordinates" }, { status: 400 });
    }

    await connectDB();

    const today = new Date().toISOString().slice(0, 10);
    const record = await Attendance.findOne({ phone, date: today });

    if (!record?.checkInTime) {
      return NextResponse.json({ success: false, error: "Not checked in yet" }, { status: 400 });
    }

    if (record.checkOutTime) {
      return NextResponse.json({ success: false, error: "Already checked out" }, { status: 400 });
    }

    record.checkOutTime = Date.now();
    record.checkOutLocation = coords;

    await record.save();

    return NextResponse.json({ success: true, record }, { status: 200 });
  } catch (err: any) {
    console.error("Check-out error:", err);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
