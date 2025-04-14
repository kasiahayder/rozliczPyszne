const liczbaOsobInput = document.getElementById('liczbaOsob');
const kwotyZamowienContainer = document.getElementById('kwotyZamowienContainer');
const kosztDostawyInput = document.getElementById('kosztDostawy');
const obliczBtn = document.getElementById('obliczBtn');
const listaWynikow = document.getElementById('listaWynikow');
const infoZamawiajacy = document.getElementById('infoZamawiajacy');
const wartoscCalkowitaElement = document.getElementById('wartoscCalkowita');
const wynikiDiv = document.getElementById('wyniki');
const formularzZamowienia = document.getElementById('formularzZamowienia');
const przyciskiAkcjiDiv = document.getElementById('przyciskiAkcji');
const kontynuujBtn = document.getElementById('kontynuujBtn');
const wyczyscBtn = document.getElementById('wyczyscBtn');
const dostepneSaldoInfoElement = document.getElementById('dostepneSaldoInfo');

const DOMYSLNY_BUDZET_NA_OSOBE = 25.00;
const MAX_OSOBY = 10;

// --- Funkcje pomocnicze ---

function zablokujFormularz() {
    formularzZamowienia.disabled = true;
    obliczBtn.disabled = true;
    przyciskiAkcjiDiv.style.display = 'flex';
    wynikiDiv.style.display = 'block';
}

function odblokujFormularz() {
    formularzZamowienia.disabled = false;
    obliczBtn.disabled = false;
    przyciskiAkcjiDiv.style.display = 'none';
}

function wyczyscWyniki() {
    listaWynikow.innerHTML = '';
    infoZamawiajacy.textContent = '';
    wartoscCalkowitaElement.textContent = '';
    dostepneSaldoInfoElement.textContent = '';
    wynikiDiv.style.display = 'none';
}

function resetujFormularz() {
    liczbaOsobInput.value = '1';
    kosztDostawyInput.value = '0';
    generujPolaKwot(1);
    wyczyscWyniki();
    odblokujFormularz();
}

// --- Główna logika ---

// Funkcja generująca pola (dodane pole Maks. Wkład z limitem)
function generujPolaKwot(liczbaOsob) {
    kwotyZamowienContainer.innerHTML = '';
    if (liczbaOsob < 1 || liczbaOsob > MAX_OSOBY) return;

    const tytul = document.createElement('h3');
    tytul.textContent = 'Dane zamówień (Kwota zamówienia | Maks. Wkład)';
    kwotyZamowienContainer.appendChild(tytul);

    for (let i = 1; i <= liczbaOsob; i++) {
        const div = document.createElement('div');
        div.classList.add('osoba-zamowienie-group');

        const label = document.createElement('label');
        label.setAttribute('for', `imie${i}`);
        label.textContent = `Osoba ${i}${i === 1 ? ' (Zam.)' : ''}:`;

        const inputImie = document.createElement('input');
        inputImie.setAttribute('type', 'text');
        inputImie.setAttribute('id', `imie${i}`);
        inputImie.setAttribute('placeholder', 'Imię (opcjonalnie)');
        inputImie.classList.add('imie-osoby');

        const inputKwota = document.createElement('input');
        inputKwota.setAttribute('type', 'number');
        inputKwota.setAttribute('id', `kwota${i}`);
        inputKwota.setAttribute('min', '0');
        inputKwota.setAttribute('step', '0.10');
        inputKwota.setAttribute('required', 'true');
        inputKwota.setAttribute('placeholder', 'Kwota (zł)');
        inputKwota.classList.add('kwota-zamowienia');

        const inputMaksWklad = document.createElement('input');
        inputMaksWklad.setAttribute('type', 'number');
        inputMaksWklad.setAttribute('id', `maksWklad${i}`);
        inputMaksWklad.setAttribute('min', '0');
        inputMaksWklad.setAttribute('max', DOMYSLNY_BUDZET_NA_OSOBE.toFixed(2)); // Ustawiony max
        inputMaksWklad.setAttribute('step', '0.10');
        inputMaksWklad.setAttribute('placeholder', `Maks. ${DOMYSLNY_BUDZET_NA_OSOBE.toFixed(2)} zł`);
        inputMaksWklad.setAttribute('value', DOMYSLNY_BUDZET_NA_OSOBE.toFixed(2));
        inputMaksWklad.classList.add('maks-wklad');

        div.appendChild(label);
        div.appendChild(inputImie);
        div.appendChild(inputKwota);
        div.appendChild(inputMaksWklad);
        kwotyZamowienContainer.appendChild(div);
    }
}

