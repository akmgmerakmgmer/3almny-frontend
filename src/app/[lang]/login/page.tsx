"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useAuthContext } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import { useT } from '@/i18n/useT';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { user, loading, error, login } = useAuthContext();
  const params = useParams<{ lang: string }>();
  const lang = params?.lang || 'en';
  const router = useRouter();
  const { t } = useT();

  const [formError, setFormError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false); // button-only loading


  const mapAndSetErrors = (err: unknown) => {
    setEmailError(null); setPasswordError(null); setFormError(null);
    if (!err) { setFormError(t('auth.errors.unknown')); return; }
    const status = (err as { status?: number }).status;
    const msg = (err as { message?: string }).message;
    if (msg === 'NETWORK_ERROR' || status === 0) { setFormError(t('auth.errors.network')); return; }
    if (msg === 'EMAIL_NOT_FOUND') { setEmailError(t('auth.errors.emailNotFound')); return; }
    if (msg === 'INCORRECT_PASSWORD') { setPasswordError(t('auth.errors.incorrectPassword')); return; }
    if (msg && /invalid credentials/i.test(msg)) { setFormError(t('auth.errors.invalidCredentials')); return; }
    if (status === 404) { setFormError(t('auth.errors.invalidCredentials')); return; }
    if (status === 401) { setFormError(t('auth.errors.invalidCredentials')); return; }
    setFormError(t('auth.errors.unknown'));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
  setFormError(null); setEmailError(null); setPasswordError(null);
    try {
      setSubmitting(true);
      await login(email, password);
      router.push(`/${lang}`);
    } catch (err: unknown) {
      mapAndSetErrors(err);
    } finally {
      setSubmitting(false);
    }
  };


  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4 py-10">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">{t('auth.login.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">{t('auth.login.email')}</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); if (emailError) setEmailError(null); }}
                required
                autoComplete="email"
                aria-invalid={!!emailError}
                aria-describedby={emailError ? 'email-error' : undefined}
              />
              {emailError && <p id="email-error" className="text-xs text-red-600">{emailError}</p>}
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">{t('auth.login.password')}</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); if (passwordError) setPasswordError(null); }}
                required
                autoComplete="current-password"
                aria-invalid={!!passwordError}
                aria-describedby={passwordError ? 'password-error' : undefined}
              />
              {passwordError && <p id="password-error" className="text-xs text-red-600">{passwordError}</p>}
            </div>
            {(formError || error) && <p className="text-sm text-red-600">{formError || error}</p>}
            <Button type="submit" disabled={submitting} className="w-full">
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {submitting ? t('auth.login.loading') : t('auth.login.button')}
            </Button>
            <div className="relative py-2 text-center text-xs text-muted-foreground">
              <span className="px-2 bg-background">{t('auth.signup.or')}</span>
            </div>
            <Button type="button" variant="outline" disabled title="Google OAuth coming soon" className="w-full">
              Continue with Google
            </Button>
            <p className="text-xs text-center text-muted-foreground">{t('auth.login.noAccount')} <Link className="underline" href={`/${lang}/sign-up`}>{t('auth.login.signUpLink')}</Link></p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
