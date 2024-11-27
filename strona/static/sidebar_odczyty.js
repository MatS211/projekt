document.addEventListener('DOMContentLoaded', function () {
    let selectedPrad = null;
    let chartInstance = null;
    // Toggle dla sidebara
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const sidebar = document.getElementById('sidebar');
    sidebarToggle.addEventListener('click', () => {
        sidebar.style.left = sidebar.style.left === '0px' ? '-250px' : '0px';
    });

    // Obsługa kliknięcia w parametry sidebara
    document.querySelectorAll('.parametr').forEach(parametr => {
        parametr.addEventListener('click', function () {
            document.querySelectorAll('.opcje').forEach(opcje => opcje.style.display = 'none');
            const opcje = this.querySelector('.opcje');
            if (opcje.style.display === 'block') {
                opcje.style.display = 'none';
            } else {
                opcje.style.display = 'block';
            }
            selectedPrad = this.childNodes[0].nodeValue.trim();
            console.log(selectedPrad);
        });
    });

    // Obsługa kliknięcia na opcje
    document.querySelectorAll('.opcja').forEach(opcja => {
        opcja.addEventListener('click', function (e) {
            e.stopPropagation(); // Zapobiega wywołaniu zdarzenia na rodzicu
            handleOpcjaSelection(this.dataset.opcja); // Wywołanie funkcji do obsługi opcji
        });
    });

    // Funkcja do obsługi wybranej opcji
    function handleOpcjaSelection(nazwaOpcji) {
        const naglowek = document.getElementById('naglowek');
        const input = document.getElementById('input-data');
        const input2 = document.getElementById('input-data-2');
        const input3 = document.getElementById('input-data-3');
        const p = document.getElementById('czas');
        const p2 = document.getElementById('czas2');
        const submit = document.getElementById('submit');

        // Reset widoczności i ustawień formularza
        resetForm(naglowek, input, input2, input3, p, p2, submit);

        // Konfiguracja na podstawie wybranej opcji
        switch (nazwaOpcji) {
            case "dzien":
                configureForm("WYBIERZ DZIEŃ</br>" + selectedPrad + "</br>", "date", false, false, false, false);
                submit.addEventListener('click', () => sendDzienData(input.value)); // Funkcja dla "dzien"
                console.log(input.value);
                break;
            case "miesiac":
                configureForm("WYBIERZ MIESIĄC</br>" + selectedPrad + "</br>", "month", false, false, false);
                submit.addEventListener('click', () => sendMiesiacData(input.value)); // Funkcja dla "miesiac"
                console.log(input.value);
                break;
            case "rok":
                configureForm("WYBIERZ ROK</br>" + selectedPrad + "</br>", "number", false, false, false);
                input.min = "2024";
                input.max = "2025";
                submit.addEventListener('click', () => sendRokData(input.value)); // Funkcja dla "rok"
                console.log(input.value);
                break;
            case "godzina":
                configureForm("WYBIERZ DZIEŃ I PRZEDZIAŁ GODZIN</br>" + selectedPrad + "</br>", "time", true, true, true, "Godzina początkowa: ", "Godzina końcowa: ");
                submit.addEventListener('click', () => sendGodzinaData(input.value, input2.value, input3.value)); // Funkcja dla "godzina"
                console.log(input.value);
                console.log(input2.value);
                console.log(input3.value);
                break;
            case "przedzial-dni":
                configureForm("WYBIERZ PRZEDZIAŁ DNI</br>" + selectedPrad + "</br>", "date", true, false, true, "Dzień początkowy", "Dzień końcowy");
                submit.addEventListener('click', () => sendPrzedzialDniData(input.value, input2.value)); // Funkcja dla "przedzial-dni"
                console.log(input.value);
                console.log(input2.value);
                break;
            default:
                naglowek.textContent = "BŁĄD";
                naglowek.style.display = 'inline';
        }

        // Funkcja do usuwania poprzedniego wykresu
        function clearPreviousChart() {
            const ctx = document.getElementById('wykres').getContext('2d');
            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);  // Usuwa poprzedni wykres    
        }

        // Funkcje do wysyłania danych do Flask

        function sendDzienData(dzien) {
            clearPreviousChart();
            fetch('/api/dzien', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ prad: selectedPrad, dzien: dzien })
            })
            .then(response => response.json())
            .then(data => {
                console.log('Dane dla dnia:', dzien);
        
                const labels = [];
                const values = Array(24).fill(0); // 24 godziny, domyślnie 0
            
                // Ustawienie danych z API
                data.readings.forEach(reading => {
                    const godzina = reading.godzina; 
                    const wartosc = reading.srednia_wartosc; 
                    
                    labels[godzina] = `${godzina}:00`; 
                    values[godzina] = wartosc; 
                });
        
                // Wypełnienie brakujących godzin
                for (let i = 0; i < 24; i++) {
                    if (!labels[i]) {
                        labels[i] = `${i}:00`;
                    }
                }
        
                // Rysowanie wykresu
                const ctx = document.getElementById('wykres').getContext('2d');
                new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: labels, // Etykiety (godziny)
                        datasets: [{
                            label: `Wykres dla dnia ${dzien}`, // Tytuł wykresu
                            data: values, // Wartości
                            borderColor: 'rgba(75, 192, 192, 1)',
                            backgroundColor: 'rgba(75, 192, 192, 0.2)',
                            fill: false,
                            tension: 0.1
                        }]
                    },
                    options: {
                        responsive: false,
                        plugins: {
                            tooltip: {
                                enabled: true,  // Włącza tooltip (chumra przy kropce)
                                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                                titleColor: 'black', 
                                bodyColor: 'black', 
                                borderColor: 'rgba(75, 192, 192, 1)', 
                                borderWidth: 1, 
                                displayColors: false, 
                                callbacks: {
                                    title: function(tooltipItem) {
                                        const godzina = tooltipItem[0].label;
                                        return `Data: ${dzien} godzina: ${godzina}`;
                                    },
                                    label: function(tooltipItem) {
                                        return `Wartość: ${tooltipItem.raw}`;
                                    }
                                }
                            },
                            annotation: {
                                annotations: {
                                    line1: {
                                        type: 'line',
                                        yMin: 10,
                                        yMax: 10,
                                        borderColor: 'red',  
                                        borderWidth: 2,      
                                        label: {
                                            content: 'Dolny zakres standardowy',
                                            enabled: true,
                                            position: 'right'
                                        }
                                    },
                                    line2: {
                                        type: 'line',
                                        yMin: 20,
                                        yMax: 20,
                                        borderColor: 'blue',
                                        borderWidth: 2,
                                        label: {
                                            content: 'Górny zakres standardowy',
                                            enabled: true,
                                            position: 'right'
                                        }
                                    }
                                }
                            }
                        },
                        scales: {
                            x: {
                                beginAtZero: true,
                                title: {
                                    display: true,
                                    text: 'Godzina'
                                }
                            },
                            y: {
                                beginAtZero: true,
                                title: {
                                    display: true,
                                    text: 'Wartość'
                                }
                            }
                        }
                    }
                });
            })
            .catch(error => console.error('Błąd:', error));
        }   
        
        
        function sendMiesiacData(miesiac) {
            clearPreviousChart();
            fetch('/api/miesiac', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ prad: selectedPrad, miesiac: miesiac })
            })
            .then(response => response.json())
            .then(data => {
                console.log('Dane dla miesiąca:', data);
        
                const { labels, values } = przetworzDaneDlaMiesiaca(data.readings, miesiac);
                
                // Funkcja rysująca wykres
                const ctx = document.getElementById('wykres').getContext('2d');
                new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: labels,
                        datasets: [{
                            label: `Wykres dla miesiąca ${miesiac}`,
                            data: values,
                            borderColor: 'rgba(75, 192, 192, 1)',
                            backgroundColor: 'rgba(75, 192, 192, 0.2)',
                            fill: false,
                            tension: 0.1
                        }]
                    },
                    options: {
                        responsive: true,
                        plugins: {
                            tooltip: {
                                enabled: true,
                                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                                titleColor: 'black',
                                bodyColor: 'black',
                                borderColor: 'rgba(75, 192, 192, 1)',
                                borderWidth: 1,
                                displayColors: false,
                                callbacks: {
                                    title: function(tooltipItem) {
                                        return `Dzień: ${tooltipItem[0].label}`;
                                    },
                                    label: function(tooltipItem) {
                                        return `Średnia wartość: ${tooltipItem.raw}`;
                                    }
                                }
                            }
                        },
                        scales: {
                            x: {
                                title: {
                                    display: true,
                                    text: 'Dzień'
                                }
                            },
                            y: {
                                title: {
                                    display: true,
                                    text: 'Średnia wartość'
                                }
                            }
                        }
                    }
                });
            })
            .catch(error => console.error('Błąd:', error));
        }
        
        function przetworzDaneDlaMiesiaca(readings, miesiac) {
            const [year, month] = miesiac.split('-');  // Podział na rok i miesiąc
            const daysInMonth = new Date(year, month, 0).getDate();  // Liczba dni w miesiącu
        
            const labels = Array.from({ length: daysInMonth }, (_, i) => i + 1);  // Wszystkie dni miesiąca
            const values = Array(daysInMonth).fill(0);  // Domyślnie wartości 0 dla wszystkich dni
        
            // Przetwarzanie danych z API i przypisywanie wartości do odpowiednich dni
            readings.forEach(reading => {
                const date = new Date(reading.data_zapisu);  // Parsowanie daty z odczytu
                const day = date.getDate();  // Dzień odczytu
        
                // Przypisanie wartości do odpowiedniego indeksu (dzień - 1)
                values[day - 1] = reading.srednia_wartosc;
            });
        
            return { labels, values };
        }
        // POPRAW ŻEBY SIĘ 0 NA INNYCH MIESIĄCACH POKAZYWAŁO
        function sendRokData(rok) { 
            fetch('/api/rok', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ prad: selectedPrad, rok: rok })
            })
            .then(response => response.json())
            .then(data => { 
                console.log('Dane dla roku:', data);
        
                // Przetwarzanie danych
                const labels = data.readings.map(item => `Miesiąc ${item.miesiac}`);
                const values = data.readings.map(item => item.srednia);
        
                // Tworzenie wykresu
                const ctx = document.getElementById('wykres').getContext('2d');
                new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: labels,
                        datasets: [{
                            label: `Średnia wartość dla roku ${rok}`,
                            data: values,
                            borderColor: 'rgba(75, 192, 192, 1)',
                            backgroundColor: 'rgba(75, 192, 192, 0.2)',
                            borderWidth: 2,
                            tension: 0.4
                        }]
                    },
                    options: {
                        responsive: true,
                        plugins: {
                            legend: {
                                display: true
                            },
                            title: {
                                display: true,
                                text: `Wykres dla roku ${rok}`
                            }
                        },
                        scales: {
                            x: {
                                beginAtZero: true
                            },
                            y: {
                                beginAtZero: true
                            }
                        }
                    }
                });
            })
            .catch(error => console.error('Błąd:', error));
        }
        

        function sendPrzedzialDniData(dzienStart, dzienEnd) {
            fetch('/api/przedzial-dni', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ prad: selectedPrad, dzienStart: dzienStart, dzienEnd: dzienEnd })
            }).then(response => response.json())
              .then(data => {
                console.log('Dane dla przedziału dni:', data);
                const { labels, values } = przetworzDaneDlaWykresu(data.readings);
            
                rysujWykres(labels, values, `Wykres dla dni od ${dzienStart} do ${dzienEnd}`);
            })
              .catch(error => console.error('Błąd:', error));
        }
    }

    function przetworzDaneDlaWykresu(readings) {
        const labels = readings.map(reading => new Date(reading.data_zapisu).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' }));
        const values = readings.map(reading => reading.wartosc);
        return { labels, values };
    }
    

    // Reset widoczność i wartości
    function resetForm(naglowek, input, input2, input3, p, p2, submit) {
        naglowek.style.display = 'none';
        input.style.display = 'none';
        input2.style.display = 'none';
        input3.style.display = 'none';
        p.style.display = 'none';
        p2.style.display = 'none';
        submit.style.display = 'none';
    }
    

    // Konfiguracja widoczność i ustawienia 
    function configureForm(headerText, inputType, showInput2, showInput3, showLabels, label1 = "", label2 = "") {
        const naglowek = document.getElementById('naglowek');
        const input = document.getElementById('input-data');
        const input2 = document.getElementById('input-data-2');
        const input3 = document.getElementById('input-data-3');
        const p = document.getElementById('czas');
        const p2 = document.getElementById('czas2');
        const submit = document.getElementById('submit');

        naglowek.innerHTML = headerText;
        naglowek.style.display = 'inline';
        input.type = inputType;
        input.style.display = 'inline';
        if (showInput2) {
            input2.type = inputType;
            input2.style.display = 'inline';
        }
        if(showInput3){
            input3.type = "date";
            input3.style.display = 'inline';
        }
        if (showLabels) {
            p.textContent = label1;
            p2.textContent = label2;
            p.style.display = 'inline';
            p2.style.display = 'inline';
        }
        submit.style.display = 'inline';
    }
    // do wywalenia
    function rysujWykres(labels, data, tytul) {
        const ctx = document.getElementById('wykres').getContext('2d');
        // Usunięcie istniejącego wykresu (jeśli istnieje)
        if (window.mojWykres) {
            window.mojWykres.destroy();
        }
    
        // Tworzenie nowego wykresu
        window.mojWykres = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels, // Oś X
                datasets: [{
                    label: tytul,
                    data: data, // Oś Y
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 2,
                    fill: false,
                    tension: 0.1 // Wygląd linii
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    tooltip: {
                        enabled: true
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Zakres'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Wartości'
                        }
                    }
                }
            }
        });
    
        // Pokazanie wykresu
        document.getElementById('wykres').style.display = 'block';
    }
    
    
    // function fetchData(url, options = {}) {
    //     showSpinner(); // Pokaż spinner przed rozpoczęciem fetch
    //     return fetch(url, options)
    //         .then(response => {
    //             if (!response.ok) {
    //                 throw new Error(`HTTP error! status: ${response.status}`);
    //             }
    //             return response.json();
    //         })
    //         .catch(error => {
    //             console.error('Błąd:', error);
    //         })
    //         .finally(() => {
    //             hideSpinner(); // Ukryj spinner po zakończeniu fetch
    //         });
    // }
    
    // function showSpinner() {
    //     document.getElementById('spinner').style.display = 'flex';
    // }
    
    // function hideSpinner() {
    //     document.getElementById('spinner').style.display = 'none';
    // }
    
});
