"""CSV -> compact, trustworthy summary (all numbers computed with Pandas, not by the LLM)."""
import io

import pandas as pd

from app import config


class CSVError(Exception):
    """User-facing CSV problem."""


ALIASES = {
    "date": ["date", "order_date", "order date", "day", "month", "created_at", "timestamp", "sale_date"],
    "product": ["product", "product_name", "product name", "item", "item_name", "category", "sku"],
    "revenue": ["revenue", "sales", "total", "amount", "total_sales", "total_amount", "sales_amount", "income"],
    "quantity": ["quantity", "qty", "units", "units_sold"],
    "price": ["price", "unit_price", "unit price"],
}


def _find(cols, key):
    for alias in ALIASES[key]:
        if alias in cols:
            return alias
    return None


def _to_number(series: pd.Series) -> pd.Series:
    cleaned = series.astype(str).str.replace(r"[^\d.\-]", "", regex=True)
    return pd.to_numeric(cleaned, errors="coerce")


def analyze_csv(data: bytes) -> dict:
    if not data or not data.strip():
        raise CSVError("The CSV file is empty.")
    if len(data) > config.MAX_CSV_BYTES:
        raise CSVError(f"CSV is too large (max {config.MAX_CSV_BYTES // (1024 * 1024)} MB).")

    df = None
    for enc in ("utf-8-sig", "latin-1"):
        try:
            df = pd.read_csv(io.BytesIO(data), encoding=enc)
            break
        except pd.errors.EmptyDataError:
            raise CSVError("The CSV file is empty.")
        except (pd.errors.ParserError, UnicodeDecodeError):
            continue
    if df is None:
        raise CSVError("Could not read this file as CSV. Check that it is a valid comma-separated file.")
    if df.empty:
        raise CSVError("The CSV has headers but no data rows.")
    if len(df) > config.MAX_CSV_ROWS:
        raise CSVError(f"CSV has {len(df):,} rows; the limit is {config.MAX_CSV_ROWS:,}.")

    df.columns = [str(c).strip().lower() for c in df.columns]
    cols = list(df.columns)
    date_c, prod_c = _find(cols, "date"), _find(cols, "product")
    rev_c, qty_c, price_c = _find(cols, "revenue"), _find(cols, "quantity"), _find(cols, "price")

    if rev_c:
        df["_rev"] = _to_number(df[rev_c])
    elif qty_c and price_c:
        df["_rev"] = _to_number(df[qty_c]) * _to_number(df[price_c])
    else:
        raise CSVError(
            "Could not find a revenue column. Add a column named revenue/sales/amount/total "
            f"(or quantity + price). Columns found: {', '.join(cols)}"
        )

    warnings = []
    before = len(df)
    df = df.dropna(subset=["_rev"])
    if df.empty:
        raise CSVError("No valid numeric revenue values found in the CSV.")
    if len(df) < before:
        warnings.append(f"{before - len(df)} row(s) skipped because revenue was not a number.")

    total = float(df["_rev"].sum())
    summary = {
        "rows": int(len(df)),
        "columns_detected": {"date": date_c, "product": prod_c, "revenue": rev_c or "quantity*price"},
        "total_revenue": round(total, 2),
        "monthly_revenue": [],
        "avg_monthly_revenue": None,
        "trend": "unknown",
        "trend_change_percent": None,
        "top_products": [],
        "weak_products": [],
        "warnings": warnings,
    }

    # ---- Monthly trend ----
    if date_c:
        df["_date"] = pd.to_datetime(df[date_c], errors="coerce")
        bad = int(df["_date"].isna().sum())
        dated = df.dropna(subset=["_date"])
        if bad:
            warnings.append(f"{bad} row(s) have an unreadable date and were left out of the trend.")
        if not dated.empty:
            monthly = dated.groupby(dated["_date"].dt.to_period("M").astype(str))["_rev"].sum()
            summary["monthly_revenue"] = [{"month": m, "revenue": round(float(v), 2)} for m, v in monthly.items()]
            summary["avg_monthly_revenue"] = round(float(monthly.mean()), 2)
            if len(monthly) >= 3:
                recent = monthly.iloc[-2:].mean()
                prior = monthly.iloc[max(0, len(monthly) - 5):-2].mean()
                if prior > 0:
                    chg = (recent - prior) / prior * 100
                    summary["trend_change_percent"] = round(float(chg), 1)
                    summary["trend"] = "decreasing" if chg < -5 else "increasing" if chg > 5 else "stable"
                    summary["trend_basis"] = "average of the last 2 months vs average of up to 3 months before them"
            else:
                warnings.append("Fewer than 3 months of data; trend could not be determined reliably.")
    else:
        warnings.append("No date column found; monthly trend unavailable.")

    # ---- Products ----
    if prod_c:
        by_prod = df.groupby(df[prod_c].astype(str).str.strip())["_rev"].sum().sort_values(ascending=False)
        items = [{"product": p, "revenue": round(float(v), 2),
                  "share_percent": round(float(v) / total * 100, 1) if total else 0.0}
                 for p, v in by_prod.items()]
        summary["top_products"] = items[:3]
        summary["weak_products"] = items[-2:][::-1] if len(items) > 4 else []
    else:
        warnings.append("No product column found; product ranking unavailable.")

    return summary
