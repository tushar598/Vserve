// models/DistanceTrack.ts
import mongoose, { Document, Model, Schema } from "mongoose";

export interface IDistanceTrack extends Document {
  employeeId: string;
  date: string; // YYYY-MM-DD
  totalKm: number;
  lastLat?: number;
  lastLng?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

const DistanceSchema = new Schema<IDistanceTrack>(
  {
    employeeId: { type: String, required: true, index: true },
    date: { type: String, required: true, index: true }, // YYYY-MM-DD
    totalKm: { type: Number, default: 0 },
    lastLat: { type: Number, default: null },
    lastLng: { type: Number, default: null },
  },
  { timestamps: true }
);

const DistanceTrack: Model<IDistanceTrack> =
  (mongoose.models.DistanceTrack as Model<IDistanceTrack>) ||
  mongoose.model<IDistanceTrack>("DistanceTrack", DistanceSchema);

export default DistanceTrack;
