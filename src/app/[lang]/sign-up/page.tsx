"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useAuthContext } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import { useT } from '@/i18n/useT';

export const dynamic = "force-static";

export default function SignUpPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { user, loading, error, signup } = useAuthContext();
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const params = useParams<{ lang: string }>();
  const lang = params?.lang || 'en';
  const router = useRouter();
  const { t } = useT();

  useEffect(() => {
    if (!loading && user) {
      router.replace(`/${lang}`);
    }
  }, [user, loading, router, lang]);

  const mapError = (err: unknown): string => {
    if (!err) return t('auth.errors.unknown');
    const status = (err as { status?: number }).status;
    const msg = (err as { message?: string }).message;
    if (msg === 'NETWORK_ERROR' || status === 0) return t('auth.errors.network');
    if (msg && /email already in use/i.test(msg)) return t('auth.errors.emailInUse');
    if (status === 409) return t('auth.errors.emailInUse');
    // simplistic weak password rule (backend currently only hashes) - placeholder for future validation
    if (msg && /password.*weak/i.test(msg)) return t('auth.errors.weakPassword');
    return t('auth.errors.unknown');
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    try {
      setSubmitting(true);
      await signup(username, email, password);
      router.push(`/${lang}`);
    } catch (err: unknown) {
      setFormError(mapError(err));
    } finally { setSubmitting(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4 py-10">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">{t('auth.signup.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('auth.signup.username')}</label>
              <Input value={username} onChange={(e) => setUsername(e.target.value)} required autoComplete="username" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('auth.signup.email')}</label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('auth.signup.password')}</label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="new-password" />
            </div>
            {(formError || error) && <p className="text-sm text-red-600">{formError || formError || error}</p>}
            <Button type="submit" disabled={submitting} className="w-full">
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {submitting ? t('auth.signup.signingUp') : t('auth.signup.button')}
            </Button>
            <div className="relative py-2 text-center text-xs text-muted-foreground">
              <span className="px-2 bg-background">{t('auth.signup.or')}</span>
            </div>
            <Button type="button" variant="outline" disabled title="Google OAuth coming soon" className="w-full">
              Continue with Google
            </Button>
            <p className="text-xs text-center text-muted-foreground">{t('auth.signup.haveAccount')} <Link className="underline" href={`/${lang}/login`}>{t('auth.signup.loginLink')}</Link></p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
