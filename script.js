const liczbaOsobInput = document.getElementById('liczbaOsob');
const kwotyZamowienContainer = document.getElementById('kwotyZamowienContainer');
const kosztDostawyInput = document.getElementById('kosztDostawy');
const obliczBtn = document.getElementById('obliczBtn');
const listaWynikow = document.getElementById('listaWynikow');
const infoZamawiajacy = document.getElementById('infoZamawiajacy');
const wartoscCalkowitaElement = document.getElementById('wartoscCalkowita');
const wynikiDiv = document.getElementById('wyniki');
const formularzZamowienia = document.getElementById('formularzZamowienia'); // Fieldset
const przyciskiAkcjiDiv = document.getElementById('przyciskiAkcji');
const kontynuujBtn = document.getElementById('kontynuujBtn');
const wyczyscBtn = document.getElementById('wyczyscBtn');

const BUDZET_NA_OSOBE = 25.00;
const MAX_OSOBY = 10; // Maksymalna liczba osób

// --- Funkcje pomocnicze do zarządzania stanem formularza ---

function zablokujFormularz() {
    formularzZamowienia.disabled = true;
    obliczBtn.disabled = true;
    przyciskiAkcjiDiv.style.display = 'flex'; // Pokaż przyciski akcji
    wynikiDiv.style.display = 'block'; // Pokaż wyniki
}

function odblokujFormularz() {
    formularzZamowienia.disabled = false;
    obliczBtn.disabled = false;
    przyciskiAkcjiDiv.style.display = 'none'; // Ukryj przyciski akcji
    // Nie ukrywamy wyników, aby można było je zobaczyć podczas edycji
}

function wyczyscWyniki() {
    listaWynikow.innerHTML = '';
    infoZamawiajacy.textContent = '';
    wartoscCalkowitaElement.textContent = '';
    wynikiDiv.style.display = 'none'; // Ukryj sekcję wyników
}

function resetujFormularz() {
    liczbaOsobInput.value = '1';
    kosztDostawyInput.value = '0';
    generujPolaKwot(1); // Generuj pola dla 1 osoby
    wyczyscWyniki();
    odblokujFormularz();
}

// --- Główna logika aplikacji ---

// Funkcja do generowania pól na imiona i kwoty zamówień
function generujPolaKwot(liczbaOsob) {
    kwotyZamowienContainer.innerHTML = ''; // Wyczyść poprzednie pola
    if (liczbaOsob < 1 || liczbaOsob > MAX_OSOBY) return; // Sprawdzenie limitu

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
        inputKwota.setAttribute('step', '0.10'); // Zmieniony step
        inputKwota.setAttribute('required', 'true');
        inputKwota.setAttribute('placeholder', 'Kwota (zł)');
        inputKwota.classList.add('kwota-zamowienia');

        div.appendChild(label);
        div.appendChild(inputImie);
        div.appendChild(inputKwota);
        kwotyZamowienContainer.appendChild(div);
    }
}

