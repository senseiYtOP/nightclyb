import { db } from "@/db";
import { sql } from "drizzle-orm";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  await db.execute(sql`select 1`);

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Navigation */}
      <nav className="border-b border-slate-700 bg-slate-900/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="text-xl font-bold text-white">NightDevs Hub</div>
          <div className="flex items-center gap-4">
            <Link href="/api/auth/login" className="text-slate-300 hover:text-white">
              Sign In
            </Link>
            <Link
              href="/api/auth/register"
              className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-white md:text-6xl">
            Welcome to NightDevs Hub
          </h1>
          <p className="mt-6 text-xl text-slate-300">
            The ultimate marketplace for developers to share, sell, and discover premium development tools.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Link
              href="/projects"
              className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700"
            >
              Explore Projects
            </Link>
            <Link
              href="/sell"
              className="rounded-lg border border-slate-600 px-6 py-3 font-semibold text-white hover:border-slate-500"
            >
              Start Selling
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <h2 className="text-center text-3xl font-bold text-white">Why Choose NightDevs?</h2>
        <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3">
          <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-8">
            <div className="text-3xl">🔒</div>
            <h3 className="mt-4 text-xl font-semibold text-white">Secure Licensing</h3>
            <p className="mt-2 text-slate-300">
              Protect your software with advanced device-locking and hardware-binding capabilities.
            </p>
          </div>
          <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-8">
            <div className="text-3xl">💰</div>
            <h3 className="mt-4 text-xl font-semibold text-white">Multi-Currency Support</h3>
            <p className="mt-2 text-slate-300">
              Sell globally with support for USD, BDT, and Developer Coins.
            </p>
          </div>
          <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-8">
            <div className="text-3xl">⚡</div>
            <h3 className="mt-4 text-xl font-semibold text-white">Fast Delivery</h3>
            <p className="mt-2 text-slate-300">
              Instant downloads with secure signed URLs and complete download tracking.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-700 bg-slate-900 py-8">
        <div className="mx-auto max-w-7xl px-6 text-center text-slate-400">
          <p>&copy; 2024 NightDevs Hub. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}
