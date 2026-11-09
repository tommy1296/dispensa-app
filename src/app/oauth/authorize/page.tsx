import { trovaClient } from "@/lib/oauth";
import { rispondi } from "./actions";

export const metadata = { title: "Collega Claude · Dispensa" };

function Errore({ testo }: { testo: string }) {
  return (
    <main className="mx-auto max-w-md px-4 py-16">
      <div className="scheda p-6">
        <h1 className="font-serif text-2xl font-semibold">Collegamento non valido</h1>
        <p className="mt-2 text-testo-tenue">{testo}</p>
      </div>
    </main>
  );
}

export default async function Autorizza({ searchParams }: PageProps<"/oauth/authorize">) {
  const sp = await searchParams;
  const p = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : "");

  if (p("response_type") !== "code") return <Errore testo="response_type deve essere code." />;
  if (!p("code_challenge") || p("code_challenge_method") !== "S256")
    return <Errore testo="Serve PKCE con metodo S256." />;
  const client = await trovaClient(p("client_id"));
  if (!client) return <Errore testo="Applicazione sconosciuta." />;
  if (!client.redirectUris.includes(p("redirect_uri")))
    return <Errore testo="Indirizzo di ritorno non registrato per questa applicazione." />;

  const host = new URL(p("redirect_uri")).host;
  return (
    <main className="mx-auto max-w-md px-4 py-16">
      <div className="scheda p-6">
        <div className="text-4xl">🔑</div>
        <h1 className="mt-3 font-serif text-2xl font-semibold">Collegare {client.nome}?</h1>
        <p className="mt-2 text-testo-tenue">
          {client.nome} potrà cercare, leggere, aggiungere e modificare le ricette e registrare i pasti nello storico.
        </p>
        <p className="mt-3 text-sm text-testo-tenue">
          Dopo la conferma tornerai su <strong className="text-testo">{host}</strong>.
        </p>
        <form action={rispondi} className="mt-6 flex gap-3">
          {["client_id", "redirect_uri", "state", "code_challenge"].map((k) => (
            <input key={k} type="hidden" name={k} value={p(k)} />
          ))}
          <button name="decisione" value="nega" className="bottone-secondario flex-1">
            Annulla
          </button>
          <button name="decisione" value="consenti" className="bottone-primario flex-1">
            Consenti
          </button>
        </form>
      </div>
    </main>
  );
}
