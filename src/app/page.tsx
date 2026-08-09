export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-6 p-8 text-center">
      <h1 className="text-4xl font-bold tracking-tight">Lucky Draw</h1>
      <p className="text-zinc-400 max-w-md">
        Artistic lucky draw experience. Celestial. Instant. Beautiful.
      </p>
      <a
        href="/prototype/display"
        className="mt-4 px-6 py-3 rounded-full bg-white text-black font-medium hover:bg-white/90 transition-colors"
      >
        View Prototype →
      </a>
    </div>
  );
}
