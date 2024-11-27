import mysql.connector

def fetch_data():
    try:
        connection = mysql.connector.connect(
            host="192.168.1.21",
            database="projekt_pac",
            user="root",
            password="",
            port=3306
        )
        if connection.is_connected():
            cursor = connection.cursor(dictionary=True)
            cursor.execute("SHOW TABLES;")
            tables = cursor.fetchall()
            print("Tabele w bazie danych:")
            for table in tables:
                print(table)
            
            cursor.execute("SELECT * FROM odczyty;")
            rows = cursor.fetchall()
            print("\nDane:")
            for row in rows:
                print(row)
    except mysql.connector.Error as e:
        print(f"Błąd połączenia: {e}")
    finally:
        if connection.is_connected():
            connection.close()

fetch_data()
