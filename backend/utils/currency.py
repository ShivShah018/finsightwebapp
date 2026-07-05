"""
Currency conversion & formatting for FinSight.
Fetches live exchange rates from open.er-api.com with 1-hour cache.
"""

import json
import logging
import urllib.request
from datetime import datetime, timedelta

logger = logging.getLogger("finsight.currency")

RATES = {}
LAST_FETCH = None
CACHE_DURATION = timedelta(hours=1)

HARDCODED_RATES = {
    "INR": 1.0,
    "USD": 0.012,
    "NPR": 1.60,
}

SYMBOLS = {
    "INR": "\u20B9",
    "USD": "$",
    "NPR": "\u0930\u0941",
}

PLAIN = {
    "INR": "Rs.",
    "USD": "$",
    "NPR": "Rs.",
}

CURRENCY_NAMES = ["INR", "USD", "NPR"]


def get_rates() -> dict:
    global RATES, LAST_FETCH
    now = datetime.utcnow()
    if LAST_FETCH and now - LAST_FETCH < CACHE_DURATION and RATES:
        return RATES
    try:
        req = urllib.request.Request(
            "https://open.er-api.com/v6/latest/INR",
            headers={"User-Agent": "FinSight/2.0"},
        )
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode())
        rates = {"INR": 1.0}
        for cur in CURRENCY_NAMES:
            if cur != "INR" and cur in data.get("rates", {}):
                rates[cur] = data["rates"][cur]
        RATES = rates
        LAST_FETCH = now
        logger.info("Exchange rates updated from live API")
    except Exception:
        logger.warning("Failed to fetch live rates, using hardcoded fallback")
        RATES = HARDCODED_RATES.copy()
        LAST_FETCH = now
    return RATES


def _to_float(val) -> float:
    return float(val)


def convert_to_inr(amount, from_currency: str) -> float:
    amount = _to_float(amount)
    if not from_currency or from_currency == "INR":
        return round(amount, 2)
    rates = get_rates()
    rate_to_inr = 1.0 / rates.get(from_currency, 1.0)
    return round(amount * rate_to_inr, 2)


def convert(amount_inr, to_currency: str) -> float:
    amount_inr = _to_float(amount_inr)
    rates = get_rates()
    rate = rates.get(to_currency, 1.0)
    return round(amount_inr * rate, 2)


def format_amount(amount_inr, currency: str, plain: bool = False) -> str:
    converted = convert(amount_inr, currency)
    sym = PLAIN.get(currency, currency) if plain else SYMBOLS.get(currency, currency)
    return f"{sym}{converted:,.2f}"


def get_conversion_note(from_cur: str, to_cur: str) -> str:
    one_converted = convert(1.0, to_cur)
    return f"1 {from_cur} \u2248 {one_converted:.4f} {to_cur}"
