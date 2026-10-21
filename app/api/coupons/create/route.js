import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Coupon from "@/models/Coupon";
import { auth } from "@/auth";

export async function POST(request) {
    try {
        const session = await auth();

        if (!session || !["SUPER_ADMIN", "GENERAL_ADMIN"].includes(session.user.role)) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        let {
            code,
            discount,
            type = "fixed",
            description,
            active = true,
            minAmount = 0,
            maxUses = null,
            validFrom,
            validUntil,
            isSpecialCustomer = false
        } = body;

        if (discount === undefined || discount === null || Number(discount) <= 0) {
            return NextResponse.json(
                { message: "Valid discount value is required" },
                { status: 400 }
            );
        }

        // Auto-generate code and description for Special Customer Discount if not provided
        if (isSpecialCustomer) {
            if (!description) {
                description = `Special Customer Discount (${type === "percentage" ? discount + "%" : "৳" + discount})`;
            }
            if (!code) {
                const prefix = `SPECIAL-${type === "percentage" ? discount + "PCT" : discount + "TK"}`;
                const randomSuffix = Math.floor(1000 + Math.random() * 9000);
                code = `${prefix}-${randomSuffix}`;
            }
        } else {
            if (!code || !description) {
                return NextResponse.json(
                    { message: "Code, discount, and description are required" },
                    { status: 400 }
                );
            }
        }

        await connectDB();

        // Check if code already exists
        const existingCoupon = await Coupon.findOne({ code: code.toUpperCase() });
        if (existingCoupon) {
            return NextResponse.json(
                { message: "Coupon code already exists" },
                { status: 400 }
            );
        }

        // Create new coupon
        const newCoupon = await Coupon.create({
            code: code.toUpperCase(),
            discount: Number(discount),
            type,
            description,
            active,
            minAmount: Number(minAmount),
            maxUses: maxUses ? Number(maxUses) : null,
            usedCount: 0,
            validFrom: validFrom || null,
            validUntil: validUntil || null,
            isSpecialCustomer: !!isSpecialCustomer
        });
        return NextResponse.json(
            { message: "Coupon created successfully", coupon: newCoupon },
            { status: 201 }
        );
    } catch (error) {
        console.error("Error creating coupon:", error);
        return NextResponse.json(
            { message: "Failed to create coupon" },
            { status: 500 }
        );
    }
}
