import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Transaction from "@/models/Transaction";
import Transfer from "@/models/Transfer";

// GET all admin users
export async function GET() {
    try {
        const session = await auth();

        if (!session) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        // Check if user is admin
        const allowedRoles = ["SUPER_ADMIN", "GENERAL_ADMIN", "MANAGER", "VIEWER"];
        if (!allowedRoles.includes(session.user.role)) {
            return NextResponse.json({ message: "Access denied" }, { status: 403 });
        }

        await connectDB();

        // Get all admin users except current user
        const adminUsers = await User.find(
            {
                role: { $in: ["SUPER_ADMIN", "GENERAL_ADMIN", "MANAGER", "VIEWER"] },
                _id: { $ne: session.user.id },
            },
            "name email phone role"
        ).sort({ name: 1 });

        const adminIds = adminUsers.map((user) => user._id);

        // Fetch transactions for these admins
        const transactions = await Transaction.find({ receiver: { $in: adminIds } });

        // Fetch approved transfers for/from these admins
        const sentTransfers = await Transfer.find({ from: { $in: adminIds }, status: "approved" });
        const receivedTransfers = await Transfer.find({ to: { $in: adminIds }, status: "approved" });

        // Calculate dynamic balance for each user
        const usersWithBalances = adminUsers.map((user) => {
            const userIdStr = user._id.toString();

            // Total earned from transactions
            const userTransactions = transactions.filter((t) => t.receiver?.toString() === userIdStr);
            const totalEarned = userTransactions.reduce((sum, t) => {
                if (t.transactionType === "cancellation") return sum - t.amount;
                return sum + t.amount;
            }, 0);

            // Total sent transfers
            const totalSent = sentTransfers
                .filter((t) => t.from?.toString() === userIdStr)
                .reduce((sum, t) => sum + t.amount, 0);

            // Total received transfers
            const totalReceived = receivedTransfers
                .filter((t) => t.to?.toString() === userIdStr)
                .reduce((sum, t) => sum + t.amount, 0);

            const dynamicBalance = totalEarned - totalSent + totalReceived;

            return {
                ...user.toObject(),
                currentBalance: dynamicBalance,
            };
        });

        return NextResponse.json({ users: usersWithBalances });
    } catch (error) {
        console.error("GET ADMIN USERS ERROR:", error);
        return NextResponse.json({ message: "Server error" }, { status: 500 });
    }
}

