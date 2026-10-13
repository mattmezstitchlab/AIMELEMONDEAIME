"use client";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-lg bg-emerald-800 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-900"
    >
      Imprimer cette page
    </button>
  );
}
