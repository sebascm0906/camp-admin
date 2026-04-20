import sys
import psycopg2
from dotenv import load_dotenv
import os

load_dotenv(".env")
url = os.environ.get("DATABASE_URL")
if not url:
    print("No DATABASE_URL found.")
    sys.exit(1)

print(f"Connecting to: {url}")
try:
    conn = psycopg2.connect(url)
    print("Connected successfully!")
    conn.close()
except Exception as e:
    print(f"Error connecting: {e}")
