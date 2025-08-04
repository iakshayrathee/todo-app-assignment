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
      // Get the callback URL from search params or default to dashboard
      const urlParams = new URLSearchParams(window.location.search);
      const callbackUrl = urlParams.get('callbackUrl') || '/dashboard';
      
      // Perform sign-in with NextAuth's built-in redirect handling
      const signInResult = await signIn('credentials', {
        email: values.email,
        password: values.password,
        callbackUrl,
        redirect: false, // We'll handle redirect manually after success
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

      if (signInResult?.ok) {
        // Get the session to determine user role and show success message
        const session = await getSession();
        const userName = session?.user?.name || 'User';
        const isAdmin = session?.user?.role === 'admin';
        
        // Show success message
        showSuccessToast.signInSuccess(userName);
        
        // Determine the correct redirect path based on user role
        let redirectPath = callbackUrl;
        
        // If user is admin and trying to access dashboard, redirect to admin
        if (isAdmin && callbackUrl === '/dashboard') {
          redirectPath = '/admin';
        }
        // If user is not admin and trying to access admin, redirect to dashboard
        else if (!isAdmin && callbackUrl.startsWith('/admin')) {
          redirectPath = '/dashboard';
        }
        
        // Use router.push for client-side navigation
        router.push(redirectPath);
      } else {
        handleApiError(new Error('Sign in failed. Please try again.'));
        setIsLoading(false);
      }
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
