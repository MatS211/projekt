from pymodbus import ModbusException
from pymodbus.client import ModbusTcpClient
import json
import mysql.connector
import time
import logging

logging.basicConfig(
    level=logging.DEBUG,  #poziomu logowania (DEBUG, INFO, WARNING, ERROR, CRITICAL)
    format='%(asctime)s [%(levelname)s]  %(message)s',  # Format zapisu logów
    handlers=[
        logging.FileHandler('app.log', mode='w', encoding='utf-8'),
        logging.StreamHandler()
    ]
)

file = "config.json"
stream = open(file, 'r')
config = json.load(stream)

SERVER_HOST = config['SERVER_HOST']
SERVER_PORT = config['SERVER_PORT']
UNIT_ID = config['UNIT_ID']
floats = config['VARIABLES']['FLOATS']
coils = config['VARIABLES']['COILS']

# łączenie z bazą 
def connection_to_db():
    try:
        connection = mysql.connector.connect(
            host = "192.168.1.21",
            database = "projekt_pac",
            user = "root",
            password = ""
        )
        if connection.is_connected():
            logging.info("Połączono z bazą danych")
            return connection
    except Exception as e:
        logging.error(f"Błąd połączenia: {e}")
        return None
    
# dodawanie do  słownika
def insert_slownik(connection, nazwa, jednostka):
    try:
        cursor = connection.cursor()
        cursor.execute("SELECT id_prad FROM slownik WHERE nazwa = %s", (nazwa,))
        existing_record = cursor.fetchone()
        if existing_record:
            logging.warning(f"Rekord o nazwie - {nazwa} już istnieje w tej tabeli")
            id_prad = existing_record[0]  # pobieranie id parametu do odczytu
        else:
            sql_query = """
                INSERT INTO slownik(nazwa, jednostka)
                VALUES (%s, %s)
            """
            cursor.execute(sql_query, (nazwa, jednostka))
            connection.commit()
            id_prad = cursor.lastrowid  # pobieranie id parametu do odczytu
            logging.info(f"Dodano rekord w tabeli slownik: {nazwa}")
        
        return id_prad  # zwrócenie id parametru
    except mysql.connector.Error as e:
        logging.error(f"Błąd podczas wstawiania danych do tabeli slownik: {e}")
        return None
    finally:
        cursor.close()
 
# Dodawanie coili
def insert_coils(connection, nazwa_coila, Offset, Typ, Opis):
    try:
        cursor = connection.cursor()
        cursor.execute("SELECT * FROM coils WHERE nazwa_coila = %s AND Offset = %s", (nazwa_coila, Offset))
        existing_record = cursor.fetchone()
        if existing_record:
            logging.warning(f"Rekord o nazwie - {nazwa_coila} już istnieje w tabeli coils")
            id_coila = existing_record[0] #pobranie id coila do odczytu_coili
        else:
            cursor.execute("""
                INSERT INTO coils(nazwa_coila, Offset, Typ, Opis)
                VALUES (%s, %s, %s, %s)
            """, (nazwa_coila, Offset, Typ, Opis))
            connection.commit()
            id_coila = cursor.lastrowid
            logging.info(f"Dodano rekord w tabeli coils: {nazwa_coila}")
        
        return id_coila
    except mysql.connector.Error as e:
        logging.error(f"Błąd podczas wstawiania do tabeli coils: {e}")
    finally:
        cursor.close()

def insert_odczyty_coili(connection, id_coila, status_coila):
    try:
        cursor = connection.cursor()
        sql_query = "INSERT INTO odczyty_coili(id_coila, status_coila, data_zapisu) VALUES(%s,%s,NOW())"
        cursor.execute(sql_query, (id_coila, status_coila))
        connection.commit()
        logging.info(f"Dodano rekord w tabeli odczyty_coili: id_coila = {id_coila}, status_coila = {status_coila}")
    except mysql.connector.Error as e:
        logging.error(f"Błąd podczas wstawiania do tabeli odczyty_coili: {e}")
    finally:
        cursor.close()

