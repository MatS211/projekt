from flask import Flask, render_template, request, redirect, jsonify
import mysql.connector
from mysql.connector import Error
from datetime import datetime
import calendar

app = Flask(__name__)

# konfiguracja polączenia

db_config = {
    'host': '192.168.1.21', 
    'user': 'root',       
    'password': '',  
    'database': 'projekt_pac'  
}

# połączenie z bazą
def get_db_connection():
    connection = mysql.connector.connect(**db_config)
    return connection

@app.route("/")
def info():
    connection = get_db_connection()
    cursor = connection.cursor()
    # do cewek 
    cursor.execute("SELECT * FROM coils")
    coils = cursor.fetchall()
    # do slownik
    cursor.execute("SELECT * from slownik")
    slownik = cursor.fetchall() 

    cursor.close()
    connection.close()
    return render_template("info.html", coils=coils, slownik = slownik)

# odczyty parametrów
@app.route("/odczyty")
def odczyty():
    connection = get_db_connection()
    cursor = connection.cursor()
    cursor.execute("SELECT NAZWA FROM slownik")
    parametry = cursor.fetchall()
    cursor.close()
    connection.close()
    return render_template("odczyty.html", parametry = parametry)

#odczyty cewek
@app.route("/odczyty_coili")
def odczyty_coili():
    connection = get_db_connection()
    cursor = connection.cursor()
    cursor.execute("SELECT nazwa_coila FROM coils")
    coils = cursor.fetchall()
    cursor.close()
    connection.close()
    return render_template("odczyty_coili.html", coils = coils)

from datetime import datetime

@app.route('/coil_daily_summary', methods=['POST'])
def coil_daily_summary():
    data = request.get_json()
    coil_name = data.get('coil_name')
    selected_date = data.get('date')

    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)

    # Pobieranie ID cewki na podstawie nazwy
    cursor.execute("SELECT Id_coila FROM coils WHERE nazwa_coila = %s", (coil_name,))
    coil = cursor.fetchone()

    if not coil:
        return jsonify({'status': 'error', 'message': 'Cewka o podanej nazwie nie istnieje.'})

    id_coila = coil['Id_coila']

    # Pobieranie odczyty dla wybranego dnia
    query = """
        SELECT status_coila, data_zapisu
        FROM odczyty_coili
        WHERE id_coila = %s AND DATE(data_zapisu) = %s
        ORDER BY data_zapisu
    """
    cursor.execute(query, (id_coila, selected_date))
    readings = cursor.fetchall()

    if not readings:
        return jsonify({'status': 'error', 'message': 'Brak odczytów dla wybranej daty.'})

    # Funkcja do formatowania daty
    def format_datetime(dt):
        return dt.strftime('%H:%M:%S') 

    today = datetime.today().date()
    is_today = selected_date == today.strftime('%Y-%m-%d')

    # Generowanie przedziałów czasowych
    summary = []
    current_status = "Włączona" if readings[0]['status_coila'] else "Wyłączona"
    start_time = readings[0]['data_zapisu']
    
    for i in range(1, len(readings)):
        status = "Włączona" if readings[i]['status_coila'] else "Wyłączona"
        # Zmiana statusu
        if status != current_status:
                summary.append({
                    'status': current_status,
                    'start_time': format_datetime(start_time),
                    'end_time': format_datetime(readings[i]['data_zapisu']),
                })
                current_status = status
                start_time = readings[i]['data_zapisu']

    # Dodanie ostatniego stanu do końca dnia
    if not is_today:
        end_time = f"{selected_date} 23:59:59"
        summary.append({
            'status': current_status,
            'start_time': format_datetime(start_time),
            'end_time': format_datetime(datetime.strptime(end_time, '%Y-%m-%d %H:%M:%S')),
        })
    else:
        # dzień dzisiejszy
        summary.append({
            'status': current_status,
            'start_time': format_datetime(start_time), 
            'end_time': format_datetime(datetime.now())  
        })
    return jsonify({'status': 'success', 'summary': summary})

