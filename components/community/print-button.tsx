"use client";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-lg bg-ink px-4 py-2.5 text-sm font-bold text-white hover:bg-ink-2"
    >
      Imprimer cette page
    </button>
  );
}
