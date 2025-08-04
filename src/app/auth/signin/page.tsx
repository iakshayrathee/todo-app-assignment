'use client';

import { useState } from 'react';
import { signIn, getSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { Loader2, LogIn, Mail, Lock } from 'lucide-react';
import { signInSchema, type SignInValues } from '@/lib/validations';
import { handleApiError, showSuccessToast } from '@/lib/toast';
import Link from 'next/link';

export default function SignIn() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const form = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (values: SignInValues) => {
    setIsLoading(true);
    
    try {
      // First, get the user's role by making a sign-in attempt
      const signInResult = await signIn('credentials', {
        email: values.email,
        password: values.password,
        redirect: false,
      });

      if (signInResult?.error) {
        if (signInResult.error.includes('pending approval')) {
          handleApiError(new Error('Your account is pending admin approval. Please wait for approval before signing in.'));
        } else {
          handleApiError(new Error('Invalid email or password. Please check your credentials and try again.'));
        }
        setIsLoading(false);
        return;
      }

      // Get the session to determine user role
      const session = await getSession();
      const isAdmin = session?.user?.role === 'admin';
      const redirectPath = isAdmin ? '/admin' : '/dashboard';
      const userName = session?.user?.name || 'User';
      
      // Show success message
      showSuccessToast.signInSuccess(userName);
      
      // Perform the actual sign-in with the correct redirect URL
      await signIn('credentials', {
        email: values.email,
        password: values.password,
        redirect: false,
        callbackUrl: redirectPath
      });
      
      // Force a full page reload to ensure auth state is properly set
      window.location.href = redirectPath;
    } catch (error) {
      setIsLoading(false);
      handleApiError(error, 'Failed to sign in');
    }
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20 p-4">
        <Card className="w-full max-w-md shadow-2xl border-0 bg-card/95 backdrop-blur">
          <CardHeader className="space-y-4 pb-6">
            <div className="flex items-center justify-center">
              <div className="p-3 rounded-full bg-primary/10">
                <LogIn className="h-6 w-6 text-primary" />
              </div>
            </div>
            <div className="text-center space-y-2">
              <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
              <CardDescription className="text-base">
                Sign in to your account to continue
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Email Address
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter your email"
                          type="email"
                          className="h-11"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium flex items-center gap-2">
                        <Lock className="h-4 w-4" />
                        Password
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter your password"
                          type="password"
                          className="h-11"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button 
                  type="submit" 
                  className="w-full h-11 font-medium" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      <LogIn className="mr-2 h-4 w-4" />
                      Sign In
                    </>
                  )}
                </Button>
              </form>
            </Form>
            
            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Don&apos;t have an account?{' '}
                <Link 
                  href="/auth/signup" 
                  className="font-medium text-primary hover:text-primary/80 transition-colors"
                >
                  Create account
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </ErrorBoundary>
  );
}
