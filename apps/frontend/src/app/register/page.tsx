'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function RegisterPage() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const res = await fetch('http://localhost:3001/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: name, email, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Registration failed');
            }

            alert('Registration successful! Please login.');
            router.push('/login');
        } catch (error: any) {
            alert(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex relative overflow-hidden bg-mesh-gradient">
            {/* Decorative Elements */}
            <div className="decorative-blob blob-purple w-[500px] h-[500px] -top-40 -right-40 animate-pulse-glow" />
            <div className="decorative-blob blob-blue w-[400px] h-[400px] bottom-0 left-0 animate-pulse-glow" style={{ animationDelay: '2s' }} />
            <div className="decorative-blob blob-pink w-[300px] h-[300px] top-1/2 left-1/3 animate-pulse-glow" style={{ animationDelay: '4s' }} />

            {/* Sparkles */}
            <div className="absolute top-20 left-20 w-4 h-4 animate-sparkle">
                <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
                    <path d="M12 2l2 8 8 2-8 2-2 8-2-8-8-2 8-2z" fill="#10B981" />
                </svg>
            </div>
            <div className="absolute bottom-40 right-40 w-5 h-5 animate-sparkle" style={{ animationDelay: '1s' }}>
                <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
                    <path d="M12 2l2 8 8 2-8 2-2 8-2-8-8-2 8-2z" fill="#8B5CF6" />
                </svg>
            </div>
            <div className="absolute top-1/2 right-20 w-3 h-3 animate-sparkle" style={{ animationDelay: '0.5s' }}>
                <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
                    <path d="M12 2l2 8 8 2-8 2-2 8-2-8-8-2 8-2z" fill="#FBBF24" />
                </svg>
            </div>

            {/* Left Panel - Registration Form */}
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
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 mb-4">
                                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                                </svg>
                            </div>
                            <h2 className="text-3xl font-bold tracking-tight mb-2">Create Account 🚀</h2>
                            <p className="text-slate-400">Start your productivity journey today</p>
                        </div>

                        <form onSubmit={handleRegister} className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Full Name
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                    </div>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full pl-12 pr-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all text-white placeholder-slate-500"
                                        placeholder="John Doe"
                                        required
                                    />
                                </div>
                            </div>

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
                                        className="w-full pl-12 pr-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all text-white placeholder-slate-500"
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
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full pl-12 pr-12 py-3 bg-slate-900/50 border border-white/10 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all text-white placeholder-slate-500"
                                        placeholder="••••••••"
                                        required
                                    />
                                    <button
                                        type="button"
                                        aria-pressed={showPassword}
                                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                                        onClick={() => setShowPassword((s) => !s)}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200"
                                    >
                                        {showPassword ? (
                                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-5 0-9-3.5-10-8a18.62 18.62 0 012.4-4.3M6.5 6.5L17.5 17.5M9.9 9.9A3 3 0 0014.1 14.1" />
                                            </svg>
                                        ) : (
                                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                                <p className="mt-2 text-xs text-slate-500">Must be at least 8 characters</p>
                            </div>

                            <div className="flex items-start gap-3">
                                <input
                                    type="checkbox"
                                    id="terms"
                                    className="mt-1 w-4 h-4 rounded border-white/20 bg-slate-900/50 text-emerald-500 focus:ring-emerald-500"
                                    required
                                />
                                <label htmlFor="terms" className="text-sm text-slate-400">
                                    I agree to the{' '}
                                    <a href="#" className="text-emerald-400 hover:text-emerald-300">Terms of Service</a>
                                    {' '}and{' '}
                                    <a href="#" className="text-emerald-400 hover:text-emerald-300">Privacy Policy</a>
                                </label>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-4 px-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/25 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isLoading ? (
                                    <>
                                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        <span>Creating account...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Create Account</span>
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                        </svg>
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="mt-8 text-center">
                            <p className="text-slate-400">
                                Already have an account?{' '}
                                <Link href="/login" className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors">
                                    Sign In
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

            {/* Right Panel - Illustration */}
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
                            Join SmartBoard
                        </h2>
                        <p className="text-slate-400 text-lg">
                            Experience the power of AI-driven collaboration and boost your team's productivity.
                        </p>
                    </div>

                    {/* Benefits */}
                    <div className="space-y-4 text-left">
                        {[
                            { icon: '✨', text: 'AI assistance with Ask Smarty' },
                            { icon: '📅', text: 'Shared calendar scheduling' },
                            { icon: '💬', text: 'Real-time team collaboration' },
                            { icon: '🔔', text: 'In-app notifications & due dates' }
                        ].map((benefit, i) => (
                            <div
                                key={i}
                                className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10"
                            >
                                <span className="text-xl">{benefit.icon}</span>
                                <span className="text-slate-300">{benefit.text}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
