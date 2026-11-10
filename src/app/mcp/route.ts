import { createMcpHandler, withMcpAuth } from "mcp-handler";
import type { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";
import { opzioni } from "@/lib/cors";
import { leggiAccesso, origine, risorsaMcp } from "@/lib/oauth";
import { codiceInstagram, salvaFotoInstagram } from "@/lib/foto-instagram";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  PASTI,
  PROTEINE,
  SENZA_GLUTINE,
  TEMPI,
  TIPI,
  aggiornaRicetta,
  cercaRicette,
  creaRicetta,
  eCarneRossa,
  leggiRicetta,
  leggiStorico,
  ricetteSenzaFotoInstagram,
  registraPasto,
  type DatiRicetta,
  type Ricetta,
  type RicettaInElenco,
} from "@/lib/ricette";

export const maxDuration = 60;

const testo = (dati: unknown) => ({
  content: [{ type: "text" as const, text: typeof dati === "string" ? dati : JSON.stringify(dati, null, 2) }],
});
const errore = (messaggio: string) => ({ ...testo(messaggio), isError: true });

const componenti = (r: Pick<Ricetta, "ha_proteina" | "ha_carboidrato" | "ha_verdura">) =>
  [r.ha_proteina && "proteina", r.ha_carboidrato && "carboidrato", r.ha_verdura && "verdura"].filter(Boolean);

function riassunto(r: RicettaInElenco, sito: string) {
  return {
    slug: r.slug,
    titolo: r.titolo,
    tipo: r.tipo,
    proteina: r.proteina,
    componenti: componenti(r),
    pasto_completo: r.pasto_completo,
    adatta_asporto: r.adatta_asporto,
    tempo: r.tempo,
    vegana: r.vegana,
    vegetariana: r.vegetariana,
    senza_glutine: r.senza_glutine,
    scheda_parziale: r.scheda_parziale,
    preferita: r.preferita,
    fonte: r.fonte_url,
    link_app: `${sito}/ricette/${r.slug}`,
  };
}

const campiRicetta = {
  titolo: z.string().min(2).max(200),
  tipo: z.enum(TIPI).describe("pasto = pranzo o cena"),
  proteina: z.enum(PROTEINE).nullable().optional().describe("Fonte proteica principale"),
  ha_proteina: z.boolean().nullable().optional(),
  ha_carboidrato: z.boolean().nullable().optional(),
  ha_verdura: z.boolean().nullable().optional(),
  adatta_asporto: z.boolean().nullable().optional().describe("Si porta al lavoro in borsa frigo"),
  tempo: z.enum(TEMPI).nullable().optional(),
  vegana: z.boolean().optional(),
  vegetariana: z.boolean().optional(),
  senza_glutine: z.enum(SENZA_GLUTINE).optional(),
  scheda_parziale: z.boolean().optional().describe("Mancano dosi o procedimento"),
  etichette_stimate: z.boolean().optional().describe("Le etichette sono stime di Claude"),
  ingredienti: z.array(z.string()).optional().describe("Un ingrediente per voce, con la dose se nota"),
  procedimento: z.string().nullable().optional().describe("Passaggi numerati in Markdown"),
  note: z.string().nullable().optional(),
  fonte_tipo: z.string().nullable().optional().describe("es. instagram, sito, libro"),
  fonte_url: z.string().url().nullable().optional(),
  immagine_url: z.string().url().nullable().optional(),
  preferita: z.boolean().optional(),
};

