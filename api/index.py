"""Vercel entry point.

Vercel runs every file in /api as a serverless function. This one simply exposes the
existing FastAPI app (backend/app/main.py) so that /api/* is served by the same
deployment as the Next.js frontend. No backend code is duplicated.
"""
import sys
from pathlib import Path

# make `import app...` resolve to backend/app
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend"))

from app.main import app  # noqa: E402,F401  (Vercel looks for a variable named `app`)
