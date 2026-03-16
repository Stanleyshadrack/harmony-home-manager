// "use server";

// import { Employee } from "@/hooks/useEmployees";
// import { API_PATHS } from "../constants/constants";
// import { apiRequest } from "../https";

// interface EmployeeApiResponse {
//   id: number;
//   userId: number;
//   email: string;
//   status: string;
//   landlordId: number | null;
//   landlordName: string | null;
//   assignedPropertyId: number | null;
//   assignedPropertyName: string | null;
//   phone: string;
// }

// export const getEmployees = async (): Promise<{
//   employees: Employee[];
//   totalActiveEmployees: number;
//   totalEmployees: number;
//   totalPendingEmployees: number;
// }> => {
//   const resp = await apiRequest<null, EmployeeApiResponse[]>({
//     path: API_PATHS.EMPLOYEES,
//     method: "GET",
//   });

//   const activeEmployees = resp.filter((emp) => emp.status === "ACTIVE").length;
//   const totalEmployees = resp.length;
//   const pendingEmployees = resp.filter(
//     (emp) => emp.status === "PENDING",
//   ).length;

//   console.log("Employee response--->", resp, activeEmployees, totalEmployees, pendingEmployees);

//   return {
//     employees: resp,
//     totalActiveEmployees: activeEmployees,
//     totalEmployees,
//     totalPendingEmployees: pendingEmployees,
//   };
// };

// "use server";

import { Employee } from "@/hooks/useEmployees";
import { API_PATHS } from "../constants/constants";
import { apiRequest } from "../https";

interface EmployeeApiResponse {
  id: number;
  userId: number;
  email: string;
  status: string;
  landlordId: number | null;
  landlordName: string | null;
  assignedPropertyId: number | null;
  assignedPropertyName: string | null;
  phone: string;
}

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

  const employees: Employee[] = resp.map((emp) => ({
    id: String(emp.id),
    email: emp.email,
    firstName: "",
    lastName: "",
    phone: emp.phone ?? undefined,
    assignedPropertyId: emp.assignedPropertyId
      ? String(emp.assignedPropertyId)
      : undefined,
    assignedPropertyName: emp.assignedPropertyName ?? undefined,
    status:
      emp.status.toLowerCase() === "active"
        ? "active"
        : emp.status.toLowerCase() === "pending"
        ? "pending"
        : "inactive",
    role: "employee",
    hiredAt: new Date().toISOString(), 
    landlordId: emp.landlordId ? String(emp.landlordId) : "",
  }));

  const activeEmployees = employees.filter(
    (emp) => emp.status === "active",
  ).length;

  const pendingEmployees = employees.filter(
    (emp) => emp.status === "pending",
  ).length;

  const totalEmployees = employees.length;
  const pendingregistration = employees.filter(
    (emp) => emp.status === "pending",
  );

  console.log(
    "Employee response--->",
    employees,
    activeEmployees,
    totalEmployees,
    pendingEmployees,
  );

  return {
    employees,
    totalActiveEmployees: activeEmployees,
    totalEmployees,
    totalPendingEmployees: pendingEmployees,
    pendingRegistration: pendingregistration,
  };
};