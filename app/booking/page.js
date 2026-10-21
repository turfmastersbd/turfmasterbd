"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";

import DashboardProfileInfo from "@/components/DashboardProfileInfo";
import bkashLogo from "@/public/images/bkash-logo.webp";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import Swal from "sweetalert2";
import { calculateSlotPrice, TIME_SLOTS } from "@/lib/pricing";

const getDurationMins = (slot) => {
  if (!slot) return 60;
  const parts = slot.split(" to ");
  if (parts.length !== 2) return 60;

  const parseTime = (str) => {
    const match = str.match(/(\d+):(\d+)(am|pm)/i);
    if (!match) return null;
    let hour = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const period = match[3].toLowerCase();

    if (period === "pm" && hour !== 12) hour += 12;
    if (period === "am" && hour === 12) hour = 0;
    return hour * 60 + minutes;
  };

  const startMins = parseTime(parts[0]);
  const endMins = parseTime(parts[1]);

  if (startMins === null || endMins === null) return 60;

  let diff = endMins - startMins;
  if (diff <= 0) {
    diff += 24 * 60;
  }

  return diff;
};

const BookingContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();

  // Handle bKash payment redirect status
  useEffect(() => {
    const status = searchParams.get("status");
    const message = searchParams.get("message");

    if (status === "failed") {
      const isCancel = message === "Payment+cancel" || message === "Payment cancel";
      const isFailure = message === "Payment+failure" || message === "Payment failure";

      if (isCancel) {
        toast.error("❌ Payment Cancelled. Please try again.", { duration: 5000 });
      } else if (isFailure) {
        Swal.fire({
          icon: "error",
          title: "Payment Failed",
          text: "Your bKash payment failed (wrong OTP or session expired). Please try again.",
          confirmButtonColor: "#e2136e",
        });
      } else {
        toast.error(`Payment failed: ${message || "Unknown error"}`, { duration: 5000 });
      }

      // Clean URL without reloading
      router.replace("/booking", { scroll: false });
    }

    if (status === "success") {
      Swal.fire({
        icon: "success",
        title: "✅ Payment Successful!",
        text: "Your bKash payment was completed and booking is confirmed.",
        timer: 3000,
        showConfirmButton: false,
      });
      router.replace("/booking", { scroll: false });
    }
  }, [searchParams]);

  const [formData, setFormData] = useState({
    arenaName: "Royel Turf & Swimming Zone",
    bookingDate: "",
    timeSlot: "",
    notes: "",
    paymentType: "advance",
    bookingForName: "",
    bookingForPhone: "",
    advanceAmount: 500,
    couponCode: "",
    cashAmount: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [slots, setSlots] = useState([]);

  const [couponData, setCouponData] = useState(null);
  const [verifyingCoupon, setVerifyingCoupon] = useState(false);

  const [arenaPricing, setArenaPricing] = useState(null);

  useEffect(() => {
    const fetchPricing = async () => {
      if (!formData.arenaName) return;
      try {
        const res = await fetch(`/api/pricing?arena=${encodeURIComponent(formData.arenaName)}`);
        const data = await res.json();
        if (res.ok) setArenaPricing(data);
      } catch (err) {
        console.error("Error fetching pricing:", err);
      }
    };
    fetchPricing();
  }, [formData.arenaName]);

  const getPrice = () => {
    if (!arenaPricing) return 0;
    return calculateSlotPrice(arenaPricing, formData.bookingDate, formData.timeSlot);
  };

  const currentPrice = getPrice();
  const discountAmount = couponData?.discountAmount || 0;
  const finalPrice = Math.max(0, currentPrice - discountAmount);

  const role = session?.user?.role;

  const allowedCODRoles = [
    "SUPER_ADMIN",
    "GENERAL_ADMIN",
    "MANAGER",
    "VIEWER",
  ];

  const canUseCOD = allowedCODRoles.includes(role);

  const canEnterCashAmount = [
    "SUPER_ADMIN",
    "GENERAL_ADMIN",
    "MANAGER",
    "VIEWER",
  ].includes(role);

  const isStaff = role && role !== "REGULAR_CUSTOMER";
  const isGuest = !session;

  const MIN_ADVANCE = 500;
  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      advanceAmount: 500,
    }));
  }, []);

  useEffect(() => {
    if (!canUseCOD && formData.paymentType === "cod") {
      setFormData((prev) => ({
        ...prev,
        paymentType: "advance",
      }));
    }
  }, [canUseCOD, formData.paymentType]);

  // Auto-apply Special Customer Discount if user is SPECIAL_CUSTOMER
  useEffect(() => {
    const fetchSpecialCustomerDiscount = async () => {
      if (session?.user?.role === "SPECIAL_CUSTOMER") {
        try {
          const res = await fetch("/api/coupons/special");
          const data = await res.json();
          if (res.ok && data.valid && data.discount) {
            const disc = data.discount;
            let calculatedDiscount = 0;
            if (currentPrice > 0) {
              if (disc.type === "fixed") {
                calculatedDiscount = disc.discount;
              } else if (disc.type === "percentage") {
                calculatedDiscount = Math.round((currentPrice * disc.discount) / 100);
              }
            } else {
              calculatedDiscount = disc.discount;
            }

            setCouponData({
              code: "SPECIAL_CUSTOMER_DISCOUNT",
              discount: disc.discount,
              type: disc.type,
              description: "Special Customer Discount (Auto-Applied)",
              discountAmount: calculatedDiscount,
              isSpecialCustomer: true,
            });
          } else {
            setCouponData(null);
          }
        } catch (err) {
          console.error("Error fetching special customer discount:", err);
          setCouponData(null);
        }
      }
    };

    fetchSpecialCustomerDiscount();
  }, [session?.user?.role, currentPrice]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handlePaymentChange = (e) => {
    const selectedType = e.target.value;
    setFormData((prev) => ({
      ...prev,
      paymentType: selectedType,
      advanceAmount: selectedType === "advance" ? (prev.advanceAmount && prev.advanceAmount >= 500 ? prev.advanceAmount : 500) : prev.advanceAmount,
    }));
    if (errors.paymentType) setErrors((prev) => ({ ...prev, paymentType: "" }));
  };

  const handleApplyCoupon = async () => {
    if (!formData.couponCode) {
      toast.error("Please enter a coupon code");
      return;
    }

    if (!formData.arenaName) {
      toast.error("Please select an arena first");
      return;
    }

    setVerifyingCoupon(true);

    try {
      const response = await fetch(
        `/api/coupons?code=${formData.couponCode}&amount=${currentPrice}`,
      );
      const data = await response.json();

      if (response.ok && data.valid) {
        setCouponData(data.coupon);
        toast.success(
          `Coupon applied! You saved ৳${data.coupon.discountAmount}`,
        );
      } else {
        toast.error(data.message || "Invalid coupon");
        setCouponData(null);
      }
    } catch (error) {
      toast.error("Failed to verify coupon");
      setCouponData(null);
    } finally {
      setVerifyingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setCouponData(null);
    setFormData((prev) => ({ ...prev, couponCode: "" }));
    toast.success("Coupon removed");
  };

  const fetchSlots = async () => {
    if (!formData.arenaName || !formData.bookingDate) {
      setSlots([]);
      return;
    }

    try {
      const res = await fetch(
        `/api/bookings/slots?arena=${encodeURIComponent(formData.arenaName)}&date=${formData.bookingDate}`
      );
      const data = await res.json();

      if (res.ok) {
        console.log("Fetched slots:", data.slots);
        setSlots(data.slots || []);



      }
    } catch (err) {
      console.error("Error fetching slots:", err);
      setSlots([]);
    }
  };
  useEffect(() => {
    fetchSlots();
  }, [formData.arenaName, formData.bookingDate]);


  const validateForm = () => {
    const newErrors = {};

    if (!formData.arenaName) newErrors.arenaName = "Please select an arena";
    if (!formData.bookingDate) newErrors.bookingDate = "Please select a date";
    else {
      const dhakaTodayStr = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Dhaka" });
      if (formData.bookingDate < dhakaTodayStr)
        newErrors.bookingDate = "Cannot book for past dates";
    }
    if (!formData.timeSlot) newErrors.timeSlot = "Please select a time slot";
    if (!formData.paymentType)
      newErrors.paymentType = "Please select a payment option";

    if (isStaff || isGuest) {
      if (!formData.bookingForName)
        newErrors.bookingForName = "Customer name is required";
      if (!formData.bookingForPhone)
        newErrors.bookingForPhone = "Customer phone is required";
    }

    if (
      formData.paymentType === "advance" &&
      formData.advanceAmount < MIN_ADVANCE
    ) {
      newErrors.advanceAmount = `Advance amount must be at least ${MIN_ADVANCE} TK`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");

    if (!validateForm()) return;

    // Build dynamic modal content based on payment type
    const isBkashAdvance = formData.paymentType === "advance";
    const isCOD = formData.paymentType === "cod" || !formData.paymentType;
    const paymentLabel = isBkashAdvance ? "Pay Advance with bKash" : "Cash on Booking (ক্যাশ বুকিং)";
    const displayAmount = isBkashAdvance
      ? formData.advanceAmount
      : (canEnterCashAmount && formData.cashAmount ? Number(formData.cashAmount) : finalPrice);
    const amountLabel = isBkashAdvance ? "Advance Payment (bKash):" : (canEnterCashAmount ? "Cash Amount Received:" : "Total Payable at Venue:");
    const remainingDue = isBkashAdvance ? Math.max(0, finalPrice - formData.advanceAmount) : 0;

    // SweetAlert Confirmation
    const result = await Swal.fire({
      title: "Confirm Your Booking",
      html: `
        <div style="text-align: left; padding: 10px;">
          <p class="sweet-alert-content"><strong>Arena:</strong> ${formData.arenaName}</p>
          <p class="sweet-alert-content"><strong>Date:</strong> ${new Date(formData.bookingDate).toLocaleDateString()} (${new Date(formData.bookingDate).toLocaleDateString('en-US', { weekday: 'long' })})</p>
          <p class="sweet-alert-content"><strong>Time Slot:</strong> ${formData.timeSlot}</p>
          <p class="sweet-alert-content"><strong>Payment:</strong> ${paymentLabel}</p>
          <p class="sweet-alert-content" style="margin-top: 10px; border-top: 1px solid #eee; padding-top: 10px;">
            <strong>${amountLabel}</strong>
            <span style="color: #28a745; font-size: 1.2rem; font-weight: bold;">
              ৳${displayAmount.toLocaleString()}
            </span>
          </p>
          ${isBkashAdvance && remainingDue > 0 ? `
          <p class="sweet-alert-content" style="font-size: 13px; color: #e65c00; margin-top: 6px;">
            ⚠️ Remaining due at venue: <strong>৳${remainingDue.toLocaleString()}</strong>
          </p>` : ""}
          ${isBkashAdvance ? `
          <p class="sweet-alert-content" style="font-size: 13px; color: #555; margin-top: 6px;">
            You will be redirected to bKash to complete the payment.
          </p>` : ""}
        </div>
      `,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: isBkashAdvance ? "Proceed to bKash →" : "Yes, Confirm Booking",
      cancelButtonText: "Cancel",
      confirmButtonColor: isBkashAdvance ? "#e2136e" : "#007bff",
      cancelButtonColor: "#6c757d",
    });

    if (!result.isConfirmed) return;

    setLoading(true);

    try {
      const bookingData = {
        arenaName: formData.arenaName,
        bookingDate: formData.bookingDate,
        timeSlot: formData.timeSlot,
        notes: formData.notes,
        paymentType: formData.paymentType || "cod",

        cashAmount: Number(formData.cashAmount || 0),

        paidAmount:
          formData.paymentType === "cod"
            ? Number(formData.cashAmount || 0)
            : formData.advanceAmount,

        totalAmount:
          formData.paymentType === "advance"
            ? formData.advanceAmount
            : formData.paymentType === "cod"
              ? Number(formData.cashAmount || 0)
              : finalPrice,

        finalPrice: finalPrice,
        originalAmount: currentPrice,
        couponCode: couponData?.code || null,
        discountAmount: discountAmount,
        bookingByRole: session?.user?.role || "GUEST",
        ...((isStaff || isGuest) && {
          bookingForName: formData.bookingForName,
          bookingForPhone: formData.bookingForPhone,
          transactionId: formData.transactionId,
        }),
        ...(!isStaff && !isGuest && {
          bookingForName: session?.user?.name,
          bookingForPhone: session?.user?.phone,
        })
      };

      // Cash on Booking (COD) flow
      if (formData.paymentType === "cod" || !formData.paymentType) {
        try {
          const response = await fetch("/api/bookings", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },

            body: JSON.stringify({
              ...bookingData,
              paymentType: "cod",
              paymentMethod: "COD",
            }),
          });

          const data = await response.json();

          if (!response.ok) {
            toast.error(data.error || "Booking failed");
            return;
          }

          Swal.fire({
            icon: "success",
            title: "Booking Confirmed!",
            text: "Your booking has been successfully placed.",
            timer: 2000,
            showConfirmButton: false
          });

          const redirectPath = isGuest ? "/?status=success" : "/dashboard";
          setTimeout(() => router.push(redirectPath), 2000);
          return;
        } catch (err) {
          console.error("COD ERROR:", err);
          toast.error("COD booking failed");
          return;
        }
      }

      // bKash Advance payment flow
      if (formData.paymentType === "advance") {
        const response = await fetch("/api/bkash/create-payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: formData.advanceAmount,
            bookingData: bookingData,
          }),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "bKash initialization failed");

        if (data.bkashURL) {
          window.location.href = data.bkashURL;
          return;
        }
      }
    } catch (error) {
      console.error("Booking error:", error);
      toast.error(
        error.message || "Failed to create booking. Please try again.",
        { duration: 3000 },
      );
    } finally {
      setLoading(false);
    }
  };

  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };

  const isSubmitDisabled =
    loading ||
    !formData.arenaName ||
    !formData.bookingDate ||
    !formData.timeSlot ||
    !formData.paymentType ||
    ((isStaff || isGuest) && (!formData.bookingForName || !formData.bookingForPhone));

  const getButtonTooltip = () => {
    if (loading) return "Processing...";
    if (!formData.arenaName) return "Please select an arena";
    if (!formData.bookingDate) return "Please select a date";
    if (!formData.timeSlot) return "Please select a time slot";
    if (!formData.paymentType) return "Please select a payment option";
    if (isStaff || isGuest) {
      if (!formData.bookingForName || !formData.bookingForPhone)
        return "Enter customer name & phone";
    }
    return "Confirm your booking";
  };

  return (
    <section className="booking">
      <div className="container">
        <div className="booking__content">

          <div className="booking__info-wrap">
            <DashboardProfileInfo />

            <form className="booking__form-wrap" onSubmit={handleSubmit}>
              <h2 className="booking__form-heading">Booking (বুকিং)</h2>
              <p className="booking__form-notice-text">⚠️Note: রাত ১২:০০ AM - এর পর তারিখ পরিবর্তন হয়। রাত ১২টার পরের Slot-এর জন্য অবশ্যই পরবর্তী তারিখ নির্বাচন করুন।</p>
              <div className="booking__form-input-wrap">
                <label className="booking__form-label" htmlFor="bookingDate">
                  Date: (তারিখ)
                </label>
                <input
                  className="booking__form-input"
                  type="date"
                  name="bookingDate"
                  id="bookingDate"
                  min={getMinDate()}
                  value={formData.bookingDate}
                  onChange={handleChange}
                />
                {errors.bookingDate && (
                  <span className="error-message">{errors.bookingDate}</span>
                )}
              </div>


              <div className="booking__form-input-wrap">
                <label className="booking__form-label" htmlFor="timeSlot">
                  Time: (সময়)
                </label>
                <select
                  className="booking__select"
                  name="timeSlot"
                  id="timeSlot"
                  value={formData.timeSlot}
                  onChange={(e) => {

                    const selectedSlot = slots.find(s => s.slot === e.target.value);
                    if (selectedSlot && selectedSlot.status !== "available") {
                      toast.error("This slot is not available");
                      return;
                    }
                    handleChange(e);
                  }}
                  disabled={!formData.bookingDate}
                >
                  <option value="">
                    {!formData.bookingDate
                      ? "Select date first"
                      : "Select Time Slot"}
                  </option>

                  {slots.map(({ slot, status }) => {
                    const slotPrice = calculateSlotPrice(arenaPricing, formData.bookingDate, slot);
                    return (
                      <option
                        key={slot}
                        value={slot}
                        disabled={status !== "available"}
                        style={{
                          color: status === "available" ? "#000" : "#999",
                          backgroundColor: status === "booked" ? "#ffe6e6" : "transparent",
                        }}
                      >
                        {slot} {status === "available" ? `(৳${slotPrice.toLocaleString()})` : ""}
                        {status === "booked" && " — BOOKED"}
                        {status === "past" && " — Time Passed"}
                      </option>
                    );
                  })}
                </select>
                {errors.timeSlot && (
                  <span className="error-message">{errors.timeSlot}</span>
                )}
              </div>

              {(isStaff || isGuest) && (
                <>
                  <div className="booking__form-input-wrap">
                    <label className="booking__form-label">
                      Customer Name: (কাস্টমার নাম) <span className="booking__form-label-requierd">*</span>
                    </label>
                    <input
                      type="text"
                      name="bookingForName"
                      className="booking__form-input"
                      value={formData.bookingForName}
                      onChange={handleChange}
                      required
                    />
                    {errors.bookingForName && (
                      <span className="error-message">
                        {errors.bookingForName}
                      </span>
                    )}
                  </div>
                  <div className="booking__form-input-wrap">
                    <label className="booking__form-label">
                      Customer Phone Number: (কাস্টমার ফোন নাম্বার) <span className="booking__form-label-requierd">*</span>
                    </label>
                    <input
                      type="text"
                      name="bookingForPhone"
                      className="booking__form-input"
                      value={formData.bookingForPhone}
                      onChange={handleChange}
                      required
                    />
                    {errors.bookingForPhone && (
                      <span className="error-message">
                        {errors.bookingForPhone}
                      </span>
                    )}
                  </div>

                  {/* {canUseCOD && formData.paymentType === "cod" && (
                    <div className="booking__form-input-wrap">
                      <label className="booking__form-label">
                        Enter Cash Amount:
                      </label>
                      <input
                        type="number"
                        name="cashAmount"
                        className="booking__form-input"
                        value={formData.cashAmount}
                        onChange={handleChange}
                        placeholder="Enter cash amount"
                      />
                    </div>
                  )} */}

                  {formData.paymentType === "cod" && canEnterCashAmount && (
                    <div className="booking__form-input-wrap">
                      <label className="booking__form-label">
                        Enter Cash Amount: (ক্যাশ এমাউন্ট দিন)
                      </label>

                      <input
                        type="number"
                        name="cashAmount"
                        className="booking__form-input"
                        value={formData.cashAmount || ""}
                        onChange={handleChange}
                        placeholder="Enter cash amount"
                      />
                    </div>
                  )}

                </>
              )}


              {/* No manual transaction ID or instructions as per user request */}


              {/* Advance Amount for bKash */}
              {formData.paymentType === "advance" && (
                <div className="booking__form-input-wrap">
                  <label className="booking__form-label">
                    Advance Amount (min {MIN_ADVANCE} TK):
                  </label>
                  <input
                    type="number"
                    min={MIN_ADVANCE}
                    className="booking__form-input"
                    value={formData.advanceAmount}
                    onChange={(e) => {
                      const value = Number(e.target.value);
                      setFormData((prev) => ({ ...prev, advanceAmount: value }));
                      if (formData.paymentType === "advance" && value < MIN_ADVANCE) {
                        setErrors((prev) => ({
                          ...prev,
                          advanceAmount: `Advance amount must be at least ${MIN_ADVANCE} TK`,
                        }));
                      } else {
                        setErrors((prev) => ({ ...prev, advanceAmount: "" }));
                      }
                    }}
                  />
                  {errors.advanceAmount && (
                    <span className="error-message">{errors.advanceAmount}</span>
                  )}
                </div>
              )}

              {/* Coupon Code / Special Customer Discount */}
              {session?.user?.role === "SPECIAL_CUSTOMER" ? (
                couponData && couponData.isSpecialCustomer && couponData.discountAmount > 0 ? (
                  <div className="booking__form-input-wrap">
                    <div
                      style={{
                        padding: "14px 18px",
                        background: "#f0fdf4",
                        border: "1.5px solid #86efac",
                        borderRadius: "8px",
                        color: "#15803d",
                      }}
                    >
                      <div style={{ fontWeight: "700", fontSize: "15px", display: "flex", alignItems: "center", gap: "6px" }}>
                        ⭐ Special Customer Discount Auto-Applied
                      </div>
                      <div style={{ marginTop: "4px", fontSize: "14px", color: "#166534" }}>
                        You automatically get <strong>৳{couponData.discountAmount} OFF</strong> on this booking!
                      </div>
                    </div>
                  </div>
                ) : null
              ) : (
                <div className="booking__form-input-wrap">
                  <label className="booking__form-label" htmlFor="couponCode">
                    Coupon Code (কুপন কোড) (Optional):
                  </label>
                  <div
                    style={{
                      display: "flex",
                      gap: "10px",
                      alignItems: "flex-start",
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <input
                        type="text"
                        name="couponCode"
                        id="couponCode"
                        value={formData.couponCode}
                        onChange={handleChange}
                        className="booking__form-input"
                        placeholder="Enter coupon code"
                        disabled={!!couponData}
                        style={{ textTransform: "uppercase" }}
                      />
                    </div>
                    {!couponData ? (
                      <button
                        type="button"
                        onClick={handleApplyCoupon}
                        disabled={verifyingCoupon || !formData.couponCode}
                        className="secondary-button"
                        style={{ padding: "12px 20px", whiteSpace: "nowrap" }}
                      >
                        {verifyingCoupon ? "Verifying..." : "Apply"}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleRemoveCoupon}
                        className="secondary-button"
                        style={{
                          padding: "12px 20px",
                          whiteSpace: "nowrap",
                          background: "#ff4444",
                        }}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  {couponData && (
                    <div
                      style={{
                        marginTop: "10px",
                        padding: "12px",
                        background: "#d4edda",
                        border: "1px solid #c3e6cb",
                        borderRadius: "6px",
                        color: "#155724",
                      }}
                    >
                      <strong>✓ Coupon Applied:</strong> {couponData.description}
                      <br />
                      <strong>Discount: ৳{couponData.discountAmount}</strong>
                    </div>
                  )}
                </div>
              )}

              {/* Notes */}
              <div className="booking__form-input-wrap">
                <label className="booking__form-label" htmlFor="notes">
                  Notes (নোট) (Optional):
                </label>
                <textarea
                  className="booking__form-input"
                  rows="3"
                  name="notes"
                  id="notes"
                  placeholder="Specify number of players or any specific requirements"
                  value={formData.notes}
                  onChange={handleChange}
                />
              </div>

              {/* Payment Options */}
              <div className="booking__payment-wrap">
                <h2 className="booking__payment-heading">Payment (পেমেন্ট)</h2>
                <div className="booking__payment-amount-wrap">
                  {couponData && (
                    <>
                      <p
                        className="booking__payment-amount"
                        style={{
                          textDecoration: "line-through",
                          color: "#999",
                          fontSize: "16px",
                        }}
                      >
                        BDT {currentPrice.toLocaleString()}
                      </p>
                      <p
                        className="booking__payment-amount"
                        style={{ color: "#28a745", marginTop: "5px" }}
                      >
                        BDT {finalPrice.toLocaleString()}
                        <span
                          style={{
                            fontSize: "14px",
                            marginLeft: "10px",
                            color: "#666",
                          }}
                        >
                          (Saved ৳{discountAmount})
                        </span>
                      </p>
                    </>
                  )}
                  {!couponData && (
                    <p className="booking__payment-amount">
                      BDT {currentPrice.toLocaleString()}
                    </p>
                  )}
                </div>
                <div className="booking__payment-option-wrap">
                  {/* Pay Advance with bKash */}
                  <div className="booking__payment-option">
                    <div>
                      <input
                        className="booking__payment-input"
                        id="advancepay"
                        name="payment"
                        type="radio"
                        value="advance"
                        checked={formData.paymentType === "advance"}
                        onChange={handlePaymentChange}
                      />
                      <label
                        className="booking__payment-label"
                        htmlFor="advancepay"
                      >
                        Pay Advance with bKash (Minimum: {MIN_ADVANCE} TK)
                      </label>
                    </div>
                    <div className="booking__payment-option-logo-wrap">
                      <Image
                        className="booking__payment-option-logo"
                        src={bkashLogo}
                        alt="bkash Logo"
                      />
                    </div>
                  </div>

                  {/* Cash on Booking Option (Only for Staff/Admin) */}
                  {canUseCOD && (
                    <div className="booking__payment-option">
                      <div>
                        <input
                          className="booking__payment-input"
                          id="codpay"
                          name="payment"
                          type="radio"
                          value="cod"
                          checked={formData.paymentType === "cod"}
                          onChange={handlePaymentChange}
                        />

                        <label
                          className="booking__payment-label"
                          htmlFor="codpay"
                        >
                          Cash on Booking (ক্যাশ বুকিং)
                        </label>
                      </div>
                    </div>
                  )}

                  {errors.paymentType && (
                    <span className="error-message">{errors.paymentType}</span>
                  )}

                  <p className="booking__payment-agree-text">
                    By making this booking you agree to our terms and
                    conditions.
                  </p>

                  <div className="booking__payment-button-wrap">
                    <button
                      type="submit"
                      className="tertiary-button booking__payment-button"
                      disabled={isSubmitDisabled}
                      title={getButtonTooltip()}
                    >
                      {loading ? "PROCESSING..." : "CONFIRM BOOKING"}
                    </button>
                  </div>

                  <p className="booking__payment-agree-text">
                    I agree that confirming the booking places me under an
                    obligation to make a payment in accordance with the General
                    Terms and Conditions.
                  </p>

                  {submitError && (
                    <div
                      className="error-message"
                      style={{ marginBottom: "1rem" }}
                    >
                      {submitError}
                    </div>
                  )}
                </div>
              </div>
            </form>
          </div>

          {/* Booking Summary */}
          <div className="booking__summary-wrap">
            <div className="booking__summary-sticky">
              <h3 className="booking__summary-heading">Booking Summary</h3>
              <div className="booking__summary-info-wrap">
                <h4 className="booking__summary-user-name">
                  {session?.user?.name || formData.bookingForName || "Guest User"}
                </h4>
                <p className="booking__summary-user-contact">
                  {session?.user?.phone || formData.bookingForPhone || "No contact info"}
                </p>
              </div>
              <div className="booking__summary-slot-info">
                <p className="booking__summary-arena">
                  {formData.arenaName || "Arena Name"}
                </p>
                <p className="booking__summary-slot">
                  {formData.bookingDate
                    ? new Date(formData.bookingDate).toDateString()
                    : "Date"}{" "}
                  {formData.timeSlot}
                </p>
                <p className="booking__summary-duration">
                  Duration: {getDurationMins(formData.timeSlot)} mins
                </p>
                {couponData && (
                  <div
                    style={{
                      marginTop: "10px",
                      padding: "8px",
                      background: "#d4edda",
                      borderRadius: "4px",
                      fontSize: "13px",
                      color: "#155724",
                    }}
                  >
                    <strong>Coupon: {couponData.code}</strong>
                    <br />
                    Discount: ৳{discountAmount}
                  </div>
                )}
              </div>
              <div className="booking__summary-amount-wrap">
                <p className="booking__summary-amount-text">Payable</p>
                {couponData && (
                  <p
                    style={{
                      textDecoration: "line-through",
                      color: "#999",
                      fontSize: "14px",
                    }}
                  >
                    BDT {currentPrice.toLocaleString()}
                  </p>
                )}
                {/* <p className="booking__summary-amount">
                  BDT{" "}
                  {formData.paymentType === "advance"
                    ? formData.advanceAmount.toLocaleString()
                    : formData.paymentType === "cod"
                    ? "0"
                    : finalPrice.toLocaleString()}
                </p> */}
                <p className="booking__summary-amount">
                  BDT{" "}
                  {canEnterCashAmount && formData.cashAmount
                    ? Number(formData.cashAmount).toLocaleString()
                    : finalPrice.toLocaleString()}
                </p>
              </div>
              <div className="booking__summary-help-wrap">
                <p className="booking__summary-help-title">Need help?</p>
                <p className="booking__summary-help-text">
                  Contact our team of experts for further assistance.
                </p>
                <p className="booking__summary-phone-text">
                  Phone:
                  <Link href="tel:01616753671">
                    <span className="booking__summary-phone">
                      {" "}
                      +8801616753671
                    </span>
                  </Link>
                </p>
                <p className="booking__summary-phone-text">
                  Email:
                  <Link href="mailto:royelturf@gmail.com" target="_blank">
                    <span className="booking__summary-email">
                      {" "}
                      royelturf@gmail.com
                    </span>
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const Booking = () => (
  <Suspense fallback={null}>
    <BookingContent />
  </Suspense>
);

export default Booking;
