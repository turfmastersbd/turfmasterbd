import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import Booking from "@/models/Booking";
import bcrypt from "bcryptjs";

import { PERMISSIONS } from "@/lib/permissions";
import { hasPermission } from "@/lib/hasPermissions";
import User from "@/models/User";
import Transaction from "@/models/Transaction";
import mongoose from "mongoose";
import { sendBookingSms } from "@/lib/sms";
import { calculateSlotPrice } from "@/lib/pricing";
export async function POST(request) {
  try {
    const session = await auth();

    await connectDB();

    const body = await request.json();

    const {
      arenaName,
      bookingDate,
      timeSlot,
      notes,
      paymentType,
      paymentMethod = "COD",
      totalAmount,
      transactionId,
      bookingForName,
      bookingForPhone,
      originalAmount,
      couponCode,
      discountAmount,
    } = body;

    if (
      !arenaName ||
      !bookingDate ||
      !timeSlot ||
      !paymentType ||
      totalAmount === undefined ||
      totalAmount === null
    ) {
      return NextResponse.json(
        { error: "Please fill all required fields" },
        { status: 400 }
      );
    }

    if (
      paymentMethod !== "COD" &&
      (!transactionId || transactionId.length !== 10)
    ) {
      return NextResponse.json(
        { error: "Transaction ID must be exactly 10 characters" },
        { status: 400 }
      );
    }

    // Fetch pricing from database
    const Pricing = mongoose.models.Pricing || (await import("@/models/ArenaPricing")).default;
    let arenaPricing = await Pricing.findOne({ arenaName });
    if (!arenaPricing && arenaName) {
      const cleanedName = arenaName.replace(/&/g, "").replace(/\s+/g, ".*");
      arenaPricing = await Pricing.findOne({
        arenaName: { $regex: new RegExp(cleanedName, "i") }
      });
    }
    
    const actualTotalAmount = calculateSlotPrice(arenaPricing, bookingDate, timeSlot);

    const discount = discountAmount || 0;
    const finalAmount = Math.max(0, actualTotalAmount - discount);

    console.log("Booking coupon data:", {
      originalAmount: originalAmount || actualTotalAmount,
      couponCode: couponCode || null,
      discountAmount: discountAmount || 0,
      actualTotalAmount,
      finalAmount
    });

    const existingBooking = await Booking.findOne({
      arenaName,
      bookingDate: new Date(bookingDate),
      timeSlot,
      status: { $in: ["pending", "confirmed"] },
    });

    if (existingBooking) {
      return NextResponse.json(
        { error: "This slot is already booked" },
        { status: 400 }
      );
    }

    if (paymentType === "full" && totalAmount !== finalAmount) {
      return NextResponse.json(
        { error: "Invalid payment amount" },
        { status: 400 }
      );
    }

    let paidAmount = 0;
    let remainingAmount = finalAmount;
    let paymentStatus = "unpaid";

    const role = session?.user?.role || "GUEST";

    const allowedCODRoles = [
      "SUPER_ADMIN",
      "GENERAL_ADMIN",
      "MANAGER",
      "VIEWER",
    ];

    if (
      (paymentMethod === "COD" || paymentType === "cod") &&
      (!session || !allowedCODRoles.includes(role))
    ) {
      return NextResponse.json(
        { error: "Cash on Booking is not allowed for customers. Please pay advance with bKash." },
        { status: 403 }
      );
    }

    if (paymentMethod === "COD") {
      paidAmount = Number(body.cashAmount || 0);
      remainingAmount = Math.max(0, finalAmount - paidAmount);
      paymentStatus = paidAmount >= finalAmount ? "paid" : (paidAmount > 0 ? "partial" : "unpaid");
    }

    if (paymentType === "full") {
      paidAmount = finalAmount;
      remainingAmount = 0;
      paymentStatus = "paid";
    }

    const isCustomerRole = !session || ["REGULAR_CUSTOMER", "SPECIAL_CUSTOMER", "USER", "GUEST"].includes(role);
    const MIN_ADVANCE = isCustomerRole ? 500 : 0;

    if (paymentType === "advance") {
      if (totalAmount < MIN_ADVANCE) {
        return NextResponse.json(
          { error: `Minimum advance is ${MIN_ADVANCE} TK` },
          { status: 400 }
        );
      }

      if (totalAmount > finalAmount) {
        return NextResponse.json(
          { error: "Advance amount cannot exceed total amount" },
          { status: 400 }
        );
      }

      paidAmount = totalAmount;
      remainingAmount = finalAmount - totalAmount;
      paymentStatus = "partial";
    }

    let finalUserId = null;
    let finalName = "";
    let finalPhone = "";

    const userPhone = session?.user?.phone || "";
    const isBookingForSelf = session && (["REGULAR_CUSTOMER", "USER"].includes(session.user.role) || (
      session.user.role === "SPECIAL_CUSTOMER" && 
      bookingForPhone && 
      userPhone && 
      (bookingForPhone.replace(/[\s+-]/g, "").endsWith(userPhone.replace(/[\s+-]/g, "")) || 
       userPhone.replace(/[\s+-]/g, "").endsWith(bookingForPhone.replace(/[\s+-]/g, "")))
    ));

    if (isBookingForSelf) {
      const dbUser = await User.findOne({ email: session.user.email });

      if (!dbUser) {
        return NextResponse.json(
          { error: "User not found" },
          { status: 404 }
        );
      }

      finalUserId = dbUser._id;
      finalName = dbUser.name || session.user.name;
      finalPhone = dbUser.phone || session.user.phone;
    } else {
      // Admin booking for another user OR Guest user booking
      if (!bookingForName || !bookingForPhone) {
        return NextResponse.json(
          { error: "Customer name and phone are required" },
          { status: 400 }
        );
      }

      finalName = bookingForName;
      finalPhone = bookingForPhone;

      // Try to find existing user by phone
      let customerUser = await User.findOne({ phone: bookingForPhone });

      if (customerUser) {
        finalUserId = customerUser._id;
      } else {
        finalUserId = null;
      }
    }

    // Find a receiver for the advance/payment
    let receiverUser = null;
    if (paymentMethod === "BKASH") {
      receiverUser = {
        _id: "6645db7d6927a63aab41c000",
        name: "Bkash System"
      };
    } else if (session && ["SUPER_ADMIN", "GENERAL_ADMIN", "MANAGER", "SPECIAL_CUSTOMER"].includes(session.user.role)) {
      receiverUser = await User.findOne({ email: session.user.email });
    } else {
      // For regular customers booking online, assign to the first SUPER_ADMIN found
      receiverUser = await User.findOne({ role: "SUPER_ADMIN" });
    }

    const booking = await Booking.create({
      user: finalUserId ? new mongoose.Types.ObjectId(finalUserId) : null,
      bookingForName: finalName,
      bookingForPhone: finalPhone,

      arenaName,
      bookingDate: new Date(bookingDate),
      timeSlot,
      duration: 90,
      notes: notes || "",

      paymentType,
      paidAmount,
      advanceAmount: paidAmount,
      cashAmount: paymentMethod === "COD" ? (body.cashAmount || 0) : 0,
      paymentMethod: paymentMethod || "COD",
      totalAmount: finalAmount, // Use discounted amount as totalAmount
      remainingAmount,
      paymentStatus,

      transactionId: paymentMethod === "COD" ? null : transactionId,
      status: "confirmed", // Skip pending, direct to confirmed
      bookingByRole: session?.user?.role || "GUEST",
      advanceReceiver: receiverUser?._id,
      advanceReceiverName: receiverUser?.name,
      originalAmount: originalAmount || actualTotalAmount,
      couponCode: couponCode || null,
      discountAmount: discountAmount || 0,
    });

    // If there's an advance/payment, update receiver balance and create transaction
    if (receiverUser && paidAmount > 0) {
      if (receiverUser._id.toString() !== "6645db7d6927a63aab41c000") {
        await User.findByIdAndUpdate(receiverUser._id, {
          $inc: { currentBalance: paidAmount }
        });
      }

      await Transaction.create({
        booking: booking._id,
        receiver: receiverUser._id,
        receiverName: receiverUser.name,
        amount: paidAmount,
        transactionType: remainingAmount > 0 ? "advance" : "full",
        paymentStatus: "confirmed",
        bookingStatus: "confirmed",
        arenaName: booking.arenaName,
        bookingDate: booking.bookingDate,
        timeSlot: booking.timeSlot,
        customerName: finalName,
        customerPhone: finalPhone,
        notes: `Automatic confirmation for ${paymentMethod} booking`,
        // Include coupon information
        couponCode: couponCode || null,
        discountAmount: discountAmount || 0,
        originalAmount: originalAmount || actualTotalAmount,
      });
    }

    console.log("Booking created with coupon fields:", {
      id: booking._id,
      originalAmount: booking.originalAmount,
      couponCode: booking.couponCode,
      discountAmount: booking.discountAmount,
      totalAmount: booking.totalAmount
    });

    // If coupon was used, increment its usage counter
    if (couponCode) {
      try {
        await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/coupons`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: couponCode })
        });
      } catch (error) {
        console.error("Failed to increment coupon usage:", error);
        // Don't fail the booking if coupon increment fails
      }
    }

    // Send SMS confirmation
    try {
      sendBookingSms(booking).catch(err => console.error("SMS notification error:", err));
    } catch (smsErr) {
      console.error("Failed to initiate SMS dispatch:", smsErr);
    }

    return NextResponse.json(
      { success: true, message: "Booking created successfully", booking },
      { status: 201 }
    );
  } catch (error) {
    console.error("BOOKING API ERROR:", error);

    return Response.json(
      {
        error: error.message || "Something went wrong",
      },
      { status: 500 }
    );
  }
}



export async function GET(request) {
  try {
    const session = await auth();
    console.log("role from db", session.user.role);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    // Cleanup abandoned pending bookings (older than 15 minutes)
    const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000);
    await Booking.deleteMany({
      status: "pending",
      createdAt: { $lt: fifteenMinsAgo }
    });

    const { id: userId, role } = session.user;

    let query = {};


    if (hasPermission(role, PERMISSIONS.VIEW_ALL_BOOKINGS)) {
      query = {};
    } else if (hasPermission(role, PERMISSIONS.VIEW_OWN_BOOKINGS)) {
      query = {
        $or: [
          { user: userId },
          { advanceReceiver: userId },
          { bookingForPhone: session.user.phone }
        ]
      };
    } else {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }



    const bookings = await Booking.find(query)
      .populate("user", "name phone role")
      .select('+originalAmount +couponCode +discountAmount +customerStatus')
      .sort({ createdAt: -1 });

    if (bookings.length > 0) {
      console.log("First booking customerStatus:", bookings[0].customerStatus);
    }

    return NextResponse.json(bookings, { status: 200 });
  } catch (error) {
    console.error("GET BOOKINGS ERROR:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
