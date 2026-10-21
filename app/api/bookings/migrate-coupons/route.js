import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import Booking from "@/models/Booking";

// Migration endpoint to add coupon fields to existing bookings
export async function POST(request) {
    try {
        const session = await auth();

        if (!session || session.user.role !== "SUPER_ADMIN") {
            return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
        }

        await connectDB();

        // Find all bookings that don't have coupon fields
        const bookingsToUpdate = await Booking.find({
            $or: [
                { originalAmount: { $exists: false } },
                { couponCode: { $exists: false } },
                { discountAmount: { $exists: false } }
            ]
        });

        console.log(`Found ${bookingsToUpdate.length} bookings to update`);

        let updated = 0;
        for (const booking of bookingsToUpdate) {
            // Set default values for coupon fields
            if (booking.originalAmount === undefined) {
                booking.originalAmount = booking.totalAmount;
            }
            if (booking.couponCode === undefined) {
                booking.couponCode = null;
            }
            if (booking.discountAmount === undefined) {
                booking.discountAmount = 0;
            }

            await booking.save();
            updated++;
        }

        return NextResponse.json({
            message: "Migration completed successfully",
            bookingsFound: bookingsToUpdate.length,
            bookingsUpdated: updated
        }, { status: 200 });
    } catch (error) {
        console.error("Migration error:", error);
        return NextResponse.json(
            { message: "Migration failed", error: error.message },
            { status: 500 }
        );
    }
}
