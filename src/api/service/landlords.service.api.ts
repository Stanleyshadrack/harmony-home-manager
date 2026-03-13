import { apiRequest } from "../https";
import { API_PATHS } from "../constants/constants";
import { EmployeeDTO, LandlordTypes } from "@/types/LandlordTypes";

/* ============================
   🏢 Landlords
============================ */

/**
 * SUPER ADMIN
 * Create landlord
 */
export const createLandlord = (data: {
  userId: number;
  companyName: string;
  phone: string;
}) =>
  apiRequest<typeof data, LandlordTypes>({
    path: API_PATHS.LANDLORDS,
    method: "POST",
    body: data,
  });

/**
 * SUPER ADMIN
 * Fetch all landlords
 */
export const fetchAllLandlords = () =>
  apiRequest<null, LandlordTypes[]>({
    path: API_PATHS.LANDLORDS,
    method: "GET",
  });

/**
 * LANDLORD
 * Fetch my landlord profile
 */
export const fetchMyLandlordProfile = () =>
  apiRequest<null, LandlordTypes>({
    path: API_PATHS.MY_LANDLORD_PROFILE,
    method: "GET",
  });

/**
 * SUPER ADMIN
 * Approve landlord
 */
export const approveLandlord = (landlordId: number) =>
  apiRequest<null, void>({
    path: API_PATHS.APPROVE_LANDLORD(landlordId),
    method: "POST",
  });

/**
 * SUPER ADMIN
 * Reject landlord
 */
export const rejectLandlord = (landlordId: number, reason?: string) =>
  apiRequest<null, void>({
    path: `${API_PATHS.REJECT_LANDLORD(landlordId)}${
      reason ? `?reason=${encodeURIComponent(reason)}` : ""
    }`,
    method: "POST",
  });

/* ============================
   👷 Landlord Employees
============================ */

/**
 * LANDLORD / SUPER ADMIN
 * Fetch employees
 */
export const fetchLandlordEmployees = () =>
  apiRequest<null, EmployeeDTO[]>({
    path: API_PATHS.LANDLORD_EMPLOYEES,
    method: "GET",
  });

/**
 * Approve employee
 */
export const approveEmployee = (employeeId: number) =>
  apiRequest<null, EmployeeDTO>({
    path: API_PATHS.APPROVE_LANDLORD_EMPLOYEE(employeeId),
    method: "POST",
  });

/**
 * Reject employee
 */
export const rejectEmployee = (employeeId: number) =>
  apiRequest<null, EmployeeDTO>({
    path: API_PATHS.REJECT_LANDLORD_EMPLOYEE(employeeId),
    method: "POST",
  });

/**
 * Assign employee to property
 */
export const assignEmployeeToProperty = (
  employeeId: number,
  propertyId: number
) =>
  apiRequest<null, EmployeeDTO>({
    path: API_PATHS.ASSIGN_EMPLOYEE_TO_PROPERTY(employeeId, propertyId),
    method: "POST",
  });