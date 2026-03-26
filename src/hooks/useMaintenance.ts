import { useState, useCallback, useEffect } from "react";
import type {
  MaintenanceRequest,
  MaintenanceFormData,
  AssignmentFormData,
  MaintenanceStatus,
} from "@/types/maintenance";

import {
  getMaintenanceRequests,
  createMaintenanceRequest,
  assignMaintenanceRequest,
  updateMaintenanceStatus,
 addMaintenanceNote } from "@/api/service/maintenance.service";

export function useMaintenance() {
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // =========================
  // 🔄 LOAD REQUESTS
  // =========================
  const fetchRequests = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getMaintenanceRequests();
      setRequests(data);
    } catch (err) {
      console.error("Failed to fetch maintenance requests", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  // =========================
  // ➕ CREATE REQUEST
  // =========================
  const createRequest = useCallback(async (data: MaintenanceFormData) => {
    try {
      setIsLoading(true);
      const newRequest = await createMaintenanceRequest(data);

      // optimistic update
      setRequests((prev) => [newRequest, ...prev]);

      return newRequest;
    } catch (err) {
      console.error("Failed to create request", err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // =========================
  // 👷 ASSIGN REQUEST
  // =========================
  const assignRequest = useCallback(async (data: AssignmentFormData) => {
    try {
      setIsLoading(true);

      const updated = await assignMaintenanceRequest(data);

      setRequests((prev) =>
        prev.map((req) =>
          req.id === data.requestId ? { ...req, ...updated } : req
        )
      );
    } catch (err) {
      console.error("Failed to assign request", err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // =========================
  // 🔄 UPDATE STATUS
  // =========================
  const updateStatus = useCallback(
    async (requestId: string, status: MaintenanceStatus) => {
      try {
        setIsLoading(true);

        const updated = await updateMaintenanceStatus(requestId, status);

        setRequests((prev) =>
          prev.map((req) =>
            req.id === requestId ? { ...req, ...updated } : req
          )
        );
      } catch (err) {
        console.error("Failed to update status", err);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // =========================
  // 📝 ADD NOTE
  // =========================
  const addNote = useCallback(
    async (requestId: string, content: string) => {
      try {
        const note = await addMaintenanceNote(requestId, content);

        // optimistic update
        setRequests((prev) =>
          prev.map((req) =>
            req.id === requestId
              ? {
                  ...req,
                  notes: [...req.notes, note],
                }
              : req
          )
        );
      } catch (err) {
        console.error("Failed to add note", err);
        throw err;
      }
    },
    []
  );

  // =========================
  // 📊 HELPERS
  // =========================
  const getRequestsByStatus = useCallback(
    (status: MaintenanceStatus) => {
      return requests.filter((req) => req.status === status);
    },
    [requests]
  );

  const getRequestsByPriority = useCallback(
    (priority: MaintenanceRequest["priority"]) => {
      return requests.filter((req) => req.priority === priority);
    },
    [requests]
  );

  return {
    requests,
    isLoading,
    fetchRequests, // 🔥 manual refresh
    createRequest,
    assignRequest,
    updateStatus,
    addNote,
    getRequestsByStatus,
    getRequestsByPriority,
  };
}