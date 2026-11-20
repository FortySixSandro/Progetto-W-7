import { Squadra, Evento } from "./classi.js";

const BASE_URL = "https://www.thesportsdb.com/api/v1/json/123/";

async function chiamaApi(file, nomeParametro, valore, segnale) {
    const url = new URL(BASE_URL + file);
    url.searchParams.set(nomeParametro, valore);

    const risposta = await fetch(url, { signal: segnale });
    if (!risposta.ok) {
        throw new Error("Errore del server: " + risposta.status);
    }
    return await risposta.json();
}

function creaEventi(lista) {
    if (!lista) {
        return [];
    }
    return lista.map((dati) => new Evento(dati));
}

export async function trovaSquadre(testo, segnale) {
    const dati = await chiamaApi("searchteams.php", "t", testo, segnale);
    if (dati.teams === null) {
        return [];
    }
    return dati.teams.map((d) => new Squadra(d));
}

export async function caricaEventi(idSquadra) {
    const [rispostaProssimi, rispostaUltimi] = await Promise.all([
        chiamaApi("eventsnext.php", "id", idSquadra),
        chiamaApi("eventslast.php", "id", idSquadra),
    ]);

    return {
        prossimi: creaEventi(rispostaProssimi.events),
        ultimi: creaEventi(rispostaUltimi.results),
    };
}
