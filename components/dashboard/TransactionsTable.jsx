"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";

const TransactionsTable = ({ receiverId = null }) => {
    const { data: session } = useSession();
    const [transactions, setTransactions] = useState([]);
    const [totals, setTotals] = useState(null);
    const [loading, setLoading] = useState(true);
    const [dateFilter, setDateFilter] = useState({
        startDate: "",
        endDate: "",
    });

    const fetchTransactions = async () => {
        try {
            setLoading(true);
            let url = "/api/transactions";
            const params = new URLSearchParams();

            if (receiverId) params.append("receiverId", receiverId);
            if (dateFilter.startDate) params.append("startDate", dateFilter.startDate);
            if (dateFilter.endDate) params.append("endDate", dateFilter.endDate);

            if (params.toString()) url += `?${params.toString()}`;

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
    }, [session, receiverId, dateFilter]);

    const handleDateFilterChange = (e) => {
        const { name, value } = e.target;
        setDateFilter((prev) => ({ ...prev, [name]: value }));
    };

    const clearFilters = () => {
        setDateFilter({ startDate: "", endDate: "" });
    };

    if (loading) {
        return <div className="loading">Loading transactions...</div>;
    }

    return (
        <div className="transactions-container">
            <div className="transactions-header">
                <h2 className="transactions-title">Transaction History</h2>

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
                            Clear Filters
                        </button>
                    )}
                </div>
            </div>

            {/* Summary Cards */}
            {totals && (
                <div className="transactions-summary">
                    <div className="summary-card">
                        <h3>Total Received</h3>
                        <p className="amount">৳{totals.totalAmount.toLocaleString()}</p>
                    </div>
                    <div className="summary-card">
                        <h3>Advance Payments</h3>
                        <p className="amount">৳{totals.advanceAmount.toLocaleString()}</p>
                    </div>
                    <div className="summary-card">
                        <h3>Due Payments</h3>
                        <p className="amount">৳{totals.dueAmount.toLocaleString()}</p>
                    </div>
                    <div className="summary-card">
                        <h3>Full Payments</h3>
                        <p className="amount">৳{totals.fullAmount.toLocaleString()}</p>
                    </div>
                    <div className="summary-card">
                        <h3>Cancellations</h3>
                        <p className="amount">৳{totals.cancellationAmount?.toLocaleString() || 0}</p>
                    </div>
                    <div className="summary-card">
                        <h3>Total Transactions</h3>
                        <p className="amount">{totals.count}</p>
                    </div>
                </div>
            )}

            {/* Transactions Table */}
            {transactions.length === 0 ? (
                <div className="no-transactions">
                    <p>No transactions found</p>
                </div>
            ) : (
                <div className="transactions-table-wrapper">
                    <table className="transactions-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Customer</th>
                                <th>Arena</th>
                                <th>Time Slot</th>
                                <th>Type</th>
                                <th>Amount</th>
                                <th>Receiver</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {transactions.map((transaction) => (
                                <tr key={transaction._id}>
                                    <td>
                                        {new Date(transaction.bookingDate).toLocaleDateString("en-GB")}
                                        <br />
                                        <small>{new Date(transaction.createdAt).toLocaleTimeString()}</small>
                                    </td>
                                    <td>
                                        <strong>{transaction.customerName}</strong>
                                        <br />
                                        <small>{transaction.customerPhone}</small>
                                    </td>
                                    <td>{transaction.arenaName}</td>
                                    <td className="time-slot">{transaction.timeSlot}</td>
                                    <td>
                                        <span className={`badge badge-${transaction.transactionType}`}>
                                            {transaction.transactionType.toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="amount-cell">
                                        {transaction.couponCode && (
                                            <>
                                                <div style={{ textDecoration: 'line-through', color: '#999', fontSize: '12px' }}>
                                                    ৳{(transaction.originalAmount || transaction.amount).toLocaleString()}
                                                </div>
                                                <div style={{ color: '#28a745', fontSize: '10px' }}>
                                                    -{transaction.couponCode} (-৳{transaction.discountAmount})
                                                </div>
                                            </>
                                        )}
                                        <strong style={{ 
                                            color: transaction.transactionType === 'cancellation' ? '#dc3545' : (transaction.couponCode ? '#28a745' : 'inherit') 
                                        }}>
                                            {transaction.transactionType === 'cancellation' ? '-' : ''}৳{transaction.amount.toLocaleString()}
                                        </strong>
                                    </td>
                                    <td>
                                        {transaction.receiverName}
                                        <br />
                                        <small>{transaction.receiver?.phone}</small>
                                    </td>
                                    <td>
                                        <span className={`status-badge status-${transaction.bookingStatus}`}>
                                            {transaction.bookingStatus}
                                        </span>
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

export default TransactionsTable;
