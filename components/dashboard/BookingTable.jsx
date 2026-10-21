"use client";
import { useSession } from "next-auth/react";
import BookingTableRow from "./BookingTableRow";
import Loading from "../shared/Loading";
import EmptyState from "../shared/Empty";


export default function BookingTable({ filteredBookings, refetch }) {
  const { data: session } = useSession();
  const role = session.user.role;
  const isCustomer = role === "REGULAR_CUSTOMER" || role === "SPECIAL_CUSTOMER";

  const sortedBookings = [...filteredBookings].sort(
   (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );

  console.log("SESSION ROLE:", role);

  if (!filteredBookings) return <Loading />;
  if (!filteredBookings.length) return <EmptyState message="No bookings found" />;

  return (
    <div className="dashboard__booking">
      <p className="dashboard__booking-title">Booking</p>
      <div className="dashboard__booking-scroll">
        <table className="dashboard__booking-list transactions-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Slot</th>
              <th>Name</th>
              <th>Phone</th>
              <th>Arena</th>
              <th>Slot Price</th>
              <th>Advance</th>
              <th>Discount</th>
              <th>Total</th>
              <th>Transaction ID</th>
              <th>Booking Note</th>
              {!isCustomer && <th>Cancel Note</th>}
              {!isCustomer && <th>Customer Status</th>}
              <th>Status</th>
              {!isCustomer && <th>Action</th>}
            </tr>
          </thead>
          <tbody>
            {sortedBookings.map((booking) => (
              <BookingTableRow
                key={booking._id}
                booking={booking}
                role={role}
                refetch={refetch}
              />
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}
