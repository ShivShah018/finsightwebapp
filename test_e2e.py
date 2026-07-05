"""
E2E integration test for FinSight backend.
Tests all major endpoints in a realistic user flow.
Run: python test_e2e.py
Requires: backend running on localhost:8000, MySQL finsight database
"""
import urllib.request, urllib.error, json, sys, time

BASE = "http://localhost:8000"
passed = 0
failed = 0

def req(method, path, body=None, token=None):
    url = f"{BASE}{path}"
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    data = json.dumps(body).encode() if body else None
    r = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        resp = urllib.request.urlopen(r, timeout=10)
        return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        return {"_error": e.code, "_detail": e.read().decode()}

def check(name, ok, detail=""):
    global passed, failed
    if ok:
        passed += 1
        print(f"  PASS  {name}")
    else:
        failed += 1
        print(f"  FAIL  {name}  {detail}")

# ── 1. Health ────────────────────────────────────────────
print("\n=== 1. Health Check ===")
h = req("GET", "/health")
check("health endpoint", h.get("status") == "healthy", str(h))

# ── 2. Register ──────────────────────────────────────────
print("\n=== 2. Register ===")
import random
suffix = random.randint(10000, 99999)
email = f"testuser{suffix}@example.com"
register_body = {"full_name": "Test User", "email": email, "password": "testpass123"}
r = req("POST", "/auth/register", register_body)
token = r.get("access_token", "")
check("register returns token", bool(token), str(r))

# ── 3. Login ─────────────────────────────────────────────
print("\n=== 3. Login ===")
r = req("POST", "/auth/login", {"email": email, "password": "testpass123"})
token = r.get("access_token", "")
check("login returns token", bool(token), str(r))
user_id = r.get("user_id", 0)
check("login returns user_id", user_id > 0)

# ── 4. Auth/Me ───────────────────────────────────────────
print("\n=== 4. Get Profile ===")
r = req("GET", "/auth/me", token=token)
check("auth/me returns email", r.get("email") == email, str(r))
check("auth/me has currency", bool(r.get("currency")))

# ── 5. Categories ────────────────────────────────────────
print("\n=== 5. Categories ===")
r = req("GET", "/categories", token=token)
check("categories returns list", isinstance(r, list), str(r))
check("categories has items", len(r) >= 8)
income_cats = [c for c in r if c["type"] == "income"]
expense_cats = [c for c in r if c["type"] == "expense"]
check("has income categories", len(income_cats) >= 3)
check("has expense categories", len(expense_cats) >= 5)

# ── 6. Create Transaction ────────────────────────────────
print("\n=== 6. Transactions ===")
cat_id = expense_cats[0]["id"]
r = req("POST", "/transactions", {
    "category_id": cat_id, "amount": 5000, "type": "expense",
    "description": "Test expense", "transaction_date": "2026-07-01"
}, token=token)
tx_id = r.get("id", 0)
check("create transaction returns id", tx_id > 0, str(r))

# Income
inc_cat_id = income_cats[0]["id"]
r = req("POST", "/transactions", {
    "category_id": inc_cat_id, "amount": 100000, "type": "income",
    "description": "Test income", "transaction_date": "2026-07-01"
}, token=token)
inc_tx_id = r.get("id", 0)
check("create income transaction", inc_tx_id > 0)

# ── 7. List Transactions ─────────────────────────────────
print("\n=== 7. List Transactions ===")
r = req("GET", "/transactions", token=token)
check("list transactions", r.get("total", 0) >= 2, str(r))

# ── 8. Soft Delete Transaction ───────────────────────────
print("\n=== 8. Soft Delete ===")
r = req("DELETE", f"/transactions/{tx_id}?soft=true", token=token)
check("soft delete", "deleted" in str(r).lower(), str(r))

# ── 9. Restore Transaction ───────────────────────────────
print("\n=== 9. Restore ===")
r = req("POST", f"/transactions/{tx_id}/restore", token=token)
check("restore", "restored" in str(r).lower(), str(r))

# ── 10. Goals ────────────────────────────────────────────
print("\n=== 10. Goals ===")
r = req("POST", "/goals", {
    "name": "Test Goal", "target_amount": 50000, "deadline": "2027-12-31"
}, token=token)
goal_id = r.get("id", 0)
check("create goal returns id", goal_id > 0, str(r))

# List goals
r = req("GET", "/goals", token=token)
check("list goals", len(r) >= 1, str(r))

