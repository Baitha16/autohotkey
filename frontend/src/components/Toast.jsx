export default function Toast({ toasts }) {
  if (!toasts.length) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`animate-slide-in rounded-lg px-4 py-3 text-sm font-medium shadow-lg ${
            t.err
              ? "bg-red-50 border border-red-200 text-red-700"
              : "bg-emerald-50 border border-emerald-200 text-emerald-700"
          }`}
        >
          {t.err ? "ERR: " : "OK: "}
          {t.text}
        </div>
      ))}
    </div>
  );
}
