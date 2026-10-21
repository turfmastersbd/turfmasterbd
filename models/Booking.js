import mongoose from "mongoose";
// Model updated to support cancellation and balance tracking

const bookingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },

    // userName: {
    //   type: String,
    //   required: true,
    //   trim: true,
    // },

    // userPhone: {
    //   type: String,
    //   required: true,
    //   trim: true,
    // },

    arenaName: {
      type: String,
      required: true,
      trim: true,
    },
    
    bookingDate: {
      type: Date,
      required: true,
    },

    timeSlot: {
      type: String,
      required: true,
      trim: true,
    },

    duration: {
      type: Number,
      default: 90,
    },

    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled", "completed"],
      default: "pending",
    },

    paymentType: {
      type: String,
      enum: ["full", "advance", "cod"],
      required: true,
    },

    paidAmount: {
      type: Number,
      default: 0,
    },

    cashAmount: {
      type: Number,
      default: 0,
    },

    totalAmount: {
      type: Number,
      required: true,
    },

    remainingAmount: {
      type: Number,
      default: 0,
    },

    advanceAmount: {
      type: Number,
      default: 0,
    },

    paymentStatus: {
      type: String,
      enum: ["unpaid", "partial", "paid"],
      default: "unpaid",
    },

    advanceStatus: {
      type: String,
      enum: ["pending", "confirmed"],
      default: "pending",
    },

    paymentMethod: {
      type: String,
      enum: ["BKASH", "COD"],
      default: "BKASH",
    },

    transactionId: {
      type: String,
      default: null,
    },

    advanceReceiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    advanceReceiverName: {
      type: String,
      trim: true,
      default: null,
    },

    dueReceiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    dueReceiverName: {
      type: String,
      trim: true,
      default: null,
    },

    bookingForName: {
      type: String,
      required: true,
      trim: true,
    },

    bookingForPhone: {
      type: String,
      required: true,
      trim: true,
    },

    bookingByRole: {
      type: String,
      enum: ["SUPER_ADMIN", "GENERAL_ADMIN", "MANAGER", "REGULAR_CUSTOMER", "SPECIAL_CUSTOMER", "GUEST"],
      required: true,
    },

    notes: {
      type: String,
      trim: true,
    },

    // Coupon fields
    originalAmount: {
      type: Number,
      default: null,
    },

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

    bkashPaymentID: {
      type: String,
      default: null,
    },

    customerStatus: {
      type: String,
      enum: ["selected status", "Call Received", "Call Not Received", "Phone Off"],
      default: "selected status",
    },
    cancelNote: {
      type: String,
      trim: true,
      default: null,
    },
  },
  { timestamps: true }
);

bookingSchema.index({ user: 1, bookingDate: -1 });

bookingSchema.index(
  { arenaName: 1, bookingDate: 1, timeSlot: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $in: ["pending", "confirmed"] } },
  }
);

// In development, clear the model from cache to ensure schema updates are applied
if (process.env.NODE_ENV === "development") {
  delete mongoose.models.Booking;
}

export default mongoose.models.Booking ||
  mongoose.model("Booking", bookingSchema);
