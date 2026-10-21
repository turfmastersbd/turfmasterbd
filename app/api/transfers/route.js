import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import Transaction from "@/models/Transaction";
import Transfer from "@/models/Transfer";
import User from "@/models/User";
import Booking from "@/models/Booking";
// GET user balance
export async function GET(request) {
    try {
        const session = await auth();

        if (!session) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        await connectDB();
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get("userId") || session.user.id;

        // Calculate balance from transactions
        const transactions = await Transaction.find({ receiver: userId });

        const totalBalance = transactions.reduce((sum, t) => {
            if (t.transactionType === "cancellation") return sum - t.amount;
            return sum + t.amount;
        }, 0);

        // Get transfer history (approved only for balance calculation)
        const sentTransfers = await Transfer.find({ from: userId, status: "approved" });
        const receivedTransfers = await Transfer.find({ to: userId, status: "approved" });

        const totalSent = sentTransfers.reduce((sum, t) => sum + t.amount, 0);
        const totalReceived = receivedTransfers.reduce((sum, t) => sum + t.amount, 0);

        const pendingReceived = await Transfer.find({ to: userId, status: "pending" })
            .populate("from", "name phone")
            .sort({ createdAt: -1 });

        const pendingSent = await Transfer.find({ from: userId, status: "pending" })
            .populate("to", "name phone")
            .sort({ createdAt: -1 });

        const totalPendingReceived = pendingReceived.reduce((sum, t) => sum + t.amount, 0);
        const totalPendingSent = pendingSent.reduce((sum, t) => sum + t.amount, 0);

        // 1. Calculate total Bkash advances (capped at 500 per booking)
        const bkashAdvanceBookings = await Booking.find({ 
            paymentMethod: "BKASH", 
            paymentType: "advance",
            status: { $ne: "cancelled" }
        });
        
        let totalBkashAdvancePool = 0;
        for (const b of bkashAdvanceBookings) {
            let bookingAdvance = 0;
            if (b.advanceAmount && b.advanceAmount > 0) {
                bookingAdvance = b.advanceAmount;
            } else {
                let advanceTx = null;
                if (b.transactionId) {
                    advanceTx = await Transaction.findOne({ 
                        booking: b._id, 
                        notes: { $regex: b.transactionId, $options: "i" } 
                    });
                }

                if (!advanceTx) {
                    const txs = await Transaction.find({ booking: b._id }).sort({ createdAt: 1 });
                    advanceTx = txs.find(t => t.transactionType === "advance" || t.transactionType === "full");
                }
                
                if (advanceTx) {
                    bookingAdvance = advanceTx.amount;
                } else if (b.status !== "completed") {
                    bookingAdvance = (b.paidAmount || 0);
                } else {
                    const txs = await Transaction.find({ booking: b._id });
                    const dueTxs = txs.filter(t => t.transactionType === "due");
                    const totalDue = dueTxs.reduce((sum, t) => sum + t.amount, 0);
                    if (totalDue > 0) {
                        bookingAdvance = (b.totalAmount - totalDue);
                    }
                }
            }
            totalBkashAdvancePool += Math.min(bookingAdvance, 500);
        }

        // 2. Calculate how much has already been transferred FROM the Bkash system
        const BKASH_SYSTEM_ID = "6645db7d6927a63aab41c000"; // Virtual ID for Bkash System
        const bkashTransfers = await Transfer.find({ 
            from: BKASH_SYSTEM_ID, 
            status: "approved" 
        });
        const bkashTransferred = bkashTransfers.reduce((sum, t) => sum + t.amount, 0);
        const bkashAdvanceBalance = totalBkashAdvancePool - bkashTransferred;

        const currentBalance = totalBalance - totalSent + totalReceived;

        return NextResponse.json({
            balance: currentBalance,
            earned: totalBalance,
            sent: totalSent,
            received: totalReceived,
            pendingReceived: pendingReceived,
            totalPendingReceived: totalPendingReceived,
            pendingSent: pendingSent,
            totalPendingSent: totalPendingSent,
            bkashAdvanceBalance: bkashAdvanceBalance,
            totalBkashAdvancePool: totalBkashAdvancePool,
            bkashTransferred: bkashTransferred
        });
    } catch (error) {
        console.error("GET BALANCE ERROR:", error);
        return NextResponse.json({ message: "Server error" }, { status: 500 });
    }
}

