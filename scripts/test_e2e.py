"""End-to-end test of finsightwebapp API."""
import httpx

BASE = "http://localhost:8000"

# Login
r = httpx.post(f"{BASE}/auth/login", json={"email": "shivamshah200408@gmail.com", "password": "Shiv@m018"}, timeout=10)
print(f"Login: {r.status_code} {r.text[:300]}")
if r.status_code != 200:
    exit(1)

data = r.json()
token = data.get("access_token") or data.get("token")
user = data.get("user") or data
print(f"Token: {token[:30] if token else 'N/A'}...")
print(f"User: {user.get('full_name', 'N/A') if isinstance(user, dict) else 'N/A'}")

h = {"Authorization": f"Bearer {token}"}

# Dashboard
r = httpx.get(f"{BASE}/dashboard", headers=h, timeout=10)
print(f"Dashboard: {r.status_code}", "OK" if r.status_code == 200 else r.text[:100])

# Categories
r = httpx.get(f"{BASE}/categories", headers=h, timeout=10)
print(f"Categories: {r.status_code}", f"{len(r.json())} items" if r.status_code == 200 else r.text[:100])

# Transactions
r = httpx.get(f"{BASE}/transactions?limit=5", headers=h, timeout=10)
if r.status_code == 200:
    txs = r.json().get("transactions", [])
    print(f"Transactions: 200 ({len(txs)} items)")
else:
    print(f"Transactions: {r.status_code} {r.text[:100]}")

# Goals
r = httpx.get(f"{BASE}/goals", headers=h, timeout=10)
print(f"Goals: {r.status_code}", f"{len(r.json())} items" if r.status_code == 200 else r.text[:100])

# Budgets
r = httpx.get(f"{BASE}/budgets", headers=h, timeout=10)
print(f"Budgets: {r.status_code}", f"{len(r.json())} items" if r.status_code == 200 else r.text[:100])

# Suggest category
r = httpx.get(f"{BASE}/insights/suggest-category", params={"description": "zomato"}, headers=h, timeout=10)
print(f"Suggest: {r.status_code}", r.json() if r.status_code == 200 else r.text[:100])

# Insights all
r = httpx.get(f"{BASE}/insights/all", headers=h, timeout=10)
print(f"Insights/all: {r.status_code}", "OK" if r.status_code == 200 else r.text[:100])

# Trends
r = httpx.get(f"{BASE}/analytics/trends", headers=h, timeout=10)
print(f"Analytics/trends: {r.status_code}", "OK" if r.status_code == 200 else r.text[:100])

# Health
r = httpx.get(f"{BASE}/health", timeout=10)
print(f"Health: {r.status_code}", r.json())

print("\nDone!")
