"use client";
import { useEffect, useState } from "react";
import BookingTable from "./BookingTable";
import Loading from "../shared/Loading";

export default function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedArena, setSelectedArena] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [phoneSearch, setPhoneSearch] = useState("");

  const clearFilters = () => {
    setSelectedDate("");
    setSelectedArena("");
    setSelectedStatus("");
    setPhoneSearch("");
  };

  const fetchBookings = async () => {
    try {
      const res = await fetch("/api/bookings?t=" + Date.now());

      if (!res.ok) throw new Error("Failed to fetch bookings");

      const data = await res.json();

      const sorted = data.sort(
        (a, b) => new Date(b.bookingDate) - new Date(a.bookingDate)
      );

      setBookings(sorted);
      setFilteredBookings(sorted);
    } catch (err) {
      console.error("Admin bookings error:", err);
      setBookings([]);
      setFilteredBookings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  useEffect(() => {
    let filtered = bookings;

    // phone search filter
    if (phoneSearch.trim()) {
      const searchRaw = phoneSearch.trim().toLowerCase();
      const searchClean = searchRaw.replace(/\s+/g, "");
      filtered = filtered.filter((booking) => {
        const phone = (
          booking.bookingForPhone ||
          booking.user?.phone ||
          booking.phone ||
          ""
        ).toString().toLowerCase();
        const cleanPhone = phone.replace(/\s+/g, "");
        return phone.includes(searchRaw) || cleanPhone.includes(searchClean);
      });
    }

    // date filter
    if (selectedDate) {
      filtered = filtered.filter((booking) => {
        const bd = new Date(booking.bookingDate)
          .toISOString()
          .split("T")[0];

        return bd === selectedDate;
      });
    }

    // arena filter
    if (selectedArena) {
      filtered = filtered.filter(
        (booking) => booking.arenaName === selectedArena
      );
    }

    // status filter
    if (selectedStatus) {
      filtered = filtered.filter(
        (booking) => booking.status === selectedStatus
      );
    }

    setFilteredBookings(filtered);
  }, [selectedDate, selectedArena, selectedStatus, phoneSearch, bookings]);

  if (loading) return <Loading />;

  return (
    <>
      <div className="dashboard__filter-wrap">
        <div className="dashboard__filter">
          <label>Filter by phone:</label>
          <input
            type="text"
            placeholder="Search phone number..."
            value={phoneSearch}
            onChange={(e) => setPhoneSearch(e.target.value)}
          />
        </div>

        <div className="dashboard__filter">
          <label>Filter by date:</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>

        <div className="dashboard__filter">
          <label>Filter by status:</label>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="">All Status</option>
            <option value="confirmed">Confirm</option>
            <option value="completed">Complete</option>
            <option value="cancelled">Cancel</option>
          </select>
        </div>

        {(selectedDate || selectedArena || selectedStatus || phoneSearch) && (
          <div className="dashboard__filter">
            <button className="tertiary-button" onClick={clearFilters}>
              Clear All Filters
            </button>
          </div>
        )}

      </div>

      <BookingTable
        filteredBookings={filteredBookings}
        refetch={fetchBookings}
      />
    </>
  );
}
