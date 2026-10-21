export async function sendBookingSms(booking) {
  try {
    const apiKey = process.env.SMS_API_KEY;
    const senderId = process.env.SENDER_ID;

    if (!apiKey || !senderId) {
      console.warn("SMS_API_KEY or SENDER_ID is missing from environment variables.");
      return;
    }

    const { arenaName, bookingDate, timeSlot, totalAmount, paymentMethod, paidAmount, advanceAmount, bookingForPhone, cashAmount, remainingAmount } = booking;

    if (!bookingForPhone) {
      console.warn("No phone number found in the booking object. SMS not sent.");
      return;
    }

    // Format phone number: remove all non-digits
    let formattedPhone = bookingForPhone.replace(/[^\d]/g, "");
    
    // Normalize to 13 digits starting with 88 for Bangladeshi numbers if it's 11 digits starting with 0
    if (formattedPhone.length === 11 && formattedPhone.startsWith("0")) {
      formattedPhone = "88" + formattedPhone;
    }

    // Format Date: DD-MM-YYYY (Day Name)
    let formattedDate = "";
    try {
      const d = new Date(bookingDate);
      const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone: "Asia/Dhaka",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        weekday: "long"
      });
      const parts = formatter.formatToParts(d);
      const partMap = {};
      for (const part of parts) {
        partMap[part.type] = part.value;
      }
      formattedDate = `${partMap.day}-${partMap.month}-${partMap.year} (${partMap.weekday})`;
    } catch (e) {
      console.error("Error formatting booking date for SMS:", e);
      const d = new Date(bookingDate);
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      formattedDate = `${day}-${month}-${year}`;
    }

    // Determine advance payment text and due amount
    const paid = paymentMethod === "COD"
      ? Number(cashAmount || paidAmount || 0)
      : Number(advanceAmount || paidAmount || 0);

    const dueAmount = remainingAmount !== undefined && remainingAmount !== null
      ? remainingAmount
      : Math.max(0, (Number(totalAmount) || 0) - paid);

    let advancePaidText = "";
    if (paymentMethod === "COD") {
      advancePaidText = `Cash on Booking (Advance Amount: ${paid} TK)`;
    } else {
      advancePaidText = `${paid} TK`;
    }

    // Message template
    const message = `Congratulations.!
Your booking is confirmed!

Arena: ${arenaName}
Date: ${formattedDate}
Time: ${timeSlot}

Amount: ${totalAmount} TK
Advance Paid: ${advancePaidText}
Due Amount: ${dueAmount} TK

Contact:-
01901644240
`;

    console.log(`Sending SMS to ${formattedPhone}...`);
    console.log(`SMS Content:\n${message}`);

    const url = `https://bulksmsbd.net/api/smsapi?api_key=${encodeURIComponent(apiKey)}&senderid=${encodeURIComponent(senderId)}&number=${encodeURIComponent(formattedPhone)}&message=${encodeURIComponent(message)}`;

    const response = await fetch(url, {
      method: "GET",
    });

    const result = await response.json();
    console.log("SMS API Response:", result);
    return result;
  } catch (error) {
    console.error("Failed to send booking SMS:", error);
  }
}
