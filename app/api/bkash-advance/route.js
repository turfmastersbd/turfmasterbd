import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import Booking from "@/models/Booking";
import Transaction from "@/models/Transaction";

export async function GET(request) {
    try {
        const session = await auth();

        if (!session) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        await connectDB();

        const { searchParams } = new URL(request.url);
        const date = searchParams.get("date");
        const userId = session.user.id;

        let query = {
            paymentMethod: "BKASH",
            paymentType: "advance"
        };

        // If not super admin, filter by bookings where this user might be involved
        // Actually the user said "My Account" should show these bookings.
        // Assuming it's for the logged in admin's responsibility or all advance bookings for super admin.
        // The user's request: "Bkash advance amount diye jei booking gulo hobe, oigula automatically “My Account” tab er ekta alada section/option e show korbe."
        // This might mean bookings that the current admin is responsible for? 
        // Or all bkash advance bookings if they are looking at their account?
        // Let's assume all for now, but filter by date if provided.

        if (date) {
            const startOfDay = new Date(date);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(date);
            endOfDay.setHours(23, 59, 59, 999);
            query.bookingDate = { $gte: startOfDay, $lte: endOfDay };
        }

        const bookings = await Booking.find(query)
            .populate("user", "name phone")
            .sort({ bookingDate: -1 });

        const bookingsWithRealAdvance = await Promise.all(bookings.map(async (booking) => {
            const bookingObj = booking.toObject();
            if (!bookingObj.advanceAmount || bookingObj.advanceAmount === 0) {
                // 1. Try to find the transaction by searching for transactionId in notes
                let advanceTx = null;
                if (bookingObj.transactionId) {
                    advanceTx = await Transaction.findOne({ 
                        booking: booking._id, 
                        notes: { $regex: bookingObj.transactionId, $options: "i" } 
                    });
                }

                // 2. If not found by ID, try finding the earliest non-due transaction
                if (!advanceTx) {
                    const txs = await Transaction.find({ booking: booking._id }).sort({ createdAt: 1 });
                    advanceTx = txs.find(t => t.transactionType === "advance" || t.transactionType === "full");
                }
                
                if (advanceTx) {
                    bookingObj.advanceAmount = Math.min(advanceTx.amount, 500);
                } else if (bookingObj.status !== "completed") {
                    // Fallback for non-completed bookings
                    bookingObj.advanceAmount = Math.min(bookingObj.paidAmount || 0, 500);
                } else {
                    // 3. Last resort: calculation from totalAmount - totalDue
                    const txs = await Transaction.find({ booking: booking._id });
                    const dueTxs = txs.filter(t => t.transactionType === "due");
                    const totalDue = dueTxs.reduce((sum, t) => sum + t.amount, 0);
                    if (totalDue > 0) {
                        bookingObj.advanceAmount = Math.min(bookingObj.totalAmount - totalDue, 500);
                    }
                }
            } else {
                // Even if advanceAmount exists, cap it at 500 for this specific view
                bookingObj.advanceAmount = Math.min(bookingObj.advanceAmount, 500);
            }
            return bookingObj;
        }));

        return NextResponse.json(bookingsWithRealAdvance);
    } catch (error) {
        console.error("BKASH ADVANCE GET ERROR:", error);
        return NextResponse.json({ message: "Server error" }, { status: 500 });
    }
}
