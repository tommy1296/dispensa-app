import { Fragment } from "react";

/** Grassetto **così** e link nudi; niente HTML dall'esterno. */
function inline(testo: string) {
  return testo.split(/(\*\*[^*]+\*\*)/g).map((pezzo, i) =>
    pezzo.startsWith("**") && pezzo.endsWith("**") ? <strong key={i}>{pezzo.slice(2, -2)}</strong> : <Fragment key={i}>{pezzo}</Fragment>,
  );
}

/** Mostra testo in stile Markdown semplice: elenchi numerati, puntati e paragrafi. */
export function TestoSemplice({ testo }: { testo: string }) {
  const blocchi: React.ReactNode[] = [];
  let lista = null as { tipo: "ol" | "ul"; voci: string[] } | null;
  let paragrafo: string[] = [];

  const chiudiParagrafo = () => {
    if (paragrafo.length) blocchi.push(<p key={blocchi.length}>{inline(paragrafo.join(" "))}</p>);
    paragrafo = [];
  };
  const chiudiLista = () => {
    if (lista) {
      const Tag = lista.tipo;
      blocchi.push(
        <Tag key={blocchi.length}>
          {lista.voci.map((v, i) => (
            <li key={i}>{inline(v)}</li>
          ))}
        </Tag>,
      );
    }
    lista = null;
  };

  for (const riga of testo.split("\n")) {
    const numerata = riga.match(/^\s*\d+[.)]\s+(.*)$/);
    const puntata = riga.match(/^\s*[-*•]\s+(.*)$/);
    if (numerata || puntata) {
      chiudiParagrafo();
      const tipo = numerata ? "ol" : "ul";
      if (lista?.tipo !== tipo) {
        chiudiLista();
        lista = { tipo, voci: [] };
      }
      lista!.voci.push((numerata ?? puntata)![1]);
    } else if (!riga.trim()) {
      chiudiParagrafo();
      chiudiLista();
    } else {
      chiudiLista();
      paragrafo.push(riga.trim());
    }
  }
  chiudiParagrafo();
  chiudiLista();
  return <div className="prosa">{blocchi}</div>;
}
