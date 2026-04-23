export function Spinner({ label = 'Cargando…' }: { label?: string }) {
  return (
    <div role="status" aria-live="polite" className="flex items-center gap-2 text-slate-500">
      <span
        className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700"
        aria-hidden
      />
      <span>{label}</span>
    </div>
  );
}
