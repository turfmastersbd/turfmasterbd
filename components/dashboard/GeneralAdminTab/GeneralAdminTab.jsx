"use client";
import { useState } from "react";
import AdminBookings from "../AdminBooking";
import AdminUsers from "../AdminUsers";
import TransactionsTable from "../TransactionsTable";
import Accounts from "../Accounts";
import TransferHistory from "../TransferHistory";
import CouponManagement from "../CouponManagement";
import ArenasAccount from "../ArenasAccount";
import ManageSlotPrice from "../ManageSlotPrice";
import BookingByDate from "../BookingByDate";

import { useSession } from "next-auth/react";
import { hasPermission } from "@/lib/hasPermissions";
import { PERMISSIONS } from "@/lib/permissions";


export default function AdminTabs() {
    const [activeTab, setActiveTab] = useState("bookings");
    const { data: session } = useSession();
    const role = session?.user?.role;

    return (
        <>
            <div className="dashboard__tabs">
                <button
                    className={activeTab === "bookings" ? "active" : "secondary-button secondary-button--small"}
                    onClick={() => setActiveTab("bookings")}
                >
                    All Bookings
                </button>
                <button
                    className={activeTab === "booking-by-date" ? "active" : "secondary-button secondary-button--small"}
                    onClick={() => setActiveTab("booking-by-date")}
                >
                    Booking BY Date
                </button>
                {hasPermission(role, PERMISSIONS.MANAGE_USERS) && (
                    <button
                        className={activeTab === "users" ? "active" : "secondary-button secondary-button--small"}
                        onClick={() => setActiveTab("users")}
                    >
                        All Users
                    </button>
                )}
                <button
                    className={activeTab === "accounts" ? "active" : "secondary-button secondary-button--small"}
                    onClick={() => setActiveTab("accounts")}
                >
                    My Account
                </button>
                <button
                    className={activeTab === "transactions" ? "active" : "secondary-button secondary-button--small"}
                    onClick={() => setActiveTab("transactions")}
                >
                    All Transaction
                </button>

                <button
                    className={activeTab === "transfer-history" ? "active" : "secondary-button secondary-button--small"}
                    onClick={() => setActiveTab("transfer-history")}
                >
                    Transfer History
                </button>
                {hasPermission(role, PERMISSIONS.MANAGE_COUPON) && (
                    <button
                        className={activeTab === "coupons" ? "active" : "secondary-button secondary-button--small"}
                        onClick={() => setActiveTab("coupons")}
                    >
                        Coupons
                    </button>
                )}
                <button
                    className={activeTab === "arenas-account" ? "active" : "secondary-button secondary-button--small"}
                    onClick={() => setActiveTab("arenas-account")}
                >
                    Arenas Account
                </button>
                {hasPermission(role, PERMISSIONS.MANAGE_PRICING) && (
                    <button
                        className={activeTab === "manage-pricing" ? "active" : "secondary-button secondary-button--small"}
                        onClick={() => setActiveTab("manage-pricing")}
                    >
                        Manage Slot Price
                    </button>
                )}
            </div>

            {activeTab === "bookings" && <AdminBookings />}
            {activeTab === "booking-by-date" && <BookingByDate />}
            {activeTab === "users" && <AdminUsers />}
            {activeTab === "accounts" && <Accounts />}
            {activeTab === "transactions" && <TransactionsTable />}
            {activeTab === "transfer-history" && <TransferHistory />}
            {activeTab === "coupons" && <CouponManagement />}
            {activeTab === "arenas-account" && <ArenasAccount />}
            {activeTab === "manage-pricing" && <ManageSlotPrice />}
        </>
    );
}
