"use client";
import { useEffect, useState } from "react";
import Loading from "../shared/Loading";
import { TIME_SLOTS } from "@/lib/pricing";

export default function BookingByDate() {
  const [bookings, setBookings] = useState([]);
  const getTodayDate = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const [selectedDate, setSelectedDate] = useState(getTodayDate());
  const [selectedArena, setSelectedArena] = useState("Royel Turf & Swimming Zone");
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  // System's actual time slots from ManageSlotPrice.jsx
  const daySlots = [
    "05:00am to 06:00am",
    "06:00am to 07:00am",
    "07:00am to 08:00am",
    "09:00am to 10:00am",
    "10:00am to 11:00am",
    "11:00am to 12:00pm",
    "12:00pm to 01:00pm",
    "01:00pm to 02:00pm",
    "02:00pm to 03:00pm",
    "03:00pm to 04:00pm",
    "04:00pm to 05:00pm"
  ];
  const nightSlots = [
    "05:00pm to 06:00pm",
    "06:00pm to 07:00pm",
    "07:00pm to 08:00pm",
    "08:00pm to 09:00pm",
    "09:00pm to 10:00pm",
    "10:00pm to 11:00pm",
    "11:00pm to 12:00am",
    "12:00am to 01:00am",
    "01:00am to 02:00am",
    "02:00am to 03:00am",
    "03:00am to 04:00am",
    "04:00am to 05:00am"
  ];

  const matchesArena = (arena1, arena2) => {
    if (!arena1 || !arena2) return true;
    const norm = (str) => (str || "").toLowerCase().replace(/[^a-z0-9]/g, "");
    const n1 = norm(arena1);
    const n2 = norm(arena2);
    return n1 === n2 || n1.includes(n2) || n2.includes(n1);
  };

  const isSameDate = (date1, date2Str) => {
    if (!date1 || !date2Str) return false;
    if (typeof date1 === "string") {
      const match = date1.match(/^(\d{4}-\d{2}-\d{2})/);
      if (match && match[1] === date2Str) return true;
    }
    const dObj = new Date(date1);
    if (isNaN(dObj.getTime())) return false;
    const isoStr = dObj.toISOString().split("T")[0];
    if (isoStr === date2Str) return true;
    const localStr = `${dObj.getFullYear()}-${String(dObj.getMonth() + 1).padStart(2, "0")}-${String(dObj.getDate()).padStart(2, "0")}`;
    return localStr === date2Str;
  };
  const fetchBookings = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await fetch("/api/bookings?t=" + Date.now());
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || `Failed to fetch bookings (${res.status})`);
      }
      const data = await res.json();
      setBookings(data);
    } catch (err) {
      console.error("BookingByDate error:", err);
      setErrorMsg(err.message || "Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const filteredBookings = bookings.filter((b) => {
    if (!b.bookingDate) return false;
    if (b.status === "cancelled") return false; // Hide cancelled bookings
    return isSameDate(b.bookingDate, selectedDate) && matchesArena(b.arenaName, selectedArena);
  });

  const getBookingForSlot = (slot) => {
    // Find booking that matches the slot (case-insensitive and trimmed)
    return filteredBookings.find((b) =>
      b.timeSlot?.toLowerCase().trim() === slot.toLowerCase().trim()
    );
  };

  const dailyTotal = filteredBookings.reduce((sum, b) => {
    return sum + (Number(b.paidAmount) || 0);
  }, 0);

  const getReceiverDisplay = (b) => {
    if (!b) return "";
    const role = b.bookingByRole || b.user?.role || "REGULAR_CUSTOMER";
    if (role === "REGULAR_CUSTOMER" || role === "GUEST" || role === "USER") {
      return b.transactionId || "";
    } else if (role === "SPECIAL_CUSTOMER") {
      return b.advanceReceiverName || b.user?.name || b.bookingForName || "";
    } else if (["SUPER_ADMIN", "GENERAL_ADMIN", "MANAGER"].includes(role)) {
      return b.advanceReceiverName || b.user?.name || "";
    }
    return b.advanceReceiverName || "";
  };

  const getSlotCategory = (slot) => {
    if (!slot) return "day";
    const s = slot.toLowerCase().trim();
    // Late night slot: 10:30pm - 06:00am
    if (
      s.includes("10:30pm") ||
      s.includes("12:00am") ||
      s.includes("01:00am") ||
      s.includes("02:00am") ||
      s.includes("03:30am") ||
      s.includes("04:30am")
    ) {
      return "late";
    }
    // Night slot: 6:00pm - 10:30pm
    if (
      s.includes("06:00pm") ||
      s.includes("07:00pm") ||
      s.includes("08:30pm") ||
      s.includes("09:30pm")
    ) {
      return "night";
    }
    // Day slot: 06:00am - 06:00pm
    return "day";
  };

  const ranges = [
    { start: 1, end: 4 },
    { start: 5, end: 8 },
    { start: 9, end: 12 },
    { start: 13, end: 16 },
    { start: 17, end: 20 },
    { start: 21, end: 24 },
    { start: 25, end: 28 },
    { start: 29, end: 31 },
  ];

  const getMonthlyStats = () => {
    const selectedDateObj = new Date(selectedDate);
    const month = selectedDateObj.getMonth();
    const year = selectedDateObj.getFullYear();

    const monthlyBookings = bookings.filter(b => {
      if (!b.bookingDate || b.status === 'cancelled') return false;
      const d = new Date(b.bookingDate);
      const isMonthMatch = (d.getMonth() === month || d.getUTCMonth() === month) && (d.getFullYear() === year || d.getUTCFullYear() === year);
      return isMonthMatch && matchesArena(b.arenaName, selectedArena);
    });

    return ranges.map(range => {
      const rangeBookings = monthlyBookings.filter(b => {
        const d = new Date(b.bookingDate).getDate();
        return d >= range.start && d <= range.end;
      });

      let amount = 0;
      let dayCount = 0;
      let nightCount = 0;
      let lateCount = 0;

      rangeBookings.forEach(b => {
        amount += (Number(b.paidAmount) || 0);
        const cat = getSlotCategory(b.timeSlot || "");
        if (cat === 'day') dayCount++;
        else if (cat === 'night') nightCount++;
        else if (cat === 'late') lateCount++;
      });

      const sum = dayCount + nightCount + lateCount;
      const avg = sum > 0 ? Math.round(amount / sum) : 0;

      return {
        label: `${range.start}-${range.end}`,
        amount,
        dayCount,
        nightCount,
        lateCount,
        sum,
        avg
      };
    });
  };

  const monthlyStats = getMonthlyStats();
  const totalAmount = monthlyStats.reduce((acc, s) => acc + s.amount, 0);
  const totalDay = monthlyStats.reduce((acc, s) => acc + s.dayCount, 0);
  const totalNight = monthlyStats.reduce((acc, s) => acc + s.nightCount, 0);
  const totalLate = monthlyStats.reduce((acc, s) => acc + s.lateCount, 0);
  const totalSum = monthlyStats.reduce((acc, s) => acc + s.sum, 0);
  const overallAvg = totalSum > 0 ? Math.round(totalAmount / totalSum) : 0;

  if (loading) return <Loading />;

  return (
    <div className="booking-by-date">
      <div className="dashboard__filter-wrap">
        <div className="dashboard__filter">
          <label>Filter by date:</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>

        <div className="dashboard__filter">
          <button
            className="secondary-button"
            onClick={() => {
              setSelectedDate(getTodayDate());
              setSelectedArena("Royel Turf & Swimming Zone");
            }}
            style={{ marginRight: '10px', backgroundColor: '#6c757d', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer' }}
          >
            Clear Filters
          </button>
          <button className="tertiary-button" onClick={fetchBookings}>Refresh Data</button>
        </div>
      </div>

      {errorMsg && (
        <div style={{ padding: "12px", marginTop: "15px", backgroundColor: "#f8d7da", color: "#721c24", borderRadius: "4px", border: "1px solid #f5c6cb" }}>
          <strong>Error:</strong> {errorMsg}
        </div>
      )}

      <div className="excel-container">
        <div className="excel-header">
          <div className="excel-title">
            {new Date(selectedDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' })} - {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long' })} {selectedArena}
          </div>
        </div>
        <div className="excel-table-wrapper">
          <table className="excel-table">
            <thead>
              <tr>
                <th>Time Slot</th>
                <th>Name</th>
                <th>Contact</th>
                <th>Advance</th>
                <th>Receiver / TRx ID</th>
                <th>Total Receive</th>
                <th>(Due) Receiver</th>
                <th>Comment</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {TIME_SLOTS.map((slot, index) => {
                const b = getBookingForSlot(slot);
                return (
                  <tr key={`slot-${index}`}>
                    <td className="slot-col">{slot}</td>
                    <td>{b?.bookingForName || ""}</td>
                    <td>{b?.bookingForPhone || ""}</td>
                    <td>
                      {b?.advanceAmount > 0 ? b.advanceAmount : ""}
                    </td>
                    <td>{getReceiverDisplay(b)}</td>
                    <td>{b?.paidAmount || ""}</td>
                    <td>{b?.dueReceiverName || ""}</td>
                    <td className="comment-cell">{b?.notes || ""}</td>
                    <td className={`check-col ${b?.customerStatus === 'Call Received' ? 'status-received' :
                        b?.customerStatus === 'Call Not Received' ? 'status-not-received' :
                          b?.customerStatus === 'Phone Off' ? 'status-phone-off' : ''
                      }`}>
                      {b?.customerStatus && b?.customerStatus !== 'selected status' ? b.customerStatus : ''}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="total-row">
                <td colSpan="5" style={{ textAlign: 'right', fontWeight: 'bold', border: 'none' }}>Daily Total:</td>
                <td style={{ fontWeight: 'bold', border: 'none' }}>৳{dailyTotal}</td>
                <td colSpan="3" style={{ border: 'none' }}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <div className="summary-section">
        <div className="summary-title">
          Monthly Summary: {new Date(selectedDate).toLocaleString('default', { month: 'long', year: 'numeric' })} ({selectedArena})
        </div>
        <div className="excel-table-wrapper">
          <table className="excel-table summary-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Amount</th>
                <th>Day slot</th>
                <th>Night slot (6.30-11 pm)</th>
                <th>late night (11-6am)</th>
                <th>→ Sum</th>
                <th>Average price</th>
              </tr>
            </thead>
            <tbody>
              {monthlyStats.map((stat, i) => (
                <tr key={i}>
                  <td className="range-label">{stat.label}</td>
                  <td>{stat.amount || ""}</td>
                  <td>{stat.dayCount || ""}</td>
                  <td>{stat.nightCount || ""}</td>
                  <td>{stat.lateCount || ""}</td>
                  <td className="sum-col">{stat.sum || ""}</td>
                  <td>{stat.sum > 0 ? stat.avg : ""}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="grand-total-row">
                <td>Total</td>
                <td>{totalAmount}</td>
                <td>{totalDay}</td>
                <td>{totalNight}</td>
                <td>{totalLate}</td>
                <td className="total-sum-col">{totalSum}</td>
                <td>{totalSum > 0 ? overallAvg : ""}</td>
              </tr>
              <tr className="slots-total-row">
                <td colSpan="2" style={{ textAlign: "right", fontWeight: "bold" }}>Total (Day, Night, Late):</td>
                <td colSpan="3" style={{ fontSize: "22px", fontWeight: "900", color: "#000", backgroundColor: "#f0f0f0" }}>{totalSum}</td>
                <td colSpan="2"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <style jsx>{`
        .booking-by-date {
          background: #fff;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.05);
          margin-bottom: 30px;
        }
        .excel-container {
          margin-top: 20px;
          border: 2px solid #333;
        }
        .excel-header {
          background-color: #132241;
          padding: 12px;
          text-align: center;
          border-bottom: 2px solid #333;
        }
        .excel-title {
          color: #fff;
          font-size: 22px;
          font-weight: bold;
          letter-spacing: 1px;
        }
        .excel-table-wrapper {
          overflow-x: auto;
        }
        .excel-table {
          width: 100%;
          border-collapse: collapse;
          font-family: 'Segoe UI', Arial, sans-serif;
          font-size: 13px;
        }
        .excel-table th, .excel-table td {
          border: 1px solid #999;
          padding: 8px 10px;
          text-align: center;
          height: 35px;
          min-width: 120px;
        }
        .excel-table th {
          background-color: #e0e0e0;
          font-weight: 700;
          color: #222;
          text-transform: uppercase;
          font-size: 11px;
        }
        .slot-col {
          font-weight: bold;
          background-color: #f0f0f0;
          width: 110px !important;
          min-width: 110px !important;
        }
        .night-row td {
          background-color: #00FFCE;
          font-weight: bold;
          text-align: center;
          padding: 6px;
          color: #000;
          font-size: 16px;
          text-transform: uppercase;
        }
        .check-col {
          min-width: 100px;
          text-align: center;
        }
        .check-col.status-received {
          background-color: #358538;
          color: #fff;
          font-weight: bold;
        }
        .check-col.status-not-received {
          background-color: #d32f2f;
          color: #fff;
          font-weight: bold;
        }
        .check-col.status-phone-off {
          background-color: #757575;
          color: #fff;
          font-weight: bold;
        }
        .total-row td {
          padding: 20px 15px;
          font-size: 18px;
          background-color: #fff;
          border-top: 2px solid #333 !important;
        }
        .comment-cell {
          font-style: italic;
          color: #555;
          min-width: 150px;
        }
        tr:nth-child(even):not(.night-row) {
          background-color: #fdfdfd;
        }
        tr:hover:not(.night-row):not(.total-row):not(.grand-total-row):not(.slots-total-row) {
          background-color: #f0f4f8;
        }

        /* Summary Table Styles */
        .summary-section {
          margin-top: 50px;
          border: 1px solid #ccc;
          padding: 15px;
          background: #fafafa;
        }
        .summary-title {
          font-size: 20px;
          font-weight: bold;
          color: #132241;
          margin-bottom: 15px;
          text-transform: uppercase;
          border-left: 5px solid #132241;
          padding-left: 10px;
        }
        .summary-table th {
          background-color: #f2f2f2;
        }
        .range-label {
          background-color: #f9f9f9;
          font-weight: bold;
        }
        .sum-col {
          background-color: #fff;
        }
        .grand-total-row td {
          font-weight: bold;
          background-color: #eee;
          font-size: 15px;
        }
        .total-sum-col {
          font-weight: bold;
          font-size: 16px;
        }
        .slots-total-row td {
          border-top: 2px solid #333 !important;
        }
      `}</style>
    </div>
  );
}
