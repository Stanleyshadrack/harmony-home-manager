import { activateEmployee, assignEmployeeProperties, deactivateEmployee, deleteEmployee, getAllEmployees, getEmployeeProfile, updateEmployee } from "@/api/service/employee.service";
import { useAuth } from "@/contexts/AuthContext";
import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";

export const useAllEmployeesData = () => {
  const { user } = useAuth();

  return queryOptions({
    queryKey: ["employees", user?.role],
    queryFn: () => getAllEmployees(),
    enabled: user?.role === "landlord" || user?.role === "super_admin",
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5,
  });
};

export const useEmployeeProfile = () => {
  const { user } = useAuth();

  return queryOptions({
    queryKey: ["employee-profile", user?.id],
    queryFn: () => getEmployeeProfile(),
    enabled: user?.role === "employee",
    staleTime: 1000 * 60 * 5,
  });
};

/* =========================
   UPDATE EMPLOYEE
========================= */
export const useUpdateEmployee = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: any;
    }) => updateEmployee(id, payload),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
    },
  });
};

/* =========================
   DELETE EMPLOYEE
========================= */
export const useDeleteEmployee = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteEmployee(id),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
    },
  });
};

/* =========================
   ASSIGN PROPERTIES
========================= */
export const useAssignEmployeeProperties = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      propertyIds,
    }: {
      id: number;
      propertyIds: number[];
    }) => assignEmployeeProperties(id, propertyIds),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
    },
  });
};

/* =========================
   ACTIVATE
========================= */
export const useActivateEmployee = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => activateEmployee(id),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
    },
  });
};

/* =========================
   DEACTIVATE
========================= */
export const useDeactivateEmployee = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deactivateEmployee(id),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
    },
  });
};
