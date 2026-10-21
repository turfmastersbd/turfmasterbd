import mongoose from "mongoose";

const bkashTokenSchema = new mongoose.Schema(
  {
    id_token: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.models.BkashToken || mongoose.model("BkashToken", bkashTokenSchema);