// Funkcja obliczająca rozliczenie (NOWY ALGORYTM)
function obliczRozliczenie() {
    wyczyscWyniki(); // Wyczyść poprzednie wyniki przed nowym obliczeniem

    const liczbaOsob = parseInt(liczbaOsobInput.value, 10);
    const kosztDostawy = parseFloat(kosztDostawyInput.value) || 0;

    // --- Walidacja podstawowych danych ---
    if (isNaN(liczbaOsob) || liczbaOsob < 1 || liczbaOsob > MAX_OSOBY) {
        alert(`Podaj poprawną liczbę osób (od 1 do ${MAX_OSOBY}).`);
        liczbaOsobInput.focus(); // Ustaw fokus na błędnym polu
        return;
    }
    if (isNaN(kosztDostawy) || kosztDostawy < 0) {
        alert("Podaj poprawny koszt dostawy (nieujemny).");
        kosztDostawyInput.focus();
        return;
    }

    // --- Odczyt i walidacja danych zamówień ---
    const kwotyZamowienInputs = document.querySelectorAll('.kwota-zamowienia');
    const imionaInputs = document.querySelectorAll('.imie-osoby');
    const zamowienia = [];
    let sumaKwotZamowien = 0;
    let poprawneDane = true;

    for (let i = 0; i < kwotyZamowienInputs.length; i++) {
        const kwotaInput = kwotyZamowienInputs[i];
        const imieInput = imionaInputs[i];
        const kwota = parseFloat(kwotaInput.value);
        const imie = imieInput.value.trim() || `Osoba ${i + 1}`; // Domyślne imię

        // Resetuj styl błędu
        kwotaInput.style.border = '1px solid #ccc';

        if (isNaN(kwota) || kwota < 0) {
            alert(`Podaj poprawną, nieujemną kwotę zamówienia dla ${imie}.`);
            kwotaInput.style.border = '1px solid red';
            kwotaInput.focus();
            poprawneDane = false;
            break; // Przerwij pętlę przy pierwszym błędzie
        }

        zamowienia.push({
            id: i + 1,
            imie: imie,
            kwota: kwota
        });
        sumaKwotZamowien += kwota;
    }

    if (!poprawneDane) {
        return; // Zakończ, jeśli dane są niepoprawne
    }

    // --- Nowy Algorytm Rozliczania ---
    const calkowityKoszt = sumaKwotZamowien + kosztDostawy;
    const czescDostawyNaOsobe = liczbaOsob > 0 ? kosztDostawy / liczbaOsob : 0;
    let sumaDoZwrotuDlaZamawiajacego = 0;

    zamowienia.forEach((zam) => {
        const osobaId = zam.id;
        const imieOsoby = zam.imie;
        const kwotaZamowienia = zam.kwota;

        // Oblicz "sprawiedliwy udział" tej osoby w całkowitym koszcie
        const sprawiedliwyUdzial = kwotaZamowienia + czescDostawyNaOsobe;

        // Ile osoba musi dopłacić ponad swój budżet 25 zł
        const kwotaDoZaplatyPonadBudzet = Math.max(0, sprawiedliwyUdzial - BUDZET_NA_OSOBE);

        const li = document.createElement('li');
        let opis = `${imieOsoby}: Zamówienie: ${kwotaZamowienia.toFixed(2)} zł. Udział w dostawie: ${czescDostawyNaOsobe.toFixed(2)} zł. Łączny udział: ${sprawiedliwyUdzial.toFixed(2)} zł.`;

        if (osobaId === 1) { // Zamawiający
            li.classList.add('zamawiajacy');
            if (kwotaDoZaplatyPonadBudzet > 0.001) {
                opis += ` Pokrywa ${kwotaDoZaplatyPonadBudzet.toFixed(2)} zł ponad budżet.`;
            } else {
                const niewykorzystanyBudzet = Math.max(0, BUDZET_NA_OSOBE - sprawiedliwyUdzial);
                opis += ` Mieści się w budżecie (pozostaje ${niewykorzystanyBudzet.toFixed(2)} zł z budżetu).`;
            }
        } else { // Pozostałe osoby
            if (kwotaDoZaplatyPonadBudzet > 0.001) {
                li.classList.add('placi'); // Dodaj klasę dla osób płacących
                opis += ` Zwraca zamawiającemu: ${kwotaDoZaplatyPonadBudzet.toFixed(2)} zł.`;
                sumaDoZwrotuDlaZamawiajacego += kwotaDoZaplatyPonadBudzet;
            } else {
                const niewykorzystanyBudzet = Math.max(0, BUDZET_NA_OSOBE - sprawiedliwyUdzial);
                opis += ` Nie musi nic zwracać (mieści się w budżecie, pozostaje ${niewykorzystanyBudzet.toFixed(2)} zł).`;
            }
        }
        li.textContent = opis;
        listaWynikow.appendChild(li);
    });

    // Informacja podsumowująca dla zamawiającego
    const imieZamawiajacego = zamowienia[0]?.imie || 'Zamawiający';
    if (sumaDoZwrotuDlaZamawiajacego > 0.001) {
        infoZamawiajacy.textContent = `${imieZamawiajacego} (Osoba 1) powinien otrzymać łącznie ${sumaDoZwrotuDlaZamawiajacego.toFixed(2)} zł od pozostałych osób.`;
    } else {
        infoZamawiajacy.textContent = `${imieZamawiajacego} (Osoba 1) nie oczekuje zwrotów od pozostałych osób.`;
    }

    // Wyświetlenie wartości całkowitej
    wartoscCalkowitaElement.textContent = `Całkowita wartość zamówienia (jedzenie + dostawa): ${calkowityKoszt.toFixed(2)} zł`;

    // Zablokuj formularz po poprawnym obliczeniu
    zablokujFormularz();
}

// --- Nasłuchiwanie zdarzeń ---

// Zmiana liczby osób
liczbaOsobInput.addEventListener('input', () => {
    let liczba = parseInt(liczbaOsobInput.value, 10);
    // Ograniczenie do MAX_OSOBY
    if (liczba > MAX_OSOBY) {
        liczba = MAX_OSOBY;
        liczbaOsobInput.value = MAX_OSOBY;
        alert(`Maksymalna liczba osób to ${MAX_OSOBY}.`);
    }
     if (liczba < 1 && liczbaOsobInput.value !== '') { // Zapobiegaj ujemnym lub zeru
        liczba = 1;
        liczbaOsobInput.value = 1;
    }
    if (!isNaN(liczba)) {
        generujPolaKwot(liczba);
        wyczyscWyniki(); // Wyczyść wyniki przy zmianie liczby osób
        odblokujFormularz(); // Upewnij się, że formularz jest odblokowany
    }
});

// Kliknięcie przycisku obliczania
obliczBtn.addEventListener('click', obliczRozliczenie);

// Kliknięcie przycisku "Kontynuuj edycję"
kontynuujBtn.addEventListener('click', odblokujFormularz);

// Kliknięcie przycisku "Wyczyść i zacznij od nowa"
wyczyscBtn.addEventListener('click', resetujFormularz);

// --- Inicjalizacja ---
// Wygeneruj pola dla domyślnej wartości przy załadowaniu strony
generujPolaKwot(parseInt(liczbaOsobInput.value, 10));