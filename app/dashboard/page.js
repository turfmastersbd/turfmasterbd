"use client";
import DashboardContent from "@/components/dashboard/DashboardContent";
import DashboardGreeting from "@/components/DashboardGreeting";
import DashboardProfileInfo from "@/components/DashboardProfileInfo";
import { useSession } from "next-auth/react";

export default function DashboardPage() {
  const { data: session, status } = useSession();

  if (status === "loading") return <p>Loading....</p>;

  const role = session?.user?.role;

  return (
    <section className="dashboard">
      <div className="container">
        <div className="dashboard__content">
          <DashboardGreeting />
          <DashboardProfileInfo />
          <DashboardContent role={role} />
        </div>
      </div>
    </section>
  );
}
