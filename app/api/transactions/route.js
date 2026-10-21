import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import Transaction from "@/models/Transaction";
import Booking from "@/models/Booking";
import User from "@/models/User";
import { PERMISSIONS } from "@/lib/permissions";
import { hasPermission } from "@/lib/hasPermissions";

// GET all transactions or filtered by receiver
export async function GET(request) {
    try {
        const session = await auth();

        if (!session) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        await connectDB();

        const { searchParams } = new URL(request.url);
        const receiverId = searchParams.get("receiverId");
        const startDate = searchParams.get("startDate");
        const endDate = searchParams.get("endDate");

        const { id: userId, role } = session.user;

        let query = {};

        // Super admin can see all transactions
        if (hasPermission(role, PERMISSIONS.VIEW_ALL_BOOKINGS)) {
            // If receiverId is provided, filter by that receiver
            if (receiverId) {
                query.receiver = receiverId;
            }
            // Otherwise show all transactions
        } else {
            // Other users can only see their own transactions
            query.receiver = userId;
        }

        // Add date range filter if provided
        if (startDate || endDate) {
            query.bookingDate = {};
            if (startDate) query.bookingDate.$gte = new Date(startDate);
            if (endDate) query.bookingDate.$lte = new Date(endDate);
        }

        const transactions = await Transaction.find(query)
            .populate("receiver", "name email phone")
            .populate("booking")
            .sort({ createdAt: -1 });

        // Fetch bkash advance bookings to synthesize missing transactions
        let bkashQuery = {
            paymentMethod: "BKASH",
            paymentType: "advance",
            status: { $in: ["confirmed", "completed", "cancelled"] }
        };

        if (startDate || endDate) {
            bkashQuery.bookingDate = {};
            if (startDate) bkashQuery.bookingDate.$gte = new Date(startDate);
            if (endDate) bkashQuery.bookingDate.$lte = new Date(endDate);
        }

        const bkashBookings = await Booking.find(bkashQuery)
            .populate("user", "name email phone")
            .populate("advanceReceiver", "name email phone");

        const existingTxBookingIds = new Set(
            (await Transaction.find({
                booking: { $in: bkashBookings.map(b => b._id) },
                transactionType: { $in: ["advance", "full"] }
            })).map(t => t.booking.toString())
        );

        const defaultSuperAdmin = await User.findOne({ role: "SUPER_ADMIN" }).select("name email phone");
        const bkashSystemUser = {
            _id: "6645db7d6927a63aab41c000",
            name: "Bkash System"
        };
        const synthesizedTransactions = [];

        for (const booking of bkashBookings) {
            if (existingTxBookingIds.has(booking._id.toString())) {
                continue;
            }

            const receiver = booking.advanceReceiver || bkashSystemUser;
            if (!receiver) continue;

            // Apply receiver filter
            const receiverIdStr = receiver._id.toString();
            if (hasPermission(role, PERMISSIONS.VIEW_ALL_BOOKINGS)) {
                if (receiverId && receiverId !== receiverIdStr) {
                    continue;
                }
            } else {
                if (userId !== receiverIdStr) {
                    continue;
                }
            }

            // Determine synthesized amount (default to booking's paid amount or 500)
            const amount = booking.advanceAmount || (booking.status === "completed" ? 500 : (booking.paidAmount || 500));

            // Synthesize the transaction
            synthesizedTransactions.push({
                _id: `synth_${booking._id}`,
                booking: booking,
                receiver: receiver,
                receiverName: receiver.name,
                amount: amount,
                transactionType: "advance",
                paymentStatus: "confirmed",
                bookingStatus: booking.status,
                arenaName: booking.arenaName,
                bookingDate: booking.bookingDate,
                timeSlot: booking.timeSlot,
                customerName: booking.bookingForName,
                customerPhone: booking.bookingForPhone,
                notes: booking.notes || "bKash Online Payment",
                createdAt: booking.createdAt,
                updatedAt: booking.updatedAt,
                couponCode: booking.couponCode || null,
                discountAmount: booking.discountAmount || 0,
                originalAmount: booking.originalAmount || null,
                isSynthesized: true
            });
        }

        // Combine and sort
        const allTransactions = [...transactions, ...synthesizedTransactions];
        allTransactions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        // Calculate totals
        const totals = {
            totalAmount: allTransactions.reduce((sum, t) => {
                if (t.transactionType === "cancellation") return sum - t.amount;
                return sum + t.amount;
            }, 0),
            advanceAmount: allTransactions
                .filter((t) => t.transactionType === "advance")
                .reduce((sum, t) => sum + t.amount, 0),
            dueAmount: allTransactions
                .filter((t) => t.transactionType === "due")
                .reduce((sum, t) => sum + t.amount, 0),
            fullAmount: allTransactions
                .filter((t) => t.transactionType === "full")
                .reduce((sum, t) => sum + t.amount, 0),
            cancellationAmount: allTransactions
                .filter((t) => t.transactionType === "cancellation")
                .reduce((sum, t) => sum + t.amount, 0),
            count: allTransactions.length,
        };

        return NextResponse.json({ transactions: allTransactions, totals }, { status: 200 });
    } catch (error) {
        console.error("GET TRANSACTIONS ERROR:", error);
        return NextResponse.json({ message: "Server error" }, { status: 500 });
    }
}
