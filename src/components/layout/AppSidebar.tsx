import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { NavLink } from '@/components/NavLink';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Building2,
  LayoutDashboard,
  Home,
  Users,
  CreditCard,
  Wrench,
  MessageSquare,
  BarChart3,
  Settings,
  HelpCircle,
  LogOut,
  Bell,
  UserCircle,
  Shield,
  ChevronUp,
  Briefcase,
  ShieldCheck,
  FileText,
  Droplets,
  UsersRound,
  History,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { LucideIcon } from 'lucide-react';

interface NavItem {
  title: string;
  url: string;
  icon: LucideIcon;
  roles: UserRole[]; // Which roles can see this item
}

// Role-based navigation configuration
const mainNavItems: NavItem[] = [
  // Super Admin items
  { title: 'navigation.adminPortal', url: '/admin-portal', icon: ShieldCheck, roles: ['super_admin'] },
  
  // Landlord items (full access to property management)
  { title: 'navigation.dashboard', url: '/dashboard', icon: LayoutDashboard, roles: ['super_admin', 'landlord'] },
  { title: 'navigation.properties', url: '/properties', icon: Building2, roles: ['super_admin', 'landlord'] },
  { title: 'navigation.units', url: '/units', icon: Home, roles: ['super_admin', 'landlord', 'employee'] },
  { title: 'navigation.tenants', url: '/tenants', icon: Users, roles: ['super_admin', 'landlord', 'employee'] },
  { title: 'Employees', url: '/employees', icon: UsersRound, roles: ['super_admin', 'landlord'] },
  { title: 'navigation.billing', url: '/billing', icon: CreditCard, roles: ['super_admin', 'landlord'] },
  { title: 'Water Data', url: '/water-data', icon: Droplets, roles: ['super_admin', 'landlord'] },
  { title: 'Water Meters', url: '/water-meters', icon: Droplets, roles: ['super_admin', 'landlord'] },
  { title: 'navigation.maintenance', url: '/maintenance', icon: Wrench, roles: ['super_admin', 'landlord'] },
  { title: 'navigation.messages', url: '/messages', icon: MessageSquare, roles: ['super_admin', 'landlord', 'employee', 'tenant'] },
  
  // Employee items
  { title: 'navigation.employeePortal', url: '/employee-portal', icon: Briefcase, roles: ['employee'] },
  { title: 'navigation.maintenance', url: '/maintenance', icon: Wrench, roles: ['employee'] },
  
  // Tenant items
  { title: 'navigation.tenantPortal', url: '/tenant-portal', icon: UserCircle, roles: ['tenant'] },
];

const secondaryNavItems: NavItem[] = [
  { title: 'navigation.reports', url: '/reports', icon: BarChart3, roles: ['super_admin', 'landlord'] },
  { title: 'navigation.notifications', url: '/notifications', icon: Bell, roles: ['super_admin', 'landlord'] },
  { title: 'Notification Logs', url: '/notification-logs', icon: History, roles: ['super_admin', 'landlord'] },
  { title: 'navigation.auditLogs', url: '/audit-logs', icon: Shield, roles: ['super_admin', 'landlord'] },
  { title: 'navigation.settings', url: '/settings', icon: Settings, roles: ['super_admin', 'landlord', 'employee', 'tenant'] },
  { title: 'navigation.help', url: '/help', icon: HelpCircle, roles: ['super_admin', 'landlord', 'employee', 'tenant'] },
];

export function AppSidebar() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const { state } = useSidebar();
  const location = useLocation();
  const collapsed = state === 'collapsed';
  const userRole = user?.role || 'tenant';

  // Filter nav items based on user role
  const filteredMainItems = mainNavItems.filter((item) => item.roles.includes(userRole));
  const filteredSecondaryItems = secondaryNavItems.filter((item) => item.roles.includes(userRole));

  // Remove duplicates (e.g., maintenance appears for both landlord and employee)
  const uniqueMainItems = filteredMainItems.filter(
    (item, index, self) => index === self.findIndex((t) => t.url === item.url)
  );

  const handleLogout = async () => {
    await logout();
    toast.success(t('auth.logoutSuccess'));
  };

  const getInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    return user?.email?.[0].toUpperCase() || 'U';
  };

  const getRoleBadgeColor = () => {
    switch (userRole) {
      case 'super_admin':
        return 'bg-destructive/20 text-destructive';
      case 'landlord':
        return 'bg-primary/20 text-primary';
      case 'employee':
        return 'bg-warning/20 text-warning';
      case 'tenant':
        return 'bg-info/20 text-info';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <Building2 className="h-4 w-4" />
          </div>
          {!collapsed && (
            <span className="font-bold text-lg">{t('common.appName')}</span>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>
            {!collapsed && (
              <span className="flex items-center gap-2">
                {t('navigation.dashboard')}
                <span className={`text-[10px] px-1.5 py-0.5 rounded ${getRoleBadgeColor()}`}>
                  {t(`roles.${userRole}`)}
                </span>
              </span>
            )}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {uniqueMainItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname === item.url}
                    tooltip={collapsed ? t(item.title) : undefined}
                  >
                    <NavLink to={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{t(item.title)}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {filteredSecondaryItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>{!collapsed && t('settings.title')}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {filteredSecondaryItems.map((item) => (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton
                      asChild
                      isActive={location.pathname === item.url}
                      tooltip={collapsed ? t(item.title) : undefined}
                    >
                      <NavLink to={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span>{t(item.title)}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.avatarUrl} />
                    <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-xs">
                      {getInitials()}
                    </AvatarFallback>
                  </Avatar>
                  {!collapsed && (
                    <div className="flex flex-1 flex-col text-left text-sm leading-tight">
                      <span className="truncate font-semibold">
                        {user?.firstName ? `${user.firstName} ${user.lastName}` : user?.email}
                      </span>
                      <span className="truncate text-xs text-sidebar-foreground/70">
                        {t(`roles.${user?.role}`)}
                      </span>
                    </div>
                  )}
                  {!collapsed && <ChevronUp className="ml-auto h-4 w-4" />}
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="top"
                align="start"
                className="w-56"
              >
                <DropdownMenuItem asChild>
                  <NavLink to="/settings" className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    {t('settings.profile')}
                  </NavLink>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  {t('auth.logout')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
