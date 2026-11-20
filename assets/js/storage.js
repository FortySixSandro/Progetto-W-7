import { Squadra } from "./classi.js";

export function leggiPreferite() {
    const salvato = localStorage.getItem("preferite");
    if (salvato === null) {
        return [];
    }
    const lista = JSON.parse(salvato);
    return lista.map((dati) => new Squadra(dati));
}

export function salvaPreferite(preferite) {
    const daSalvare = preferite.map((squadra) => squadra.datiApi());
    localStorage.setItem("preferite", JSON.stringify(daSalvare));
}

export function leggiTema() {
    const salvato = localStorage.getItem("tema");
    if (salvato === null) {
        return "light";
    }
    return salvato;
}

export function salvaTema(tema) {
    localStorage.setItem("tema", tema);
}
