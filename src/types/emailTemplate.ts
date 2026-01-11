export type EmailTemplateCategory = 
  | 'authentication'
  | 'billing'
  | 'maintenance'
  | 'system'
  | 'subscription'
  | 'invitation';

export interface EmailTemplate {
  id: string;
  name: string;
  category: EmailTemplateCategory;
  subject: string;
  body: string;
  variables: string[];
  isActive: boolean;
  lastModified: string;
  description?: string;
}

export interface EmailTemplateFormData {
  name: string;
  category: EmailTemplateCategory;
  subject: string;
  body: string;
  description?: string;
}
