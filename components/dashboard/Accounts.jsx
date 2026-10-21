"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import Swal from "sweetalert2";

const Accounts = () => {
    const { data: session } = useSession();
    const role = session?.user?.role;
    const isSuperAdmin = role === "SUPER_ADMIN";

    const [balance, setBalance] = useState(null);
    const [adminUsers, setAdminUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [transferring, setTransferring] = useState(false);
    const [processingTransferId, setProcessingTransferId] = useState(null);

    // Bkash Advance State
    const [advanceBookings, setAdvanceBookings] = useState([]);
    const [advanceDate, setAdvanceDate] = useState("");
    const [loadingAdvance, setLoadingAdvance] = useState(false);

    const [transferData, setTransferData] = useState({
        toUserId: "",
        amount: "",
        notes: "",
        transferType: "other",
    });

    const [showTransferModal, setShowTransferModal] = useState(false);
    const [showBkashTransferModal, setShowBkashTransferModal] = useState(false);
    const [selectedAdmin, setSelectedAdmin] = useState(null);
    const [bkashAmount, setBkashAmount] = useState("");
    const [bkashNotes, setBkashNotes] = useState("");

    const fetchBalance = async () => {
        try {
            const response = await fetch("/api/transfers");
            const data = await response.json();

            if (response.ok) {
                setBalance(data);
            }
        } catch (error) {
            console.error("Error fetching balance:", error);
        }
    };


    
    const fetchAdminUsers = async () => {
        try {
            const response = await fetch("/api/admin-users");
            const data = await response.json();

            if (response.ok) {
                setAdminUsers(data.users);
            }
        } catch (error) {
            console.error("Error fetching admin users:", error);
        }
    };

    const fetchBkashAdvance = async () => {
        setLoadingAdvance(true);
        try {
            const response = await fetch(`/api/bkash-advance?date=${advanceDate}`);
            const data = await response.json();
            if (response.ok) {
                setAdvanceBookings(data);
            }
        } catch (error) {
            console.error("Error fetching bkash advance:", error);
        } finally {
            setLoadingAdvance(false);
        }
    };

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            await Promise.all([fetchBalance(), fetchAdminUsers(), fetchBkashAdvance()]);
            setLoading(false);
        };

        if (session) {
            loadData();
        }
    }, [session, advanceDate]);

    const handleTransfer = async (e) => {
        if (e) e.preventDefault();

        const amount = parseFloat(transferData.amount);
        if (!amount || amount <= 0) {
            toast.error("Please enter a valid amount");
            return;
        }

        if (amount > (balance?.balance || 0)) {
            toast.error(`Insufficient balance. Available: ৳${balance?.balance}`);
            return;
        }

        const toUserId = transferData.transferType === 'own' ? session.user.id : transferData.toUserId;

        if (!toUserId) {
            toast.error("Please select a recipient");
            return;
        }

        // Confirmation for Own Account
        if (transferData.transferType === 'own') {
            const result = await Swal.fire({
                title: "Confirm Transfer",
                text: `Are you sure you want to transfer ৳${amount} to your own account?`,
                icon: "question",
                showCancelButton: true,
                confirmButtonText: "Yes, Transfer",
                cancelButtonText: "Cancel",
                confirmButtonColor: "#28a745",
            });

            if (!result.isConfirmed) return;
        }

        setTransferring(true);

        try {
            const response = await fetch("/api/transfers", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    toUserId: toUserId,
                    amount: amount,
                    notes: transferData.notes,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                toast.success(data.message || "Transfer successful");
                setTransferData({ toUserId: "", amount: "", notes: "", transferType: "other" });
                setShowTransferModal(false);
                setSelectedAdmin(null);
                fetchBalance(); // Refresh balance
            } else {
                toast.error(data.message || "Transfer failed");
            }
        } catch (error) {
            console.error("Transfer error:", error);
            toast.error("Transfer failed");
        } finally {
            setTransferring(false);
        }
    };

    const openQuickTransfer = (admin) => {
        setSelectedAdmin(admin);
        setTransferData({
            ...transferData,
            toUserId: admin._id,
            transferType: 'other'
        });
        setShowTransferModal(true);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setTransferData((prev) => ({ ...prev, [name]: value }));
    };

    const handleBkashTransfer = async (e) => {
        e.preventDefault();
        const amount = parseFloat(bkashAmount);
        if (!amount || amount <= 0 || amount > balance.bkashAdvanceBalance) {
            Swal.fire({
                icon: "error",
                title: "Invalid Amount",
                text: `Please enter a valid amount (Max: ৳${balance.bkashAdvanceBalance})`
            });
            return;
        }

        setTransferring(true);
        try {
            const response = await fetch("/api/transfers", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    amount: amount,
                    notes: bkashNotes,
                    isBkashTransfer: true
                }),
            });

            const data = await response.json();

            if (response.ok) {
                Swal.fire({
                    icon: "success",
                    title: "Transfer Successful",
                    text: data.message,
                    timer: 2000,
                    showConfirmButton: false
                });
                setShowBkashTransferModal(false);
                setBkashAmount("");
                setBkashNotes("");
                fetchBalance();
            } else {
                throw new Error(data.message || "Transfer failed");
            }
        } catch (error) {
            Swal.fire({
                icon: "error",
                title: "Transfer Failed",
                text: error.message
            });
        } finally {
            setTransferring(false);
        }
    };

    const handleApproveTransfer = async (transferId) => {
        const result = await Swal.fire({
            title: "Approve Transfer?",
            text: "Are you sure you want to approve this transfer request?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Yes, Approve",
            confirmButtonColor: "#28a745",
        });

        if (!result.isConfirmed) return;

        setProcessingTransferId(transferId);
        try {
            const response = await fetch(`/api/transfers/${transferId}/approve`, {
                method: "POST",
            });

            const data = await response.json();

            if (response.ok) {
                toast.success("Transfer approved successfully!");
                fetchBalance();
            } else {
                toast.error(data.message || "Failed to approve transfer");
            }
        } catch (error) {
            console.error("Error approving transfer:", error);
            toast.error("Failed to approve transfer");
        } finally {
            setProcessingTransferId(null);
        }
    };

    const handleRejectTransfer = async (transferId) => {
        const result = await Swal.fire({
            title: "Reject Transfer?",
            text: "Are you sure you want to reject this transfer request?",
            icon: "error",
            showCancelButton: true,
            confirmButtonText: "Yes, Reject",
            confirmButtonColor: "#dc3545",
        });

        if (!result.isConfirmed) return;

        setProcessingTransferId(transferId);
        try {
            const response = await fetch(`/api/transfers/${transferId}/reject`, {
                method: "POST",
            });

            const data = await response.json();

            if (response.ok) {
                toast.success("Transfer rejected");
                fetchBalance();
            } else {
                toast.error(data.message || "Failed to reject transfer");
            }
        } catch (error) {
            console.error("Error rejecting transfer:", error);
            toast.error("Failed to reject transfer");
        } finally {
            setProcessingTransferId(null);
        }
    };

    const selectedUser = adminUsers.find((u) => u._id === transferData.toUserId);

    if (loading) {
        return (
            <div style={{ textAlign: "center", padding: "40px" }}>
                Loading account information...
            </div>
        );
    }

    return (
        <div className="accounts-container">
            <h2 className="accounts-title">Account & Transfers</h2>

            {/* Balance Cards */}
            <div className="balance-section">
                <div className="balance-card main-balance">
                    <div className="balance-icon">💰</div>
                    <div className="balance-content">
                        <h3>Current Balance</h3>
                        <p className="balance-amount">৳{balance?.balance?.toLocaleString() || 0}</p>
                        <small>Available for transfer</small>
                    </div>
                </div>

                <div className="balance-card earned">
                    <div className="balance-icon">📊</div>
                    <div className="balance-content">
                        <h3>Total Earned</h3>
                        <p className="balance-amount">৳{balance?.earned?.toLocaleString() || 0}</p>
                        <small>From bookings</small>
                    </div>
                </div>

                <div className="balance-card sent">
                    <div className="balance-icon">📤</div>
                    <div className="balance-content">
                        <h3>Total Sent</h3>
                        <p className="balance-amount">৳{balance?.sent?.toLocaleString() || 0}</p>
                        <small>Transferred out</small>
                    </div>
                </div>

                <div className="balance-card received">
                    <div className="balance-icon">📥</div>
                    <div className="balance-content">
                        <h3>Total Received</h3>
                        <p className="balance-amount">৳{balance?.received?.toLocaleString() || 0}</p>
                        <small>Transferred in</small>
                    </div>
                </div>

                <div className="balance-card bkash-advance">
                    <div className="balance-icon">📱</div>
                    <div className="balance-content">
                        <h3>Bkash Advanced</h3>
                        <p className="balance-amount">৳{balance?.bkashAdvanceBalance?.toLocaleString() || 0}</p>
                        <button 
                            className="transfer-mini-btn"
                            onClick={() => setShowBkashTransferModal(true)}
                            title="Transfer to My Account"
                            disabled={!balance?.bkashAdvanceBalance || balance.bkashAdvanceBalance <= 0}
                        >
                            💸 Transfer to My Account
                        </button>
                    </div>
                </div>
            </div>

            {/* Bkash Transfer Modal */}
            {showBkashTransferModal && (
                <div className="modal-overlay">
                    <div className="modal-content transfer-modal">
                        <div className="modal-header">
                            <h3>Transfer from Bkash Advance</h3>
                            <button className="close-btn" onClick={() => setShowBkashTransferModal(false)}>×</button>
                        </div>
                        <form onSubmit={handleBkashTransfer}>
                            <div className="transfer-info-box">
                                <p>Transfer funds from the Bkash advance pool directly into your own account balance.</p>
                                <div className="available-pool">
                                    <span>Available in Pool:</span>
                                    <strong>৳{balance?.bkashAdvanceBalance?.toLocaleString() || 0}</strong>
                                </div>
                            </div>
                            
                            <div className="form-group">
                                <label>Amount to Transfer (৳)</label>
                                <input 
                                    type="number" 
                                    className="form-input"
                                    placeholder="Enter amount"
                                    value={bkashAmount}
                                    onChange={(e) => setBkashAmount(e.target.value)}
                                    max={balance.bkashAdvanceBalance}
                                    min="1"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Notes (Optional)</label>
                                <textarea 
                                    className="form-textarea"
                                    placeholder="Add a reason for this transfer"
                                    value={bkashNotes}
                                    onChange={(e) => setBkashNotes(e.target.value)}
                                    rows="2"
                                />
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="secondary-button" onClick={() => setShowBkashTransferModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="primary-button" disabled={transferring || !bkashAmount}>
                                    {transferring ? "Processing..." : "Confirm Transfer"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Pending Transfers Section */}
            <div className="pending-section mt-5 pt-4 border-top">
                <div className="flex-between">
                    <h3 className="pending-title">
                        🔔 Pending Requests
                    </h3>
                </div>

                <div className="pending-grid mt-4">
                    {/* Incoming (Awaiting Approval) */}
                    <div className="pending-column">
                        <h4 className="column-subtitle">Incoming (To Me) {balance?.pendingReceived?.length > 0 ? `(${balance.pendingReceived.length})` : ""}</h4>
                        {balance?.pendingReceived?.length > 0 ? (
                            <div className="pending-transfers-list">
                                {balance.pendingReceived.map((transfer) => (
                                    <div key={transfer._id} className="transfer-request-card">
                                        <div className="transfer-request-header">
                                            <div className="sender-info">
                                                <div className="sender-avatar">
                                                    {transfer.from?.name?.charAt(0).toUpperCase() || "?"}
                                                </div>
                                                <div>
                                                    <h4>From: {transfer.from?.name || transfer.fromName || "Unknown"}</h4>
                                                    <p className="sender-phone">Amount: <strong>৳{transfer.amount?.toLocaleString()}</strong></p>
                                                </div>
                                            </div>
                                            <div className="transfer-status pending">Pending</div>
                                        </div>
                                        {transfer.notes && <p className="transfer-notes">"{transfer.notes}"</p>}
                                        <div className="transfer-actions">
                                            <button
                                                onClick={() => handleApproveTransfer(transfer._id)}
                                                disabled={processingTransferId === transfer._id}
                                                className="approve-btn"
                                            >
                                                {processingTransferId === transfer._id ? "..." : "Approve"}
                                            </button>
                                            <button
                                                onClick={() => handleRejectTransfer(transfer._id)}
                                                disabled={processingTransferId === transfer._id}
                                                className="reject-btn"
                                            >
                                                {processingTransferId === transfer._id ? "..." : "Reject"}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-muted">No incoming pending requests</p>
                        )}
                    </div>

                    {/* Outgoing (Sent by Me) */}
                    <div className="pending-column">
                        <h4 className="column-subtitle">Outgoing (Sent by Me) {balance?.pendingSent?.length > 0 ? `(${balance.pendingSent.length})` : ""}</h4>
                        {balance?.pendingSent?.length > 0 ? (
                            <div className="pending-transfers-list">
                                {balance.pendingSent.map((transfer) => (
                                    <div key={transfer._id} className="transfer-request-card outgoing">
                                        <div className="transfer-request-header">
                                            <div className="sender-info">
                                                <div className="sender-avatar recipient">
                                                    {transfer.to?.name?.charAt(0).toUpperCase() || "?"}
                                                </div>
                                                <div>
                                                    <h4>To: {transfer.to?.name || transfer.toName || "Unknown"}</h4>
                                                    <p className="sender-phone">Amount: <strong>৳{transfer.amount?.toLocaleString()}</strong></p>
                                                </div>
                                            </div>
                                            <div className="transfer-status pending">Sent</div>
                                        </div>
                                        {transfer.notes && <p className="transfer-notes">"{transfer.notes}"</p>}
                                        <p className="transfer-date">Waiting for recipient to approve...</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-muted">No outgoing pending requests</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Bkash Advance Section */}
            <div className="bkash-advance-section mt-5 pt-4 border-top">
                <div className="section-header flex-between">
                    <h3 className="section-title">Bkash Advance Transactions</h3>
                    <div className="date-filter">
                        <label>Filter by Date: </label>
                        <input 
                            type="date" 
                            className="form-input" 
                            value={advanceDate} 
                            onChange={(e) => setAdvanceDate(e.target.value)} 
                        />
                        {advanceDate && (
                            <button className="text-button ml-2" onClick={() => setAdvanceDate("")}>Clear</button>
                        )}
                    </div>
                </div>

                <div className="table-container mt-3" style={{ maxHeight: '350px', overflowY: 'auto', border: '1px solid #eee', borderRadius: '8px' }}>
                    <table className="transactions-table">
                        <thead>
                            <tr>
                                <th>Booking Date</th>
                                <th>Customer</th>
                                <th>Arena</th>
                                <th>Slot</th>
                                <th>Amount (৳)</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loadingAdvance ? (
                                <tr><td colSpan="6" className="text-center">Loading...</td></tr>
                            ) : advanceBookings.length === 0 ? (
                                <tr><td colSpan="6" className="text-center">No advance bookings found</td></tr>
                            ) : (
                                advanceBookings.map((booking) => (
                                    <tr key={booking._id}>
                                        <td>{new Date(booking.bookingDate).toLocaleDateString()} ({new Date(booking.bookingDate).toLocaleDateString('en-US', { weekday: 'short' })})</td>
                                        <td>
                                            <strong>{booking.bookingForName}</strong>
                                            <br /><small>{booking.bookingForPhone}</small>
                                        </td>
                                        <td>{booking.arenaName}</td>
                                        <td>{booking.timeSlot}</td>
                                        <td className="text-income">৳{(booking.advanceAmount || 0).toLocaleString()}</td>
                                        <td>
                                            <span className={`status-badge ${booking.status}`}>
                                                {booking.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                {advanceBookings.length > 0 && !loadingAdvance && (
                    <div className="total-advance-summary mt-3" style={{ 
                        display: 'flex', 
                        justifyContent: 'flex-end', 
                        alignItems: 'center', 
                        gap: '20px',
                        padding: '15px 20px',
                        background: '#fff',
                        border: '1px solid #eee',
                        borderRadius: '8px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                    }}>
                        <button 
                            className="transfer-mini-btn"
                            onClick={() => setShowBkashTransferModal(true)}
                            title="Transfer to My Account"
                            disabled={!balance?.bkashAdvanceBalance || balance.bkashAdvanceBalance <= 0}
                            style={{ margin: 0 }}
                        >
                            💸 Transfer to My Account
                        </button>
                        <span style={{ fontWeight: 'bold', color: '#555' }}>Total Advance Balance:</span>
                        <strong style={{ fontSize: '1.4rem', color: '#28a745' }}>
                            ৳{advanceBookings.reduce((sum, b) => sum + (b.advanceAmount || 0), 0).toLocaleString()}
                        </strong>
                    </div>
                )}
            </div>

            {/* Admin Users Section */}
            <div className="admin-section mt-5 pt-4 border-top">
                <h3 className="section-title">Admin Quick Transfer</h3>
                <p className="section-subtitle">Easily transfer funds to other admin users</p>
                
                <div className="admin-grid mt-4">
                    {adminUsers.map((user) => (
                        <div key={user._id} className="admin-card">
                            <div className="admin-info">
                                <div className="admin-avatar">
                                    {user.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="admin-details" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <h4 style={{ margin: 0 }}>{user.name}</h4>
                                    <p style={{ margin: 0 }}>{user.role}</p>
                                    <small style={{ margin: 0 }}>{user.phone}</small>
                                    <div style={{ marginTop: '10px', fontSize: '0.85rem', fontWeight: 'bold', color: '#28a745', borderTop: '1px solid #eee', paddingTop: '10px' }}>
                                        Account Balance: ৳{user.currentBalance?.toLocaleString() || 0}
                                    </div>
                                </div>
                            </div>
                            <button 
                                className="quick-transfer-btn"
                                onClick={() => openQuickTransfer(user)}
                            >
                                Transfer
                            </button>
                        </div>
                    ))}
                    {adminUsers.length === 0 && <p className="text-muted">No other admin users found</p>}
                </div>
            </div>

            {/* Transfer Form */}
            <div className="transfer-section mt-5 pt-4 border-top">
                <h3 className="transfer-title">Transfer Funds</h3>
                <p className="transfer-subtitle">Transfer money to your own or another admin account</p>

                <form onSubmit={handleTransfer} className="transfer-form">
                    {/* Only Other User Account Transfer allowed here */}
                    <input type="hidden" name="transferType" value="other" />

                    <div className="form-row">
                        {transferData.transferType === 'other' && (
                            <div className="form-group">
                                <label htmlFor="toUserId">Select Recipient *</label>
                                <select
                                    id="toUserId"
                                    name="toUserId"
                                    value={transferData.toUserId}
                                    onChange={handleInputChange}
                                    required
                                    className="form-select"
                                >
                                    <option value="">-- Choose Admin User --</option>
                                    {adminUsers.filter(u => u._id !== session.user.id).map((user) => (
                                        <option key={user._id} value={user._id}>
                                            {user.name} ({user.role}) - {user.phone}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div className="form-group">
                            <label htmlFor="amount">Amount (৳) *</label>
                            <input
                                type="number"
                                id="amount"
                                name="amount"
                                value={transferData.amount}
                                onChange={handleInputChange}
                                placeholder="Enter amount"
                                min="1"
                                max={balance?.balance || 0}
                                required
                                className="form-input"
                            />
                            <small className="form-hint">
                                Available: ৳{balance?.balance?.toLocaleString() || 0}
                            </small>
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="notes">Notes (Optional)</label>
                        <textarea
                            id="notes"
                            name="notes"
                            value={transferData.notes}
                            onChange={handleInputChange}
                            placeholder="Add a note for this transfer"
                            rows="2"
                            className="form-textarea"
                        />
                    </div>

                    {((transferData.transferType === 'other' && selectedUser) || transferData.transferType === 'own') && transferData.amount && (
                        <div className="transfer-preview">
                            <h4>Transfer Preview</h4>
                            <div className="preview-row">
                                <span>Target:</span>
                                <strong>{transferData.transferType === 'own' ? "Your Own Account (Direct)" : selectedUser?.name}</strong>
                            </div>
                            <div className="preview-row">
                                <span>Amount:</span>
                                <strong className="amount">৳{parseFloat(transferData.amount).toLocaleString()}</strong>
                            </div>
                            <div className="preview-row">
                                <span>Status:</span>
                                <strong>{transferData.transferType === 'own' ? "Instant" : "Pending Approval"}</strong>
                            </div>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={transferring || (transferData.transferType === 'other' && !transferData.toUserId) || !transferData.amount || parseFloat(transferData.amount) > balance?.balance}
                        className="tertiary-button"
                    >
                        {transferring ? "Processing..." : transferData.transferType === 'own' ? "Transfer to Own Account" : "Send Transfer Request"}
                    </button>
                </form>
            </div>

            {/* Transfer Modal (Popup) */}
            {showTransferModal && selectedAdmin && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3>Transfer to {selectedAdmin.name}</h3>
                            <button className="close-btn" onClick={() => setShowTransferModal(false)}>×</button>
                        </div>
                        <form onSubmit={handleTransfer} className="modal-form">
                            <div className="form-group">
                                <label>Amount (৳)</label>
                                <input 
                                    type="number" 
                                    name="amount"
                                    value={transferData.amount}
                                    onChange={handleInputChange}
                                    placeholder="Enter amount"
                                    min="1"
                                    max={balance?.balance}
                                    required
                                    autoFocus
                                />
                                <small>Available: ৳{balance?.balance?.toLocaleString()}</small>
                            </div>
                            <div className="form-group">
                                <label>Notes (Optional)</label>
                                <textarea 
                                    name="notes"
                                    value={transferData.notes}
                                    onChange={handleInputChange}
                                    placeholder="What is this for?"
                                    rows="3"
                                />
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="cancel-btn" onClick={() => setShowTransferModal(false)}>Cancel</button>
                                <button type="submit" className="confirm-btn" disabled={transferring || !transferData.amount}>
                                    {transferring ? "Processing..." : "Send Transfer Request"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}


            {showBkashTransferModal && (
                <div className="modal-overlay">
                    <div className="modal-content modal-form">
                        <div className="modal-header">
                            <h3>Transfer from Bkash Advance</h3>
                            <button className="close-btn" onClick={() => setShowBkashTransferModal(false)}>×</button>
                        </div>
                        <form onSubmit={handleBkashTransfer}>
                            <div style={{ background: '#f8f9fa', padding: '1rem', borderRadius: '10px', marginBottom: '1.5rem', border: '1px solid #e9ecef' }}>
                                <p style={{ margin: 0, fontSize: '0.9rem', color: '#666' }}>Transfer funds from the Bkash advance pool directly into your own account balance.</p>
                                <div style={{ marginTop: '0.8rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontWeight: '600' }}>Available Pool:</span>
                                    <strong style={{ color: '#28a745', fontSize: '1.1rem' }}>৳{balance?.bkashAdvanceBalance?.toLocaleString() || 0}</strong>
                                </div>
                            </div>
                            
                            <div className="form-group">
                                <label>Amount to Transfer (৳)</label>
                                <input 
                                    type="number" 
                                    placeholder="Enter amount"
                                    value={bkashAmount}
                                    onChange={(e) => setBkashAmount(e.target.value)}
                                    max={balance?.bkashAdvanceBalance}
                                    min="1"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Notes (Optional)</label>
                                <textarea 
                                    placeholder="Add a reason for this transfer"
                                    value={bkashNotes}
                                    onChange={(e) => setBkashNotes(e.target.value)}
                                    rows="2"
                                />
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="cancel-btn" onClick={() => setShowBkashTransferModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="confirm-btn" disabled={transferring || !bkashAmount}>
                                    {transferring ? "Processing..." : "Confirm Transfer"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}


            <style jsx>{`
                .mt-5 { margin-top: 4rem; }
                .pt-4 { padding-top: 2rem; }
                .border-top { border-top: 1px solid #eee; }
                .mt-3 { margin-top: 1.5rem; }
                .mt-4 { margin-top: 2rem; }
                .ml-2 { margin-left: 0.5rem; }
                .flex-between { display: flex; justify-content: space-between; align-items: center; }
                .flex { display: flex; }
                .gap-4 { gap: 1rem; }
                .gap-2 { gap: 0.5rem; }
                .align-center { align-items: center; }
                .pointer { cursor: pointer; }
                .font-bold { font-weight: bold; }
                .text-right { text-align: right; }
                .text-muted { color: #6c757d; }
                
                .status-badge {
                    padding: 4px 8px;
                    border-radius: 4px;
                    font-size: 12px;
                    text-transform: capitalize;
                }
                .balance-card.bkash-advance { background: #e8f5e9; border-left: 4px solid #4caf50; position: relative; }
                .balance-card.bkash-advance .balance-icon { background: #c8e6c9; color: #2e7d32; }
                
                .transfer-mini-btn {
                    background: #2e7d32;
                    color: white;
                    border: none;
                    padding: 5px 10px;
                    border-radius: 6px;
                    font-size: 0.75rem;
                    font-weight: 600;
                    cursor: pointer;
                    margin-top: 8px;
                    transition: all 0.2s;
                }
                .transfer-mini-btn:hover:not(:disabled) { background: #1b5e20; transform: scale(1.05); }
                .transfer-mini-btn:disabled { background: #ccc; cursor: not-allowed; }
                
                .pending-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 2rem;
                }
                @media (max-width: 768px) {
                    .pending-grid { grid-template-columns: 1fr; }
                }
                
                .column-subtitle {
                    font-size: 1.1rem;
                    color: #555;
                    margin-bottom: 1rem;
                    padding-bottom: 0.5rem;
                    border-bottom: 2px solid #f0f0f0;
                }
                
                .pending-transfers-list {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }
                
                .transfer-request-card {
                    background: #fff;
                    border: 1px solid #e0e0e0;
                    border-radius: 12px;
                    padding: 1rem;
                    transition: all 0.2s;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.02);
                }
                .transfer-request-card:hover {
                    box-shadow: 0 4px 8px rgba(0,0,0,0.05);
                    border-color: #d0d0d0;
                }
                .transfer-request-card.outgoing {
                    border-left: 4px solid #ffc107;
                }
                
                .transfer-request-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 0.8rem;
                }
                
                .sender-info {
                    display: flex;
                    gap: 0.8rem;
                    align-items: center;
                }
                
                .sender-avatar {
                    width: 40px;
                    height: 40px;
                    background: #e3f2fd;
                    color: #1976d2;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: bold;
                }
                .sender-avatar.recipient {
                    background: #fff3e0;
                    color: #e65100;
                }
                
                .sender-info h4 { margin: 0; font-size: 0.95rem; text-align: left; }
                .sender-phone { margin: 5px 0 0; font-size: 0.85rem; color: #fff; font-size: 18px; }
                
                .transfer-status {
                    font-size: 0.75rem;
                    padding: 2px 8px;
                    border-radius: 12px;
                    font-weight: 600;
                }
                .transfer-status.pending { background: #fff8e1; color: #f57f17; }
                
                .transfer-notes {
                    background: #f9f9f9;
                    padding: 0.5rem;
                    border-radius: 6px;
                    font-style: italic;
                    font-size: 0.85rem;
                    margin-bottom: 0.8rem;
                    color: #555;
                }
                
                .transfer-date { font-size: 0.75rem; color: #999; margin: 0; }
                
                .transfer-actions {
                    display: flex;
                    gap: 0.5rem;
                    margin-top: 0.5rem;
                }
                
                .approve-btn, .reject-btn {
                    flex: 1;
                    padding: 6px;
                    border-radius: 6px;
                    border: none;
                    font-weight: 600;
                    font-size: 0.85rem;
                    cursor: pointer;
                    transition: opacity 0.2s;
                }
                .approve-btn { background: #4caf50; color: white; }
                .reject-btn { background: #f44336; color: white; }
                .approve-btn:hover, .reject-btn:hover { opacity: 0.9; }
                
                /* Admin Grid */
                .admin-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
                    gap: 1.5rem;
                }
                
                .admin-card {
                    background: #fff;
                    border: 1px solid #eee;
                    border-radius: 15px;
                    padding: 1.2rem;
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                    transition: transform 0.2s;
                }
                .admin-card:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 5px 15px rgba(0,0,0,0.05);
                }
                
                .admin-info { display: flex; gap: 1rem; align-items: center; }
                .admin-avatar {
                    width: 50px;
                    height: 50px;
                    background: #f0f0f0;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.2rem;
                    font-weight: bold;
                    color: #333;
                }
                .admin-details h4 { margin: 0; font-size: 1rem; }
                .admin-details p { margin: 0; font-size: 0.85rem; color: #007bff; }
                .admin-details small { color: #888; }
                
                .quick-transfer-btn {
                    background: #f0f7ff;
                    color: #007bff;
                    border: 1px solid #cce5ff;
                    padding: 8px;
                    border-radius: 8px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .quick-transfer-btn:hover { background: #007bff; color: white; }
                
                /* Modal Styles */
                .modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0,0,0,0.5);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                    backdrop-filter: blur(4px);
                }
                
                .modal-content {
                    background: white;
                    width: 90%;
                    max-width: 450px;
                    border-radius: 20px;
                    padding: 2rem;
                    box-shadow: 0 20px 40px rgba(0,0,0,0.2);
                }
                
                .modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 1.5rem;
                }
                .modal-header h3 { margin: 0; font-size: 1.25rem; }
                .close-btn { background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #999; }
                
                .modal-form .form-group { margin-bottom: 1.2rem; }
                .modal-form label { display: block; margin-bottom: 0.5rem; font-weight: 600; font-size: 0.9rem; }
                .modal-form input, .modal-form textarea {
                    width: 100%;
                    padding: 12px;
                    border: 1px solid #ddd;
                    border-radius: 10px;
                    font-size: 1rem;
                }
                .modal-form small { color: #666; display: block; margin-top: 0.4rem; }
                
                .modal-actions {
                    display: flex;
                    gap: 1rem;
                    margin-top: 2rem;
                }
                .cancel-btn {
                    flex: 1;
                    padding: 12px;
                    border-radius: 10px;
                    border: 1px solid #ddd;
                    background: #f8f9fa;
                    cursor: pointer;
                }
                .confirm-btn {
                    flex: 2;
                    padding: 12px;
                    border-radius: 10px;
                    border: none;
                    background: #007bff;
                    color: white;
                    font-weight: 600;
                    cursor: pointer;
                }
                .confirm-btn:disabled { background: #ccc; cursor: not-allowed; }
                
                .transfer-section {
                    padding-bottom: 100px;
                }
                .tertiary-button {
                    width: 100%;
                    margin-top: 20px;
                    justify-content: center;
                }
                
                .transfer-preview {
                    background: #f8f9fa;
                    padding: 15px;
                    border-radius: 8px;
                    margin-bottom: 20px;
                    border: 1px dashed #ddd;
                }
                .preview-row {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 5px;
                }
                .amount { color: #28a745; font-size: 1.1rem; }
                
                .text-button {
                    background: none;
                    border: none;
                    color: #007bff;
                    cursor: pointer;
                    text-decoration: underline;
                    padding: 0;
                }
            `}</style>
        </div>
    );
};

export default Accounts;