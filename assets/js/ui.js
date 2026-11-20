export const formRicerca = document.getElementById("form-ricerca");
export const inputRicerca = document.getElementById("input-ricerca");
export const boxRicerca = document.getElementById("box-ricerca");
export const bottoniFiltro = document.querySelectorAll(".filtro");
export const bottoneTema = document.getElementById("btn-tema");
export const bottoneSu = document.getElementById("btn-su");

const suggerimenti = document.getElementById("suggerimenti");
const contenitorePreferite = document.getElementById("preferite");
const contenitoreRisultati = document.getElementById("risultati");
const sezioneEsplora = document.getElementById("esplora");
const sezioneDettagli = document.getElementById("dettagli");
const spinner = document.getElementById("spinner");
const boxErrore = document.getElementById("errore");
const header = document.querySelector("header");
const modalTitolo = document.getElementById("modal-titolo");
const modalContenuto = document.getElementById("modal-contenuto");
const modalBootstrap = new bootstrap.Modal(document.getElementById("modal"));

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

export function mostraSpinner() {
    spinner.classList.remove("d-none");
}

export function nascondiSpinner() {
    spinner.classList.add("d-none");
}

export function mostraErrore(messaggio) {
    boxErrore.textContent = messaggio;
    boxErrore.classList.remove("d-none");
}

export function nascondiErrore() {
    boxErrore.classList.add("d-none");
}

export function mostraSuggerimenti() {
    suggerimenti.classList.remove("d-none");
}

export function nascondiSuggerimenti() {
    suggerimenti.classList.add("d-none");
}

export function svuotaSuggerimenti() {
    suggerimenti.textContent = "";
}

export function suggerimentiVuoti() {
    return suggerimenti.children.length === 0;
}

export function disegnaSuggerimenti(lista, alSelezionare) {
    suggerimenti.textContent = "";

    if (lista.length === 0) {
        suggerimenti.appendChild(creaElemento("li", "list-group-item text-muted", "Nessun risultato"));
        return;
    }

    lista.forEach((squadra) => {
        const voce = creaElemento("li", "list-group-item list-group-item-action d-flex align-items-center gap-3");
        voce.setAttribute("role", "button");

        if (squadra.logo) {
            const img = creaElemento("img", "");
            img.src = squadra.logo;
            img.alt = "Logo " + squadra.nome;
            img.width = 28;
            img.height = 28;
            voce.appendChild(img);
        }

        const testi = creaElemento("div", "");
        testi.appendChild(creaElemento("div", "fw-bold", squadra.nome));
        testi.appendChild(creaElemento("div", "small text-muted", squadra.lega + " · " + squadra.paese));
        voce.appendChild(testi);

        voce.addEventListener("click", () => {
            alSelezionare(squadra);
        });

        suggerimenti.appendChild(voce);
    });
}

export function disegnaErroreSuggerimenti() {
    suggerimenti.textContent = "";
    suggerimenti.appendChild(
        creaElemento("li", "list-group-item text-danger", "Ricerca non riuscita, riprova tra poco")
    );
}

function vaiAllaRicerca() {
    window.scrollTo(0, 0);
    inputRicerca.focus({ preventScroll: true });
}

function creaBoxVuoto(icona, titolo, righe, testoBottone, azioneBottone, orizzontale) {
    const colonna = creaElemento("div", "col-12");

    let classiBox = "box-vuoto d-flex flex-column align-items-center gap-3 p-4 text-center";
    let classiTesti = "";
    if (orizzontale) {
        classiBox = "box-vuoto d-flex flex-column flex-md-row align-items-center gap-3 gap-md-4 p-4";
        classiTesti = "flex-grow-1 text-center text-md-start";
    }

    const box = creaElemento("div", classiBox);
    box.appendChild(creaElemento("div", "icona-cerchio", icona));

    const testi = creaElemento("div", classiTesti);
    testi.appendChild(creaElemento("h3", "h6 fw-bold mb-1", titolo));
    righe.forEach((riga) => {
        testi.appendChild(creaElemento("p", "small text-muted mb-0", riga));
    });
    box.appendChild(testi);

    if (testoBottone) {
        const bottone = creaElemento("button", "btn btn-lime", testoBottone);
        bottone.addEventListener("click", azioneBottone);
        box.appendChild(bottone);
    }

    colonna.appendChild(box);
    return colonna;
}

function creaCardSquadra(squadra, tipo, preferite, azioni) {
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
            azioni.rimuovi(squadra);
        });
        card.appendChild(bottone);
    } else {
        const giaPreferita = preferite.some((p) => p.id === squadra.id);
        let bottone;
        if (giaPreferita) {
            bottone = creaElemento("button", "btn btn-secondary w-100 mt-3", "★ Nei preferiti");
            bottone.disabled = true;
        } else {
            bottone = creaElemento("button", "btn btn-lime w-100 mt-3", "★ Aggiungi ai preferiti");
            bottone.addEventListener("click", (evento) => {
                evento.stopPropagation();
                azioni.aggiungi(squadra);
            });
        }
        card.appendChild(bottone);
    }

    card.addEventListener("click", () => {
        azioni.apriDettagli(squadra);
    });

    colonna.appendChild(card);
    return colonna;
}