@app.route('/api/dzien', methods=['POST'])
def odczyty_dzien():
    data = request.get_json()
    prad = data.get('prad')  # Nazwa parametru
    dzien = data.get('dzien')  # Wybrana data

    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)

    # Pobieranie ID parametru na podstawie nazwy
    cursor.execute("SELECT id_prad FROM slownik WHERE nazwa = %s", (prad,))
    parametr = cursor.fetchone()

    if not parametr:
        return jsonify({'status': 'error', 'message': 'Parametr o podanej nazwie nie istnieje.'})

    id_prad = parametr['id_prad']

    # Pobieranie odczytów dla danego dnia
    query = """
        SELECT 
            HOUR(data_zapisu) AS godzina,
            ROUND(AVG(wartosc), 2) AS srednia_wartosc
        FROM odczyty
        WHERE id_prad = %s AND DATE(data_zapisu) = %s
        GROUP BY godzina
        ORDER BY godzina
    """
    cursor.execute(query, (id_prad, dzien))
    readings = cursor.fetchall()

    cursor.close()
    connection.close()

    if not readings:
        return jsonify({'status': 'error', 'message': 'Brak odczytów dla wybranego dnia.'})

    return jsonify({'status': 'success', 'readings': readings})


@app.route('/api/miesiac', methods=['POST'])
def get_month_data():
    miesiac = request.json.get('miesiac')
    year, month = map(int, miesiac.split('-'))
    connection = get_db_connection()
    cursor = connection.cursor()
    # Kwerenda SQL z zamianą NULL na 0
    query = """
        SELECT 
            DAY(data_zapisu) AS dzien, 
            ROUND(IFNULL(AVG(wartosc), 0), 2) AS srednia_wartosc
        FROM odczyty
        WHERE YEAR(data_zapisu) = %s AND MONTH(data_zapisu) = %s
        GROUP BY dzien
    """
    cursor.execute(query, (year, month))
    data = cursor.fetchall()

    # Konwersja wyników na format JSON
    readings = [
        {"data_zapisu": f"{year}-{month:02d}-{dzien:02d}", "srednia_wartosc": srednia_wartosc}
        for dzien, srednia_wartosc in data
    ]

    return jsonify({"readings": readings})


@app.route('/api/godzina', methods=['POST'])
def odczyty_godzina():
    data = request.get_json()
    prad = data.get('prad')
    godzinaStart = data.get('godzinaStart')
    godzinaEnd = data.get('godzinaEnd')
    dzien = data.get('dzien')

    # godzina początkowa nie może być większa od godziny końcowej
    if godzinaStart >= godzinaEnd:
        return jsonify({'status': 'error', 'message': 'Godzina początkowa nie może być późniejsza niż godzina końcowa.'})

    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)

    cursor.execute("SELECT id_prad FROM slownik WHERE nazwa = %s", (prad,))
    parametr = cursor.fetchone()

    if not parametr:
        return jsonify({'status': 'error', 'message': 'Parametr o podanej nazwie nie istnieje.'})

    id_prad = parametr['id_prad']

    # Pobieranie odczytów dla danego przedziału godzin
    query = """
        SELECT wartosc, data_zapisu
        FROM odczyty
        WHERE id_prad = %s AND data_zapisu BETWEEN %s AND %s
        ORDER BY data_zapisu
    """
    start_datetime = f"{dzien} {godzinaStart}"
    end_datetime = f"{dzien} {godzinaEnd}"

    cursor.execute(query, (id_prad, start_datetime, end_datetime))
    readings = cursor.fetchall()

    cursor.close()
    connection.close()

    if not readings:
        return jsonify({'status': 'error', 'message': 'Brak odczytów w podanym przedziale godzin.'})

    return jsonify({'status': 'success', 'readings': readings})


@app.route('/api/przedzial-dni', methods=['POST'])
def odczyty_przedzial():
    data = request.get_json()
    prad = data.get('prad')
    dzienStart = data.get('dzienStart')
    dzienEnd = data.get('dzienEnd')

    # dzień początkowy nie może być późniejszy niż dzień końcowy
    if dzienStart > dzienEnd:
        return jsonify({'status': 'error', 'message': 'Dzień początkowy nie może być późniejszy niż dzień końcowy.'})

    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)

    cursor.execute("SELECT id_prad FROM slownik WHERE nazwa = %s", (prad,))
    parametr = cursor.fetchone()

    if not parametr:
        return jsonify({'status': 'error', 'message': 'Parametr o podanej nazwie nie istnieje.'})

    id_prad = parametr['id_prad']

    # Pobieranie odczytów dla wybranego przedziału dni
    query = """
        SELECT wartosc, data_zapisu
        FROM odczyty
        WHERE id_prad = %s AND DATE(data_zapisu) BETWEEN %s AND %s
        ORDER BY data_zapisu
    """
    cursor.execute(query, (id_prad, dzienStart, dzienEnd))
    readings = cursor.fetchall()

    cursor.close()
    connection.close()

    if not readings:
        return jsonify({'status': 'error', 'message': 'Brak odczytów w podanym przedziale dni.'})

    return jsonify({'status': 'success', 'readings': readings})


if __name__ == '__main__':
    app.run(host="0.0.0.0")