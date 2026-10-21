import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

export async function GET() {
  try {
    const session = await auth();

    const allowedRoles = ["SUPER_ADMIN", "GENERAL_ADMIN"];

    if (!allowedRoles.includes(session.user.role)) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    await connectDB();

    const users = await User.find({}, "-password").sort({ createdAt: -1 });

    return NextResponse.json(users);
  } catch (error) {
    console.error("GET USERS ERROR:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
