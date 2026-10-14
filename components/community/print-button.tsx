"use client";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-control bg-ink px-4 py-2.5 text-sm font-bold text-canvas hover:bg-ink-2"
    >
      Imprimer cette page
    </button>
  );
}
