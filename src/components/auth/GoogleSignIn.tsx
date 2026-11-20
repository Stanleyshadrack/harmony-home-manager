import { useEffect, useRef, useState } from 'react';
import { apiRequest } from '@/api/https';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

type GoogleCredential = { credential?: string };
type GoogleIdentity = {
  initialize(options: { client_id: string; callback: (result: GoogleCredential) => void }): void;
  renderButton(container: HTMLElement, options: { theme: string; size: string; width: number; text: string }): void;
};
declare global { interface Window { google?: { accounts: { id: GoogleIdentity } } } }

const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim() || '';

export function GoogleSignIn({ onRequireOTP }: { onRequireOTP: (email: string) => void }) {
  const holder = useRef<HTMLDivElement>(null);
  const callbackRef = useRef(onRequireOTP);
  const [loading, setLoading] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  callbackRef.current = onRequireOTP;
  useEffect(() => {
    if (!clientId || !holder.current) return;
    let active = true;
    const render = () => {
      if (!active || !holder.current || !window.google) return;
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async ({ credential }) => {
          if (!credential) { toast.error('Google did not provide a credential'); return; }
          setLoading(true);
          try {
            const email = JSON.parse(atob(credential.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))).email;
            if (typeof email !== 'string' || !email) throw new Error('Google email missing');
            const result = await apiRequest<{credential:string}, {mfaRequired:boolean}>({
              path: '/api/auth/google', method: 'POST', body: { credential }
            });
            if (!result.mfaRequired) throw new Error('The server did not initiate email verification');
            callbackRef.current(email);
          } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Google sign-in failed');
          } finally { if (active) setLoading(false); }
        },
      });
      holder.current.replaceChildren();
      window.google.accounts.id.renderButton(holder.current, {
        theme: 'outline', size: 'large', width: 320, text: 'signin_with'
      });
    };
    if (window.google) render();
    else {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = render;
      script.onerror = () => { if (active) setLoadFailed(true); };
      document.head.appendChild(script);
      return () => { active = false; script.remove(); };
    }
    return () => { active = false; };
  }, []);
  if (!clientId) return null;
  return <div className="space-y-2">
    <div className="flex items-center gap-3 text-xs text-muted-foreground">
      <span className="h-px flex-1 bg-border" />or continue with<span className="h-px flex-1 bg-border" />
    </div>
    <div className="flex justify-center" ref={holder} aria-label="Sign in with Google" />
    {loading && <p role="status" className="flex items-center justify-center text-sm text-muted-foreground">
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />Verifying Google account…
    </p>}
    {loadFailed && <p role="alert" className="text-center text-xs text-destructive">
      Google sign-in could not load. Use email and password.
    </p>}
    <p className="text-center text-xs text-muted-foreground">
      Existing approved accounts only. An email verification code is still required.
    </p>
  </div>;
}
