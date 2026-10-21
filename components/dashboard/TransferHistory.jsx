"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";

const TransferHistory = () => {
    const { data: session } = useSession();
    const [transfers, setTransfers] = useState([]);
    const [sent, setSent] = useState([]);
    const [received, setReceived] = useState([]);
    const [totals, setTotals] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("all"); // all, sent, received
    const [statusFilter, setStatusFilter] = useState("all"); // all, pending, approved, rejected
    const [dateFilter, setDateFilter] = useState({
        startDate: "",
        endDate: "",
    });

    const fetchTransferHistory = async () => {
        if (!session?.user?.id) return;

        try {
            setLoading(true);
            let url = "/api/transfer-history";
            const params = new URLSearchParams();

            if (dateFilter.startDate) params.append("startDate", dateFilter.startDate);
            if (dateFilter.endDate) params.append("endDate", dateFilter.endDate);
            if (statusFilter !== "all") params.append("status", statusFilter);

            if (params.toString()) url += `?${params.toString()}`;

            const response = await fetch(url);
            const data = await response.json();

            if (response.ok) {
                setTransfers(data.transfers);
                setSent(data.sent);
                setReceived(data.received);
                setTotals(data.totals);
            } else {
                toast.error(data.message || "Failed to fetch transfer history");
            }
        } catch (error) {
            console.error("Error fetching transfer history:", error);
            toast.error("Failed to load transfer history");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (session) {
            fetchTransferHistory();
        }
    }, [session, dateFilter, statusFilter]);

    const handleDateFilterChange = (e) => {
        const { name, value } = e.target;
        setDateFilter((prev) => ({ ...prev, [name]: value }));
    };

    const clearFilters = () => {
        setDateFilter({ startDate: "", endDate: "" });
        setStatusFilter("all");
    };

    const getDisplayData = () => {
        switch (activeTab) {
            case "sent":
                return sent;
            case "received":
                return received;
            default:
                return transfers;
        }
    };

    const displayData = getDisplayData();

    if (loading) {
        return (
            <div style={{ textAlign: "center", padding: "40px" }}>
                Loading transfer history...
            </div>
        );
    }

    return (
        <div className="transfer-history-container">
            <div className="history-header">
                <h2 className="history-title">Transfer History</h2>
                <p className="history-subtitle">View all your money transfers</p>
            </div>

            {/* Date Filters */}
            <div className="history-filters">
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
                <div className="filter-group">
                    <label>Status:</label>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="status-filter"
                    >
                        <option value="all">All Status</option>
                        <option value="approved">Approved</option>
                        <option value="pending">Pending</option>
                        <option value="rejected">Rejected</option>
                    </select>
                </div>
                {(dateFilter.startDate || dateFilter.endDate || statusFilter !== "all") && (
                    <button onClick={clearFilters} className="clear-filters-btn">
                        Clear All
                    </button>
                )}
            </div>

            {/* Summary Cards */}
            {totals && (
                totals.isAdmin ? (
                    <div className="history-summary">
                        <div className="summary-card net-card">
                            <div className="summary-icon">💰</div>
                            <div className="summary-content">
                                <h3>Total Transferred Volume</h3>
                                <p className="amount">৳{totals.systemTotalAmount.toLocaleString()}</p>
                                <small>{totals.systemApprovedCount} approved transfers</small>
                            </div>
                        </div>
                        <div className="summary-card sent-card">
                            <div className="summary-icon">⏳</div>
                            <div className="summary-content">
                                <h3>System Pending Requests</h3>
                                <p className="amount">{totals.systemPendingCount}</p>
                                <small>Waiting for approval</small>
                            </div>
                        </div>
                        <div className="summary-card received-card">
                            <div className="summary-icon">👤</div>
                            <div className="summary-content">
                                <h3>My Net Transfer</h3>
                                <p className="amount">
                                    ৳{(totals.totalReceived - totals.totalSent).toLocaleString()}
                                </p>
                                <small>Personal Received - Sent</small>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="history-summary">
                        <div className="summary-card sent-card">
                            <div className="summary-icon">📤</div>
                            <div className="summary-content">
                                <h3>Total Sent</h3>
                                <p className="amount">৳{totals.totalSent.toLocaleString()}</p>
                                <small>{totals.sentCount} transfers</small>
                            </div>
                        </div>
                        <div className="summary-card received-card">
                            <div className="summary-icon">📥</div>
                            <div className="summary-content">
                                <h3>Total Received</h3>
                                <p className="amount">৳{totals.totalReceived.toLocaleString()}</p>
                                <small>{totals.receivedCount} transfers</small>
                            </div>
                        </div>
                        <div className="summary-card net-card">
                            <div className="summary-icon">💰</div>
                            <div className="summary-content">
                                <h3>Net Transfer</h3>
                                <p className="amount">
                                    ৳{(totals.totalReceived - totals.totalSent).toLocaleString()}
                                </p>
                                <small>Received - Sent</small>
                            </div>
                        </div>
                    </div>
                )
            )}

            {/* Tabs */}
            <div className="history-tabs">
                <button
                    className={activeTab === "all" ? "tab-active" : "tab"}
                    onClick={() => setActiveTab("all")}
                >
                    All Transfers ({transfers.length})
                </button>
                <button
                    className={activeTab === "sent" ? "tab-active" : "tab"}
                    onClick={() => setActiveTab("sent")}
                >
                    Sent ({sent.length})
                </button>
                <button
                    className={activeTab === "received" ? "tab-active" : "tab"}
                    onClick={() => setActiveTab("received")}
                >
                    Received ({received.length})
                </button>
            </div>

            {/* Transfer List */}
            {displayData.length === 0 ? (
                <div className="no-transfers">
                    <div className="empty-icon">💸</div>
                    <h3>No Transfers Found</h3>
                    <p>
                        {activeTab === "all"
                            ? "You don't have any transfer history yet."
                            : activeTab === "sent"
                                ? "You haven't sent any transfers yet."
                                : "You haven't received any transfers yet."}
                    </p>
                </div>
            ) : (
                <div className="transfer-list">
                    {displayData.map((transfer) => {
                        const isSent = transfer.from?._id === session.user.id || transfer.from === session.user.id;
                        const isReceived = transfer.to?._id === session.user.id || transfer.to === session.user.id;

                        let icon = "🔄";
                        let itemClass = "admin-view";
                        let userRole = "";
                        let userPhone = "";
                        let amountSign = "";
                        let amountClass = "admin-amount";

                        if (isSent) {
                            icon = "📤";
                            itemClass = "sent";
                            const otherUser = transfer.to;
                            userRole = otherUser?.role?.replace("_", " ") || "User";
                            userPhone = otherUser?.phone || "";
                            amountSign = "-";
                            amountClass = "sent-amount";
                        } else if (isReceived) {
                            icon = "📥";
                            itemClass = "received";
                            const otherUser = transfer.from;
                            userRole = otherUser?.role?.replace("_", " ") || "User";
                            userPhone = otherUser?.phone || "";
                            amountSign = "+";
                            amountClass = "received-amount";
                        } else {
                            // Admin viewing a transfer between other users
                            icon = "🔄";
                            itemClass = "admin-view";
                            const fromRole = transfer.from?.role?.replace("_", " ") || "User";
                            const toRole = transfer.to?.role?.replace("_", " ") || "User";
                            userRole = `${fromRole} ➔ ${toRole}`;
                            
                            const fromPhone = transfer.from?.phone || "";
                            const toPhone = transfer.to?.phone || "";
                            userPhone = fromPhone && toPhone ? `${fromPhone} ➔ ${toPhone}` : (fromPhone || toPhone || "");
                            amountSign = "";
                            amountClass = "admin-amount";
                        }

                        return (
                            <div
                                key={transfer._id}
                                className={`transfer-item ${itemClass}`}
                            >
                                <div className="transfer-icon">
                                    {icon}
                                </div>
                                <div className="transfer-details">
                                    <div className="transfer-main">
                                        <div className="transfer-user">
                                            <h4>
                                                {isSent || isReceived ? (
                                                    <>
                                                        {isSent ? "Sent to" : "Received from"}{" "}
                                                        <strong>{isSent ? (transfer.to?.name || transfer.toName) : (transfer.from?.name || transfer.fromName)}</strong>
                                                    </>
                                                ) : (
                                                    <>
                                                        <strong>{transfer.from?.name || transfer.fromName || "System"}</strong> to <strong>{transfer.to?.name || transfer.toName}</strong>
                                                    </>
                                                )}
                                            </h4>
                                            <p className="user-role">
                                                {userRole} {userPhone ? `• ${userPhone}` : ""}
                                            </p>
                                        </div>
                                        <div className={`transfer-amount ${amountClass}`}>
                                            <span className="amount-sign">{amountSign}</span>
                                            ৳{transfer.amount.toLocaleString()}
                                        </div>
                                    </div>
                                    {transfer.notes && (
                                        <div className="transfer-notes">
                                            <span>📝</span> {transfer.notes}
                                        </div>
                                    )}
                                    <div className="transfer-meta">
                                        <span className="transfer-date">
                                            {new Date(transfer.createdAt).toLocaleDateString("en-GB", {
                                                day: "2-digit",
                                                month: "short",
                                                year: "numeric",
                                            })}{" "}
                                            at{" "}
                                            {new Date(transfer.createdAt).toLocaleTimeString("en-US", {
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            })}
                                        </span>
                                        <span className={`transfer-status status-${transfer.status}`}>
                                            {transfer.status === "approved" && "✓ Approved"}
                                            {transfer.status === "pending" && "⏳ Pending"}
                                            {transfer.status === "rejected" && "✗ Rejected"}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <style jsx>{`
              .transfer-history-container {
                padding: 20px;
                margin: 0 auto;
              }

              .history-header {
                margin-bottom: 25px;
              }

              .history-title {
                font-size: 28px;
                font-weight: 700;
                color: #1a1a1a;
                margin-bottom: 5px;
              }

              .history-subtitle {
                color: #666;
                font-size: 14px;
              }

              .history-filters {
                display: flex;
                gap: 12px;
                align-items: flex-end;
                margin-bottom: 25px;
                flex-wrap: wrap;
              }

              .filter-group {
                display: flex;
                flex-direction: column;
                gap: 5px;
              }

              .filter-group label {
                font-size: 13px;
                font-weight: 500;
                color: #555;
              }

              .filter-group input {
                padding: 10px 12px;
                border: 1px solid #ddd;
                border-radius: 6px;
                font-size: 14px;
                min-width: 160px;
              }

              .status-filter {
                padding: 10px 12px;
                border: 1px solid #ddd;
                border-radius: 6px;
                font-size: 14px;
                min-width: 160px;
                background: white;
                cursor: pointer;
              }

              .status-filter:focus {
                outline: none;
                border-color: #667eea;
              }

              .clear-filters-btn {
                padding: 10px 20px;
                background-color: #ff4444;
                color: white;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                font-size: 14px;
                font-weight: 500;
              }

              .clear-filters-btn:hover {
                background-color: #cc0000;
              }

              .history-summary {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 20px;
                margin-bottom: 30px;
              }

              .summary-card {
                background: white;
                padding: 24px;
                border-radius: 12px;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
                display: flex;
                gap: 16px;
                align-items: center;
              }

              .summary-icon {
                font-size: 40px;
                flex-shrink: 0;
              }

              .summary-content h3 {
                font-size: 13px;
                color: #666;
                margin-bottom: 8px;
                font-weight: 500;
                text-transform: uppercase;
              }

              .summary-content .amount {
                font-size: 26px;
                font-weight: 700;
                color: #1a1a1a;
                margin: 0 0 4px 0;
              }

              .summary-content small {
                color: #999;
                font-size: 12px;
              }

              .sent-card {
                border-left: 4px solid #ff6b6b;
              }

              .received-card {
                border-left: 4px solid #51cf66;
              }

              .net-card {
                border-left: 4px solid #667eea;
              }

              .history-tabs {
                display: flex;
                gap: 10px;
                margin-bottom: 25px;
                border-bottom: 2px solid #e0e0e0;
              }

              .tab,
              .tab-active {
                padding: 12px 24px;
                background: none;
                border: none;
                border-bottom: 3px solid transparent;
                cursor: pointer;
                font-size: 15px;
                font-weight: 500;
                color: #666;
                transition: all 0.2s;
              }

              .tab:hover {
                color: #667eea;
              }

              .tab-active {
                color: #667eea;
                border-bottom-color: #667eea;
              }

              .transfer-list {
                display: flex;
                flex-direction: column;
                gap: 16px;
              }

              .transfer-item {
                background: white;
                border-radius: 12px;
                padding: 20px;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
                display: flex;
                gap: 16px;
                transition: transform 0.2s, box-shadow 0.2s;
              }

              .transfer-item:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
              }

              .transfer-item.sent {
                border-left: 4px solid #ff6b6b;
              }

              .transfer-item.received {
                border-left: 4px solid #51cf66;
              }

              .transfer-item.admin-view {
                border-left: 4px solid #667eea;
              }

              .transfer-icon {
                font-size: 32px;
                flex-shrink: 0;
              }

              .transfer-details {
                flex: 1;
              }

              .transfer-main {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                margin-bottom: 10px;
              }

              .transfer-user h4 {
                font-size: 16px;
                font-weight: 500;
                color: #1a1a1a;
                margin-bottom: 4px;
              }

              .transfer-user h4 strong {
                font-weight: 700;
              }

              .user-role {
                font-size: 13px;
                color: #666;
                text-transform: capitalize;
              }

              .transfer-amount {
                font-size: 24px;
                font-weight: 700;
                white-space: nowrap;
              }

              .sent-amount {
                color: #ff6b6b;
              }

              .received-amount {
                color: #51cf66;
              }

              .admin-amount {
                color: #667eea;
              }

              .amount-sign {
                font-size: 20px;
              }

              .transfer-notes {
                background: #f8f9fa;
                padding: 10px 12px;
                border-radius: 6px;
                font-size: 14px;
                color: #495057;
                margin-bottom: 10px;
              }

              .transfer-notes span {
                margin-right: 6px;
              }

              .transfer-meta {
                display: flex;
                justify-content: space-between;
                align-items: center;
              }

              .transfer-date {
                font-size: 13px;
                color: #999;
              }

              .transfer-status {
                padding: 4px 12px;
                border-radius: 12px;
                font-size: 12px;
                font-weight: 600;
              }

              .status-approved {
                background: #d4edda;
                color: #155724;
              }

              .status-pending {
                background: #fff3cd;
                color: #856404;
              }

              .status-rejected {
                background: #f8d7da;
                color: #721c24;
              }

              .no-transfers {
                text-align: center;
                padding: 60px 20px;
                background: white;
                border-radius: 12px;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
              }

              .empty-icon {
                font-size: 64px;
                margin-bottom: 20px;
              }

              .no-transfers h3 {
                font-size: 22px;
                color: #1a1a1a;
                margin-bottom: 10px;
              }

              .no-transfers p {
                color: #666;
                font-size: 14px;
              }

              @media (max-width: 768px) {
                .history-summary {
                  grid-template-columns: 1fr;
                }

                .transfer-main {
                  flex-direction: column;
                  gap: 10px;
                }

                .transfer-amount {
                  font-size: 20px;
                }
              }
            `}</style>
        </div>
    );
};

export default TransferHistory;