'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
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

            // Force redirect to ensure state is picked up
            window.location.href = '/dashboard';
        } catch (error: any) {
            alert(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex relative overflow-hidden bg-mesh-gradient">
            {/* Decorative Elements */}
            <div className="decorative-blob blob-purple w-[500px] h-[500px] -top-40 -left-40 animate-pulse-glow" />
            <div className="decorative-blob blob-blue w-[400px] h-[400px] bottom-0 right-0 animate-pulse-glow" style={{ animationDelay: '2s' }} />
            <div className="decorative-blob blob-pink w-[300px] h-[300px] top-1/2 right-1/3 animate-pulse-glow" style={{ animationDelay: '4s' }} />

            {/* Sparkles */}
            <div className="absolute top-20 right-20 w-4 h-4 animate-sparkle">
                <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
                    <path d="M12 2l2 8 8 2-8 2-2 8-2-8-8-2 8-2z" fill="#FBBF24" />
                </svg>
            </div>
            <div className="absolute bottom-40 left-40 w-5 h-5 animate-sparkle" style={{ animationDelay: '1s' }}>
                <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
                    <path d="M12 2l2 8 8 2-8 2-2 8-2-8-8-2 8-2z" fill="#EC4899" />
                </svg>
            </div>

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

                    {/* Feature pills */}
                    <div className="flex flex-wrap justify-center gap-3">
                        {['📅 Smart Calendar', '🔔 Auto Reminders', '💬 Team Chat', '🤖 AI Assistant'].map((feature, i) => (
                            <span
                                key={i}
                                className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-slate-300"
                            >
                                {feature}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right Panel - Login Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
                <div className="w-full max-w-md">
                    {/* Logo for mobile */}
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
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-r from-blue-500 to-violet-500 mb-4">
                                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            </div>
                            <h2 className="text-3xl font-bold tracking-tight mb-2">Welcome Back! 👋</h2>
                            <p className="text-slate-400">Sign in to continue your journey</p>
                        </div>

                        <form onSubmit={handleLogin} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Email Address
                                </label>
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
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Password
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                        </svg>
                                    </div>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full pl-12 pr-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all text-white placeholder-slate-500"
                                        placeholder="••••••••"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-between text-sm">
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <input type="checkbox" className="w-4 h-4 rounded border-white/20 bg-slate-900/50 text-violet-500 focus:ring-violet-500" />
                                    <span className="text-slate-400 group-hover:text-slate-300 transition-colors">Remember me</span>
                                </label>
                                <a href="#" className="text-violet-400 hover:text-violet-300 transition-colors">
                                    Forgot password?
                                </a>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full btn-primary py-4 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? (
                                    <>
                                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        <span>Signing in...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Sign In</span>
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                        </svg>
                                    </>
                                )}
                            </button>
                        </form>


                        <div className="mt-8 text-center">
                            <p className="text-slate-400">
                                Don't have an account?{' '}
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
