import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Booking from "@/models/Booking";
import { TIME_SLOTS } from "@/lib/pricing";

function parseTimeSlot(timeStr) {
  const match = timeStr.match(/(\d+):(\d+)(am|pm)/i);
  if (!match) return null;

  let hour = parseInt(match[1]);
  const minutes = parseInt(match[2]);
  const period = match[3].toLowerCase();

  if (period === "pm" && hour !== 12) {
    hour += 12;
  } else if (period === "am" && hour === 12) {
    hour = 0;
  }

  return { hour, minutes };
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const arenaName = searchParams.get("arena");
    const dateParam = searchParams.get("date");

    if (!arenaName || !dateParam) {
      return NextResponse.json({ error: "Missing arena or date" }, { status: 400 });
    }

    await connectDB();

    // Cleanup abandoned pending bookings (older than 15 minutes)
    const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000);
    await Booking.deleteMany({
      status: "pending",
      createdAt: { $lt: fifteenMinsAgo }
    });

    
    const [year, month, day] = dateParam.split("-").map(Number);
    const selectedDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
    const nextDay = new Date(Date.UTC(year, month - 1, day + 1, 0, 0, 0));

    console.log("Fetching bookings for:", {
      arenaName,
      dateParam,
      selectedDate: selectedDate.toISOString(),
      nextDay: nextDay.toISOString()
    });

    const bookings = await Booking.find({
      arenaName,
      bookingDate: {
        $gte: selectedDate,
        $lt: nextDay
      },
      status: { $in: ["pending", "confirmed"] },
    }).select("timeSlot status bookingDate");

    console.log("Found bookings:", bookings.length, bookings.map(b => ({
      slot: b.timeSlot,
      status: b.status,
      date: b.bookingDate
    })));

    const bookedSlots = new Set(bookings.map(b => b.timeSlot));

    console.log("Booked slots set:", Array.from(bookedSlots));

    // Get current date string in Bangladesh timezone (Asia/Dhaka) as YYYY-MM-DD
    const dhakaTodayStr = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Dhaka" });
    const isToday = (dateParam === dhakaTodayStr);
    const isPastDate = (dateParam < dhakaTodayStr);

    const dhakaNow = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Dhaka" }));
    const dhakaHour = dhakaNow.getHours();
    const dhakaMinute = dhakaNow.getMinutes();
    const currentMins = dhakaHour * 60 + dhakaMinute;

    const slots = TIME_SLOTS.map(slot => {
      let status = "available";

      // Check if slot is already booked
      if (bookedSlots.has(slot)) {
        status = "booked";
        console.log(`Slot ${slot} marked as BOOKED`);
      } else if (isPastDate) {
        status = "past";
      } else if (isToday) {
        const [startTime] = slot.split(" to ");
        const parsed = parseTimeSlot(startTime);

        if (parsed) {
          const slotMins = parsed.hour * 60 + parsed.minutes;

          if (slotMins <= currentMins) {
            status = "past";
          }
        }
      }

      return { slot, status };
    });

    console.log("Final slots response:", {
      total: slots.length,
      available: slots.filter(s => s.status === "available").length,
      booked: slots.filter(s => s.status === "booked").length,
      past: slots.filter(s => s.status === "past").length
    });

    return NextResponse.json({ slots });
  } catch (error) {
    console.error("Error fetching available slots:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}