function registraStrumenti(server: McpServer, sito: string) {
  const db = supabaseAdmin();

  server.registerTool(
    "cerca_ricette",
    {
      title: "Cerca ricette",
      description:
        "Cerca nel ricettario di Tommaso con testo libero e filtri. Restituisce un elenco sintetico; usa leggi_ricetta per ingredienti e procedimento. " +
        "Per proporre pasti usa ordine 'casuale' ed escludi_slug con le ricette mangiate di recente (vedi storico_pasti).",
      inputSchema: z.object({
        testo: z.string().optional().describe("Parole da cercare in titolo, ingredienti e procedimento"),
        tipi: z.array(z.enum(TIPI)).optional().describe("pasto = pranzo o cena"),
        proteine: z.array(z.enum(PROTEINE)).optional(),
        escludi_proteine: z.array(z.enum(PROTEINE)).optional(),
        tempi: z.array(z.enum(TEMPI)).optional(),
        adatta_asporto: z.boolean().optional(),
        pasto_completo: z.boolean().optional().describe("Ha già proteina, carboidrato e verdura"),
        vegana: z.boolean().optional(),
        vegetariana: z.boolean().optional(),
        senza_glutine: z.boolean().optional(),
        preferita: z.boolean().optional(),
        ingredienti: z.array(z.string()).optional().describe("Devono comparire tutti, es. ['zucca', 'ceci']"),
        escludi_ingredienti: z.array(z.string()).optional(),
        escludi_slug: z.array(z.string()).optional(),
        ordine: z
          .enum(["titolo", "recenti", "casuale"])
          .optional()
          .describe("casuale = ordine diverso a ogni chiamata; usalo per proporre pasti e variare"),
        limite: z.number().int().min(1).max(100).optional().describe("Default 20"),
        offset: z.number().int().min(0).optional(),
      }),
      annotations: { readOnlyHint: true },
    },
    async (a) => {
      try {
        const r = await cercaRicette(db, {
          testo: a.testo,
          tipi: a.tipi,
          proteine: a.proteine,
          escludiProteine: a.escludi_proteine,
          tempi: a.tempi,
          adattaAsporto: a.adatta_asporto,
          pastoCompleto: a.pasto_completo,
          vegana: a.vegana,
          vegetariana: a.vegetariana,
          senzaGlutine: a.senza_glutine,
          preferita: a.preferita,
          ingredienti: a.ingredienti,
          escludiIngredienti: a.escludi_ingredienti,
          escludiSlug: a.escludi_slug,
          ordine: a.ordine,
          limite: a.limite ?? 20,
          offset: a.offset,
        });
        return testo({
          totale: r.totale,
          mostrate: r.ricette.length,
          offset: r.offset,
          ricette: r.ricette.map((x) => riassunto(x, sito)),
        });
      } catch (e) {
        return errore(`Ricerca non riuscita: ${(e as Error).message}`);
      }
    },
  );

  server.registerTool(
    "leggi_ricetta",
    {
      title: "Leggi ricetta",
      description: "Scheda completa di una ricetta: ingredienti, procedimento, note, fonte ed etichette.",
      inputSchema: z.object({ slug: z.string() }),
      annotations: { readOnlyHint: true },
    },
    async ({ slug }) => {
      const r = await leggiRicetta(db, slug);
      if (!r) return errore(`Nessuna ricetta con slug "${slug}"`);
      return testo({ ...r, componenti: componenti(r), link_app: `${sito}/ricette/${r.slug}` });
    },
  );

  server.registerTool(
    "aggiungi_ricetta",
    {
      title: "Aggiungi ricetta",
      description:
        "Salva una nuova ricetta. Compila le etichette (proteina, componenti, asporto, tempo, vegana...) leggendo ingredienti e procedimento, " +
        "e metti etichette_stimate=true se le hai dedotte tu. Prima controlla con cerca_ricette che non esista già.",
      inputSchema: z.object(campiRicetta),
    },
    async (dati) => {
      try {
        const r = await creaRicetta(db, dati as DatiRicetta & { titolo: string; tipo: (typeof TIPI)[number] });
        // Senza foto ma con un post Instagram come fonte: prova a usarne la copertina.
        let foto = Boolean(r.immagine_url);
        if (!foto && codiceInstagram(r.fonte_url)) {
          const esito = await salvaFotoInstagram(db, r.slug, r.fonte_url);
          if (esito.ok) foto = Boolean(await aggiornaRicetta(db, r.slug, { immagine_url: esito.url }));
        }
        return testo({ salvata: true, slug: r.slug, foto, link_app: `${sito}/ricette/${r.slug}` });
      } catch (e) {
        return errore(`Salvataggio non riuscito: ${(e as Error).message}`);
      }
    },
  );

  server.registerTool(
    "modifica_ricetta",
    {
      title: "Modifica ricetta",
      description: "Aggiorna solo i campi indicati di una ricetta esistente. Gli ingredienti, se passati, sostituiscono l'elenco intero.",
      inputSchema: z.object({
        slug: z.string(),
        ...Object.fromEntries(Object.entries(campiRicetta).map(([k, v]) => [k, v.optional()])),
      }),
    },
    async ({ slug, ...dati }) => {
      try {
        const r = await aggiornaRicetta(db, slug as string, dati as DatiRicetta);
        if (!r) return errore(`Nessuna ricetta con slug "${slug}"`);
        return testo({ aggiornata: true, slug: r.slug, link_app: `${sito}/ricette/${r.slug}` });
      } catch (e) {
        return errore(`Modifica non riuscita: ${(e as Error).message}`);
      }
    },
  );

  server.registerTool(
    "prendi_foto_instagram",
    {
      title: "Prendi foto da Instagram",
      description:
        "Usa la copertina del post o reel Instagram della fonte come foto della ricetta (ne salva una copia). " +
        "Con slug lavora su quella ricetta; senza slug elabora le ricette con link Instagram e senza foto, " +
        "per circa 30 secondi a chiamata: richiamalo passando in salta gli slug già falliti finché rimaste è 0.",
      inputSchema: z.object({
        slug: z.string().optional(),
        salta: z.array(z.string()).max(500).optional().describe("Slug da non riprovare (già falliti)"),
        sostituisci: z.boolean().optional().describe("Con slug: sostituisce anche una foto già presente"),
      }),
    },
    async ({ slug, salta, sostituisci }) => {
      try {
        if (slug) {
          const r = await leggiRicetta(db, slug);
          if (!r) return errore(`Nessuna ricetta con slug "${slug}"`);
          if (r.immagine_url && !sostituisci) return testo({ slug, gia_presente: true, foto: r.immagine_url });
          const esito = await salvaFotoInstagram(db, slug, r.fonte_url);
          if (!esito.ok) return errore(esito.motivo);
          await aggiornaRicetta(db, slug, { immagine_url: esito.url });
          return testo({ slug, foto: esito.url, link_app: `${sito}/ricette/${slug}` });
        }

        const inizio = Date.now();
        const scartate = [...(salta ?? [])];
        const riuscite: string[] = [];
        const fallite: { slug: string; motivo: string }[] = [];
        let rimaste = 0;
        while (Date.now() - inizio < 30_000) {
          const { ricette, totale } = await ricetteSenzaFotoInstagram(db, { escludiSlug: scartate, limite: 1 });
          rimaste = totale;
          const r = ricette[0];
          if (!r) break;
          const esito = await salvaFotoInstagram(db, r.slug, r.fonte_url);
          if (esito.ok) {
            await aggiornaRicetta(db, r.slug, { immagine_url: esito.url });
            riuscite.push(r.slug);
          } else {
            fallite.push({ slug: r.slug, motivo: esito.motivo });
            scartate.push(r.slug);
          }
          rimaste = totale - 1;
        }
        return testo({ riuscite, fallite, rimaste });
      } catch (e) {
        return errore(`Recupero foto non riuscito: ${(e as Error).message}`);
      }
    },
  );

  server.registerTool(
    "registra_pasto",
    {
      title: "Registra pasto",
      description:
        "Aggiunge allo storico il pasto che Tommaso ha scelto. Indica lo slug se viene da una ricetta salvata, e in piatto eventuali aggiunte (es. '+ quinoa').",
      inputSchema: z.object({
        data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).describe("AAAA-MM-GG"),
        pasto: z.enum(PASTI),
        slug: z.string().optional(),
        piatto: z.string().optional().describe("Descrizione del piatto; se manca si usa il titolo della ricetta"),
        proteina: z.string().optional(),
        carboidrato: z.string().optional(),
        verdura: z.string().optional(),
        note: z.string().optional(),
      }),
    },
    async (a) => {
      try {
        return testo({ registrato: true, ...(await registraPasto(db, a)) });
      } catch (e) {
        return errore(`Registrazione non riuscita: ${(e as Error).message}`);
      }
    },
  );

  server.registerTool(
    "storico_pasti",
    {
      title: "Storico pasti",
      description:
        "Pasti scelti negli ultimi giorni, dal più recente, con il conteggio di carne rossa e affettati nel mese in corso (limite: circa 2 al mese).",
      inputSchema: z.object({
        giorni: z.number().int().min(1).max(365).optional().describe("Default 21"),
      }),
      annotations: { readOnlyHint: true },
    },
    async ({ giorni }) => {
      const oggi = new Date();
      const dal = new Date(oggi.getTime() - (giorni ?? 21) * 86_400_000).toISOString().slice(0, 10);
      const inizioMese = `${oggi.toISOString().slice(0, 7)}-01`;
      const [voci, mese] = await Promise.all([leggiStorico(db, { dal }), leggiStorico(db, { dal: inizioMese })]);
      return testo({
        carne_rossa_o_affettati_questo_mese: mese.filter(eCarneRossa).length,
        pasti: voci.map((v) => ({
          data: v.data,
          pasto: v.pasto,
          piatto: v.piatto,
          slug: v.ricette?.slug ?? null,
          proteina: v.proteina,
          carboidrato: v.carboidrato,
          verdura: v.verdura,
          note: v.note,
        })),
      });
    },
  );
}

