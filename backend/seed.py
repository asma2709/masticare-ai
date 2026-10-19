import httpx as requests
import time

API_URL = "http://localhost:8000/api/v1/cows"

def seed_cows():
    try:
        response = requests.get(API_URL)
        if response.status_code == 200:
            existing_cows = response.json()
            if len(existing_cows) >= 30:
                print("Database already seeded with 30 or more cows.")
                return True
    except Exception as e:
        print(f"Could not connect to API: {e}")
        return False

    cows = [
        {"name": f"Cow {i}", "rfid": f"RFID-2026-{i*100}", "breed": "Holstein", "age": 4} for i in range(1, 31)
    ]

    success = True
    for cow in cows:
        try:
            response = requests.post(API_URL, json=cow)
            print(response.status_code, response.json())
            if response.status_code != 200:
                success = False
        except Exception as e:
            print(f"Error posting cow: {e}")
            success = False
    return success

if __name__ == "__main__":
    print("Starting database seed...")
    # Wait for backend to be ready
    for i in range(10):
        if seed_cows():
            break
        print("Retrying in 2 seconds...")
        time.sleep(2)
