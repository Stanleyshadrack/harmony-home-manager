import { Approval } from "@/api/dto/approval.dto";
import { ApprovalsApi } from "@/api/service/approvals.service";
import { useEffect, useState } from "react";


export function useApprovals() {
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(false);

 const fetchApprovals = async () => {
  setLoading(true);
  try {
    const data = await ApprovalsApi.getAll();
    setApprovals(data);
  } catch (error) {
    console.error("Failed to fetch approvals", error);
    setApprovals([]);
  } finally {
    setLoading(false);
  }
};

  const approve = async (id: number) => {
    await ApprovalsApi.approve(id);
    fetchApprovals();
  };

  const reject = async (id: number, reason: string) => {
    await ApprovalsApi.reject(id, reason);
    fetchApprovals();
  };

  useEffect(() => {
    fetchApprovals();
  }, []);

  return {
    approvals,
    loading,
    approve,
    reject,
    pendingCount: approvals.filter(a => a.status === "PENDING").length,
  };
}