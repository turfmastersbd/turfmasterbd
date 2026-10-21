import { NextResponse } from "next/server";
import { executeBkashPayment, queryBkashPayment } from "@/lib/bkash";
import { connectDB } from "@/lib/mongodb";
import Booking from "@/models/Booking";
import BkashPendingPayment from "@/models/BkashPendingPayment";
import Transaction from "@/models/Transaction";
import { sendBookingSms } from "@/lib/sms";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const paymentID = searchParams.get("paymentID");
  const status = searchParams.get("status");

  if (status === "cancel" || status === "failure") {
    try {
      await connectDB();
      // Just delete the pending intent — no real booking was created
      await BkashPendingPayment.findOneAndDelete({ bkashPaymentID: paymentID });
      const failMessage = status === "cancel" ? "Payment+cancel" : "Payment+failure";
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/booking?status=failed&message=${failMessage}`
      );
    } catch (err) {
      console.error("Cleanup error on cancel/fail:", err);
      const failMessage = status === "cancel" ? "Payment+cancel" : "Payment+failure";
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/booking?status=failed&message=${failMessage}`
      );
    }
  }

  try {
    await connectDB();

    // Execute payment (with Query API fallback if Execute times out)
    let result;
    try {
      result = await executeBkashPayment(paymentID);
    } catch (executeError) {
      // Mandatory: If Execute API doesn't respond in 30s, use Query Payment API
      console.log("Execute API failed/timed out, falling back to Query Payment API...");
      result = await queryBkashPayment(paymentID);
    }

    if (result.statusCode === "0000") {
      // Payment successful — retrieve the pending intent
      const pendingIntent = await BkashPendingPayment.findById(result.merchantInvoiceNumber);

      if (!pendingIntent) {
        console.error("BkashPendingPayment not found for ID:", result.merchantInvoiceNumber);
        return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/?status=error`);
      }

      const { bookingData, userId } = pendingIntent;
      const paidNow = parseFloat(result.amount);
      const finalPrice = bookingData.finalPrice || bookingData.totalAmount;
      const remainingAmount = Math.max(0, finalPrice - paidNow);

      // NOW create the real Booking (only on successful payment)
      const booking = await Booking.create({
        ...bookingData,
        user: userId || null,
        bookingDate: new Date(bookingData.bookingDate),
        status: "confirmed",
        paymentStatus: remainingAmount <= 0 ? "paid" : "partial",
        paymentMethod: "BKASH",
        paidAmount: paidNow,
        advanceAmount: paidNow,
        totalAmount: finalPrice,
        remainingAmount,
        transactionId: result.trxID,
        bkashPaymentID: paymentID,
      });

      // Assign to Bkash System and log transaction
      try {
        const BKASH_SYSTEM_ID = "6645db7d6927a63aab41c000";
        booking.advanceReceiver = BKASH_SYSTEM_ID;
        booking.advanceReceiverName = "Bkash System";
        await booking.save();

        await Transaction.create({
          booking: booking._id,
          receiver: BKASH_SYSTEM_ID,
          receiverName: "Bkash System",
          amount: paidNow,
          transactionType: remainingAmount > 0 ? "advance" : "full",
          paymentStatus: "confirmed",
          bookingStatus: "confirmed",
          arenaName: booking.arenaName,
          bookingDate: booking.bookingDate,
          timeSlot: booking.timeSlot,
          customerName: booking.bookingForName || "Unknown Customer",
          customerPhone: booking.bookingForPhone || "N/A",
          notes: `Automatic confirmation for BKASH online booking (TrxID: ${result.trxID})`,
          couponCode: booking.couponCode || null,
          discountAmount: booking.discountAmount || 0,
          originalAmount: booking.originalAmount || finalPrice,
        });
      } catch (txError) {
        console.error("Failed to create transaction in bKash callback:", txError);
      }

      // Send SMS confirmation
      try {
        sendBookingSms(booking).catch((err) =>
          console.error("SMS notification error:", err)
        );
      } catch (smsErr) {
        console.error("Failed to initiate SMS dispatch:", smsErr);
      }

      // Increment coupon usage if applicable
      if (booking.couponCode) {
        try {
          await fetch(`${process.env.NEXTAUTH_URL}/api/coupons`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code: booking.couponCode }),
          });
        } catch (error) {
          console.error("Failed to increment coupon usage:", error);
        }
      }

      // Delete the pending intent — booking is now confirmed
      await BkashPendingPayment.findByIdAndDelete(pendingIntent._id);

      const redirectPath = userId ? "/dashboard" : "/";
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}${redirectPath}?status=success`);

    } else {
      // Payment execution failed — delete the pending intent
      await BkashPendingPayment.findOneAndDelete({ bkashPaymentID: paymentID });
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/?status=failed&message=${result.statusMessage}`
      );
    }
  } catch (error) {
    console.error("BKASH CALLBACK ERROR:", error);
    try {
      await BkashPendingPayment.findOneAndDelete({ bkashPaymentID: paymentID });
    } catch (e) { }
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/?status=error`);
  }
}
