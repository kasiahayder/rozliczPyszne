const liczbaOsobInput = document.getElementById('liczbaOsob');
const kwotyZamowienContainer = document.getElementById('kwotyZamowienContainer');
const kosztDostawyInput = document.getElementById('kosztDostawy');
const obliczBtn = document.getElementById('obliczBtn');
const listaWynikow = document.getElementById('listaWynikow');
const infoZamawiajacy = document.getElementById('infoZamawiajacy');

const BUDZET_NA_OSOBE = 25.00;

// Funkcja do generowania pól na kwoty zamówień
function generujPolaKwot(liczbaOsob) {
    kwotyZamowienContainer.innerHTML = ''; // Wyczyść poprzednie pola
    if (liczbaOsob < 1) return;

    const tytul = document.createElement('h3');
    tytul.textContent = 'Kwoty zamówień (zł):';
    kwotyZamowienContainer.appendChild(tytul);

    for (let i = 1; i <= liczbaOsob; i++) {
        const div = document.createElement('div');
        div.classList.add('input-group', 'kwota-zamowienia-group'); // Dodajemy klasy

        const label = document.createElement('label');
        label.setAttribute('for', `kwota${i}`);
        // Oznaczamy pierwszą osobę jako zamawiającą
        label.textContent = `Osoba ${i} ${i === 1 ? '(Zamawiający)' : ''}:`;

        const input = document.createElement('input');
        input.setAttribute('type', 'number');
        input.setAttribute('id', `kwota${i}`);
        input.setAttribute('min', '0');
        input.setAttribute('step', '0.01');
        input.setAttribute('required', 'true'); // Wymagane pole
        input.classList.add('kwota-zamowienia'); // Klasa do łatwego znalezienia

        div.appendChild(label);
        div.appendChild(input);
        kwotyZamowienContainer.appendChild(div);
    }
}

// Funkcja obliczająca rozliczenie
function obliczRozliczenie() {
    listaWynikow.innerHTML = ''; // Wyczyść poprzednie wyniki
    infoZamawiajacy.textContent = ''; // Wyczyść info

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
    const zamowienia = [];
    let sumaZamowien = 0;

    // Zbierz kwoty zamówień i sprawdź poprawność
    for (let i = 0; i < kwotyZamowienInputs.length; i++) {
        const kwota = parseFloat(kwotyZamowienInputs[i].value);
        if (isNaN(kwota) || kwota < 0) {
            alert(`Podaj poprawną kwotę zamówienia dla Osoby ${i + 1}.`);
            return;
        }
        zamowienia.push({ id: i + 1, kwota: kwota });
        sumaZamowien += kwota;
    }

    // Krok 1: Oblicz, ile z budżetów pokrywa koszt dostawy
    let wplataNaDostaweZBudzetow = 0;
    zamowienia.forEach(zam => {
        if (zam.kwota < BUDZET_NA_OSOBE) {
            const pozostaloZBudzetu = BUDZET_NA_OSOBE - zam.kwota;
            const wplata = Math.min(pozostaloZBudzetu, kosztDostawy - wplataNaDostaweZBudzetow);
            wplataNaDostaweZBudzetow += wplata;
        }
    });

    // Krok 2: Oblicz pozostały koszt dostawy
    const pozostalyKosztDostawy = Math.max(0, kosztDostawy - wplataNaDostaweZBudzetow);

    // Krok 3: Podziel pozostały koszt dostawy równo między wszystkich
    const czescDostawyNaOsobe = pozostalyKosztDostawy / liczbaOsob;

    // Krok 4: Oblicz, ile każda osoba musi zwrócić zamawiającemu
    let sumaDoZwrotuDlaZamawiajacego = 0;

    zamowienia.forEach((zam, index) => {
        const osobaId = zam.id;
        const kwotaZamowienia = zam.kwota;

        // Ile osoba przekroczyła swój budżet na samo jedzenie
        const przekroczenieBudzetu = Math.max(0, kwotaZamowienia - BUDZET_NA_OSOBE);

        // Całkowita kwota do zapłaty przez osobę ponad jej budżet
        // (przekroczenie budżetu + jej część pozostałego kosztu dostawy)
        const kwotaDoZaplaty = przekroczenieBudzetu + czescDostawyNaOsobe;

        const li = document.createElement('li');
        if (osobaId === 1) { // Specjalne oznaczenie dla zamawiającego
            li.classList.add('zamawiajacy');
            li.textContent = `Osoba ${osobaId} (Zamawiający): Zamówienie: ${kwotaZamowienia.toFixed(2)} zł. Pokrywa swoje przekroczenie (${przekroczenieBudzetu.toFixed(2)} zł) i swoją część dostawy (${czescDostawyNaOsobe.toFixed(2)} zł).`;
        } else {
            li.textContent = `Osoba ${osobaId}: Zamówienie: ${kwotaZamowienia.toFixed(2)} zł. Musi zwrócić zamawiającemu: ${kwotaDoZaplaty.toFixed(2)} zł (Przekroczenie: ${przekroczenieBudzetu.toFixed(2)} zł + Dostawa: ${czescDostawyNaOsobe.toFixed(2)} zł).`;
            sumaDoZwrotuDlaZamawiajacego += kwotaDoZaplaty;
        }
        listaWynikow.appendChild(li);
    });

    // Informacja podsumowująca dla zamawiającego
    infoZamawiajacy.textContent = `Zamawiający (Osoba 1) powinien otrzymać łącznie ${sumaDoZwrotuDlaZamawiajacego.toFixed(2)} zł od pozostałych osób.`;

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