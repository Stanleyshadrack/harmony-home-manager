import { getAllEmployees } from "@/api/service/employee.service";
import { queryOptions } from "@tanstack/react-query";

export const useAllEmployeesData = () => {
  return queryOptions({
    queryKey: ["employees"],
    queryFn: () => getAllEmployees(),
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5,
  });
};