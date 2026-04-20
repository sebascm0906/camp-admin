import sys
import psycopg2
from dotenv import load_dotenv
import os

print(f"Connecting to raw params...")
try:
    conn = psycopg2.connect(
        host="127.0.0.1",
        port=5433,
        user="campconnect_app",
        password="o&X%VCbcMFRfU&",
        dbname="campconnect"
    )
    print("Connected successfully!")
    conn.close()
except Exception as e:
    print(f"Error connecting: {e}")
