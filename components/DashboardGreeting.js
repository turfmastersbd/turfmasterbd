"use client";
import { signOut, useSession } from "next-auth/react";

const DashboardGreeting = () => {
  const { data: session } = useSession();

  return (
    <div className="dashboard__greetings">
      <p className="dashboard__greeting-text">
        WELCOME, <strong>{session?.user?.name}</strong>
      </p>

      <div className="dashboard__button-wrap">
        <button
          className="secondary-button"
          onClick={() => signOut({ callbackUrl: "/signin" })}
        >
          Sign Out
        </button>
      </div>
    </div>
  );
};

export default DashboardGreeting;
