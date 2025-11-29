import mongoose, { Schema, Document, Model } from "mongoose";

export interface ILocationTrack extends Document {
  employeeId: string;
  lat: number;
  lng: number;
  timestamp: Date;
  distanceKm: number;
}

const LocationTrackSchema = new Schema<ILocationTrack>({
  employeeId: { type: String, required: true, index: true },
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now },
  distanceKm: { type: Number, default: 0 },
});

const LocationTrack: Model<ILocationTrack> =
  mongoose.models.LocationTrack ||
  mongoose.model<ILocationTrack>("LocationTrack", LocationTrackSchema);

export default LocationTrack;
