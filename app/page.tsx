"use client";

import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black px-6">
      <main className="max-w-3xl w-full text-center sm:text-left">
        <h1 className="text-4xl font-bold text-black dark:text-white mb-4">
          Analytique
        </h1>

        <p className="text-lg text-zinc-600 dark:text-zinc-400 leading-7">
          Privacy-focused analytics platform. Track your website visitors
          without compromising their privacy. Self-hosted, open-source, and
          built with modern web technologies.
        </p>

        <div className="mt-10 flex flex-wrap gap-4">
          <Link
            className="px-6 py-3 rounded-full bg-black text-white dark:bg-white dark:text-black hover:opacity-80 transition-opacity"
            href="/auth/login"
          >
            Sign In →
          </Link>

          <Link
            className="px-6 py-3 rounded-full border border-black dark:border-white text-black dark:text-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all"
            href="/signup"
          >
            Create Account
          </Link>

          <a
            className="px-6 py-3 rounded-full border border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-black dark:hover:border-white hover:text-black dark:hover:text-white transition-all"
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            View on GitHub
          </a>
        </div>

        <div className="mt-16 pt-8 border-t border-zinc-200 dark:border-zinc-800">
          <h2 className="text-xl font-semibold text-black dark:text-white mb-4">
            Features
          </h2>
          <ul className="space-y-2 text-zinc-600 dark:text-zinc-400">
            <li>✅ Real-time analytics tracking</li>
            <li>✅ Privacy-focused (no cookies, GDPR compliant)</li>
            <li>✅ Multi-site support</li>
            <li>✅ Beautiful dashboard</li>
            <li>✅ Easy integration (single script tag)</li>
            <li>✅ Self-hosted on your infrastructure</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