export function disegnaPreferite(preferite, azioni) {
    contenitorePreferite.textContent = "";

    if (preferite.length === 0) {
        contenitorePreferite.appendChild(
            creaBoxVuoto(
                "⭐",
                "La tua curva è ancora vuota",
                [
                    "Cerca la tua squadra del cuore e aggiungila ai preferiti.",
                    "Ti terremo aggiornato su partite e risultati.",
                ],
                "Trova una squadra",
                vaiAllaRicerca,
                true
            )
        );
        return;
    }

    preferite.forEach((squadra) => {
        contenitorePreferite.appendChild(creaCardSquadra(squadra, "preferita", preferite, azioni));
    });
}

export function svuotaRisultati() {
    contenitoreRisultati.textContent = "";
}

export function disegnaRisultati(stato, azioni) {
    contenitoreRisultati.textContent = "";

    if (!stato.ricercaFatta) {
        contenitoreRisultati.appendChild(
            creaBoxVuoto("🔎", "Cerca una squadra per iniziare", ["I risultati appariranno qui"], null, null, false)
        );
        return;
    }

    if (stato.squadreTrovate.length === 0) {
        contenitoreRisultati.appendChild(
            creaBoxVuoto("🔎", "Nessuna squadra trovata", ["Prova con un altro nome"], null, null, false)
        );
        return;
    }

    let daMostrare = stato.squadreTrovate;
    if (stato.sportAttivo !== "Tutti") {
        daMostrare = stato.squadreTrovate.filter((s) => s.sport === stato.sportAttivo);
    }

    if (daMostrare.length === 0) {
        contenitoreRisultati.appendChild(
            creaBoxVuoto("🔎", "Nessuna squadra per questo sport", ["Prova con un altro filtro"], null, null, false)
        );
        return;
    }

    daMostrare.forEach((squadra) => {
        contenitoreRisultati.appendChild(creaCardSquadra(squadra, "risultato", stato.preferite, azioni));
    });
}

export function aggiornaFiltri(sport) {
    bottoniFiltro.forEach((bottone) => {
        if (bottone.dataset.sport === sport) {
            bottone.classList.add("active");
        } else {
            bottone.classList.remove("active");
        }
    });
}

function creaRigaEvento(evento) {
    const riga = creaElemento("div", "list-group-item list-group-item-action");
    riga.setAttribute("role", "button");
    riga.appendChild(creaElemento("div", "small text-muted", evento.dataFormattata()));

    const partita = creaElemento("div", "fw-bold", evento.casa + " vs " + evento.trasferta);
    if (evento.punteggio() !== "") {
        partita.appendChild(creaElemento("span", "badge punteggio ms-2", evento.punteggio()));
    }
    riga.appendChild(partita);

    riga.addEventListener("click", () => {
        apriModal(evento);
    });

    return riga;
}

function creaColonnaEventi(titolo, eventi, messaggioVuoto) {
    const colonna = creaElemento("div", "col-12 col-md-6");
    colonna.appendChild(creaElemento("h3", "h5 titolo-colonna pb-2 mb-3", titolo));

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

export function svuotaDettagli() {
    sezioneDettagli.textContent = "";
}

export function disegnaDettagli(squadra, prossimi, ultimi) {
    sezioneDettagli.textContent = "";

    const pannello = creaElemento("div", "card shadow-sm p-4");
    pannello.appendChild(creaElemento("h2", "h3 titolo-pannello mb-4", squadra.nome));

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

export function vaiAiRisultati() {
    sezioneEsplora.scrollIntoView();
}

export function vaiAiDettagli() {
    sezioneDettagli.scrollIntoView();
}

export function vaiInCima() {
    window.scrollTo(0, 0);
}

export function applicaTema(tema) {
    document.documentElement.setAttribute("data-bs-theme", tema);

    if (tema === "dark") {
        bottoneTema.textContent = "☀️ Chiaro";
    } else {
        bottoneTema.textContent = "🌙 Scuro";
    }
}

export function aggiornaHeader() {
    if (window.scrollY > 100) {
        header.classList.add("header-compatto");
    } else if (window.scrollY < 30) {
        header.classList.remove("header-compatto");
    }
}

export function aggiornaBottoneSu() {
    const fondoVisibile = window.innerHeight + window.scrollY;
    const altezzaPagina = document.documentElement.scrollHeight;

    if (fondoVisibile >= altezzaPagina - 50) {
        bottoneSu.classList.remove("d-none");
    } else {
        bottoneSu.classList.add("d-none");
    }
}
