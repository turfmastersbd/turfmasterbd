// app/api/pricing/route.js

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Pricing from "@/models/ArenaPricing";

export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const arenaName = searchParams.get("arena");

    if (arenaName) {
      let pricing = await Pricing.findOne({ arenaName });
      if (!pricing) {
        // Fallback for & vs treat variations
        const cleanedName = arenaName.replace(/&/g, "").replace(/\s+/g, ".*");
        pricing = await Pricing.findOne({
          arenaName: { $regex: new RegExp(cleanedName, "i") }
        });
      }

      if (!pricing) {
        // Return default if not found
        return NextResponse.json({
          arenaName,
          defaultPrice: 2000,
          timeSlots: [],
          fridayDefaultPrice: null,
          fridayTimeSlots: [],
          saturdayDefaultPrice: null,
          saturdayTimeSlots: [],
        });
      }
      return NextResponse.json(pricing);
    }

    const allPricing = await Pricing.find();
    return NextResponse.json(allPricing);
  } catch (error) {
    console.error("PRICING GET ERROR:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}