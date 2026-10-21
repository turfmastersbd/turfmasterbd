"use client";
import { useEffect, useState } from "react";
import BookingTable from "./BookingTable";
import Loading from "../shared/Loading";
import Link from "next/link";


export default function UserBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const res = await fetch("/api/bookings?scope=self");
        const data = await res.json();
        setBookings(data);
      } catch (err) {
        console.error("User bookings error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, []);

  if (loading) return <Loading />;
  if (!bookings.length) return (
    <>
      <div className="dashboard__booking">
        <p className="dashboard__booking-title">Booking</p>
        <p className="dashboard__booking-label">You have no bookings currently</p>
        <p className="dashboard__booking-button-wrap">Want to booking now?
          <Link href="/booking">
            <span className="secondary-button">Booking</span>
          </Link>
        </p>
      </div>
    </>
  );

  return <BookingTable filteredBookings={bookings} refetch={() => { }} />;
}
