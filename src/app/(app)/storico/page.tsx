import Link from "next/link";
import { FormPasto } from "@/components/form-pasto";
import { eCarneRossa, leggiStorico } from "@/lib/ricette";
import { supabaseServer } from "@/lib/supabase/server";
import { togliPasto } from "./actions";

export const metadata = { title: "Storico pasti · Dispensa" };

const formatoData = new Intl.DateTimeFormat("it-IT", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
const ORDINE_PASTO = { colazione: 0, pranzo: 1, cena: 2 };

export default async function Storico() {
  const db = await supabaseServer();
  const oggi = new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Rome" });
  const [voci, { data: titoli }] = await Promise.all([
    leggiStorico(db, { limite: 300 }),
    db.from("ricette").select("titolo").order("titolo"),
  ]);
  const meseCorrente = oggi.slice(0, 7);
  const carneRossa = voci.filter((v) => v.data.startsWith(meseCorrente) && eCarneRossa(v)).length;

  const perGiorno = new Map<string, typeof voci>();
  for (const v of voci) perGiorno.set(v.data, [...(perGiorno.get(v.data) ?? []), v]);

  return (
    <main className="mx-auto max-w-3xl">
      <h1 className="font-serif text-3xl font-semibold">Storico pasti</h1>
      <p className="mt-1 text-testo-tenue">
        Carne rossa o affettati questo mese:{" "}
        <strong className={carneRossa >= 2 ? "text-accento" : "text-testo"}>{carneRossa}</strong> (obiettivo: circa 2)
      </p>

      <section className="scheda mt-6 p-4 sm:p-6">
        <FormPasto titoli={(titoli ?? []).map((t) => t.titolo)} oggi={oggi} />
      </section>

      <div className="mt-8 space-y-6">
        {voci.length === 0 && <p className="text-testo-tenue">Ancora nessun pasto registrato.</p>}
        {[...perGiorno.entries()].map(([data, lista]) => (
          <section key={data}>
            <h2 className="mb-2 text-sm font-medium capitalize text-testo-tenue">
              {formatoData.format(new Date(`${data}T00:00:00Z`))}
            </h2>
            <ul className="scheda divide-y divide-bordo">
              {lista
                .sort((a, b) => ORDINE_PASTO[a.pasto] - ORDINE_PASTO[b.pasto])
                .map((v) => (
                  <li key={v.id} className="flex items-start gap-3 p-3">
                    <span className="chip mt-0.5 w-20 justify-center">{v.pasto}</span>
                    <div className="flex-1">
                      {v.ricette ? (
                        <Link href={`/ricette/${v.ricette.slug}`} className="font-medium hover:text-accento">
                          {v.piatto}
                        </Link>
                      ) : (
                        <span className="font-medium">{v.piatto}</span>
                      )}
                      <p className="text-sm text-testo-tenue">
                        {[v.proteina, v.carboidrato, v.verdura].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                    <form action={togliPasto}>
                      <input type="hidden" name="id" value={v.id} />
                      <button className="px-2 text-testo-tenue hover:text-red-700" title="Elimina">
                        ×
                      </button>
                    </form>
                  </li>
                ))}
            </ul>
          </section>
        ))}
      </div>
    </main>
  );
}
