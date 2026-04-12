import { Employee } from "@/hooks/useEmployees";
import { API_PATHS } from "../constants/constants";
import { apiRequest } from "../https";

/* =========================
   TYPES
========================= */
interface EmployeeApiResponse {
  id: number;
  userId: number;

  firstName: string;
  lastName: string;
  fullName: string;

  email: string;
  status: string;

  landlordId: number | null;
  landlordName: string | null;

  propertyIds: number[];
  propertyNames: string[];

  phone: string;
}

/* =========================
   MAPPER (REUSABLE 🔥)
========================= */
const mapEmployee = (emp: EmployeeApiResponse): Employee => ({
  id: emp.id,
  email: emp.email,

  firstName: emp.firstName,
  lastName: emp.lastName,

  name:
    emp.fullName ||
    `${emp.firstName ?? ""} ${emp.lastName ?? ""}`.trim() ||
    "Unnamed Employee",

  phone: emp.phone ?? undefined,

  propertyIds: emp.propertyIds?.map(String) ?? [],
  propertyNames: emp.propertyNames ?? [],

  status:
    emp.status?.toLowerCase() === "active"
      ? "active"
      : emp.status?.toLowerCase() === "pending"
      ? "pending"
      : "inactive",

  role: "employee",

  hiredAt: new Date().toISOString(),
  landlordId: emp.landlordId ? String(emp.landlordId) : "",
});

/* =========================
   GET PROFILE
========================= */
export const getEmployeeProfile = async (): Promise<Employee> => {
  const emp = await apiRequest<null, EmployeeApiResponse>({
    path: API_PATHS.EMPLOYEE_PROFILE,
    method: "GET",
  });

  return mapEmployee(emp);
};

/* =========================
   GET ALL
========================= */
export const getAllEmployees = async (): Promise<{
  employees: Employee[];
  totalActiveEmployees: number;
  totalEmployees: number;
  totalPendingEmployees: number;
  pendingRegistration: Employee[];
}> => {
  const resp = await apiRequest<null, EmployeeApiResponse[]>({
    path: API_PATHS.EMPLOYEES,
    method: "GET",
  });

  const employees = resp.map(mapEmployee);

  const totalEmployees = employees.length;

  const totalActiveEmployees = employees.filter(
    (e) => e.status === "active"
  ).length;

  const totalPendingEmployees = employees.filter(
    (e) => e.status === "pending"
  ).length;

  const pendingRegistration = employees.filter(
    (e) => e.status === "pending"
  );

  return {
    employees,
    totalEmployees,
    totalActiveEmployees,
    totalPendingEmployees,
    pendingRegistration,
  };
};

/* =========================
   UPDATE EMPLOYEE
========================= */
export const updateEmployee = async (
  id: number,
  payload: any
) => {
  return apiRequest({
    path: API_PATHS.UPDATE_EMPLOYEE(id),
    method: "PUT",
    body: payload,
  });
};

/* =========================
   DELETE EMPLOYEE
========================= */
export const deleteEmployee = async (id: number) => {
  return apiRequest({
    path: API_PATHS.DELETE_EMPLOYEE(id),
    method: "DELETE",
  });
};

/* =========================
   ASSIGN PROPERTIES
========================= */
export const assignEmployeeProperties = async (
  id: number,
  propertyIds: number[]
) => {
  return apiRequest({
    path: API_PATHS.ASSIGN_EMPLOYEE_PROPERTIES(id),
    method: "PATCH",
    body: propertyIds,
  });
};

/* =========================
   ACTIVATE
========================= */
export const activateEmployee = async (id: number) => {
  return apiRequest({
    path: API_PATHS.ACTIVATE_EMPLOYEE(id),
    method: "PATCH",
  });
};

/* =========================
   DEACTIVATE
========================= */
export const deactivateEmployee = async (id: number) => {
  return apiRequest({
    path: API_PATHS.DEACTIVATE_EMPLOYEE(id),
    method: "PATCH",
  });
};