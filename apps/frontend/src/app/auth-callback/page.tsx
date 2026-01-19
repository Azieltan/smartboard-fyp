'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';

export default function AuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'syncing' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the current session from Supabase
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('Session error:', sessionError);
          setError('Failed to get session');
          setStatus('error');
          return;
        }

        if (!session?.user) {
          // No session yet, listen for auth state change
          const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
              if (event === 'SIGNED_IN' && session?.user) {
                await syncUserWithBackend(session.user);
              }
            }
          );

          // Timeout after 10 seconds
          setTimeout(() => {
            subscription.unsubscribe();
            if (status === 'loading') {
              setError('Authentication timed out. Please try again.');
              setStatus('error');
            }
          }, 10000);

          return;
        }

        // Session exists, sync with backend
        await syncUserWithBackend(session.user);

      } catch (err: any) {
        console.error('Callback error:', err);
        setError(err.message || 'Authentication failed');
        setStatus('error');
      }
    };

    const syncUserWithBackend = async (user: any) => {
      setStatus('syncing');

      try {
        // Get user metadata
        const displayName = user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          user.email?.split('@')[0] ||
          'User';
        const avatarUrl = user.user_metadata?.avatar_url ||
          user.user_metadata?.picture ||
          null;

        // Call backend to sync OAuth user and get JWT
        const response = await fetch('http://localhost:3001/auth/oauth-sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            supabaseUserId: user.id,
            email: user.email,
            displayName: displayName,
            avatarUrl: avatarUrl,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to sync user');
        }

        const result = await response.json();

        // Store token and user in localStorage
        localStorage.setItem('token', result.token);
        localStorage.setItem('user', JSON.stringify(result.user));

        setStatus('success');

        // Redirect based on whether user is new or existing
        if (result.isNewUser) {
          // New user - optionally redirect to complete profile
          router.push('/complete-profile');
        } else {
          // Existing user - go to dashboard
          router.push('/dashboard');
        }

      } catch (err: any) {
        console.error('Sync error:', err);
        setError(err.message || 'Failed to sync with server');
        setStatus('error');
      }
    };

    handleCallback();
  }, [router, status]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-mesh-gradient">
      <div className="glass-panel-glow p-8 sm:p-10 max-w-md w-full text-center">
        {status === 'loading' && (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-violet-500 mx-auto mb-4"></div>
            <h2 className="text-xl font-bold mb-2">Signing you in...</h2>
            <p className="text-slate-400">Please wait while we authenticate with Google</p>
          </>
        )}

        {status === 'syncing' && (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500 mx-auto mb-4"></div>
            <h2 className="text-xl font-bold mb-2">Setting up your account...</h2>
            <p className="text-slate-400">Almost there!</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold mb-2">Success!</h2>
            <p className="text-slate-400">Redirecting to dashboard...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-bold mb-2 text-red-400">Authentication Failed</h2>
            <p className="text-slate-400 mb-4">{error}</p>
            <button
              onClick={() => router.push('/login')}
              className="btn-primary px-6 py-2"
            >
              Back to Login
            </button>
          </>
        )}
      </div>
    </div>
  );
}
