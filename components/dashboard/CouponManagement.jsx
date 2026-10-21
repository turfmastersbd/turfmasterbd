"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import Swal from "sweetalert2";

const CouponManagement = () => {
    const { data: session } = useSession();
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(true);

    // Standard Coupon Form State
    const [editingCoupon, setEditingCoupon] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        code: "",
        discount: 0,
        type: "fixed",
        description: "",
        active: true,
        minAmount: 0,
        maxUses: 100,
        validFrom: "",
        validUntil: "",
    });

    // Single Special Customer Discount State
    const [specialDiscount, setSpecialDiscount] = useState(null);
    const [showSpecialForm, setShowSpecialForm] = useState(false);
    const [specialFormData, setSpecialFormData] = useState({
        type: "fixed",
        discount: 0,
        active: true,
    });

    const fetchCoupons = async () => {
        try {
            setLoading(true);
            const response = await fetch("/api/coupons/all");
            const data = await response.json();

            if (response.ok) {
                const allCoupons = Array.isArray(data.coupons) ? data.coupons : [];
                setCoupons(allCoupons.filter(c => !c.isSpecialCustomer));
            } else {
                toast.error(data.message || "Failed to fetch coupons");
                setCoupons([]);
            }
        } catch (error) {
            console.error("Error fetching coupons:", error);
            toast.error("Failed to load coupons");
            setCoupons([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchSpecialDiscount = async () => {
        try {
            const response = await fetch("/api/coupons/special");
            const data = await response.json();
            if (response.ok && data.discount) {
                setSpecialDiscount(data.discount);
            } else {
                setSpecialDiscount(null);
            }
        } catch (error) {
            console.error("Error fetching special discount:", error);
        }
    };

    useEffect(() => {
        if (session) {
            fetchCoupons();
            fetchSpecialDiscount();
        }
    }, [session]);

    // Standard Coupon Handlers
    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === "checkbox" ? checked :
                (name === "discount" || name === "minAmount" || name === "maxUses") ?
                    Number(value) : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.code || !formData.discount || !formData.description) {
            toast.error("Please fill all required fields");
            return;
        }

        try {
            const url = editingCoupon
                ? `/api/coupons?code=${editingCoupon.code}`
                : "/api/coupons/create";

            const method = editingCoupon ? "PUT" : "POST";

            const response = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (response.ok) {
                toast.success(editingCoupon ? "Coupon updated successfully" : "Coupon created successfully");
                fetchCoupons();
                resetForm();
            } else {
                toast.error(data.message || "Failed to save coupon");
            }
        } catch (error) {
            console.error("Error saving coupon:", error);
            toast.error("Failed to save coupon");
        }
    };

    const handleEdit = (coupon) => {
        setEditingCoupon(coupon);
        setFormData({
            code: coupon.code,
            discount: coupon.discount,
            type: coupon.type,
            description: coupon.description,
            active: coupon.active,
            minAmount: coupon.minAmount,
            maxUses: coupon.maxUses,
            validFrom: coupon.validFrom ? new Date(coupon.validFrom).toISOString().split('T')[0] : "",
            validUntil: coupon.validUntil ? new Date(coupon.validUntil).toISOString().split('T')[0] : "",
        });
        setShowForm(true);
    };

    const handleDelete = async (code) => {
        const result = await Swal.fire({
            title: "Are you sure?",
            text: "Are you sure you want to delete this coupon?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#3085d6",
            confirmButtonText: "Yes, delete it!",
            cancelButtonText: "Cancel"
        });

        if (!result.isConfirmed) {
            return;
        }

        try {
            const response = await fetch(`/api/coupons?code=${code}`, {
                method: "DELETE",
            });

            const data = await response.json();

            if (response.ok) {
                toast.success("Coupon deleted successfully");
                fetchCoupons();
            } else {
                toast.error(data.message || "Failed to delete coupon");
            }
        } catch (error) {
            console.error("Error deleting coupon:", error);
            toast.error("Failed to delete coupon");
        }
    };

    const resetForm = () => {
        setEditingCoupon(null);
        setShowForm(false);
        setFormData({
            code: "",
            discount: 0,
            type: "fixed",
            description: "",
            active: true,
            minAmount: 0,
            maxUses: 100,
            validFrom: "",
            validUntil: "",
        });
    };

    // Single Special Customer Discount Handlers
    const handleSpecialInputChange = (e) => {
        const { name, value } = e.target;
        setSpecialFormData(prev => ({
            ...prev,
            [name]: name === "discount" ? Number(value) : value
        }));
    };

    const handleSpecialSubmit = async (e) => {
        e.preventDefault();

        if (!specialFormData.discount || specialFormData.discount <= 0) {
            toast.error("Please enter a valid discount value");
            return;
        }

        try {
            const response = await fetch("/api/coupons/special", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: specialFormData.type,
                    discount: specialFormData.discount,
                    active: specialFormData.active,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                toast.success("Special Customer Discount saved successfully");
                fetchSpecialDiscount();
                resetSpecialForm();
            } else {
                toast.error(data.message || "Failed to save discount");
            }
        } catch (error) {
            console.error("Error saving special discount:", error);
            toast.error("Failed to save special discount");
        }
    };

    const handleEditSpecial = () => {
        if (specialDiscount) {
            setSpecialFormData({
                type: specialDiscount.type,
                discount: specialDiscount.discount,
                active: specialDiscount.active,
            });
            setShowSpecialForm(true);
        }
    };

    const handleToggleSpecialStatus = async () => {
        if (!specialDiscount) return;
        try {
            const response = await fetch("/api/coupons/special", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: specialDiscount.type,
                    discount: specialDiscount.discount,
                    active: !specialDiscount.active,
                }),
            });

            if (response.ok) {
                toast.success(`Special Customer Discount ${!specialDiscount.active ? "activated" : "deactivated"}`);
                fetchSpecialDiscount();
            }
        } catch (error) {
            toast.error("Failed to update status");
        }
    };

    const handleDeleteSpecial = async () => {
        const result = await Swal.fire({
            title: "Are you sure?",
            text: "Are you sure you want to delete Special Customer Discount?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#3085d6",
            confirmButtonText: "Yes, delete it!",
            cancelButtonText: "Cancel"
        });

        if (!result.isConfirmed) return;

        try {
            const response = await fetch("/api/coupons/special", {
                method: "DELETE",
            });

            if (response.ok) {
                toast.success("Special Customer Discount deleted successfully");
                setSpecialDiscount(null);
                resetSpecialForm();
            } else {
                toast.error("Failed to delete special discount");
            }
        } catch (error) {
            toast.error("Error deleting special discount");
        }
    };

    const resetSpecialForm = () => {
        setShowSpecialForm(false);
        setSpecialFormData({
            type: "fixed",
            discount: 0,
            active: true,
        });
    };

    if (loading) {
        return <div className="loading">Loading coupons...</div>;
    }

    return (
        <div className="coupon-management">
            {/* Standard Coupon Management Section */}
            <div className="coupon-header">
                <h2 className="coupon-title">Coupon Management</h2>
                <button
                    className="primary-button-coupon"
                    onClick={() => {
                        resetForm();
                        setShowForm(!showForm);
                    }}
                >
                    {showForm ? "Cancel" : "Add New Coupon"}
                </button>
            </div>

            {showForm && (
                <div className="coupon-form-card">
                    <h3>{editingCoupon ? "Edit Coupon" : "Create New Coupon"}</h3>
                    <form onSubmit={handleSubmit} className="coupon-form">
                        <div className="form-row">
                            <div className="form-group">
                                <label>Coupon Code *</label>
                                <input
                                    type="text"
                                    name="code"
                                    value={formData.code}
                                    onChange={handleInputChange}
                                    placeholder="e.g., SAVE50"
                                    disabled={!!editingCoupon}
                                    required
                                    style={{ textTransform: 'uppercase' }}
                                />
                            </div>

                            <div className="form-group">
                                <label>Discount Type *</label>
                                <select
                                    name="type"
                                    value={formData.type}
                                    onChange={handleInputChange}
                                    required
                                >
                                    <option value="fixed">Fixed Amount</option>
                                    <option value="percentage">Percentage</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Discount Value *</label>
                                <input
                                    type="number"
                                    name="discount"
                                    value={formData.discount}
                                    onChange={handleInputChange}
                                    placeholder={formData.type === "percentage" ? "10" : "50"}
                                    min="0"
                                    required
                                />
                                <small>{formData.type === "percentage" ? "%" : "৳"}</small>
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Description *</label>
                            <input
                                type="text"
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                placeholder="e.g., Get 50 Taka off on your booking"
                                required
                            />
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Minimum Amount</label>
                                <input
                                    type="number"
                                    name="minAmount"
                                    value={formData.minAmount}
                                    onChange={handleInputChange}
                                    placeholder="0"
                                    min="0"
                                />
                            </div>

                            <div className="form-group">
                                <label>Max Uses</label>
                                <input
                                    type="number"
                                    name="maxUses"
                                    value={formData.maxUses}
                                    onChange={handleInputChange}
                                    placeholder="100"
                                    min="1"
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Valid From</label>
                                <input
                                    type="date"
                                    name="validFrom"
                                    value={formData.validFrom}
                                    onChange={handleInputChange}
                                />
                            </div>

                            <div className="form-group">
                                <label>Valid Until</label>
                                <input
                                    type="date"
                                    name="validUntil"
                                    value={formData.validUntil}
                                    onChange={handleInputChange}
                                />
                            </div>
                        </div>

                        <div className="form-group checkbox-group">
                            <label>
                                <input
                                    type="checkbox"
                                    name="active"
                                    checked={formData.active}
                                    onChange={handleInputChange}
                                />
                                Active
                            </label>
                        </div>

                        <div className="form-actions">
                            <button type="submit" className="primary-button-coupon">
                                {editingCoupon ? "Update Coupon" : "Create Coupon"}
                            </button>
                            <button type="button" className="secondary-button-coupon" onClick={resetForm}>
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="coupons-grid">
                {coupons.length === 0 ? (
                    <p className="no-data">No standard coupons found. Create your first coupon!</p>
                ) : (
                    coupons.map((coupon) => (
                        <div key={coupon.code} className={`coupon-card ${!coupon.active ? 'inactive' : ''}`}>
                            <div className="coupon-header-row">
                                <h3 className="coupon-code">{coupon.code}</h3>
                                <span className={`status-badge ${coupon.active ? 'active' : 'inactive'}`}>
                                    {coupon.active ? 'Active' : 'Inactive'}
                                </span>
                            </div>

                            <p className="coupon-description">{coupon.description}</p>

                            <div className="coupon-details">
                                <div className="detail-item">
                                    <span className="label">Discount:</span>
                                    <span className="value">
                                        {coupon.type === "percentage"
                                            ? `${coupon.discount}%`
                                            : `৳${coupon.discount}`}
                                    </span>
                                </div>

                                {coupon.minAmount > 0 && (
                                    <div className="detail-item">
                                        <span className="label">Min Amount:</span>
                                        <span className="value">৳{coupon.minAmount}</span>
                                    </div>
                                )}

                                <div className="detail-item">
                                    <span className="label">Usage:</span>
                                    <span className="value">
                                        {coupon.usedCount || 0} / {coupon.maxUses}
                                    </span>
                                </div>

                                {coupon.validFrom && (
                                    <div className="detail-item">
                                        <span className="label">Valid From:</span>
                                        <span className="value">
                                            {new Date(coupon.validFrom).toLocaleDateString()} ({new Date(coupon.validFrom).toLocaleDateString('en-US', { weekday: 'short' })})
                                        </span>
                                    </div>
                                )}

                                {coupon.validUntil && (
                                    <div className="detail-item">
                                        <span className="label">Valid Until:</span>
                                        <span className="value">
                                            {new Date(coupon.validUntil).toLocaleDateString()} ({new Date(coupon.validUntil).toLocaleDateString('en-US', { weekday: 'short' })})
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="coupon-actions">
                                <button
                                    className="edit-button"
                                    onClick={() => handleEdit(coupon)}
                                >
                                    Edit
                                </button>
                                <button
                                    className="delete-button"
                                    onClick={() => handleDelete(coupon.code)}
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Special Customer Discount Section */}
            <div className="special-discount-section">
                <div className="special-discount-header">
                    <div className="special-discount-title-wrap">
                        <h2 className="special-discount-title">Special Customer Discount</h2>
                        <span className="special-customer-badge">⭐ Auto-Applied for Special Customers</span>
                    </div>
                    {!specialDiscount && !showSpecialForm && (
                        <button
                            className="primary-button-special"
                            onClick={() => {
                                setSpecialFormData({ type: "fixed", discount: 0, active: true });
                                setShowSpecialForm(true);
                            }}
                        >
                            + Set Special Discount
                        </button>
                    )}
                    {showSpecialForm && (
                        <button
                            className="secondary-button-coupon"
                            onClick={resetSpecialForm}
                        >
                            Cancel
                        </button>
                    )}
                </div>

                {showSpecialForm && (
                    <div className="coupon-form-card special-form-card">
                        <h3>{specialDiscount ? "Edit Special Customer Discount" : "Set Special Customer Discount"}</h3>
                        <form onSubmit={handleSpecialSubmit} className="coupon-form">
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Discount Type *</label>
                                    <select
                                        name="type"
                                        value={specialFormData.type}
                                        onChange={handleSpecialInputChange}
                                        required
                                    >
                                        <option value="fixed">Fixed Amount</option>
                                        <option value="percentage">Percentage</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>Discount Value *</label>
                                    <input
                                        type="number"
                                        name="discount"
                                        value={specialFormData.discount}
                                        onChange={handleSpecialInputChange}
                                        placeholder={specialFormData.type === "percentage" ? "e.g., 10" : "e.g., 100"}
                                        min="1"
                                        required
                                    />
                                    <small>
                                        {specialFormData.type === "percentage"
                                            ? "Discount percentage auto-applied to all Special Customers (e.g. 10%)"
                                            : "Discount amount auto-applied to all Special Customers in Taka (e.g. ৳100)"}
                                    </small>
                                </div>
                            </div>

                            <div className="form-actions">
                                <button type="submit" className="primary-button-special">
                                    {specialDiscount ? "Update Discount" : "Save Discount"}
                                </button>
                                <button type="button" className="secondary-button-coupon" onClick={resetSpecialForm}>
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                <div className="special-coupons-grid">
                    {!specialDiscount ? (
                        <p className="no-data">No Special Customer Discount set. Click "+ Set Special Discount" to create one!</p>
                    ) : (
                        <div className={`coupon-card special-card ${!specialDiscount.active ? 'inactive' : ''}`}>
                            <div className="coupon-header-row">
                                <span className="special-card-tag">⭐ Special Customer Discount Rule</span>
                                <span className={`status-badge ${specialDiscount.active ? 'active' : 'inactive'}`}>
                                    {specialDiscount.active ? 'Active' : 'Inactive'}
                                </span>
                            </div>

                            <div className="special-discount-value-display">
                                <span className="discount-amount">
                                    {specialDiscount.type === "percentage"
                                        ? `${specialDiscount.discount}% OFF`
                                        : `৳${specialDiscount.discount} OFF`}
                                </span>
                                <span className="discount-type-label">
                                    Auto-applied for all Special Customers ({specialDiscount.type === "percentage" ? "Percentage Discount" : "Fixed Amount Discount"})
                                </span>
                            </div>

                            <div className="coupon-actions">
                                <button
                                    className="edit-button"
                                    onClick={handleEditSpecial}
                                >
                                    Edit Discount
                                </button>
                                <button
                                    className="secondary-button-coupon"
                                    onClick={handleToggleSpecialStatus}
                                    style={{ fontSize: "12px", padding: "6px 12px" }}
                                >
                                    {specialDiscount.active ? "Deactivate" : "Activate"}
                                </button>
                                <button
                                    className="delete-button"
                                    onClick={handleDeleteSpecial}
                                >
                                    Remove
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CouponManagement;
