import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import Transfer from "@/models/Transfer";
import { NextResponse } from "next/server";

export async function POST(request, { params }) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        // Check if user is admin
        const allowedRoles = ["SUPER_ADMIN", "GENERAL_ADMIN", "MANAGER", "VIEWER"];
        if (!allowedRoles.includes(session.user.role)) {
            return NextResponse.json({ message: "Only admins can approve transfers" }, { status: 403 });
        }

        await connectDB();

        const { id } = await params;

        // Find the transfer
        const transfer = await Transfer.findById(id);

        if (!transfer) {
            return NextResponse.json({ message: "Transfer not found" }, { status: 404 });
        }

        // Check if the logged-in user is the recipient or super admin
        if (transfer.to.toString() !== session.user.id && session.user.role !== "SUPER_ADMIN") {
            return NextResponse.json(
                { message: "Only the recipient or Super Admin can approve this transfer" },
                { status: 403 }
            );
        }

        // Check if transfer is already approved or rejected
        if (transfer.status !== "pending") {
            return NextResponse.json(
                { message: `Transfer already ${transfer.status}` },
                { status: 400 }
            );
        }

        // Update transfer status to approved
        transfer.status = "approved";
        transfer.approvedAt = new Date();
        await transfer.save();

        return NextResponse.json(
            {
                message: "Transfer approved successfully",
                transfer,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error approving transfer:", error);
        return NextResponse.json(
            { message: "Failed to approve transfer", error: error.message },
            { status: 500 }
        );
    }
}
