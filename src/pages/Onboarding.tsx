"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { validateInvite } from "@/api/service/validateInvite.service";

import TenantOnboarding from "./TenantOnboarding";
import EmployeeOnboarding from "./EmployeeOnboarding";
import AdminOnboarding from "./AdminOnboading";
import LandlordOnboarding from "./LandlordOnboarding";

export default function Onboarding() {
  const [params] = useSearchParams();
  const token = params.get("token");

  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [inviteData, setInviteData] = useState<any>(null);

  useEffect(() => {
    if (!token) {
      console.warn("No token found in URL");
      setLoading(false);
      return;
    }

    console.log("🔑 TOKEN:", token);

    validateInvite(token)
      .then((res) => {
        // 🔥 FULL LOG
        console.log("📦 INVITE RESPONSE:", res);

        setInviteData(res);
        setRole(res.role);
        setLoading(false);
      })
      .catch((err) => {
        console.error("❌ VALIDATE INVITE ERROR:", err);
        setLoading(false);
      });
  }, [token]);

  if (loading) return <div className="text-center mt-10">Loading...</div>;

  if (!token) return <div className="text-center mt-10">Invalid link</div>;

  switch (role) {
    case "TENANT":
      return <TenantOnboarding  />;
    case "EMPLOYEE":
      return <EmployeeOnboarding />;
    case "ADMIN":
      return <AdminOnboarding  />;
    case "LANDLORD":
      return <LandlordOnboarding token={token} />;
    default:
      return <div className="text-center mt-10">Invalid invite</div>;
  }
}