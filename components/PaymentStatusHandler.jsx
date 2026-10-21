"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function PaymentStatusHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const status = searchParams.get("status");
    const message = searchParams.get("message");

    if (status === "success") {
      toast.success("Payment successful! Your booking is confirmed.", {
        duration: 5000,
        position: "top-center",
      });
      // Remove the status from URL to prevent toast showing again on refresh
      const newPath = window.location.pathname;
      router.replace(newPath);
    } else if (status === "failed") {
      toast.error(message || "Payment failed or cancelled.", {
        duration: 5000,
        position: "top-center",
      });
      const newPath = window.location.pathname;
      router.replace(newPath);
    } else if (status === "error") {
      toast.error("An error occurred during payment processing.", {
        duration: 5000,
        position: "top-center",
      });
      const newPath = window.location.pathname;
      router.replace(newPath);
    }
  }, [searchParams, router]);

  return null;
}
