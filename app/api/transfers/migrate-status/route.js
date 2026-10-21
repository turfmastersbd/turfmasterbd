import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import Transfer from "@/models/Transfer";

// Migration endpoint to add status field to existing transfers
export async function POST(request) {
    try {
        const session = await auth();

        if (!session) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        // Only SUPER_ADMIN can run migrations
        if (session.user.role !== "SUPER_ADMIN") {
            return NextResponse.json({ message: "Only super admin can run migrations" }, { status: 403 });
        }

        await connectDB();

        // Find all transfers without status field or with null status
        const transfersToUpdate = await Transfer.find({
            $or: [
                { status: { $exists: false } },
                { status: null },
            ]
        });

        console.log(`Found ${transfersToUpdate.length} transfers without status`);

        // Update all transfers to have "approved" status (assuming old transfers were completed)
        const result = await Transfer.updateMany(
            {
                $or: [
                    { status: { $exists: false } },
                    { status: null },
                ]
            },
            {
                $set: {
                    status: "approved",
                    approvedAt: new Date()
                }
            }
        );

        console.log("Migration result:", result);

        return NextResponse.json({
            message: "Migration completed successfully",
            transfersFound: transfersToUpdate.length,
            transfersUpdated: result.modifiedCount,
        }, { status: 200 });
    } catch (error) {
        console.error("Migration error:", error);
        return NextResponse.json({
            message: "Migration failed",
            error: error.message
        }, { status: 500 });
    }
}
