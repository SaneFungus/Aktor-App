document.addEventListener('DOMContentLoaded', () => {
    // --- Referencje do elementów DOM ---
    const fileInput = document.getElementById('fileInput');
    const loadButtonLabel = document.querySelector('.load-button'); // Używamy labelki jako przycisku
    const flashcardContainer = document.getElementById('flashcard-container');
    const cardProgress = document.getElementById('card-progress');
    const cardContent = document.getElementById('card-content');
    const prevButton = document.getElementById('prev-card');
    const nextButton = document.getElementById('next-card');

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
                console.log(`Wczytano ${deck.length} fiszek z localStorage.`);
                return true;
            } catch (e) {
                console.error("Błąd podczas parsowania talii z localStorage:", e);
                localStorage.removeItem(DECK_STORAGE_KEY); // Usuń uszkodzone dane
                return false;
            }
        }
        return false;
    }

    /**
     * Zapisuje aktualny stan talii do localStorage.
     */
    function saveDeckToStorage() {
        if (deck && deck.length > 0) {
            localStorage.setItem(DECK_STORAGE_KEY, JSON.stringify(deck));
             console.log(`Zapisano ${deck.length} fiszek do localStorage.`);
        } else {
            localStorage.removeItem(DECK_STORAGE_KEY); // Usuń klucz, jeśli talia jest pusta
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
        const paragraphs = text.split(/\n\s*\n+/).map(p => p.trim()).filter(p => p.length > 0);

        return paragraphs.map((p, index) => ({
            id: index,
            // Podstawowe czyszczenie - zamienia \n na <br> wewnątrz akapitu
            // Można rozszerzyć o bardziej zaawansowane formatowanie
            content: `<p>${p.replace(/\n/g, '<br>')}</p>`,
            status: 'new' // Domyślny status nowej fiszki
        }));
    }

    /**
     * Wyświetla fiszkę o podanym indeksie.
     * @param {number} index - Indeks fiszki w talii `deck`.
     */
    function displayCard(index) {
        if (deck.length === 0 || index < 0 || index >= deck.length) {
            cardContent.innerHTML = '<p>Brak fiszek do wyświetlenia. Wczytaj plik .txt.</p>';
            cardProgress.textContent = '';
            prevButton.disabled = true;
            nextButton.disabled = true;
            return;
        }

        currentCardIndex = index;
        const card = deck[index];

        // Aktualizuj treść fiszki
        cardContent.innerHTML = card.content; // Wstawiamy gotowy HTML
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

        if (file.type === "text/plain") {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const fileContent = e.target.result;
                    deck = splitTextIntoCards(fileContent);
                    if (deck.length > 0) {
                        console.log(`Utworzono ${deck.length} fiszek.`);
                        currentCardIndex = 0;
                        saveDeckToStorage(); // Zapisz nową talię
                        displayCard(currentCardIndex);
                        alert(`Wczytano i utworzono ${deck.length} fiszek.`);
                    } else {
                        alert("Nie znaleziono tekstu do podziału na fiszki w pliku.");
                        displayCard(-1); // Wyświetl komunikat o braku fiszek
                    }
                } catch (error) {
                     console.error("Błąd podczas przetwarzania pliku:", error);
                     alert("Wystąpił błąd podczas przetwarzania pliku.");
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
        fileInput.value = '';
    }

    // --- Inicjalizacja ---

    // Podpięcie event listenerów
    fileInput.addEventListener('change', handleFileLoad);

    prevButton.addEventListener('click', () => {
        if (currentCardIndex > 0) {
            displayCard(currentCardIndex - 1);
        }
    });

    nextButton.addEventListener('click', () => {
        if (currentCardIndex < deck.length - 1) {
            displayCard(currentCardIndex + 1);
        }
    });

    // Spróbuj wczytać talię przy starcie aplikacji
    if (loadDeckFromStorage() && deck.length > 0) {
        displayCard(currentCardIndex); // Wyświetl pierwszą (lub zapamiętaną) kartę
    } else {
        displayCard(-1); // Pokaż komunikat początkowy
    }

}); // Koniec DOMContentLoaded