// Funkcja obliczająca rozliczenie (NOWY ALGORYTM v6 - indywidualne limity z ograniczeniem)
function obliczRozliczenie() {
    wyczyscWyniki();

    const liczbaOsob = parseInt(liczbaOsobInput.value, 10);
    const kosztDostawy = parseFloat(kosztDostawyInput.value) || 0;

    // --- Walidacja podstawowych danych ---
    if (isNaN(liczbaOsob) || liczbaOsob < 1 || liczbaOsob > MAX_OSOBY) {
        alert(`Podaj poprawną liczbę osób (od 1 do ${MAX_OSOBY}).`);
        liczbaOsobInput.focus();
        return;
    }
    if (isNaN(kosztDostawy) || kosztDostawy < 0) {
        alert("Podaj poprawny koszt dostawy (nieujemny).");
        kosztDostawyInput.focus();
        return;
    }

    // --- Odczyt i walidacja danych zamówień i wkładów ---
    const kwotyZamowienInputs = document.querySelectorAll('.kwota-zamowienia');
    const imionaInputs = document.querySelectorAll('.imie-osoby');
    const maksWkladInputs = document.querySelectorAll('.maks-wklad');
    const zamowienia = [];
    let sumaKwotZamowien = 0;
    let calkowityBudzetDostepny = 0;
    let poprawneDane = true;
    let czyWkladZostalOgraniczony = false; // Flaga informująca o ograniczeniu

    for (let i = 0; i < kwotyZamowienInputs.length; i++) {
        const kwotaInput = kwotyZamowienInputs[i];
        const imieInput = imionaInputs[i];
        const wkladInput = maksWkladInputs[i];

        const kwota = parseFloat(kwotaInput.value);
        let maksWklad = parseFloat(wkladInput.value);
        const imie = imieInput.value.trim() || `Osoba ${i + 1}`;

        // Resetuj style błędów
        kwotaInput.style.border = '1px solid #ccc';
        wkladInput.style.border = '1px solid #ccc';

        // Walidacja kwoty zamówienia
        if (isNaN(kwota) || kwota < 0) {
            alert(`Podaj poprawną, nieujemną kwotę zamówienia dla ${imie}.`);
            kwotaInput.style.border = '1px solid red';
            kwotaInput.focus();
            poprawneDane = false;
            break;
        }

        // Walidacja i ograniczenie maksymalnego wkładu
        if (isNaN(maksWklad) || maksWklad < 0) {
            maksWklad = DOMYSLNY_BUDZET_NA_OSOBE;
            wkladInput.value = maksWklad.toFixed(2);
            wkladInput.style.border = '1px solid orange';
            czyWkladZostalOgraniczony = true;
        } else if (maksWklad > DOMYSLNY_BUDZET_NA_OSOBE) {
            maksWklad = DOMYSLNY_BUDZET_NA_OSOBE;
            wkladInput.value = maksWklad.toFixed(2);
            wkladInput.style.border = '1px solid orange';
            czyWkladZostalOgraniczony = true;
        }

        zamowienia.push({
            id: i + 1,
            imie: imie,
            kwota: kwota,
            maksWklad: maksWklad,
            kwotaDoZaplatyPonadLimit: 0
        });
        sumaKwotZamowien += kwota;
        calkowityBudzetDostepny += maksWklad;
    }

    if (!poprawneDane) {
        return;
    }

    // Opcjonalne powiadomienie o korekcie wkładu
    if (czyWkladZostalOgraniczony) {
        alert(`Uwaga: Wartość w polu "Maks. Wkład" dla co najmniej jednej osoby przekraczała ${DOMYSLNY_BUDZET_NA_OSOBE.toFixed(2)} zł i została automatycznie ograniczona.`);
    }

    // --- Algorytm rozliczania ---
    const calkowityKoszt = sumaKwotZamowien + kosztDostawy;
    const czescDostawyNaOsobe = liczbaOsob > 0 ? kosztDostawy / liczbaOsob : 0;

    zamowienia.forEach(zam => {
        const idealnyKosztOsoby = zam.kwota + czescDostawyNaOsobe;
        zam.kwotaDoZaplatyPonadLimit = Math.max(0, idealnyKosztOsoby - zam.maksWklad);
    });

    // --- Wyświetlanie wyników ---
    let sumaDoZwrotuDlaZamawiajacego = 0;
    dostepneSaldoInfoElement.textContent = `Dostępne saldo grupy (suma maks. wkładów): ${calkowityBudzetDostepny.toFixed(2)} zł`;

    zamowienia.forEach((zam) => {
        const osobaId = zam.id;
        const imieOsoby = zam.imie;
        const kwotaZamowienia = zam.kwota;
        const maksWkladOsoby = zam.maksWklad;
        const kwotaDoZaplaty = zam.kwotaDoZaplatyPonadLimit;
        const idealnyKosztOsoby = kwotaZamowienia + czescDostawyNaOsobe;

        const li = document.createElement('li');
        let opis = `${imieOsoby}: Zam. ${kwotaZamowienia.toFixed(2)} zł, Udział dost. ${czescDostawyNaOsobe.toFixed(2)} zł (Idealnie: ${idealnyKosztOsoby.toFixed(2)} zł). Maks. wkład: ${maksWkladOsoby.toFixed(2)} zł.`;

        if (osobaId === 1) {
            li.classList.add('zamawiajacy');
            opis += ' (Zamawiający)';
            if (kwotaDoZaplaty > 0.001) {
                opis += ` Pokrywa dodatkowo: ${kwotaDoZaplaty.toFixed(2)} zł ponad swój limit.`;
            } else {
                opis += ` Mieści się w swoim limicie.`;
            }
        } else {
            if (kwotaDoZaplaty > 0.001) {
                li.classList.add('placi');
                opis += ` Zwraca zamawiającemu: ${kwotaDoZaplaty.toFixed(2)} zł (ponad swój limit).`;
                sumaDoZwrotuDlaZamawiajacego += kwotaDoZaplaty;
            } else {
                opis += ` Mieści się w swoim limicie, nie zwraca nic.`;
            }
        }
        li.textContent = opis;
        listaWynikow.appendChild(li);
    });

    const imieZamawiajacego = zamowienia[0]?.imie || 'Zamawiający';
    if (sumaDoZwrotuDlaZamawiajacego > 0.001) {
        infoZamawiajacy.textContent = `${imieZamawiajacego} (Osoba 1) powinien otrzymać łącznie ${sumaDoZwrotuDlaZamawiajacego.toFixed(2)} zł od pozostałych osób.`;
    } else {
        infoZamawiajacy.textContent = `${imieZamawiajacego} (Osoba 1) nie oczekuje zwrotów od pozostałych osób.`;
    }

    wartoscCalkowitaElement.textContent = `Całkowita wartość zamówienia (jedzenie + dostawa): ${calkowityKoszt.toFixed(2)} zł.`;

    zablokujFormularz();
}


// --- Nasłuchiwanie zdarzeń ---

liczbaOsobInput.addEventListener('input', () => {
    let liczba = parseInt(liczbaOsobInput.value, 10);
    if (liczba > MAX_OSOBY) {
        liczba = MAX_OSOBY;
        liczbaOsobInput.value = MAX_OSOBY;
        alert(`Maksymalna liczba osób to ${MAX_OSOBY}.`);
    }
     if (liczba < 1 && liczbaOsobInput.value !== '') {
        liczba = 1;
        liczbaOsobInput.value = 1;
    }
    if (!isNaN(liczba)) {
        generujPolaKwot(liczba);
        wyczyscWyniki();
        odblokujFormularz();
    }
});

obliczBtn.addEventListener('click', obliczRozliczenie);
kontynuujBtn.addEventListener('click', odblokujFormularz);
wyczyscBtn.addEventListener('click', resetujFormularz);

// --- Inicjalizacja ---
generujPolaKwot(parseInt(liczbaOsobInput.value, 10));