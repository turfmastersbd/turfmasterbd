"use client";

import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import Loading from "../shared/Loading";
import { TIME_SLOTS } from "@/lib/pricing";

const ManageSlotPrice = () => {
    const [pricingData, setPricingData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedArena, setSelectedArena] = useState("Turf Masters BD");
    const [activeDayTab, setActiveDayTab] = useState("regular"); // "regular" | "friday" | "saturday"

    const [arenaPricing, setArenaPricing] = useState({
        arenaName: "Turf Masters BD",
        defaultPrice: 2000,
        timeSlots: [],
        fridayDefaultPrice: null,
        fridayTimeSlots: [],
        saturdayDefaultPrice: null,
        saturdayTimeSlots: []
    });
    const [saving, setSaving] = useState(false);

    const fetchPricing = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/pricing");
            const data = await res.json();
            if (res.ok) {
                setPricingData(data);
                const current = Array.isArray(data)
                    ? data.find(p => p.arenaName === selectedArena) || data[0]
                    : data;
                if (current) {
                    setArenaPricing({
                        arenaName: current.arenaName || selectedArena,
                        defaultPrice: current.defaultPrice || 2000,
                        timeSlots: current.timeSlots || [],
                        fridayDefaultPrice: current.fridayDefaultPrice ?? null,
                        fridayTimeSlots: current.fridayTimeSlots || [],
                        saturdayDefaultPrice: current.saturdayDefaultPrice ?? null,
                        saturdayTimeSlots: current.saturdayTimeSlots || []
                    });
                } else {
                    setArenaPricing({
                        arenaName: selectedArena,
                        defaultPrice: 2000,
                        timeSlots: [],
                        fridayDefaultPrice: null,
                        fridayTimeSlots: [],
                        saturdayDefaultPrice: null,
                        saturdayTimeSlots: []
                    });
                }
            }
        } catch (err) {
            console.error("Error fetching pricing:", err);
            toast.error("Failed to fetch pricing data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPricing();
    }, [selectedArena]);

    // Handle Default Price for the active tab
    const handleDayDefaultPriceChange = (val) => {
        const numVal = val === "" ? null : Number(val);
        setArenaPricing(prev => {
            if (activeDayTab === "friday") {
                return { ...prev, fridayDefaultPrice: numVal };
            } else if (activeDayTab === "saturday") {
                return { ...prev, saturdayDefaultPrice: numVal };
            } else {
                return { ...prev, defaultPrice: Number(val) || 2000 };
            }
        });
    };

    // Handle Slot Price Change for the active tab
    const handleSlotPriceChange = (slot, price) => {
        const numPrice = price === "" ? "" : Number(price);

        setArenaPricing(prev => {
            let key = "timeSlots";
            if (activeDayTab === "friday") key = "fridayTimeSlots";
            if (activeDayTab === "saturday") key = "saturdayTimeSlots";

            const currentSlots = prev[key] || [];
            const existing = currentSlots.find(s => s.slot === slot);

            let newSlots;
            if (price === "") {
                newSlots = currentSlots.filter(s => s.slot !== slot);
            } else if (existing) {
                newSlots = currentSlots.map(s => s.slot === slot ? { ...s, price: Number(price) } : s);
            } else {
                newSlots = [...currentSlots, { slot, price: Number(price) }];
            }

            return { ...prev, [key]: newSlots };
        });
    };

    // Quick Action: Copy Regular overrides to Friday or Saturday
    const handleCopyFromRegular = () => {
        const regularOverrides = (arenaPricing.timeSlots || []).map(s => ({ ...s }));
        const regularDefault = arenaPricing.defaultPrice;

        if (activeDayTab === "friday") {
            setArenaPricing(prev => ({
                ...prev,
                fridayDefaultPrice: prev.fridayDefaultPrice || regularDefault,
                fridayTimeSlots: regularOverrides
            }));
            toast.success("Copied Regular Day prices to Friday!");
        } else if (activeDayTab === "saturday") {
            setArenaPricing(prev => ({
                ...prev,
                saturdayDefaultPrice: prev.saturdayDefaultPrice || regularDefault,
                saturdayTimeSlots: regularOverrides
            }));
            toast.success("Copied Regular Day prices to Saturday!");
        }
    };

    // Quick Action: Clear overrides for active tab
    const handleClearOverrides = () => {
        let key = "timeSlots";
        if (activeDayTab === "friday") key = "fridayTimeSlots";
        if (activeDayTab === "saturday") key = "saturdayTimeSlots";

        setArenaPricing(prev => ({
            ...prev,
            [key]: []
        }));
        toast.success(`Cleared overrides for ${activeDayTab === 'regular' ? 'Regular Days' : activeDayTab === 'friday' ? 'Friday' : 'Saturday'}`);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // Clean up regular slots
            const cleanedTimeSlots = (arenaPricing.timeSlots || []).filter(s =>
                s.price && s.price !== arenaPricing.defaultPrice && s.price > 0
            );

            // Clean up Friday slots
            const effFridayDefault = arenaPricing.fridayDefaultPrice || arenaPricing.defaultPrice;
            const cleanedFridaySlots = (arenaPricing.fridayTimeSlots || []).filter(s =>
                s.price && s.price !== effFridayDefault && s.price > 0
            );

            // Clean up Saturday slots
            const effSaturdayDefault = arenaPricing.saturdayDefaultPrice || arenaPricing.defaultPrice;
            const cleanedSaturdaySlots = (arenaPricing.saturdayTimeSlots || []).filter(s =>
                s.price && s.price !== effSaturdayDefault && s.price > 0
            );

            const payload = {
                arenaName: selectedArena,
                defaultPrice: Number(arenaPricing.defaultPrice) || 2000,
                timeSlots: cleanedTimeSlots,
                fridayDefaultPrice: arenaPricing.fridayDefaultPrice ? Number(arenaPricing.fridayDefaultPrice) : null,
                fridayTimeSlots: cleanedFridaySlots,
                saturdayDefaultPrice: arenaPricing.saturdayDefaultPrice ? Number(arenaPricing.saturdayDefaultPrice) : null,
                saturdayTimeSlots: cleanedSaturdaySlots
            };

            const res = await fetch("/api/update-price", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (res.ok) {
                toast.success(`${selectedArena} all slot prices updated!`);
                fetchPricing();
            } else {
                toast.error(data.message || "Failed to update pricing");
            }
        } catch (err) {
            console.error("Save error:", err);
            toast.error("An error occurred while saving");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <Loading />;

    // Get current tab's active data
    let currentDefaultValue = "";
    let currentDefaultPlaceholder = arenaPricing.defaultPrice;
    let currentSlots = [];
    let currentEffectiveDefault = arenaPricing.defaultPrice;

    if (activeDayTab === "regular") {
        currentDefaultValue = arenaPricing.defaultPrice ?? "";
        currentDefaultPlaceholder = 2000;
        currentSlots = arenaPricing.timeSlots || [];
        currentEffectiveDefault = arenaPricing.defaultPrice || 2000;
    } else if (activeDayTab === "friday") {
        currentDefaultValue = arenaPricing.fridayDefaultPrice ?? "";
        currentDefaultPlaceholder = `Same as Regular (৳${arenaPricing.defaultPrice})`;
        currentSlots = arenaPricing.fridayTimeSlots || [];
        currentEffectiveDefault = arenaPricing.fridayDefaultPrice || arenaPricing.defaultPrice || 2000;
    } else if (activeDayTab === "saturday") {
        currentDefaultValue = arenaPricing.saturdayDefaultPrice ?? "";
        currentDefaultPlaceholder = `Same as Regular (৳${arenaPricing.defaultPrice})`;
        currentSlots = arenaPricing.saturdayTimeSlots || [];
        currentEffectiveDefault = arenaPricing.saturdayDefaultPrice || arenaPricing.defaultPrice || 2000;
    }

    return (
        <div className="manage-pricing">
            <h2 className="dashboard__title">Manage Arena Slot Pricing</h2>

            {/* Day Type Tabs */}
            <div className="pricing-day-tabs mt-4">
                <button
                    type="button"
                    className={`pricing-day-tab-btn ${activeDayTab === "regular" ? "active" : ""}`}
                    onClick={() => setActiveDayTab("regular")}
                >
                    <span>🗓️ Regular Days (Sun – Thu)</span>
                    <span className="pricing-day-badge">5 Days</span>
                </button>

                <button
                    type="button"
                    className={`pricing-day-tab-btn ${activeDayTab === "friday" ? "active" : ""}`}
                    onClick={() => setActiveDayTab("friday")}
                >
                    <span>🕌 Friday (শুক্রবার)</span>
                    <span className="pricing-day-badge">Weekend</span>
                </button>

                <button
                    type="button"
                    className={`pricing-day-tab-btn ${activeDayTab === "saturday" ? "active" : ""}`}
                    onClick={() => setActiveDayTab("saturday")}
                >
                    <span>⚽ Saturday (শনিবার)</span>
                    <span className="pricing-day-badge">Weekend</span>
                </button>
            </div>

            <div className="pricing-content">
                <div className="pricing-card">
                    <div className="day-header-meta">
                        <div>
                            <h4>
                                {activeDayTab === "regular" && "Regular Days (Sunday to Thursday) Pricing"}
                                {activeDayTab === "friday" && "Friday (শুক্রবার) Slot Pricing"}
                                {activeDayTab === "saturday" && "Saturday (শনিবার) Slot Pricing"}
                            </h4>
                            <p>
                                {activeDayTab === "regular" && "Baseline prices applied for Sunday, Monday, Tuesday, Wednesday, and Thursday."}
                                {activeDayTab === "friday" && "Custom prices applied automatically when users select any Friday date."}
                                {activeDayTab === "saturday" && "Custom prices applied automatically when users select any Saturday date."}
                            </p>
                        </div>

                        <div className="quick-actions-wrap">
                            {activeDayTab !== "regular" && (
                                <button
                                    type="button"
                                    className="quick-action-btn"
                                    onClick={handleCopyFromRegular}
                                    title="Copy regular weekday prices into this tab"
                                >
                                    📋 Copy from Regular Days
                                </button>
                            )}
                            {currentSlots.length > 0 && (
                                <button
                                    type="button"
                                    className="quick-action-btn"
                                    onClick={handleClearOverrides}
                                    title="Clear all slot price overrides for this tab"
                                >
                                    🔄 Clear Overrides
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="form-group mt-3">
                        <label>
                            {activeDayTab === "regular" && "Default Slot Price (৳):"}
                            {activeDayTab === "friday" && "Friday Default Slot Price (৳):"}
                            {activeDayTab === "saturday" && "Saturday Default Slot Price (৳):"}
                        </label>
                        <input
                            type="number"
                            className="form-input"
                            style={{ maxWidth: "320px" }}
                            value={currentDefaultValue}
                            placeholder={String(currentDefaultPlaceholder)}
                            onChange={(e) => handleDayDefaultPriceChange(e.target.value)}
                        />
                        <small className="form-hint">
                            {activeDayTab === "regular"
                                ? "Base price for slots without a specific override on regular weekdays (Sunday - Thursday)."
                                : "Default price applied for Friday/Saturday slots without individual overrides (leave blank to use regular default)."}
                        </small>
                    </div>

                    <div className="slots-grid">
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
                            <h4 style={{ margin: 0 }}>
                                {activeDayTab === "regular" && "Weekday Time Slot Overrides"}
                                {activeDayTab === "friday" && "Friday Time Slot Overrides"}
                                {activeDayTab === "saturday" && "Saturday Time Slot Overrides"}
                            </h4>
                            <span style={{ fontSize: "13px", color: "#64748b" }}>
                                Total slots: {TIME_SLOTS.length} | Overrides set: {currentSlots.length}
                            </span>
                        </div>

                        <div className="slots-table-container">
                            <table className="transactions-table">
                                <thead>
                                    <tr>
                                        <th>Time Slot</th>
                                        <th>Price (৳)</th>
                                        <th>Effective Price</th>
                                        <th>Status</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {TIME_SLOTS.map(slot => {
                                        const override = currentSlots.find(s => s.slot === slot);
                                        const hasCustomPrice = override && override.price !== "" && override.price !== null && override.price !== undefined;
                                        const isOverride = hasCustomPrice && override.price !== currentEffectiveDefault;
                                        const effectivePrice = hasCustomPrice ? override.price : currentEffectiveDefault;

                                        return (
                                            <tr key={slot}>
                                                <td style={{ fontWeight: 500 }}>{slot}</td>
                                                <td>
                                                    <input
                                                        type="number"
                                                        placeholder={String(currentEffectiveDefault)}
                                                        value={hasCustomPrice ? override.price : ""}
                                                        onChange={(e) => handleSlotPriceChange(slot, e.target.value)}
                                                        className="slot-price-input"
                                                    />
                                                </td>
                                                <td style={{ fontWeight: 600, color: "#247009" }}>
                                                    ৳{Number(effectivePrice).toLocaleString()}
                                                </td>
                                                <td>
                                                    {isOverride ? (
                                                        <span className="status-badge override">Custom ৳{override.price}</span>
                                                    ) : hasCustomPrice ? (
                                                        <span className="status-badge override">Custom ৳{override.price}</span>
                                                    ) : (
                                                        <span className={`status-badge ${activeDayTab === 'friday' ? 'friday' : activeDayTab === 'saturday' ? 'saturday' : 'default'}`}>
                                                            {activeDayTab === "regular"
                                                                ? "Default"
                                                                : arenaPricing[`${activeDayTab}DefaultPrice`]
                                                                    ? `${activeDayTab.toUpperCase()} Default`
                                                                    : "Regular Default"}
                                                        </span>
                                                    )}
                                                </td>
                                                <td>
                                                    {hasCustomPrice && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleSlotPriceChange(slot, "")}
                                                            style={{
                                                                background: "none",
                                                                border: "none",
                                                                color: "#ef4444",
                                                                cursor: "pointer",
                                                                fontSize: "12px",
                                                                fontWeight: 600
                                                            }}
                                                            title="Reset to default"
                                                        >
                                                            ✕ Reset
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="actions mt-4">
                        <button
                            type="button"
                            className="tertiary-button"
                            onClick={handleSave}
                            disabled={saving}
                            style={{ minWidth: "220px" }}
                        >
                            {saving ? "Saving All Pricing..." : "💾 Save All Pricing Configurations"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ManageSlotPrice;
