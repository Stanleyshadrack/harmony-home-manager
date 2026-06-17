import { API_PATHS } from '@/api/constants/constants';
import { apiRequest } from '@/api/https';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';


export interface MessageTemplate {
  id: number;
  name: string;
  description: string;
  category: string;
  messageFormat: string;
}

export const useTemplates = () => {
  const queryClient = useQueryClient();

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['templates'],
    queryFn: () => apiRequest<null, MessageTemplate[]>({
      path: API_PATHS.NOTIFICATION_TEMPLATES,
      method: "GET"
    }),
  });

  const createTemplate = useMutation({
    mutationFn: (data: Partial<MessageTemplate>) => 
      apiRequest({ path: API_PATHS.NOTIFICATION_TEMPLATES, method: "POST", body: data }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['templates'] }),
  });

  const updateTemplate = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<MessageTemplate> }) => 
      apiRequest({ path: API_PATHS.NOTIFICATION_TEMPLATE_BY_ID(id), method: "PUT", body: data }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['templates'] }),
  });

  const deleteTemplate = useMutation({
    mutationFn: (id: number) => 
      apiRequest({ path: API_PATHS.NOTIFICATION_TEMPLATE_BY_ID(id), method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['templates'] }),
  });

  return {
    templates,
    isLoading,
    createTemplate: createTemplate.mutateAsync,
    updateTemplate: updateTemplate.mutateAsync,
    deleteTemplate: deleteTemplate.mutateAsync,
  };
};