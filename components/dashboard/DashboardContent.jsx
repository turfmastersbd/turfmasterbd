"use client";

import AdminTabs from "./AdminTab/AdminTab";
import SuperAdminTabs from "./SuperAdminTabs";
import GeneralAdminTabs from "./GeneralAdminTab/GeneralAdminTab";
import UserBookings from "./UserBookings";


export default function DashboardContent({ role }) {

  if (role === "REGULAR_CUSTOMER") return <UserBookings />;
  if (role === "SPECIAL_CUSTOMER") return <UserBookings />;
  if (role === "GENERAL_ADMIN") {
    return <GeneralAdminTabs />;
  }
  if (role === "SUPER_ADMIN") {
    return <SuperAdminTabs />;
  }

  return <AdminTabs />;
}
