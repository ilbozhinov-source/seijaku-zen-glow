import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { z } from 'zod';
import { ArrowLeft, Loader2, Lock, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const ResetPassword = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isValidSession, setIsValidSession] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if we have a valid recovery session
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      // Check for recovery event in URL hash
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const type = hashParams.get('type');
      
      if (session || type === 'recovery') {
        setIsValidSession(true);
      }
      setIsLoading(false);
    };

    // Listen for auth state changes (recovery link click)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsValidSession(true);
        setIsLoading(false);
      }
    });

    checkSession();

    return () => subscription.unsubscribe();
  }, []);

  const passwordSchema = z.object({
    password: z.string().min(6, { message: t('auth.passwordMinLength') }),
    confirmPassword: z.string()
  }).refine((data) => data.password === data.confirmPassword, {
    message: t('auth.passwordsDoNotMatch'),
    path: ['confirmPassword']
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const result = passwordSchema.safeParse({ password, confirmPassword });
    if (!result.success) {
      toast.error(result.error.errors[0].message);
      return;
    }

    setIsSubmitting(true);
    
    const { error } = await supabase.auth.updateUser({ password });

    setIsSubmitting(false);

    if (error) {
      toast.error(error.message);
    } else {
      setIsSuccess(true);
      toast.success(t('auth.passwordResetSuccess'));
      setTimeout(() => {
        navigate('/auth');
      }, 3000);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-soft">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isValidSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-soft px-4">
        <div className="w-full max-w-md">
          <Card className="border-primary/20 shadow-zen">
            <CardHeader className="text-center">
              <div className="text-primary text-4xl mb-2">静寂</div>
              <CardTitle className="text-2xl">{t('auth.invalidResetLink')}</CardTitle>
              <CardDescription>{t('auth.invalidResetLinkDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/forgot-password">
                <Button className="w-full">{t('auth.requestNewLink')}</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-soft px-4">
      <div className="w-full max-w-md">
        <Link to="/auth" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t('auth.backToLogin')}
        </Link>

        <Card className="border-primary/20 shadow-zen">
          <CardHeader className="text-center">
            <div className="text-primary text-4xl mb-2">静寂</div>
            <CardTitle className="text-2xl">{t('auth.resetPassword')}</CardTitle>
            <CardDescription>{t('auth.resetPasswordDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            {isSuccess ? (
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <CheckCircle className="h-16 w-16 text-primary" />
                </div>
                <h3 className="text-lg font-medium">{t('auth.passwordResetSuccess')}</h3>
                <p className="text-muted-foreground text-sm">
                  {t('auth.redirectingToLogin')}
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">{t('auth.newPassword')}</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">{t('auth.confirmPassword')}</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  {t('auth.resetPasswordButton')}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResetPassword;
