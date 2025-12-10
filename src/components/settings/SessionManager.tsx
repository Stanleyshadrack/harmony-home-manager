import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { Session, sessionService } from '@/services/sessionService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  Monitor, 
  Smartphone, 
  Tablet, 
  MapPin, 
  Clock, 
  Shield, 
  LogOut,
  AlertTriangle
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { formatDistanceToNow } from 'date-fns';

const getDeviceIcon = (deviceType: string) => {
  switch (deviceType.toLowerCase()) {
    case 'mobile':
      return Smartphone;
    case 'tablet':
      return Tablet;
    default:
      return Monitor;
  }
};

export function SessionManager() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      loadSessions();
    }
  }, [user?.id]);

  const loadSessions = () => {
    if (!user?.id) return;
    
    let currentSession = sessionService.getCurrentSession(user.id);
    if (!currentSession) {
      currentSession = sessionService.createSession(user.id);
    }
    setCurrentSessionId(currentSession.id);
    setSessions(sessionService.getSessions(user.id));
  };

  const handleRevokeSession = (sessionId: string) => {
    const success = sessionService.revokeSession(sessionId);
    if (success) {
      toast.success('Session revoked successfully');
      loadSessions();
    } else {
      toast.error('Failed to revoke session');
    }
  };

  const handleRevokeAllOther = () => {
    if (!user?.id || !currentSessionId) return;
    
    const count = sessionService.revokeAllOtherSessions(user.id, currentSessionId);
    if (count > 0) {
      toast.success(`${count} session(s) revoked successfully`);
      loadSessions();
    } else {
      toast.info('No other sessions to revoke');
    }
  };

  const otherSessions = sessions.filter(s => !s.isCurrent);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Active Sessions
        </CardTitle>
        <CardDescription>
          Manage your active login sessions across devices
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Session */}
        {sessions.filter(s => s.isCurrent).map(session => {
          const DeviceIcon = getDeviceIcon(session.deviceInfo);
          return (
            <div
              key={session.id}
              className="flex items-start gap-4 p-4 rounded-lg border border-primary/20 bg-primary/5"
            >
              <div className="p-2 rounded-full bg-primary/10">
                <DeviceIcon className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium">
                    {session.browser} on {session.os}
                  </span>
                  <Badge variant="default" className="text-xs">
                    Current Session
                  </Badge>
                </div>
                <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground flex-wrap">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {session.location}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Active now
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  IP: {session.ipAddress} • {session.deviceInfo}
                </p>
              </div>
            </div>
          );
        })}

        {/* Other Sessions */}
        {otherSessions.length > 0 && (
          <>
            <div className="flex items-center justify-between pt-2">
              <h4 className="text-sm font-medium text-muted-foreground">
                Other Sessions ({otherSessions.length})
              </h4>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <LogOut className="h-4 w-4 mr-1" />
                    Revoke All
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-destructive" />
                      Revoke All Other Sessions?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      This will sign you out from all other devices. You will remain logged in on this device only.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleRevokeAllOther}>
                      Revoke All
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>

            {otherSessions.map(session => {
              const DeviceIcon = getDeviceIcon(session.deviceInfo);
              return (
                <div
                  key={session.id}
                  className="flex items-start gap-4 p-4 rounded-lg border bg-card"
                >
                  <div className="p-2 rounded-full bg-muted">
                    <DeviceIcon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {session.browser} on {session.os}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {session.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(session.lastActiveAt), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      IP: {session.ipAddress} • {session.deviceInfo}
                    </p>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                        <LogOut className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Revoke this session?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will sign you out from {session.browser} on {session.os} ({session.location}).
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleRevokeSession(session.id)}>
                          Revoke
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              );
            })}
          </>
        )}

        {otherSessions.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No other active sessions
          </p>
        )}
      </CardContent>
    </Card>
  );
}
