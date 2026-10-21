import mongoose from "mongoose";

const couponSchema = new mongoose.Schema(
    {
        code: {
            type: String,
            required: true,
            unique: true,
            uppercase: true,
            trim: true,
        },
        discount: {
            type: Number,
            required: true,
            min: 0,
        },
        type: {
            type: String,
            enum: ["fixed", "percentage"],
            required: true,
            default: "fixed",
        },
        description: {
            type: String,
            required: true,
            trim: true,
        },
        active: {
            type: Boolean,
            default: true,
        },
        minAmount: {
            type: Number,
            default: 0,
            min: 0,
        },
        maxUses: {
            type: Number,
            default: null,
        },
        usedCount: {
            type: Number,
            default: 0,
            min: 0,
        },
        validFrom: {
            type: Date,
            default: null,
        },
        validUntil: {
            type: Date,
            default: null,
        },
        isSpecialCustomer: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

// Index for fast lookups
couponSchema.index({ active: 1 });
couponSchema.index({ isSpecialCustomer: 1 });

export default mongoose.models.Coupon || mongoose.model("Coupon", couponSchema);
