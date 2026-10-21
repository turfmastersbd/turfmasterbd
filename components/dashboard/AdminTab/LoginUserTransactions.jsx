"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";

const LoginUserTransactions = () => {
    const { data: session } = useSession();
    const [transactions, setTransactions] = useState([]);
    const [totals, setTotals] = useState(null);
    const [loading, setLoading] = useState(true);
    const [dateFilter, setDateFilter] = useState({
        startDate: "",
        endDate: "",
    });

    const fetchTransactions = async () => {
        if (!session?.user?.id) return;

        try {
            setLoading(true);
            let url = `/api/transactions?receiverId=${session.user.id}`;

            if (dateFilter.startDate) url += `&startDate=${dateFilter.startDate}`;
            if (dateFilter.endDate) url += `&endDate=${dateFilter.endDate}`;

            const response = await fetch(url);
            const data = await response.json();

            if (response.ok) {
                setTransactions(data.transactions);
                setTotals(data.totals);
            } else {
                toast.error(data.message || "Failed to fetch transactions");
            }
        } catch (error) {
            console.error("Error fetching transactions:", error);
            toast.error("Failed to load transactions");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (session) {
            fetchTransactions();
        }
    }, [session, dateFilter]);

    const handleDateFilterChange = (e) => {
        const { name, value } = e.target;
        setDateFilter((prev) => ({ ...prev, [name]: value }));
    };

    const clearFilters = () => {
        setDateFilter({ startDate: "", endDate: "" });
    };

    if (loading) {
        return (
            <div style={{ textAlign: "center", padding: "40px" }}>
                Loading your transactions...
            </div>
        );
    }

    return (
        <div className="user-transactions-container">
            <div className="transactions-header">
                <h2 className="transactions-title">My Transactions</h2>
                <p className="transactions-subtitle">
                    Payments you have received from bookings
                </p>
            </div>

            {/* Date Filters */}
            <div className="transactions-filters">
                <div className="filter-group">
                    <label>From:</label>
                    <input
                        type="date"
                        name="startDate"
                        value={dateFilter.startDate}
                        onChange={handleDateFilterChange}
                    />
                </div>
                <div className="filter-group">
                    <label>To:</label>
                    <input
                        type="date"
                        name="endDate"
                        value={dateFilter.endDate}
                        onChange={handleDateFilterChange}
                    />
                </div>
                {(dateFilter.startDate || dateFilter.endDate) && (
                    <button onClick={clearFilters} className="clear-filters-btn">
                        Clear
                    </button>
                )}
            </div>

            {/* Summary Cards */}
            {totals && (
                <div className="transactions-summary">
                    <div className="summary-card total">
                        <div className="summary-icon">💰</div>
                        <div className="summary-content">
                            <h3>Total Received</h3>
                            <p className="amount">৳{totals.totalAmount.toLocaleString()}</p>
                        </div>
                    </div>
                    <div className="summary-card advance">
                        <div className="summary-icon">📝</div>
                        <div className="summary-content">
                            <h3>Advance Payments</h3>
                            <p className="amount">৳{totals.advanceAmount.toLocaleString()}</p>
                            <small>{transactions.filter(t => t.transactionType === "advance").length} transactions</small>
                        </div>
                    </div>
                    <div className="summary-card due">
                        <div className="summary-icon">💵</div>
                        <div className="summary-content">
                            <h3>Due Payments</h3>
                            <p className="amount">৳{totals.dueAmount.toLocaleString()}</p>
                            <small>{transactions.filter(t => t.transactionType === "due").length} transactions</small>
                        </div>
                    </div>
                    <div className="summary-card full">
                        <div className="summary-icon">✅</div>
                        <div className="summary-content">
                            <h3>Full Payments</h3>
                            <p className="amount">৳{totals.fullAmount.toLocaleString()}</p>
                            <small>{transactions.filter(t => t.transactionType === "full").length} transactions</small>
                        </div>
                    </div>
                </div>
            )}

            {/* Transactions Table */}
            {transactions.length === 0 ? (
                <div className="no-transactions">
                    <div className="empty-icon">📊</div>
                    <h3>No Transactions Yet</h3>
                    <p>You haven't received any payments yet. Transactions will appear here when you confirm or complete bookings.</p>
                </div>
            ) : (
                <div className="transactions-table-wrapper">
                    <table className="transactions-table">
                        <thead>
                            <tr>
                                <th>Date & Time</th>
                                <th>Customer</th>
                                <th>Arena & Slot</th>
                                <th>Type</th>
                                <th>Amount</th>
                                <th>Status</th>
                                <th>Notes</th>
                            </tr>
                        </thead>
                        <tbody>
                            {transactions.map((transaction) => (
                                <tr key={transaction._id}>
                                    <td className="date-cell">
                                        <div className="date-primary">
                                            {new Date(transaction.bookingDate).toLocaleDateString("en-GB", {
                                                day: "2-digit",
                                                month: "short",
                                                year: "numeric"
                                            })}
                                        </div>
                                        <div className="date-secondary">
                                            {new Date(transaction.createdAt).toLocaleTimeString("en-US", {
                                                hour: "2-digit",
                                                minute: "2-digit"
                                            })}
                                        </div>
                                    </td>
                                    <td className="customer-cell">
                                        <div className="customer-name">{transaction.customerName}</div>
                                        <div className="customer-phone">{transaction.customerPhone}</div>
                                    </td>
                                    <td className="arena-cell">
                                        <div className="arena-name">{transaction.arenaName}</div>
                                        <div className="time-slot">{transaction.timeSlot}</div>
                                    </td>
                                    <td>
                                        <span className={`badge badge-${transaction.transactionType}`}>
                                            {transaction.transactionType.toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="amount-cell">
                                        <strong>৳{transaction.amount.toLocaleString()}</strong>
                                    </td>
                                    <td>
                                        <span className={`status-badge status-${transaction.bookingStatus}`}>
                                            {transaction.bookingStatus}
                                        </span>
                                    </td>
                                    <td className="notes-cell">
                                        <small>{transaction.notes}</small>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            
        </div>
    );
};

export default LoginUserTransactions;