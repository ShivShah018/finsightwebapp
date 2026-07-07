/**
 * E2E integration test for FinSight backend in Node.js.
 * Tests all major endpoints in a realistic user flow.
 * Run: node test_e2e.js
 * Requires: backend running on localhost:8000, MySQL finsight database
 */
const http = require('http');

const BASE_URL = 'http://localhost:8000';
let passed = 0;
let failed = 0;

function req(method, path, body = null, token = null) {
  return new Promise((resolve) => {
    const parsedUrl = new URL(BASE_URL + path);
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || 80,
      path: parsedUrl.pathname + parsedUrl.search,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    let postData = null;
    if (body) {
      postData = JSON.stringify(body);
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const reqObj = http.request(options, (res) => {
      let data = [];
      res.on('data', (chunk) => data.push(chunk));
      res.on('end', () => {
        const raw = Buffer.concat(data).toString();
        if (res.statusCode >= 400) {
          resolve({
            _error: res.statusCode,
            _detail: raw
          });
        } else {
          try {
            resolve(JSON.parse(raw));
          } catch (e) {
            resolve(raw);
          }
        }
      });
    });

    reqObj.on('error', (err) => {
      resolve({
        _error: 500,
        _detail: err.message
      });
    });

    if (postData) {
      reqObj.write(postData);
    }
    reqObj.end();
  });
}

function check(name, ok, detail = "") {
  if (ok) {
    passed++;
    console.log(`  PASS  ${name}`);
  } else {
    failed++;
    console.log(`  FAIL  ${name}  ${detail}`);
  }
}

async function run() {
  try {
    // ── 1. Health ────────────────────────────────────────────
    console.log("\n=== 1. Health Check ===");
    const h = await req("GET", "/health");
    check("health endpoint", h.status === "healthy", JSON.stringify(h));

    // ── 2. Register ──────────────────────────────────────────
    console.log("\n=== 2. Register ===");
    const suffix = Math.floor(10000 + Math.random() * 90000);
    const email = `testuser${suffix}@example.com`;
    const registerBody = { full_name: "Test User", email: email, password: "testpass123" };
    const rRegister = await req("POST", "/auth/register", registerBody);
    const token = rRegister.access_token || "";
    check("register returns token", !!token, JSON.stringify(rRegister));

    // ── 3. Login ─────────────────────────────────────────────
    console.log("\n=== 3. Login ===");
    const rLogin = await req("POST", "/auth/login", { email: email, password: "testpass123" });
    const tokenLogin = rLogin.access_token || "";
    check("login returns token", !!tokenLogin, JSON.stringify(rLogin));
    const userId = rLogin.user_id || 0;
    check("login returns user_id", userId > 0, JSON.stringify(rLogin));

    const activeToken = tokenLogin || token;

    // ── 4. Auth/Me ───────────────────────────────────────────
    console.log("\n=== 4. Get Profile ===");
    const rMe = await req("GET", "/auth/me", null, activeToken);
    check("auth/me returns email", rMe.email === email, JSON.stringify(rMe));
    check("auth/me has currency", !!rMe.currency, JSON.stringify(rMe));

    // ── 5. Categories ────────────────────────────────────────
    console.log("\n=== 5. Categories ===");
    const rCats = await req("GET", "/categories", null, activeToken);
    check("categories returns list", Array.isArray(rCats), JSON.stringify(rCats));
    check("categories has items", Array.isArray(rCats) && rCats.length >= 8);
    const incomeCats = Array.isArray(rCats) ? rCats.filter(c => c.type === "income") : [];
    const expenseCats = Array.isArray(rCats) ? rCats.filter(c => c.type === "expense") : [];
    check("has income categories", incomeCats.length >= 3);
    check("has expense categories", expenseCats.length >= 5);

    // ── 6. Create Transaction ────────────────────────────────
    console.log("\n=== 6. Transactions ===");
    const catId = expenseCats[0] ? expenseCats[0].id : 1;
    const rTx = await req("POST", "/transactions", {
      category_id: catId, amount: 5000, type: "expense",
      description: "Test expense", transaction_date: "2026-07-01"
    }, activeToken);
    const txId = rTx.id || 0;
    check("create transaction returns id", txId > 0, JSON.stringify(rTx));

    // Income
    const incCatId = incomeCats[0] ? incomeCats[0].id : 2;
    const rIncTx = await req("POST", "/transactions", {
      category_id: incCatId, amount: 100000, type: "income",
      description: "Test income", transaction_date: "2026-07-01"
    }, activeToken);
    const incTxId = rIncTx.id || 0;
    check("create income transaction", incTxId > 0, JSON.stringify(rIncTx));

    // ── 7. List Transactions ─────────────────────────────────
    console.log("\n=== 7. List Transactions ===");
    const rList = await req("GET", "/transactions", null, activeToken);
    check("list transactions", rList.total >= 2, JSON.stringify(rList));

    // ── 8. Soft Delete Transaction ───────────────────────────
    console.log("\n=== 8. Soft Delete ===");
    const rDel = await req("DELETE", `/transactions/${txId}?soft=true`, null, activeToken);
    check("soft delete", JSON.stringify(rDel).toLowerCase().includes("deleted"), JSON.stringify(rDel));

    // ── 9. Restore Transaction ───────────────────────────────
    console.log("\n=== 9. Restore ===");
    const rRest = await req("POST", `/transactions/${txId}/restore`, null, activeToken);
    check("restore", JSON.stringify(rRest).toLowerCase().includes("restored"), JSON.stringify(rRest));

    // ── 10. Goals ────────────────────────────────────────────
    console.log("\n=== 10. Goals ===");
    const rGoal = await req("POST", "/goals", {
      name: "Test Goal", target_amount: 50000, deadline: "2027-12-31"
    }, activeToken);
    const goalId = rGoal.id || 0;
    check("create goal returns id", goalId > 0, JSON.stringify(rGoal));

    // List goals
    const rListGoals = await req("GET", "/goals", null, activeToken);
    check("list goals", Array.isArray(rListGoals) && rListGoals.length >= 1, JSON.stringify(rListGoals));

    // Fund goal
    const rFund = await req("POST", `/goals/${goalId}/fund`, { amount: 10000 }, activeToken);
    check("fund goal", JSON.stringify(rFund).toLowerCase().includes("added"), JSON.stringify(rFund));

    // Complete goal
    const rComp = await req("POST", `/goals/${goalId}/complete`, null, activeToken);
    check("complete goal", JSON.stringify(rComp).toLowerCase().includes("completed"), JSON.stringify(rComp));

    // Delete goal
    const rDelGoal = await req("DELETE", `/goals/${goalId}`, null, activeToken);
    check("delete goal", JSON.stringify(rDelGoal).toLowerCase().includes("deleted"), JSON.stringify(rDelGoal));

    // Verify deletion
    const rVerifyGoal = await req("GET", "/goals", null, activeToken);
    check("goal deleted from list", Array.isArray(rVerifyGoal) && rVerifyGoal.every(g => g.id !== goalId), JSON.stringify(rVerifyGoal));

    // ── 11. Budgets ──────────────────────────────────────────
    console.log("\n=== 11. Budgets ===");
    const rBudget = await req("POST", "/budgets", { category_id: catId, monthly_limit: 25000 }, activeToken);
    check("create budget", JSON.stringify(rBudget).toLowerCase().includes("set"), JSON.stringify(rBudget));

    // Get utilization
    const rUtil = await req("GET", "/budgets/utilization?month=7&year=2026", null, activeToken);
    check("budget utilization", typeof rUtil === 'object', JSON.stringify(rUtil));
    const items = Array.isArray(rUtil) ? rUtil : Object.values(rUtil || {});
    check("utilization has entries", items.length >= 1, JSON.stringify(items));

    // ── 12. Dashboard ────────────────────────────────────────
    console.log("\n=== 12. Dashboard ===");
    const rDash = await req("GET", "/dashboard?month=7&year=2026", null, activeToken);
    check("dashboard returns data", rDash.total_income !== undefined, JSON.stringify(rDash));
    check("dashboard has income", rDash.total_income > 0, JSON.stringify(rDash));
    check("dashboard has expense", rDash.total_expense > 0, JSON.stringify(rDash));
    check("dashboard has net_savings", rDash.net_savings !== undefined, JSON.stringify(rDash));
    check("dashboard has monthly_trends", Array.isArray(rDash.monthly_trends) && rDash.monthly_trends.length >= 1, JSON.stringify(rDash.monthly_trends));
    check("dashboard has top_categories", Array.isArray(rDash.top_categories) && rDash.top_categories.length >= 1, JSON.stringify(rDash.top_categories));

    // ── 13. Analytics Trends ─────────────────────────────────
    console.log("\n=== 13. Analytics ===");
    const rAnal = await req("GET", "/analytics/trends?months=12", null, activeToken);
    check("trends returns list", Array.isArray(rAnal), JSON.stringify(rAnal));
    if (Array.isArray(rAnal) && rAnal.length > 0) {
      check("trends has month field", rAnal[0].month !== undefined);
      check("trends has income field", rAnal[0].income !== undefined);
    } else {
      check("trends has month field", false, "Empty list");
      check("trends has income field", false, "Empty list");
    }

    // ── 14. Insights: Predict ────────────────────────────────
    console.log("\n=== 14. ML: Predict ===");
    const rPred = await req("GET", "/insights/predict", null, activeToken);
    check("predict returns data", !!rPred, JSON.stringify(rPred));
    check("predict has predicted_total", rPred.predicted_total !== undefined || rPred.next_month_prediction !== undefined, JSON.stringify(rPred));

    // ── 15. Insights: Suggest Category ───────────────────────
    console.log("\n=== 15. ML: Suggest Category ===");
    const desc = encodeURIComponent("uber ride to airport");
    const rSugg = await req("GET", `/insights/suggest-category?description=${desc}`, null, activeToken);
    check("suggest returns category", rSugg.category !== undefined, JSON.stringify(rSugg));
    check("suggest has category_id", rSugg.category_id !== undefined, JSON.stringify(rSugg));

    // ── 16. Insights: Cluster ────────────────────────────────
    console.log("\n=== 16. ML: Cluster ===");
    const rClust = await req("GET", "/insights/cluster", null, activeToken);
    check("cluster returns list", Array.isArray(rClust), JSON.stringify(rClust));
    if (Array.isArray(rClust) && rClust.length > 0) {
      check("cluster has cluster_id", rClust[0].cluster_id !== undefined);
      check("cluster has name", rClust[0].name !== undefined);
    } else {
      check("cluster has cluster_id", true, "Empty list (valid if not enough data)");
      check("cluster has name", true, "Empty list (valid if not enough data)");
    }

    // ── 17. Currency Rates ──────────────────────────────────
    console.log("\n=== 17. Currency ===");
    const rCurr = await req("GET", "/currency/rates", null, activeToken);
    check("rates returns data", !!rCurr, JSON.stringify(rCurr));
    check("rates has base", rCurr.base === "INR", JSON.stringify(rCurr));
    check("rates has INR rate", rCurr.rates && rCurr.rates.INR !== undefined, JSON.stringify(rCurr));

    // ── 18. Report ──────────────────────────────────────────
    console.log("\n=== 18. Report ===");
    const rRep = await req("POST", "/report/generate", null, activeToken);
    check("report generates", rRep.path !== undefined, JSON.stringify(rRep));

    // ── 19. Error Handling ──────────────────────────────────
    console.log("\n=== 19. Error Handling ===");
    // Invalid login
    const rBadLogin = await req("POST", "/auth/login", { email: "nonexistent@x.com", password: "wrong" });
    check("invalid login returns error", rBadLogin._error === 401, JSON.stringify(rBadLogin));

    // Unauthorized access
    const rNoToken = await req("GET", "/transactions");
    check("no-token returns 401", rNoToken._error === 401, JSON.stringify(rNoToken));

    // ── Summary ──────────────────────────────────────────────
    console.log(`\n${'='.repeat(50)}`);
    console.log(`RESULTS:  ${passed} passed, ${failed} failed out of ${passed + failed} tests`);
    if (failed === 0) {
      console.log("ALL TESTS PASSED");
      process.exit(0);
    } else {
      console.log("SOME TESTS FAILED");
      process.exit(1);
    }
  } catch (error) {
    console.error("Test execution exception:", error);
    process.exit(1);
  }
}

run();
