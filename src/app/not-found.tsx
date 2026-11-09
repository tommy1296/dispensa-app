import Link from "next/link";

export default function NonTrovato() {
  return (
    <main className="mx-auto max-w-md px-4 py-24 text-center">
      <div className="text-5xl">🥄</div>
      <h1 className="mt-4 font-serif text-2xl font-semibold">Qui non c&apos;è niente</h1>
      <Link href="/" className="bottone-primario mt-6">
        Torna alle ricette
      </Link>
    </main>
  );
}
