"use client";

export default function Home() {

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black px-6">
      <main className="max-w-3xl w-full text-center sm:text-left">
        
        <h1 className="text-4xl font-bold text-black dark:text-white mb-4">
          Analytique
        </h1>

        <p className="text-lg text-zinc-600 dark:text-zinc-400 leading-7">
          This is your custom analytics dashboard home page. Tracking script is
          active and collecting page views.
        </p>

        <div className="mt-10 flex gap-4">
          <a
            className="px-6 py-3 rounded-full bg-black text-white dark:bg-white dark:text-black hover:opacity-80"
            href="/dashboard"
          >
            Go to Dashboard →
          </a>

          <a
            className="px-6 py-3 rounded-full border border-black dark:border-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition"
            href="https://supabase.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            Supabase
          </a>
        </div>
      </main>
    </div>
  );
}
