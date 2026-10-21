"use client";
import { useSession } from "next-auth/react";

const roleLabelMap = {
  REGULAR_CUSTOMER: "User",
  SPECIAL_CUSTOMER: "Special User",
  MANAGER: "Manager",
  GENERAL_ADMIN: "General Admin",
  VIEWER: "Inspect Admin",
  SUPER_ADMIN: "Super Admin",
};

const DashboardProfileInfo = () => {
  const { data: session } = useSession();

  if (!session) return null;

  const { name, email, phone, role } = session.user;

  return (
    <div className="dashboard__profile">
      <div className="dashboard__profile-wrap">
        <h2 className="dashboard__profile-title">Profile</h2>
        <p className="dashboard__profile-role">
          Role: <strong>{roleLabelMap[role]}</strong>
        </p>
      </div>

      <div className="dashboard__profile-info-wrap">
        <p className="dashboard__profile-label">Name:</p>
        <p className="dashboard__profile-input">{name}</p>
      </div>

      <div className="dashboard__profile-info-wrap">
        <p className="dashboard__profile-label">Phone:</p>
        <p className="dashboard__profile-input">
          {phone || "Not provided"}
        </p>
      </div>

      <div className="dashboard__profile-info-wrap">
        <p className="dashboard__profile-label">Email:</p>
        <p className="dashboard__profile-input">{email}</p>
      </div>
    </div>
  );
};

export default DashboardProfileInfo;
