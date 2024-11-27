document.addEventListener('DOMContentLoaded', function () {
    const inputDate = document.getElementById('input-data');
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const sidebar = document.getElementById('sidebar');
    const tableContainer = document.getElementById('zestawienie-dzienne');

    let selectedCoil = null;
    let dataTable = null;
    sidebarToggle.addEventListener('click', function () {
        if (sidebar.style.left === '0px') {
            sidebar.style.left = '-250px'; // Ukrycie sidebara
        } else {
            sidebar.style.left = '0px'; // Pokazanie sidebara
        }

    });

    // Obsługuje kliknięcia w parametry w sidebarze
    const parametry = document.querySelectorAll('.parametr');
    parametry.forEach(parametr => {
        parametr.addEventListener('click', function() {
            tableContainer.style.display = 'none';
            inputDate.value = '';
            if(dataTable){
                dataTable.clear().draw();
            }
            // Ukrywa/wyświetla opcje związane z parametrem
            document.querySelectorAll('.opcje').forEach(opcje => {
                if (opcje !== this.querySelector('.opcje')) {
                    opcje.classList.add('ukryty');
                    opcje.classList.remove('widoczny');
                }
            });
    
            const opcje = this.querySelector('.opcje');
            if (opcje.classList.contains('ukryty')) {
                opcje.classList.remove('ukryty');
                opcje.classList.add('widoczny');
            } else {
                opcje.classList.remove('widoczny');
                opcje.classList.add('ukryty');
            }

            // Pobieranie nazwy SAMEJ cewki
            selectedCoil = this.childNodes[0].nodeValue.trim();
        });
    });

    document.querySelectorAll('.opcja').forEach(opcja => {
        opcja.addEventListener('click', function (e) {
            e.stopPropagation();
            const nazwaOpcji = this.dataset.opcja;
            const naglowek = document.getElementById('naglowek');
            const input = document.getElementById('input-data');
            const p = document.getElementById('czas');
            const submit = document.getElementById('submit');

            if (nazwaOpcji == "zestawienie dzienne") {
                naglowek.innerHTML = "DZIENNE ZESTAWIENIE </br>" + selectedCoil;
                naglowek.style.display = 'inline';
                submit.style.display = 'inline';
                input.type = "date";
                input.style.display = 'inline';
                
                flatpickr(input, {
                    dateFormat: "Y-m-d",
                    minDate: "2024-11-19",
                    maxDate: "today", //ograniczenie do dzisiaj
                    locale: "pl",
                });
            } else {
                naglowek.innerHTML = "BŁĄD";
                naglowek.style.display = 'inline';
                p.style.display = 'none';
            }
        });
    });

    // Obsługuje kliknięcie przycisku POKAŻ
    document.getElementById('submit').addEventListener('click', function () {
        const dateInput = document.getElementById('input-data').value;
        const coilName = selectedCoil;
        console.log(selectedCoil);
        console.log(dateInput);
        
        if (dateInput && coilName) {
            fetch('/coil_daily_summary', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ coil_name: coilName, date: dateInput }),
            })
            .then(response => response.json())
            .then(data => {
                tableContainer.style.display = 'block';
                // DataTable
                if(!dataTable){
                    dataTable = $('#myTable3').DataTable({
                    paging: true,         
                    searching: true,       
                    ordering: true,        
                    info: true,            
                    destroy: true,
                    order: [[1, 'asc']],
                    language: {
                        url: "//cdn.datatables.net/plug-ins/1.13.4/i18n/pl.json"
                    }
                   });
                }else{
                    dataTable.clear();
                }

                if (data.status === 'success') {
                    data.summary.forEach(entry => {
                        dataTable.row.add([
                            entry.status,
                            entry.start_time,
                            entry.end_time
                        ]).draw();
                    });
                } else {
                    alert(data.message || 'Brak wyników');
                }
            })
            .catch(error => {
                console.error('Błąd:', error);
            });
        } else {
            alert('Proszę wybrać datę i cewkę.');
        }
    });    
});
