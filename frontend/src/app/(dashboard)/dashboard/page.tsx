export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-linear-to-br from-zinc-950 via-zinc-900 to-red-950 px-6 py-20 text-white">
      <div className="mx-auto flex max-w-5xl flex-col gap-8">
        <section className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur">
          <p className="text-sm uppercase tracking-[0.3em] text-red-200/80">
            Dashboard Preview
          </p>
          <h1 className="mt-4 text-4xl font-bold sm:text-5xl">
            Welcome back to the NEU Debate Club dashboard.
          </h1>
          <p className="mt-4 max-w-2xl text-base text-white/75">
            This is temporary content while the real dashboard data source is
            offline. The route is now isolated at /dashboard, so the homepage
            can render normally.
          </p>
        </section>

        <section className="grid gap-4 sm:grid-cols-3">
          {[
            ["Active members", "24"],
            ["Upcoming events", "3"],
            ["Pending tasks", "7"],
          ].map(([label, value]) => (
            <div
              key={label}
              className="rounded-2xl border border-white/10 bg-white/5 p-6"
            >
              <p className="text-sm text-white/60">{label}</p>
              <p className="mt-3 text-3xl font-semibold">{value}</p>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
