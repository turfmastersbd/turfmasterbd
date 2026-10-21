import mongoose from "mongoose";
// Model updated to support cancellation transactions

const transactionSchema = new mongoose.Schema(
    {
        booking: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Booking",
            required: true,
        },

        receiver: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        receiverName: {
            type: String,
            required: true,
            trim: true,
        },

        amount: {
            type: Number,
            required: true,
        },

        transactionType: {
            type: String,
            enum: ["advance", "due", "full", "cancellation"],
            required: true,
        },

        paymentStatus: {
            type: String,
            enum: ["pending", "confirmed", "completed", "cancelled"],
            required: true,
        },

        bookingStatus: {
            type: String,
            enum: ["pending", "confirmed", "completed", "cancelled"],
            required: true,
        },

        arenaName: {
            type: String,
            required: true,
        },

        bookingDate: {
            type: Date,
            required: true,
        },

        timeSlot: {
            type: String,
            required: true,
        },

        customerName: {
            type: String,
            required: true,
        },

        customerPhone: {
            type: String,
            required: true,
        },

        notes: {
            type: String,
            trim: true,
        },

        // Coupon fields
        couponCode: {
            type: String,
            trim: true,
            uppercase: true,
            default: null,
        },

        discountAmount: {
            type: Number,
            default: 0,
        },

        originalAmount: {
            type: Number,
            default: null,
        },
    },
    { timestamps: true }
);

// Index for efficient queries
transactionSchema.index({ receiver: 1, createdAt: -1 });
transactionSchema.index({ booking: 1 });
transactionSchema.index({ bookingDate: -1 });

// In development, clear the model from cache to ensure schema updates are applied
if (process.env.NODE_ENV === "development") {
    delete mongoose.models.Transaction;
}

export default mongoose.models.Transaction || mongoose.model("Transaction", transactionSchema);
