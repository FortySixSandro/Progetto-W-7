export class Squadra {
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

export class Evento {
    constructor(dati) {
        this.id = dati.idEvent;
        this.data = dati.dateEvent;
        this.casa = dati.strHomeTeam;
        this.trasferta = dati.strAwayTeam;
        this.punteggioCasa = dati.intHomeScore;
        this.punteggioTrasferta = dati.intAwayScore;
        this.lega = dati.strLeague ?? "–";
        this.stadio = dati.strVenue ?? "–";
        this.ora = dati.strTime ?? "–";
    }

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