// POST - Transfer money
export async function POST(request) {
    try {
        const session = await auth();

        if (!session) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        // Check if user is admin
        const allowedRoles = ["SUPER_ADMIN", "GENERAL_ADMIN", "MANAGER", "VIEWER"];
        if (!allowedRoles.includes(session.user.role)) {
            return NextResponse.json({ message: "Only admins can transfer funds" }, { status: 403 });
        }

        await connectDB();

        const { toUserId, amount, notes, isBkashTransfer } = await request.json();

        if ((!toUserId && !isBkashTransfer) || !amount || amount <= 0) {
            return NextResponse.json(
                { message: "Invalid transfer details" },
                { status: 400 }
            );
        }

        const BKASH_SYSTEM_ID = "6645db7d6927a63aab41c000";

        if (isBkashTransfer) {
            // Logic for transferring from Bkash Advance Pool to own account
            // 1. Calculate pool balance (MATCHING GET LOGIC)
            const bkashAdvanceBookings = await Booking.find({ 
                paymentMethod: "BKASH", 
                paymentType: "advance",
                status: { $ne: "cancelled" }
            });
            
            let totalBkashAdvancePool = 0;
            for (const b of bkashAdvanceBookings) {
                let bookingAdvance = 0;
                if (b.advanceAmount && b.advanceAmount > 0) {
                    bookingAdvance = b.advanceAmount;
                } else {
                    let advanceTx = null;
                    if (b.transactionId) {
                        advanceTx = await Transaction.findOne({ 
                            booking: b._id, 
                            notes: { $regex: b.transactionId, $options: "i" } 
                        });
                    }

                    if (!advanceTx) {
                        const txs = await Transaction.find({ booking: b._id }).sort({ createdAt: 1 });
                        advanceTx = txs.find(t => t.transactionType === "advance" || t.transactionType === "full");
                    }
                    
                    if (advanceTx) {
                        bookingAdvance = advanceTx.amount;
                    } else if (b.status !== "completed") {
                        bookingAdvance = (b.paidAmount || 0);
                    } else {
                        const txs = await Transaction.find({ booking: b._id });
                        const dueTxs = txs.filter(t => t.transactionType === "due");
                        const totalDue = dueTxs.reduce((sum, t) => sum + t.amount, 0);
                        if (totalDue > 0) {
                            bookingAdvance = (b.totalAmount - totalDue);
                        }
                    }
                }
                totalBkashAdvancePool += Math.min(bookingAdvance, 500);
            }

            const bkashTransfers = await Transfer.find({ from: BKASH_SYSTEM_ID, status: "approved" });
            const bkashTransferred = bkashTransfers.reduce((sum, t) => sum + t.amount, 0);
            const availableBkash = totalBkashAdvancePool - bkashTransferred;

            if (availableBkash < amount) {
                return NextResponse.json(
                    { message: `Insufficient Bkash Advance balance. Available: ৳${availableBkash}` },
                    { status: 400 }
                );
            }

            const sender = { name: "Bkash System" };
            const receiver = await User.findById(session.user.id);

            // Create transfer record from Bkash System to User
            const transfer = await Transfer.create({
                from: BKASH_SYSTEM_ID,
                to: session.user.id,
                amount,
                fromName: sender.name,
                toName: receiver.name,
                status: "approved",
                notes: notes || `Transfer from Bkash Advance Pool by ${receiver.name}`,
                approvedAt: new Date(),
            });

            return NextResponse.json(
                {
                    message: "Funds transferred from Bkash Advance to your account successfully.",
                    transfer,
                },
                { status: 201 }
            );
        }

        // Standard transfer logic
        // ... (existing code for sender balance check)
        const senderTransactions = await Transaction.find({ receiver: session.user.id });
        const senderEarned = senderTransactions.reduce((sum, t) => {
            if (t.transactionType === "cancellation") return sum - t.amount;
            return sum + t.amount;
        }, 0);
        
        const sentTransfers = await Transfer.find({ from: session.user.id, status: "approved" });
        const receivedTransfers = await Transfer.find({ to: session.user.id, status: "approved" });

        const totalSent = sentTransfers.reduce((sum, t) => sum + t.amount, 0);
        const totalReceived = receivedTransfers.reduce((sum, t) => sum + t.amount, 0);

        const currentBalance = senderEarned - totalSent + totalReceived;

        // Check if sender has enough balance
        if (currentBalance < amount) {
            return NextResponse.json(
                { message: `Insufficient balance. Available: ৳${currentBalance}` },
                { status: 400 }
            );
        }

        // Get sender and receiver details
        const sender = await User.findById(session.user.id);
        const receiver = await User.findById(toUserId);

        if (!receiver) {
            return NextResponse.json({ message: "Receiver not found" }, { status: 404 });
        }

        // Check if trying to transfer to self
        const isOwnAccount = session.user.id === toUserId;

        // Create transfer record
        const transfer = await Transfer.create({
            from: session.user.id,
            to: toUserId,
            amount,
            fromName: sender.name,
            toName: receiver.name,
            status: isOwnAccount ? "approved" : "pending",
            notes: notes || `${isOwnAccount ? 'Self' : 'Account'} transfer from ${sender.name} to ${receiver.name}`,
            approvedAt: isOwnAccount ? new Date() : null,
        });

        return NextResponse.json(
            {
                message: isOwnAccount 
                    ? "Transfer completed successfully." 
                    : "Transfer request sent successfully. Waiting for recipient confirmation.",
                transfer,
                currentBalance,
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("TRANSFER ERROR:", error);
        return NextResponse.json({ message: "Server error" }, { status: 500 });
    }
}
