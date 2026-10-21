// app/api/update-price/route.js

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Pricing from "@/models/ArenaPricing";
import { auth } from "@/auth";
import { hasPermission } from "@/lib/hasPermissions";
import { PERMISSIONS } from "@/lib/permissions";

export async function POST(req) {
  try {
    const session = await auth();
    if (!session || !hasPermission(session.user.role, PERMISSIONS.MANAGE_PRICING)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const data = await req.json();
    const {
      arenaName,
      defaultPrice,
      timeSlots,
      fridayDefaultPrice,
      fridayTimeSlots,
      saturdayDefaultPrice,
      saturdayTimeSlots,
    } = data;

    if (!arenaName) {
      return NextResponse.json({ message: "Arena name is required" }, { status: 400 });
    }

    const updateFields = {
      arenaName,
      defaultPrice: Number(defaultPrice) || 2000,
      timeSlots: Array.isArray(timeSlots) ? timeSlots : [],
      fridayDefaultPrice: fridayDefaultPrice !== null && fridayDefaultPrice !== undefined && fridayDefaultPrice !== ""
        ? Number(fridayDefaultPrice)
        : null,
      fridayTimeSlots: Array.isArray(fridayTimeSlots) ? fridayTimeSlots : [],
      saturdayDefaultPrice: saturdayDefaultPrice !== null && saturdayDefaultPrice !== undefined && saturdayDefaultPrice !== ""
        ? Number(saturdayDefaultPrice)
        : null,
      saturdayTimeSlots: Array.isArray(saturdayTimeSlots) ? saturdayTimeSlots : [],
    };

    const updated = await Pricing.findOneAndUpdate(
      { arenaName },
      updateFields,
      {
        new: true,
        upsert: true,
      }
    );

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.error("UPDATE PRICING ERROR:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}