"""Regenerates sample_data/abc_clothing_sales.csv (6 months, sales drop in Aug-Sep)."""
import csv, random
random.seed(7)
products = {"Hoodies": (3500, 14), "Jeans": (4200, 12), "T-Shirts": (1500, 20),
            "Jackets": (7500, 6), "Sneakers": (6500, 7), "Accessories": (800, 9)}
months = [(4, 1.00), (5, 1.05), (6, 1.08), (7, 1.02), (8, 0.80), (9, 0.70)]
rows = []
for m, f in months:
    for p, (price, base) in products.items():
        decay = f * (0.85 if p in ("Sneakers", "Jackets") and m >= 8 else 1)
        for _ in range(max(1, round(base * decay * 1.15))):
            q = random.randint(1, 3)
            rows.append((f"2026-{m:02d}-{random.randint(1, 28):02d}", p, q, price, q * price))
rows.sort()
with open("sample_data/abc_clothing_sales.csv", "w", newline="") as f:
    w = csv.writer(f)
    w.writerow(["date", "product", "quantity", "unit_price", "revenue"])
    w.writerows(rows)
print(len(rows), "rows written")
