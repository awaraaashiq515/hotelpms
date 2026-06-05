import sqlite3

conn = sqlite3.connect("/Users/ritchie/Desktop/live website /posendwebsite/prisma/dev.db")
cursor = conn.cursor()

# Get table names
cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
tables = cursor.fetchall()
print("Tables:", [t[0] for t in tables])

# Inspect Products or Scans if they exist
for table in tables:
    table_name = table[0]
    if "product" in table_name.lower() or "scan" in table_name.lower():
        print(f"\n--- Table: {table_name} ---")
        try:
            cursor.execute(f"PRAGMA table_info({table_name});")
            columns = cursor.fetchall()
            print("Columns:", [c[1] for c in columns])
            
            cursor.execute(f"SELECT COUNT(*) FROM {table_name};")
            count = cursor.fetchone()[0]
            print(f"Total rows: {count}")
            
            cursor.execute(f"SELECT * FROM {table_name} LIMIT 3;")
            rows = cursor.fetchall()
            for r in rows:
                print(r)
        except Exception as e:
            print(f"Error inspecting {table_name}: {e}")

conn.close()
