// Same-origin: the browser calls /api/... on whatever domain is open.
// Locally Next.js proxies /api to FastAPI (port 8000); on Vercel it goes to the Python function.
const API_URL = "";

/** POSTs the form (+ optional CSV) and calls onEvent for every real server-sent pipeline event. */
export async function streamAnalysis(form, csvFile, onEvent, signal) {
  const fd = new FormData();
  Object.entries(form).forEach(([k, v]) => fd.append(k, String(v).trim()));
  if (csvFile) fd.append("csv_file", csvFile);

  let res;
  try {
    res = await fetch(`${API_URL}/api/analyze/stream`, { method: "POST", body: fd, signal });
  } catch (e) {
    if (e.name === "AbortError") throw e;
    throw new Error("Cannot reach the server. If you are running locally, start the FastAPI backend on port 8000.");
  }
  if (!res.ok) {
    let msg = `Request failed (${res.status})`;
    try { msg = (await res.json()).detail?.message || msg; } catch {}
    throw new Error(msg);
  }

  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    let i;
    while ((i = buf.indexOf("\n\n")) !== -1) {
      const chunk = buf.slice(0, i);
      buf = buf.slice(i + 2);
      const line = chunk.split("\n").find((l) => l.startsWith("data: "));
      if (line) onEvent(JSON.parse(line.slice(6)));
    }
  }
}
