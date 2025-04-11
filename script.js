const liczbaOsobInput = document.getElementById('liczbaOsob');
const kwotyZamowienContainer = document.getElementById('kwotyZamowienContainer');
const kosztDostawyInput = document.getElementById('kosztDostawy');
const obliczBtn = document.getElementById('obliczBtn');
const listaWynikow = document.getElementById('listaWynikow');
const infoZamawiajacy = document.getElementById('infoZamawiajacy');
const wartoscCalkowitaElement = document.getElementById('wartoscCalkowita'); // Pobierz nowy element

const BUDZET_NA_OSOBE = 25.00;

// Funkcja do generowania pól na imiona i kwoty zamówień
function generujPolaKwot(liczbaOsob) {
    kwotyZamowienContainer.innerHTML = '';
    if (liczbaOsob < 1) return;

    const tytul = document.createElement('h3');
    tytul.textContent = 'Dane zamówień:';
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
        inputKwota.setAttribute('step', '0.01');
        inputKwota.setAttribute('required', 'true');
        inputKwota.setAttribute('placeholder', 'Kwota (zł)');
        inputKwota.classList.add('kwota-zamowienia');

        div.appendChild(label);
        div.appendChild(inputImie);
        div.appendChild(inputKwota);
        kwotyZamowienContainer.appendChild(div);
    }
}

