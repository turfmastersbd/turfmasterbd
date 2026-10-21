import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import Coupon from "@/models/Coupon";

// GET - Validate coupon
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const code = searchParams.get("code");
        const amount = parseFloat(searchParams.get("amount"));

        if (!code) {
            return NextResponse.json({ message: "Coupon code required" }, { status: 400 });
        }

        await connectDB();

        const coupon = await Coupon.findOne({
            code: code.toUpperCase(),
            active: true
        });

        if (!coupon) {
            return NextResponse.json({ message: "Invalid coupon code" }, { status: 404 });
        }

        // Check validity dates
        const now = new Date();
        if (coupon.validFrom && new Date(coupon.validFrom) > now) {
            return NextResponse.json({ message: "Coupon is not yet valid" }, { status: 400 });
        }
        if (coupon.validUntil && new Date(coupon.validUntil) < now) {
            return NextResponse.json({ message: "Coupon has expired" }, { status: 400 });
        }

        // Check max uses
        if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
            return NextResponse.json({ message: "Coupon usage limit reached" }, { status: 400 });
        }

        // Check minimum amount
        if (amount && coupon.minAmount && amount < coupon.minAmount) {
            return NextResponse.json(
                { message: `Minimum amount ৳${coupon.minAmount} required` },
                { status: 400 }
            );
        }

        // Calculate discount
        let discountAmount = 0;
        if (coupon.type === "fixed") {
            discountAmount = coupon.discount;
        } else if (coupon.type === "percentage") {
            discountAmount = Math.round((amount * coupon.discount) / 100);
        }

        return NextResponse.json({
            valid: true,
            coupon: {
                code: coupon.code,
                discount: coupon.discount,
                type: coupon.type,
                description: coupon.description,
                discountAmount,
            },
        });
    } catch (error) {
        console.error("COUPON VALIDATION ERROR:", error);
        return NextResponse.json({ message: "Server error" }, { status: 500 });
    }
}

// POST - Apply coupon (increment usage)
export async function POST(request) {
    try {
        const { code } = await request.json();

        if (!code) {
            return NextResponse.json({ message: "Coupon code required" }, { status: 400 });
        }

        await connectDB();

        const coupon = await Coupon.findOne({ code: code.toUpperCase() });

        if (!coupon) {
            return NextResponse.json({ message: "Coupon not found" }, { status: 404 });
        }

        // Increment usage
        coupon.usedCount += 1;
        await coupon.save();

        return NextResponse.json({ message: "Coupon applied successfully" });
    } catch (error) {
        console.error("COUPON APPLY ERROR:", error);
        return NextResponse.json({ message: "Server error" }, { status: 500 });
    }
}

// PUT - Update coupon (Admin only)
export async function PUT(request) {
    try {
        const session = await auth();

        if (!session || !["SUPER_ADMIN", "GENERAL_ADMIN"].includes(session.user.role)) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const code = searchParams.get("code");
        const updates = await request.json();

        if (!code) {
            return NextResponse.json({ message: "Coupon code required" }, { status: 400 });
        }

        await connectDB();

        const coupon = await Coupon.findOne({ code: code.toUpperCase() });

        if (!coupon) {
            return NextResponse.json({ message: "Coupon not found" }, { status: 404 });
        }

        // Update fields (don't allow code update)
        if (updates.discount !== undefined) coupon.discount = updates.discount;
        if (updates.type !== undefined) coupon.type = updates.type;
        if (updates.description !== undefined) coupon.description = updates.description;
        if (updates.active !== undefined) coupon.active = updates.active;
        if (updates.minAmount !== undefined) coupon.minAmount = updates.minAmount;
        if (updates.maxUses !== undefined) coupon.maxUses = updates.maxUses;
        if (updates.validFrom !== undefined) coupon.validFrom = updates.validFrom;
        if (updates.validUntil !== undefined) coupon.validUntil = updates.validUntil;
        if (updates.isSpecialCustomer !== undefined) coupon.isSpecialCustomer = updates.isSpecialCustomer;

        await coupon.save();

        return NextResponse.json({ message: "Coupon updated successfully", coupon });
    } catch (error) {
        console.error("COUPON UPDATE ERROR:", error);
        return NextResponse.json({ message: "Server error" }, { status: 500 });
    }
}

// DELETE - Delete coupon (Admin only)
export async function DELETE(request) {
    try {
        const session = await auth();

        if (!session || !["SUPER_ADMIN", "GENERAL_ADMIN"].includes(session.user.role)) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const code = searchParams.get("code");

        if (!code) {
            return NextResponse.json({ message: "Coupon code required" }, { status: 400 });
        }

        await connectDB();

        const result = await Coupon.findOneAndDelete({ code: code.toUpperCase() });

        if (!result) {
            return NextResponse.json({ message: "Coupon not found" }, { status: 404 });
        }

        return NextResponse.json({ message: "Coupon deleted successfully" });
    } catch (error) {
        console.error("COUPON DELETE ERROR:", error);
        return NextResponse.json({ message: "Server error" }, { status: 500 });
    }
}
