import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { createBkashPayment } from "@/lib/bkash";
import { connectDB } from "@/lib/mongodb";
import Booking from "@/models/Booking";
import BkashPendingPayment from "@/models/BkashPendingPayment";
import User from "@/models/User";

export async function POST(request) {
  try {
    const session = await auth();

    await connectDB();

    const { amount, bookingData } = await request.json();

    if (!amount || !bookingData) {
      return NextResponse.json({ error: "Missing required data" }, { status: 400 });
    }

    // Check if slot is already booked (prevent double booking)
    const existingBooking = await Booking.findOne({
      arenaName: bookingData.arenaName,
      bookingDate: new Date(bookingData.bookingDate),
      timeSlot: bookingData.timeSlot,
      status: { $in: ["pending", "confirmed"] },
    });

    if (existingBooking) {
      return NextResponse.json(
        { error: "This slot is already booked" },
        { status: 400 }
      );
    }

    let userId = null;
    if (session?.user?.email) {
      const dbUser = await User.findOne({ email: session.user.email });
      if (dbUser) {
        userId = dbUser._id;
      }
    }

    // Save booking intent to BkashPendingPayment (auto-expires in 30 min)
    // Real Booking is only created after successful payment in callback
    const pendingIntent = await BkashPendingPayment.create({
      amount,
      bookingData,
      userId,
    });

    const callbackURL = `${process.env.NEXTAUTH_URL}/api/bkash/callback`;

    const paymentData = await createBkashPayment(
      amount,
      pendingIntent._id.toString(), // Use pendingIntent ID as merchantInvoiceNumber
      callbackURL,
      bookingData.bookingForPhone
    );

    if (paymentData.statusCode !== "0000") {
      // bKash failed — delete the pending intent
      await BkashPendingPayment.findByIdAndDelete(pendingIntent._id);
      return NextResponse.json({ error: paymentData.statusMessage }, { status: 400 });
    }

    // Save bKash Payment ID to the pending intent for tracking
    pendingIntent.bkashPaymentID = paymentData.paymentID;
    await pendingIntent.save();

    return NextResponse.json({ bkashURL: paymentData.bkashURL });
  } catch (error) {
    console.error("BKASH CREATE ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
