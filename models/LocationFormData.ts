import mongoose, { Schema, models, Document, Model } from "mongoose";

export interface ILocationFormData extends Document {
  sentLocationId: mongoose.Types.ObjectId;
  employeeId: mongoose.Types.ObjectId;
  phone: string;
  date: Date;
  coords: { lat: number; lng: number };
  gpsAccuracy: number | null;
  actionType: "send_location" | "halt_location";

  // Status flags
  formSkipped: boolean;
  photoSkipped: boolean;

  // 19 Form fields (all optional — empty when formSkipped is true)
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

  // Geotagged photo URL (from Vercel Blob)
  geotaggedPhotoUrl: string;
}

const LocationFormDataSchema = new Schema<ILocationFormData>(
  {
    // ──── Strong Relationships ────
    sentLocationId: {
      type: Schema.Types.ObjectId,
      ref: "SentLocation",
      required: true,
      unique: true,
      index: true,
    },
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
      index: true,
    },
    phone: { type: String, required: true },
    date: { type: Date, required: true },
    coords: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
    gpsAccuracy: { type: Number, default: null },
    actionType: {
      type: String,
      enum: ["send_location", "halt_location"],
      default: "send_location",
    },

    // ──── Status Flags ────
    formSkipped: { type: Boolean, default: false },
    photoSkipped: { type: Boolean, default: false },

    // ──── 19 Form Fields (all optional) ────
    visitDate: { type: String, default: "" },
    accountNo: { type: String, default: "" },
    customerName: { type: String, default: "" },
    addressVisited: { type: String, default: "" },
    cmAvailableAtAdd: { type: String, default: "" },
    personMetAtAddress: { type: String, default: "" },
    visitedAddressStatus: { type: String, default: "" },
    keyword: { type: String, default: "" },
    occupation: { type: String, default: "" },
    fieldVisitContactable: { type: String, default: "" },
    feedbackInDetail: { type: String, default: "" },
    ptpNextVisitDate: { type: String, default: "" },
    ptpAmount: { type: String, default: "" },
    projection: { type: String, default: "" },
    caseToRetain: { type: String, default: "" },
    caseWorkable: { type: String, default: "" },
    settlementCase: { type: String, default: "" },
    retentionPriority: { type: String, default: "" },
    rrcToFile: { type: String, default: "" },

    // ──── Geotagged Photo (Vercel Blob URL) ────
    geotaggedPhotoUrl: { type: String, default: "" },
  },
  { timestamps: true },
);

// Compound indexes for fast admin panel querying
LocationFormDataSchema.index({ phone: 1, date: -1 });
LocationFormDataSchema.index({ employeeId: 1, date: -1 });
LocationFormDataSchema.index({ "coords.lat": 1, "coords.lng": 1 });

const LocationFormData: Model<ILocationFormData> =
  models.LocationFormData ||
  mongoose.model<ILocationFormData>("LocationFormData", LocationFormDataSchema);

export default LocationFormData;
