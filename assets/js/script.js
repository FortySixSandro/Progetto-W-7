class Squadra {
    constructor(dati) {
        this.id = dati.idTeam;
        this.nome = dati.strTeam;
        this.logo = dati.strBadge;
        this.lega = dati.strLeague ?? "–";
        this.paese = dati.strCountry ?? "–";
        this.sport = dati.strSport;
    }

    datiApi() {
        return {
            idTeam: this.id,
            strTeam: this.nome,
            strBadge: this.logo,
            strLeague: this.lega,
            strCountry: this.paese,
            strSport: this.sport,
        };
    }
}

class Evento {
    constructor(dati) {
        this.id = dati.idEvent;
        this.data = dati.dateEvent;
        this.casa = dati.strHomeTeam;
        this.trasferta = dati.strAwayTeam;
        this.punteggioCasa = dati.intHomeScore;
        this.punteggioTrasferta = dati.intAwayScore;
        // campi extra, usati solo nel modal
        this.lega = dati.strLeague ?? "–";
        this.stadio = dati.strVenue ?? "–";
        this.ora = dati.strTime ?? "–";
    }

    // Data in formato italiano
    dataFormattata() {
        const data = new Date(this.data);
        const formato = new Intl.DateTimeFormat("it-IT", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });
        return formato.format(data);
    }

    punteggio() {
        if (this.punteggioCasa === null || this.punteggioTrasferta === null) {
            return "";
        } else {
            return this.punteggioCasa + " – " + this.punteggioTrasferta;
        }
    }
}

const BASE_URL = "https://www.thesportsdb.com/api/v1/json/123/";

const formRicerca = document.getElementById("form-ricerca");
const inputRicerca = document.getElementById("input-ricerca");
const contenitorePreferite = document.getElementById("preferite");
const contenitoreRisultati = document.getElementById("risultati");
const sezioneDettagli = document.getElementById("dettagli");
const spinner = document.getElementById("spinner");
const boxErrore = document.getElementById("errore");
const bottoniFiltro = document.querySelectorAll(".filtro");
const modalTitolo = document.getElementById("modal-titolo");
const modalContenuto = document.getElementById("modal-contenuto");

const modalBootstrap = new bootstrap.Modal(document.getElementById("modal"));

let squadreTrovate = [];
let preferite = leggiPreferite();
let sportAttivo = "Tutti";
let timerDebounce = null;
let controllerRicerca = null;

function creaElemento(tag, classe, testo) {
    const elemento = document.createElement(tag);
    if (classe) {
        elemento.className = classe;
    }
    if (testo) {
        elemento.textContent = testo;
    }
    return elemento;
}

function mostraSpinner() {
    spinner.classList.remove("d-none");
}

function nascondiSpinner() {
    spinner.classList.add("d-none");
}

function mostraErrore(messaggio) {
    boxErrore.textContent = messaggio;
    boxErrore.classList.remove("d-none");
}

function nascondiErrore() {
    boxErrore.classList.add("d-none");
}

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

function leggiPreferite() {
    const salvato = localStorage.getItem("preferite");
    if (salvato === null) {
        return [];
    }
    const lista = JSON.parse(salvato);
    return lista.map((dati) => new Squadra(dati));
}

function salvaPreferite() {
    const daSalvare = preferite.map((squadra) => squadra.datiApi());
    localStorage.setItem("preferite", JSON.stringify(daSalvare));
}

function siPreferita(squadra) {
    return preferite.some((p) => p.id === squadra.id);
}

function aggiungiPreferita(squadra) {
    if (!siPreferita(squadra)) {
        preferite.push(squadra);
        salvaPreferite();
        disegnaPreferite();
        disegnaRisultati();
    }
}

function rimuoviPreferita(squadra) {
    preferite = preferite.filter((p) => p.id !== squadra.id);
    salvaPreferite();
    disegnaPreferite();
    disegnaRisultati();
}