# Fund goal
r = req("POST", f"/goals/{goal_id}/fund", {"amount": 10000}, token=token)
check("fund goal", "added" in str(r).lower(), str(r))

# Complete goal
r = req("POST", f"/goals/{goal_id}/complete", token=token)
check("complete goal", "completed" in str(r).lower(), str(r))

# Delete goal
r = req("DELETE", f"/goals/{goal_id}", token=token)
check("delete goal", "deleted" in str(r).lower(), str(r))

# Verify deletion
r = req("GET", "/goals", token=token)
check("goal deleted from list", all(g["id"] != goal_id for g in r))

# ── 11. Budgets ──────────────────────────────────────────
print("\n=== 11. Budgets ===")
r = req("POST", "/budgets", {"category_id": cat_id, "monthly_limit": 25000}, token=token)
check("create budget", "set" in str(r).lower(), str(r))

# Get utilization
import urllib.parse
r = req("GET", f"/budgets/utilization?month=7&year=2026", token=token)
check("budget utilization", isinstance(r, (list, dict)), str(r))
if isinstance(r, (list, dict)):
    items = r if isinstance(r, list) else list(r.values())
    check("utilization has entries", len(items) >= 1)

# ── 12. Dashboard ────────────────────────────────────────
print("\n=== 12. Dashboard ===")
r = req("GET", "/dashboard?month=7&year=2026", token=token)
check("dashboard returns data", bool(r.get("total_income") is not None), str(r))
check("dashboard has income", r.get("total_income", 0) > 0)
check("dashboard has expense", r.get("total_expense", 0) > 0)
check("dashboard has net_savings", r.get("net_savings") is not None)
check("dashboard has monthly_trends", len(r.get("monthly_trends", [])) >= 1)
check("dashboard has top_categories", len(r.get("top_categories", [])) >= 1)

# ── 13. Analytics Trends ─────────────────────────────────
print("\n=== 13. Analytics ===")
r = req("GET", "/analytics/trends?months=12", token=token)
check("trends returns list", isinstance(r, list), str(r))
if isinstance(r, list) and len(r) > 0:
    check("trends has month field", "month" in r[0])
    check("trends has income field", "income" in r[0])

# ── 14. Insights: Predict ────────────────────────────────
print("\n=== 14. ML: Predict ===")
r = req("GET", "/insights/predict", token=token)
check("predict returns data", bool(r), str(r))
check("predict has predicted_total", r.get("predicted_total") is not None)

# ── 15. Insights: Suggest Category ───────────────────────
print("\n=== 15. ML: Suggest Category ===")
desc = urllib.parse.quote("uber ride to airport")
r = req("GET", f"/insights/suggest-category?description={desc}", token=token)
check("suggest returns category", r.get("category") is not None, str(r))
check("suggest has category_id", r.get("category_id") is not None)

# ── 16. Insights: Cluster ────────────────────────────────
print("\n=== 16. ML: Cluster ===")
r = req("GET", "/insights/cluster", token=token)
check("cluster returns list", isinstance(r, list), str(r))
if isinstance(r, list) and len(r) > 0:
    check("cluster has cluster_id", "cluster_id" in r[0])
    check("cluster has name", "name" in r[0])

# ── 17. Currency Rates ──────────────────────────────────
print("\n=== 17. Currency ===")
r = req("GET", "/currency/rates", token=token)
check("rates returns data", bool(r), str(r))
check("rates has base", r.get("base") == "INR")
check("rates has INR rate", "INR" in r.get("rates", {}))

# ── 18. Report ──────────────────────────────────────────
print("\n=== 18. Report ===")
r = req("POST", "/report/generate", token=token)
check("report generates", r.get("path") is not None, str(r))

# ── 19. Error Handling ──────────────────────────────────
print("\n=== 19. Error Handling ===")
# Invalid login
r = req("POST", "/auth/login", {"email": "nonexistent@x.com", "password": "wrong"})
check("invalid login returns error", "_error" in r and r["_error"] == 401, str(r))

# Unauthorized access
r = req("GET", "/transactions")
check("no-token returns 401", "_error" in r and r["_error"] == 401, str(r))

# ── Summary ──────────────────────────────────────────────
print(f"\n{'='*50}")
print(f"RESULTS:  {passed} passed, {failed} failed out of {passed+failed} tests")
if failed == 0:
    print("ALL TESTS PASSED")
else:
    print(f"SOME TESTS FAILED")
    sys.exit(1)
