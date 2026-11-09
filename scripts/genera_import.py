#!/usr/bin/env python3
"""Genera l'SQL di import delle ricette da una cartella di file Markdown.

Ogni file ha un frontmatter YAML (titolo, tipo, proteina, componenti, ...) e le
sezioni "## Ingredienti" e "## Spiegazione". Lo storico dei pasti, se passato,
è una tabella Markdown con colonne Data | Pasto | Piatto | Proteina | Carboidrato | Verdura.

Uso:
    python3 scripts/genera_import.py CARTELLA_RICETTE [STORICO.md] > import.sql

L'SQL risultante contiene dati personali: non va committato.
"""

import re
import sys
from pathlib import Path

import yaml


def q(value):
    """Valore SQL letterale."""
    if value is None:
        return "null"
    if isinstance(value, bool):
        return "true" if value else "false"
    if isinstance(value, int):
        return str(value)
    if isinstance(value, list):
        return "array[" + ", ".join(q(v) for v in value) + "]::text[]" if value else "'{}'::text[]"
    return "'" + str(value).replace("'", "''") + "'"


def sezioni(corpo):
    parti = re.split(r"^## (.+)$", corpo, flags=re.M)
    return {parti[i].strip(): parti[i + 1] for i in range(1, len(parti), 2)}


def senza_glutine(valore):
    if valore is True:
        return "si"
    if valore is False or valore is None:
        return "no"
    return "da_verificare"


def leggi_ricetta(percorso):
    testo = percorso.read_text(encoding="utf-8")
    _, fm, corpo = testo.split("---", 2)
    meta = yaml.safe_load(fm)
    # Alcuni file hanno in coda un'appendice dell'archivio originale: va tolta.
    corpo = re.split(r"\n---\n", corpo)[0]
    sez = sezioni(corpo)

    ingredienti = [
        riga[2:].strip()
        for riga in sez.get("Ingredienti", "").splitlines()
        if riga.startswith("- ")
    ]

    spiegazione = sez.get("Spiegazione", "")
    note = None
    m = re.search(r"\*\*Nota sulla fonte:\*\*\s*(.+)", spiegazione, flags=re.S)
    if m:
        note = m.group(1).strip()
        spiegazione = spiegazione[: m.start()]
    procedimento = spiegazione.strip() or None

    componenti = meta.get("componenti") or {}
    fonte = meta.get("fonte") or {}
    return {
        "slug": percorso.stem,
        "titolo": meta["titolo"],
        "tipo": meta["tipo"],
        "proteina": meta.get("proteina"),
        "ha_proteina": componenti.get("proteina"),
        "ha_carboidrato": componenti.get("carboidrato"),
        "ha_verdura": componenti.get("verdura"),
        "adatta_asporto": meta.get("adatta_asporto"),
        "tempo": meta.get("tempo"),
        "vegana": bool(meta.get("vegana")),
        "vegetariana": bool(meta.get("vegetariana")),
        "senza_glutine": senza_glutine(meta.get("senza_glutine")),
        "scheda_parziale": bool(meta.get("scheda_parziale")),
        "etichette_stimate": bool(meta.get("etichette_stimate")),
        "ingredienti": ingredienti,
        "procedimento": procedimento,
        "note": note,
        "fonte_tipo": fonte.get("tipo"),
        "fonte_url": fonte.get("url"),
        "fonte_post": fonte.get("post"),
    }


def leggi_storico(percorso):
    righe = []
    for riga in percorso.read_text(encoding="utf-8").splitlines():
        celle = [c.strip() for c in riga.strip().strip("|").split("|")]
        if len(celle) != 6 or not re.match(r"\d{4}-\d{2}-\d{2}", celle[0]):
            continue
        data, pasto, piatto, proteina, carboidrato, verdura = celle
        link = re.search(r"\]\((?:ricette/)?([^)]+)\.md\)", piatto)
        righe.append({
            "data": data,
            "pasto": pasto,
            "slug": link.group(1) if link else None,
            "piatto": re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", piatto),
            "proteina": proteina or None,
            "carboidrato": carboidrato or None,
            "verdura": verdura or None,
        })
    return righe


def main():
    cartella = Path(sys.argv[1])
    ricette = [leggi_ricetta(p) for p in sorted(cartella.glob("*.md")) if not p.name.startswith("_")]
    colonne = list(ricette[0].keys())

    out = ["-- Import generato da scripts/genera_import.py", "begin;", ""]
    for r in ricette:
        out.append(
            f"insert into public.ricette ({', '.join(colonne)}) values ("
            + ", ".join(q(r[c]) for c in colonne)
            + ") on conflict (slug) do nothing;"
        )

    if len(sys.argv) > 2:
        out.append("")
        for s in leggi_storico(Path(sys.argv[2])):
            ricetta = f"(select id from public.ricette where slug = {q(s['slug'])})" if s["slug"] else "null"
            out.append(
                "insert into public.storico_pasti (data, pasto, ricetta_id, piatto, proteina, carboidrato, verdura) "
                f"values ({q(s['data'])}, {q(s['pasto'])}, {ricetta}, {q(s['piatto'])}, "
                f"{q(s['proteina'])}, {q(s['carboidrato'])}, {q(s['verdura'])});"
            )

    out += ["", "commit;", ""]
    sys.stdout.write("\n".join(out))
    print(f"{len(ricette)} ricette", file=sys.stderr)


if __name__ == "__main__":
    main()
