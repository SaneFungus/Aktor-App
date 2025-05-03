document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('fileInput');
    const scriptContent = document.getElementById('script-content');
    const formatButtons = document.querySelectorAll('.format-button');
    const clearFormattingButton = document.getElementById('clearFormatting');
    const emojiButtons = document.querySelectorAll('.emoji-button');
    const startLearningButton = document.getElementById('startLearning');
    const checkAnswersButton = document.getElementById('checkAnswers');
    const exitLearningButton = document.getElementById('exitLearning');
    const scoreDisplay = document.getElementById('score');
    const saveButton = document.getElementById('saveButton');
    const loadHtmlButton = document.getElementById('loadHtmlButton');
    const htmlFileInput = document.getElementById('htmlFileInput');

    let originalContentBeforeLearning = ''; // Do przechowywania stanu przed trybem nauki

    // --- Wczytywanie pliku TXT ---
    fileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file && file.type === "text/plain") {
            const reader = new FileReader();
            reader.onload = (e) => {
                // Podziel tekst na linie i opakuj każdą w paragraf <p>
                const lines = e.target.result.split('\n');
                scriptContent.innerHTML = lines.map(line => `<p>${line || '&nbsp;'}</p>`).join('');
                makeEditable(); // Umożliw edycję po wczytaniu
            };
            reader.readAsText(file);
        } else {
            alert("Proszę wybrać plik tekstowy (.txt)");
            fileInput.value = ''; // Resetuj input pliku
        }
    });

    // Umożliwia edycję treści diva, co jest potrzebne do wstawiania formatowania
    function makeEditable() {
        scriptContent.contentEditable = "true";
    }
    // Wywołanie raz na początku, jeśli chcemy edytować od razu
    // makeEditable(); // Można odkomentować, jeśli chcesz edytować domyślny tekst

    // --- Formatowanie tekstu ---
    formatButtons.forEach(button => {
        button.addEventListener('click', () => {
            if (scriptContent.contentEditable !== "true") {
                alert("Najpierw wczytaj tekst lub włącz edycję.");
                return;
            }
            const styleClass = button.getAttribute('data-style');
            wrapSelectedText(styleClass);
        });
    });

    clearFormattingButton.addEventListener('click', () => {
         if (scriptContent.contentEditable !== "true") return;
        const selection = window.getSelection();
        if (!selection.rangeCount) return;

        const range = selection.getRangeAt(0);
        const selectedText = range.toString();

        if (selectedText) {
            const commonAncestor = range.commonAncestorContainer;

            // Proste usuwanie - usuwa tylko SPANy wewnątrz zaznaczenia
            // Bardziej złożone przypadki (częściowe zaznaczenie spanów) wymagają bardziej zaawansowanej logiki
            const elementsToRemoveFormatting = [];

            if (commonAncestor.nodeType === Node.ELEMENT_NODE) {
                 // Jeśli zaznaczenie jest wewnątrz jednego elementu
                 const spans = commonAncestor.querySelectorAll('span[class]'); // Znajdź wszystkie span-y z klasą
                 spans.forEach(span => {
                      if(selection.containsNode(span, true)) { // Jeśli span jest w pełni zawarty w zaznaczeniu
                           elementsToRemoveFormatting.push(span);
                      }
                      // TODO: Obsługa częściowego zaznaczenia spanów jest trudniejsza
                 });

            } else if (commonAncestor.nodeType === Node.TEXT_NODE && commonAncestor.parentNode.nodeName === 'SPAN') {
                 // Jeśli zaznaczenie jest wewnątrz SPANa
                 elementsToRemoveFormatting.push(commonAncestor.parentNode);
            }


            // Zastąp span z formatowaniem jego zawartością tekstową
            elementsToRemoveFormatting.forEach(span => {
                 const parent = span.parentNode;
                 while (span.firstChild) {
                     parent.insertBefore(span.firstChild, span);
                 }
                 parent.removeChild(span);
                 parent.normalize(); // Łączy sąsiednie węzły tekstowe
            });


            // Opcjonalnie: Spróbuj użyć `document.execCommand('removeFormat')` - ale może być mniej precyzyjne
            // document.execCommand('removeFormat', false, null);

            selection.removeAllRanges(); // Wyczyść zaznaczenie po operacji
        } else {
            alert("Zaznacz tekst, z którego chcesz usunąć formatowanie.");
        }
    });

    function wrapSelectedText(className) {
        const selection = window.getSelection();
        if (!selection.rangeCount || selection.isCollapsed) return; // Nic nie zaznaczono

        const range = selection.getRangeAt(0);
        const selectedText = range.toString();

        if (!selectedText) return;

        // Sprawdź, czy zaznaczenie nie wychodzi poza #script-content
        if (!scriptContent.contains(range.commonAncestorContainer)) {
            alert("Można formatować tylko tekst wewnątrz obszaru scenariusza.");
            return;
        }

        // Sprawdź czy zaznaczenie nie obejmuje bloków (np. całych <p>) w nieodpowiedni sposób
         if (range.startContainer.nodeName === 'DIV' || range.endContainer.nodeName === 'DIV') {
              alert("Zaznacz tekst wewnątrz akapitów, a nie całe bloki.");
              return;
         }

        // Utwórz nowy element span
        const span = document.createElement('span');
        span.className = className; // Nadaj mu odpowiednią klasę

        try {
            // Otocz zaznaczony fragment nowym spanem
            // Uwaga: surroundContents może rzucić błąd, jeśli zaznaczenie obejmuje
            // niepełne węzły blokowe lub jest nieciągłe w specyficzny sposób.
             range.surroundContents(span);

             // Po otoczeniu, zaznaczenie często znika, przywróćmy je (opcjonalne)
             selection.removeAllRanges();
             // selection.addRange(range); // Może nie działać zgodnie z oczekiwaniami po modyfikacji DOM

        } catch (e) {
            console.error("Błąd przy otaczaniu tekstu:", e);
            alert("Nie można zastosować formatowania do tego zaznaczenia. Spróbuj zaznaczyć mniejszy fragment lub tekst wewnątrz jednego akapitu.");
             // Alternatywnie, można spróbować wstawić znaczniki za pomocą execCommand, ale to mniej elastyczne:
             // document.execCommand('insertHTML', false, `<span class="${className}">${selectedText}</span>`);
             // To jednak zastąpi zaznaczenie, co może być problemem przy bardziej złożonym HTMLu.
        }
    }

    // --- Wstawianie emotikon ---
    emojiButtons.forEach(button => {
        button.addEventListener('click', () => {
             if (scriptContent.contentEditable !== "true") return;
            const emoji = button.textContent;
            // Wstawia emotikon w miejscu kursora lub zastępuje zaznaczenie
            document.execCommand('insertText', false, emoji);
        });
    });

    // --- Tryb nauki ---
    startLearningButton.addEventListener('click', () => {
        originalContentBeforeLearning = scriptContent.innerHTML; // Zapisz obecny stan
        scriptContent.contentEditable = "false"; // Wyłącz edycję w trybie nauki
        document.body.classList.add('learning-mode'); // Dodaj klasę do body dla styli CSS

        const myLines = scriptContent.querySelectorAll('.my-line');
        if (myLines.length === 0) {
            alert("Nie oznaczono żadnych 'Moich kwestii' do nauki. Użyj przycisku 'Moja kwestia'.");
            document.body.classList.remove('learning-mode');
            scriptContent.contentEditable = "true";
            return;
        }

        myLines.forEach(line => {
            const originalText = line.textContent.trim();
            // Zachowaj oryginalny tekst w ukrytym spanie
            const originalSpan = document.createElement('span');
            originalSpan.className = 'original-text';
            originalSpan.style.display = 'none'; // Ukryj go
            originalSpan.textContent = originalText;

            // Utwórz pole input do wpisania tekstu
            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'line-input';
            input.placeholder = 'Wpisz kwestię...';
            input.setAttribute('data-original', originalText.toLowerCase().trim()); // Zapisz oryginał (małe litery dla porównania)
            input.style.width = Math.max(100, originalText.length * 7) + 'px'; // Dopasuj szerokość

            // Wyczyść zawartość spana .my-line i dodaj input oraz ukryty oryginał
            line.innerHTML = '';
            line.appendChild(input);
            line.appendChild(originalSpan);
        });

        // Pokaż/ukryj odpowiednie przyciski
        startLearningButton.style.display = 'none';
        checkAnswersButton.style.display = 'inline-block';
        exitLearningButton.style.display = 'inline-block';
        scoreDisplay.style.display = 'none'; // Ukryj wynik na początku
    });

    checkAnswersButton.addEventListener('click', () => {
        const inputs = scriptContent.querySelectorAll('.my-line input.line-input');
        let correctCount = 0;
        let totalCount = inputs.length;

        inputs.forEach(input => {
            const enteredText = input.value.toLowerCase().trim();
            const originalText = input.getAttribute('data-original');
            input.classList.remove('correct', 'incorrect'); // Usuń poprzednie style

            if (enteredText === originalText) {
                input.classList.add('correct');
                correctCount++;
            } else {
                input.classList.add('incorrect');
                // Opcjonalnie: Pokaż poprawną odpowiedź po błędzie
                // const originalSpan = input.nextElementSibling;
                // if (originalSpan && originalSpan.classList.contains('original-text')) {
                //     input.value = `ŹLE (poprawnie: ${originalSpan.textContent})`;
                // }
            }
            input.disabled = true; // Zablokuj input po sprawdzeniu
        });

        // Wyświetl wynik
        scoreDisplay.textContent = `Wynik: ${correctCount} / ${totalCount} poprawnych odpowiedzi.`;
        scoreDisplay.style.display = 'block';
    });

    exitLearningButton.addEventListener('click', () => {
        scriptContent.innerHTML = originalContentBeforeLearning; // Przywróć stan sprzed nauki
        document.body.classList.remove('learning-mode'); // Usuń klasę CSS
        scriptContent.contentEditable = "true"; // Włącz edycję z powrotem

        // Pokaż/ukryj odpowiednie przyciski
        startLearningButton.style.display = 'inline-block';
        checkAnswersButton.style.display = 'none';
        exitLearningButton.style.display = 'none';
        scoreDisplay.style.display = 'none';

        // Upewnij się, że event listenery dla formatowania nadal działają (powinny, bo `scriptContent` jest przywracany)
    });

    // --- Zapisywanie i Wczytywanie Stanu (HTML) ---
    saveButton.addEventListener('click', () => {
        const htmlContent = scriptContent.innerHTML;
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        const timestamp = new Date().toISOString().slice(0, 19).replace('T', '_').replace(/:/g, '-');
        link.download = `scenariusz_stan_${timestamp}.html`; // Nazwa pliku do zapisu
        link.click();
        URL.revokeObjectURL(link.href); // Zwolnij zasób
    });

    // Ukryty input pliku HTML jest aktywowany przez przycisk 'Wczytaj stan'
    loadHtmlButton.addEventListener('click', () => {
        htmlFileInput.click(); // Kliknij ukryty input
    });

    htmlFileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file && file.type === "text/html") {
            const reader = new FileReader();
            reader.onload = (e) => {
                scriptContent.innerHTML = e.target.result;
                makeEditable(); // Upewnij się, że można edytować po wczytaniu stanu
                 // Dodatkowe sprawdzenie, czy nie jesteśmy w trybie nauki
                 if (document.body.classList.contains('learning-mode')) {
                     exitLearningButton.click(); // Bezpiecznie wyjdź z trybu nauki, jeśli był aktywny
                 }
            };
            reader.readAsText(file);
        } else {
            alert("Proszę wybrać plik HTML zapisany wcześniej przez aplikację.");
        }
        htmlFileInput.value = ''; // Reset inputu
    });

});
