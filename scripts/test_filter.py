import httpx
r = httpx.post("http://localhost:8000/auth/login", json={"email": "shivamshah200408@gmail.com", "password": "Shiv@m018"}, timeout=10)
token = r.json()["access_token"]
h = {"Authorization": f"Bearer {token}"}

def check(label, params):
    r = httpx.get("http://localhost:8000/transactions", params={**params, "limit": 100}, headers=h, timeout=10)
    txs = r.json()["transactions"]
    years = sorted(set(t["transaction_date"][:4] for t in txs))
    print(f"{label:30s} -> {len(txs)} txns, years={years}")

check("No filter (all)", {})
check("Year=2025 (all months)", {"year": 2025})
check("Year=2025 Month=3", {"year": 2025, "month": 3})
check("Year=2026 (all months)", {"year": 2026})
