import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { NavLink } from '@/components/NavLink';
import { useAuth } from '@/contexts/AuthContext';
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
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

const mainNavItems = [
  { title: 'navigation.dashboard', url: '/dashboard', icon: LayoutDashboard },
  { title: 'navigation.properties', url: '/properties', icon: Building2 },
  { title: 'navigation.units', url: '/units', icon: Home },
  { title: 'navigation.tenants', url: '/tenants', icon: Users },
  { title: 'navigation.billing', url: '/billing', icon: CreditCard },
  { title: 'navigation.tenantPortal', url: '/tenant-portal', icon: UserCircle },
  { title: 'navigation.maintenance', url: '/maintenance', icon: Wrench },
  { title: 'navigation.messages', url: '/messages', icon: MessageSquare },
];

const secondaryNavItems = [
  { title: 'navigation.reports', url: '/reports', icon: BarChart3 },
  { title: 'navigation.notifications', url: '/notifications', icon: Bell },
  { title: 'navigation.auditLogs', url: '/audit-logs', icon: Shield },
  { title: 'navigation.settings', url: '/settings', icon: Settings },
  { title: 'navigation.help', url: '/help', icon: HelpCircle },
];

export function AppSidebar() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const { state } = useSidebar();
  const location = useLocation();
  const collapsed = state === 'collapsed';

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
          <SidebarGroupLabel>{!collapsed && t('navigation.dashboard')}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
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

        <SidebarGroup>
          <SidebarGroupLabel>{!collapsed && t('settings.title')}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {secondaryNavItems.map((item) => (
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
