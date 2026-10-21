import mongoose from "mongoose";

// Temporary storage for bKash payment intents.
// Auto-expires after 30 minutes via MongoDB TTL index.
// Real Booking is only created AFTER successful payment in the callback.
const bkashPendingPaymentSchema = new mongoose.Schema(
  {
    bkashPaymentID: {
      type: String,
      default: null,
    },
    amount: {
      type: Number,
      required: true,
    },
    // Full booking data — stored here temporarily until payment confirmed
    bookingData: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 1800, // Auto-delete after 30 minutes (TTL index)
    },
  }
);

if (process.env.NODE_ENV === "development") {
  delete mongoose.models.BkashPendingPayment;
}

export default mongoose.models.BkashPendingPayment ||
  mongoose.model("BkashPendingPayment", bkashPendingPaymentSchema);