async function verificaToken(req: Request, token?: string) {
  if (!token) return undefined;
  const accesso = await leggiAccesso(token);
  if (!accesso || accesso.aud !== risorsaMcp(origine(req.headers, req.url))) return undefined;
  return {
    token,
    clientId: accesso.cid,
    scopes: ["ricette"],
    expiresAt: accesso.exp,
    extra: { utente: accesso.sub },
  };
}

async function gestisci(req: Request) {
  const sito = origine(req.headers, req.url);
  const handler = createMcpHandler((server) => registraStrumenti(server, sito), {
    serverInfo: { name: "dispensa", version: "1.0.0" },
    instructions:
      "Ricettario personale di Tommaso. Regole per comporre i pasti: pranzo e cena = proteina + carboidrato + verdura; colazione = proteina + carboidrato + frutta. " +
      "Pranzo al lavoro: deve essere trasportabile (adatta_asporto). A pranzo carboidrati come pasta, cous cous, quinoa, farro; a cena pane o pita, non pasta. " +
      "Carne rossa e affettati circa 2 volte al mese. Proponi solo ricette salvate, salvo richiesta esplicita, e dai sempre il link alla fonte.",
  });
  return withMcpAuth(handler, verificaToken, { required: true, requiredScopes: ["ricette"] })(req);
}

export { gestisci as GET, gestisci as POST, gestisci as DELETE };
export const OPTIONS = opzioni;
