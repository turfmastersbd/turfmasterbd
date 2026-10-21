import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Coupon from "@/models/Coupon";
import { auth } from "@/auth";

export async function GET(request) {
    try {
        const session = await auth();

        if (!session || !["SUPER_ADMIN", "GENERAL_ADMIN"].includes(session.user.role)) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        await connectDB();

        const coupons = await Coupon.find({}).sort({ createdAt: -1 });
        return NextResponse.json({ coupons }, { status: 200 });
    } catch (error) {
        console.error("Error fetching coupons:", error);
        return NextResponse.json(
            { message: "Failed to fetch coupons" },
            { status: 500 }
        );
    }
}
