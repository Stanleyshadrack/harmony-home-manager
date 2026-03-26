import { useEffect, useState } from "react";
import { LandlordTypes } from "@/types/LandlordTypes";
import { useAuth } from "@/contexts/AuthContext";
import { fetchMyLandlordProfile } from "@/api/service/landlords.service.api";





export function useCurrentLandlord() {
  const { user } = useAuth();

  const [landlord, setLandlord] = useState<LandlordTypes | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 🔥 Only landlords should call this
  if (user?.role !== "landlord") {
  setIsLoading(false);
  return;
}

    fetchMyLandlordProfile()
      .then((data) => {
        setLandlord(data);
      })
      .catch((err) => {
        console.error("Failed to fetch landlord profile", err);
        setLandlord(null);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [user]);

  return { landlord, isLoading };
}