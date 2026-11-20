import { trovaSquadre, caricaEventi } from "./api.js";
import { leggiPreferite, salvaPreferite, leggiTema, salvaTema } from "./storage.js";
import {
    formRicerca,
    inputRicerca,
    boxRicerca,
    bottoniFiltro,
    bottoneTema,
    bottoneSu,
    mostraSpinner,
    nascondiSpinner,
    mostraErrore,
    nascondiErrore,
    mostraSuggerimenti,
    nascondiSuggerimenti,
    svuotaSuggerimenti,
    suggerimentiVuoti,
    disegnaSuggerimenti,
    disegnaErroreSuggerimenti,
    disegnaPreferite,
    disegnaRisultati,
    svuotaRisultati,
    svuotaDettagli,
    disegnaDettagli,
    vaiAiRisultati,
    vaiAiDettagli,
    vaiInCima,
    aggiornaFiltri,
    applicaTema,
    aggiornaHeader,
    aggiornaBottoneSu,
} from "./ui.js";

const stato = {
    squadreTrovate: [],
    ricercaFatta: false,
    sportAttivo: "Tutti",
    preferite: leggiPreferite(),
};

let temaAttuale = leggiTema();
let timerDebounce = null;
let controllerRicerca = null;
let controllerSuggerimenti = null;

const azioni = {
    apriDettagli: caricaDettagli,
    aggiungi: aggiungiPreferita,
    rimuovi: rimuoviPreferita,
};

function ridisegnaPreferite() {
    disegnaPreferite(stato.preferite, azioni);
}

function ridisegnaRisultati() {
    disegnaRisultati(stato, azioni);
}

function aggiungiPreferita(squadra) {
    const giaPreferita = stato.preferite.some((p) => p.id === squadra.id);

    if (!giaPreferita) {
        stato.preferite.push(squadra);
        salvaPreferite(stato.preferite);
        ridisegnaPreferite();
        ridisegnaRisultati();
    }
}

function rimuoviPreferita(squadra) {
    stato.preferite = stato.preferite.filter((p) => p.id !== squadra.id);
    salvaPreferite(stato.preferite);
    ridisegnaPreferite();
    ridisegnaRisultati();
}

function impostaFiltro(sport) {
    stato.sportAttivo = sport;
    aggiornaFiltri(sport);
    ridisegnaRisultati();
}

function chiudiSuggerimenti() {
    clearTimeout(timerDebounce);
    if (controllerSuggerimenti !== null) {
        controllerSuggerimenti.abort();
    }
    svuotaSuggerimenti();
    nascondiSuggerimenti();
}

async function aggiornaSuggerimenti(testo) {
    if (controllerSuggerimenti !== null) {
        controllerSuggerimenti.abort();
    }
    controllerSuggerimenti = new AbortController();

    try {
        const lista = await trovaSquadre(testo, controllerSuggerimenti.signal);
        disegnaSuggerimenti(lista, selezionaSquadra);
    } catch (errore) {
        if (errore.name === "AbortError") {
            return;
        }
        disegnaErroreSuggerimenti();
        console.error(errore);
    }
}

function selezionaSquadra(squadra) {
    inputRicerca.value = squadra.nome;
    chiudiSuggerimenti();

    stato.ricercaFatta = true;
    stato.squadreTrovate = [squadra];
    impostaFiltro("Tutti");
    caricaDettagli(squadra);
}

async function cercaSquadre(testo) {
    if (controllerRicerca !== null) {
        controllerRicerca.abort();
    }
    controllerRicerca = new AbortController();

    nascondiErrore();
    mostraSpinner();
    svuotaRisultati();

    try {
        stato.squadreTrovate = await trovaSquadre(testo, controllerRicerca.signal);
        stato.ricercaFatta = true;
        nascondiSpinner();
        ridisegnaRisultati();
        vaiAiRisultati();
    } catch (errore) {
        if (errore.name === "AbortError") {
            return;
        }
        nascondiSpinner();
        mostraErrore("Impossibile completare la ricerca. Riprova tra poco.");
        console.error(errore);
    }
}

async function caricaDettagli(squadra) {
    nascondiErrore();
    mostraSpinner();
    svuotaDettagli();

    try {
        const eventi = await caricaEventi(squadra.id);
        nascondiSpinner();
        disegnaDettagli(squadra, eventi.prossimi, eventi.ultimi);
        vaiAiDettagli();
    } catch (errore) {
        nascondiSpinner();
        mostraErrore("Impossibile caricare i dettagli di " + squadra.nome + ".");
        console.error(errore);
    }
}

formRicerca.addEventListener("submit", (evento) => {
    evento.preventDefault();
    const testo = inputRicerca.value.trim();
    chiudiSuggerimenti();

    if (testo !== "") {
        cercaSquadre(testo);
    }
});

inputRicerca.addEventListener("input", () => {
    clearTimeout(timerDebounce);
    const testo = inputRicerca.value.trim();

    if (testo === "") {
        chiudiSuggerimenti();
        return;
    }

    mostraSuggerimenti();
    if (suggerimentiVuoti()) {
        disegnaSuggerimenti([], selezionaSquadra);
    }

    timerDebounce = setTimeout(() => {
        aggiornaSuggerimenti(testo);
    }, 400);
});

inputRicerca.addEventListener("focus", () => {
    if (!suggerimentiVuoti()) {
        mostraSuggerimenti();
    }
});

document.addEventListener("click", (evento) => {
    if (!boxRicerca.contains(evento.target)) {
        nascondiSuggerimenti();
    }
});

bottoniFiltro.forEach((bottone) => {
    bottone.addEventListener("click", () => {
        impostaFiltro(bottone.dataset.sport);
    });
});

bottoneTema.addEventListener("click", () => {
    if (temaAttuale === "dark") {
        temaAttuale = "light";
    } else {
        temaAttuale = "dark";
    }
    applicaTema(temaAttuale);
    salvaTema(temaAttuale);
});

window.addEventListener("scroll", () => {
    aggiornaHeader();
    aggiornaBottoneSu();
});

bottoneSu.addEventListener("click", vaiInCima);

applicaTema(temaAttuale);
ridisegnaPreferite();
ridisegnaRisultati();
