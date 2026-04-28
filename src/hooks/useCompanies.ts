import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { CompanyServiceApi, CreateCompanyRequest, 
  UpdateCompanyRequest  } from '@/api/service/CompanyServiceApi';

// ----------------------------------------------------------------------
// Query Keys Factory (Best Practice for Cache Management)
// ----------------------------------------------------------------------
export const companyKeys = {
  all: ['companies'] as const,
  detail: (id: number) => ['companies', id] as const,
};

// ----------------------------------------------------------------------
// Queries (Fetching Data)
// ----------------------------------------------------------------------

export function useGetCompanies() {
  return useQuery({
    queryKey: companyKeys.all,
    queryFn: () => CompanyServiceApi.getAll(),
  });
}

export function useGetCompany(id: number, enabled = true) {
  return useQuery({
    queryKey: companyKeys.detail(id),
    queryFn: () => CompanyServiceApi.getById(id),
    enabled: !!id && enabled, // Only run if ID is valid
  });
}

// ----------------------------------------------------------------------
// Mutations (Modifying Data)
// ----------------------------------------------------------------------

export function useCreateCompany() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCompanyRequest) => CompanyServiceApi.create(data),
    onSuccess: () => {
      // Refresh the companies list after a successful creation
      queryClient.invalidateQueries({ queryKey: companyKeys.all });
    },
  });
}

export function useUpdateCompany() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateCompanyRequest }) =>
      CompanyServiceApi.update(id, data),
    onSuccess: (_, variables) => {
      // Refresh both the specific company and the main list
      queryClient.invalidateQueries({ queryKey: companyKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: companyKeys.all });
    },
  });
}

export function useDeleteCompany() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => CompanyServiceApi.delete(id),
    onSuccess: () => {
      // Refresh the companies list after deletion
      queryClient.invalidateQueries({ queryKey: companyKeys.all });
    },
  });
}