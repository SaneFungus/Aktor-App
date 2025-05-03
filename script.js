document.addEventListener('DOMContentLoaded', () => {
    // --- Referencje do elementów DOM ---
    const fileInput = document.getElementById('fileInput');
    const loadButtonLabel = document.querySelector('.load-button'); // Używamy labelki jako przycisku
    const flashcardContainer = document.getElementById('flashcard-container');
    const cardProgress = document.getElementById('card-progress');
    const cardContent = document.getElementById('card-content');
    const prevButton = document.getElementById('prev-card');
    const nextButton = document.getElementById('next-card');

    // +++ DODANE SPRAWDZENIA +++
    // Sprawdzamy, czy wszystkie kluczowe elementy zostały znalezione
    if (!fileInput) console.error("BŁĄD KRYTYCZNY: Nie znaleziono elementu #fileInput!");
    if (!loadButtonLabel) console.error("BŁĄD KRYTYCZNY: Nie znaleziono elementu .load-button!");
    if (!flashcardContainer) console.error("BŁĄD KRYTYCZNY: Nie znaleziono elementu #flashcard-container!");
    if (!cardProgress) console.error("BŁĄD KRYTYCZNY: Nie znaleziono elementu #card-progress!");
    if (!cardContent) console.error("BŁĄD KRYTYCZNY: Nie znaleziono elementu #card-content!");
    if (!prevButton) console.error("BŁĄD KRYTYCZNY: Nie znaleziono elementu #prev-card!");
    if (!nextButton) console.error("BŁĄD KRYTYCZNY: Nie znaleziono elementu #next-card!");
    // +++ KONIEC SPRAWDZEŃ +++


    // --- Stan aplikacji ---
    let deck = []; // Tablica na obiekty fiszek: { id: number, content: string, status: string }
    let currentCardIndex = 0;
    const DECK_STORAGE_KEY = 'actorFlashcardDeck'; // Klucz do localStorage

    // --- Funkcje ---

    /**
     * Wczytuje zapisany stan talii z localStorage.
     */
    function loadDeckFromStorage() {
        const storedDeck = localStorage.getItem(DECK_STORAGE_KEY);
        if (storedDeck) {
            try {
                deck = JSON.parse(storedDeck);
                // Podstawowa walidacja wczytanych danych
                if (!Array.isArray(deck)) {
                    console.error("Dane w localStorage nie są tablicą. Czyszczenie.");
                    deck = [];
                    localStorage.removeItem(DECK_STORAGE_KEY);
                    return false;
                }
                console.log(`Wczytano ${deck.length} fiszek z localStorage.`);
                // Upewnij się, że currentCardIndex jest w zakresie
                if (currentCardIndex >= deck.length) {
                    currentCardIndex = deck.length > 0 ? deck.length - 1 : 0;
                }
                return true;
            } catch (e) {
                console.error("Błąd podczas parsowania talii z localStorage:", e);
                localStorage.removeItem(DECK_STORAGE_KEY); // Usuń uszkodzone dane
                deck = []; // Resetuj talię w pamięci
                return false;
            }
        }
        return false;
    }

    /**
     * Zapisuje aktualny stan talii do localStorage.
     */
    function saveDeckToStorage() {
        if (deck && Array.isArray(deck) && deck.length > 0) {
            try {
                localStorage.setItem(DECK_STORAGE_KEY, JSON.stringify(deck));
                 console.log(`Zapisano ${deck.length} fiszek do localStorage.`);
            } catch (e) {
                 console.error("Błąd podczas zapisywania talii do localStorage:", e);
                 // Można dodać informację dla użytkownika, że zapis się nie powiódł
            }
        } else {
            localStorage.removeItem(DECK_STORAGE_KEY); // Usuń klucz, jeśli talia jest pusta
            console.log("Talia pusta, usunięto zapis z localStorage.");
        }
    }

    /**
     * Dzieli tekst na akapity (fiszki). Akapity oddzielone pustymi liniami.
     * @param {string} text - Tekst do podziału.
     * @returns {Array<object>} - Tablica obiektów fiszek.
     */
    function splitTextIntoCards(text) {
        // Dzieli po jednej lub więcej pustych linii (\n\s*\n)+
        // i trimuje białe znaki z każdej linii
        // Upewnij się, że na końcu pliku też jest traktowane jako separator
        const paragraphs = text.trim().split(/\n\s*\n+/).map(p => p.trim()).filter(p => p.length > 0);

        return paragraphs.map((p, index) => ({
            id: index,
            // Podstawowe czyszczenie - zamienia \n na <br> wewnątrz akapitu
            // Zabezpieczenie przed HTML injection (proste) - zastępuje < i >
            content: `<p>${p.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, '<br>')}</p>`,
            status: 'new' // Domyślny status nowej fiszki
        }));
    }

    /**
     * Wyświetla fiszkę o podanym indeksie.
     * @param {number} index - Indeks fiszki w talii `deck`.
     */
    function displayCard(index) {
        // Sprawdź, czy elementy do wyświetlania istnieją
        if (!cardContent || !cardProgress || !prevButton || !nextButton) {
            console.error("Brakuje elementów UI do wyświetlenia karty!");
            return;
        }

        if (!Array.isArray(deck) || deck.length === 0 || index < 0 || index >= deck.length) {
            cardContent.innerHTML = '<p>Brak fiszek do wyświetlenia. Wczytaj plik .txt.</p>';
            cardProgress.textContent = '';
            prevButton.disabled = true;
            nextButton.disabled = true;
            currentCardIndex = 0; // Resetuj indeks
            return;
        }

        currentCardIndex = index;
        const card = deck[index];

        // Aktualizuj treść fiszki
        if (card && typeof card.content === 'string') {
             cardContent.innerHTML = card.content; // Wstawiamy gotowy HTML
        } else {
             console.error(`Nieprawidłowa karta na indeksie ${index}:`, card);
             cardContent.innerHTML = '<p>Błąd: Nieprawidłowa zawartość fiszki.</p>';
        }
        // Tutaj w przyszłości dodamy logikę ukrywania/pokazywania słów

        // Aktualizuj postęp
        cardProgress.textContent = `Fiszka ${index + 1} / ${deck.length}`;

        // Aktualizuj stan przycisków nawigacyjnych
        prevButton.disabled = (index === 0);
        nextButton.disabled = (index === deck.length - 1);

        // Tutaj w przyszłości dodamy obsługę przycisków statusu
    }

    /**
     * Obsługuje wczytanie pliku wybranego przez użytkownika.
     * @param {Event} event - Zdarzenie zmiany inputu pliku.
     */
    function handleFileLoad(event) {
        const file = event.target.files[0];
        if (!file) {
            return; // Nie wybrano pliku
        }

        // Sprawdź ponownie, czy elementy UI istnieją
        if (!cardContent || !cardProgress || !prevButton || !nextButton) {
            console.error("Krytyczny błąd: Brakuje elementów UI podczas ładowania pliku.");
            alert("Wystąpił wewnętrzny błąd aplikacji. Odśwież stronę.");
            return;
        }

        if (file.type === "text/plain") {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const fileContent = e.target.result;
                    if (typeof fileContent !== 'string') {
                         throw new Error("Odczytana zawartość pliku nie jest tekstem.");
                    }
                    deck = splitTextIntoCards(fileContent);
                    if (deck.length > 0) {
                        console.log(`Utworzono ${deck.length} fiszek.`);
                        currentCardIndex = 0;
                        saveDeckToStorage(); // Zapisz nową talię
                        displayCard(currentCardIndex);
                        alert(`Wczytano i utworzono ${deck.length} fiszek.`);
                    } else {
                        alert("Nie znaleziono tekstu do podziału na fiszki w pliku. Sprawdź, czy akapity są oddzielone pustymi liniami.");
                        deck = []; // Upewnij się, że talia jest pusta
                        saveDeckToStorage();
                        displayCard(-1); // Wyświetl komunikat o braku fiszek
                    }
                } catch (error) {
                     console.error("Błąd podczas przetwarzania pliku:", error);
                     alert(`Wystąpił błąd podczas przetwarzania pliku: ${error.message}`);
                     deck = [];
                     saveDeckToStorage();
                     displayCard(-1);
                }
            };
            reader.onerror = (e) => {
                console.error("Błąd podczas odczytu pliku:", e);
                alert("Nie można odczytać pliku.");
                deck = [];
                saveDeckToStorage();
                displayCard(-1);
            };
            reader.readAsText(file);
        } else {
            alert("Proszę wybrać plik tekstowy (.txt)");
        }

        // Resetuj input pliku, aby można było wczytać ten sam plik ponownie
        if (fileInput) {
            fileInput.value = '';
        }
    }

    // --- Inicjalizacja ---

    // Podpięcie event listenerów - tylko jeśli elementy istnieją
    if (fileInput) {
        fileInput.addEventListener('change', handleFileLoad);
    } else {
        console.error("Nie można dodać listenera do #fileInput, bo nie został znaleziony.");
        // Rozważ wyświetlenie komunikatu użytkownikowi, że ładowanie plików nie będzie działać
        if(loadButtonLabel) {
            loadButtonLabel.textContent = "Błąd ładowania!";
            loadButtonLabel.style.backgroundColor = "red";
            loadButtonLabel.style.color = "white";
        }
    }

    if (prevButton) {
        prevButton.addEventListener('click', () => {
             // Sprawdź ponownie, czy deck jest tablicą
            if (Array.isArray(deck) && currentCardIndex > 0) {
                displayCard(currentCardIndex - 1);
            }
        });
    } else {
        console.error("Nie można dodać listenera do #prev-card, bo nie został znaleziony.");
    }

    if (nextButton) {
        nextButton.addEventListener('click', () => {
             // Sprawdź ponownie, czy deck jest tablicą
            if (Array.isArray(deck) && currentCardIndex < deck.length - 1) {
                displayCard(currentCardIndex + 1);
            }
        });
    } else {
        console.error("Nie można dodać listenera do #next-card, bo nie został znaleziony.");
    }


    // Spróbuj wczytać talię przy starcie aplikacji
    try {
        if (loadDeckFromStorage() && Array.isArray(deck) && deck.length > 0) {
            // Upewnij się, że indeks jest poprawny po wczytaniu
            if (currentCardIndex < 0 || currentCardIndex >= deck.length) {
                 currentCardIndex = 0;
            }
            displayCard(currentCardIndex); // Wyświetl pierwszą (lub zapamiętaną) kartę
        } else {
            displayCard(-1); // Pokaż komunikat początkowy
        }
    } catch (error) {
         console.error("Błąd podczas inicjalizacji aplikacji z localStorage:", error);
         // W razie błędu, spróbuj wyświetlić stan początkowy
         deck = [];
         currentCardIndex = 0;
         displayCard(-1);
    }


}); // Koniec DOMContentLoaded
