import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}
      <nav className="w-full glass-panel border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-violet-600 rounded-lg flex items-center justify-center text-white font-bold">
              S
            </div>
            <span className="text-xl font-bold tracking-tight">SmartBoard</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
              Login
            </Link>
            <Link href="/register" className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors shadow-lg shadow-blue-500/20">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Background Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-[100px] -z-10"></div>

        <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight mb-6">
          Collaborate <span className="text-gradient">Smarter</span>, <br />
          Not Harder.
        </h1>
        <p className="max-w-2xl text-lg sm:text-xl text-slate-400 mb-10">
          The unified platform for academic and professional teams.
          Seamlessly integrate calendar, tasks, and automated workflows.
        </p>

        <div className="flex flex-col sm:flex-row gap-4">
          <button className="px-8 py-4 bg-white text-slate-900 font-bold rounded-xl hover:bg-slate-200 transition-colors shadow-xl">
            Launch Dashboard
          </button>
          <button className="px-8 py-4 glass-panel text-white font-medium rounded-xl hover:bg-white/10 transition-colors">
            View Features
          </button>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-20 max-w-6xl w-full">
          {[
            { title: "Smart Calendar", desc: "Interactive scheduling with drag-and-drop." },
            { title: "Smart Reminders", desc: "Automated notifications for deadlines & status changes." },
            { title: "Real-time Chat", desc: "Built-in communication for every task." }
          ].map((feature, i) => (
            <div key={i} className="glass-panel p-6 text-left hover:border-blue-500/50 transition-colors group">
              <h3 className="text-xl font-bold mb-2 group-hover:text-blue-400 transition-colors">{feature.title}</h3>
              <p className="text-slate-400">{feature.desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
