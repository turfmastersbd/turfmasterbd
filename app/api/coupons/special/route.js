import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Coupon from "@/models/Coupon";
import { auth } from "@/auth";

const SPECIAL_CODE = "SPECIAL_CUSTOMER_GLOBAL";

// GET - Get active Special Customer Discount
export async function GET(request) {
    try {
        await connectDB();

        const coupon = await Coupon.findOne({ isSpecialCustomer: true });

        if (!coupon) {
            return NextResponse.json({ valid: false, discount: null }, { status: 200 });
        }

        return NextResponse.json({
            valid: coupon.active,
            discount: {
                _id: coupon._id,
                code: coupon.code,
                discount: coupon.discount,
                type: coupon.type,
                description: coupon.description,
                active: coupon.active,
                isSpecialCustomer: true,
            },
        }, { status: 200 });
    } catch (error) {
        console.error("GET SPECIAL DISCOUNT ERROR:", error);
        return NextResponse.json({ message: "Server error" }, { status: 500 });
    }
}

// POST - Create or Update the single Special Customer Discount (Admin only)
export async function POST(request) {
    try {
        const session = await auth();

        if (!session || !["SUPER_ADMIN", "GENERAL_ADMIN"].includes(session.user.role)) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { type = "fixed", discount, active = true } = body;

        if (discount === undefined || discount === null || Number(discount) <= 0) {
            return NextResponse.json(
                { message: "Valid discount value is required" },
                { status: 400 }
            );
        }

        await connectDB();

        const description = `Special Customer Discount (${type === "percentage" ? discount + "%" : "৳" + discount})`;

        // Find existing special customer discount or create new
        let coupon = await Coupon.findOne({ isSpecialCustomer: true });

        if (coupon) {
            coupon.type = type;
            coupon.discount = Number(discount);
            coupon.description = description;
            coupon.active = active;
            await coupon.save();
        } else {
            coupon = await Coupon.create({
                code: SPECIAL_CODE,
                discount: Number(discount),
                type,
                description,
                active: true,
                isSpecialCustomer: true,
                minAmount: 0,
                maxUses: null,
                usedCount: 0,
            });
        }

        return NextResponse.json(
            { message: "Special Customer Discount saved successfully", discount: coupon },
            { status: 200 }
        );
    } catch (error) {
        console.error("SAVE SPECIAL DISCOUNT ERROR:", error);
        return NextResponse.json(
            { message: "Failed to save Special Customer Discount" },
            { status: 500 }
        );
    }
}

// DELETE - Remove Special Customer Discount (Admin only)
export async function DELETE(request) {
    try {
        const session = await auth();

        if (!session || !["SUPER_ADMIN", "GENERAL_ADMIN"].includes(session.user.role)) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        await connectDB();

        await Coupon.deleteMany({ isSpecialCustomer: true });

        return NextResponse.json({ message: "Special Customer Discount deleted successfully" });
    } catch (error) {
        console.error("DELETE SPECIAL DISCOUNT ERROR:", error);
        return NextResponse.json({ message: "Server error" }, { status: 500 });
    }
}
