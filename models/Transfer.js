import mongoose from "mongoose";

const transferSchema = new mongoose.Schema(
    {
        from: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        to: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        amount: {
            type: Number,
            required: true,
            min: 0,
        },
        fromName: {
            type: String,
            required: true,
            trim: true,
        },
        toName: {
            type: String,
            required: true,
            trim: true,
        },
        status: {
            type: String,
            enum: ["pending", "approved", "rejected"],
            default: "pending",
        },
        notes: {
            type: String,
            trim: true,
        },
        approvedAt: {
            type: Date,
            default: null,
        },
        rejectedAt: {
            type: Date,
            default: null,
        },
    },
    { timestamps: true }
);

// Index for efficient queries
transferSchema.index({ from: 1, createdAt: -1 });
transferSchema.index({ to: 1, status: 1, createdAt: -1 });

export default mongoose.models.Transfer || mongoose.model("Transfer", transferSchema);