// Funkcja obliczająca rozliczenie
function obliczRozliczenie() {
    listaWynikow.innerHTML = '';
    infoZamawiajacy.textContent = '';
    wartoscCalkowitaElement.textContent = ''; // Wyczyść pole wartości całkowitej

    const liczbaOsob = parseInt(liczbaOsobInput.value, 10);
    let kosztDostawy = parseFloat(kosztDostawyInput.value) || 0;

    if (isNaN(liczbaOsob) || liczbaOsob < 1) {
        alert("Podaj poprawną liczbę osób.");
        return;
    }
    if (isNaN(kosztDostawy) || kosztDostawy < 0) {
        alert("Podaj poprawny koszt dostawy.");
        return;
    }

    const kwotyZamowienInputs = document.querySelectorAll('.kwota-zamowienia');
    const imionaInputs = document.querySelectorAll('.imie-osoby');
    const zamowienia = [];
    let sumaZamowien = 0; // Zmienna na sumę kwot samych zamówień
    let poprawneDane = true;

    for (let i = 0; i < kwotyZamowienInputs.length; i++) {
        const kwotaInput = kwotyZamowienInputs[i];
        const imieInput = imionaInputs[i];
        const kwota = parseFloat(kwotaInput.value);
        const imie = imieInput.value.trim();

        if (isNaN(kwota) || kwota < 0) {
            alert(`Podaj poprawną kwotę zamówienia dla Osoby ${i + 1}.`);
            kwotaInput.style.border = '1px solid red';
            poprawneDane = false;
        } else {
            kwotaInput.style.border = '1px solid #ccc';
        }

        const kwotaDoSumy = isNaN(kwota) || kwota < 0 ? 0 : kwota; // Użyj 0 jeśli błędna kwota
        zamowienia.push({
            id: i + 1,
            imie: imie || `Osoba ${i + 1}`,
            kwota: kwotaDoSumy
        });
        // Sumuj tylko poprawne, nieujemne kwoty
        if (!isNaN(kwota) && kwota >= 0) {
             sumaZamowien += kwota;
        }
    }

    if (!poprawneDane) {
        return;
    }

    // Krok 1: Oblicz, ile z budżetów pokrywa koszt dostawy
    let wplataNaDostaweZBudzetow = 0;
    zamowienia.forEach(zam => {
        if (zam.kwota < BUDZET_NA_OSOBE) {
            const pozostaloZBudzetu = BUDZET_NA_OSOBE - zam.kwota;
            const dostawaDoPokrycia = Math.max(0, kosztDostawy - wplataNaDostaweZBudzetow);
            const wplata = Math.min(pozostaloZBudzetu, dostawaDoPokrycia);
            wplataNaDostaweZBudzetow += wplata;
        }
    });

    // Krok 2: Oblicz pozostały koszt dostawy
    const pozostalyKosztDostawy = Math.max(0, kosztDostawy - wplataNaDostaweZBudzetow);

    // Krok 3: Podziel pozostały koszt dostawy równo między wszystkich
    const czescDostawyNaOsobe = liczbaOsob > 0 ? pozostalyKosztDostawy / liczbaOsob : 0;

    // Krok 4: Oblicz, ile każda osoba musi zwrócić zamawiającemu
    let sumaDoZwrotuDlaZamawiajacego = 0;

    zamowienia.forEach((zam) => {
        const osobaId = zam.id;
        const imieOsoby = zam.imie;
        const kwotaZamowienia = zam.kwota;
        const przekroczenieBudzetu = Math.max(0, kwotaZamowienia - BUDZET_NA_OSOBE);
        const kwotaDoZaplaty = przekroczenieBudzetu + czescDostawyNaOsobe;

        const li = document.createElement('li');
        if (osobaId === 1) {
            li.classList.add('zamawiajacy');
            li.textContent = `${imieOsoby} (Zamawiający): Zamówienie: ${kwotaZamowienia.toFixed(2)} zł. Pokrywa swoje przekroczenie (${przekroczenieBudzetu.toFixed(2)} zł) i swoją część dostawy (${czescDostawyNaOsobe.toFixed(2)} zł).`;
        } else {
            if (kwotaDoZaplaty > 0.001) {
                 li.textContent = `${imieOsoby}: Zamówienie: ${kwotaZamowienia.toFixed(2)} zł. Zwraca zamawiającemu: ${kwotaDoZaplaty.toFixed(2)} zł (Przekroczenie: ${przekroczenieBudzetu.toFixed(2)} zł + Dostawa: ${czescDostawyNaOsobe.toFixed(2)} zł).`;
                 sumaDoZwrotuDlaZamawiajacego += kwotaDoZaplaty;
            } else {
                 li.textContent = `${imieOsoby}: Zamówienie: ${kwotaZamowienia.toFixed(2)} zł. Nie musi nic zwracać (pokrywa tylko swoją część dostawy ${czescDostawyNaOsobe.toFixed(2)} zł z budżetu lub zamówienia).`;
            }
        }
        listaWynikow.appendChild(li);
    });

    // Informacja podsumowująca dla zamawiającego
    const imieZamawiajacego = zamowienia[0]?.imie || 'Zamawiający';
    if (sumaDoZwrotuDlaZamawiajacego > 0.001) {
        infoZamawiajacy.textContent = `${imieZamawiajacego} (Osoba 1) powinien otrzymać łącznie ${sumaDoZwrotuDlaZamawiajacego.toFixed(2)} zł od pozostałych osób.`;
    } else {
        infoZamawiajacy.textContent = `${imieZamawiajacego} (Osoba 1) nie oczekuje zwrotów od pozostałych osób.`;
    }

    // DODANE: Obliczenie i wyświetlenie wartości całkowitej
    const wartoscCalkowita = sumaZamowien + kosztDostawy;
    wartoscCalkowitaElement.textContent = `Całkowita wartość zamówienia (jedzenie + dostawa): ${wartoscCalkowita.toFixed(2)} zł`;

}

// Nasłuchiwanie zmiany liczby osób
liczbaOsobInput.addEventListener('input', () => {
    const liczba = parseInt(liczbaOsobInput.value, 10);
    generujPolaKwot(liczba);
});

// Nasłuchiwanie kliknięcia przycisku obliczania
obliczBtn.addEventListener('click', obliczRozliczenie);

// Wygeneruj pola dla domyślnej wartości przy załadowaniu strony
generujPolaKwot(parseInt(liczbaOsobInput.value, 10));