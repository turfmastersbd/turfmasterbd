"use client";
import toast from "react-hot-toast";
import Swal from "sweetalert2";

const STATUS_ORDER = ["confirmed", "completed", "cancelled"];

const getStatusStyles = (status) => {
  switch (status) {
    case "confirmed":
      return {
        backgroundColor: "#ffc107",
        color: "#000",
        border: "1px solid #e0a800"
      };
    case "completed":
      return {
        backgroundColor: "#28a745",
        color: "#fff",
        border: "1px solid #1e7e34"
      };
    case "cancelled":
      return {
        backgroundColor: "#dc3545",
        color: "#fff",
        border: "1px solid #bd2130"
      };
    default:
      return {
        backgroundColor: "#f9f9f9",
        color: "#000",
        border: "1px solid #ccc"
      };
  }
};

export default function BookingActions({ booking, role, refetch }) {

  const canUpdateStatus = ["MANAGER", "GENERAL_ADMIN", "SUPER_ADMIN"].includes(role);
  if (!canUpdateStatus) return null;

  const currentIndex = STATUS_ORDER.indexOf(booking.status);

  const executeStatusUpdate = async (newStatus, note = undefined) => {
    if (newStatus === booking.status) return;

    try {
      const response = await fetch(`/api/bookings/${booking._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          status: newStatus,
          cancelNote: note 
        }),
      });

      if (response.ok) {
        toast.success(`Booking status updated to ${newStatus}`);
        refetch();
      } else {
        toast.error("Failed to update status");
      }
    } catch (error) {
      toast.error("An error occurred while updating status");
    }
  };

  const handleStatusChange = (e) => {
    const newStatus = e.target.value;
    if (newStatus === booking.status) return;

    if (newStatus === "confirmed") {
      Swal.fire({
        title: "Confirm Action",
        text: "Are you sure you want to mark this booking as confirmed?",
        icon: "question",
        showCancelButton: true,
        confirmButtonColor: "#007bff",
        cancelButtonColor: "#6c757d",
        confirmButtonText: "Yes, Confirm",
      }).then((result) => {
        if (result.isConfirmed) {
          executeStatusUpdate(newStatus);
        }
      });
    } else if (newStatus === "completed") {
      Swal.fire({
        title: "Confirm Action",
        text: "Are you sure you want to mark this booking as completed?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#28a745",
        cancelButtonColor: "#6c757d",
        confirmButtonText: "Yes, Complete",
      }).then((result) => {
        if (result.isConfirmed) {
          executeStatusUpdate(newStatus);
        }
      });
    } else if (newStatus === "cancelled") {
      Swal.fire({
        title: "Confirm Cancellation",
        input: "textarea",
        inputLabel: "Cancel Note (Required)",
        inputPlaceholder: "Enter reason for cancellation...",
        inputValidator: (value) => {
          if (!value || !value.trim()) {
            return "Cancel note is required!";
          }
        },
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#6c757d",
        confirmButtonText: "Yes, Cancel Booking",
      }).then((result) => {
        if (result.isConfirmed) {
          executeStatusUpdate(newStatus, result.value);
        }
      });
    }
  };

  return (
    <>
      <select
        value={booking.status}
        onChange={handleStatusChange}
        style={{
          padding: "4px 8px",
          borderRadius: "4px",
          fontSize: "12px",
          fontWeight: "bold",
          cursor: "pointer",
          outline: "none",
          ...getStatusStyles(booking.status)
        }}
      >
        {STATUS_ORDER.map((status, index) => (
          <option
            key={status}
            value={status}
            disabled={index < currentIndex || (status === "cancelled" && booking.status === "completed")}
            style={{ backgroundColor: "#fff", color: "#000", fontWeight: "normal" }}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </option>
        ))}
      </select>
    </>
  );
}
