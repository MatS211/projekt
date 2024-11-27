from pymodbus.client import ModbusTcpClient
import json
file = "config.json"
stream = open(file, 'r')
config = json.load(stream)

SERVER_HOST = config['SERVER_HOST']
SERVER_PORT = config['SERVER_PORT']
UNIT_ID = config['UNIT_ID']
floats = config['VARIABLES']['FLOATS']
coils = config['VARIABLES']['COILS']

def read_modbus_data():
    # Odczytuje dane z urządzenia Modbus TCP.

    # Konfiguracja klienta Modbus TCP
    client = ModbusTcpClient(host = SERVER_HOST,port = SERVER_PORT)

    try:
        # Połączenie z urządzeniem
        client.connect()

        # Odczyt jednego rejestru (funkcja 3 - Read Holding Registers)
        # result = client.read_input_registers(0) - do rejestru
        result = client.read_coils(0, 6)

        # Sprawdzenie, czy odczyt się powiódł
        if not result.isError():
            # Wyświetlenie wartości rejestru
            # print(f"Wartość rejestru: {result.registers[0]}")
            print(f"Wartości coili: {result.bits}")
        else:
            # Wyświetlenie błędu
            print(f"Błąd odczytu: {result}")

    finally:
        # Zamknięcie połączenia
        client.close()
        


if __name__ == "__main__":
    read_modbus_data()