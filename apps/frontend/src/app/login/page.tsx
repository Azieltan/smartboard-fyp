'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { supabase } from '../../lib/supabase';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // Phone Auth States
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [showOtpInput, setShowOtpInput] = useState(false);

    const [loginMethod, setLoginMethod] = useState<'email' | 'phone'>('email'); // 'email' | 'phone'
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);

    // Initial auth check & sync listener
    useEffect(() => {
        const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN' && session) {
                // Determine if we need to sync (if we don't have our own app token)
                // or just always sync to be safe/fresh.
                try {
                    // Start sync
                    // We show loading if not already
                    // setIsLoading(true); // Maybe too aggressive if background sync

                    const res = await fetch('http://localhost:3001/auth/sync', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ access_token: session.access_token }),
                    });

                    if (res.ok) {
                        const data = await res.json();
                        localStorage.setItem('token', data.token);
                        localStorage.setItem('user', JSON.stringify(data.user));
                        window.location.href = '/dashboard';
                    } else {
                        console.error("Sync failed", await res.text());
                    }
                } catch (e) {
                    console.error("Sync error", e);
                }
            }
        });

        return () => {
            authListener.subscription.unsubscribe();
        };
    }, []);

    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            // Use existing backend login for Email/Password (Legacy Support & Custom Logic)
            const res = await fetch('http://localhost:3001/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Login failed');
            }

            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            window.location.href = '/dashboard';
        } catch (error: any) {
            alert(error.message || 'Login failed');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setIsGoogleLoading(true);
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/auth-callback`,
                },
            });
            if (error) {
                throw error;
            }
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Google login failed';
            alert(message);
            setIsGoogleLoading(false);
        }
    };

    const handlePhoneLoginStep1 = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const { error } = await supabase.auth.signInWithOtp({
                phone: phone,
            });
            if (error) throw error;
            setShowOtpInput(true);
            alert('OTP sent to your phone!');
        } catch (error: any) {
            alert(error.message || 'Failed to send OTP. Ensure SMS provider is configured in Supabase.');
        } finally {
            setIsLoading(false);
        }
    };

    const handlePhoneLoginStep2 = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const { error, data } = await supabase.auth.verifyOtp({
                phone: phone,
                token: otp,
                type: 'sms',
            });
            if (error) throw error;

            // Success will trigger onAuthStateChange
        } catch (error: any) {
            alert(error.message || 'Invalid OTP');
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex relative overflow-hidden bg-mesh-gradient">
            {/* Decorative Elements */}
            <div className="decorative-blob blob-purple w-[500px] h-[500px] -top-40 -left-40 animate-pulse-glow" />
            <div className="decorative-blob blob-blue w-[400px] h-[400px] bottom-0 right-0 animate-pulse-glow" style={{ animationDelay: '2s' }} />
            <div className="decorative-blob blob-pink w-[300px] h-[300px] top-1/2 right-1/3 animate-pulse-glow" style={{ animationDelay: '4s' }} />

            {/* Left Panel - Illustration */}
            <div className="hidden lg:flex lg:w-1/2 items-center justify-center p-12 relative">
                <div className="max-w-lg text-center space-y-8">
                    <div className="animate-float">
                        <Image
                            src="/hero-illustration.svg"
                            alt="Collaboration"
                            width={400}
                            height={400}
                            className="mx-auto drop-shadow-2xl"
                        />
                    </div>
                    <div className="space-y-4">
                        <h2 className="text-3xl font-bold text-gradient">
                            Welcome to SmartBoard
                        </h2>
                        <p className="text-slate-400 text-lg">
                            Your AI-powered workspace for seamless collaboration and productivity.
                        </p>
                    </div>
                </div>
            </div>

            {/* Right Panel - Login Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
                <div className="w-full max-w-md">
                    <div className="lg:hidden text-center mb-8">
                        <div className="inline-flex items-center gap-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-violet-500 to-pink-500 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-violet-500/30">
                                S
                            </div>
                            <span className="text-2xl font-bold">
                                Smart<span className="text-gradient-static">Board</span>
                            </span>
                        </div>
                    </div>

                    <div className="glass-panel-glow p-8 sm:p-10">
                        <div className="text-center mb-8">
                            <h2 className="text-3xl font-bold tracking-tight mb-2">Welcome Back! 👋</h2>
                            <p className="text-slate-400">Sign in to continue your journey</p>
                        </div>

                        {/* Tabs */}
                        <div className="grid grid-cols-2 gap-2 mb-6 p-1 bg-slate-900/50 rounded-xl border border-white/10">
                            <button
                                onClick={() => setLoginMethod('email')}
                                className={`py-2 text-sm font-medium rounded-lg transition-all ${loginMethod === 'email'
                                    ? 'bg-violet-600 text-white shadow-lg'
                                    : 'text-slate-400 hover:text-white'
                                    }`}
                            >
                                Email
                            </button>
                            <button
                                onClick={() => setLoginMethod('phone')}
                                className={`py-2 text-sm font-medium rounded-lg transition-all ${loginMethod === 'phone'
                                    ? 'bg-violet-600 text-white shadow-lg'
                                    : 'text-slate-400 hover:text-white'
                                    }`}
                            >
                                Phone
                            </button>
                        </div>

                        {/* Forms */}
                        {loginMethod === 'email' ? (
                            <form onSubmit={handleEmailLogin} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Email Address</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                                            </svg>
                                        </div>
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full pl-12 pr-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all text-white placeholder-slate-500"
                                            placeholder="name@example.com"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                            </svg>
                                        </div>
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full pl-12 pr-12 py-3 bg-slate-900/50 border border-white/10 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all text-white placeholder-slate-500"
                                            placeholder="••••••••"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200"
                                        >
                                            {showPassword ? (
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-5 0-9-3.5-10-8a18.62 18.62 0 012.4-4.3M6.5 6.5L17.5 17.5M9.9 9.9A3 3 0 0014.1 14.1" /></svg>
                                            ) : (
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                            )}
                                        </button>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between text-sm">
                                    <label className="flex items-center gap-2 cursor-pointer group">
                                        <input type="checkbox" className="w-4 h-4 rounded border-white/20 bg-slate-900/50 text-violet-500 focus:ring-violet-500" />
                                        <span className="text-slate-400 group-hover:text-slate-300 transition-colors">Remember me</span>
                                    </label>
                                    <Link href="/forgot-password" className="text-violet-400 hover:text-violet-300 transition-colors">
                                        Forgot password?
                                    </Link>
                                </div>

                                <button type="submit" disabled={isLoading} className="w-full btn-primary py-4 flex items-center justify-center gap-2 disabled:opacity-50">
                                    {isLoading ? 'Signing in...' : 'Sign In'}
                                </button>
                            </form>
                        ) : (
                            <form onSubmit={showOtpInput ? handlePhoneLoginStep2 : handlePhoneLoginStep1} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Phone Number</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                            </svg>
                                        </div>
                                        <input
                                            type="tel"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            className="w-full pl-12 pr-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all text-white placeholder-slate-500 disabled:opacity-50"
                                            placeholder="+1234567890"
                                            required
                                            disabled={showOtpInput}
                                        />
                                    </div>
                                    <p className="mt-2 text-xs text-slate-500">Include country code (e.g. +1...)</p>
                                </div>

                                {showOtpInput && (
                                    <div className="animate-in slide-in-from-top-2 fade-in">
                                        <label className="block text-sm font-medium text-slate-300 mb-2">Verify Code</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                                </svg>
                                            </div>
                                            <input
                                                type="text"
                                                value={otp}
                                                onChange={(e) => setOtp(e.target.value)}
                                                className="w-full pl-12 pr-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all text-white placeholder-slate-500"
                                                placeholder="123456"
                                                required
                                            />
                                        </div>
                                    </div>
                                )}

                                <button type="submit" disabled={isLoading} className="w-full btn-primary py-4 flex items-center justify-center gap-2 disabled:opacity-50">
                                    {isLoading ? (showOtpInput ? 'Verifying...' : 'Sending...') : (showOtpInput ? 'Verify Login' : 'Send Code')}
                                </button>

                                {showOtpInput && (
                                    <button
                                        type="button"
                                        onClick={() => setShowOtpInput(false)}
                                        className="w-full text-sm text-slate-400 hover:text-white mt-2"
                                    >
                                        Change Phone Number
                                    </button>
                                )}
                            </form>
                        )}

                        {/* Divider */}
                        <div className="relative my-6">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-white/10"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-4 bg-[#0f172a] text-slate-400">or continue with</span>
                            </div>
                        </div>

                        {/* Google Login Button */}
                        <button
                            type="button"
                            onClick={handleGoogleLogin}
                            disabled={isGoogleLoading}
                            className="w-full py-3 px-4 bg-white hover:bg-gray-100 text-gray-800 font-medium rounded-xl shadow-lg transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                        >
                            {isGoogleLoading ? (
                                <>
                                    <svg className="animate-spin h-5 w-5 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span>Connecting...</span>
                                </>
                            ) : (
                                <>
                                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                    </svg>
                                    <span>Continue with Google</span>
                                </>
                            )}
                        </button>

                        <div className="mt-8 text-center">
                            <p className="text-slate-400">
                                Don&apos;t have an account?{' '}
                                <Link href="/register" className="text-violet-400 hover:text-violet-300 font-medium transition-colors">
                                    Create Account ✨
                                </Link>
                            </p>
                        </div>
                    </div>


                    {/* Back to home */}
                    <div className="mt-6 text-center">
                        <Link href="/" className="text-sm text-slate-500 hover:text-slate-300 transition-colors inline-flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            <span>Back to Home</span>
                        </Link>
                    </div>

                </div>
            </div>
        </div>
    );
}
