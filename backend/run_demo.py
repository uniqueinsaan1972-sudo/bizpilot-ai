"""Run the full pipeline from the terminal (no frontend needed).
Usage:  python run_demo.py            -> ABC Clothing demo with the sample CSV
        python run_demo.py --no-csv   -> form data only
"""
import json
import sys

from app.orchestrator.pipeline import run_pipeline
from app.schemas import BusinessInput

demo = BusinessInput(
    business_name="ABC Clothing", industry="Fashion", products="Hoodies, Jeans, T-Shirts, Jackets, Sneakers, Accessories",
    target_audience="Young adults", monthly_revenue=500000, monthly_expenses=320000,
    problem="Sales have decreased during the last two months.", goal="Increase monthly sales.")

csv_bytes = None if "--no-csv" in sys.argv else open("sample_data/abc_clothing_sales.csv", "rb").read()

for ev in run_pipeline(demo, csv_bytes):
    t = ev["type"]
    if t == "agent_start":
        print(f"○ {ev['agent']} running...")
    elif t == "agent_complete":
        print(f"✓ {ev['agent']} completed in {ev['duration_seconds']}s")
    elif t == "csv_processed":
        print(f"✓ CSV processed: {ev['summary']['rows']} rows, trend={ev['summary']['trend']}")
    elif t == "error":
        print(f"✗ ERROR [{ev['stage']}]: {ev['message']}")
        sys.exit(1)
    elif t == "final":
        json.dump(ev["result"], open("demo_result.json", "w"), indent=2)
        r = ev["result"]["report"]
        print("\nEXECUTIVE SUMMARY:\n" + r["executive_summary"])
        print("\nFull result saved to demo_result.json")
