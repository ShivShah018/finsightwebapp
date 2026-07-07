"""
FinSight Python ML Subprocess Service
Only contains Linear Regression and K-Means Clustering.
Receives JSON from stdin and outputs JSON to stdout.
"""
import sys
import json
import numpy as np
from datetime import datetime
from collections import defaultdict
from sklearn.linear_model import LinearRegression
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler

class Transaction:
    def __init__(self, data):
        self.type = data.get("type", "expense")
        self.amount = float(data.get("amount", 0.0))
        self.category_name = data.get("category_name")
        
        date_str = data.get("transaction_date")
        if isinstance(date_str, str):
            # Parse '2026-07-01' or isoformat date
            self.transaction_date = datetime.strptime(date_str.split("T")[0], "%Y-%m-%d").date()
        else:
            self.transaction_date = date_str

def train_spending_model(transactions):
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

def cluster_transactions(transactions, n_clusters=3):
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

def main():
    try:
        # Read request data from stdin
        input_data = sys.stdin.read()
        if not input_data:
            print(json.dumps({"error": "No input received"}))
            return
        
        req = json.loads(input_data)
        mode = req.get("mode")
        raw_txs = req.get("transactions", [])
        
        transactions = [Transaction(t) for t in raw_txs]
        
        if mode == "predict":
            result = train_spending_model(transactions)
        elif mode == "cluster":
            result = cluster_transactions(transactions)
        else:
            result = {"error": f"Invalid mode: {mode}"}
            
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({"error": str(e)}))

if __name__ == "__main__":
    main()
