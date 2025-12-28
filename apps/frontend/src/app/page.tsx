import Image from "next/image";
import Link from "next/link";
import { FAQ_DATA } from "@/config/faq";

export default function Home() {
  const homeFaqIds = [
    'faq-smart-calendar',
    'faq-smart-reminders',
    'faq-real-time-chat',
    'faq-what-is-smartboard',
  ];

  const homeFaqItems = FAQ_DATA.filter((item) => homeFaqIds.includes(item.id));

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-mesh-gradient">
      {/* Floating Decorative Elements */}
      <div className="decorative-blob blob-purple w-[600px] h-[600px] -top-40 -left-40 animate-pulse-glow" />
      <div className="decorative-blob blob-blue w-[500px] h-[500px] top-1/3 -right-60 animate-pulse-glow" style={{ animationDelay: '2s' }} />
      <div className="decorative-blob blob-pink w-[400px] h-[400px] bottom-20 left-1/4 animate-pulse-glow" style={{ animationDelay: '4s' }} />

      {/* Floating sparkles */}
      <div className="absolute top-20 left-20 w-4 h-4 animate-sparkle">
        <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
          <path d="M12 2l2 8 8 2-8 2-2 8-2-8-8-2 8-2z" fill="#FBBF24" />
        </svg>
      </div>
      <div className="absolute top-40 right-40 w-6 h-6 animate-sparkle" style={{ animationDelay: '0.5s' }}>
        <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
          <path d="M12 2l2 8 8 2-8 2-2 8-2-8-8-2 8-2z" fill="#EC4899" />
        </svg>
      </div>
      <div className="absolute bottom-40 left-40 w-5 h-5 animate-sparkle" style={{ animationDelay: '1s' }}>
        <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
          <path d="M12 2l2 8 8 2-8 2-2 8-2-8-8-2 8-2z" fill="#8B5CF6" />
        </svg>
      </div>

      {/* Navbar */}
      <nav className="w-full glass-panel border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 via-violet-500 to-pink-500 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-violet-500/30 animate-bounce-subtle">
              S
            </div>
            <span className="text-xl font-bold tracking-tight">
              Smart<span className="text-gradient-static">Board</span>
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium text-slate-300 hover:text-white transition-colors hover:scale-105 transform">
              Login
            </Link>
            <Link href="/register" className="btn-primary text-sm">
              Get Started ✨
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 sm:px-6 lg:px-8 relative py-12">
        <div className="max-w-7xl w-full grid lg:grid-cols-2 gap-12 items-center">
          {/* Left side - Text content */}
          <div className="text-left space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-violet-500/20 to-pink-500/20 border border-violet-500/30 text-sm">
              <span className="animate-wave inline-block">👋</span>
              <span className="text-violet-300">Welcome to the future of collaboration</span>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-tight">
              Collaborate{' '}
              <span className="text-gradient">Smarter</span>,
              <br />
              Not Harder.
            </h1>

            <p className="max-w-xl text-lg sm:text-xl text-slate-400 leading-relaxed">
              The <span className="text-violet-400 font-medium">unified platform</span> for academic and professional teams.
              Seamlessly integrate calendar, tasks, and real-time collaboration with{' '}
              <span className="text-pink-400 font-medium">AI assistance</span>.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link href="/login" className="btn-primary text-center flex items-center justify-center gap-2">
                <span>Launch Dashboard</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>

            {/* Trust badges */}
            <div className="flex items-center gap-8 pt-6 opacity-60">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-violet-500 border-2 border-slate-900"></div>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-pink-500 to-orange-500 border-2 border-slate-900"></div>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-500 to-teal-500 border-2 border-slate-900"></div>
                </div>
                <span className="text-sm text-slate-400">1000+ active users</span>
              </div>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map(i => (
                  <svg key={i} className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
                <span className="text-sm text-slate-400 ml-1">4.9/5 rating</span>
              </div>
            </div>
          </div>

          {/* Right side - Illustration */}
          <div className="relative lg:h-[500px] flex items-center justify-center">
            <div className="relative animate-float">
              <Image
                src="/hero-illustration.svg"
                alt="SmartBoard Collaboration"
                width={450}
                height={450}
                className="drop-shadow-2xl"
                priority
              />
            </div>

            {/* Floating mini elements around illustration */}
            <div className="absolute top-10 right-0 animate-float-delayed">
              <div className="glass-panel-glow p-3 flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-400 to-emerald-500 flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-sm font-medium">Task Complete!</span>
              </div>
            </div>

            <div className="absolute bottom-20 left-0 animate-float-slow">
              <div className="glass-panel-glow p-3 flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-pink-400 to-rose-500 flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <span className="text-sm font-medium">New Message</span>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mt-24 max-w-6xl w-full">
          {[
            {
              title: "Smart Calendar",
              desc: "Interactive scheduling with drag-and-drop. Never miss a deadline again.",
              icon: "/calendar-icon.svg",
              gradient: "from-blue-500 to-violet-500",
              learnMoreHref: "#faq-smart-calendar"
            },
            {
              title: "Notifications",
              desc: "In-app notifications for important workflow updates and deadlines.",
              icon: "/reminder-icon.svg",
              gradient: "from-amber-500 to-pink-500",
              learnMoreHref: "#faq-smart-reminders"
            },
            {
              title: "Real-time Chat",
              desc: "Built-in communication for every task. Collaborate seamlessly.",
              icon: "/chat-icon.svg",
              gradient: "from-emerald-500 to-blue-500",
              learnMoreHref: "#faq-real-time-chat"
            }
          ].map((feature, i) => (
            <div
              key={i}
              className="illustration-card glass-panel-glow p-8 text-left group"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div className="mb-6 relative w-20 h-20">
                <Image
                  src={feature.icon}
                  alt={feature.title}
                  width={80}
                  height={80}
                  className="group-hover:scale-110 transition-transform duration-300"
                />
              </div>
              <h3 className={`text-xl font-bold mb-3 bg-gradient-to-r ${feature.gradient} bg-clip-text text-transparent`}>
                {feature.title}
              </h3>
              <p className="text-slate-400 leading-relaxed">{feature.desc}</p>
              <Link
                href={feature.learnMoreHref}
                className="mt-4 inline-flex items-center text-sm text-violet-400 group-hover:text-violet-300 transition-colors"
              >
                <span>Learn more</span>
                <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <section id="faq" className="mt-24 max-w-6xl w-full text-left">
          <div className="glass-panel-glow p-8">
            <div className="flex items-start justify-between gap-6 mb-6">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold">FAQ</h2>
                <p className="text-slate-400 mt-2">Quick answers to common SmartBoard questions.</p>
              </div>
              <Link href="/faq" className="text-sm text-violet-300 hover:text-violet-200 transition-colors whitespace-nowrap">
                View all FAQs
              </Link>
            </div>

            <div className="space-y-3">
              {homeFaqItems.map((item) => (
                <details
                  key={item.id}
                  id={item.id}
                  className="scroll-mt-24 bg-white/3 p-4 rounded-lg border border-white/5"
                >
                  <summary className="cursor-pointer font-medium text-white">{item.q}</summary>
                  <div className="mt-2 text-slate-300">{item.a}</div>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <div className="mt-24 text-center max-w-2xl">
          <h2 className="text-3xl font-bold mb-4">Ready to boost your productivity?</h2>
          <p className="text-slate-400 mb-8">Join thousands of teams already using SmartBoard to work smarter together.</p>
          <Link href="/register" className="btn-primary inline-flex items-center gap-2">
            <span>Start Free Trial</span>
            <span>🚀</span>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-slate-500 text-sm">
          © 2024 SmartBoard. Built with ❤️ for productive teams.
        </div>
      </footer>
    </div>
  );
}
