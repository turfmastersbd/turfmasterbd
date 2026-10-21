import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import Transfer from "@/models/Transfer";

// GET transfer history for logged-in user
export async function GET(request) {
    try {
        const session = await auth();

        if (!session) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        await connectDB();

        const { searchParams } = new URL(request.url);
        const startDate = searchParams.get("startDate");
        const endDate = searchParams.get("endDate");
        const status = searchParams.get("status") || "all"; // all, pending, approved, rejected
        const allowedRoles = ["SUPER_ADMIN", "GENERAL_ADMIN", "MANAGER", "VIEWER"];
        const isAdmin = allowedRoles.includes(session.user?.role);

        let query = {};
        if (!isAdmin) {
            query = {
                $or: [
                    { from: session.user.id },
                    { to: session.user.id }
                ]
            };
        }

        // Filter by status if specified
        if (status !== "all") {
            query.status = status;
        }

        // Add date range filter if provided
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }

        const transfers = await Transfer.find(query)
            .populate("from", "name email phone role")
            .populate("to", "name email phone role")
            .sort({ createdAt: -1 });

        // Separate sent and received (relative to the logged-in user)
        const sent = transfers.filter(
            t => t.from?._id?.toString() === session.user.id
        );

        const received = transfers.filter(
            t => t.to?._id?.toString() === session.user.id
        );

        // Calculate totals (only approved transfers for actual money moved)
        const approvedSent = sent.filter(t => t.status === "approved");
        const approvedReceived = received.filter(t => t.status === "approved");

        const approvedTransfers = transfers.filter(t => t.status === "approved");
        const pendingTransfers = transfers.filter(t => t.status === "pending");

        const totals = {
            isAdmin,
            totalSent: approvedSent.reduce((sum, t) => sum + t.amount, 0),
            totalReceived: approvedReceived.reduce((sum, t) => sum + t.amount, 0),
            sentCount: approvedSent.length,
            receivedCount: approvedReceived.length,
            pendingSent: sent.filter(t => t.status === "pending").length,
            pendingReceived: received.filter(t => t.status === "pending").length,
            systemTotalAmount: approvedTransfers.reduce((sum, t) => sum + t.amount, 0),
            systemApprovedCount: approvedTransfers.length,
            systemPendingCount: pendingTransfers.length,
        };

        return NextResponse.json({
            transfers,
            sent,
            received,
            totals,
        }, { status: 200 });
    } catch (error) {
        console.error("GET TRANSFER HISTORY ERROR:", error);
        return NextResponse.json({ message: "Server error" }, { status: 500 });
    }
}
