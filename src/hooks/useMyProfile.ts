// hooks/useMyProfile.ts
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

import { getMyProfileByRole, updateMyProfileByRole } from "@/api/service/profileService";

export const useMyProfile = () => {
 const { user, updateUser } = useAuth();

  const [profile, setProfile] = useState<any>(null);
  
  const [loading, setLoading] = useState(false);

  const role = user?.role;

  const fetchProfile = async () => {
    if (!role) return;

    setLoading(true);
    try {
      const data = await getMyProfileByRole(role);
      setProfile(data);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (payload: any) => {
    if (!role) return;

    const updated = await updateMyProfileByRole(role, payload);

    // sync everywhere
    setProfile(updated);
   updateUser(updated); // 🔥 updates auth context globally

    return updated;
  };

  useEffect(() => {
    fetchProfile();
  }, [role]);

  return {
    profile,
    loading,
    refreshProfile: fetchProfile,
    updateProfile,
  };
};