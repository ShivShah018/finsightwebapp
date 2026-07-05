"""AI/ML insights, predictions, and smart tips."""
import re
import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
from collections import defaultdict


def train_spending_model(transactions):
    """
    Predict next month's spending using linear regression.
    Returns dict with predicted_total, trend, confidence.
    """
    if len(transactions) < 3:
        return {"predicted_total": 0, "trend": "insufficient_data", "confidence": 0}

    expenses = [t for t in transactions if t.type == "expense"]
    if len(expenses) < 3:
        return {"predicted_total": 0, "trend": "insufficient_data", "confidence": 0}

    monthly = defaultdict(float)
    for t in expenses:
        key = t.transaction_date.strftime("%Y-%m")
        monthly[key] += t.amount

    if len(monthly) < 2:
        return {"predicted_total": 0, "trend": "insufficient_data", "confidence": 0}

    sorted_months = sorted(monthly.keys())
    X = np.arange(len(sorted_months)).reshape(-1, 1)
    y = np.array([monthly[m] for m in sorted_months])

    model = LinearRegression()
    model.fit(X, y)
    predicted = float(model.predict([[len(sorted_months)]])[0])

    slope = model.coef_[0]
    mean_y = np.mean(y)
    if mean_y == 0:
        trend = "stable"
    elif slope > 0.05 * mean_y:
        trend = "rising"
    elif slope < -0.05 * mean_y:
        trend = "falling"
    else:
        trend = "stable"

    return {
        "predicted_total": round(float(predicted), 2),
        "trend": trend,
        "confidence": round(float(max(0, model.score(X, y))), 2),
        "slope": round(float(slope), 2),
    }


def suggest_category(description, categories):
    """
    Suggest a category by keyword matching.
    Counts how many keywords per category appear in the description,
    returns the best match with a confidence score.
    """
    if not description or not categories:
        return None

    desc_lower = description.lower()

    keyword_map = {
        "Food & Dining": ["food", "restaurant", "pizza", "lunch", "dinner", "breakfast",
                          "grocery", "groceries", "snack", "cafe", "coffee", "zomato", "swiggy",
                          "hungry", "eat", "eating", "dine", "dining", "meal", "takeaway",
                          "delivery", "order", "tea", "juice", "shake", "bakery", "beverage"],
        "Rent": ["rent", "lease", "apartment"],
        "Transport": ["uber", "ola", "cab", "taxi", "fuel", "petrol", "diesel", "metro",
                      "bus", "train", "auto", "parking", "toll"],
        "Utilities": ["electricity", "water", "gas", "bill", "broadband", "wifi",
                      "internet", "phone", "mobile", "recharge"],
        "Entertainment": ["movie", "netflix", "prime", "hotstar", "concert", "game",
                          "sport", "spotify", "youtube"],
        "Healthcare": ["doctor", "hospital", "clinic", "medicine", "pharmacy", "dental",
                       "health", "insurance", "checkup"],
        "Shopping": ["amazon", "flipkart", "myntra", "cloth", "shoe", "electronics",
                     "amazon pay", "shopping", "mall"],
        "Education": ["course", "udemy", "coursera", "book", "college", "fee",
                      "tuition", "exam"],
        "Salary": ["salary", "payroll", "wage"],
        "Freelance": ["freelance", "contract", "gig", "upwork", "fiverr"],
        "Investments": ["investment", "mutual fund", "stock", "dividend", "interest"],
    }

    # Score each category by keyword match count
    scores = {}
    for c in categories:
        kws = keyword_map.get(c.name, [])
        if not kws:
            continue
        matches = sum(1 for kw in kws if re.search(r'\b' + re.escape(kw) + r'\b', desc_lower))
        if matches:
            scores[c.name] = (matches, c)

    if not scores:
        return None

    total_matches = sum(v[0] for v in scores.values())
    best_name = max(scores, key=lambda n: scores[n][0])
    best_cat = scores[best_name][1]
    confidence = scores[best_name][0] / total_matches if total_matches else 1.0
    return (best_cat, round(confidence, 2))


def cluster_transactions(transactions, n_clusters=3):
    """
    Cluster expense transactions using K-Means.
    Features: amount (scaled), day_of_month, day_of_week, is_weekend.
    Returns list of SpendingCluster data.
    """
    expenses = [t for t in transactions if t.type == "expense"]
    if len(expenses) < n_clusters:
        return []

    features = []
    for t in expenses:
        d = t.transaction_date
        features.append([t.amount, d.day, d.weekday(), 1 if d.weekday() >= 5 else 0])
    X = np.array(features)

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    model = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
    labels = model.fit_predict(X_scaled)

    clusters = {}
    for i, label in enumerate(labels):
        label = int(label)
        if label not in clusters:
            clusters[label] = {"total": 0, "count": 0, "amounts": [], "categories": set()}
        tx = expenses[i]
        clusters[label]["total"] += tx.amount
        clusters[label]["count"] += 1
        clusters[label]["amounts"].append(tx.amount)
        if tx.category_name:
            clusters[label]["categories"].add(tx.category_name)

    sorted_clusters = sorted(clusters.items(), key=lambda x: x[1]["total"], reverse=True)

    cluster_names = {
        0: "High Spends",
        1: "Everyday Essentials",
        2: "Occasional",
    }

    results = []
    for rank, (orig_label, data) in enumerate(sorted_clusters):
        avg = data["total"] / data["count"]
        label_name = cluster_names.get(rank, f"Cluster {rank + 1}")
        results.append({
            "cluster_id": rank,
            "name": label_name,
            "count": data["count"],
            "avg_amount": round(avg, 2),
            "total_amount": round(data["total"], 2),
            "categories": sorted(list(data["categories"])),
        })

    return results



