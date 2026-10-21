"use client";
import { useState } from "react";
import AdminBookings from "../AdminBooking";
// import LoginUserTransactions from "./LoginUserTransactions";
import TransactionsTable from "../TransactionsTable";
import Accounts from "../Accounts";
import TransferHistory from "../TransferHistory";
import ArenasAccount from "../ArenasAccount";
import BookingByDate from "../BookingByDate";

export default function AdminTabs() {
    const [activeTab, setActiveTab] = useState("bookings");

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
                <button
                    className={activeTab === "accounts" ? "active" : "secondary-button secondary-button--small"}
                    onClick={() => setActiveTab("accounts")}
                >
                    My Account
                </button>
                {/* <button
                    className={activeTab === "my-transactions" ? "active" : "secondary-button secondary-button--small"}
                    onClick={() => setActiveTab("my-transactions")}
                >
                    My Transactions
                </button> */}
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
                <button
                    className={activeTab === "arenas-account" ? "active" : "secondary-button secondary-button--small"}
                    onClick={() => setActiveTab("arenas-account")}
                >
                    Arenas Account
                </button>
            </div>

            {activeTab === "bookings" && <AdminBookings />}
            {activeTab === "booking-by-date" && <BookingByDate />}
            {activeTab === "accounts" && <Accounts />}
            {/* {activeTab === "my-transactions" && <LoginUserTransactions />} */}
            {activeTab === "transactions" && <TransactionsTable />}
            {activeTab === "transfer-history" && <TransferHistory />}
            {activeTab === "arenas-account" && <ArenasAccount />}
        </>
    );
}
