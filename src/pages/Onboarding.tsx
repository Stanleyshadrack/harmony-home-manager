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

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    validateInvite(token)
      .then((res) => {
        setRole(res.role); // TENANT | EMPLOYEE | ADMIN | LANDLORD
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [token]);

  if (loading) return <div className="text-center mt-10">Loading...</div>;

  if (!token) return <div className="text-center mt-10">Invalid link</div>;

  switch (role) {
    case "TENANT":
      return <TenantOnboarding />;
    case "EMPLOYEE":
      return <EmployeeOnboarding />;
    case "ADMIN":
      return <AdminOnboarding />;
    case "LANDLORD":
      return <LandlordOnboarding />;
    default:
      return <div className="text-center mt-10">Invalid invite</div>;
  }
}