async function cercaSquadre(testo) {
    if (controllerRicerca !== null) {
        controllerRicerca.abort();
    }
    controllerRicerca = new AbortController();

    nascondiErrore();
    mostraSpinner();
    contenitoreRisultati.textContent = "";

    try {
        const dati = await chiamaApi("searchteams.php", "t", testo, controllerRicerca.signal);

        if (dati.teams === null) {
            squadreTrovate = [];
        } else {
            squadreTrovate = dati.teams.map((d) => new Squadra(d));
        }
        nascondiSpinner();
        disegnaRisultati();
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
    sezioneDettagli.textContent = "";

    try {
        const [rispostaProssimi, rispostaUltimi] = await Promise.all([
            chiamaApi("eventsnext.php", "id", squadra.id),
            chiamaApi("eventslast.php", "id", squadra.id),
        ]);

        const prossimi = creaEventi(rispostaProssimi.events);
        const ultimi = creaEventi(rispostaUltimi.results);

        nascondiSpinner();
        disegnaDettagli(squadra, prossimi, ultimi);
    } catch (errore) {
        nascondiSpinner();
        mostraErrore("Impossibile caricare i dettagli di " + squadra.nome + ".");
        console.error(errore);
    }
}

function creaCardSquadra(squadra, tipo) {
    const colonna = creaElemento("div", "col-12 col-md-6 col-lg-4");
    const card = creaElemento("div", "card h-100 text-center p-3 shadow-sm");
    card.setAttribute("role", "button");

    if (squadra.logo) {
        const img = creaElemento("img", "mx-auto mb-3");
        img.src = squadra.logo;
        img.alt = "Logo " + squadra.nome;
        img.width = 100;
        img.height = 100;
        card.appendChild(img);
    }

    card.appendChild(creaElemento("h5", "card-title", squadra.nome));
    card.appendChild(creaElemento("p", "card-text text-muted mb-1", squadra.lega));
    card.appendChild(creaElemento("p", "card-text text-muted mb-1", squadra.paese));

    if (tipo === "preferita") {
        const bottone = creaElemento("button", "btn btn-outline-danger w-100 mt-3", "🗑 Rimuovi");
        bottone.addEventListener("click", (evento) => {
            evento.stopPropagation();
            rimuoviPreferita(squadra);
        });
        card.appendChild(bottone);
    } else {
        let bottone;
        if (siPreferita(squadra)) {
            bottone = creaElemento("button", "btn btn-secondary w-100 mt-3", "★ Nei preferiti");
            bottone.disabled = true;
        } else {
            bottone = creaElemento("button", "btn btn-outline-warning w-100 mt-3", "★ Aggiungi ai preferiti");
            bottone.addEventListener("click", (evento) => {
                evento.stopPropagation();
                aggiungiPreferita(squadra);
            });
        }
        card.appendChild(bottone);
    }

    card.addEventListener("click", () => {
        caricaDettagli(squadra);
    });

    colonna.appendChild(card);
    return colonna;
}

function disegnaPreferite() {
    contenitorePreferite.textContent = "";

    if (preferite.length === 0) {
        contenitorePreferite.appendChild(
            creaElemento("p", "col-12 text-muted fst-italic", "Nessuna squadra preferita: aggiungine una dalla ricerca.")
        );
        return;
    }

    preferite.forEach((squadra) => {
        contenitorePreferite.appendChild(creaCardSquadra(squadra, "preferita"));
    });
}

function disegnaRisultati() {
    contenitoreRisultati.textContent = "";

    if (squadreTrovate.length === 0) {
        if (inputRicerca.value.trim() !== "") {
            contenitoreRisultati.appendChild(
                creaElemento("p", "col-12 text-muted fst-italic", "Nessuna squadra trovata.")
            );
        }
        return;
    }

    let daMostrare = squadreTrovate;
    if (sportAttivo !== "Tutti") {
        daMostrare = squadreTrovate.filter((s) => s.sport === sportAttivo);
    }

    if (daMostrare.length === 0) {
        contenitoreRisultati.appendChild(
            creaElemento("p", "col-12 text-muted fst-italic", "Nessuna squadra trovata per questo sport.")
        );
        return;
    }

    daMostrare.forEach((squadra) => {
        contenitoreRisultati.appendChild(creaCardSquadra(squadra, "risultato"));
    });
}

function creaRigaEvento(evento) {
    const riga = creaElemento("div", "list-group-item list-group-item-action");
    riga.setAttribute("role", "button");
    riga.appendChild(creaElemento("div", "small text-muted", evento.dataFormattata()));

    const partita = creaElemento("div", "fw-bold", evento.casa + " vs " + evento.trasferta);
    if (evento.punteggio() !== "") {
        partita.appendChild(creaElemento("span", "badge bg-success ms-2", evento.punteggio()));
    }
    riga.appendChild(partita);

    riga.addEventListener("click", () => {
        apriModal(evento);
    });

    return riga;
}

function creaColonnaEventi(titolo, eventi, messaggioVuoto) {
    const colonna = creaElemento("div", "col-12 col-md-6");
    colonna.appendChild(creaElemento("h3", "h5 border-bottom border-dark border-2 pb-2 mb-3", titolo));

    if (eventi.length === 0) {
        colonna.appendChild(creaElemento("p", "text-muted fst-italic", messaggioVuoto));
    } else {
        const lista = creaElemento("div", "list-group list-group-flush");
        eventi.forEach((evento) => {
            lista.appendChild(creaRigaEvento(evento));
        });
        colonna.appendChild(lista);
    }
    return colonna;
}

function disegnaDettagli(squadra, prossimi, ultimi) {
    sezioneDettagli.textContent = "";

    const pannello = creaElemento("div", "card shadow-sm p-4");
    pannello.appendChild(creaElemento("h2", "h3 text-primary mb-4", squadra.nome));

    const riga = creaElemento("div", "row g-4");
    riga.appendChild(creaColonnaEventi("Prossimi eventi", prossimi, "Nessun evento in programma"));
    riga.appendChild(creaColonnaEventi("Ultimi risultati", ultimi, "Nessun risultato disponibile"));

    pannello.appendChild(riga);
    sezioneDettagli.appendChild(pannello);
}

function aggiungiRigaModal(etichetta, valore) {
    const riga = creaElemento("div", "d-flex justify-content-between border-bottom py-2");
    riga.appendChild(creaElemento("span", "text-muted", etichetta));
    riga.appendChild(creaElemento("span", "", valore));
    modalContenuto.appendChild(riga);
}

function apriModal(evento) {
    modalTitolo.textContent = evento.casa + " vs " + evento.trasferta;
    modalContenuto.textContent = "";

    aggiungiRigaModal("Data", evento.dataFormattata());
    aggiungiRigaModal("Ora", evento.ora);
    aggiungiRigaModal("Campionato", evento.lega);
    aggiungiRigaModal("Stadio", evento.stadio);

    if (evento.punteggio() !== "") {
        aggiungiRigaModal("Risultato", evento.punteggio());
    } else {
        aggiungiRigaModal("Risultato", "Non ancora giocata");
    }

    modalBootstrap.show();
}

formRicerca.addEventListener("submit", (evento) => {
    evento.preventDefault();
    clearTimeout(timerDebounce);

    const testo = inputRicerca.value.trim();
    if (testo !== "") {
        cercaSquadre(testo);
    }
});

inputRicerca.addEventListener("input", () => {
    clearTimeout(timerDebounce);

    const testo = inputRicerca.value.trim();
    if (testo === "") {
        return;
    }

    timerDebounce = setTimeout(() => {
        cercaSquadre(testo);
    }, 400);
});

bottoniFiltro.forEach((bottone) => {
    bottone.addEventListener("click", () => {
        sportAttivo = bottone.dataset.sport;

        bottoniFiltro.forEach((b) => b.classList.remove("active"));
        bottone.classList.add("active");

        disegnaRisultati();
    });
});

disegnaPreferite();