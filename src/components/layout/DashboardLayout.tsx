import { readLockInfo } from '@/services/sessionLock';
import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { getRoleModuleLabel } from '@/lib/roleModuleLabels';
import { useAuth } from '@/contexts/AuthContext';
import { SidebarProvider, SidebarTrigger, SidebarInset, useSidebar } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
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

function MobileNavigationButton() {
  const { setOpenMobile } = useSidebar();
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="md:hidden h-11 w-11 shrink-0 -ml-1"
      aria-label="Open navigation menu"
      title="Open navigation menu"
      onClick={() => setOpenMobile(true)}
    >
      <Menu className="h-5 w-5" aria-hidden="true" />
    </Button>
  );
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
      <div className="flex min-h-svh w-full min-w-0">
        <AppSidebar />
        <SidebarInset className="flex min-w-0 flex-1 flex-col">
          {/* Header */}
          <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b bg-background px-3 sm:px-4">
            <MobileNavigationButton />
            <SidebarTrigger className="-ml-1 hidden md:inline-flex" />
            <Separator orientation="vertical" className="mr-2 hidden h-4 md:block" />
            
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

            <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
              <NotificationBell />
              <LanguageSwitcher />
              <ThemeSwitcher />
            </div>
          </header>

          {/* Main Content */}
          <main className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto">
            <div className="container w-full px-4 py-5 sm:px-6 sm:py-6">
              {displayTitle && (
                <h1 className="text-2xl font-bold mb-6">{displayTitle}</h1>
              )}
              {children}
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
