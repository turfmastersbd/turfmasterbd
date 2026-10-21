import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

const ALLOWED_ROLES = [
  "REGULAR_CUSTOMER",
  "SPECIAL_CUSTOMER",
  "GENERAL_ADMIN",
  "MANAGER",
  "VIEWER",
];

export async function PATCH(request, { params }) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const { role } = await request.json();

    if (!ALLOWED_ROLES.includes(role)) {
      return NextResponse.json({ message: "Invalid role" }, { status: 400 });
    }

    await connectDB();

    await User.findByIdAndUpdate(params.id, { role });

    return NextResponse.json({ message: "Role updated" });
  } catch (error) {
    console.error("UPDATE ROLE ERROR:", error);

    return NextResponse.json(
      { message: "Server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await auth();

    if (
      !session ||
      !["SUPER_ADMIN", "GENERAL_ADMIN"].includes(session.user.role)
    ) {
      return NextResponse.json(
        { message: "Forbidden" },
        { status: 403 }
      );
    }

    await connectDB();

    const user = await User.findById(params.id);

    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    if (user.role === "SUPER_ADMIN") {
      return NextResponse.json(
        { message: "Super admin cannot be deleted" },
        { status: 403 }
      );
    }

    await User.findByIdAndDelete(params.id);

    return NextResponse.json({
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("DELETE USER ERROR:", error);

    return NextResponse.json(
      { message: "Server error" },
      { status: 500 }
    );
  }
}