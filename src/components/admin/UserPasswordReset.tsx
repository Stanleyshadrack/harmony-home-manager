import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Key, User, Search, Eye, EyeOff, History } from 'lucide-react';
import {
  getManagedUsers,
  syncUsersFromRegistrations,
  resetUserPassword,
  getPasswordResetLogs,
  ManagedUser,
  PasswordResetLog,
} from '@/services/userManagementService';
import { sendPasswordResetEmail } from '@/services/adminEmailService';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export function UserPasswordReset() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [resetLogs, setResetLogs] = useState<PasswordResetLog[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<ManagedUser | null>(null);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [showLogsDialog, setShowLogsDialog] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetReason, setResetReason] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const syncedUsers = syncUsersFromRegistrations();
    setUsers(syncedUsers);
    setResetLogs(getPasswordResetLogs());
  }, []);

  const filteredUsers = users.filter(
    (u) =>
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      `${u.firstName} ${u.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleResetPassword = async () => {
    if (!selectedUser) return;

    if (newPassword.length < 8) {
      toast({
        title: 'Password Too Short',
        description: 'Password must be at least 8 characters.',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: 'Passwords Do Not Match',
        description: 'Please ensure both passwords match.',
        variant: 'destructive',
      });
      return;
    }

    const result = resetUserPassword(
      selectedUser.id,
      user?.email || 'Admin',
      newPassword,
      resetReason
    );

    if (result.success) {
      // Send email notification
      await sendPasswordResetEmail({
        userEmail: selectedUser.email,
        userName: `${selectedUser.firstName} ${selectedUser.lastName}`,
        adminEmail: user?.email || 'Admin',
        adminName: `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Admin',
        temporaryPassword: newPassword,
        timestamp: new Date().toISOString(),
      });

      toast({
        title: 'Password Reset',
        description: `Password for ${selectedUser.email} has been reset. Email notification sent.`,
      });
      setShowResetDialog(false);
      setSelectedUser(null);
      setNewPassword('');
      setConfirmPassword('');
      setResetReason('');
      setResetLogs(getPasswordResetLogs());
    } else {
      toast({
        title: 'Reset Failed',
        description: result.message,
        variant: 'destructive',
      });
    }
  };

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(password);
    setConfirmPassword(password);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                User Password Management
              </CardTitle>
              <CardDescription>
                Reset passwords for any user in the system
              </CardDescription>
            </div>
            <Button variant="outline" onClick={() => setShowLogsDialog(true)}>
              <History className="h-4 w-4 mr-2" />
              Reset History
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {filteredUsers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                          {u.firstName.charAt(0)}
                        </div>
                        <span className="font-medium">
                          {u.firstName} {u.lastName}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="capitalize">
                        {u.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          u.status === 'active'
                            ? 'bg-success/10 text-success'
                            : 'bg-destructive/10 text-destructive'
                        }
                      >
                        {u.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedUser(u);
                          setShowResetDialog(true);
                        }}
                      >
                        <Key className="h-4 w-4 mr-2" />
                        Reset Password
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium">No Users Found</p>
              <p className="text-muted-foreground">
                {searchQuery
                  ? 'No users match your search criteria'
                  : 'No approved users in the system yet'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reset Password Dialog */}
      <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset User Password</DialogTitle>
            <DialogDescription>
              Reset the password for {selectedUser?.firstName} {selectedUser?.lastName} (
              {selectedUser?.email})
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
              />
            </div>

            <Button type="button" variant="outline" onClick={generateRandomPassword}>
              Generate Random Password
            </Button>

            <div className="space-y-2">
              <Label htmlFor="resetReason">Reason (Optional)</Label>
              <Textarea
                id="resetReason"
                value={resetReason}
                onChange={(e) => setResetReason(e.target.value)}
                placeholder="e.g., User forgot password, Security reset..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResetDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleResetPassword}>Reset Password</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset History Dialog */}
      <Dialog open={showLogsDialog} onOpenChange={setShowLogsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Password Reset History</DialogTitle>
            <DialogDescription>Recent password reset operations</DialogDescription>
          </DialogHeader>
          <div className="max-h-96 overflow-y-auto">
            {resetLogs.length > 0 ? (
              <div className="space-y-3">
                {resetLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{log.userEmail}</p>
                      <p className="text-sm text-muted-foreground">
                        Reset by: {log.performedBy}
                      </p>
                      {log.reason && (
                        <p className="text-sm text-muted-foreground">
                          Reason: {log.reason}
                        </p>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(log.timestamp)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No password resets have been performed
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
