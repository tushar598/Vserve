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
    let record = await Attendance.findOne({ phone, date: today });

    if (record?.checkInTime) {
      return NextResponse.json({ success: false, error: "Already checked in" }, { status: 400 });
    }

    const status = new Date().getHours() < 10 ? "on-time" : "late"; // example logic

    if (!record) record = new Attendance({ phone, date: today });

    record.checkInTime = Date.now();
    record.checkInLocation = coords;
    record.status = status;
    record.track = [];

    await record.save();

    return NextResponse.json({ success: true, record }, { status: 200 });
  } catch (err: any) {
    console.error("Check-in error:", err);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
