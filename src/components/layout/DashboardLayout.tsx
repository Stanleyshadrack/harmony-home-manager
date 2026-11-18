import { readLockInfo } from '@/services/sessionLock';
import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { getRoleModuleLabel } from '@/lib/roleModuleLabels';
import { useAuth } from '@/contexts/AuthContext';
import { SidebarProvider, SidebarTrigger, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { Separator } from '@/components/ui/separator';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

interface DashboardLayoutProps {
  children: ReactNode;
  title?: string;
  breadcrumbs?: Array<{ label: string; href?: string }>;
}

export function DashboardLayout({ children, title, breadcrumbs }: DashboardLayoutProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();
  const modulePath = '/' + location.pathname.split('/').filter(Boolean)[0];
  const moduleLabel = user ? getRoleModuleLabel(modulePath, user.role, '') : '';
  const displayTitle = moduleLabel || title;
  const displayBreadcrumbs = breadcrumbs?.map((crumb, index) =>
    index === breadcrumbs.length - 1 && moduleLabel
      ? { ...crumb, label: moduleLabel }
      : crumb
  );

  if (readLockInfo()) return <Navigate to="/locked" replace />;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <SidebarInset className="flex flex-col flex-1">
          {/* Header */}
          <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            
            {displayBreadcrumbs && displayBreadcrumbs.length > 0 && (
              <Breadcrumb>
                <BreadcrumbList>
                  {displayBreadcrumbs.map((crumb, index) => (
                    <BreadcrumbItem key={index}>
                      {index > 0 && <BreadcrumbSeparator />}
                      {crumb.href ? (
                        <BreadcrumbLink href={crumb.href}>{crumb.label}</BreadcrumbLink>
                      ) : (
                        <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                      )}
                    </BreadcrumbItem>
                  ))}
                </BreadcrumbList>
              </Breadcrumb>
            )}

            <div className="ml-auto flex items-center gap-2">
              <NotificationBell />
              <LanguageSwitcher />
              <ThemeSwitcher />
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-auto">
            <div className="container py-6">
              {displayTitle && (
                <h1 className="text-2xl font-bold mb-6">{title}</h1>
              )}
              {children}
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