# odczyt pliku json
def load_json_file(file_path):
    try:
        with open(file_path, 'r') as json_file:
            return json.load(json_file)
    except FileNotFoundError:
        logging.error(f"Plik {file_path} nie został znaleziony.")
        return None
    except json.JSONDecodeError:
        logging.error(f"Nieprawidłowy format JSON w pliku {file_path}.")
        return None

# odczytywanie coili
def process_coils(connection, coils, client, unit_id):
    for name, details in coils.items():
        try:
            offset = details["Offset"]
            typ = details["Typ"]
            opis = details["Opis"]
            logging.info(f"Odczyt COILS {name}: Offset = {offset}, Typ = {typ}")
            # Odczyt rejestru z Modbusa
            result = client.read_coils(offset, 1, unit_id)
            if not result.isError() and hasattr(result, 'bits') and result.bits:
                status = result.bits[0]
                logging.info(f"COIL {name} status: {status}")
                # Dodanie do tabeli coils
                id_coila = insert_coils(connection, nazwa_coila=name, Offset=offset, Typ=typ, Opis=opis)
                if id_coila:
                    # Zapisz status do tabeli odczytów
                    insert_odczyty_coili(connection, id_coila, status)
                else:
                    logging.error(f"Nie udało się zapisać COIL {name} do bazy danych.")
            else:
                logging.error(f"Błąd odczytu lub brak danych COILS {name}.")
        except Exception as e:
            logging.error(f"Błąd podczas przetwarzania COILS {name} (Offset: {offset}, Unit ID: {unit_id}): {e}")


# dodawanie odczytów
def insert_odczyty(connection, id_prad, wartosc):
    try:
        cursor = connection.cursor()
        sql_query = """
            INSERT INTO odczyty(id_prad, wartosc, data_zapisu)
            VALUES (%s, %s, NOW())
        """
        cursor.execute(sql_query, (id_prad, wartosc))
        connection.commit()
        logging.info(f"Dodano rekord w tabeli odczyty: id_prad = {id_prad}, wartosc = {wartosc}")
    except mysql.connector.Error as e:
        logging.error(f"Błąd podczas wstawiania do tabeli odczyty: {e}")
    finally:
        cursor.close()

# pobieranie floatów
def process_floats(connection, floats, client, unit_id):
    for group_name, group_values in floats.items():
        for var_name, details in group_values.items():
            try:
                offset = details["Offset"]
                jednostka = details["Jednostka"]
                logging.info(f"Odczyt FLOAT {group_name} -> {var_name}: Offset = {offset}, Jednostka = {jednostka}")
                # odczyt rejestru z Modbusa
                result = client.read_input_registers(offset, 1, slave=unit_id)
                if result.isError():
                    logging.error(f"Błąd odczytu FLOAT {group_name} -> {var_name}.")
                else:
                    wartosc = result.registers[0]  # odczyt to nowy rejestr
                    logging.info(f"Rejestr {var_name} odczytany: {wartosc}")                    
                    # dodanie do slownika i uzyskaj id_prad
                    id_prad = insert_slownik(connection, var_name, jednostka)
                    if id_prad:
                        # zapisz do tabeli odczyty
                        insert_odczyty(connection, id_prad, wartosc)
            except Exception as e:
                logging.error(f"Błąd podczas przetwarzania FLOAT {group_name} -> {var_name}: {e}")

# główna pętla
if __name__ == "__main__":
    config = load_json_file("config.json")
    if config:
        connection = connection_to_db()
        if connection:
            client = ModbusTcpClient(config["SERVER_HOST"], port=config["SERVER_PORT"])
            if client.connect():
                logging.info("Połączono z serwerem Modbus")

                while True:
                    process_floats(connection, config["VARIABLES"]["FLOATS"], client, config["UNIT_ID"])
                    process_coils(connection, config["VARIABLES"]["COILS"], client, config["UNIT_ID"])
                    logging.info("Oczekwianie na kolejny odczyt...")
                    time.sleep(60)  # Opóźnienie 1 min
            else:
                logging.error("Nie udało się połączyć z serwerem Modbus")
            connection.close()