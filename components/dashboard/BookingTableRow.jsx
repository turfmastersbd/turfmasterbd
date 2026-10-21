"use client";
import BookingActions from "./BookingActions";
import toast from "react-hot-toast";

import { useState, useEffect } from "react";

export default function BookingTableRow({ booking, role, refetch }) {
  const isCustomer = role === "REGULAR_CUSTOMER" || role === "SPECIAL_CUSTOMER";
  const [currentStatus, setCurrentStatus] = useState(booking.customerStatus || "selected status");

  useEffect(() => {
    setCurrentStatus(booking.customerStatus || "selected status");
  }, [booking.customerStatus]);

  const handleCustomerStatusChange = async (newStatus) => {
    const oldStatus = currentStatus;
    setCurrentStatus(newStatus); // Optimistic update

    try {
      const response = await fetch(`/api/bookings/${booking._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerStatus: newStatus }),
      });

      if (response.ok) {
        toast.success(`Customer status updated to ${newStatus}`);
        refetch();
      } else {
        toast.error("Failed to update customer status");
        setCurrentStatus(oldStatus); // Rollback
      }
    } catch (error) {
      toast.error("An error occurred");
      setCurrentStatus(oldStatus); // Rollback
    }
  };

  return (
    <tr>
      <td>{new Date(booking.bookingDate).toLocaleDateString()} ({new Date(booking.bookingDate).toLocaleDateString('en-US', { weekday: 'short' })})</td>
      <td>{booking.timeSlot}</td>
      <td>{booking.bookingForName}</td>
      <td>{booking.bookingForPhone}</td>
      <td>{booking.arenaName}</td>
      <td>৳{booking.originalAmount}</td>
      {/* <td>৳{booking.paidAmount}</td> */}
      <td>
        ৳
        {booking.paymentType === "cod"
          ? booking.cashAmount || booking.paidAmount || 0
          : booking.paidAmount || 0}
      </td>
      <td style={{ minWidth: '80px', textAlign: 'center' }}>
        {booking.couponCode && booking.discountAmount ? (
          <span style={{ color: '#28a745', fontSize: '12px', fontWeight: '600' }}>
            {booking.couponCode}<br />
            <span style={{ color: '#dc3545', fontWeight: 'bold' }}>-৳{booking.discountAmount}</span>
          </span>
        ) : (
          <span style={{ color: '#999', fontSize: '14px' }}>—</span>
        )}
      </td>
      <td style={{ minWidth: '90px' }}>
        {booking.originalAmount && booking.discountAmount > 0 ? (
          <div>
            <div style={{ textDecoration: 'line-through', color: '#999', fontSize: '11px' }}>
              ৳{booking.originalAmount}
            </div>
            <strong style={{ color: '#28a745', fontSize: '14px' }}>৳{booking.totalAmount || 0}</strong>
          </div>
        ) : (
          <strong style={{ fontSize: '14px' }}>৳{booking.totalAmount || 0}</strong>
        )}
      </td>
      <td>{booking.transactionId || "—"}</td>
      <td style={{ 
        fontSize: '11px', 
        fontStyle: 'italic', 
        color: '#555',
        maxWidth: '200px',
        whiteSpace: 'normal',
        wordBreak: 'break-word',
        lineHeight: '1.2'
      }}>
        {booking.notes || "—"}
      </td>
      {!isCustomer && (
        <td style={{ 
          fontSize: '11px', 
          fontStyle: 'italic', 
          color: '#dc3545', 
          fontWeight: 'bold',
          maxWidth: '250px',
          whiteSpace: 'normal',
          wordBreak: 'break-word',
          lineHeight: '1.2'
        }}>
          {booking.cancelNote || "—"}
        </td>
      )}
      {!isCustomer && (
        <td>
          <select
            value={currentStatus}
            onChange={(e) => handleCustomerStatusChange(e.target.value)}
            style={{
              padding: "4px 8px",
              borderRadius: "4px",
              border: "1px solid #ccc",
              fontSize: "12px",
              cursor: "pointer",
              backgroundColor: 
                currentStatus === 'Call Received' ? '#358538' : 
                currentStatus === 'Call Not Received' ? '#d32f2f' : 
                currentStatus === 'Phone Off' ? '#757575' : '#f9f9f9',
              color: currentStatus === 'selected status' ? '#000' : '#fff',
              fontWeight: 'bold',
              outline: "none"
            }}
          >
            <option value="selected status" style={{ backgroundColor: '#fff', color: '#000' }}>Selected Status</option>
            <option value="Call Received" style={{ backgroundColor: '#fff', color: '#000' }}>Call Received</option>
            <option value="Call Not Received" style={{ backgroundColor: '#fff', color: '#000' }}>Call Not Received</option>
            <option value="Phone Off" style={{ backgroundColor: '#fff', color: '#000' }}>Phone Off</option>
          </select>
        </td>
      )}
      <td>
        <span
          style={{
            padding: "4px 8px",
            borderRadius: "4px",
            fontSize: "12px",
            fontWeight: "bold",
            textTransform: "capitalize",
            display: "inline-block",
            backgroundColor:
              booking.status === "confirmed"
                ? "#ffc107"
                : booking.status === "completed"
                ? "#28a745"
                : booking.status === "cancelled"
                ? "#dc3545"
                : "#e2e3e5",
            color:
              booking.status === "confirmed"
                ? "#000"
                : booking.status === "completed" || booking.status === "cancelled"
                ? "#fff"
                : "#000",
          }}
        >
          {booking.status}
        </span>
      </td>
      {!isCustomer && (
        <td>
          <BookingActions booking={booking} role={role} refetch={refetch} />
        </td>
      )}
    </tr>
  );
}
