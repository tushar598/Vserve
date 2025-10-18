import mongoose, { Schema, Document, Model } from "mongoose";

export interface ITrackPoint {
  lat: number;
  lng: number;
  ts: number;
}

export interface IAttendance extends Document {
  phone: string;
  date: string; // YYYY-MM-DD
  checkInTime?: number;
  checkInLocation?: { lat: number; lng: number };
  checkOutTime?: number;
  checkOutLocation?: { lat: number; lng: number };
  status?: "on-time" | "late";
  track?: ITrackPoint[];
}

const AttendanceSchema: Schema = new Schema({
  phone: { type: String, required: true },
  date: { type: String, required: true },
  checkInTime: Number,
  checkInLocation: { lat: Number, lng: Number },
  checkOutTime: Number,
  checkOutLocation: { lat: Number, lng: Number },
  status: { type: String, enum: ["on-time", "late"] },
  track: [{ lat: Number, lng: Number, ts: Number }],
});

// Avoid recompiling model
export const Attendance: Model<IAttendance> =
  mongoose.models.Attendance || mongoose.model("Attendance", AttendanceSchema);
