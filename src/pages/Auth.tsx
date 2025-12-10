import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LoginForm } from '@/components/auth/LoginForm';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm';
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm';
import { EmailVerificationForm } from '@/components/auth/EmailVerificationForm';
import { TwoFactorVerification } from '@/components/auth/TwoFactorVerification';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { Building2 } from 'lucide-react';

type AuthView = 'login' | 'register' | 'forgot-password' | 'reset-password' | 'email-verification' | '2fa-verification';

export default function Auth() {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const [authView, setAuthView] = useState<AuthView>('login');
  const [resetEmail, setResetEmail] = useState('');
  const [verificationEmail, setVerificationEmail] = useState('');
  const [twoFactorEmail, setTwoFactorEmail] = useState('');
  const [pendingLoginRedirect, setPendingLoginRedirect] = useState<string | null>(null);

  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-primary/80" />
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-primary-foreground rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-primary-foreground rounded-full blur-3xl" />
        </div>
        
        <div className="relative z-10 flex flex-col justify-between p-12 text-primary-foreground">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-foreground/20 rounded-lg backdrop-blur">
              <Building2 className="h-8 w-8" />
            </div>
            <span className="text-2xl font-bold">{t('common.appName')}</span>
          </div>
          
          <div className="max-w-md">
            <h1 className="text-4xl font-bold mb-6">
              Property Management Made Simple
            </h1>
            <p className="text-lg text-primary-foreground/80 leading-relaxed">
              Streamline your property management workflow with our comprehensive 
              solution for landlords, property managers, and tenants.
            </p>
            
            <div className="mt-12 grid grid-cols-2 gap-6">
              <div className="p-4 bg-primary-foreground/10 rounded-lg backdrop-blur">
                <div className="text-3xl font-bold">500+</div>
                <div className="text-sm text-primary-foreground/70">Properties Managed</div>
              </div>
              <div className="p-4 bg-primary-foreground/10 rounded-lg backdrop-blur">
                <div className="text-3xl font-bold">98%</div>
                <div className="text-sm text-primary-foreground/70">Collection Rate</div>
              </div>
            </div>
          </div>
          
          <div className="text-sm text-primary-foreground/60">
            © 2024 PropManager. All rights reserved.
          </div>
        </div>
      </div>

      {/* Right Panel - Auth Forms */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="flex items-center justify-between p-4 lg:p-6">
          <div className="flex items-center gap-2 lg:hidden">
            <Building2 className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg">{t('common.appName')}</span>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <LanguageSwitcher />
            <ThemeSwitcher />
          </div>
        </header>

        {/* Form Container */}
        <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
          <div className="w-full max-w-md space-y-8">
            {(authView === 'login' || authView === 'register') && (
              <div className="text-center">
                <h2 className="text-2xl font-bold tracking-tight">
                  {authView === 'login' ? t('auth.loginTitle') : t('auth.registerTitle')}
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  {authView === 'login' ? t('auth.loginSubtitle') : t('auth.registerSubtitle')}
                </p>
              </div>
            )}

            <div className="bg-card p-6 sm:p-8 rounded-xl shadow-lg border">
              {authView === 'login' && (
                <LoginForm 
                  onSwitchToRegister={() => setAuthView('register')} 
                  onForgotPassword={() => setAuthView('forgot-password')}
                  onRequire2FA={(email, redirect) => {
                    setTwoFactorEmail(email);
                    setPendingLoginRedirect(redirect);
                    setAuthView('2fa-verification');
                  }}
                />
              )}
              {authView === 'register' && (
                <RegisterForm 
                  onSwitchToLogin={() => setAuthView('login')}
                  onEmailVerification={(email) => {
                    setVerificationEmail(email);
                    setAuthView('email-verification');
                  }}
                />
              )}
              {authView === 'forgot-password' && (
                <ForgotPasswordForm 
                  onBack={() => setAuthView('login')}
                  onCodeSent={(email) => {
                    setResetEmail(email);
                    setAuthView('reset-password');
                  }}
                />
              )}
              {authView === 'reset-password' && (
                <ResetPasswordForm 
                  email={resetEmail}
                  onBack={() => setAuthView('forgot-password')}
                  onSuccess={() => setAuthView('login')}
                />
              )}
              {authView === 'email-verification' && (
                <EmailVerificationForm
                  email={verificationEmail}
                  onBack={() => setAuthView('login')}
                  onSuccess={() => setAuthView('login')}
                />
              )}
              {authView === '2fa-verification' && (
                <TwoFactorVerification
                  email={twoFactorEmail}
                  onBack={() => setAuthView('login')}
                  onSuccess={() => {
                    // Complete the login after 2FA verification
                    window.location.href = pendingLoginRedirect || '/dashboard';
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
