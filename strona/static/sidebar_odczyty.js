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
                input.value = "";
                configureForm("WYBIERZ DZIEŃ</br>" + selectedPrad + "</br>", "text", false, false, false, false);
                submit.addEventListener('click', () => sendDzienData(input.value)); // Funkcja dla "dzien"
                flatpickr(input, { 
                    dateFormat: "Y-m-d",
                    minDate: "2024-11-18",
                    maxDate: "today",
                    locale: "pl",
                    disableMobile: true // Wymuszenie używania kalendarza
                });
                break;
            case "miesiac":
                input.value = "";
                configureForm("WYBIERZ MIESIĄC</br>" + selectedPrad + "</br>", "text", false, false, false);
                submit.addEventListener('click', () => sendMiesiacData(input.value)); // Funkcja dla "miesiac"
                flatpickr(input, { 
                    dateFormat: "Y-m",
                    minDate: "2024-11",
                    maxDate: "today",
                    locale: "pl",
                    disableMobile: true // Wymuszenie używania kalendarza
                });
                break;
            case "rok":
                input.value = "";
                configureForm("WYBIERZ ROK</br>" + selectedPrad + "</br>", "text", false, false, false);
                submit.addEventListener('click', () => sendRokData(input.value)); // Funkcja dla "rok"
                flatpickr(input, { 
                    dateFormat: "Y",
                    minDate: "2024",
                    maxDate: "today",
                    locale: "pl",
                    disableMobile: true // Wymuszenie używania kalendarza
                });
                break;
            case "godzina":
                input.value = "";
                input2.value = "";
                input3.value - "";
                configureForm("WYBIERZ DZIEŃ I PRZEDZIAŁ GODZIN</br>" + selectedPrad + "</br>", "text", true, true, true, "Godzina początkowa: ", "Godzina końcowa: ");
                submit.addEventListener('click', () => sendGodzinaData(input.value, input2.value, input3.value)); // Funkcja dla "godzina"
                flatpickr(input, { 
                    dateFormat: "H:i",
                    enableTime: true,
                    noCalendar: true,
                    locale: "pl",
                    disableMobile: true // Wymuszenie używania kalendarza
                });
                flatpickr(input2, { 
                    dateFormat: "H:i",
                    enableTime: true,
                    noCalendar: true,
                    locale: "pl",
                    disableMobile: true // Wymuszenie używania kalendarza
                });
                flatpickr(input3, { 
                    dateFormat: "Y-m-d",
                    minDate: "2024-11-18",
                    maxDate: "today",
                    locale: "pl",
                    disableMobile: true // Wymuszenie używania kalendarza
                });
                break;
            case "przedzial-dni":
                input.value="";
                input2.value = "";
                configureForm("WYBIERZ PRZEDZIAŁ DNI</br>" + selectedPrad + "</br>", "text", true, false, true, "Dzień początkowy", "Dzień końcowy");
                submit.addEventListener('click', () => sendPrzedzialDniData(input.value, input2.value)); // Funkcja dla "przedzial-dni"
                flatpickr(input, { 
                    dateFormat: "Y-m-d",
                    minDate: "2024-11-18",
                    maxDate: "today",
                    locale: "pl",
                    disableMobile: true // Wymuszenie używania kalendarza
                });
                flatpickr(input2, { 
                    dateFormat: "Y-m-d",
                    minDate: "2024-11-18",
                    maxDate: "today",
                    locale: "pl",
                    disableMobile: true // Wymuszenie używania kalendarza
                });
                break;
            default:
                naglowek.textContent = "BŁĄD";
                naglowek.style.display = 'inline';
        }

        // Funkcje do wysyłania danych do Flask

        function sendDzienData(dzien) {
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
                
                if (chartInstance) {
                    chartInstance.destroy();
                } 

                // Rysowanie wykresu
                const ctx = document.getElementById('wykres').getContext('2d');
                chartInstance = new Chart(ctx, {
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
                                        yMin: limit_min(),
                                        yMax: limit_min(),
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
                                        yMin: limit_max(),
                                        yMax: limit_max(),
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
                
                if (chartInstance) {
                    chartInstance.destroy();
                } 

                // Funkcja rysująca wykres
                const ctx = document.getElementById('wykres').getContext('2d');
                chartInstance = new Chart(ctx, {
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
                        },
                        annotation: {
                            annotations: {
                                line1: {
                                    type: 'line',
                                    yMin: limit_min(),
                                    yMax: limit_min(),
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
                                    yMin: limit_max(),
                                    yMax: limit_max(),
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
                const date = new Date(reading.data_zapisu);
                const day = date.getDate();
        
                // Przypisanie wartości do odpowiedniego indeksu (dzień - 1)
                values[day - 1] = reading.srednia_wartosc;
            });
        
            return { labels, values };
        }

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
                const labels = data.readings.map(item => `${rok}-${item.miesiac}`);
                const values = data.readings.map(item => item.srednia);
                
                if (chartInstance) {
                    chartInstance.destroy();
                } 

                // Tworzenie wykresu
                const ctx = document.getElementById('wykres').getContext('2d');
                chartInstance = new Chart(ctx, {
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
                        },
                        annotation: {
                            annotations: {
                                line1: {
                                    type: 'line',
                                    yMin: limit_min(),
                                    yMax: limit_min(),
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
                                    yMin: limit_max(),
                                    yMax: limit_max(),
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
                    }
                });
            })
            .catch(error => console.error('Błąd:', error));
        }

        function sendGodzinaData(godzinaStart, godzinaEnd, dzien) {
            if (godzinaStart >= godzinaEnd) {
                console.error('Godzina początkowa nie może być późniejsza niż godzina końcowa.');
                return;
            }
            // Wysyłanie żądania do API
            fetch('/api/godzina', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    prad: selectedPrad,
                    dzien: dzien,
                    godzinaStart: godzinaStart,
                    godzinaEnd: godzinaEnd
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.status === 'error') {
                    console.error('Błąd:', data.message);
                    return;
                }
        
                console.log('Dane dla przedziału godzinowego:', data.readings);
                
                // Przetwarzanie danych 
                const labels = generateTimeLabels(godzinaStart, godzinaEnd);

                const values = data.readings.map(item => item.wartosc);
               
                if (chartInstance) {
                    chartInstance.destroy();
                }
        
                const ctx = document.getElementById('wykres').getContext('2d');
                chartInstance = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: labels,
                        datasets: [{
                            label: `Wartości w przedziale godzinowym (${godzinaStart} - ${godzinaEnd})`,
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
                                text: `Wykres dla przedziału godzinowego ${godzinaStart} - ${godzinaEnd}`
                            }
                        },
                        scales: {
                            x: {
                                beginAtZero: true,
                                title: {
                                    display: true,
                                    text: 'Czas'
                                }
                            },
                            y: {
                                beginAtZero: true,
                                title: {
                                    display: true,
                                    text: 'Wartość'
                                }
                            }
                        },
                        annotation: {
                            annotations: {
                                line1: {
                                    type: 'line',
                                    yMin: limit_min(),
                                    yMax: limit_min(),
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
                                    yMin: limit_max(),
                                    yMax: limit_max(),
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
                    }
                });
            })
            .catch(error => console.error('Błąd:', error));
        }
        


        function generateTimeLabels(godzinaStart, godzinaEnd) {
            // Zamiana godzin na obiekty Date
            const startDate = new Date(`2024-11-28T${godzinaStart}:00`);
            const endDate = new Date(`2024-11-28T${godzinaEnd}:00`);
            
            // Obliczenie różnicy
            const timeDifference = (endDate - startDate) / (1000 * 60);

            let interval;
            if (timeDifference <= 60) {
                interval = 2; // Dla 1 godziny
            } else {
                // Zwiększamy interwał o 3 minuty na każdy dodatkowy przedział 60 minut
                interval = 2 + Math.floor(timeDifference / 60) * 3;
            
                if (interval > 45) {
                    interval = 45;
                }
            }
        
            
            const labels = [];
            let currentTime = startDate;
            
            while (currentTime <= endDate) {
                labels.push(currentTime.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' }));
                currentTime = new Date(currentTime.getTime() + interval * 60 * 1000);
            }
        
            return labels;
        }

        
        function aggregateData(data, aggregationMethod = 'average') {
            const aggregatedData = [];
            const aggregatedLabels = [];
            let sum = 0;
            let count = 0;
            let min = Number.MAX_VALUE;
            let max = -Number.MAX_VALUE;
        
            // Grupowanie danych w przedziały dni
            for (let i = 0; i < data.length; i++) {
                sum += data[i].wartosc;
                min = Math.min(min, data[i].wartosc);
                max = Math.max(max, data[i].wartosc);
                count++;
        
                // Każdy punkt danych reprezentuje jeden dzień
                if (i === data.length - 1 || new Date(data[i].data_zapisu).getDate() !== new Date(data[i+1].data_zapisu).getDate()) {
                    // Obliczanie agregacji
                    if (aggregationMethod === 'average') {
                        aggregatedData.push(sum / count);
                    } else if (aggregationMethod === 'max') {
                        aggregatedData.push(max);
                    } else if (aggregationMethod === 'min') {
                        aggregatedData.push(min);
                    }
        
                    // Dodajemy etykietę (np. datę)
                    aggregatedLabels.push(new Date(data[i].data_zapisu).toLocaleDateString('pl-PL'));
        
                    sum = 0;
                    count = 0;
                    min = Number.MAX_VALUE;
                    max = -Number.MAX_VALUE;
                }
            }
        
            return { labels: aggregatedLabels, data: aggregatedData };
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
                const { labels, data: aggregatedValues } = aggregateData(data.readings, 'average');
                if (chartInstance) {
                    chartInstance.destroy();
                }                

                const ctx = document.getElementById('wykres').getContext('2d');
                chartInstance = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: labels,
                        datasets: [{
                            label: `Wartości w przedziale dni od (${dzienStart} do ${dzienEnd})`,
                            data: aggregatedValues,
                            borderColor: 'rgba(75, 192, 192, 1)',
                            backgroundColor: 'rgba(75, 192, 192, 0.2)',
                            borderWidth: 2,
                            tension: 0.4
                        }]
                    },
                    options: {
                        responsive: true,
                        plugins: {
                            zoom: {
                                pan: {
                                    enabled: true,
                                    mode: 'xy', // Przesuwanie w obu kierunkach
                                },
                                zoom: {
                                    wheel: {
                                        enabled: true, //zoomowanie za pomocą kółka myszy
                                        speed: 0.1
                                    },
                                    drag: {
                                        enabled: true, //zoomowanie za pomocą przeciągania
                                    },
                                    pinch: {
                                        enabled: true, //zoomowanie za pomocą gestów
                                    }
                                },
                            },
                            legend: {
                                display: true
                            },
                            title: {
                                display: true,
                                text: `Wykres dla przedziału dni od ${dzienStart} - ${dzienEnd}`
                            }
                        },
                        scales: {
                            x: {
                                beginAtZero: true,
                                title: {
                                    display: true,
                                    text: 'Czas'
                                }
                            },
                            y: {
                                beginAtZero: true,
                                title: {
                                    display: true,
                                    text: 'Wartość'
                                }
                            }
                        },
                        annotation: {
                            annotations: {
                                line1: {
                                    type: 'line',
                                    yMin: limit_min(),
                                    yMax: limit_min(),
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
                                    yMin: limit_max(),
                                    yMax: limit_max(),
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
                    }
                });
            })
            .catch(error => console.error('Błąd:', error));;
        }
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
    
    // napraw to
    function limit_max() {
        console.log("limit_max");
        if (selectedPrad === "L1" || selectedPrad === "L2" || selectedPrad === "L3") {
            return 20;
        } else if (selectedPrad === "N" || selectedPrad === "Asymetria") {
            return 5;
        } else if (selectedPrad === "Czestotliwosc sieci") {
            return 50;
        }
        return null; // Zwróć null, jeśli brak dopasowania
    }
    
    function limit_min() {        
        console.log("limit_min");
        if (selectedPrad === "L1" || selectedPrad === "L2" || selectedPrad === "L3") {
            return 10;
        } else if (selectedPrad === "N" || selectedPrad === "Asymetria") {
            return 0;
        } else if (selectedPrad === "Czestotliwosc sieci") {
            return 50;
        }
        return null; 
    }
    
    
    function fetchData(url, options = {}) {
        showSpinner(); //spinner przed rozpoczęciem fetch
        return fetch(url, options)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                // sprawdzanie, czy odpowiedź jest w formacie JSON
                const contentType = response.headers.get('Content-Type');
                if (contentType && contentType.includes('application/json')) {
                    return response.json();
                } else {
                    throw new Error('Odpowiedź nie jest w formacie JSON');
                }
            })
            .catch(error => {
                console.error('Błąd:', error);
            })
            .finally(() => {
                hideSpinner(); // spinner po zakończeniu fetch
            });
    }
    
    
    
    function showSpinner() {
        document.getElementById('spinner').style.display = 'flex';
    }
    
    function hideSpinner() {
        document.getElementById('spinner').style.display = 'none';
    }
    
});
