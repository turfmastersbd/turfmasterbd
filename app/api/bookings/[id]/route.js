import { NextResponse } from "next/server";

import { connectDB } from "@/lib/mongodb";

import { auth } from "@/auth";
import { hasPermission } from "@/lib/hasPermissions";
import { PERMISSIONS } from "@/lib/permissions";
import Booking from "@/models/Booking";
import Transaction from "@/models/Transaction";
import User from "@/models/User";
import { sendBookingSms } from "@/lib/sms";

const STATUS_ORDER = ["pending", "confirmed", "completed", "cancelled"];

export async function PATCH(req, { params }) {
  const { id } = await params;
  console.log("PATCH BOOKING HIT", id);
  const session = await auth();
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const body = await req.json();

  const {
    status: newStatus,
    customerStatus,
    totalAmount,
    dueAmount,
    cancelNote,
  } = body;

  const booking = await Booking.findById(id);
  if (!booking) {
    return NextResponse.json({ message: "Booking not found" }, { status: 404 });
  }

  // Handle customerStatus update independently
  if (customerStatus !== undefined) {
    await Booking.findByIdAndUpdate(id, { customerStatus });
    
    if (!newStatus) {
      return NextResponse.json({
        message: "Customer status updated successfully",
        customerStatus,
      });
    }
  }

  if (newStatus) {
    if (!STATUS_ORDER.includes(newStatus)) {
      return NextResponse.json({ message: "Invalid status" }, { status: 400 });
    }
  } else {
    // If no status update, just return success if we updated customerStatus
    return NextResponse.json({ message: "No updates provided" }, { status: 400 });
  }


  // Ensure booking has required customer information
  if (!booking.bookingForName || !booking.bookingForPhone ||
    booking.bookingForName.trim() === "" || booking.bookingForPhone.trim() === "") {
    return NextResponse.json({
      message: "Booking data incomplete - customer information missing",
      debug: {
        hasName: !!booking.bookingForName,
        hasPhone: !!booking.bookingForPhone,
        name: booking.bookingForName,
        phone: booking.bookingForPhone
      }
    }, { status: 400 });
  }

  const role = session.user.role;

  const canUpdate =
    role === "SUPER_ADMIN" ||
    hasPermission(role, PERMISSIONS.CONFIRM_BOOKING) ||
    hasPermission(role, PERMISSIONS.COMPLETED_BOOKING) ||
    hasPermission(role, PERMISSIONS.CANCEL_BOOKING);

  if (!canUpdate) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const currentIndex = STATUS_ORDER.indexOf(booking.status);
  const nextIndex = STATUS_ORDER.indexOf(newStatus);

  if (nextIndex < currentIndex) {
    return NextResponse.json(
      { message: "Status cannot move backward" },
      { status: 400 }
    );
  }

  // Get the receiver user details
  const receiverUser = await User.findOne({ email: session.user.email });
  if (!receiverUser) {
    return NextResponse.json({ message: "Receiver user not found" }, { status: 404 });
  }

  // Handle transactions based on status change
  try {
    // Safely get customer info with fallbacks
    const customerName = booking.bookingForName || "Unknown Customer";
    const customerPhone = booking.bookingForPhone || "N/A";

    if (newStatus === "confirmed" && booking.status === "pending") {
      console.log("CONFIRM HIT", booking.advanceAmount);
      // When confirming: record advance or full payment
      const amountReceived = booking.paidAmount || 0;
      const transactionType = booking.remainingAmount > 0 ? "advance" : "full";
      console.log("Creating confirmed transaction", { amountReceived, transactionType });

      // If BKASH, receiver is the virtual bKash System
      const isBkash = booking.paymentMethod === "BKASH";
      const receiverId = isBkash ? "6645db7d6927a63aab41c000" : receiverUser._id;
      const receiverName = isBkash ? "Bkash System" : receiverUser.name;

      // Update booking with receiver info
      booking.advanceReceiver = receiverId;
      booking.advanceReceiverName = receiverName;

      if (booking.advanceAmount > 0 && receiverId.toString() !== "6645db7d6927a63aab41c000") {
        // TODO: account balance update
        await User.findByIdAndUpdate(receiverId, {
          $inc: { currentBalance: booking.advanceAmount }
        });
      }

      // Create transaction record
      await Transaction.create({
        booking: booking._id,
        receiver: receiverId,
        receiverName: receiverName,
        amount: amountReceived,
        transactionType: transactionType,
        paymentStatus: "confirmed",
        bookingStatus: newStatus,
        arenaName: booking.arenaName,
        bookingDate: booking.bookingDate,
        timeSlot: booking.timeSlot,
        customerName: customerName,
        customerPhone: customerPhone,
        notes: `${transactionType === "advance" ? "Advance" : "Full"} payment of ৳${amountReceived} received on confirmation`,
        // Include coupon information
        couponCode: booking.couponCode || null,
        discountAmount: booking.discountAmount || 0,
        originalAmount: booking.originalAmount || booking.totalAmount,
      });
    }
    else if (newStatus === "completed" && booking.status === "confirmed") {
      // When completing: record due payment if there is any remaining amount
      if (booking.remainingAmount > 0) {
        const finalDueAmount = booking.remainingAmount;

        if (finalDueAmount > 0) {
          // Update booking with due receiver info
          booking.dueReceiver = receiverUser._id;
          booking.dueReceiverName = receiverUser.name;
          booking.paymentStatus = "paid";
          booking.paidAmount = (booking.paidAmount || 0) + finalDueAmount;
          booking.remainingAmount = 0;

          console.log("Creating due transaction", { finalDueAmount });
          // Create transaction for due payment
          await Transaction.create({
            booking: booking._id,
            receiver: receiverUser._id,
            receiverName: receiverUser.name,
            amount: finalDueAmount,
            transactionType: "due",
            paymentStatus: "completed",
            bookingStatus: newStatus,
            arenaName: booking.arenaName,
            bookingDate: booking.bookingDate,
            timeSlot: booking.timeSlot,
            customerName: customerName,
            customerPhone: customerPhone,
            notes: `Due payment of ৳${finalDueAmount} received on completion`,
            // Include coupon information
            couponCode: booking.couponCode || null,
            discountAmount: booking.discountAmount || 0,
            originalAmount: booking.originalAmount || booking.totalAmount,
          });

          await User.findByIdAndUpdate(receiverUser._id, {
            $inc: { currentBalance: finalDueAmount }
          });
        }
      } else {
        // Full payment already received or no due remaining
        // Just mark as completed, no additional transaction amount
        await Transaction.create({
          booking: booking._id,
          receiver: receiverUser._id,
          receiverName: receiverUser.name,
          amount: 0,
          transactionType: "full",
          paymentStatus: "completed",
          bookingStatus: newStatus,
          arenaName: booking.arenaName,
          bookingDate: booking.bookingDate,
          timeSlot: booking.timeSlot,
          customerName: customerName,
          customerPhone: customerPhone,
          notes: `Booking completed - Full payment of ৳${booking.totalAmount} already received`,
          couponCode: booking.couponCode || null,
          discountAmount: booking.discountAmount || 0,
          originalAmount: booking.originalAmount || booking.totalAmount,
        });
      }
    } else if (newStatus === "cancelled") {
      const cancellationAmount = booking.paidAmount || 0;

      // Deduct from receiver's balance if they exist, otherwise from current admin performing cancellation
      const targetUserId = booking.advanceReceiver || receiverUser._id;
      const targetUserIdStr = targetUserId ? targetUserId.toString() : "";

      if (cancellationAmount > 0 && targetUserIdStr !== "6645db7d6927a63aab41c000") {
        await User.findByIdAndUpdate(targetUserId, {
          $inc: { currentBalance: -cancellationAmount }
        });
      }

      const isBkash = booking.paymentMethod === "BKASH";
      const cancellationReceiverId = isBkash ? "6645db7d6927a63aab41c000" : receiverUser._id;
      const cancellationReceiverName = isBkash ? "Bkash System" : receiverUser.name;

      console.log("Creating cancellation transaction", { cancellationAmount, targetUserId });
      await Transaction.create({
        booking: booking._id,
        receiver: cancellationReceiverId,
        receiverName: cancellationReceiverName,
        amount: cancellationAmount,
        transactionType: "cancellation",
        paymentStatus: "cancelled",
        bookingStatus: "cancelled",
        arenaName: booking.arenaName,
        bookingDate: booking.bookingDate,
        timeSlot: booking.timeSlot,
        customerName: customerName,
        customerPhone: customerPhone,
        notes: `Booking cancelled. Note: ${cancelNote || "N/A"}. Amount ৳${cancellationAmount} reversed.`,
        couponCode: booking.couponCode || null,
        discountAmount: booking.discountAmount || 0,
        originalAmount: booking.originalAmount || booking.totalAmount,
      });

      if (cancelNote) {
        booking.cancelNote = cancelNote;
      }
    }

    const isConfirmedNow = (newStatus === "confirmed" && booking.status === "pending");

    // Update booking status
    booking.status = newStatus;
    await booking.save();

    if (isConfirmedNow) {
      try {
        sendBookingSms(booking).catch(err => console.error("SMS notification error:", err));
      } catch (smsErr) {
        console.error("Failed to initiate SMS dispatch:", smsErr);
      }
    }

    return NextResponse.json({
      message: "Status updated successfully",
      status: booking.status,
    });
  } catch (error) {
    console.error("Detailed Transaction error:", {
      message: error.message,
      stack: error.stack,
      errors: error.errors,
      newStatus,
      bookingId: id
    });
    return NextResponse.json({
      message: "Failed to update status and create transaction",
      error: error.message
    }, { status: 500 });
  }
}
