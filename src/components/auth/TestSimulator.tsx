import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Mail, UserPlus, CheckCircle, ExternalLink, Copy, FlaskConical } from 'lucide-react';
import { useInvitations } from '@/hooks/useInvitations';
import { UserRole } from '@/contexts/AuthContext';

interface TestSimulatorProps {
  onClose: () => void;
}

export function TestSimulator({ onClose }: TestSimulatorProps) {
  const [email, setEmail] = useState('test@example.com');
  const [role, setRole] = useState<UserRole>('tenant');
  const [invitationLink, setInvitationLink] = useState<string | null>(null);
  const [step, setStep] = useState<'invite' | 'link-ready'>('invite');
  
  const { createInvitation } = useInvitations();

  const handleCreateInvitation = async () => {
    try {
      const invitation = await createInvitation(
        { email, role },
        { 
          name: 'Super Admin (Test)', 
          email: 'admin@demo.com', 
          role: 'super_admin' 
        }
      );
      
      // Generate the onboarding link
      const link = `${window.location.origin}/onboarding?token=${invitation.token}`;
      setInvitationLink(link);
      setStep('link-ready');
      
      toast.success(`Invitation created for ${email}`, {
        description: `Role: ${role} | Token: ${invitation.token.slice(0, 20)}...`
      });
    } catch (error) {
      toast.error('Failed to create invitation');
    }
  };

  const copyLink = () => {
    if (invitationLink) {
      navigator.clipboard.writeText(invitationLink);
      toast.success('Link copied to clipboard!');
    }
  };

  const openOnboarding = () => {
    if (invitationLink) {
      window.open(invitationLink, '_blank');
    }
  };

  const resetSimulator = () => {
    setStep('invite');
    setInvitationLink(null);
    setEmail('test@example.com');
    setRole('tenant');
  };

  return (
    <Card className="border-dashed border-2 border-warning/50 bg-warning/5">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5 text-warning" />
            <CardTitle className="text-lg">Test Simulator</CardTitle>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            ✕
          </Button>
        </div>
        <CardDescription>
          Simulate the invite → onboarding → approval flow
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {step === 'invite' && (
          <>
            <div className="space-y-2">
              <Label htmlFor="test-email">Email Address</Label>
              <Input
                id="test-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="test-role">Role</Label>
              <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tenant">Tenant</SelectItem>
                  <SelectItem value="employee">Employee</SelectItem>
                  <SelectItem value="landlord">Landlord</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button onClick={handleCreateInvitation} className="w-full">
              <Mail className="h-4 w-4 mr-2" />
              Simulate Send Invitation
            </Button>
          </>
        )}

        {step === 'link-ready' && invitationLink && (
          <>
            <div className="p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="font-medium text-sm">Invitation Created!</span>
              </div>
              <p className="text-xs text-muted-foreground mb-2">
                In production, this link would be emailed to: <strong>{email}</strong>
              </p>
              <div className="flex gap-2">
                <Input 
                  value={invitationLink} 
                  readOnly 
                  className="text-xs h-8"
                />
                <Button size="sm" variant="outline" onClick={copyLink}>
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Button onClick={openOnboarding} className="w-full">
                <ExternalLink className="h-4 w-4 mr-2" />
                Open Onboarding Page
              </Button>
              
              <div className="text-xs text-muted-foreground p-2 bg-muted/50 rounded">
                <strong>Next Steps:</strong>
                <ol className="list-decimal ml-4 mt-1 space-y-1">
                  <li>Click above to complete onboarding</li>
                  <li>After onboarding, go to Admin Portal to approve</li>
                  <li>Then login with the credentials you created</li>
                </ol>
              </div>
              
              <Button variant="outline" onClick={resetSimulator} className="w-full">
                <UserPlus className="h-4 w-4 mr-2" />
                Create Another Invitation
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
