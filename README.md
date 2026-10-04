# BizPilot AI
Next.js dashboard + FastAPI (5 agents) — one Vercel project.

Layout: app/ components/ lib/ public/ = frontend · api/index.py = Vercel entry · backend/ = FastAPI code.

Local (2 terminals, open http://localhost:3000):
  1) py -m pip install -r requirements.txt   then   npm run api      (FastAPI on :8000, key in backend/.env)
  2) npm install   then   npm run dev

Vercel env vars: LLM_PROVIDER=gemini, GEMINI_API_KEY, GEMINI_MODEL. Never upload .env.
